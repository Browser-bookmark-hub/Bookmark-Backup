// dev_1/record_worker.js
importScripts('./mp4-muxer.js');

let encoder = null;
let muxer = null;
let reader = null;
let isRecording = false;

self.onmessage = async (e) => {
  const { type, data } = e.data;

  if (type === 'start') {
    const { readable, width, height, bitrate, frameRate, codecProfile, rect } = data;
    startRecording(readable, width, height, bitrate, frameRate, codecProfile, rect);
  } else if (type === 'stop') {
    stopRecording();
  }
};

async function startRecording(readable, width, height, bitrate, frameRate, codecProfile, rect) {
  isRecording = true;

  try {
    if (!isRecording) {
      self.postMessage({ type: 'error', error: 'Recording aborted' });
      cleanup();
      return;
    }

    // 1. Initialize MP4 Muxer
    const isAV1 = codecProfile.startsWith('av01');
    const isHEVC = codecProfile.startsWith('hvc1');
    let muxerCodec = 'avc';
    if (isAV1) {
      muxerCodec = 'av1';
    } else if (isHEVC) {
      muxerCodec = 'hevc';
    }

    muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: {
        codec: muxerCodec,
        width: width,
        height: height
      },
      firstTimestampBehavior: 'offset',
      fastStart: 'in-memory'
    });

    if (!isRecording) {
      if (muxer) {
        try { muxer.finalize(); } catch (_) {}
      }
      self.postMessage({ type: 'error', error: 'Recording aborted' });
      cleanup();
      return;
    }

    // 2. Initialize VideoEncoder
    encoder = new VideoEncoder({
      output: (chunk, meta) => {
        if (muxer) {
          muxer.addVideoChunk(chunk, meta);
        }
      },
      error: (e) => {
        console.error('VideoEncoder in worker error:', e);
        self.postMessage({ type: 'error', error: e.message || String(e) });
        stopRecording();
      }
    });

    const encoderConfig = {
      codec: codecProfile,
      width: width,
      height: height,
      bitrate: bitrate,
      framerate: frameRate,
      latencyMode: 'quality',
      hardwareAcceleration: 'no-preference'
    };
    if (codecProfile.startsWith('avc1')) {
      encoderConfig.avc = { format: 'avc' };
    }
    encoder.configure(encoderConfig);

    if (!isRecording) {
      if (encoder) {
        try { await encoder.flush(); } catch (_) {}
      }
      if (muxer) {
        try { muxer.finalize(); } catch (_) {}
      }
      self.postMessage({ type: 'error', error: 'Recording aborted' });
      cleanup();
      return;
    }

    // 3. Set up reader from the transferred ReadableStream
    reader = readable.getReader();

    let frameCount = 0;

    while (isRecording) {
      const { done, value: frame } = await reader.read();
      if (done) {
        break;
      }
      if (!isRecording) {
        if (frame) frame.close();
        break;
      }

      // GPU-level zero-copy cropping
      let croppedFrame;
      try {
        const frameW = frame.codedWidth || frame.displayWidth;
        const frameH = frame.codedHeight || frame.displayHeight;

        // Dynamic clamp cropping coordinates to prevent VideoFrame constructor from throwing TypeError
        const x = Math.max(0, Math.min(rect.x, frameW - 2));
        const y = Math.max(0, Math.min(rect.y, frameH - 2));
        const w = Math.max(2, Math.min(rect.width, frameW - x));
        const h = Math.max(2, Math.min(rect.height, frameH - y));

        // Ensure width and height are even numbers (YUV 4:2:0 format compatibility)
        const evenW = Math.floor(w / 2) * 2;
        const evenH = Math.floor(h / 2) * 2;

        croppedFrame = new VideoFrame(frame, {
          visibleRect: {
            x: x,
            y: y,
            width: Math.max(2, evenW),
            height: Math.max(2, evenH)
          }
        });
      } catch (err) {
        console.error('VideoFrame cropping error:', err);
        if (frame) frame.close();
        throw err;
      }
      frame.close(); // Close the input frame immediately

      const keyFrame = frameCount % (frameRate * 2) === 0; // Keyframe every 2 seconds
      encoder.encode(croppedFrame, { keyFrame });
      croppedFrame.close(); // Close the cropped frame immediately

      frameCount++;
    }

    // If the loop finished but stopRecording hasn't been called (e.g. user stopped sharing natively)
    if (isRecording) {
      await stopRecording();
    }

  } catch (err) {
    console.error('Worker recording loop error:', err);
    self.postMessage({ type: 'error', error: err.message || String(err) });
    cleanup();
  }
}

async function stopRecording() {
  if (!isRecording) return;
  isRecording = false;

  try {
    if (reader) {
      try {
        await reader.cancel();
      } catch (_) {}
    }
    if (encoder) {
      try {
        await encoder.flush();
      } catch (_) {}
    }
    if (muxer) {
      try {
        muxer.finalize();
        const { buffer } = muxer.target;
        self.postMessage({ type: 'done', buffer }, [buffer]);
      } catch (e) {
        console.error('Muxer finalization failed:', e);
        self.postMessage({ type: 'error', error: 'Muxing failed: ' + e.message });
      }
    }
  } catch (err) {
    console.error('Worker stop recording error:', err);
    self.postMessage({ type: 'error', error: err.message || String(err) });
  } finally {
    cleanup();
  }
}

function cleanup() {
  isRecording = false;
  encoder = null;
  muxer = null;
  reader = null;
}

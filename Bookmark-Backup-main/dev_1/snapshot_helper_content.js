// =================================================================================
// TABLE OF CONTENTS (目录索引)
// =================================================================================
// I.     RUNTIME, CLASS CORE & PANEL (运行时、类核心与主面板)
// II.    HIGHLIGHTER LAUNCH & LIFECYCLE (高亮器启动与生命周期)
// III.   SCREENSHOT & RECORDING CONTROLS (截图与录屏控制)
// IV.    MARKDOWN SOURCE, IMAGE & SETTINGS (Markdown 来源、图片与设置)
// V.     SCREENSHOT PROCESSING & API EXPORT (截图处理与 API 导出)
// =================================================================================

// =================================================================================
// I. RUNTIME, CLASS CORE & PANEL (运行时、类核心与主面板)
// =================================================================================

(function () {
    'use strict';

    const API_KEY = '__dev1SnapshotHelper';
    const HOST_ID = 'dev1-snapshot-helper-host';

    if (window[API_KEY] && window[API_KEY].loaded === true) return;

    const getDocumentZoom = () => {
      try {
        const doc = document && document.documentElement;
        if (!doc) return 1;
        const datasetZoom = Number(doc.dataset && doc.dataset.pdfHelperZoom);
        if (Number.isFinite(datasetZoom) && datasetZoom > 0) return datasetZoom;
        const styleZoom = Number(doc.style && doc.style.zoom);
        if (Number.isFinite(styleZoom) && styleZoom > 0) return styleZoom;
      } catch (_) { }
      return 1;
    };

    const setImportantStyles = (el, styles) => {
      if (!el || !styles) return;
      Object.entries(styles).forEach(([name, value]) => {
        el.style.setProperty(name, value, 'important');
      });
    };

    function hashUrl(value) {
      let input = String(value == null ? '' : value);
      if (input.startsWith('http://') || input.startsWith('https://')) {
        try {
          const parsed = new URL(input);
          if (parsed.hash && !parsed.hash.startsWith('#/')) {
            parsed.hash = '';
          }
          input = parsed.href;
        } catch (_) {}
      }
      let h1 = 0xdeadbeef ^ input.length;
      let h2 = 0x41c6ce57 ^ input.length;
      for (let i = 0; i < input.length; i += 1) {
        const ch = input.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return ((h2 >>> 0).toString(36) + (h1 >>> 0).toString(36)).slice(0, 20);
    }

    const messages = {
      zh_CN: {
        title: '辅助工具',
        section_archive: '网页快照与标注',
        section_capture: '屏幕截图与录制',
        save_mhtml: '保存 MHTML',
        save_md: '保存 MD',
        mhtml_saving: '保存中...',
        md_saving: '保存中...',
        mhtml_saved: 'MHTML 已保存',
        md_saved: 'MD 已保存',
        mhtml_failed: 'MHTML 保存失败',
        md_failed: 'MD 保存失败',
        mhtml_tooltip: '保存 MHTML 网页快照',
        md_tooltip: '保存 Markdown 网页快照',
        highlight_tool: '高亮工具',
        highlight_tooltip: '高亮工具',
        highlight_tool_ready: '高亮工具已打开',
        highlight_tool_hidden: '高亮工具已收起',
        highlight_tool_failed: '高亮工具失败',
        highlight_tool_unavailable_pdf: 'PDF 页面不启用高亮工具',
        highlight_tool_launching: '正在打开高亮工具...',
        open_web_snapshot: '打开网页快照页',
        open_web_snapshot_tooltip: '打开网页快照页面',
        helper_info_tooltip: '说明',
        helper_shortcut_not_set: '未设置',
        helper_info_shortcut_prefix: '可以通过快捷键',
        helper_info_shortcut_suffix: '直接在任意页面打开/关闭工具箱。',
        helper_info_cache: '辅助工具所做的用户修改暂存于本地，当对应标签页(tabid)关闭或浏览器重启时，相关缓存数据将自动释放。',
        helper_info_export: '建议临时使用且注意导出',
        screenshot_area: '区域截图',
        screenshot_full: '长截图',
        screen_record: '屏幕录制',
        recording_settings: '录制设置',
        recording_settings_close: '关闭录制设置',
        codec: '编码器',
        quality: '画质',
        quality_max: '无损',
        quality_ultra: '极清',
        quality_high: '超清',
        quality_medium: '高清',
        quality_low: '标清',
        frame_rate: '帧率',
        screenshot_manual_instruction: '拖拽选择长截图区域',
        screenshot_instruction_area: '拖拽选择截图区域',
        screenshot_failed: '截图失败',
        screenshot_cancel: '取消',
        screenshot_copy: '复制',
        save_and_clear_cache: '保存并删除缓存',
        feedback_copied: '已复制',
        feedback_error_copy: '复制失败',
        screenshot: '截图',
        screen_record_select_area: '拖拽选择录制区域',
        screen_record_stop: '停止',
        processing: '处理中...',
        screen_record_error: '录屏失败',
        screen_record_tab_only: '为了精准录制框选区域，请在弹出的共享窗口中选择「Chrome 标签页」（或「当前标签页」）进行录制！',
        recording_settings_info_title: '录制说明',
        got_it: '知道了',
        loading: '加载中...',
        video_record_success: '录制完成',
        video_csp_restricted: '由于网站限制，无法预览',
        file_size: '文件大小',
        screenshot_ready: '准备就绪，滚动以捕获',
        screenshot_auto_scroll: '自动滚动',
        screenshot_finish: '完成并保存',
        screenshot_pause: '暂停',
        screenshot_resume: '继续',
        screenshot_error_init: '窗口或缩放已变化，请重新开始。',
        screenshot_gap_large: '⚠️ 间距过大，请滚回修复。',
        screenshot_repairing: '正在修复...',
        screenshot_auto_returning: '正在自动回到记忆点...',
        screenshot_repaired: '已修复，请继续...',
        screenshot_scroll_slowly: '缓慢向下滚动...',
        screenshot_capturing_initial: '正在捕获初始视图...',
        screenshot_too_far: '⚠️ 滚动过远，请滚回。',
        screenshot_slow_down: '⚠️ 请慢一点...',
        screenshot_scrolling: '滚动中...',
        screenshot_repair_ready: '🔧 停下以修复...',
        screenshot_scroll_back_more: '↑ 请多滚回一点...',
        screenshot_ready_continue: '准备继续...',
        screenshot_scroll_to_capture: '向下滚动...',
        screenshot_gap_large_slow: '⚠️ 间距过大，请慢慢滚回。',
        screenshot_capture_failed: '捕获失败，请滚回。',
        screenshot_saving: '正在保存...',
        screenshot_auto_scrolling: '自动滚动中...',
        screenshot_paused: '已暂停，可手动滚动或继续'
      },
      en: {
        title: 'Helper',
        section_archive: 'Page Snapshot & Annotate',
        section_capture: 'Screen Capture & Record',
        save_mhtml: 'Save MHTML',
        save_md: 'Save MD',
        mhtml_saving: 'Saving...',
        md_saving: 'Saving...',
        mhtml_saved: 'MHTML saved',
        md_saved: 'MD saved',
        mhtml_failed: 'MHTML save failed',
        md_failed: 'MD save failed',
        mhtml_tooltip: 'Save an MHTML web snapshot',
        md_tooltip: 'Save a Markdown web snapshot',
        highlight_tool: 'Highlight',
        highlight_tooltip: 'Highlight tool',
        highlight_tool_ready: 'Highlight tool opened',
        highlight_tool_hidden: 'Highlight tool hidden',
        highlight_tool_failed: 'Highlight tool failed',
        highlight_tool_unavailable_pdf: 'Highlight tool is disabled on PDFs',
        highlight_tool_launching: 'Opening highlight tool...',
        open_web_snapshot: 'Open Web Snapshot page',
        open_web_snapshot_tooltip: 'Open the Web Snapshot page',
        helper_info_tooltip: 'Help',
        helper_shortcut_not_set: 'Not Set',
        helper_info_shortcut_prefix: 'Use shortcut',
        helper_info_shortcut_suffix: 'to open/close the toolbox on any page.',
        helper_info_cache: 'User changes made by Helper are cached locally. When the related tabid is closed or the browser restarts, the cached data is released automatically.',
        helper_info_export: 'Use temporarily and export important work',
        screenshot_area: 'Area Screenshot',
        screenshot_full: 'Long Screenshot',
        screen_record: 'Screen Recording',
        recording_settings: 'Recording Settings',
        recording_settings_close: 'Close recording settings',
        codec: 'Codec',
        quality: 'Quality',
        quality_max: 'Lossless',
        quality_ultra: 'Ultra',
        quality_high: 'High',
        quality_medium: 'Medium',
        quality_low: 'Low',
        frame_rate: 'Frame Rate',
        screenshot_manual_instruction: 'Drag to select scrolling capture area',
        screenshot_instruction_area: 'Drag to select capture area',
        screenshot_failed: 'Screenshot failed',
        screenshot_cancel: 'Cancel',
        screenshot_copy: 'Copy',
        save_and_clear_cache: 'Save and clear cache',
        feedback_copied: 'Copied!',
        feedback_error_copy: 'Copy failed',
        screenshot: 'Screenshot',
        screen_record_select_area: 'Drag to select recording area',
        screen_record_stop: 'Stop',
        processing: 'Processing...',
        screen_record_error: 'Screen recording failed',
        screen_record_tab_only: 'To crop the recording area accurately, please select "Chrome Tab" (or "Current Tab") in the sharing dialog!',
        recording_settings_info_title: 'Recording Instructions',
        got_it: 'Got it',
        loading: 'Loading...',
        video_record_success: 'Recording complete',
        video_csp_restricted: 'Preview unavailable due to site restrictions',
        file_size: 'File size',
        screenshot_ready: 'Ready. Scroll to capture.',
        screenshot_auto_scroll: 'Auto Scroll',
        screenshot_finish: 'Finish & Save',
        screenshot_pause: 'Pause',
        screenshot_resume: 'Resume',
        screenshot_error_init: 'Window or zoom changed. Please restart.',
        screenshot_gap_large: '⚠️ Gap too large! Scroll back.',
        screenshot_repairing: 'Repairing...',
        screenshot_auto_returning: 'Returning to memory point...',
        screenshot_repaired: 'Fixed! Continue...',
        screenshot_scroll_slowly: 'Scroll slowly...',
        screenshot_capturing_initial: 'Capturing initial view...',
        screenshot_too_far: '⚠️ Too far! Scroll back.',
        screenshot_slow_down: '⚠️ Slow down...',
        screenshot_scrolling: 'Scrolling...',
        screenshot_repair_ready: '🔧 Stop to repair...',
        screenshot_scroll_back_more: '↑ Scroll back more...',
        screenshot_ready_continue: 'Ready...',
        screenshot_scroll_to_capture: 'Scroll down...',
        screenshot_gap_large_slow: '⚠️ Gap too large! Scroll back slowly.',
        screenshot_capture_failed: 'Capture failed. Scroll back.',
        screenshot_saving: 'Saving...',
        screenshot_auto_scrolling: 'Auto scrolling...',
        screenshot_paused: 'Paused - scroll manually or resume'
      }
    };

    function normalizeConfig(config) {
      const raw = config && typeof config === 'object' ? config : {};
      return {
        lang: raw.lang === 'en' ? 'en' : 'zh_CN',
        index: Number.isFinite(Number(raw.index)) ? Math.max(0, Math.floor(Number(raw.index))) : 0,
        title: String(raw.title || document.title || '').trim(),
        url: String(raw.url || location.href || '').trim(),
        domain: String(raw.domain || location.hostname || '').trim(),
        folderPath: String(raw.folderPath || '').trim(),
        subdomain: String(raw.subdomain || '').trim(),
        source: String(raw.source || '').trim(),
        existingTabId: Number.isFinite(Number(raw.existingTabId)) ? Math.floor(Number(raw.existingTabId)) : null,
        originExtensionTabId: Number.isFinite(Number(raw.originExtensionTabId)) ? Math.floor(Number(raw.originExtensionTabId)) : null,
        originExtensionWindowId: Number.isFinite(Number(raw.originExtensionWindowId)) ? Math.floor(Number(raw.originExtensionWindowId)) : null,
        queueBatchIndex: Number.isFinite(Number(raw.queueBatchIndex)) ? Math.max(0, Math.floor(Number(raw.queueBatchIndex))) : null,
        queueBatchPosition: Number.isFinite(Number(raw.queueBatchPosition)) ? Math.max(0, Math.floor(Number(raw.queueBatchPosition))) : null,
        queueDisplayIndex: Number.isFinite(Number(raw.queueDisplayIndex)) ? Math.max(0, Math.floor(Number(raw.queueDisplayIndex))) : null,
        snapshotHelperTargetFolder: String(raw.snapshotHelperTargetFolder || raw.targetFolder || '').trim()
      };
    }

    function sendRuntimeMessage(payload, timeoutMs = 120000) {
      return new Promise((resolve, reject) => {
        const runtime = typeof chrome !== 'undefined' ? chrome.runtime : null;
        if (!runtime || typeof runtime.sendMessage !== 'function') {
          reject(new Error('Runtime unavailable'));
          return;
        }
        let done = false;
        const timer = setTimeout(() => {
          if (done) return;
          done = true;
          reject(new Error('Runtime request timeout'));
        }, timeoutMs);
        try {
          runtime.sendMessage(payload, (response) => {
            if (done) return;
            done = true;
            clearTimeout(timer);
            const runtimeError = runtime.lastError;
            if (runtimeError) {
              reject(new Error(runtimeError.message || 'Runtime error'));
              return;
            }
            resolve(response);
          });
        } catch (error) {
          if (done) return;
          done = true;
          clearTimeout(timer);
          reject(error);
        }
      });
    }


    class Dev1SnapshotHelper {
      constructor() {
        this.loaded = true;
        this.config = {};
        this.host = null;
        this.shadow = null;
        this.darkModeEnabled = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this._cachedTheme = null;
        this._isScreenshotting = false;
        this.activeSessionCleanup = null;
        this._longShotStabilityCleanup = null;
        this._highlighterVisibleGuess = false;
        this._highlighterLaunchPanelTimer = null;
        this._highlighterToolbarUiCache = null;
        this._highlighterToolbarUiCacheUrl = '';
        this._highlighterToolbarUiPrefetch = null;
        this._mdTextarea = null;
        this._mdNotesArea = null;
        this._mdArticleArea = null;
        this._mdSaveTimer = null;
        this._urlChangeListener = null;
        this.t = (key) => this.translate(key);
        this._setupUrlChangeListener();

        this._supportedCodecsCache = null;
        this._codecCheckPromise = null;

        this._initTheme();
      }

      _initTheme() {
        const updateTheme = () => {
          if (chrome && chrome.storage && chrome.storage.local) {
            chrome.storage.local.get(['themePreference'], (result) => {
              const pref = result.themePreference || 'system';
              let actualThemeIsDark = false;
              if (pref === 'dark') {
                actualThemeIsDark = true;
              } else if (pref === 'light') {
                actualThemeIsDark = false;
              } else {
                actualThemeIsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
              }
              this.darkModeEnabled = actualThemeIsDark;
              this._updateAppliedTheme();
            });
          } else {
            this.darkModeEnabled = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            this._updateAppliedTheme();
          }
        };

        if (chrome && chrome.storage && chrome.storage.onChanged) {
          chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'local' && (changes.themePreference || changes.currentTheme)) {
              updateTheme();
            }
          });
        }

        if (window.matchMedia) {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleMediaQueryChange = () => {
            if (chrome && chrome.storage && chrome.storage.local) {
              chrome.storage.local.get(['themePreference'], (result) => {
                if ((result.themePreference || 'system') === 'system') {
                  updateTheme();
                }
              });
            } else {
              updateTheme();
            }
          };
          if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleMediaQueryChange);
          } else if (mediaQuery.addListener) {
            mediaQuery.addListener(handleMediaQueryChange);
          }
        }

        updateTheme();
      }

      _updateAppliedTheme() {
        if (this.host) {
          this.host.classList.toggle('dark-theme', !!this.darkModeEnabled);
          this.host.classList.toggle('light-theme', !this.darkModeEnabled);
        }
        const isDark = !!this.darkModeEnabled;
        const recordDialog = document.getElementById('screen-record-result-dialog');
        if (recordDialog) {
          recordDialog.style.background = isDark ? '#252525' : '#f0f4f8';
          recordDialog.style.color = isDark ? '#f0f4f8' : '#1e293b';
          recordDialog.style.border = isDark ? '1px solid #3b3b3b' : '1px solid #cbd5e1';
        }
        const screenshotDialog = document.getElementById('screenshot-result-dialog');
        if (screenshotDialog) {
          screenshotDialog.style.background = isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(240, 244, 248, 0.85)';
          screenshotDialog.style.color = isDark ? '#f0f4f8' : '#1e293b';
          screenshotDialog.style.border = isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)';
        }
      }

      _isMacPlatform() {
        const nav = typeof navigator !== 'undefined' ? navigator : null;
        const platform = String((nav && nav.platform) || '').toUpperCase();
        const userAgent = String((nav && nav.userAgent) || '').toUpperCase();
        return platform.includes('MAC') || userAgent.includes('MAC');
      }

      _getOpenWebSnapshotShortcutFallback() {
        return this._isMacPlatform() ? '⇧⌘P' : 'Ctrl+Shift+P';
      }

      _formatOpenWebSnapshotShortcut(value, fallback = '') {
        const raw = String(value || fallback || '').trim();
        if (!raw) return '';
        if (!this._isMacPlatform()) return raw;

        const parts = raw.split('+').map(part => part.trim()).filter(Boolean);
        if (parts.length < 2) {
          return raw
            .replace(/Command/gi, '⌘')
            .replace(/MacCtrl/gi, '⌃')
            .replace(/Ctrl/gi, '⌃')
            .replace(/Control/gi, '⌃')
            .replace(/Alt/gi, '⌥')
            .replace(/Option/gi, '⌥')
            .replace(/Shift/gi, '⇧');
        }

        const key = parts[parts.length - 1];
        const modifierMap = new Map([
          ['shift', { symbol: '⇧', order: 1 }],
          ['command', { symbol: '⌘', order: 2 }],
          ['cmd', { symbol: '⌘', order: 2 }],
          ['meta', { symbol: '⌘', order: 2 }],
          ['macctrl', { symbol: '⌃', order: 3 }],
          ['ctrl', { symbol: '⌃', order: 3 }],
          ['control', { symbol: '⌃', order: 3 }],
          ['alt', { symbol: '⌥', order: 4 }],
          ['option', { symbol: '⌥', order: 4 }]
        ]);
        const modifiers = parts.slice(0, -1)
          .map(part => modifierMap.get(part.toLowerCase()) || { symbol: part, order: 9 })
          .sort((a, b) => a.order - b.order)
          .map(item => item.symbol)
          .join('');
        return `${modifiers}${key}`;
      }

      _renderHelperInfoPopoverHtml() {
        const shortcut = this._getOpenWebSnapshotShortcutFallback();
        if (this.config && this.config.lang === 'en') {
          return `
                  <div class="dev1-helper-info-popover" role="tooltip">
                    <div class="dev1-helper-info-line">1. ${this.translate('helper_info_shortcut_prefix')} <kbd data-helper-shortcut>${shortcut}</kbd> ${this.translate('helper_info_shortcut_suffix')}</div>
                    <div class="dev1-helper-info-line">2. ${this.translate('helper_info_cache')}</div>
                    <div class="dev1-helper-info-line dev1-helper-info-warning">3. ${this.translate('helper_info_export')}</div>
                  </div>`;
        }
        return `
                  <div class="dev1-helper-info-popover" role="tooltip">
                    <div class="dev1-helper-info-line">1、${this.translate('helper_info_shortcut_prefix')}「<kbd data-helper-shortcut>${shortcut}</kbd>」${this.translate('helper_info_shortcut_suffix')}</div>
                    <div class="dev1-helper-info-line">2、${this.translate('helper_info_cache')}</div>
                    <div class="dev1-helper-info-line dev1-helper-info-warning">3、「${this.translate('helper_info_export')}」</div>
                  </div>`;
      }

      async _hydrateOpenWebSnapshotShortcut() {
        const shortcutEl = this.shadow && this.shadow.querySelector('[data-helper-shortcut]');
        if (!shortcutEl) return;
        try {
          const response = await sendRuntimeMessage({
            action: 'dev1GetOpenWebSnapshotShortcut'
          }, 3000);
          if (!response || response.success !== true) return;
          const raw = String(response.shortcut || '').trim();
          if (response.configured === true && !raw) {
            shortcutEl.textContent = this.translate('helper_shortcut_not_set');
            return;
          }
          shortcutEl.textContent = this._formatOpenWebSnapshotShortcut(raw, this._getOpenWebSnapshotShortcutFallback());
        } catch (_) { }
      }

      async _checkAllCodecsSupport() {
        const webCodecsSupported = typeof VideoEncoder !== 'undefined' && typeof Mp4Muxer !== 'undefined' && typeof Mp4Muxer.Muxer === 'function';
        const isChinese = (this.config && this.config.lang) !== 'en';
        if (!webCodecsSupported) {
          const candidates = [
            { value: 'video/webm;codecs=vp9', label: 'VP9' },
            { value: 'video/webm;codecs=vp8', label: 'VP8' }
          ];
          const supported = [];
          for (const item of candidates) {
            if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(item.value)) {
              supported.push(item);
            }
          }
          this._supportedCodecsCache = supported;
          return;
        }

        const candidates = [
          { value: 'avc1.640033', label: isChinese ? 'H.264 High 5.1 (推荐)' : 'H.264 High 5.1 (Recommended)' },
          { value: 'hvc1.1.6.L153.B0', label: 'HEVC (H.265)' },
          { value: 'av01.0.05M.08', label: isChinese ? 'AV1 (高画质/低体积)' : 'AV1 (High Quality / Low Size)' },
          { value: 'avc1.42001f', label: isChinese ? 'H.264 Baseline (兼容)' : 'H.264 Baseline (Compatible)' },
          { value: 'video/webm;codecs=vp9', label: 'VP9' },
          { value: 'video/webm;codecs=vp8', label: 'VP8' }
        ];

        const checkCodecSupport = async (codec) => {
          if (codec.startsWith('video/webm')) {
            return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(codec);
          }
          
          let testCodec = codec;
          
          const config = {
            codec: testCodec,
            width: 1280,
            height: 720,
            bitrate: 5000000,
            framerate: 30
          };
          
          try {
            const res = await VideoEncoder.isConfigSupported(config);
            if (!res.supported) return false;
            
            const encoder = new VideoEncoder({
              output: () => {},
              error: () => {}
            });
            try {
              encoder.configure(config);
              encoder.close();
              return true;
            } catch (err) {
              console.warn(`Codec ${codec} configuration check failed:`, err);
              try { encoder.close(); } catch (_) {}
              return false;
            }
          } catch (_) {
            return false;
          }
        };

        const supported = [];
        for (const item of candidates) {
          if (await checkCodecSupport(item.value)) {
            supported.push(item);
          }
        }
        
        if (supported.length === 0) {
          supported.push({ value: 'avc1.640033', label: isChinese ? 'H.264 High 5.1 (推荐)' : 'H.264 High 5.1 (Recommended)' });
          supported.push({ value: 'avc1.42001f', label: isChinese ? 'H.264 Baseline (兼容)' : 'H.264 Baseline (Compatible)' });
        }

        this._supportedCodecsCache = supported;
        console.log('Detected supported screen recording codecs:', supported.map(c => c.value));
      }

      translate(key) {
        const lang = this.config && this.config.lang === 'en' ? 'en' : 'zh_CN';
        return (messages[lang] && messages[lang][key]) || messages.zh_CN[key] || key;
      }

      detectPageTheme() {
        try {
          if (this._isScreenshotting && this._cachedTheme !== null) return this._cachedTheme;
          const html = document.documentElement;
          const body = document.body || html;
          const candidates = [body, html];
          for (const el of candidates) {
            const bg = getComputedStyle(el).backgroundColor || '';
            const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
            if (!match) continue;
            const r = Number(match[1]);
            const g = Number(match[2]);
            const b = Number(match[3]);
            return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) < 0.5;
          }
        } catch (_) { }
        return false;
      }

      _ensureHost() {
        let host = document.getElementById(HOST_ID);
        if (!host) {
          host = document.createElement('div');
          host.id = HOST_ID;
          document.documentElement.appendChild(host);
        }
        this.host = host;
        this.shadow = host.shadowRoot || host.attachShadow({ mode: 'open' });
        this._resetHostDefaultPosition();
        return host;
      }

      _resetHostDefaultPosition() {
        if (!this.host) return;
        this.host.style.position = 'fixed';
        this.host.style.left = 'auto';
        this.host.style.top = 'auto';
        this.host.style.right = '18px';
        this.host.style.bottom = '18px';
        this.host.style.transform = 'none';
        this.host.style.zIndex = '2147483647';
        this.host.style.pointerEvents = 'none';
        try { delete this.host.__dev1ManuallyDragged; } catch (_) { this.host.__dev1ManuallyDragged = false; }
      }

      _bindDrag(host, handle, options = {}) {
        if (!host || !handle) return;
        let dragging = false;
        let activePointerId = null;
        let startX = 0;
        let startY = 0;
        let startRight = 18;
        let startBottom = 18;
        let startLeft = 0;
        let startTop = 0;
        let startWidth = 0;
        let startHeight = 0;
        let moved = false;
        const useLeftTop = options.useLeftTop || false;

        const finishDrag = (event) => {
          if (event && activePointerId != null && event.pointerId !== activePointerId) return;
          dragging = false;
          activePointerId = null;
          handle.__dev1LastDragMoved = moved;
          window.removeEventListener('pointermove', onMove, true);
          window.removeEventListener('pointerup', finishDrag, true);
          window.removeEventListener('pointercancel', finishDrag, true);
          window.removeEventListener('blur', finishDrag, true);
          try { handle.releasePointerCapture(event.pointerId); } catch (_) { }
          setTimeout(() => { handle.__dev1LastDragMoved = false; }, 0);
        };

        const onMove = (event) => {
          if (!dragging) return;
          if (activePointerId != null && event.pointerId !== activePointerId) return;
          if (event.buttons === 0 && event.pointerType !== 'touch') {
            finishDrag(event);
            return;
          }
          const deltaX = event.clientX - startX;
          const deltaY = event.clientY - startY;
          if (!moved && Math.abs(deltaX) <= 3 && Math.abs(deltaY) <= 3) return;
          moved = true;
          if (useLeftTop) {
            const nextLeft = Math.max(0, Math.min(window.innerWidth - startWidth, startLeft + deltaX));
            const nextTop = Math.max(0, Math.min(window.innerHeight - startHeight, startTop + deltaY));
            host.style.left = `${nextLeft}px`;
            host.style.top = `${nextTop}px`;
            host.__dev1ManuallyDragged = true;
          } else {
            const nextRight = Math.max(0, Math.min(window.innerWidth - 40, startRight - deltaX));
            const nextBottom = Math.max(0, Math.min(window.innerHeight - 40, startBottom - deltaY));
            host.style.left = 'auto';
            host.style.top = 'auto';
            host.style.right = `${nextRight}px`;
            host.style.bottom = `${nextBottom}px`;
            host.__dev1ManuallyDragged = true;
            this._updateQuadrant();
            if (typeof this._repositionMdSettingsPanel === 'function') {
              this._repositionMdSettingsPanel();
            }
          }
          event.preventDefault();
        };

        handle.addEventListener('pointerdown', (event) => {
          if (event.button !== 0) return;
          if (options.skipInteractive !== false && event.target?.closest?.('button,input,select,textarea,a,[data-no-drag="true"]')) return;
          dragging = true;
          activePointerId = event.pointerId;
          moved = false;
          startX = event.clientX;
          startY = event.clientY;
          const rect = host.getBoundingClientRect();
          if (useLeftTop) {
            startLeft = rect.left;
            startTop = rect.top;
            startWidth = rect.width;
            startHeight = rect.height;
          } else {
            startRight = Math.max(0, window.innerWidth - rect.right);
            startBottom = Math.max(0, window.innerHeight - rect.bottom);
          }
          try { handle.setPointerCapture(event.pointerId); } catch (_) { }
          window.addEventListener('pointermove', onMove, true);
          window.addEventListener('pointerup', finishDrag, true);
          window.addEventListener('pointercancel', finishDrag, true);
          window.addEventListener('blur', finishDrag, true);
          event.preventDefault();
        });
      }

      _updateQuadrant(force = false) {
        if (!this.host || !this.shadow) return;
        const root = this.shadow.querySelector('.dev1-helper-root');
        const launcher = this.shadow.querySelector('.dev1-helper-launcher');
        if (!root || !launcher) return;
        if (!force && root.dataset.open === 'true') return; // 展开时不翻转排版，防止跳动
        
        const rect = launcher.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const isTop = centerY < window.innerHeight / 2;
        const isLeft = centerX < window.innerWidth / 2;
        
        root.className = `dev1-helper-root pos-${isTop ? 'top' : 'bottom'}-${isLeft ? 'left' : 'right'}`;
      }


      _renderPanel() {
        const host = this._ensureHost();
        const shadow = this.shadow;
        if (this.darkModeEnabled) {
          host.classList.add('dark-theme');
          host.classList.remove('light-theme');
        } else {
          host.classList.add('light-theme');
          host.classList.remove('dark-theme');
        }
        shadow.innerHTML = `
          <style>
            :host {
              all: initial;
              --backdrop-filter: blur(16px);
              --accent-color: #3b82f6;
              --accent-glow: rgba(59, 130, 246, 0.25);
            }
            :host(.light-theme) {
              --panel-bg: rgba(248, 250, 252, 0.95);
              --panel-border: rgba(226, 232, 240, 0.8);
              --panel-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
              --text-main: #0f172a;
              --text-muted: #64748b;
              --card-bg: rgba(255, 255, 255, 0.7);
              --card-bg-hover: rgba(255, 255, 255, 0.98);
              --card-border: rgba(226, 232, 240, 0.6);
              --card-icon-bg: rgba(59, 130, 246, 0.1);
              --card-icon-color: #2563eb;
              --header-bg: rgba(241, 245, 249, 0.98);
              --btn-close-hover: rgba(239, 68, 68, 0.1);
              --btn-min-hover: rgba(100, 116, 139, 0.1);
              --launch-panel-border: #cbd5e1;
              --launch-panel-bg: #f0f4f8;
              --launch-panel-color: #172033;
              --launch-btn-bg: #cbd5e1;
              --launch-ind-bg: rgba(0,0,0,.05);
              --launch-ind-border: rgba(0,0,0,.1);
              --launch-sep-bg: rgba(0,0,0,.12);
            }
            :host(.dark-theme) {
              --panel-bg: rgba(20, 20, 23, 0.9);
              --panel-border: rgba(63, 63, 70, 0.7);
              --panel-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
              --text-main: #f4f4f5;
              --text-muted: #a1a1aa;
              --card-bg: rgba(39, 39, 42, 0.6);
              --card-bg-hover: rgba(39, 39, 42, 0.95);
              --card-border: rgba(63, 63, 70, 0.4);
              --card-icon-bg: rgba(59, 130, 246, 0.15);
              --card-icon-color: #60a5fa;
              --header-bg: rgba(28, 28, 30, 0.95);
              --btn-close-hover: rgba(239, 68, 68, 0.2);
              --btn-min-hover: rgba(156, 163, 175, 0.2);
              --launch-panel-border: #444;
              --launch-panel-bg: #2a2a2a;
              --launch-panel-color: #e0e0e0;
              --launch-btn-bg: #333;
              --launch-ind-bg: rgba(255,255,255,.1);
              --launch-ind-border: rgba(255,255,255,.2);
              --launch-sep-bg: rgba(255,255,255,.22);
            }
            .dev1-helper-root { position: relative; width: 54px; height: 54px; pointer-events: auto; }
            .dev1-helper-launcher {
              position: absolute;
              inset: 0;
              border-radius: 20px;
              border: 1px solid var(--panel-border);
              background: var(--panel-bg);
              backdrop-filter: var(--backdrop-filter);
              -webkit-backdrop-filter: var(--backdrop-filter);
              color: var(--text-main);
              box-shadow: var(--panel-shadow);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: grab;
              user-select: none;
              font-family: -apple-system, BlinkMacSystemFont, sans-serif;
              z-index: 2;
              transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.2s ease, border-color 0.2s ease;
            }
            .dev1-helper-launcher:hover {
              transform: scale(1.06);
              box-shadow: 0 8px 24px rgba(59, 130, 246, 0.25);
              border-color: var(--accent-color);
            }
            .dev1-helper-launcher:active {
              cursor: grabbing;
              transform: scale(0.96);
            }
            .dev1-helper-launcher-icon {
              width: 28px;
              height: 28px;
              border-radius: 12px;
              background: var(--card-icon-bg);
              color: var(--card-icon-color);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.25s ease;
            }
            .dev1-helper-launcher:hover .dev1-helper-launcher-icon {
              transform: scale(1.05) rotate(15deg);
            }
            .dev1-helper-panel {
              position: absolute;
              z-index: 1;
              width: 300px;
              max-width: min(300px, calc(100vw - 36px));
              border-radius: 20px;
              background: var(--panel-bg);
              backdrop-filter: var(--backdrop-filter);
              -webkit-backdrop-filter: var(--backdrop-filter);
              color: var(--text-main);
              border: 1px solid var(--panel-border);
              box-shadow: var(--panel-shadow);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              overflow: visible;
              pointer-events: none;
              opacity: 0;
              transform: translateY(30px) scale(0.96);
              transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .dev1-helper-root[data-open="true"] .dev1-helper-panel {
              opacity: 1;
              transform: scale(1) translateY(0);
              pointer-events: auto;
            }
            .dev1-helper-root.pos-bottom-right .dev1-helper-panel { bottom: 64px; right: 0; transform-origin: bottom right; }
            .dev1-helper-root.pos-bottom-left .dev1-helper-panel { bottom: 64px; left: 0; transform-origin: bottom left; }
            .dev1-helper-root.pos-top-right .dev1-helper-panel { top: 64px; right: 0; transform-origin: top right; }
            .dev1-helper-root.pos-top-left .dev1-helper-panel { top: 64px; left: 0; transform-origin: top left; }
            @keyframes dev1-panel-fade-in {
              from {
                opacity: 0;
                transform: translateY(10px) scale(0.98);
              }
              to {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            #recording-settings-panel {
              position: absolute;
              z-index: 10;
              width: 300px;
              max-width: min(300px, calc(100vw - 36px));
              border-radius: 20px;
              background: var(--panel-bg);
              backdrop-filter: var(--backdrop-filter);
              -webkit-backdrop-filter: var(--backdrop-filter);
              color: var(--text-main);
              border: 1px solid var(--panel-border);
              box-shadow: var(--panel-shadow);
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
              box-sizing: border-box;
              padding: 16px;
              font-size: 13px;
              pointer-events: auto !important;
              animation: dev1-panel-fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            .dev1-helper-root.pos-bottom-right #recording-settings-panel { bottom: 64px; right: 0; transform-origin: bottom right; }
            .dev1-helper-root.pos-bottom-left #recording-settings-panel { bottom: 64px; left: 0; transform-origin: bottom left; }
            .dev1-helper-root.pos-top-right #recording-settings-panel { top: 64px; right: 0; transform-origin: top right; }
            .dev1-helper-root.pos-top-left #recording-settings-panel { top: 64px; left: 0; transform-origin: top left; }
            #md-settings-panel {
              position: fixed;
              z-index: 2147483648;
              background: var(--panel-bg) !important;
              backdrop-filter: var(--backdrop-filter) !important;
              -webkit-backdrop-filter: var(--backdrop-filter) !important;
              border-radius: 20px !important;
              box-shadow: var(--panel-shadow) !important;
              border: 1px solid var(--panel-border) !important;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif !important;
              color: var(--text-main) !important;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              box-sizing: border-box !important;
              animation: dev1-panel-fade-in 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
            }
            #md-settings-panel .md-settings-btn {
              width: 26px !important;
              height: 26px !important;
              border: 0 !important;
              border-radius: 7px !important;
              background: transparent !important;
              color: var(--text-muted) !important;
              cursor: pointer !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
              transition: all 0.2s ease !important;
              padding: 0 !important;
            }
            #md-settings-panel .md-settings-btn:hover {
              background: var(--btn-min-hover) !important;
              color: var(--text-main) !important;
            }
            #md-settings-panel .md-settings-close:hover {
              background: var(--btn-close-hover) !important;
              color: #ef4444 !important;
            }
            #md-settings-panel textarea {
              width: 100% !important;
              box-sizing: border-box !important;
              padding: 10px !important;
              border: 1px solid var(--card-border) !important;
              border-radius: 10px !important;
              background: var(--card-bg) !important;
              color: var(--text-main) !important;
              font-size: 12px !important;
              resize: none !important;
              text-align: left !important;
              line-height: 1.5 !important;
              transition: border-color 0.2s, box-shadow 0.2s, background-color 0.2s !important;
            }
            #md-settings-panel textarea:hover {
              border-color: var(--accent-color) !important;
            }
            #md-settings-panel textarea:focus {
              outline: none !important;
              border-color: var(--accent-color) !important;
              box-shadow: 0 0 0 2px var(--accent-glow) !important;
              background: var(--card-bg-hover) !important;
            }
            #md-settings-panel textarea::placeholder {
              color: var(--text-muted) !important;
              opacity: 0.7 !important;
            }
            #md-settings-panel textarea::-webkit-scrollbar {
              width: 8px !important;
              height: 8px !important;
            }
            #md-settings-panel textarea::-webkit-scrollbar-track {
              background: transparent !important;
            }
            #md-settings-panel textarea::-webkit-scrollbar-thumb {
              background: var(--panel-border) !important;
              border-radius: 4px !important;
            }
            #md-settings-panel textarea::-webkit-scrollbar-thumb:hover {
              background: var(--text-muted) !important;
            }
            #md-toc-panel .toc-list-container {
              scrollbar-width: thin !important;
              scrollbar-color: var(--panel-border) transparent !important;
            }
            #md-toc-panel .toc-list-container::-webkit-scrollbar {
              width: 8px !important;
              height: 8px !important;
            }
            #md-toc-panel .toc-list-container::-webkit-scrollbar-track {
              background: transparent !important;
            }
            #md-toc-panel .toc-list-container::-webkit-scrollbar-thumb {
              background: var(--panel-border) !important;
              border-radius: 4px !important;
            }
            #md-toc-panel .toc-list-container::-webkit-scrollbar-thumb:hover {
              background: var(--text-muted) !important;
            }
            #md-settings-panel .md-btn {
              flex: 1 !important;
              padding: 8px 0 !important;
              border: 0 !important;
              border-radius: 8px !important;
              cursor: pointer !important;
              font-size: 13px !important;
              font-weight: 600 !important;
              outline: none !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            }
            #md-settings-panel .md-btn-secondary {
              background: var(--card-bg) !important;
              color: var(--text-main) !important;
              border: 1px solid var(--card-border) !important;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            #md-settings-panel .md-btn-secondary:hover {
              background: var(--card-bg-hover) !important;
              border-color: var(--accent-color) !important;
              transform: translateY(-0.5px) !important;
            }
            #md-settings-panel .md-btn-secondary:active {
              transform: scale(0.98) !important;
            }
            #md-settings-panel .md-btn-primary {
              background: var(--accent-color) !important;
              color: #ffffff !important;
              border: 1px solid transparent !important;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
              box-shadow: 0 2px 6px var(--accent-glow) !important;
            }
            #md-settings-panel .md-btn-primary:hover {
              opacity: 0.95 !important;
              transform: translateY(-0.5px) !important;
              box-shadow: 0 4px 12px var(--accent-glow) !important;
            }
            #md-settings-panel .md-btn-primary:active {
              transform: scale(0.98) !important;
            }
            #md-settings-panel .md-help-popover {
              position: absolute;
              top: 44px !important;
              left: 12px !important;
              right: 12px !important;
              z-index: 2147483649 !important;
              padding: 12px !important;
              border-radius: 12px !important;
              border: 1px solid var(--panel-border) !important;
              background: var(--panel-bg) !important;
              backdrop-filter: var(--backdrop-filter) !important;
              -webkit-backdrop-filter: var(--backdrop-filter) !important;
              color: var(--text-main) !important;
              box-shadow: var(--panel-shadow) !important;
              font-size: 12px !important;
              line-height: 1.55 !important;
              font-weight: 400 !important;
              box-sizing: border-box !important;
              animation: dev1-panel-fade-in 0.15s cubic-bezier(0.4, 0, 0.2, 1) forwards !important;
            }
            .dev1-helper-header {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 12px 14px;
              background: var(--header-bg);
              border-bottom: 1px solid var(--panel-border);
              border-radius: 20px 20px 0 0;
              cursor: move;
              position: relative;
              user-select: none;
              z-index: 30;
            }
            .dev1-helper-title {
              font-size: 13px;
              font-weight: 600;
              color: var(--text-main);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
            }
            .dev1-helper-title-group {
              flex: 1;
              min-width: 0;
              display: flex;
              align-items: center;
              gap: 4px;
            }
            .dev1-helper-btn {
              width: 26px;
              height: 26px;
              border: 0;
              border-radius: 6px;
              background: transparent;
              color: var(--text-muted);
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s ease;
              font-size: 14px;
            }
            .dev1-helper-btn:hover {
              background: var(--btn-min-hover);
              color: var(--text-main);
            }
            .dev1-helper-close:hover {
              background: var(--btn-close-hover);
              color: #ef4444;
            }
            .dev1-helper-open-snapshot svg { transform: translateY(0.5px); }
            .dev1-helper-info svg { transform: translateY(1px); }
            .dev1-helper-info-wrap {
              position: relative;
              width: 26px;
              height: 26px;
              flex: 0 0 26px;
              z-index: 31;
            }
            .dev1-helper-info-popover {
              position: absolute;
              top: 32px;
              right: -32px;
              z-index: 2147483647;
              width: 272px;
              max-width: min(272px, calc(100vw - 42px));
              box-sizing: border-box;
              padding: 12px 13px;
              border-radius: 12px;
              border: 1px solid var(--panel-border);
              background: var(--panel-bg);
              backdrop-filter: var(--backdrop-filter);
              -webkit-backdrop-filter: var(--backdrop-filter);
              color: var(--text-main);
              box-shadow: var(--panel-shadow);
              font-size: 12px;
              line-height: 1.55;
              font-weight: 400;
              pointer-events: none;
              opacity: 0;
              transform: translateY(-4px) scale(0.98);
              transition: opacity 120ms ease, transform 120ms ease;
            }
            .dev1-helper-info-wrap:hover .dev1-helper-info-popover,
            .dev1-helper-info-wrap:focus-within .dev1-helper-info-popover {
              opacity: 1;
              transform: translateY(0) scale(1);
              pointer-events: auto;
            }
            .dev1-helper-info-line + .dev1-helper-info-line {
              margin-top: 8px;
            }
            .dev1-helper-info-line kbd {
              display: inline-flex;
              align-items: center;
              min-height: 18px;
              padding: 1px 5px;
              margin: 0 2px;
              border-radius: 5px;
              border: 1px solid var(--card-border);
              background: var(--card-bg);
              color: var(--accent-color);
              font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
            }
            .dev1-helper-info-warning {
              color: #f97316;
              font-weight: 700;
            }
            .dev1-helper-feedback {
              max-width: 100px;
              font-size: 11px;
              font-weight: 500;
              color: var(--accent-color);
              overflow: hidden;
              white-space: nowrap;
              text-overflow: ellipsis;
              margin-right: 4px;
            }
            .dev1-helper-body {
              padding: 14px 16px 16px;
              display: flex;
              flex-direction: column;
              gap: 14px;
              box-sizing: border-box;
            }
            .dev1-helper-section {
              display: flex;
              flex-direction: column;
              gap: 8px;
            }
            .dev1-helper-section-title {
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: var(--text-muted);
              margin-left: 2px;
              margin-bottom: 2px;
            }
            .dev1-helper-list {
              display: flex;
              flex-direction: column;
              gap: 6px;
            }
            .dev1-helper-card {
              display: flex;
              align-items: center;
              gap: 12px;
              width: 100%;
              height: 42px;
              border: 1px solid var(--card-border);
              border-radius: 12px;
              background: var(--card-bg);
              color: var(--text-main);
              cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              padding: 0 14px;
              box-sizing: border-box;
              font-family: inherit;
              position: relative;
              text-align: left;
            }
            .dev1-helper-card:hover {
              transform: translateY(-1.5px);
              background: var(--card-bg-hover);
              border-color: var(--accent-color);
              box-shadow: 0 6px 14px -5px var(--accent-glow);
            }
            .dev1-helper-card:active {
              transform: scale(0.99);
            }
            .dev1-helper-card-icon {
              width: 26px;
              height: 26px;
              border-radius: 8px;
              background: var(--card-icon-bg);
              color: var(--card-icon-color);
              display: flex;
              align-items: center;
              justify-content: center;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
              flex-shrink: 0;
            }
            .dev1-helper-card-icon svg {
              width: 14px;
              height: 14px;
              display: block;
            }
            .dev1-helper-card:hover .dev1-helper-card-icon {
              background: var(--accent-color);
              color: #ffffff;
            }
            .dev1-helper-card-label {
              font-size: 13px;
              font-weight: 550;
              text-align: left;
              white-space: nowrap;
              flex: 1;
            }
            .dev1-helper-gear {
              width: 24px;
              height: 24px;
              border-radius: 6px;
              background: transparent;
              border: 0;
              color: var(--text-muted);
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
              transition: all 0.2s ease;
              flex-shrink: 0;
            }
            .dev1-helper-gear:hover {
              background: var(--btn-min-hover);
              color: var(--accent-color);
              transform: rotate(45deg);
            }
            .dev1-helper-tip { position:fixed; z-index:2147483647; max-width:220px; height:24px; box-sizing:border-box; padding:0 8px; border-radius:7px; background:rgba(15, 23, 42, 0.95); backdrop-filter: blur(4px); color:#fff; font-size:11px; line-height:1; display:flex; align-items:center; white-space:nowrap; box-shadow:0 8px 22px rgba(15,23,42,0.24); pointer-events:none; opacity:0; transform:translateY(-2px); transition:opacity 80ms ease, transform 80ms ease; }
            .dev1-helper-tip[data-show="true"] { opacity:1; transform:translateY(0); }
            .dev1-highlighter-launch-panel, .dev1-highlighter-launch-panel * { box-sizing:border-box; letter-spacing:0; }
            .dev1-highlighter-launch-panel {
              position: fixed;
              z-index: 2147483647;
              min-height: 64px;
              width: auto;
              max-width: calc(100vw - 16px);
              box-sizing: border-box;
              padding: 12px 16px;
              border-radius: 24px;
              border: 1px solid var(--launch-panel-border);
              background: var(--launch-panel-bg);
              color: var(--launch-panel-color);
              box-shadow: 0 8px 32px rgba(0,0,0,.15), 0 4px 16px rgba(0,0,0,.1);
              display: flex;
              align-items: center;
              gap: 8px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              pointer-events: none;
              user-select: none;
              opacity: 0;
              transform: translateX(30px) scale(0.96);
              transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .dev1-highlighter-launch-panel[data-show="true"] {
              opacity: .94;
              transform: scale(1) translateX(0);
              pointer-events: auto;
            }
            .dev1-highlighter-launch-btn { width:40px; height:40px; flex:0 0 40px; margin:0; padding:0; border:0; border-radius:12px; background:var(--launch-btn-bg); color:inherit; display:inline-flex; align-items:center; justify-content:center; font-size:18px; line-height:1; box-shadow:0 2px 8px rgba(0,0,0,.1); opacity:.86; }
            .dev1-highlighter-launch-btn svg { width:18px; height:18px; display:block; fill:none; stroke:currentColor; stroke-width:2.15; stroke-linecap:round; stroke-linejoin:round; }
            .dev1-highlighter-launch-indicator { min-width:80px; height:40px; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:6px 12px; margin:0 6px; border-radius:16px; background:var(--launch-ind-bg); border:1px solid var(--launch-ind-border); box-shadow:0 2px 8px rgba(0,0,0,.1); animation:dev1HighlighterLaunchSoftPulse 900ms ease-in-out infinite; }
            .dev1-highlighter-launch-swatch { width:20px; height:20px; border-radius:7px; border:1px solid rgba(0,0,0,.12); background:#bbdefb; box-shadow:inset 0 0 0 1px rgba(255,255,255,.52); }
            .dev1-highlighter-launch-tool { width:20px; height:20px; display:inline-flex; align-items:center; justify-content:center; font-size:15px; }
            .dev1-highlighter-launch-separator { width:1px; height:20px; background:var(--launch-sep-bg); }
            .dev1-highlighter-launch-panel.dev1-highlighter-launch-vertical { flex-direction:column; min-width:64px; min-height:auto; padding:16px 12px; }
            .dev1-highlighter-launch-panel.dev1-highlighter-launch-vertical .dev1-highlighter-launch-btn { margin:4px 0; }
            .dev1-highlighter-launch-panel.dev1-highlighter-launch-vertical .dev1-highlighter-launch-indicator { min-width:40px; min-height:80px; height:auto; flex-direction:column; margin:6px 0; }
            .dev1-highlighter-launch-panel.dev1-highlighter-launch-vertical .dev1-highlighter-launch-separator { width:16px; height:1px; }
            .dev1-highlighter-launch-panel.dev1-highlighter-launch-vertical .dev1-highlighter-launch-drag { top:4px; }
            .dev1-highlighter-launch-dots { display:flex; gap:3px; margin-left:2px; }
            .dev1-highlighter-launch-dots i { width:4px; height:4px; border-radius:999px; background:#64748b; opacity:.32; animation:dev1HighlighterLaunchPulse 900ms ease-in-out infinite; }
            .dev1-highlighter-launch-dots i:nth-child(2) { animation-delay:120ms; }
            .dev1-highlighter-launch-dots i:nth-child(3) { animation-delay:240ms; }
            .dev1-highlighter-launch-drag { position:absolute; left:50%; top:2px; transform:translateX(-50%); width:56px; height:16px; border-radius:999px; opacity:.48; }
            .dev1-highlighter-launch-drag::before { content:""; position:absolute; left:50%; top:2px; transform:translateX(-50%); width:40px; height:4px; border-radius:999px; background:currentColor; opacity:.34; }
            @keyframes dev1HighlighterLaunchPulse { 0%, 80%, 100% { opacity:.22; transform:translateY(0); } 40% { opacity:.85; transform:translateY(-2px); } }
            @keyframes dev1HighlighterLaunchSoftPulse { 0%, 100% { opacity:.72; } 50% { opacity:1; } }

          </style>
          <div class="dev1-helper-root" data-open="false">
            <div class="dev1-helper-panel">
              <div class="dev1-helper-header">
                <div class="dev1-helper-title-group">
                  <div class="dev1-helper-title">${this.translate('title')}</div>
                  <div class="dev1-helper-info-wrap" data-no-drag="true">
                    <button class="dev1-helper-btn dev1-helper-info" type="button" aria-label="${this.translate('helper_info_tooltip')}" data-no-drag="true">
                      <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                    </button>
                    ${this._renderHelperInfoPopoverHtml()}
                  </div>
                </div>
                <div class="dev1-helper-feedback" aria-live="polite"></div>
                <button class="dev1-helper-btn dev1-helper-open-snapshot" type="button" aria-label="${this.translate('open_web_snapshot_tooltip')}" data-tip="${this.translate('open_web_snapshot_tooltip')}" data-no-drag="true">
                  <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3h7v7"></path><path d="M10 14L21 3"></path><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"></path></svg>
                </button>
                <button class="dev1-helper-btn dev1-helper-close" type="button" aria-label="Close">×</button>
                <button class="dev1-helper-btn dev1-helper-min" type="button" aria-label="Minimize">−</button>
              </div>
              <div class="dev1-helper-body">
                <!-- Section 1: Annotate & Save -->
                <div class="dev1-helper-section">
                  <div class="dev1-helper-section-title">${this.translate('section_archive')}</div>
                  <div class="dev1-helper-list">
                    <button class="dev1-helper-card dev1-helper-highlight" type="button" aria-label="${this.translate('highlight_tooltip')}" data-no-drag="true">
                      <div class="dev1-helper-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M12 22h9M19 13.5L14.5 9l-9 9V22h4.5l9-9zM11.5 6L16 10.5"/>
                        </svg>
                      </div>
                      <span class="dev1-helper-card-label">${this.translate('highlight_tool')}</span>
                    </button>
                    <button class="dev1-helper-card dev1-helper-md" type="button" aria-label="${this.translate('md_tooltip')}" data-no-drag="true">
                      <div class="dev1-helper-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                          <polyline points="10 9 9 9 8 9"/>
                        </svg>
                      </div>
                      <span class="dev1-helper-card-label">${this.translate('save_md')}</span>
                    </button>
                    <button class="dev1-helper-card dev1-helper-mhtml" type="button" aria-label="${this.translate('mhtml_tooltip')}" data-no-drag="true">
                      <div class="dev1-helper-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="21 8 21 21 3 21 3 8"/>
                          <rect x="1" y="3" width="22" height="5" rx="1"/>
                          <line x1="10" y1="12" x2="14" y2="12"/>
                        </svg>
                      </div>
                      <span class="dev1-helper-card-label">${this.translate('save_mhtml')}</span>
                    </button>
                  </div>
                </div>

                <!-- Section 2: Capture -->
                <div class="dev1-helper-section">
                  <div class="dev1-helper-section-title">${this.translate('section_capture')}</div>
                  <div class="dev1-helper-list">
                    <button class="dev1-helper-card dev1-helper-screenshot-area" type="button" data-no-drag="true">
                      <div class="dev1-helper-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path>
                          <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path>
                        </svg>
                      </div>
                      <span class="dev1-helper-card-label">${this.translate('screenshot_area')}</span>
                    </button>
                    <button class="dev1-helper-card dev1-helper-screenshot-full" type="button" data-no-drag="true">
                      <div class="dev1-helper-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                          <line x1="12" y1="6" x2="12" y2="18"></line>
                          <polyline points="8 14 12 18 16 14"></polyline>
                        </svg>
                      </div>
                      <span class="dev1-helper-card-label">${this.translate('screenshot_full')}</span>
                    </button>
                    <button class="dev1-helper-card dev1-helper-screen-record" type="button" data-no-drag="true">
                      <div class="dev1-helper-card-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <circle cx="12" cy="12" r="3" fill="currentColor"></circle>
                        </svg>
                      </div>
                      <span class="dev1-helper-card-label">${this.translate('screen_record')}</span>
                      <div class="dev1-helper-gear" data-no-drag="true">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div class="dev1-helper-launcher" role="button" tabindex="0" aria-expanded="false" title="${this.translate('title')}">
              <div class="dev1-helper-launcher-icon">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"></path><path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"></path></svg>
              </div>
            </div>
          </div>`;
        const root = shadow.querySelector('.dev1-helper-root');
        const panel = shadow.querySelector('.dev1-helper-panel');
        const launcher = shadow.querySelector('.dev1-helper-launcher');
        const minBtn = shadow.querySelector('.dev1-helper-min');
        const mhtmlBtn = shadow.querySelector('.dev1-helper-mhtml');
        const mdBtn = shadow.querySelector('.dev1-helper-md');
        const highlighterBtn = shadow.querySelector('.dev1-helper-highlight');
        const openSnapshotBtn = shadow.querySelector('.dev1-helper-open-snapshot');
        const areaBtn = shadow.querySelector('.dev1-helper-screenshot-area');
        const fullBtn = shadow.querySelector('.dev1-helper-screenshot-full');
        const recordBtn = shadow.querySelector('.dev1-helper-screen-record');
        const gearBtn = shadow.querySelector('.dev1-helper-gear');

        const bindTip = (button) => {
          if (!button) return;
          let tip = null;
          const removeTip = () => {
            if (tip) tip.remove();
            tip = null;
          };
          const showTip = () => {
            removeTip();
            const text = String(button.dataset.tip || '').trim();
            if (!text) return;
            tip = document.createElement('div');
            tip.className = 'dev1-helper-tip';
            tip.textContent = text;
            shadow.appendChild(tip);
            const rect = button.getBoundingClientRect();
            const tipRect = tip.getBoundingClientRect();
            const tipGap = 6;
            const left = Math.max(8, Math.min(window.innerWidth - tipRect.width - 8, rect.left + rect.width / 2 - tipRect.width / 2));
            let top = rect.bottom + tipGap;
            if (top + tipRect.height > window.innerHeight - 8) {
              top = rect.top - tipRect.height - tipGap;
            }
            top = Math.max(8, Math.min(window.innerHeight - tipRect.height - 8, top));
            tip.style.left = `${left}px`;
            tip.style.top = `${top}px`;
            requestAnimationFrame(() => {
              if (tip) tip.dataset.show = 'true';
            });
          };
          button.addEventListener('mouseenter', showTip);
          button.addEventListener('focus', showTip);
          button.addEventListener('mouseleave', removeTip);
          button.addEventListener('blur', removeTip);
          button.addEventListener('click', removeTip);
        };
        shadow.querySelector('.dev1-helper-close').addEventListener('click', () => this.destroy());
        const setOpen = (open) => {
          this._setPanelOpen(open);
        };
        launcher.addEventListener('click', () => {
          if (launcher.__dev1LastDragMoved) return;
          setOpen(root.dataset.open !== 'true');
        });
        launcher.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          setOpen(root.dataset.open !== 'true');
        });
        minBtn.addEventListener('click', () => setOpen(false));
        bindTip(openSnapshotBtn);
        this._hydrateOpenWebSnapshotShortcut();
        mhtmlBtn.addEventListener('click', () => this._saveCurrentMhtml(mhtmlBtn));
        mdBtn.addEventListener('click', () => { this._collapsePanel(); this._showMdSettingsPanel(launcher); });
        highlighterBtn.addEventListener('click', () => this._toggleHighlighter(highlighterBtn));
        openSnapshotBtn.addEventListener('click', () => this._openWebSnapshotPage());
        areaBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this._collapsePanel();
          this.startAreaScreenshot();
        });
        fullBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this._collapsePanel();
          this.startLongScreenshot();
        });
        recordBtn.addEventListener('click', (e) => {
          e.preventDefault();
          this._collapsePanel();
          this.startScreenRecording();
        });
        gearBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          this._showRecordingSettings(gearBtn);
        });
        this._bindDrag(host, launcher, { skipInteractive: false });
        this._bindDrag(host, panel.querySelector('.dev1-helper-header'), { skipInteractive: true });
        requestAnimationFrame(() => this._updateQuadrant(true));
      }

// =================================================================================
// II. HIGHLIGHTER LAUNCH & LIFECYCLE (高亮器启动与生命周期)
// =================================================================================


      _setHeaderFeedback(message = '', timeoutMs = 2400) {
        const feedback = this.shadow && this.shadow.querySelector('.dev1-helper-feedback');
        if (!feedback) return;
        feedback.textContent = String(message || '');
        if (this._headerFeedbackTimer) clearTimeout(this._headerFeedbackTimer);
        if (message && timeoutMs > 0) {
          this._headerFeedbackTimer = setTimeout(() => {
            feedback.textContent = '';
          }, timeoutMs);
        }
      }

      _normalizeHighlighterToolbarUi(value = {}) {
        const raw = value && typeof value === 'object' ? value : {};
        const validPositions = new Set(['floating', 'left', 'right', 'top', 'bottom']);
        const rawDock = raw.dockState && typeof raw.dockState === 'object' ? raw.dockState : {};
        const position = validPositions.has(raw.position)
          ? raw.position
          : (validPositions.has(rawDock.position) ? rawDock.position : 'floating');
        const left = Number(raw.left);
        const top = Number(raw.top);
        const dockAlongRaw = raw.dockAlong && typeof raw.dockAlong === 'object' ? raw.dockAlong : null;
        const dockAlongCenter = Number(dockAlongRaw && dockAlongRaw.center);
        const dockAlongSide = dockAlongRaw && validPositions.has(dockAlongRaw.side) && dockAlongRaw.side !== 'floating'
          ? dockAlongRaw.side
          : position;
        return {
          position,
          left: Number.isFinite(left) ? left : null,
          top: Number.isFinite(top) ? top : null,
          userMoved: !!raw.userMoved,
          dockState: { position, collapsed: position !== 'floating' && !!(raw.collapsed ?? rawDock.collapsed) },
          dockAlong: Number.isFinite(dockAlongCenter) && dockAlongSide !== 'floating'
            ? { side: dockAlongSide, center: dockAlongCenter }
            : null
        };
      }

      _getHighlighterStateStorageKey(url = window.location.href) {
        const tabId = Number(this.config && this.config.existingTabId);
        if (!Number.isFinite(tabId)) return '';
        return `dev1_scoped_${Math.floor(tabId)}_snapshot_highlighter_page_${hashUrl(url)}`;
      }

      _normalizeHighlighterLaunchToolbar(value = {}) {
        const raw = value && typeof value === 'object' ? value : {};
        return {
          color: String(raw.color || '#FFEB3B'),
          colorNameKey: String(raw.colorNameKey || ''),
          colorVariant: String(raw.colorVariant || ''),
          tool: String(raw.tool || 'highlight'),
          toolNameKey: String(raw.toolNameKey || raw.tool || '')
        };
      }

      async _readStoredHighlighterToolbarUi(url = window.location.href) {
        const normalizedUrl = String(url || window.location.href || '');
        if (this._highlighterToolbarUiCacheUrl === normalizedUrl && this._highlighterToolbarUiCache) {
          return this._highlighterToolbarUiCache;
        }
        const storage = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local ? chrome.storage.local : null;
        const key = this._getHighlighterStateStorageKey(normalizedUrl);
        if (!storage || !key) return null;
        try {
          const result = await new Promise(resolve => storage.get([key], resolve));
          const entry = result && result[key];
          const state = entry && typeof entry === 'object' && String(entry.u || '') === normalizedUrl ? entry.v : null;
          const toolbarUi = state && typeof state === 'object' ? state.toolbarUi : null;
          const toolbar = state && typeof state === 'object' ? state.toolbar : null;
          if ((!toolbarUi || typeof toolbarUi !== 'object') && (!toolbar || typeof toolbar !== 'object')) return null;
          const normalized = {
            ...this._normalizeHighlighterToolbarUi(toolbarUi || {}),
            toolbar: this._normalizeHighlighterLaunchToolbar(toolbar)
          };
          this._highlighterToolbarUiCache = normalized;
          this._highlighterToolbarUiCacheUrl = normalizedUrl;
          return normalized;
        } catch (_) {
          return null;
        }
      }

      _prefetchHighlighterToolbarUi() {
        const url = String(window.location.href || '');
        if (this._highlighterToolbarUiPrefetch && this._highlighterToolbarUiCacheUrl === url) return this._highlighterToolbarUiPrefetch;
        this._highlighterToolbarUiCacheUrl = url;
        this._highlighterToolbarUiPrefetch = this._readStoredHighlighterToolbarUi(url).finally(() => {
          this._highlighterToolbarUiPrefetch = null;
        });
        return this._highlighterToolbarUiPrefetch;
      }

      _getHighlighterLaunchDockCenter(toolbarUi, position) {
        const center = Number(toolbarUi && toolbarUi.dockAlong && toolbarUi.dockAlong.side === position ? toolbarUi.dockAlong.center : NaN);
        if (Number.isFinite(center)) return center;
          return position === 'left' || position === 'right'
          ? window.innerHeight / 2
          : window.innerWidth / 2;
      }

      _getHighlighterLaunchToolIcon(toolId = 'highlight') {
        const map = {
          'md-bold': 'B',
          'md-italic': 'I',
          'md-bold-italic': 'BI',
          'md-underline': 'U̲',
          'md-strikethrough': 'S̶',
          'md-mark': '==',
          'md-sup': 'X²',
          'md-sub': 'X₂',
          'md-edit-disable-highlight': '🚫',
          'md-edit-h1': 'H1',
          'md-edit-h2': 'H2',
          'md-edit-h3': 'H3',
          'md-edit-ul': '•',
          'md-edit-ol': '1.',
          'md-edit-task': '☐',
          'md-edit-quote': '>',
          'md-edit-code': '```',
          'md-edit-hr': '─',
          'md-edit-link': '🔗',
          'md-edit-image': '🖼',
          'md-edit-table': '⊞',
          'md-edit-bold': 'B',
          'md-edit-italic': 'I',
          'md-edit-bold-italic': 'BI',
          'md-edit-strikethrough': 'S̶',
          'md-edit-mark': '==',
          'md-edit-code-inline': '`',
          'md-edit-sup': 'X²',
          'md-edit-sub': 'X₂',
          underline: 'U̲',
          'double-underline': '═',
          wavy: '〰️',
          dotted: '⋯',
          dashed: '┅',
          strikethrough: 'S̶',
          'thick-underline': 'U̲̲̲',
          box: '▢',
          'filled-box': '▣',
          'rounded-box': '▢',
          'dashed-box': '⬚',
          'double-box': '▣',
          callout: '💬',
          sticker: '🏷️',
          'brackets-corner': '「」',
          'brackets-round': '()',
          'brackets-angle': '<>',
          'brackets-book': '《》',
          'brackets-cjk': '【】',
          'brackets-curly': '{}',
          'brackets-square': '[]',
          pill: '💊',
          highlight: '🖍️',
          marker: '🖊️',
          pastel: '🎨',
          neon: '⚡',
          transparent: '👻',
          'highlighter-pen': '🖊️',
          glow: '🌟',
          blur: '🌫️',
          liquidglass: '💎',
          mosaic: '▦',
          outline: 'A',
          rainbow: '🌈',
          spotlight: '🔦',
          gradient: '🎚️',
          'running-line': '⬚↻',
          'neon-blink': '🌬',
          'neon-flicker': '⚡',
          ripple: '◎',
          fluid: '🌊'
        };
        return map[String(toolId || 'highlight')] || '🖍️';
      }

      _applyHighlighterLaunchSwatch(element, colorValue = '#FFEB3B') {
        if (!element) return;
        const color = String(colorValue || '#FFEB3B').trim();
        element.style.removeProperty('background');
        element.style.removeProperty('background-image');
        if (color === 'transparent') {
          element.style.background = 'linear-gradient(45deg, rgba(148,163,184,.35) 25%, transparent 25% 50%, rgba(148,163,184,.35) 50% 75%, transparent 75%)';
          element.style.backgroundSize = '8px 8px';
          return;
        }
        if (color.startsWith('special:rainbow')) {
          element.style.background = 'linear-gradient(90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #00c7ff, #007aff, #af52de)';
          return;
        }
        if (/^#[0-9a-f]{3,6}$/i.test(color) || /^rgba?\(/i.test(color)) {
          element.style.background = color;
          return;
        }
        element.style.background = '#FFEB3B';
      }

      _calculateHighlighterLaunchPanelPosition(anchorRect, panel, toolbarUi = null) {
        const margin = 8;
        const width = Math.max(300, Math.min(360, Number(panel && panel.offsetWidth) || 320));
        const height = Math.max(64, Number(panel && panel.offsetHeight) || 64);
        
        // Default position: floating to the left of the bottom-right launcher button
        const rightEdgeOfLauncher = 18;
        const launcherWidth = 54;
        const horizontalGap = 8;
        
        const left = window.innerWidth - rightEdgeOfLauncher - launcherWidth - horizontalGap - width;
        const top = window.innerHeight - 18 - (launcherWidth / 2) - (height / 2);
        
        return {
          left: Math.max(margin, Math.min(window.innerWidth - width - margin, left)),
          top: Math.max(margin, Math.min(window.innerHeight - height - margin, top))
        };
      }

      _showHighlighterLaunchPanel(anchorRect, toolbarUi = null) {
        return null;
      }

      _hideHighlighterLaunchPanel(options = {}) {
        if (this._highlighterLaunchPanelTimer) {
          clearTimeout(this._highlighterLaunchPanelTimer);
          this._highlighterLaunchPanelTimer = null;
        }
        const panel = this.shadow && this.shadow.querySelector('.dev1-highlighter-launch-panel');
        if (!panel) return;
        panel.dataset.show = 'false';
        const remove = () => {
          try { panel.remove(); } catch (_) { }
        };
        const delay = Math.max(0, Number(options.delay) || 0) + 150;
        this._highlighterLaunchPanelTimer = setTimeout(() => {
          this._highlighterLaunchPanelTimer = null;
          remove();
        }, delay);
      }

      async _saveCurrentMhtml(button) {
        if (button && button.disabled) return;
        const labelEl = button ? button.querySelector('.dev1-helper-card-label') : null;
        const previousText = labelEl ? labelEl.textContent : '';
        if (button) {
          button.disabled = true;
          if (labelEl) labelEl.textContent = '...';
        }
        this._setHeaderFeedback(this.translate('mhtml_saving'), 0);
        const previousVisibility = this.host ? this.host.style.visibility : '';
        if (this.host) this.host.style.visibility = 'hidden';
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        try {
          const response = await sendRuntimeMessage({
            action: 'dev1SnapshotHelperSaveCurrentMhtml',
            lang: this.config.lang === 'en' ? 'en' : 'zh_CN',
            item: this.config
          }, 120000);
          if (!response || response.success !== true) throw new Error(response?.error || 'MHTML save failed');
          this._setHeaderFeedback(this.translate('mhtml_saved'));
        } catch (error) {
          this._setHeaderFeedback(`${this.translate('mhtml_failed')}: ${error?.message || error}`, 5000);
        } finally {
          if (this.host) this.host.style.visibility = previousVisibility;
          if (button) {
            button.disabled = false;
            if (labelEl) {
              labelEl.textContent = previousText || 'MHTML';
            }
          }
        }
      }


      async _saveCurrentMd(button) {
        if (button && button.disabled) return;
        const labelEl = button ? button.querySelector('.dev1-helper-card-label') : null;
        const previousText = labelEl ? labelEl.textContent : '';
        if (button) {
          button.disabled = true;
          if (labelEl) labelEl.textContent = '...';
        }
        this._setHeaderFeedback(this.translate('md_saving'), 0);
        const previousVisibility = this.host ? this.host.style.visibility : '';
        if (this.host) this.host.style.visibility = 'hidden';
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        try {
          const response = await sendRuntimeMessage({
            action: 'dev1SnapshotHelperSaveCurrentMd',
            lang: this.config.lang === 'en' ? 'en' : 'zh_CN',
            item: this.config
          }, 120000);
          if (!response || response.success !== true) throw new Error(response?.error || 'Markdown save failed');
          this._setHeaderFeedback(this.translate('md_saved'));
        } catch (error) {
          this._setHeaderFeedback(`${this.translate('md_failed')}: ${error?.message || error}`, 5000);
        } finally {
          if (this.host) this.host.style.visibility = previousVisibility;
          if (button) {
            button.disabled = false;
            if (labelEl) {
              labelEl.textContent = previousText || 'MD';
            }
          }
        }
      }

      async _openWebSnapshotPage() {
        try {
          const response = await sendRuntimeMessage({
            action: 'dev1OpenWebSnapshotPage',
            originExtensionTabId: this.config.originExtensionTabId,
            originExtensionWindowId: this.config.originExtensionWindowId
          }, 30000);
          if (!response || response.success !== true) throw new Error(response?.error || 'Open failed');
        } catch (error) {
          this._setHeaderFeedback(error?.message || 'Open failed', 5000);
        }
      }

      async _toggleHighlighter(button) {
        if (button && button.disabled) return;
        const labelEl = button ? button.querySelector('.dev1-helper-card-label') : null;
        const previousText = labelEl ? labelEl.textContent : '';
        this._resetHostDefaultPosition();
        this._updateQuadrant(true);
        const anchorRect = this._getHighlighterAnchorRect();
        const toolbarUi = null;
        
        const isLoaded = typeof window.__dev1SnapshotHighlighter !== 'undefined' && window.__dev1SnapshotHighlighter.loaded === true;
        let targetVisible = true;
        if (isLoaded) {
          const currentlyVisible = window.__dev1SnapshotHighlighter.isVisible();
          targetVisible = !currentlyVisible;
          
          const localConfig = {
            ...this.config,
            lang: this.config.lang === 'en' ? 'en' : 'zh_CN',
            source: 'snapshot_helper_highlighter',
            highlighterAnchorRect: anchorRect,
            highlighterAnchorMode: 'snapshot-helper-launcher'
          };
          
          if (targetVisible) {
            window.__dev1SnapshotHighlighter.show(localConfig);
          } else {
            window.__dev1SnapshotHighlighter.hide();
          }
        } else {
          this._showHighlighterLaunchPanel(anchorRect, toolbarUi);
        }

        const shouldCollapseOptimistically = !this._highlighterVisibleGuess;
        if (shouldCollapseOptimistically) this._collapsePanel();
        if (button) {
          button.disabled = true;
          if (labelEl) {
            labelEl.textContent = '...';
          }
        }
        try {
          const response = await sendRuntimeMessage({
            action: 'dev1SnapshotHelperToggleHighlighter',
            lang: this.config.lang === 'en' ? 'en' : 'zh_CN',
            item: {
              ...this.config,
              highlighterAnchorRect: anchorRect,
              highlighterAnchorMode: 'snapshot-helper-launcher',
              forceState: isLoaded ? (targetVisible ? 'show' : 'hide') : undefined
            }
          }, 30000);
          if (!response || response.success !== true) {
            if (!isLoaded) this._hideHighlighterLaunchPanel();
            if (response && response.pdf === true) {
              if (shouldCollapseOptimistically) this._setPanelOpen(true);
              this._setHeaderFeedback(this.translate('highlight_tool_unavailable_pdf'), 4200);
              return;
            }
            throw new Error(response?.error || this.translate('highlight_tool_failed'));
          }
          this._highlighterVisibleGuess = response.visible !== false;
          if (!isLoaded) this._hideHighlighterLaunchPanel();
          if (response.visible !== false) this._collapsePanel();
          else if (shouldCollapseOptimistically) this._setPanelOpen(true);
          this._setHeaderFeedback(response.visible === false
            ? this.translate('highlight_tool_hidden')
            : this.translate('highlight_tool_ready'));
        } catch (error) {
          if (!isLoaded) this._hideHighlighterLaunchPanel();
          if (shouldCollapseOptimistically) this._setPanelOpen(true);
          this._setHeaderFeedback(`${this.translate('highlight_tool_failed')}: ${error?.message || error}`, 5000);
        } finally {
          if (button) {
            button.disabled = false;
            if (labelEl) {
              labelEl.textContent = previousText || this.translate('highlight_tool');
            }
          }
        }
      }

      _getHighlighterAnchorRect() {
        const right = window.innerWidth - 18;
        const bottom = window.innerHeight - 18;
        return {
          left: right - 54,
          top: bottom - 54,
          right,
          bottom,
          width: 54,
          height: 54,
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        };
      }


      async _captureVisibleTab() {
        if (this.host) this.host.style.visibility = 'hidden';
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        try {
          const response = await sendRuntimeMessage({ action: 'dev1SnapshotHelperCaptureVisibleTab' }, 60000);
          if (!response || response.success !== true || !response.dataUrl) throw new Error(response?.error || 'captureVisibleTab failed');
          return response;
        } finally {
          if (this.host) this.host.style.visibility = '';
        }
      }

      async _saveBlob(blob, kind, extension, mimeType) {
        const url = URL.createObjectURL(blob);
        try {
          const response = await sendRuntimeMessage({
            action: 'dev1SnapshotHelperDownloadBlob',
            url,
            kind,
            extension,
            lang: this.config.lang === 'en' ? 'en' : 'zh_CN',
            mimeType: mimeType || blob.type || 'application/octet-stream',
            item: this.config
          }, 120000);
          if (!response || response.success !== true) throw new Error(response?.error || 'Download failed');
          return response;
        } finally {
          setTimeout(() => { try { URL.revokeObjectURL(url); } catch (_) { } }, 600000);
        }
      }

      show(config) {
        this.config = normalizeConfig(config);
        this._renderPanel();
        this._resetHostDefaultPosition();
        if (this.host) this.host.style.display = '';
        this._updateQuadrant(true);
        this._persistAutoRestoreMarker();
        return { success: true };
      }

      openPanel(config) {
        const response = this.show(config || this.config);
        this._setPanelOpen(true);
        return { ...(response || {}), open: true };
      }

      isVisible() {
        const host = this.host || document.getElementById(HOST_ID);
        return !!(host && host.isConnected && host.style.display !== 'none');
      }

      hidePanel() {
        if (typeof this.activeSessionCleanup === 'function') {
          try { this.activeSessionCleanup(); } catch (_) { }
          this.activeSessionCleanup = null;
        }
        this._hideHighlighterLaunchPanel();
        this._removeRecordingSettingsPanel();
        if (this.host) this.host.style.display = 'none';

        const hlApi = window.__dev1SnapshotHighlighter;
        if (hlApi && typeof hlApi.hide === 'function') {
          try { hlApi.hide(); } catch (_) {}
        }
        this._clearAutoRestoreMarker();

        return { success: true };
      }

      destroy() {
        this._removeUrlChangeListener();
        if (typeof this.activeSessionCleanup === 'function') {
          try { this.activeSessionCleanup(); } catch (_) { }
          this.activeSessionCleanup = null;
        }
        if (typeof this._longShotStabilityCleanup === 'function') {
          try { this._longShotStabilityCleanup(); } catch (_) { }
          this._longShotStabilityCleanup = null;
        }
        if (this._headerFeedbackTimer) {
          clearTimeout(this._headerFeedbackTimer);
          this._headerFeedbackTimer = null;
        }
        this._hideHighlighterLaunchPanel();
        this._removeRecordingSettingsPanel();
        this._removeMdSettingsPanel();
        this._removeMarkdownSourceHighlight();
        this._removeZoomInvariantContainer();
        if (this.host) {
          try { this.host.remove(); } catch (_) { }
        } else {
          const host = document.getElementById(HOST_ID);
          if (host) {
            try { host.remove(); } catch (_) { }
          }
        }
        this.host = null;
        this.shadow = null;

        const hlApi = window.__dev1SnapshotHighlighter;
        if (hlApi && typeof hlApi.hide === 'function') {
          try { hlApi.hide(); } catch (_) {}
        }
        this._clearAutoRestoreMarker();

        return { success: true };
      }

      _getRecordingSettingsPanel() {
        return (this.shadow && this.shadow.querySelector('#recording-settings-panel')) || document.getElementById('recording-settings-panel');
      }

      _removeRecordingSettingsPanel() {
        const settings = this._getRecordingSettingsPanel();
        if (settings) settings.remove();
      }

      _collapsePanel() {
        this._setPanelOpen(false);
      }

      _setPanelOpen(open) {
        const root = this.shadow && this.shadow.querySelector('.dev1-helper-root');
        const launcher = this.shadow && this.shadow.querySelector('.dev1-helper-launcher');
        if (root) root.dataset.open = open ? 'true' : 'false';
        if (launcher) launcher.setAttribute('aria-expanded', open ? 'true' : 'false');
        if (open) this._updateQuadrant(true);
        if (!open) {
          this._removeRecordingSettingsPanel();
        }
      }


    // ===== Zoom-Invariant Fixed Layer for Screenshot/Recording UI =====
    // Creates and returns a container that floats above the page, unaffected by page zoom
    _getZoomInvariantContainer() {
      const containerId = 'zoom-invariant-fixed-layer';
      let container = document.getElementById(containerId);

      // Get current document zoom level
      const currentZoom = getDocumentZoom();
      const inverseZoom = 1 / currentZoom;

      if (container) {
        // Update inverse zoom compensation
        this._updateZoomInvariantContainerZoom(container, currentZoom);
        return container;
      }

      container = document.createElement('div');
      container.id = containerId;
      // Apply inverse zoom to counteract document-level zoom (only use CSS zoom, not transform)
      container.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: ${100 * currentZoom}vw !important;
        height: ${100 * currentZoom}vh !important;
        pointer-events: none !important;
        z-index: 2147483647 !important;
        zoom: ${inverseZoom} !important;
        transform-origin: 0 0 !important;
        overflow: visible !important;
      `;
      document.body.appendChild(container);

      // Listen for zoom changes to update compensation
      const self = this;
      const updateZoomCompensation = () => {
        try {
          const newZoom = getDocumentZoom();
          self._updateZoomInvariantContainerZoom(container, newZoom);
        } catch (_) { }
      };

      // Store the handler for cleanup
      container._zoomHandler = updateZoomCompensation;
      window.addEventListener('pdfViewZoomApplied', updateZoomCompensation);
      window.addEventListener('resize', updateZoomCompensation);

      // Also poll for changes in case events are missed (PDF zoom can change via many paths)
      container._zoomPollInterval = setInterval(updateZoomCompensation, 200);

      return container;
    }

    // Update zoom compensation on the container
    _updateZoomInvariantContainerZoom(container, currentZoom) {
      if (!container) return;
      const inverseZoom = 1 / currentZoom;
      container.style.zoom = String(inverseZoom);
      container.style.width = `${100 * currentZoom}vw`;
      container.style.height = `${100 * currentZoom}vh`;
    }

    // Remove the zoom-invariant container when no longer needed
    _removeZoomInvariantContainer() {
      const container = document.getElementById('zoom-invariant-fixed-layer');
      if (container && container.childElementCount === 0) {
        // Remove event listeners and interval
        if (container._zoomHandler) {
          window.removeEventListener('pdfViewZoomApplied', container._zoomHandler);
          window.removeEventListener('resize', container._zoomHandler);
        }
        if (container._zoomPollInterval) {
          clearInterval(container._zoomPollInterval);
        }
        container.remove();
      }
    }

    _prepareLongScreenshotStability() {
      if (typeof this._longShotStabilityCleanup === 'function') {
        try { this._longShotStabilityCleanup(); } catch (_) { }
        this._longShotStabilityCleanup = null;
      }

      const root = document.documentElement;
      const body = document.body;
      if (!root || !body) return () => { };

      const styleId = 'dev1-longshot-stability-style';
      let styleEl = document.getElementById(styleId);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = `
          html.dev1-longshot-active,
          body.dev1-longshot-active {
            scroll-behavior: auto !important;
            overscroll-behavior: auto !important;
          }
          html.dev1-longshot-active,
          body.dev1-longshot-active,
          html.dev1-longshot-active body {
            scrollbar-width: none !important;
          }
          html.dev1-longshot-active::-webkit-scrollbar,
          body.dev1-longshot-active::-webkit-scrollbar,
          html.dev1-longshot-active body::-webkit-scrollbar {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
          }
          html.dev1-longshot-active *:not(#zoom-invariant-fixed-layer):not(#zoom-invariant-fixed-layer *) {
            transition-duration: 0s !important;
            transition-delay: 0s !important;
            animation-duration: 0s !important;
            animation-delay: 0s !important;
            animation-play-state: paused !important;
            scroll-behavior: auto !important;
          }
          .dev1-longshot-hide-fixed {
            opacity: 0 !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }
          .dev1-longshot-unstick {
            position: relative !important;
            inset: auto !important;
            top: auto !important;
            right: auto !important;
            bottom: auto !important;
            left: auto !important;
          }
        `;
        (document.head || root).appendChild(styleEl);
      }

      root.classList.add('dev1-longshot-active');
      body.classList.add('dev1-longshot-active');

      const touchedElements = new Set();
      const shouldSkip = (el) => {
        if (!(el instanceof HTMLElement)) return true;
        const tag = String(el.tagName || '').toUpperCase();
        if (tag === 'HTML' || tag === 'BODY') return true;
        if (el.id === HOST_ID || el.closest(`#${HOST_ID}`)) return true;
        if (el.closest('#zoom-invariant-fixed-layer')) return true;
        return false;
      };

      const markElement = (el) => {
        if (shouldSkip(el)) return;
        let position = '';
        try {
          position = String(getComputedStyle(el).position || '');
        } catch (_) {
          return;
        }
        if (position === 'fixed') {
          if (!el.classList.contains('dev1-longshot-hide-fixed')) {
            el.classList.add('dev1-longshot-hide-fixed');
            touchedElements.add(el);
          }
          return;
        }
        if (position === 'sticky') {
          if (!el.classList.contains('dev1-longshot-unstick')) {
            el.classList.add('dev1-longshot-unstick');
            touchedElements.add(el);
          }
        }
      };

      const scanNode = (node) => {
        if (!(node instanceof HTMLElement)) return;
        markElement(node);
        node.querySelectorAll('*').forEach(markElement);
      };

      scanNode(body);

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes') {
            markElement(mutation.target);
            return;
          }
          mutation.addedNodes.forEach((node) => {
            scanNode(node);
          });
        });
      });
      observer.observe(body, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });

      const cleanup = () => {
        observer.disconnect();
        touchedElements.forEach((el) => {
          if (!(el instanceof HTMLElement)) return;
          el.classList.remove('dev1-longshot-hide-fixed');
          el.classList.remove('dev1-longshot-unstick');
        });
        root.classList.remove('dev1-longshot-active');
        body.classList.remove('dev1-longshot-active');
        if (this._longShotStabilityCleanup === cleanup) {
          this._longShotStabilityCleanup = null;
        }
      };

      this._longShotStabilityCleanup = cleanup;
      return cleanup;
    }

    async _persistAutoRestoreMarker() {
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      const tabId = this.config && this.config.existingTabId;
      const url = this.config && this.config.url;
      if (tabId == null || !url) return;
      const key = `dev1_snapshot_helper_autorestore_${Math.floor(tabId)}_${hashUrl(url)}`;
      try {
        await new Promise((resolve, reject) => {
          chrome.storage.local.set({
            [key]: {
              v: 1,
              tabId,
              url,
              config: this.config || {},
              visible: true,
              updatedAt: Date.now()
            }
          }, () => {
            if (chrome.runtime && chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
          });
        });

        // Register key to dev1ActiveTabKeys
        try {
          const regData = await new Promise(r => chrome.storage.local.get(['dev1ActiveTabKeys'], r));
          const reg = regData?.dev1ActiveTabKeys || {};
          const idStr = String(tabId);
          if (!reg[idStr]) reg[idStr] = [];
          if (!reg[idStr].includes(key)) {
            reg[idStr].push(key);
            await new Promise(r => chrome.storage.local.set({ dev1ActiveTabKeys: reg }, r));
          }
        } catch (_) {}
      } catch (_) {}
    }

    async _clearAutoRestoreMarker() {
      if (!chrome || !chrome.storage || !chrome.storage.local) return;
      const tabId = this.config && this.config.existingTabId;
      const url = this.config && this.config.url;
      if (tabId == null || !url) return;
      const key = `dev1_snapshot_helper_autorestore_${Math.floor(tabId)}_${hashUrl(url)}`;
      try {
        await new Promise(resolve => chrome.storage.local.remove(key, resolve));

        // Unregister key from dev1ActiveTabKeys
        try {
          const regData = await new Promise(r => chrome.storage.local.get(['dev1ActiveTabKeys'], r));
          const reg = regData?.dev1ActiveTabKeys || {};
          const idStr = String(tabId);
          if (reg[idStr]) {
            reg[idStr] = reg[idStr].filter(k => k !== key);
            await new Promise(r => chrome.storage.local.set({ dev1ActiveTabKeys: reg }, r));
          }
        } catch (_) {}
      } catch (_) {}
    }

    _getScopedStorage() {
      return window.__dev1TabScopedStorage || null;
    }

    _getCurrentUrl() {
      return String(this.config?.url || location.href || '').trim();
    }

    _buildMarkdownDefaultTemplate(metadata = {}, urlOverride = '') {
      const defaultTemplate = `---\ntitle: "{{title}}"\nsource: "{{url}}"\nauthor: "{{author}}"\npublished: "{{published}}"\ncreated: "{{created}}"\ndescription: "{{description}}"\ntags:\n  - clippings\n---\n\n{{content}}`;
      const sourceMetadata = metadata && typeof metadata === 'object' ? metadata : {};
      const titleVal = sourceMetadata.title || this.config?.title || document.title || '';
      const urlVal = urlOverride || this.config?.url || this._getCurrentUrl();
      const authorVal = sourceMetadata.author || '';
      const publishedVal = sourceMetadata.published || '';
      const createdVal = new Date().toISOString().split('T')[0];
      const descVal = sourceMetadata.description || '';

      return defaultTemplate
        .replace(/\{\{title\}\}/g, titleVal)
        .replace(/\{\{url\}\}/g, urlVal)
        .replace(/\{\{author\}\}/g, authorVal)
        .replace(/\{\{published\}\}/g, publishedVal)
        .replace(/\{\{created\}\}/g, createdVal)
        .replace(/\{\{description\}\}/g, descVal);
    }

    _getMdSettingsPanel() {
      return (this.shadow && this.shadow.querySelector('#md-settings-panel')) || document.getElementById('md-settings-panel');
    }

    _removeMdSettingsPanel() {
      if (this._mdSaveTimer) {
        clearTimeout(this._mdSaveTimer);
        this._mdSaveTimer = null;
      }
      const settings = this._getMdSettingsPanel();
      if (settings) {
        if (typeof settings._closeHelpPopover === 'function') {
          settings._closeHelpPopover();
        }
        if (settings._resizeHandler) {
          window.removeEventListener('resize', settings._resizeHandler);
          window.removeEventListener('scroll', settings._resizeHandler);
        }
        const tocPanel = (this.shadow && this.shadow.querySelector('#md-toc-panel')) || document.getElementById('md-toc-panel');
        if (tocPanel) {
          if (tocPanel._observer) {
            tocPanel._observer.disconnect();
          }
          if (tocPanel._cleanupListeners) {
            tocPanel._cleanupListeners();
          }
          tocPanel.remove();
        }
        settings.remove();
      }
      this._removeMarkdownSourceHighlight();
      this._mdSettingsAnchor = null;
      this._mdTextarea = null;
      this._mdNotesArea = null;
      this._mdArticleArea = null;
    }

    _setupUrlChangeListener() {
      if (this._urlChangeListener) return;
      this._urlChangeListener = async () => {
        const newUrl = String(location.href || '').trim();
        if (this.config && this.config.url && this.config.url !== newUrl) {
          // 1. 如果面板处于打开状态，清除 pending saveTimer 并立即保存旧页面数据
          if (this._getMdSettingsPanel() && this._mdTextarea && this._mdNotesArea && this._mdArticleArea) {
            if (this._mdSaveTimer) {
              clearTimeout(this._mdSaveTimer);
              this._mdSaveTimer = null;
            }
            const oldUrl = this.config.url;
            const tabId = this.config.existingTabId;
            const scoped = this._getScopedStorage();
            if (scoped && tabId != null) {
              try {
                await scoped.setScoped(tabId, 'md_content', oldUrl, this._mdTextarea.value);
                await scoped.setScoped(tabId, 'md_notes', oldUrl, this._mdNotesArea.value);
                await scoped.setScoped(tabId, 'md_article', oldUrl, this._mdArticleArea.value);
              } catch (e) { console.error(e); }
            }
          }

          // 2. 更新 config 的 URL 为新 URL
          this.config.url = newUrl;

          // 3. 如果面板处于打开状态，从 scoped 存储加载新页面数据，并触发提取新文章正文（如果新页面没有缓存数据）
          if (this._getMdSettingsPanel() && this._mdTextarea && this._mdNotesArea && this._mdArticleArea) {
            const tabId = this.config.existingTabId;
            const scoped = this._getScopedStorage();
            let newContent = null;
            let newNotes = '';
            let newArticle = '';
            let metadata = null;
            if (scoped && tabId != null) {
              try {
                newContent = await scoped.getScoped(tabId, 'md_content', newUrl);
                const storedNotes = await scoped.getScoped(tabId, 'md_notes', newUrl);
                if (storedNotes != null) newNotes = storedNotes;
                const storedArticle = await scoped.getScoped(tabId, 'md_article', newUrl);
                if (storedArticle != null) newArticle = storedArticle;
              } catch (e) { console.error(e); }
            }

            // 如果新页面没有缓存正文，则抓取新页面的正文
            if (!newArticle) {
              try {
                const response = await sendRuntimeMessage({ action: 'dev1SnapshotHelperGetArticleContent' }, 30000);
                if (response && response.success) {
                  newArticle = response.article;
                  metadata = response.metadata;
                } else {
                  newArticle = '[正文提取失败]';
                }
              } catch (e) {
                newArticle = '[正文提取超时或出错]';
              }
            }

            if (newContent == null) {
              newContent = this._buildMarkdownDefaultTemplate(metadata, newUrl);
            }

            // 更新文本区域的内容
            this._mdTextarea.value = newContent || '';
            this._mdNotesArea.value = newNotes || '';
            this._mdArticleArea.value = newArticle || '';

            // 重置选区记忆
            this._mdTextarea.selectionStart = this._mdTextarea.selectionEnd = 0;
            if (this._mdTextarea.__dev1MdLastSelection) {
              this._mdTextarea.__dev1MdLastSelection = { start: 0, end: 0 };
            }
            this._mdNotesArea.selectionStart = this._mdNotesArea.selectionEnd = 0;
            if (this._mdNotesArea.__dev1MdLastSelection) {
              this._mdNotesArea.__dev1MdLastSelection = { start: 0, end: 0 };
            }
            this._mdArticleArea.selectionStart = this._mdArticleArea.selectionEnd = 0;
            if (this._mdArticleArea.__dev1MdLastSelection) {
              this._mdArticleArea.__dev1MdLastSelection = { start: 0, end: 0 };
            }
          }
        }
      };

      window.addEventListener('popstate', this._urlChangeListener);
      window.addEventListener('hashchange', this._urlChangeListener);
      window.addEventListener('dev1SnapshotHighlighterUrlChange', this._urlChangeListener);
    }

    _removeUrlChangeListener() {
      if (this._urlChangeListener) {
        window.removeEventListener('popstate', this._urlChangeListener);
        window.removeEventListener('hashchange', this._urlChangeListener);
        window.removeEventListener('dev1SnapshotHighlighterUrlChange', this._urlChangeListener);
        this._urlChangeListener = null;
      }
    }

// =================================================================================
// III. SCREENSHOT & RECORDING CONTROLS (截图与录屏控制)
// =================================================================================


    // 显示录屏设置面板
    async _showRecordingSettings(anchor) {
      console.log('_showRecordingSettings called');

      if (!this._codecCheckPromise) {
        this._codecCheckPromise = this._checkAllCodecsSupport();
      }

      // 移除已存在的设置面板
      const existing = this._getRecordingSettingsPanel();
      if (existing) { existing.remove(); return; }

      const t = (key, fallback) => (this.t && this.t(key)) || fallback;
      const isDark = this.darkModeEnabled;

      const root = this.shadow && this.shadow.querySelector('.dev1-helper-root');
      let positionStyle = 'bottom: 64px; right: 0;';
      if (root) {
        if (root.classList.contains('pos-bottom-left')) {
          positionStyle = 'bottom: 64px; left: 0;';
        } else if (root.classList.contains('pos-top-right')) {
          positionStyle = 'top: 64px; right: 0;';
        } else if (root.classList.contains('pos-top-left')) {
          positionStyle = 'top: 64px; left: 0;';
        }
      }

      const panel = document.createElement('div');
      panel.id = 'recording-settings-panel';
      if (!root) {
        const rect = anchor.getBoundingClientRect();
        const PANEL_WIDTH = 280;
        const PANEL_HEIGHT = 370;
        let left = rect.left - (PANEL_WIDTH / 2) + (rect.width / 2);
        if (left + PANEL_WIDTH > window.innerWidth) left = window.innerWidth - PANEL_WIDTH - 10;
        if (left < 10) left = 10;
        let top = rect.bottom + 10;
        if (top + PANEL_HEIGHT > window.innerHeight) {
          top = rect.top - PANEL_HEIGHT - 10;
          if (top < 10) top = Math.max(10, window.innerHeight - PANEL_HEIGHT - 10);
        }
        panel.style.cssText = `
          position: fixed;
          top: ${top}px;
          left: ${left}px;
          width: 280px;
          padding: 16px;
          background: ${isDark ? 'var(--panel-bg, #1f1f1f)' : 'var(--panel-bg, #f0f4f8)'};
          border: 1px solid var(--panel-border, ${isDark ? '#3b3b3b' : '#cbd5e1'});
          border-radius: 20px;
          box-shadow: var(--panel-shadow, 0 10px 40px rgba(0,0,0,0.3));
          z-index: 2147483648;
          font-size: 13px;
          color: var(--text-main, ${isDark ? '#e2e8f0' : '#1e293b'});
          pointer-events: auto !important;
          backdrop-filter: var(--backdrop-filter);
          -webkit-backdrop-filter: var(--backdrop-filter);
        `;
      }

      let closeHandler = null;
      const closePanel = () => {
        panel.remove();
        if (closeHandler) document.removeEventListener('click', closeHandler);
      };

      // 标题
      const title = document.createElement('div');
      title.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; position: relative;';
      
      const titleLabel = document.createElement('div');
      titleLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; flex: 1;';
      
      const iconSpan = document.createElement('span');
      iconSpan.style.display = 'flex';
      iconSpan.style.alignItems = 'center';
      iconSpan.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>';
      titleLabel.appendChild(iconSpan);

      const titleText = document.createElement('span');
      titleText.textContent = t('recording_settings', '录制设置');
      titleLabel.appendChild(titleText);

      // 提示说明按钮
      const infoBtn = document.createElement('button');
      infoBtn.type = 'button';
      infoBtn.textContent = '?';
      infoBtn.title = t('recording_settings_info_title', '录制说明');
      infoBtn.setAttribute('aria-label', t('recording_settings_info_title', '录制说明'));
      infoBtn.style.cssText = `
        box-sizing: border-box !important;
        appearance: none !important;
        -webkit-appearance: none !important;
        outline: none !important;
        border: 1px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.18)'} !important;
        border-radius: 999px !important;
        background: ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'} !important;
        color: ${isDark ? '#e2e8f0' : '#475569'} !important;
        width: 20px !important;
        height: 20px !important;
        min-width: 20px !important;
        padding: 0 !important;
        font-size: 11px !important;
        font-weight: 700 !important;
        font-family: inherit !important;
        cursor: pointer !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: auto !important;
        transition: all 0.2s ease !important;
        margin-left: 6px !important;
        line-height: 1 !important;
      `;
      
      infoBtn.addEventListener('mouseenter', () => {
        infoBtn.style.setProperty('background', isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)', 'important');
        infoBtn.style.setProperty('color', '#3b82f6', 'important');
        infoBtn.style.setProperty('border-color', '#3b82f6', 'important');
      });
      infoBtn.addEventListener('mouseleave', () => {
        infoBtn.style.setProperty('background', isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)', 'important');
        infoBtn.style.setProperty('color', isDark ? '#e2e8f0' : '#475569', 'important');
        infoBtn.style.setProperty('border-color', isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.18)', 'important');
      });
      
      const isChinese = (this.config && this.config.lang) !== 'en';
      infoBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const helpPanelId = 'recording-settings-help-panel';
        let helpPanel = panel.querySelector('#' + helpPanelId);
        if (helpPanel) {
          helpPanel.remove();
        } else {
          helpPanel = document.createElement('div');
          helpPanel.id = helpPanelId;
          helpPanel.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: ${isDark ? 'var(--panel-bg, #1f1f1f)' : 'var(--panel-bg, #f0f4f8)'};
            border: 1px solid var(--panel-border, ${isDark ? '#3b3b3b' : '#cbd5e1'});
            border-radius: 19px;
            padding: 12px 10px;
            z-index: 10;
            display: flex;
            flex-direction: column;
            color: var(--text-main, ${isDark ? '#e2e8f0' : '#1e293b'});
            box-sizing: border-box;
            pointer-events: auto !important;
          `;

          const scrollbarStyle = document.createElement('style');
          scrollbarStyle.textContent = `
            #${helpPanelId} ul::-webkit-scrollbar {
              width: 5px !important;
              height: 5px !important;
            }
            #${helpPanelId} ul::-webkit-scrollbar-track {
              background: transparent !important;
            }
            #${helpPanelId} ul::-webkit-scrollbar-thumb {
              background: ${isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)'} !important;
              border-radius: 10px !important;
            }
            #${helpPanelId} ul::-webkit-scrollbar-thumb:hover {
              background: ${isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)'} !important;
            }
          `;
          helpPanel.appendChild(scrollbarStyle);
          
          const helpTitle = document.createElement('div');
          helpTitle.style.cssText = 'font-weight: 750 !important; font-size: 14px !important; margin-bottom: 12px !important; text-align: left !important;';
          helpTitle.textContent = t('recording_settings_info_title', '录制说明');
          
          const list = document.createElement('ul');
          list.style.cssText = 'margin: 0 0 12px 14px !important; padding: 0 6px 0 0 !important; font-size: 12px !important; line-height: 1.5 !important; flex: 1 !important; overflow-y: auto !important;';
          
          const items = isChinese ? [
            '<strong style="color: #f97316;">不要改变窗口大小</strong>：录屏中途调整窗口会导致裁剪偏移、边缘露出红线。',
            '<strong>视频缓存自动释放</strong>：录制完点击“保存并删除缓存”或“取消”都会瞬间彻底清空内存。',
            '<strong>日常网页与办公</strong>：推荐使用 <strong>MP4 (H.264) + 60 FPS + 10M/20Mbps</strong>（兼容性最好，文件小）。',
            '<strong>高刷新率 (120/240fps)</strong>：必须搭配 <strong>50M/100Mbps</strong> 码率（码率太低会导致运动画面变糊）。',
            '<strong>网页视频 / 3D / 复杂动效</strong>：推荐 <strong>MP4 + 50M/100Mbps</strong>（防止剧烈运动时画面出现马赛克）。',
            '<strong style="color: #f97316;">动态高亮 (流动线框/波纹)</strong>：推荐使用 <strong>60 FPS + 20M/50Mbps</strong>（保证高亮动画流动丝滑、无毛刺）。',
            '<strong style="color: #f97316;">页面高亮过多导致卡顿</strong>：限制在 <strong>60 FPS</strong>，码率选 <strong>20Mbps</strong>（降低 CPU/GPU 负荷，防止掉帧）。',
            '<strong>播放黑屏或打不开</strong>：首选 <strong>MP4</strong> 格式；遇到旧设备兼容问题可切换 <strong>WebM</strong> 备用。'
          ] : [
            '<strong style="color: #f97316;">Do not resize window</strong>: Resizing during recording causes crop shifts and exposes the red border.',
            '<strong>Auto memory release</strong>: Canceling or saving will instantly clear all RAM video caches.',
            '<strong>General Web Recording</strong>: Recommended <strong>MP4 (H.264) + 60 FPS + 10M/20Mbps</strong> (Best compatibility & size).',
            '<strong>High FPS (120/240fps)</strong>: Must use <strong>50M/100Mbps</strong> (Low bitrates will cause blurry frames).',
            '<strong>Videos / 3D / Complex Animations</strong>: Recommended <strong>MP4 + 50M/100Mbps</strong> (Prevents pixelation during fast motions).',
            '<strong style="color: #f97316;">Dynamic Highlights (Running Line/Ripple)</strong>: Use <strong>60 FPS + 20M/50Mbps</strong> (Keeps border animation sharp & smooth).',
            '<strong style="color: #f97316;">Stuttering due to too many highlights</strong>: Limit to <strong>60 FPS</strong>, select <strong>20Mbps</strong> (Reduces CPU/GPU load).',
            '<strong>Player issues / Black screen</strong>: Use <strong>MP4</strong> (Best player compatibility). Use <strong>WebM</strong> as a fallback on old devices.'
          ];
          
          items.forEach(text => {
            const li = document.createElement('li');
            li.style.cssText = 'margin: 8px 0 !important; text-align: left !important; list-style-type: disc !important;';
            li.innerHTML = text;
            list.appendChild(li);
          });
          
          const closeHelpBtn = document.createElement('button');
          closeHelpBtn.type = 'button';
          closeHelpBtn.textContent = t('got_it', isChinese ? '知道了' : 'Got it');
          closeHelpBtn.style.cssText = `
            width: 100% !important;
            height: 32px !important;
            background: linear-gradient(135deg, #1976d2, #42a5f5) !important;
            color: #fff !important;
            border: 0 !important;
            border-radius: 8px !important;
            cursor: pointer !important;
            font-weight: 600 !important;
            font-size: 13px !important;
            transition: opacity 0.2s !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            pointer-events: auto !important;
            outline: none !important;
            box-shadow: 0 2px 6px rgba(25, 118, 210, 0.2) !important;
          `;
          closeHelpBtn.addEventListener('mouseenter', () => closeHelpBtn.style.setProperty('opacity', '0.9', 'important'));
          closeHelpBtn.addEventListener('mouseleave', () => closeHelpBtn.style.setProperty('opacity', '1', 'important'));
          closeHelpBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            helpPanel.remove();
          });
          
          helpPanel.appendChild(helpTitle);
          helpPanel.appendChild(list);
          helpPanel.appendChild(closeHelpBtn);
          panel.appendChild(helpPanel);
        }
      });
      titleLabel.appendChild(infoBtn);

      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.textContent = '×';
      closeBtn.title = t('recording_settings_close', '关闭录制设置');
      closeBtn.setAttribute('aria-label', t('recording_settings_close', '关闭录制设置'));
      closeBtn.style.cssText = `
        width: 24px;
        height: 24px;
        border: 0;
        border-radius: 7px;
        background: var(--btn-min-hover, ${isDark ? '#374151' : '#e2e8f0'});
        color: var(--text-muted, ${isDark ? '#e2e8f0' : '#475569'});
        cursor: pointer;
        font-size: 16px;
        line-height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        closePanel();
      });
      title.appendChild(titleLabel);
      title.appendChild(closeBtn);
      panel.appendChild(title);

      // 创建设置项
      const createSettingRow = (labelText, options, storageKey, defaultValue) => {
        const row = document.createElement('div');
        row.className = 'settings-row-' + storageKey;
        row.style.cssText = 'margin-bottom: 14px;';

        const label = document.createElement('div');
        label.textContent = labelText;
        label.style.cssText = 'font-size: 12px; color: var(--row-label-color, ' + (isDark ? '#9ca3af' : '#64748b') + '); margin-bottom: 8px;';
        row.appendChild(label);

        const btnGroup = document.createElement('div');
        btnGroup.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap;';

        let saved = defaultValue;
        try { saved = localStorage.getItem(storageKey) || defaultValue; } catch (_) { }

        options.forEach(opt => {
          const btn = document.createElement('button');
          btn.textContent = opt.label;
          btn.dataset.value = opt.value;
          const isActive = saved === opt.value;
          const isDisabled = opt.disabled;

          btn.style.cssText = `
            padding: 6px 12px;
            border-radius: 6px;
            border: 1px solid ${isActive ? '#3b82f6' : `var(--btn-border, ${isDark ? '#3b3b3b' : '#e2e8f0'})`};
            background: ${isActive ? `var(--btn-active-bg, ${isDark ? '#1e3a5f' : '#dbeafe'})` : `var(--btn-bg, ${isDark ? '#2d2d2d' : '#f8fafc'})`};
            color: ${isActive ? '#3b82f6' : `var(--btn-color, ${isDark ? '#e2e8f0' : '#475569'})`};
            cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
            font-size: 12px;
            opacity: ${isDisabled ? '0.4' : '1'};
            transition: all 0.15s ease;
            display: ${isDisabled ? 'none' : ''};
          `;

          if (isActive) {
            btn.classList.add('active');
          }

          if (!isDisabled) {
            btn.addEventListener('click', () => {
              btnGroup.querySelectorAll('button').forEach(b => {
                b.style.border = `1px solid var(--btn-border, ${isDark ? '#3b3b3b' : '#e2e8f0'})`;
                b.style.background = `var(--btn-bg, ${isDark ? '#2d2d2d' : '#f8fafc'})`;
                b.style.color = `var(--btn-color, ${isDark ? '#e2e8f0' : '#475569'})`;
                b.classList.remove('active');
              });
              btn.style.border = '1px solid #3b82f6';
              btn.style.background = `var(--btn-active-bg, ${isDark ? '#1e3a5f' : '#dbeafe'})`;
              btn.style.color = '#3b82f6';
              btn.classList.add('active');
              try { localStorage.setItem(storageKey, opt.value); } catch (_) { }

              if (storageKey === 'record_format') {
                updateSettingPanelState();
              }
            });
          }

          btnGroup.appendChild(btn);
        });

        row.appendChild(btnGroup);
        return row;
      };

      // 动态更新面板禁用状态
      const updateSettingPanelState = () => {
        let format = 'mp4';
        try { format = localStorage.getItem('record_format') || (webCodecsSupported ? 'mp4' : 'webm'); } catch (_) {}

        const codecRow = panel.querySelector('.settings-row-record_codec');
        const qualityRow = panel.querySelector('.settings-row-record_quality');
        const fpsRow = panel.querySelector('.settings-row-record_fps');

        if (!codecRow || !qualityRow || !fpsRow) return;

        const setButtonEnabled = (btn, enabled) => {
          if (enabled) {
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';
            btn.style.cursor = 'pointer';
            btn.disabled = false;
            btn.style.display = '';
          } else {
            btn.style.opacity = '0.4';
            btn.style.pointerEvents = 'none';
            btn.style.cursor = 'not-allowed';
            btn.disabled = true;
            btn.style.border = `1px solid var(--btn-border, ${isDark ? '#3b3b3b' : '#e2e8f0'})`;
            btn.style.background = `var(--btn-bg, ${isDark ? '#2d2d2d' : '#f8fafc'})`;
            btn.style.color = `var(--btn-color, ${isDark ? '#e2e8f0' : '#475569'})`;
            btn.classList.remove('active');
            btn.style.display = 'none';
          }
        };

        const setButtonActive = (btn) => {
          btn.style.border = '1px solid #3b82f6';
          btn.style.background = `var(--btn-active-bg, ${isDark ? '#1e3a5f' : '#dbeafe'})`;
          btn.style.color = '#3b82f6';
          btn.classList.add('active');
          try {
            const key = btn.parentElement.parentElement.className.replace('settings-row-', '');
            localStorage.setItem(key, btn.dataset.value);
          } catch (_) {}
        };

        if (format === 'mp4') {
          // MP4: H.264, HEVC, AV1 Enabled; VP9, VP8 Disabled
          codecRow.querySelectorAll('button').forEach(btn => {
            const val = btn.dataset.value;
            const isMp4Codec = val.startsWith('avc1') || val.startsWith('av01') || val.startsWith('hvc1');
            setButtonEnabled(btn, isMp4Codec);
          });

          // Quality: All enabled
          qualityRow.querySelectorAll('button').forEach(btn => {
            setButtonEnabled(btn, true);
          });

          // FPS: All enabled
          fpsRow.querySelectorAll('button').forEach(btn => {
            setButtonEnabled(btn, true);
          });
        } else {
          // WebM: VP9, VP8 Enabled; Others Disabled
          codecRow.querySelectorAll('button').forEach(btn => {
            const val = btn.dataset.value;
            const isWebmCodec = val.includes('webm');
            setButtonEnabled(btn, isWebmCodec);
          });

          // Quality: 100M/50M Disabled; 20M/10M/5M Enabled
          qualityRow.querySelectorAll('button').forEach(btn => {
            const val = parseInt(btn.dataset.value);
            const isWebmQuality = val <= 20000000;
            setButtonEnabled(btn, isWebmQuality);
          });

          // FPS: 240/120 Disabled; 60/30 Enabled
          fpsRow.querySelectorAll('button').forEach(btn => {
            const val = parseInt(btn.dataset.value);
            const isWebmFps = val <= 60;
            setButtonEnabled(btn, isWebmFps);
          });
        }

        // Auto-select first enabled option if active button is disabled
        [codecRow, qualityRow, fpsRow].forEach(row => {
          const activeBtn = row.querySelector('button.active');
          if (!activeBtn || activeBtn.disabled) {
            if (activeBtn) activeBtn.classList.remove('active');
            const firstEnabled = Array.from(row.querySelectorAll('button')).find(btn => !btn.disabled);
            if (firstEnabled) {
              setButtonActive(firstEnabled);
            }
          }
        });
      };

      // 确保已经完成编解码器支持检测
      if (this._codecCheckPromise) {
        await this._codecCheckPromise;
      }

      const codecs = this._supportedCodecsCache || [
        { value: 'avc1.640033', label: isChinese ? 'H.264 High 5.1 (推荐)' : 'H.264 High 5.1 (Recommended)' },
        { value: 'avc1.42001f', label: isChinese ? 'H.264 Baseline (兼容)' : 'H.264 Baseline (Compatible)' }
      ];

      const webCodecsSupported = typeof VideoEncoder !== 'undefined' && typeof Mp4Muxer !== 'undefined' && typeof Mp4Muxer.Muxer === 'function';
      const defaultCodec = codecs[0] ? codecs[0].value : (webCodecsSupported ? 'avc1.640033' : 'video/webm;codecs=vp9');
      panel.appendChild(createSettingRow(t('codec', '编码器'), codecs, 'record_codec', defaultCodec));

      // 画质选择（码率） - WebCodecs 支持更高码率
      const qualities = webCodecsSupported ? [
        { value: '100000000', label: t('quality_max', '无损') + ' 100Mbps' },
        { value: '50000000', label: t('quality_ultra', '极清') + ' 50Mbps' },
        { value: '20000000', label: t('quality_high', '超清') + ' 20Mbps' },
        { value: '10000000', label: t('quality_medium', '高清') + ' 10Mbps' },
        { value: '5000000', label: t('quality_low', '标清') + ' 5Mbps' }
      ] : [
        { value: '40000000', label: t('quality_ultra', '极清') + ' 40Mbps' },
        { value: '20000000', label: t('quality_high', '超清') + ' 20Mbps' },
        { value: '10000000', label: t('quality_medium', '高清') + ' 10Mbps' },
        { value: '5000000', label: t('quality_low', '标清') + ' 5Mbps' }
      ];
      const defaultQuality = webCodecsSupported ? '50000000' : '20000000';
      panel.appendChild(createSettingRow(t('quality', '画质'), qualities, 'record_quality', defaultQuality));

      // 帧率选择
      const frameRates = [
        { value: '240', label: '240 FPS' },
        { value: '120', label: '120 FPS' },
        { value: '60', label: '60 FPS' },
        { value: '30', label: '30 FPS' }
      ];
      panel.appendChild(createSettingRow(t('frame_rate', '帧率'), frameRates, 'record_fps', '60'));

      // 格式选择
      const formats = [
        { value: 'mp4', label: 'MP4', disabled: !webCodecsSupported },
        { value: 'webm', label: 'WebM' }
      ];
      const defaultFormat = webCodecsSupported ? 'mp4' : 'webm';
      panel.appendChild(createSettingRow(t('format', '格式'), formats, 'record_format', defaultFormat));

      // 触发初始状态匹配更新
      updateSettingPanelState();



      // 点击外部关闭
      closeHandler = (e) => {
        const target = (e.composedPath && e.composedPath()[0]) || e.target;
        if (!panel.contains(target) && (!anchor || !anchor.contains(target))) {
          closePanel();
        }
      };
      setTimeout(() => document.addEventListener('click', closeHandler, true), 0);

      if (root) {
        root.appendChild(panel);
      } else {
        (this.shadow || document.body).appendChild(panel);
      }
      console.log('Settings panel appended', panel);
    }


    startAreaScreenshot(options = {}) {
      try {
        if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
            window.__dev1SnapshotHighlighter._instance && 
            typeof window.__dev1SnapshotHighlighter._instance._suppressCursor === 'function') {
          window.__dev1SnapshotHighlighter._instance._suppressCursor('screenshot');
        }
      } catch (_) {}

      // 截图开始前缓存当前主题，避免截图期间主题检测被覆盖层干扰
      this._cachedTheme = this.detectPageTheme();
      this._isScreenshotting = true;

      // Close settings panel
      this._removeRecordingSettingsPanel();

      // Get zoom-invariant container to prevent position drift during PDF zoom/resize
      const fixedLayer = this._getZoomInvariantContainer();

      // Create overlay
      const overlay = document.createElement('div');
      overlay.id = 'screenshot-overlay';
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483647; cursor: crosshair; background: rgba(0,0,0,0.3); pointer-events: auto;';

      // Add instruction text
      const hint = document.createElement('div');
      hint.textContent = options.mode === 'manual_scroll'
        ? ((this.t && this.t('screenshot_manual_instruction')) || 'Drag to select area for scrolling capture')
        : ((this.t && this.t('screenshot_instruction_area')) || 'Drag to select area');
      // 根据页面主题调整提示文字颜色：深色页面用白字深底，浅色页面用深字浅底
      const isDarkPage = this._cachedTheme === true;
      const hintBg = isDarkPage ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
      const hintColor = isDarkPage ? '#ffffff' : '#1e293b';
      hint.style.cssText = `position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: ${hintBg}; color: ${hintColor}; padding: 8px 16px; border-radius: 20px; font-size: 14px; pointer-events: none; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.15);`;
      overlay.appendChild(hint);

      const selection = document.createElement('div');
      selection.style.cssText = 'position: absolute; border: 2px solid #3b82f6; background: rgba(59, 130, 246, 0.1); display: none; pointer-events: none;';
      overlay.appendChild(selection);
      fixedLayer.appendChild(overlay);

      let startX, startY;
      let isDragging = false;

      const onDown = (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        selection.style.left = startX + 'px';
        selection.style.top = startY + 'px';
        selection.style.width = '0px';
        selection.style.height = '0px';
        selection.style.display = 'block';
        e.preventDefault();
      };

      const onMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);

        selection.style.left = left + 'px';
        selection.style.top = top + 'px';
        selection.style.width = width + 'px';
        selection.style.height = height + 'px';
        e.preventDefault();
      };

      const onUp = async (e) => {
        if (!isDragging) return;
        isDragging = false;

        const rect = selection.getBoundingClientRect();
        overlay.remove();
        this.activeSessionCleanup = null;
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('contextmenu', onContextMenu);
        this._removeZoomInvariantContainer();

        if (rect.width < 5 || rect.height < 5) {
          try {
            if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
                window.__dev1SnapshotHighlighter._instance && 
                typeof window.__dev1SnapshotHighlighter._instance._releaseCursor === 'function') {
              window.__dev1SnapshotHighlighter._instance._releaseCursor('screenshot');
            }
          } catch (_) {}
          // 选择太小，清除截图状态
          this._isScreenshotting = false;
          return;
        }

        // If callback provided (e.g. for manual scroll), use it
        // 注意：长截图模式下，标志由 _startManualScrollSession 的 cleanup 清除
        if (options.onSelect) {
          options.onSelect(rect);
          return;
        }

        try {
          if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
              window.__dev1SnapshotHighlighter._instance && 
              typeof window.__dev1SnapshotHighlighter._instance._releaseCursor === 'function') {
            window.__dev1SnapshotHighlighter._instance._releaseCursor('screenshot');
          }
        } catch (_) {}

        // Default: Capture immediate area
        try {
          const response = await this._captureVisibleTab();
          if (response && response.success && response.dataUrl) {
            this._processScreenshot(response.dataUrl, rect);
          } else {
            const msg = (this.t && this.t('screenshot_failed')) || 'Screenshot failed';
            alert(`${msg}\n${response?.error || 'Unknown error'}`);
          }
        } catch (err) {
          console.error(err);
          const msg = (this.t && this.t('screenshot_failed')) || 'Screenshot failed';
          alert(`${msg}\n${err.message || err}`);
        } finally {
          // 区域截图完成，清除截图状态
          this._isScreenshotting = false;
        }
      };

      overlay.addEventListener('mousedown', onDown);
      overlay.addEventListener('mousemove', onMove);
      overlay.addEventListener('mouseup', onUp);

      // 取消选区的清理函数
      const cancelSelection = () => {
        overlay.remove();
        this._removeZoomInvariantContainer();
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('contextmenu', onContextMenu);
        this.activeSessionCleanup = null;
        this._isScreenshotting = false;

        try {
          if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
              window.__dev1SnapshotHighlighter._instance && 
              typeof window.__dev1SnapshotHighlighter._instance._releaseCursor === 'function') {
            window.__dev1SnapshotHighlighter._instance._releaseCursor('screenshot');
          }
        } catch (_) {}
      };

      this.activeSessionCleanup = cancelSelection;

      // ESC 取消
      const onKey = (e) => {
        if (e.key === 'Escape') {
          cancelSelection();
        }
      };
      document.addEventListener('keydown', onKey);

      // 右键取消
      const onContextMenu = (e) => {
        e.preventDefault();
        cancelSelection();
      };
      document.addEventListener('contextmenu', onContextMenu);
    }

    startLongScreenshot() {
      // Close settings panel
      this._removeRecordingSettingsPanel();

      // Reuse area selection to define the viewport
      this.startAreaScreenshot({
        mode: 'manual_scroll',
        onSelect: (rect) => this._startManualScrollSession(rect)
      });
    }

    // 屏幕录制功能 - 先选择区域再录制
    startScreenRecording() {
      if (!this._codecCheckPromise) {
        this._codecCheckPromise = this._checkAllCodecsSupport();
      }

      try {
        if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
            window.__dev1SnapshotHighlighter._instance && 
            typeof window.__dev1SnapshotHighlighter._instance._suppressCursor === 'function') {
          window.__dev1SnapshotHighlighter._instance._suppressCursor('screenshot');
        }
      } catch (_) {}

      // Close settings panel
      this._removeRecordingSettingsPanel();

      // 缓存主题
      this._cachedTheme = this.detectPageTheme();
      this._isScreenshotting = true;

      const isDarkPage = this._cachedTheme === true;
      const t = (key, fallback) => (this.t && this.t(key)) || fallback;

      // Get zoom-invariant container to prevent position drift during PDF zoom/resize
      const fixedLayer = this._getZoomInvariantContainer();

      // 创建区域选择覆盖层
      const overlay = document.createElement('div');
      overlay.id = 'screen-record-overlay';
      overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 2147483647; cursor: crosshair; background: rgba(0,0,0,0.3); user-select: none; pointer-events: auto;';

      // 阻止事件冒泡到页面
      overlay.addEventListener('click', e => e.stopPropagation());
      overlay.addEventListener('contextmenu', e => e.preventDefault());
      overlay.addEventListener('pointerdown', e => e.stopPropagation());

      // 提示文字
      const hint = document.createElement('div');
      hint.textContent = t('screen_record_select_area', '拖拽选择录制区域');
      const hintBg = isDarkPage ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.9)';
      const hintColor = isDarkPage ? '#ffffff' : '#1e293b';
      hint.style.cssText = `position: fixed; top: 20px; left: 50%; transform: translateX(-50%); background: ${hintBg}; color: ${hintColor}; padding: 8px 16px; border-radius: 20px; font-size: 14px; pointer-events: none; font-weight: 500; box-shadow: 0 2px 8px rgba(0,0,0,0.15);`;
      overlay.appendChild(hint);

      const selection = document.createElement('div');
      selection.style.cssText = 'position: absolute; border: 2px solid #ef4444; background: rgba(239, 68, 68, 0.1); display: none; pointer-events: none;';
      overlay.appendChild(selection);
      fixedLayer.appendChild(overlay);

      console.log('Screen record overlay created');

      let startX, startY;
      let isDragging = false;

      const onDown = (e) => {
        console.log('Screen record: mousedown');
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        selection.style.left = startX + 'px';
        selection.style.top = startY + 'px';
        selection.style.width = '0px';
        selection.style.height = '0px';
        selection.style.display = 'block';
        e.preventDefault();
        e.stopPropagation();
      };

      const onMove = (e) => {
        if (!isDragging) return;
        const currentX = e.clientX;
        const currentY = e.clientY;
        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        selection.style.left = left + 'px';
        selection.style.top = top + 'px';
        selection.style.width = width + 'px';
        selection.style.height = height + 'px';
        e.preventDefault();
        e.stopPropagation();
      };

      const onUp = async (e) => {
        console.log('Screen record: mouseup, isDragging:', isDragging);
        if (!isDragging) return;
        isDragging = false;
        e.stopPropagation();

        const rect = selection.getBoundingClientRect();
        console.log('Screen record: selection rect', rect.width, rect.height);

        overlay.remove();
        this.activeSessionCleanup = null;
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('contextmenu', onContextMenu);
        this._removeZoomInvariantContainer();

        try {
          if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
              window.__dev1SnapshotHighlighter._instance && 
              typeof window.__dev1SnapshotHighlighter._instance._releaseCursor === 'function') {
            window.__dev1SnapshotHighlighter._instance._releaseCursor('screenshot');
          }
        } catch (_) {}

        if (rect.width < 50 || rect.height < 50) {
          this._isScreenshotting = false;
          return;
        }

        // 开始区域录制
        await this._startAreaRecording(rect, isDarkPage);
      };

      overlay.addEventListener('mousedown', onDown, true);
      overlay.addEventListener('mousemove', onMove, true);
      overlay.addEventListener('mouseup', onUp, true);

      // 取消选区的清理函数
      const cancelSelection = () => {
        overlay.remove();
        this._removeZoomInvariantContainer();
        document.removeEventListener('keydown', onKey);
        document.removeEventListener('contextmenu', onContextMenu);
        this.activeSessionCleanup = null;
        this._isScreenshotting = false;

        try {
          if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
              window.__dev1SnapshotHighlighter._instance && 
              typeof window.__dev1SnapshotHighlighter._instance._releaseCursor === 'function') {
            window.__dev1SnapshotHighlighter._instance._releaseCursor('screenshot');
          }
        } catch (_) {}
      };

      this.activeSessionCleanup = cancelSelection;

      // ESC 取消
      const onKey = (e) => {
        if (e.key === 'Escape') {
          cancelSelection();
        }
      };
      document.addEventListener('keydown', onKey);

      // 右键取消
      const onContextMenu = (e) => {
        e.preventDefault();
        cancelSelection();
      };
      document.addEventListener('contextmenu', onContextMenu);
    }


    // 区域录制核心逻辑 - 使用 WebCodecs + mp4-muxer 实现高清录制
    async _startAreaRecording(rect, isDarkPage) {
      const t = (key, fallback) => (this.t && this.t(key)) || fallback;
      const dpr = window.devicePixelRatio || 1;
      let discardRecording = false;
      let worker = null;
      this.activeSessionCleanup = () => {
        discardRecording = true;
        this._isScreenshotting = false;
      };

      // 检查 WebCodecs 支持
      console.log('VideoEncoder:', typeof VideoEncoder);
      console.log('Mp4Muxer:', typeof Mp4Muxer, typeof Mp4Muxer !== 'undefined' ? Mp4Muxer : null);
      if (typeof Mp4Muxer !== 'undefined') {
        console.log('Mp4Muxer.Muxer:', typeof Mp4Muxer.Muxer);
        console.log('Mp4Muxer keys:', Object.keys(Mp4Muxer));
      }
      const webCodecsSupported = typeof VideoEncoder !== 'undefined' && typeof Mp4Muxer !== 'undefined' && typeof Mp4Muxer.Muxer === 'function';
      let recordFormat = 'mp4';
      try {
        recordFormat = localStorage.getItem('record_format') || (webCodecsSupported ? 'mp4' : 'webm');
      } catch (_) {}
      const useWebCodecs = recordFormat === 'mp4' && webCodecsSupported;
      console.log('Recording format:', recordFormat, 'useWebCodecs:', useWebCodecs);

      try {
        // 读取用户设置（先读取，用于配置 getDisplayMedia）
        let codecProfile = 'avc1.640033'; // H.264 High Profile Level 5.1
        let bitrate = 50000000; // 50 Mbps 默认
        let frameRate = 60;

        try {
          const savedCodec = localStorage.getItem('record_codec');
          if (savedCodec) codecProfile = savedCodec;

          const savedQuality = localStorage.getItem('record_quality');
          if (savedQuality) bitrate = parseInt(savedQuality);

          const savedFps = localStorage.getItem('record_fps');
          if (savedFps) frameRate = parseInt(savedFps);
        } catch (_) { }

        // 请求屏幕共享（当前标签页）- 配置高分辨率捕获
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'browser',
            // 请求最高分辨率 - 4K 或更高
            width: { ideal: 3840, max: 7680 },
            height: { ideal: 2160, max: 4320 },
            frameRate: { ideal: frameRate, max: Math.max(frameRate, 240) }
          },
          audio: false,
          preferCurrentTab: true
        });

        if (discardRecording) {
          displayStream.getTracks().forEach(track => track.stop());
          return;
        }

        // 创建视频元素来接收屏幕流
        const videoEl = document.createElement('video');
        videoEl.srcObject = displayStream;
        videoEl.muted = true;
        await videoEl.play();

        // 等待视频尺寸确定
        await new Promise(resolve => {
          if (videoEl.videoWidth > 0) resolve();
          else videoEl.onloadedmetadata = resolve;
        });

        // 进一步等待分辨率在高帧率（如 120fps/240fps）或 Retina 屏幕下稳定下来（最多 500ms）
        let lastWidth = videoEl.videoWidth;
        let lastHeight = videoEl.videoHeight;
        let stableCount = 0;
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 50));
          const currentWidth = videoEl.videoWidth;
          const currentHeight = videoEl.videoHeight;
          if (currentWidth === lastWidth && currentHeight === lastHeight) {
            stableCount++;
            if (stableCount >= 2 && currentWidth > 0) {
              break;
            }
          } else {
            stableCount = 0;
            lastWidth = currentWidth;
            lastHeight = currentHeight;
          }
        }

        // 获取视频流 of 实际分辨率
        const videoWidth = videoEl.videoWidth;
        const videoHeight = videoEl.videoHeight;

        // 获取视频轨道的设置，了解实际捕获的尺寸
        const videoTrack = displayStream.getVideoTracks()[0];
        const trackSettings = videoTrack.getSettings();
        console.log('Video track settings:', trackSettings);

        // 为了能够精准裁剪录像区域，必须要求用户分享浏览器标签页而非整个屏幕/窗口
        if (trackSettings.displaySurface && trackSettings.displaySurface !== 'browser') {
          displayStream.getTracks().forEach(track => track.stop());
          alert(t('screen_record_tab_only', '为了精准录制框选区域，请在弹出的共享窗口中选择「Chrome 标签页」（或「当前标签页」）进行录制！'));
          this.activeSessionCleanup = null;
          this._removeZoomInvariantContainer();
          this._isScreenshotting = false;
          return;
        }

        // 缓存视口大小以防止高频读取触发 Layout Thrashing
        let cachedInnerWidth = window.innerWidth;
        let cachedInnerHeight = window.innerHeight;
        const handleViewportResize = () => {
          cachedInnerWidth = window.innerWidth;
          cachedInnerHeight = window.innerHeight;
        };
        window.addEventListener('resize', handleViewportResize);

        // 计算缩放比例
        // getDisplayMedia 捕获的是整个视口内容，需要正确映射坐标
        // 使用设备像素比来计算真实的缩放
        const dpr = window.devicePixelRatio || 1;

        // 计算视频分辨率与视口的比例
        // 注意：getDisplayMedia 可能捕获的分辨率与视口不同
        const scaleX = videoWidth / cachedInnerWidth;
        const scaleY = videoHeight / cachedInnerHeight;

        console.log('Scale calculation:', {
          videoSize: `${videoWidth}x${videoHeight}`,
          windowSize: `${cachedInnerWidth}x${cachedInnerHeight}`,
          dpr,
          scaleX: scaleX.toFixed(3),
          scaleY: scaleY.toFixed(3),
          rectPos: `(${rect.left}, ${rect.top}) ${rect.width}x${rect.height}`
        });

        // 计算源视频中对应的裁剪区域
        const srcX = Math.round(rect.left * scaleX);
        const srcY = Math.round(rect.top * scaleY);
        const srcW = Math.round(rect.width * scaleX);
        const srcH = Math.round(rect.height * scaleY);

        // 输出尺寸 = 裁剪区域的实际像素尺寸（保持原始清晰度，不缩放）
        // 确保是偶数（视频编码要求）
        let width = Math.round(srcW / 2) * 2;
        let height = Math.round(srcH / 2) * 2;

        // 确保最小尺寸
        width = Math.max(width, 2);
        height = Math.max(height, 2);

        console.log('Recording area:', {
          src: `(${srcX}, ${srcY}) ${srcW}x${srcH}`,
          output: `${width}x${height}`,
          codecProfile,
          bitrate: (bitrate / 1000000).toFixed(1) + ' Mbps',
          frameRate
        });

        // 创建用于裁剪的 canvas - 使用高质量绘制设置
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', {
          alpha: false,
          desynchronized: true  // 提高性能
        });
        // 高质量缩放设置
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const calculateCropCoords = (frameW, frameH) => {
          const currentScaleX = frameW / cachedInnerWidth;
          const currentScaleY = frameH / cachedInnerHeight;
          
          let currentSrcX = Math.round(rect.left * currentScaleX);
          let currentSrcY = Math.round(rect.top * currentScaleY);
          let currentSrcW = Math.round(rect.width * currentScaleX);
          let currentSrcH = Math.round(rect.height * currentScaleY);
          
          // Align to 2-pixel boundaries (even numbers) for WebCodecs YUV 4:2:0 format compatibility
          currentSrcX = Math.floor(currentSrcX / 2) * 2;
          currentSrcY = Math.floor(currentSrcY / 2) * 2;
          currentSrcW = Math.floor(currentSrcW / 2) * 2;
          currentSrcH = Math.floor(currentSrcH / 2) * 2;
          
          // Ensure they don't exceed frame dimensions
          currentSrcX = Math.max(0, Math.min(currentSrcX, frameW - 2));
          currentSrcY = Math.max(0, Math.min(currentSrcY, frameH - 2));
          if (currentSrcX + currentSrcW > frameW) {
            currentSrcW = Math.max(2, Math.floor((frameW - currentSrcX) / 2) * 2);
          }
          if (currentSrcY + currentSrcH > frameH) {
            currentSrcH = Math.max(2, Math.floor((frameH - currentSrcY) / 2) * 2);
          }

          // Safety clamp
          currentSrcW = Math.max(2, currentSrcW);
          currentSrcH = Math.max(2, currentSrcH);

          return { x: currentSrcX, y: currentSrcY, w: currentSrcW, h: currentSrcH };
        };

        const getCropCoords = () => calculateCropCoords(videoEl.videoWidth, videoEl.videoHeight);

        // Get zoom-invariant container to prevent position drift during PDF zoom/resize
        const fixedLayer = this._getZoomInvariantContainer();

        // 录制区域指示器 - 红框完全在录制区域外部
        // 录制区域 = rect，红框要包围它但不能进入
        const borderWidth = 3;
        const gap = 4; // 红框内边缘与录制区域的间隙，增加到4px以防小数DPR像素下边缘渗入
        const indicator = document.createElement('div');
        indicator.id = 'screen-record-area-indicator';
        indicator.style.cssText = `
          position: fixed;
          left: ${rect.left - borderWidth - gap}px;
          top: ${rect.top - borderWidth - gap}px;
          width: ${rect.width + (borderWidth + gap) * 2}px;
          height: ${rect.height + (borderWidth + gap) * 2}px;
          border: ${borderWidth}px solid #ef4444;
          border-radius: 4px;
          pointer-events: none;
          z-index: 2147483646;
          box-sizing: border-box;
        `;
        fixedLayer.appendChild(indicator);

        const masks = [];

        // 创建录制控制 UI - 放在录制区域下方
        const controlPanel = document.createElement('div');
        controlPanel.id = 'screen-record-controls';
        setImportantStyles(controlPanel, {
          'position': 'fixed',
          'top': `${rect.top + rect.height + 15}px`,
          'left': `${rect.left + rect.width / 2}px`,
          'transform': 'translateX(-50%)',
          'background': isDarkPage ? 'rgba(0,0,0,0.9)' : 'rgba(255,255,255,0.95)',
          'color': isDarkPage ? '#ffffff' : '#1e293b',
          'padding': '10px 16px',
          'border-radius': '20px',
          'box-shadow': '0 4px 20px rgba(0,0,0,0.3)',
          'z-index': '2147483647',
          'display': 'flex',
          'align-items': 'center',
          'gap': '12px',
          'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          'font-size': '13px',
          'line-height': '1',
          'letter-spacing': '0',
          'box-sizing': 'border-box',
          'pointer-events': 'auto'
        });

        // 录制红点
        const dot = document.createElement('div');
        setImportantStyles(dot, {
          'width': '10px',
          'height': '10px',
          'min-width': '10px',
          'min-height': '10px',
          'background': '#ef4444',
          'border-radius': '50%',
          'border': '0',
          'box-shadow': 'none',
          'animation': 'pulse 1s ease-in-out infinite',
          'flex': '0 0 auto'
        });

        // 添加脉冲动画样式
        if (!document.getElementById('record-pulse-style')) {
          const style = document.createElement('style');
          style.id = 'record-pulse-style';
          style.textContent = `
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.5; transform: scale(0.85); }
            }
          `;
          document.head.appendChild(style);
        }

        // 计时器
        const timer = document.createElement('span');
        timer.textContent = '00:00';
        setImportantStyles(timer, {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          'font-size': '13px',
          'font-weight': '600',
          'line-height': '1',
          'min-width': '45px',
          'color': 'currentColor',
          'letter-spacing': '0',
          'text-indent': '0',
          'flex': '0 0 auto'
        });

        // 格式标识
        const formatBadge = document.createElement('span');
        formatBadge.textContent = useWebCodecs ? 'MP4' : 'WebM';
        setImportantStyles(formatBadge, {
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '2px 6px',
          'border-radius': '4px',
          'border': '0',
          'background': useWebCodecs ? '#22c55e' : '#3b82f6',
          'color': 'white',
          'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          'font-size': '10px',
          'font-weight': '600',
          'line-height': '1',
          'letter-spacing': '0',
          'text-indent': '0',
          'flex': '0 0 auto'
        });

        // 停止按钮
        const stopBtn = document.createElement('button');
        stopBtn.type = 'button';
        stopBtn.textContent = t('screen_record_stop', '停止');
        setImportantStyles(stopBtn, {
          'appearance': 'none',
          '-webkit-appearance': 'none',
          'box-sizing': 'border-box',
          'padding': '6px 14px',
          'margin': '0',
          'border-radius': '14px',
          'border': 'none',
          'background': '#ef4444',
          'color': 'white',
          'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          'font-size': '12px',
          'font-weight': '600',
          'line-height': '1',
          'letter-spacing': '0',
          'text-indent': '0',
          'text-transform': 'none',
          'white-space': 'nowrap',
          'cursor': 'pointer',
          'transition': 'all 0.2s ease',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'min-height': '26px',
          'flex': '0 0 auto',
          'pointer-events': 'auto'
        });

        controlPanel.appendChild(dot);
        controlPanel.appendChild(timer);
        controlPanel.appendChild(formatBadge);
        controlPanel.appendChild(stopBtn);
        fixedLayer.appendChild(controlPanel);

        // 计时器
        let seconds = 0;
        const timerInterval = setInterval(() => {
          seconds++;
          const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
          const secs = (seconds % 60).toString().padStart(2, '0');
          timer.textContent = `${mins}:${secs}`;
        }, 1000);

        let isRecording = true;
        let animationId;

        // 清理函数
        let cleanup = (discard = false) => {
          if (discard) discardRecording = true;
          this.activeSessionCleanup = null;
          isRecording = false;
          cancelAnimationFrame(animationId);
          window.removeEventListener('resize', handleViewportResize);
          if (worker) {
            try { worker.terminate(); } catch (_) {}
            worker = null;
          }
          displayStream.getTracks().forEach(track => {
            try { track.stop(); } catch (_) {}
          });
          videoEl.pause();
          videoEl.srcObject = null;
          controlPanel.remove();
          indicator.remove();
          masks.forEach(m => m.remove());
          this._removeZoomInvariantContainer();
          clearInterval(timerInterval);
          this._isScreenshotting = false;
        };

        this.activeSessionCleanup = () => cleanup(true);

        let runWebCodecs = useWebCodecs;
        let mainEncoder = null;
        let mainMuxer = null;
        let mainReader = null;

        const runMediaRecorderFallback = () => {
          console.log('Falling back to MediaRecorder');
          formatBadge.textContent = 'WebM';
          formatBadge.style.setProperty('background', '#3b82f6', 'important');

          const drawFrame = () => {
            if (!isRecording) return;
            // 每次绘制时动态获取最新坐标以应对高帧率下的分辨率变动或延迟稳定
            const currentCoords = getCropCoords();
            ctx.drawImage(videoEl, currentCoords.x, currentCoords.y, currentCoords.w, currentCoords.h, 0, 0, width, height);
            animationId = requestAnimationFrame(drawFrame);
          };
          drawFrame();

          const croppedStream = canvas.captureStream(frameRate);
          let mimeType = 'video/webm';
          if (codecProfile && codecProfile.startsWith('video/webm')) {
            if (MediaRecorder.isTypeSupported(codecProfile)) {
              mimeType = codecProfile;
            } else if (codecProfile.includes('vp9') && MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
              mimeType = 'video/webm;codecs=vp9';
            } else if (codecProfile.includes('vp8') && MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
              mimeType = 'video/webm;codecs=vp8';
            }
          } else {
            mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
              ? 'video/webm;codecs=vp9' : 'video/webm';
          }

          const chunks = [];
          const recorder = new MediaRecorder(croppedStream, {
            mimeType,
            videoBitsPerSecond: bitrate
          });

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = () => {
            cleanup();
            croppedStream.getTracks().forEach(track => track.stop());
            if (chunks.length > 0 && !discardRecording) {
              const blob = new Blob(chunks, { type: mimeType });
              this._showRecordingResult(blob, mimeType);
            }
          };

          this.activeSessionCleanup = () => {
            discardRecording = true;
            if (recorder.state !== 'inactive') {
              recorder.stop();
            } else {
              cleanup(true);
            }
          };

          stopBtn.onclick = () => {
            if (recorder.state !== 'inactive') recorder.stop();
          };

          const onKeyDown = (e) => {
            if (e.key === 'Escape') {
              if (recorder.state !== 'inactive') recorder.stop();
              document.removeEventListener('keydown', onKeyDown);
              document.removeEventListener('contextmenu', onContextMenu);
            }
          };
          document.addEventListener('keydown', onKeyDown);

          // 右键停止
          const onContextMenu = (e) => {
            e.preventDefault();
            if (recorder.state !== 'inactive') recorder.stop();
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('contextmenu', onContextMenu);
          };
          document.addEventListener('contextmenu', onContextMenu);

          displayStream.getVideoTracks()[0].onended = () => {
            if (recorder.state !== 'inactive') recorder.stop();
          };

          recorder.start(100);
        };

        if (runWebCodecs) {
          stopBtn.disabled = false;

          // Function to get H.264 level string based on pixel count
          const getRequiredAvcLevel = (w, h) => {
            const pixels = w * h;
            if (pixels <= 921600) return '1f'; // Level 3.1
            if (pixels <= 2097152) return '29'; // Level 4.1
            return '33'; // Level 5.1
          };

          const adjustAvcLevel = (codecStr, w, h) => {
            if (codecStr.startsWith('avc1.')) {
              const req = getRequiredAvcLevel(w, h);
              const cur = codecStr.slice(-2);
              if (parseInt(req, 16) > parseInt(cur, 16)) {
                return codecStr.slice(0, -2) + req;
              }
            }
            return codecStr;
          };

          // 确定 finalCodec
          let finalCodec = codecProfile;
          if (finalCodec.startsWith('avc1.')) {
            finalCodec = adjustAvcLevel(finalCodec, width, height);
          }

          const codecConfig = {
            codec: finalCodec,
            width: width,
            height: height,
            bitrate: bitrate,
            framerate: frameRate
          };

          try {
            try {
              const support = await VideoEncoder.isConfigSupported(codecConfig);
              if (!support.supported) {
                console.warn(`Codec ${finalCodec} not supported, trying fallback codecs...`);
                const fallbacks = [
                  'avc1.640033', // H.264 High 5.1
                  'avc1.420033', // H.264 Baseline 5.1
                  'avc1.42001f'  // H.264 Baseline 3.1
                ];
                let foundFallback = false;
                for (let cand of fallbacks) {
                  cand = adjustAvcLevel(cand, width, height);
                  const candConfig = { ...codecConfig, codec: cand };
                  try {
                    const candSupport = await VideoEncoder.isConfigSupported(candConfig);
                    if (candSupport.supported) {
                      console.warn(`Falling back to supported codec: ${cand}`);
                      finalCodec = cand;
                      foundFallback = true;
                      break;
                    }
                  } catch (_) {}
                }
                if (!foundFallback) {
                  console.warn(`No fallback candidates supported, defaulting to avc1.640033`);
                  finalCodec = 'avc1.640033';
                }
              }
            } catch (e) {
              console.warn('Could not check codec support:', e);
              finalCodec = adjustAvcLevel('avc1.640033', width, height);
            }

            // 1. Initialize MP4 Muxer on main thread
            const isAV1 = finalCodec.startsWith('av01');
            const isHEVC = finalCodec.startsWith('hvc1');
            let muxerCodec = 'avc';
            if (isAV1) {
              muxerCodec = 'av1';
            } else if (isHEVC) {
              muxerCodec = 'hevc';
            }

            mainMuxer = new Mp4Muxer.Muxer({
              target: new Mp4Muxer.ArrayBufferTarget(),
              video: {
                codec: muxerCodec,
                width: width,
                height: height
              },
              firstTimestampBehavior: 'offset',
              fastStart: 'in-memory'
            });

            // 2. Initialize VideoEncoder on main thread
            mainEncoder = new VideoEncoder({
              output: (chunk, meta) => {
                if (mainMuxer) {
                  mainMuxer.addVideoChunk(chunk, meta);
                }
              },
              error: (e) => {
                console.error('VideoEncoder on main thread error:', e);
                alert(t('screen_record_error', '录屏失败') + ': ' + (e.message || String(e)));
                stopRecording();
              }
            });

            const encoderConfig = {
              codec: finalCodec,
              width: width,
              height: height,
              bitrate: bitrate,
              framerate: frameRate,
              latencyMode: 'quality',
              hardwareAcceleration: 'no-preference'
            };
            if (finalCodec.startsWith('avc1')) {
              encoderConfig.avc = { format: 'avc' };
            }
            mainEncoder.configure(encoderConfig);

            const videoTrack = displayStream.getVideoTracks()[0];
            const processor = new MediaStreamTrackProcessor({ track: videoTrack });
            mainReader = processor.readable.getReader();

            // 停止录制函数
            const stopRecording = async () => {
              if (!isRecording) return;
              isRecording = false;

              stopBtn.textContent = t('processing', '处理中...');
              stopBtn.disabled = true;

              try {
                if (mainReader) {
                  try {
                    await mainReader.cancel();
                  } catch (_) {}
                }
                if (mainEncoder) {
                  try {
                    await mainEncoder.flush();
                  } catch (_) {}
                }
                if (mainMuxer) {
                  try {
                    mainMuxer.finalize();
                    const { buffer } = mainMuxer.target;
                    const blob = new Blob([buffer], { type: 'video/mp4' });
                    cleanup();
                    this._showRecordingResult(blob, 'video/mp4');
                  } catch (e) {
                    console.error('Muxer finalization failed:', e);
                    cleanup();
                    alert(t('screen_record_error', '录屏失败') + ': ' + e.message);
                  }
                }
              } catch (err) {
                console.error('Stop recording error:', err);
                cleanup();
                alert(t('screen_record_error', '录屏失败') + ': ' + (err.message || String(err)));
              }
            };

            stopBtn.onclick = stopRecording;

            // ESC 停止
            const onKeyDown = (e) => {
              if (e.key === 'Escape') {
                stopRecording();
                document.removeEventListener('keydown', onKeyDown);
                document.removeEventListener('contextmenu', onContextMenu);
              }
            };
            document.addEventListener('keydown', onKeyDown);

            // 右键停止
            const onContextMenu = (e) => {
              e.preventDefault();
              stopRecording();
              document.removeEventListener('keydown', onKeyDown);
              document.removeEventListener('contextmenu', onContextMenu);
            };
            document.addEventListener('contextmenu', onContextMenu);

            // 监听流结束
            videoTrack.addEventListener('ended', stopRecording);

            // Override original cleanup to clean up main thread references
            const originalCleanup = cleanup;
            cleanup = (discard = false) => {
              isRecording = false;
              mainEncoder = null;
              mainMuxer = null;
              mainReader = null;
              originalCleanup(discard);
            };

            // 启动帧读取与编码循环
            let frameCount = 0;
            (async () => {
              try {
                while (isRecording) {
                  const { done, value: frame } = await mainReader.read();
                  if (done) {
                    break;
                  }
                  if (!isRecording) {
                    if (frame) frame.close();
                    break;
                  }

                  let croppedFrame;
                  try {
                    const frameW = frame.codedWidth || frame.displayWidth;
                    const frameH = frame.codedHeight || frame.displayHeight;

                    // 根据当前 VideoFrame 真实物理分辨率，动态计算该帧的最优裁剪坐标
                    const frameCoords = calculateCropCoords(frameW, frameH);

                    croppedFrame = new VideoFrame(frame, {
                      visibleRect: {
                        x: frameCoords.x,
                        y: frameCoords.y,
                        width: frameCoords.w,
                        height: frameCoords.h
                      }
                    });
                  } catch (err) {
                    console.error('VideoFrame cropping error:', err);
                    if (frame) frame.close();
                    throw err;
                  }
                  frame.close(); // 关闭输入帧

                  if (mainEncoder) {
                    const keyFrame = frameCount % (frameRate * 2) === 0; // 每两秒一个关键帧
                    mainEncoder.encode(croppedFrame, { keyFrame });
                  }
                  croppedFrame.close(); // 关闭裁剪帧

                  frameCount++;
                }

                if (isRecording) {
                  await stopRecording();
                }
              } catch (loopErr) {
                console.error('Main thread recording loop error:', loopErr);
                cleanup();
                alert(t('screen_record_error', '录屏失败') + ': ' + (loopErr.message || String(loopErr)));
              }
            })();

          } catch (err) {
            console.error('Failed to run WebCodecs on main thread, falling back to MediaRecorder:', err);
            runWebCodecs = false;
            cleanup(true);
            runMediaRecorderFallback();
          }
        } else {
          runMediaRecorderFallback();
        }

      } catch (err) {
        const errName = err && err.name ? err.name : '';
        const errMessage = err && err.message ? err.message : String(err || '');
        console.error('Area recording error:', {
          name: errName,
          message: errMessage,
          error: err
        });
        this._isScreenshotting = false;
        if (errName !== 'NotAllowedError') {
          alert(`${t('screen_record_error', '录屏失败')}: ${errMessage}`);
        }
      }
    }


    // 显示录制结果
    _showRecordingResult(blob, mimeType = 'video/webm') {
      // 屏蔽主题检测矩阵采样，避免检测到对话框
      this._cachedTheme = this._cachedTheme !== null ? this._cachedTheme : this.detectPageTheme();
      this._isScreenshotting = true;

      const useDarkStyle = this.darkModeEnabled;
      const t = (key, fallback) => (this.t && this.t(key)) || fallback;

      // 检测是否在扩展页面中（扩展页面没有 CSP 限制）
      const isExtensionPage = window.location.protocol === 'chrome-extension:';

      console.log('Recording result:', { size: blob.size, type: blob.type, mimeType, isExtensionPage });

      // 创建 blob URL 并保存引用以便清理
      const blobUrl = URL.createObjectURL(blob);

      // Get zoom-invariant container to prevent position drift during PDF zoom/resize
      const fixedLayer = this._getZoomInvariantContainer();

      const dialog = document.createElement('div');
      dialog.id = 'screen-record-result-dialog';
      const dialogBg = useDarkStyle ? '#252525' : '#f0f4f8';
      const dialogColor = useDarkStyle ? '#f0f4f8' : '#1e293b';
      const dialogBorder = useDarkStyle ? '1px solid #3b3b3b' : '1px solid #cbd5e1';
      dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: ${dialogBg};
        color: ${dialogColor};
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        z-index: 2147483647;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        gap: 16px;
        min-width: 400px;
        border: ${dialogBorder};
        pointer-events: auto;
      `;

      const title = document.createElement('h3');
      title.textContent = t('screen_record', '屏幕录制');
      title.style.cssText = `margin: 0; font-size: 18px; color: ${dialogColor};`;
      dialog.appendChild(title);

      // 视频预览
      const videoContainer = document.createElement('div');
      videoContainer.style.cssText = `
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        background: #000;
        max-height: 60vh;
        min-height: 200px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const video = document.createElement('video');
      video.controls = true;
      video.playsInline = true;
      video.muted = true;
      video.style.cssText = 'max-width: 100%; max-height: 60vh; display: block; width: 100%;';

      // 先添加到 DOM
      videoContainer.appendChild(video);
      dialog.appendChild(videoContainer);

      // 加载提示
      const loadingText = document.createElement('div');
      loadingText.textContent = t('loading', '加载中...');
      loadingText.style.cssText = 'position: absolute; color: #888; font-size: 14px;';
      videoContainer.appendChild(loadingText);

      // 显示备用下载界面（当预览不可用时）
      const showFallback = () => {
        loadingText.innerHTML = '';
        loadingText.style.cssText = `
          position: absolute; 
          color: ${useDarkStyle ? '#9ca3af' : '#6b7280'}; 
          font-size: 13px; 
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px;
        `;

        // 成功图标（绿色勾）
        const iconDiv = document.createElement('div');
        iconDiv.innerHTML = `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#22c55e" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M8 12l2.5 2.5L16 9"></path>
        </svg>`;
        setImportantStyles(iconDiv, {
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'width': '48px',
          'height': '48px',
          'min-width': '48px',
          'min-height': '48px',
          'margin': '0 auto',
          'padding': '0',
          'background': 'transparent',
          'border': '0',
          'box-shadow': 'none',
          'overflow': 'visible'
        });
        const iconSvg = iconDiv.querySelector('svg');
        if (iconSvg) {
          setImportantStyles(iconSvg, {
            'display': 'block',
            'width': '48px',
            'height': '48px',
            'min-width': '48px',
            'min-height': '48px',
            'overflow': 'visible',
            'color': '#22c55e',
            'stroke': '#22c55e',
            'fill': 'none'
          });
        }

        const infoMsg = document.createElement('div');
        infoMsg.textContent = t('video_record_success', '录制完成');
        infoMsg.style.cssText = 'font-size: 16px; font-weight: 600; color: #22c55e;';

        const subMsg = document.createElement('div');
        subMsg.textContent = t('video_csp_restricted', '由于网站限制，无法预览');
        subMsg.style.cssText = `font-size: 12px; color: ${useDarkStyle ? '#6b7280' : '#9ca3af'}; margin-top: 4px;`;

        loadingText.appendChild(iconDiv);
        loadingText.appendChild(infoMsg);
        loadingText.appendChild(subMsg);

        video.style.setProperty('display', 'none', 'important');
      };

      // 尝试加载视频预览
      let previewAttempted = false;
      const tryPreview = () => {
        if (previewAttempted) return;
        previewAttempted = true;

        // 视频加载成功
        video.onloadeddata = () => {
          console.log('Video loaded successfully, readyState:', video.readyState);
          loadingText.style.setProperty('display', 'none', 'important');
          video.play().catch(() => { });
        };

        video.onerror = (e) => {
          // 静默处理错误，不打印到控制台（CSP 限制是预期行为）
          showFallback();
        };

        // 尝试设置 src
        try {
          video.src = blobUrl;
        } catch (e) {
          showFallback();
        }
      };

      // 延迟尝试预览，给 DOM 一些时间
      setTimeout(tryPreview, 50);

      // 2秒超时后显示备用方案
      setTimeout(() => {
        if (loadingText.style.display !== 'none' && video.readyState < 2) {
          showFallback();
        }
      }, 2000);

      // 文件大小信息
      const sizeInfo = document.createElement('div');
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      sizeInfo.textContent = `${t('file_size', '文件大小')}: ${sizeMB} MB`;
      sizeInfo.style.cssText = `font-size: 13px; opacity: 0.7;`;
      dialog.appendChild(sizeInfo);

      // 按钮容器
      const actions = document.createElement('div');
      actions.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';

      const createBtn = (text, onClick, primary = false) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = text;
        const bg = primary ? '#3b82f6' : (useDarkStyle ? '#374151' : 'white');
        const color = primary ? 'white' : (useDarkStyle ? '#e2e8f0' : '#475569');
        const border = primary ? '#3b82f6' : (useDarkStyle ? '#4b5563' : '#e2e8f0');
        setImportantStyles(btn, {
          'appearance': 'none',
          '-webkit-appearance': 'none',
          'box-sizing': 'border-box',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '8px 16px',
          'margin': '0',
          'border-radius': '6px',
          'border': `1px solid ${border}`,
          'background': bg,
          'color': color,
          'cursor': 'pointer',
          'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          'font-size': '14px',
          'font-weight': '500',
          'line-height': '1.2',
          'letter-spacing': '0',
          'text-indent': '0',
          'text-transform': 'none',
          'white-space': 'nowrap',
          'min-height': '34px',
          'overflow': 'visible',
          'pointer-events': 'auto'
        });
        btn.onclick = onClick;
        return btn;
      };

      // 清理函数
      const cleanup = () => {
        this.activeSessionCleanup = null;
        video.pause();
        video.src = '';
        URL.revokeObjectURL(blobUrl);
        dialog.remove();
        this._removeZoomInvariantContainer();
        document.removeEventListener('keydown', onKey);
        // 恢复主题检测
        this._isScreenshotting = false;
      };

      // 取消按钮 - 清理缓存
      actions.appendChild(createBtn(t('screenshot_cancel', '取消'), cleanup));

      // 下载按钮 - 下载后也清理缓存
      actions.appendChild(createBtn(t('save_and_clear_cache', '保存并删除缓存'), async () => {
        try {
          await this._saveBlob(blob, 'screen_recording', mimeType.includes('mp4') ? 'mp4' : 'webm', mimeType);
          setTimeout(cleanup, 500);
        } catch (error) {
          alert(`${t('screen_record_error', '录屏失败')}: ${error.message || error}`);
        }
      }, true));

      dialog.appendChild(actions);
      fixedLayer.appendChild(dialog);

      // ESC 关闭并清理
      const onKey = (e) => {
        if (e.key === 'Escape') {
          cleanup();
        }
      };
      document.addEventListener('keydown', onKey);

      // 右键关闭并清理
      const onContextMenu = (e) => {
        e.preventDefault();
        cleanup();
      };
      dialog.addEventListener('contextmenu', onContextMenu);
    }


    async _startManualScrollSession(rect) {
      try {
        if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
            window.__dev1SnapshotHighlighter._instance && 
            typeof window.__dev1SnapshotHighlighter._instance._suppressCursor === 'function') {
          window.__dev1SnapshotHighlighter._instance._suppressCursor('screenshot');
        }
      } catch (_) {}

      // Color constants for status indication
      const COLORS = {
        IDLE: '#9ca3af',      // Gray - default/ready state
        SCROLLING: '#4ade80', // Green - normal scrolling
        TOO_FAST: '#fbbf24',  // Yellow - scrolling too fast warning
        ERROR: '#ef4444',     // Red - capture failed or gap too large
        PAUSED: '#60a5fa'     // Blue - paused state
      };

      // Bracket corner settings
      const CORNER_SIZE = 20;
      const BORDER_WIDTH = 3;

      // Capture area inside the bracket corners (exclude border width)
      const cleanRect = {
        left: rect.left + BORDER_WIDTH,
        top: rect.top + BORDER_WIDTH,
        width: rect.width - (BORDER_WIDTH * 2),
        height: rect.height - (BORDER_WIDTH * 2)
      };

      // Canvas for real-time stitching (device-pixel aligned)
      const masterCanvas = document.createElement('canvas');
      const masterCtx = masterCanvas.getContext('2d', { willReadFrequently: true });
      const dpr = window.devicePixelRatio || 1;
      const viewWidth = Math.max(1, Math.round(cleanRect.width * dpr));
      const viewHeight = Math.max(1, Math.round(cleanRect.height * dpr));
      const baseViewport = {
        width: window.innerWidth,
        height: window.innerHeight,
        dpr
      };
      masterCanvas.width = viewWidth;
      masterCanvas.height = 0;

      // Helper for translations
      const t = (key, fallback) => (this.t && this.t(key)) || fallback;

      // ===== Smart UI Positioning System =====
      const MARGIN = 20;
      const PREVIEW_WIDTH = 200;
      const PREVIEW_MAX_HEIGHT = Math.min(300, window.innerHeight * 0.4);
      const BTN_SIZE = 36;
      const BTN_GAP = 8;

      // Check if selection covers most of the screen (fullscreen mode)
      const isFullscreen = rect.width >= window.innerWidth * 0.9 && rect.height >= window.innerHeight * 0.9;

      // Calculate available space in each direction
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      const spaceTop = rect.top;
      const spaceBottom = window.innerHeight - rect.bottom;

      // Determine best position for UI (opposite to selection)
      const calcUIPosition = () => {
        const spaces = [
          { side: 'left', space: spaceLeft },
          { side: 'right', space: spaceRight },
          { side: 'top', space: spaceTop },
          { side: 'bottom', space: spaceBottom }
        ].sort((a, b) => b.space - a.space);

        const bestSide = spaces[0];
        const secondBest = spaces[1];

        // Calculate required space for preview + buttons
        const minSpaceForPreview = PREVIEW_WIDTH + MARGIN * 2;
        const minSpaceForButtons = BTN_SIZE * 3 + BTN_GAP * 2 + MARGIN * 2;

        let showPreview = !isFullscreen && bestSide.space >= minSpaceForPreview;
        let buttonsLayout = 'horizontal'; // or 'vertical'
        let position = { side: bestSide.side };

        // Determine button layout based on available space
        if (bestSide.side === 'left' || bestSide.side === 'right') {
          if (bestSide.space < minSpaceForButtons) {
            buttonsLayout = 'vertical';
          }
        } else {
          if (bestSide.space < BTN_SIZE + MARGIN * 2) {
            buttonsLayout = 'horizontal';
          }
        }

        // Calculate actual position
        if (bestSide.side === 'left') {
          position.x = MARGIN;
          position.y = Math.max(MARGIN, rect.top);
        } else if (bestSide.side === 'right') {
          position.x = window.innerWidth - MARGIN;
          position.y = Math.max(MARGIN, rect.top);
        } else if (bestSide.side === 'top') {
          position.x = Math.max(MARGIN, rect.left);
          position.y = MARGIN;
        } else {
          position.x = Math.max(MARGIN, rect.left);
          position.y = window.innerHeight - MARGIN;
        }

        return { showPreview, buttonsLayout, position, side: bestSide.side };
      };

      const uiLayout = calcUIPosition();

      // ===== Create UI Container =====
      const uiContainer = document.createElement('div');
      uiContainer.id = 'screenshot-ui-container';

      // Position based on calculated layout
      const getContainerStyle = () => {
        const { side, position } = uiLayout;
        let style = `
          position: fixed;
          z-index: 2147483647;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          display: flex;
          gap: 10px;
          pointer-events: auto;
        `;

        if (side === 'left') {
          style += `left: ${MARGIN}px; top: ${position.y}px; flex-direction: column; align-items: flex-start;`;
        } else if (side === 'right') {
          style += `right: ${MARGIN}px; top: ${position.y}px; flex-direction: column; align-items: flex-end;`;
        } else if (side === 'top') {
          style += `top: ${MARGIN}px; left: ${position.x}px; flex-direction: row; align-items: flex-start;`;
        } else {
          style += `bottom: ${MARGIN}px; left: ${position.x}px; flex-direction: row; align-items: flex-end;`;
        }

        return style;
      };

      uiContainer.style.cssText = getContainerStyle();

      // ===== Preview Container (conditionally shown) =====
      let previewFrame = null;
      let previewImg = null;
      let statusBar = null;

      if (uiLayout.showPreview) {
        previewFrame = document.createElement('div');
        const previewWidth = Math.min(PREVIEW_WIDTH, uiLayout.position.side === 'left' ? spaceLeft - MARGIN * 2 :
          uiLayout.position.side === 'right' ? spaceRight - MARGIN * 2 : PREVIEW_WIDTH);
        previewFrame.style.cssText = `
          width: ${previewWidth}px;
          max-height: ${PREVIEW_MAX_HEIGHT}px;
          min-height: 100px;
          background: #1e1e1e;
          border: 2px solid ${COLORS.IDLE};
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column-reverse;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          position: relative;
        `;

        // Preview scrollable area (grows upward)
        const previewScroll = document.createElement('div');
        previewScroll.style.cssText = `
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column-reverse;
        `;

        previewImg = document.createElement('img');
        previewImg.style.cssText = 'width: 100%; display: block; object-fit: contain;';
        previewScroll.appendChild(previewImg);

        // Status Bar (at bottom)
        statusBar = document.createElement('div');
        statusBar.style.cssText = `
          flex-shrink: 0;
          background: rgba(0,0,0,0.85);
          color: white;
          padding: 8px 10px;
          font-size: 11px;
          text-align: center;
          backdrop-filter: blur(4px);
          border-top: 1px solid rgba(255,255,255,0.1);
        `;
        statusBar.textContent = t('screenshot_ready', 'Ready. Scroll to capture.');

        previewFrame.appendChild(statusBar);
        previewFrame.appendChild(previewScroll);
        uiContainer.appendChild(previewFrame);
      } else {
        // Minimal status indicator when no preview
        statusBar = document.createElement('div');
        statusBar.style.cssText = `
          background: rgba(0,0,0,0.85);
          color: white;
          padding: 6px 12px;
          font-size: 11px;
          border-radius: 16px;
          backdrop-filter: blur(4px);
          white-space: nowrap;
        `;
        statusBar.textContent = t('screenshot_ready', 'Ready');
      }

      // ===== Controls Container =====
      const controls = document.createElement('div');
      const isVertical = uiLayout.buttonsLayout === 'vertical' ||
        (uiLayout.side === 'left' || uiLayout.side === 'right');
      controls.style.cssText = `
        display: flex;
        gap: ${BTN_GAP}px;
        flex-direction: ${isVertical ? 'column' : 'row'};
        align-items: center;
      `;

      let controlTooltip = null;

      const hideControlTooltip = () => {
        if (controlTooltip) {
          controlTooltip.remove();
          controlTooltip = null;
        }
      };

      const showControlTooltip = (target, text) => {
        hideControlTooltip();
        const rect = target.getBoundingClientRect();
        if (!rect) return;

        controlTooltip = document.createElement('div');
        controlTooltip.textContent = text;
        controlTooltip.style.cssText = `
          position: fixed;
          left: 0;
          top: 0;
          z-index: 2147483648;
          padding: 6px 10px;
          border-radius: 8px;
          background: rgba(17, 24, 39, 0.96);
          color: #ffffff;
          font-size: 12px;
          line-height: 1.3;
          font-weight: 500;
          white-space: nowrap;
          pointer-events: none;
          box-shadow: 0 8px 20px rgba(0,0,0,0.28);
        `;
        document.body.appendChild(controlTooltip);

        const tooltipRect = controlTooltip.getBoundingClientRect();
        const margin = 8;
        let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
        let top = rect.top - tooltipRect.height - margin;

        if (top < margin) top = rect.bottom + margin;
        left = Math.max(margin, Math.min(left, window.innerWidth - tooltipRect.width - margin));

        controlTooltip.style.left = `${left}px`;
        controlTooltip.style.top = `${top}px`;
      };

      // Button style helper
      const createBtn = (text, icon, bgColor, textColor, borderColor) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        if (icon) {
          const iconSpan = document.createElement('span');
          iconSpan.textContent = icon;
          iconSpan.setAttribute('aria-hidden', 'true');
          setImportantStyles(iconSpan, {
            'display': 'inline-flex',
            'align-items': 'center',
            'justify-content': 'center',
            'width': '18px',
            'height': '18px',
            'min-width': '18px',
            'min-height': '18px',
            'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI Symbol', 'Apple Color Emoji', sans-serif",
            'font-size': icon === '▶' ? '16px' : '14px',
            'font-weight': '700',
            'line-height': '1',
            'letter-spacing': '0',
            'text-indent': '0',
            'text-transform': 'none',
            'color': 'currentColor',
            'background': 'transparent',
            'border': '0',
            'box-shadow': 'none',
            'overflow': 'visible',
            'transform': 'none',
            'flex': '0 0 auto',
            'pointer-events': 'none'
          });
          btn.appendChild(iconSpan);
        }
        btn.setAttribute('aria-label', text);
        setImportantStyles(btn, {
          'appearance': 'none',
          '-webkit-appearance': 'none',
          'box-sizing': 'border-box',
          'width': `${BTN_SIZE}px`,
          'height': `${BTN_SIZE}px`,
          'min-width': `${BTN_SIZE}px`,
          'min-height': `${BTN_SIZE}px`,
          'max-width': `${BTN_SIZE}px`,
          'max-height': `${BTN_SIZE}px`,
          'margin': '0',
          'padding': '0',
          'border-radius': '50%',
          'border': `2px solid ${borderColor || bgColor}`,
          'background': bgColor,
          'color': textColor,
          'cursor': 'pointer',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI Symbol', 'Apple Color Emoji', sans-serif",
          'font-size': '14px',
          'font-weight': '700',
          'line-height': '1',
          'letter-spacing': '0',
          'text-indent': '0',
          'text-transform': 'none',
          'vertical-align': 'middle',
          'overflow': 'visible',
          'outline': 'none',
          'transition': 'transform 0.1s, box-shadow 0.1s',
          'box-shadow': '0 2px 8px rgba(0,0,0,0.2)',
          'pointer-events': 'auto'
        });
        btn.addEventListener('mouseenter', () => {
          btn.style.setProperty('transform', 'scale(1.1)', 'important');
          btn.style.setProperty('box-shadow', '0 4px 12px rgba(0,0,0,0.3)', 'important');
          showControlTooltip(btn, text);
        });
        btn.addEventListener('mouseleave', () => {
          btn.style.setProperty('transform', 'scale(1)', 'important');
          btn.style.setProperty('box-shadow', '0 2px 8px rgba(0,0,0,0.2)', 'important');
          hideControlTooltip();
        });
        btn.addEventListener('focus', () => showControlTooltip(btn, text));
        btn.addEventListener('blur', () => hideControlTooltip());
        return btn;
      };

      // Main control buttons
      const cancelBtn = createBtn(t('screenshot_cancel', 'Cancel (Esc)'), '✕', '#ffffff', '#ef4444', '#ef4444');
      const autoBtn = createBtn(t('screenshot_auto_scroll', 'Auto Scroll'), '▶', '#111827', '#e5e7eb', '#4b5563');
      const finishBtn = createBtn(t('screenshot_finish', 'Finish & Save'), '✓', '#3b82f6', '#ffffff', '#3b82f6');

      const breatheStyleId = 'dev1-auto-scroll-breathe-style';
      if (!document.getElementById(breatheStyleId)) {
        const style = document.createElement('style');
        style.id = breatheStyleId;
        style.textContent = '@keyframes dev1AutoScrollBorderBreathe { 0%, 100% { border-color: #4b5563; } 50% { border-color: #60a5fa; } }';
        document.head.appendChild(style);
      }
      autoBtn.style.setProperty('animation', 'dev1AutoScrollBorderBreathe 3s ease-in-out infinite', 'important');

      const autoBtnWrap = document.createElement('div');
      setImportantStyles(autoBtnWrap, {
        'position': 'relative',
        'display': 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        'width': `${BTN_SIZE}px`,
        'height': `${BTN_SIZE}px`,
        'min-width': `${BTN_SIZE}px`,
        'min-height': `${BTN_SIZE}px`,
        'margin': '0',
        'padding': '0',
        'background': 'transparent',
        'border': '0',
        'box-shadow': 'none',
        'overflow': 'visible',
        'flex': '0 0 auto'
      });

      const directionBadge = document.createElement('div');
      setImportantStyles(directionBadge, {
        'position': 'absolute',
        'top': '-7px',
        'right': '-7px',
        'box-sizing': 'border-box',
        'display': 'inline-flex',
        'align-items': 'center',
        'justify-content': 'center',
        'min-width': '16px',
        'width': '16px',
        'height': '16px',
        'padding': '0',
        'margin': '0',
        'border-radius': '999px',
        'border': '0',
        'background': '#22c55e',
        'color': 'white',
        'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI Symbol', sans-serif",
        'font-size': '11px',
        'line-height': '1',
        'letter-spacing': '0',
        'text-align': 'center',
        'text-indent': '0',
        'text-transform': 'none',
        'font-weight': '700',
        'pointer-events': 'none',
        'box-shadow': '0 2px 6px rgba(0,0,0,0.25)',
        'overflow': 'visible',
        'transform': 'none'
      });
      autoBtnWrap.appendChild(autoBtn);
      autoBtnWrap.appendChild(directionBadge);

      // Auto-scroll control buttons (initially hidden)
      const pauseBtn = createBtn(t('screenshot_pause', 'Pause'), '⏸', '#f59e0b', '#ffffff', '#f59e0b');
      const resumeBtn = createBtn(t('screenshot_resume', 'Resume'), '▶', '#22c55e', '#ffffff', '#22c55e');

      pauseBtn.style.setProperty('display', 'none', 'important');
      resumeBtn.style.setProperty('display', 'none', 'important');

      controls.appendChild(cancelBtn);
      controls.appendChild(autoBtnWrap);
      controls.appendChild(pauseBtn);
      controls.appendChild(resumeBtn);
      controls.appendChild(finishBtn);

      // Add status bar if no preview
      if (!uiLayout.showPreview) {
        uiContainer.appendChild(statusBar);
      }
      uiContainer.appendChild(controls);

      // Get zoom-invariant container to prevent position drift during PDF zoom/resize
      const fixedLayer = this._getZoomInvariantContainer();
      fixedLayer.appendChild(uiContainer);

      // ===== Indicator on the page =====
      const indicator = document.createElement('div');
      indicator.id = 'screenshot-area-indicator';
      indicator.style.cssText = `
        position: fixed;
        left: ${rect.left}px;
        top: ${rect.top}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        pointer-events: none;
        z-index: 2147483646;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.3);
        box-sizing: border-box;
      `;

      // Create corner brackets
      const corners = ['tl', 'tr', 'bl', 'br'];
      const cornerElements = {};

      corners.forEach(corner => {
        const el = document.createElement('div');
        el.className = `screenshot-corner screenshot-corner-${corner}`;
        const isTop = corner.includes('t');
        const isLeft = corner.includes('l');

        el.style.cssText = `
          position: absolute;
          width: ${CORNER_SIZE}px;
          height: ${CORNER_SIZE}px;
          pointer-events: none;
          ${isTop ? 'top: 0' : 'bottom: 0'};
          ${isLeft ? 'left: 0' : 'right: 0'};
        `;

        const vLine = document.createElement('div');
        vLine.style.cssText = `
          position: absolute;
          width: ${BORDER_WIDTH}px;
          height: 100%;
          background: ${COLORS.IDLE};
          ${isLeft ? 'left: 0' : 'right: 0'};
          top: 0;
        `;

        const hLine = document.createElement('div');
        hLine.style.cssText = `
          position: absolute;
          width: 100%;
          height: ${BORDER_WIDTH}px;
          background: ${COLORS.IDLE};
          ${isTop ? 'top: 0' : 'bottom: 0'};
          ${isLeft ? 'left: 0' : 'right: 0'};
        `;

        el.appendChild(vLine);
        el.appendChild(hLine);
        indicator.appendChild(el);
        cornerElements[corner] = { el, vLine, hLine };
      });

      fixedLayer.appendChild(indicator);

      // Helper to update corner colors
      const updateCornerColors = (color) => {
        Object.values(cornerElements).forEach(({ vLine, hLine }) => {
          vLine.style.setProperty('background', color, 'important');
          hLine.style.setProperty('background', color, 'important');
        });
      };

      const hasViewportChanged = () => {
        try {
          const dw = Math.abs(window.innerWidth - baseViewport.width);
          const dh = Math.abs(window.innerHeight - baseViewport.height);
          const zoomChanged = (window.devicePixelRatio || 1) !== baseViewport.dpr;
          return dw > 2 || dh > 2 || zoomChanged;
        } catch (_) {
          return false;
        }
      };

      // ===== State Management =====
      let lastCapturedScrollY = window.scrollY;
      let capturedMinScrollY = lastCapturedScrollY;
      let capturedMaxScrollY = lastCapturedScrollY;

      let isCapturing = false;
      let scrollTimer = null;
      let currentStatus = 'IDLE';
      let captureCount = 0;
      let hasError = false;
      let autoMode = false;
      let autoPaused = false;
      let autoTimer = null;
      let needsRepairCapture = false;
      let lastErrorScrollY = null;
      let lastObservedScrollY = window.scrollY;
      let autoScrollDirection = 'down';
      let autoRepairTimer = null;
      let autoRepairing = false;

      const updateDirectionBadge = () => {
        const isUp = autoScrollDirection === 'up';
        directionBadge.textContent = isUp ? '↑' : '↓';
        directionBadge.style.setProperty('background', isUp ? '#f59e0b' : '#22c55e', 'important');
        directionBadge.title = this.config.lang === 'en' ? (isUp ? 'Auto scroll up' : 'Auto scroll down') : (isUp ? '自动向上滚动' : '自动向下滚动');
      };
      updateDirectionBadge();

      const getDirectionalScrollSlowlyMessage = () => {
        const isUp = autoScrollDirection === 'up';
        return this.config.lang === 'en' ? (isUp ? 'Scroll up slowly...' : 'Scroll down slowly...') : (isUp ? '缓慢向上滚动...' : '缓慢向下滚动...');
      };

      const getDirectionalScrollToCaptureMessage = () => {
        const isUp = autoScrollDirection === 'up';
        return this.config.lang === 'en' ? (isUp ? 'Scroll up...' : 'Scroll down...') : (isUp ? '向上滚动...' : '向下滚动...');
      };

      const getDirectionalReadyContinueMessage = () => {
        const isUp = autoScrollDirection === 'up';
        return this.config.lang === 'en' ? (isUp ? 'Ready. Continue upward...' : 'Ready. Continue downward...') : (isUp ? '准备继续向上滚动...' : '准备继续向下滚动...');
      };

      const getDirectionalAutoScrollingMessage = () => {
        const isUp = autoScrollDirection === 'up';
        return this.config.lang === 'en' ? (isUp ? 'Auto scrolling up...' : 'Auto scrolling down...') : (isUp ? '自动向上滚动中...' : '自动向下滚动中...');
      };

      // Status update function
      const setStatus = (status, message) => {
        if (currentStatus === status && statusBar.textContent === message) return;
        currentStatus = status;
        hasError = status === 'ERROR';

        const color = COLORS[status] || COLORS.IDLE;
        updateCornerColors(color);
        if (previewFrame) previewFrame.style.setProperty('border-color', color, 'important');
        statusBar.style.setProperty('color', status === 'IDLE' ? 'white' : color, 'important');
        statusBar.textContent = message;
      };

      // Helper to update preview (grows upward)
      const updatePreview = () => {
        if (previewImg) {
          previewImg.src = masterCanvas.toDataURL('image/png');
        }
      };

      const getUncapturedScrollDelta = (scrollY) => {
        const tolerance = 2;
        if (scrollY < capturedMinScrollY - tolerance) return scrollY - capturedMinScrollY;
        if (scrollY > capturedMaxScrollY + tolerance) return scrollY - capturedMaxScrollY;
        return 0;
      };

      const getCaptureBoundaryScrollY = (scrollY) => {
        if (scrollY < capturedMinScrollY) return capturedMinScrollY;
        if (scrollY > capturedMaxScrollY) return capturedMaxScrollY;
        return scrollY;
      };

      const waitForStableScrollY = async (initialScrollY, options = {}) => {
        const maxWaitMs = Number.isFinite(options.maxWaitMs) ? options.maxWaitMs : 420;
        const stableFrameCount = Number.isFinite(options.stableFrameCount) ? options.stableFrameCount : 3;
        const stableTolerancePx = Number.isFinite(options.stableTolerancePx) ? options.stableTolerancePx : 1;
        let lastScrollY = initialScrollY;
        let stableFrames = 0;
        const startTime = Date.now();
        while (Date.now() - startTime < maxWaitMs) {
          await new Promise(r => requestAnimationFrame(() => setTimeout(r, 16)));
          const currentScrollY = window.scrollY;
          if (Math.abs(currentScrollY - lastScrollY) <= stableTolerancePx) {
            stableFrames++;
            if (stableFrames >= stableFrameCount) return currentScrollY;
          } else {
            stableFrames = 0;
          }
          lastScrollY = currentScrollY;
        }
        return window.scrollY;
      };

      const findMatchedNewContentHeight = (frameCtx, expectedNewContentHeight, captureDirection, prevHeight) => {
        if (prevHeight <= 0 || expectedNewContentHeight <= 0 || expectedNewContentHeight >= viewHeight - 2) {
          return expectedNewContentHeight;
        }

        const radius = Math.max(6, Math.min(Math.round(viewHeight * 0.12), Math.round(expectedNewContentHeight * 0.35)));
        const minNewHeight = Math.max(3, expectedNewContentHeight - radius);
        const maxNewHeight = Math.min(viewHeight - 3, expectedNewContentHeight + radius);
        const minReliableOverlap = Math.max(24, Math.round(viewHeight * 0.08));
        if (maxNewHeight <= minNewHeight || viewHeight - maxNewHeight < minReliableOverlap) {
          return expectedNewContentHeight;
        }

        const maxOverlap = viewHeight - minNewHeight;
        if (prevHeight < minReliableOverlap || maxOverlap < minReliableOverlap) {
          return expectedNewContentHeight;
        }

        try {
          const masterDataHeight = Math.min(prevHeight, maxOverlap);
          const masterY = captureDirection === 'up' ? 0 : prevHeight - masterDataHeight;
          const masterData = masterCtx.getImageData(0, masterY, viewWidth, masterDataHeight).data;
          const frameData = frameCtx.getImageData(0, 0, viewWidth, viewHeight).data;
          const xStep = Math.max(4, Math.floor(viewWidth / 48));
          let bestHeight = expectedNewContentHeight;
          let bestScore = Infinity;
          const heightStep = Math.max(1, Math.round(dpr));

          for (let candidateHeight = minNewHeight; candidateHeight <= maxNewHeight; candidateHeight += heightStep) {
            const overlapHeight = viewHeight - candidateHeight;
            if (overlapHeight < minReliableOverlap || overlapHeight > prevHeight || overlapHeight > viewHeight - candidateHeight + 1) {
              continue;
            }

            const compareHeight = Math.min(overlapHeight, masterDataHeight, Math.round(viewHeight * 0.65));
            if (compareHeight < minReliableOverlap) continue;

            const yStep = Math.max(2, Math.floor(compareHeight / 32));
            let diffSum = 0;
            let sampleCount = 0;

            for (let y = 0; y < compareHeight; y += yStep) {
              const masterLocalY = captureDirection === 'up'
                ? y
                : masterDataHeight - overlapHeight + y;
              const frameY = captureDirection === 'up'
                ? candidateHeight + y
                : y;
              if (masterLocalY < 0 || masterLocalY >= masterDataHeight || frameY < 0 || frameY >= viewHeight) continue;

              for (let x = 0; x < viewWidth; x += xStep) {
                const masterIndex = ((masterLocalY * viewWidth) + x) * 4;
                const frameIndex = ((frameY * viewWidth) + x) * 4;
                diffSum += Math.abs(masterData[masterIndex] - frameData[frameIndex]);
                diffSum += Math.abs(masterData[masterIndex + 1] - frameData[frameIndex + 1]);
                diffSum += Math.abs(masterData[masterIndex + 2] - frameData[frameIndex + 2]);
                sampleCount += 3;
              }
            }

            if (!sampleCount) continue;
            const averageDiff = diffSum / sampleCount;
            const score = averageDiff + Math.abs(candidateHeight - expectedNewContentHeight) * 0.08;
            if (score < bestScore) {
              bestScore = score;
              bestHeight = candidateHeight;
            }
          }

          return bestHeight;
        } catch (_) {
          return expectedNewContentHeight;
        }
      };

      const scheduleAutoRepair = () => {
        if (autoRepairing || !needsRepairCapture || !Number.isFinite(lastErrorScrollY)) return;
        if (autoRepairTimer) clearTimeout(autoRepairTimer);
        autoRepairTimer = setTimeout(() => {
          autoRepairTimer = null;
          if (!needsRepairCapture || !Number.isFinite(lastErrorScrollY)) return;
          autoRepairing = true;
          stopAutoScroll();
          const buffer = Math.max(12, Math.min(80, Math.round(cleanRect.height * 0.08)));
          const targetScrollY = autoScrollDirection === 'up'
            ? Math.max(0, lastErrorScrollY - buffer)
            : lastErrorScrollY + buffer;
          setStatus('PAUSED', t('screenshot_auto_returning', 'Returning to memory point...'));
          window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
          setTimeout(async () => {
            try {
              if (!needsRepairCapture) return;
              await performRepairCapture();
            } finally {
              autoRepairing = false;
              lastObservedScrollY = window.scrollY;
            }
          }, 420);
        }, 180);
      };

      // Capture a single frame - simple and reliable: always take from bottom of capture area
      const captureFrame = async (scrollY, isRepairMode = false, useStableScroll = false) => {
        if (hasError && !isRepairMode) return false;

        if (hasViewportChanged()) {
          setStatus('ERROR', t('screenshot_error_init', 'Window or zoom changed. Please restart.'));
          return false;
        }

        const isFirstIncrementCapture = !isRepairMode && captureCount <= 1;
        let effectiveScrollY = scrollY;
        if (useStableScroll && !isRepairMode) {
          const stableOptions = isFirstIncrementCapture
            ? { maxWaitMs: 760, stableFrameCount: 5, stableTolerancePx: 1 }
            : undefined;
          effectiveScrollY = await waitForStableScrollY(scrollY, stableOptions);
          if (hasViewportChanged()) {
            setStatus('ERROR', t('screenshot_error_init', 'Window or zoom changed. Please restart.'));
            return false;
          }
        }

        const referenceScrollY = isRepairMode ? lastCapturedScrollY : getCaptureBoundaryScrollY(effectiveScrollY);
        const scrollDelta = effectiveScrollY - referenceScrollY;
        const captureDirection = scrollDelta < 0 ? 'up' : 'down';
        const absScrollDelta = Math.abs(scrollDelta);

        if (scrollDelta === 0 && !isRepairMode) return true;

        // Allow up to 95% of viewport height - almost full viewport scroll is OK
        const maxGap = cleanRect.height * 0.95;
        if (absScrollDelta > maxGap && !isRepairMode) {
          setStatus('ERROR', t('screenshot_gap_large', '⚠️ Gap too large! Scroll back.'));
          lastErrorScrollY = referenceScrollY;
          needsRepairCapture = true;
          scheduleAutoRepair();
          return false;
        }

        const doc = document.documentElement || document.body;
        const atBottom = doc
          ? (effectiveScrollY + window.innerHeight) >= ((doc.scrollHeight || doc.offsetHeight || 0) - 4)
          : false;
        const atTop = effectiveScrollY <= 2;
        // Lower threshold - capture even small scrolls
        const minDelta = Math.min(cleanRect.height * 0.15, Math.max(10, cleanRect.height * 0.03));
        const firstCaptureMinDelta = Math.max(
          minDelta,
          Math.min(cleanRect.height * 0.2, Math.max(24, cleanRect.height * 0.08))
        );
        const requiredMinDelta = isFirstIncrementCapture ? firstCaptureMinDelta : minDelta;
        const atEdge = captureDirection === 'up' ? atTop : atBottom;
        if (!atEdge && absScrollDelta < requiredMinDelta && !isRepairMode) {
          return true;
        }

        try {
          // Quick stabilization wait
          await new Promise(r => requestAnimationFrame(() => setTimeout(r, 30)));

          const response = await this._captureVisibleTab();

          if (response && response.dataUrl) {
            const img = new Image();
            img.src = response.dataUrl;
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
            });

            const prevHeight = masterCanvas.height;
            const frameCanvas = document.createElement('canvas');
            frameCanvas.width = viewWidth;
            frameCanvas.height = viewHeight;
            const frameCtx = frameCanvas.getContext('2d', { willReadFrequently: true });
            frameCtx.drawImage(
              img,
              cleanRect.left * dpr, cleanRect.top * dpr, viewWidth, viewHeight,
              0, 0, viewWidth, viewHeight
            );

            // Simple approach: take scrollDelta worth of content from the BOTTOM of capture area
            // This is the new content that scrolled into view
            let newContentHeight = Math.round(absScrollDelta * dpr);

            // For repair mode, capture more
            if (isRepairMode) {
              newContentHeight = Math.max(newContentHeight, Math.round(cleanRect.height * 0.4 * dpr));
            }

            // Clamp to available height
            newContentHeight = Math.min(newContentHeight, viewHeight);
            if (!isRepairMode) {
              const expectedNewContentHeight = newContentHeight;
              const matchedNewContentHeight = findMatchedNewContentHeight(frameCtx, expectedNewContentHeight, captureDirection, prevHeight);
              if (isFirstIncrementCapture) {
                const maxFirstCaptureAdjust = Math.max(14, Math.round(expectedNewContentHeight * 0.28));
                newContentHeight = Math.abs(matchedNewContentHeight - expectedNewContentHeight) > maxFirstCaptureAdjust
                  ? expectedNewContentHeight
                  : matchedNewContentHeight;
              } else {
                newContentHeight = matchedNewContentHeight;
              }
            }

            if (newContentHeight <= 2) {
              return true;
            }

            // Source: from the BOTTOM of the capture area, going up by newContentHeight
            // This is the new content that appeared after scrolling
            const sourceY = captureDirection === 'up'
              ? cleanRect.top * dpr
              : (cleanRect.top + cleanRect.height) * dpr - newContentHeight;

            // Backup previous content
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = masterCanvas.width;
            tempCanvas.height = prevHeight;
            if (prevHeight > 0) {
              tempCanvas.getContext('2d').drawImage(masterCanvas, 0, 0);
            }

            // Resize and draw
            masterCanvas.height = prevHeight + newContentHeight;
            masterCtx.clearRect(0, 0, masterCanvas.width, masterCanvas.height);

            if (captureDirection === 'up') {
              masterCtx.drawImage(
                frameCanvas,
                0, sourceY - (cleanRect.top * dpr), viewWidth, newContentHeight,
                0, 0, viewWidth, newContentHeight
              );
              if (prevHeight > 0) {
                masterCtx.drawImage(tempCanvas, 0, newContentHeight);
              }
            } else {
              if (prevHeight > 0) {
                masterCtx.drawImage(tempCanvas, 0, 0);
              }
              // Append new content at the bottom
              masterCtx.drawImage(
                frameCanvas,
                0, sourceY - (cleanRect.top * dpr), viewWidth, newContentHeight,
                0, prevHeight, viewWidth, newContentHeight
              );
            }

            lastCapturedScrollY = effectiveScrollY;
            capturedMinScrollY = Math.min(capturedMinScrollY, effectiveScrollY);
            capturedMaxScrollY = Math.max(capturedMaxScrollY, effectiveScrollY);
            captureCount++;
            needsRepairCapture = false;
            updatePreview();
            return true;
          }
          return false;
        } catch (e) {
          console.error('Capture error:', e);
          return false;
        }
      };

      // Repair capture function
      const performRepairCapture = async () => {
        if (!needsRepairCapture) return false;

        setStatus('SCROLLING', t('screenshot_repairing', 'Repairing...'));
        isCapturing = true;

        const currentScrollY = window.scrollY;
        const success = await captureFrame(currentScrollY, true);

        isCapturing = false;
        hasError = false;

        if (success) {
          setStatus('SCROLLING', t('screenshot_repaired', 'Fixed! Continue...'));
          setTimeout(() => {
            if (currentStatus === 'SCROLLING') {
              setStatus('IDLE', getDirectionalScrollSlowlyMessage());
            }
          }, 800);
        }

        return success;
      };

      const releaseStability = this._prepareLongScreenshotStability();
      const waitForStabilityStyle = async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        await new Promise(resolve => setTimeout(resolve, 130));
      };

      // ===== Initial Capture =====
      try {
        await waitForStabilityStyle();
        setStatus('IDLE', t('screenshot_capturing_initial', 'Capturing initial view...'));

        if (hasViewportChanged()) {
          setStatus('ERROR', t('screenshot_error_init', 'Window or zoom changed. Please restart.'));
          return;
        }

        const response = await this._captureVisibleTab();

        if (response && response.dataUrl) {
          const img = new Image();
          img.src = response.dataUrl;
          await new Promise(r => img.onload = r);

          masterCanvas.width = viewWidth;
          masterCanvas.height = viewHeight;
          masterCtx.clearRect(0, 0, masterCanvas.width, masterCanvas.height);
          masterCtx.drawImage(
            img,
            cleanRect.left * dpr, cleanRect.top * dpr, viewWidth, viewHeight,
            0, 0, viewWidth, viewHeight
          );
          updatePreview();
          captureCount = 1;
          setStatus('IDLE', getDirectionalScrollSlowlyMessage());
        }
      } catch (e) {
        console.error(e);
        setStatus('ERROR', t('screenshot_error_init', 'Error initializing. Try again.'));
      }

      // ===== Scroll Handler =====
      const onScroll = () => {
        if (isCapturing) return;
        if (autoRepairing) return;
        if (autoMode && !autoPaused) return;
        if (hasViewportChanged()) {
          setStatus('ERROR', t('screenshot_error_init', 'Window or zoom changed. Please restart.'));
          return;
        }

        const currentScrollY = window.scrollY;
        const observedDelta = currentScrollY - lastObservedScrollY;
        if (observedDelta !== 0) {
          autoScrollDirection = observedDelta < 0 ? 'up' : 'down';
          updateDirectionBadge();
          lastObservedScrollY = currentScrollY;
        }
        const scrollDelta = getUncapturedScrollDelta(currentScrollY);

        if (scrollDelta === 0 && !hasError) {
          setStatus('IDLE', getDirectionalReadyContinueMessage());
        } else if (scrollDelta > 0) {
          const maxGap = cleanRect.height * 0.95;
          if (scrollDelta > maxGap) {
            setStatus('ERROR', t('screenshot_too_far', '⚠️ Too far! Scroll back.'));
            lastErrorScrollY = capturedMaxScrollY;
            needsRepairCapture = true;
            scheduleAutoRepair();
          } else if (scrollDelta > maxGap * 0.85) {
            setStatus('TOO_FAST', t('screenshot_slow_down', '⚠️ Slow down...'));
          } else {
            setStatus('SCROLLING', t('screenshot_scrolling', 'Scrolling...'));
          }
        } else if (scrollDelta < 0) {
          if (hasError && needsRepairCapture) {
            const distanceFromError = Math.abs(currentScrollY - lastErrorScrollY);
            const repairZone = cleanRect.height * 0.5;

            if (distanceFromError <= repairZone) {
              setStatus('PAUSED', t('screenshot_repair_ready', '🔧 Stop to repair...'));
            } else {
              setStatus('TOO_FAST', t('screenshot_scroll_back_more', '↑ Scroll back more...'));
            }
          } else {
            setStatus('IDLE', getDirectionalReadyContinueMessage());
          }
        }

        if (scrollTimer) clearTimeout(scrollTimer);

        scrollTimer = setTimeout(async () => {
          const finalScrollY = window.scrollY;
          const finalDelta = getUncapturedScrollDelta(finalScrollY);

          // Check if we need to perform a repair capture
          if (hasError && needsRepairCapture) {
            const distanceFromError = Math.abs(finalScrollY - lastErrorScrollY);
            const repairZone = cleanRect.height * 0.5;

            if (distanceFromError <= repairZone) {
              await performRepairCapture();
              return;
            } else {
              setStatus('ERROR', t('screenshot_scroll_back_more', '↑ Scroll back more...'));
              scheduleAutoRepair();
              return;
            }
          }

          if (finalDelta === 0) {
            setStatus('IDLE', getDirectionalScrollToCaptureMessage());
            return;
          }

          if (hasError) return;

          const maxGap = cleanRect.height * 0.95;
          if (Math.abs(finalDelta) > maxGap) {
            setStatus('ERROR', t('screenshot_gap_large_slow', '⚠️ Gap too large! Scroll back.'));
            lastErrorScrollY = finalDelta < 0 ? capturedMinScrollY : capturedMaxScrollY;
            needsRepairCapture = true;
            scheduleAutoRepair();
            return;
          }

          isCapturing = true;

          const success = await captureFrame(finalScrollY, false, true);
          isCapturing = false;

          if (success) {
            setStatus('IDLE', getDirectionalScrollSlowlyMessage());
          } else {
            setStatus('ERROR', t('screenshot_capture_failed', 'Failed. Scroll back.'));
            lastErrorScrollY = lastCapturedScrollY;
            needsRepairCapture = true;
            scheduleAutoRepair();
          }
        }, 100);
      };

      window.addEventListener('scroll', onScroll, { passive: true });

      // ===== Finish & Cleanup =====
      const finish = () => {
        setStatus('IDLE', t('screenshot_saving', 'Saving...'));
        setTimeout(() => {
          this._showScreenshotResult(masterCanvas.toDataURL('image/png'), 'long_screenshot');
          cleanup();
        }, 100);
      };

      const cleanup = () => {
        this.activeSessionCleanup = null;
        autoMode = false;
        autoPaused = false;
        if (autoTimer) {
          clearTimeout(autoTimer);
          autoTimer = null;
        }
        if (autoRepairTimer) {
          clearTimeout(autoRepairTimer);
          autoRepairTimer = null;
        }
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('contextmenu', onContextMenu);
        hideControlTooltip();
        uiContainer.remove();
        indicator.remove();
        try { releaseStability(); } catch (_) { }
        this._removeZoomInvariantContainer();
        if (scrollTimer) clearTimeout(scrollTimer);
        // 长截图结束，清除截图状态
        this._isScreenshotting = false;

        try {
          if (typeof window.__dev1SnapshotHighlighter !== 'undefined' && 
              window.__dev1SnapshotHighlighter._instance && 
              typeof window.__dev1SnapshotHighlighter._instance._releaseCursor === 'function') {
            window.__dev1SnapshotHighlighter._instance._releaseCursor('screenshot');
          }
        } catch (_) {}
      };

      this.activeSessionCleanup = cleanup;

      // ===== Auto Scroll Functions =====
      const showAutoControls = () => {
        autoBtnWrap.style.setProperty('display', 'none', 'important');
        pauseBtn.style.setProperty('display', 'flex', 'important');
        resumeBtn.style.setProperty('display', 'none', 'important');
      };

      const showPausedControls = () => {
        pauseBtn.style.setProperty('display', 'none', 'important');
        resumeBtn.style.setProperty('display', 'flex', 'important');
      };

      const showResumedControls = () => {
        pauseBtn.style.setProperty('display', 'flex', 'important');
        resumeBtn.style.setProperty('display', 'none', 'important');
      };

      const stopAutoScroll = () => {
        autoMode = false;
        autoPaused = false;
        if (autoTimer) {
          clearTimeout(autoTimer);
          autoTimer = null;
        }
        lastObservedScrollY = window.scrollY;
        autoBtnWrap.style.setProperty('display', 'flex', 'important');
        pauseBtn.style.setProperty('display', 'none', 'important');
        resumeBtn.style.setProperty('display', 'none', 'important');
      };

      const startAutoScroll = () => {
        if (autoMode && !autoPaused) return;
        autoMode = true;
        autoPaused = false;
        showAutoControls();

        const doc = document.scrollingElement || document.documentElement || document.body;
        const stepPx = Math.max(16, Math.round(cleanRect.height * 0.7));

        const runStep = async () => {
          if (!autoMode || autoPaused) return;
          if (hasViewportChanged()) {
            setStatus('ERROR', t('screenshot_error_init', 'Window or zoom changed. Please restart.'));
            stopAutoScroll();
            return;
          }

          const currentScrollY = window.scrollY;
          const maxScrollYBase = (doc && doc.scrollHeight) || (document.body && document.body.scrollHeight) || 0;
          const maxScrollY = Math.max(0, maxScrollYBase - window.innerHeight);

          if ((autoScrollDirection === 'down' && currentScrollY >= maxScrollY - 2) ||
            (autoScrollDirection === 'up' && currentScrollY <= 2)) {
            stopAutoScroll();
            finish();
            return;
          }

          const nextScrollY = autoScrollDirection === 'up'
            ? Math.max(currentScrollY - stepPx, 0)
            : Math.min(currentScrollY + stepPx, maxScrollY);
          window.scrollTo(0, nextScrollY);

          await new Promise((r) => setTimeout(r, 220));

          isCapturing = true;
          const success = await captureFrame(nextScrollY);
          isCapturing = false;

          if (!autoMode || autoPaused) return;

          if (!success) {
            setStatus('ERROR', t('screenshot_capture_failed', 'Capture failed. Scroll back.'));
            lastErrorScrollY = lastCapturedScrollY;
            needsRepairCapture = true;
            stopAutoScroll();
            scheduleAutoRepair();
            return;
          }

          autoTimer = setTimeout(runStep, 180);
        };

        setStatus('SCROLLING', getDirectionalAutoScrollingMessage());
        runStep();
      };

      const pauseAutoScroll = () => {
        if (!autoMode || autoPaused) return;
        autoPaused = true;
        if (autoTimer) {
          clearTimeout(autoTimer);
          autoTimer = null;
        }
        showPausedControls();
        setStatus('PAUSED', t('screenshot_paused', 'Paused - scroll manually or resume'));
      };

      const resumeAutoScroll = () => {
        if (!autoMode || !autoPaused) return;
        autoPaused = false;
        showResumedControls();
        startAutoScroll();
      };

      // ===== ESC Key Handler =====
      const onKeyDown = (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          cleanup();
        }
      };
      document.addEventListener('keydown', onKeyDown);

      // ===== 右键取消 =====
      const onContextMenu = (e) => {
        e.preventDefault();
        cleanup();
      };
      document.addEventListener('contextmenu', onContextMenu);

      // ===== Wire up control buttons =====
      finishBtn.onclick = () => finish();
      cancelBtn.onclick = () => cleanup();
      autoBtn.onclick = () => startAutoScroll();
      pauseBtn.onclick = () => pauseAutoScroll();
      resumeBtn.onclick = () => resumeAutoScroll();
    }

// =================================================================================
// IV. MARKDOWN SOURCE, IMAGE & SETTINGS (Markdown 来源、图片与设置)
// =================================================================================


    _isMarkdownSourceCandidateVisible(element, options = {}) {
      if (!element || !(element instanceof Element)) return false;
      if (element.id === HOST_ID || element.closest(`#${HOST_ID}`)) return false;
      const tagName = String(element.tagName || '').toLowerCase();
      if (/^(script|style|noscript|template|svg|canvas|iframe|nav|footer|header)$/i.test(tagName)) return false;
      try {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        const rect = element.getBoundingClientRect();
        const minWidth = Number.isFinite(Number(options.minWidth)) ? Number(options.minWidth) : 120;
        const minHeight = Number.isFinite(Number(options.minHeight)) ? Number(options.minHeight) : 40;
        return rect.width >= minWidth && rect.height >= minHeight;
      } catch (_) {
        return false;
      }
    }

    _getMarkdownSourceText(element) {
      if (!element) return '';
      try {
        return String(element.innerText || element.textContent || '').replace(/\s+/g, ' ').trim();
      } catch (_) {
        return '';
      }
    }

    _normalizeMarkdownLookupText(text) {
      return String(text || '')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, ' $1 ')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, ' $1 ')
        .replace(/`([^`]+)`/g, ' $1 ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/(^|\n)\s{0,3}#{1,6}\s+/g, ' ')
        .replace(/(^|\n)\s*[-*+]\s+/g, ' ')
        .replace(/(^|\n)\s*\d+[.)]\s+/g, ' ')
        .replace(/&(?:nbsp|amp|lt|gt|quot);/gi, ' ')
        .replace(/[*_~>#|[\]{}()"':`]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .toLowerCase();
    }

    _trimMarkdownLookupText(text, maxLength = 220) {
      const normalized = this._normalizeMarkdownLookupText(text);
      if (normalized.length <= maxLength) return normalized;
      const clipped = normalized.slice(0, maxLength);
      const lastSpace = clipped.lastIndexOf(' ');
      return lastSpace > 80 ? clipped.slice(0, lastSpace).trim() : clipped.trim();
    }

    _trimMarkdownLookupTail(text, maxLength = 180) {
      const normalized = this._normalizeMarkdownLookupText(text);
      if (normalized.length <= maxLength) return normalized;
      const clipped = normalized.slice(Math.max(0, normalized.length - maxLength));
      const firstSpace = clipped.indexOf(' ');
      return firstSpace > 0 && firstSpace < 80 ? clipped.slice(firstSpace + 1).trim() : clipped.trim();
    }

    _countMarkdownLookupOccurrences(haystackText, needleText) {
      const haystack = this._normalizeMarkdownLookupText(haystackText);
      const needle = this._normalizeMarkdownLookupText(needleText);
      if (!haystack || !needle || needle.length < 8) return 0;
      let count = 0;
      let index = 0;
      while ((index = haystack.indexOf(needle, index)) !== -1) {
        count += 1;
        index += Math.max(needle.length, 1);
      }
      return count;
    }

    _buildMarkdownLookupPayload(target, label, value, start, end, lookupText) {
      const normalizedLookup = this._trimMarkdownLookupText(lookupText);
      const rawLookupText = String(lookupText || '').replace(/\s+/g, ' ').trim();
      const rawBeforeText = String(value.slice(Math.max(0, start - 700), start) || '').replace(/\s+/g, ' ').trim();
      const rawAfterText = String(value.slice(end, Math.min(value.length, end + 700)) || '').replace(/\s+/g, ' ').trim();
      const beforeText = this._trimMarkdownLookupTail(value.slice(Math.max(0, start - 520), start), 260);
      const afterText = this._trimMarkdownLookupText(value.slice(end, Math.min(value.length, end + 520)), 260);
      return {
        target,
        label,
        lookupText: normalizedLookup,
        rawLookupText,
        selectedText: rawLookupText,
        beforeText,
        afterText,
        rawBeforeText,
        rawAfterText,
        occurrenceIndex: this._countMarkdownLookupOccurrences(value.slice(0, start), normalizedLookup)
      };
    }

    _getMarkdownTextareaSourceLookup(textarea, mode = 'article', defaultLabel = '正文来源') {
      if (!(textarea instanceof HTMLTextAreaElement)) {
        return { target: 'content', label: defaultLabel, lookupText: '' };
      }
      const value = String(textarea.value || '');
      const savedSelection = textarea.__dev1MdLastSelection || {};
      const rawSelectionStart = Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : savedSelection.start;
      const rawSelectionEnd = Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : savedSelection.end;
      const selectionStart = Number.isFinite(savedSelection.start) ? savedSelection.start : (Number.isFinite(rawSelectionStart) ? rawSelectionStart : 0);
      const selectionEnd = Number.isFinite(savedSelection.end) ? savedSelection.end : (Number.isFinite(rawSelectionEnd) ? rawSelectionEnd : selectionStart);
      const start = Math.max(0, Math.min(selectionStart, selectionEnd));
      const end = Math.max(start, Math.max(selectionStart, selectionEnd));
      const lineStart = value.lastIndexOf('\n', Math.max(0, start - 1)) + 1;
      const nextLineBreak = value.indexOf('\n', end);
      const lineEnd = nextLineBreak === -1 ? value.length : nextLineBreak;
      const lineText = value.slice(lineStart, lineEnd);

      if (mode === 'template') {
        const contextStart = Math.max(0, start - 90);
        const contextEnd = Math.min(value.length, end + 90);
        const context = value.slice(contextStart, contextEnd);
        const placeholderPattern = /\{\{\s*(title|content|description|author|published|url|created)\s*\}\}/gi;
        let placeholder = '';
        let bestPlaceholderDistance = Infinity;
        let placeholderMatch = null;
        while ((placeholderMatch = placeholderPattern.exec(context))) {
          const absoluteStart = contextStart + placeholderMatch.index;
          const absoluteEnd = absoluteStart + placeholderMatch[0].length;
          const overlapsCaret = absoluteStart <= end && absoluteEnd >= start;
          const distance = overlapsCaret
            ? 0
            : Math.min(Math.abs(absoluteEnd - start), Math.abs(absoluteStart - end));
          if (distance < bestPlaceholderDistance) {
            bestPlaceholderDistance = distance;
            placeholder = String(placeholderMatch[1] || '').toLowerCase();
          }
        }
        if (placeholder === 'content') {
          return { target: 'content', label: '{{content}} 对应正文来源', lookupText: '' };
        }
        if (placeholder === 'title') {
          return { target: 'title', label: '{{title}} 对应标题来源', lookupText: document.title || '' };
        }
        if (placeholder) {
          return { target: 'metadata', label: `{{${placeholder}}}` };
        }

        const yamlFieldMatch = lineText.match(/^\s*([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
        if (yamlFieldMatch) {
          const fieldName = String(yamlFieldMatch[1] || '').trim().toLowerCase();
          const fieldValue = String(yamlFieldMatch[2] || '').trim().replace(/^['"]|['"]$/g, '').trim();
          if (fieldName === 'title') {
            return { target: 'title', label: 'title 对应标题来源', lookupText: fieldValue || document.title || '', rawLookupText: fieldValue || document.title || '' };
          }
          if (fieldName === 'description' || fieldName === 'author' || fieldName === 'published') {
            if (fieldValue.length >= 4) {
              return {
                target: 'content',
                label: `${fieldName} 对应页面位置`,
                lookupText: this._trimMarkdownLookupText(fieldValue),
                rawLookupText: fieldValue,
                beforeText: '',
                afterText: ''
              };
            }
            return { target: 'metadata', label: fieldName };
          }
          if (fieldName === 'source' || fieldName === 'url' || fieldName === 'created' || fieldName === 'tags') {
            return { target: 'metadata', label: fieldName };
          }
        }
      }

      const aroundText = value.slice(Math.max(0, start - 140), Math.min(value.length, end + 140));
      const lineLookup = this._trimMarkdownLookupText(lineText.length > 260 ? aroundText : lineText);
      if (lineLookup.length >= 8) {
        if (lineText.length > 260) {
          return this._buildMarkdownLookupPayload('content', defaultLabel, value, Math.max(0, start - 140), Math.min(value.length, end + 140), aroundText);
        } else {
          return this._buildMarkdownLookupPayload('content', defaultLabel, value, lineStart, lineEnd, lineText);
        }
      }

      const prevBlank = value.lastIndexOf('\n\n', Math.max(0, start - 1));
      const nextBlank = value.indexOf('\n\n', end);
      const paragraphStart = prevBlank === -1 ? 0 : prevBlank + 2;
      const paragraphEnd = nextBlank === -1 ? value.length : nextBlank;
      const paragraphText = value.slice(paragraphStart, paragraphEnd);
      const paragraphLookup = this._trimMarkdownLookupText(paragraphText);
      if (paragraphLookup.length >= 12) {
        return this._buildMarkdownLookupPayload('content', defaultLabel, value, paragraphStart, paragraphEnd, paragraphText);
      }

      const aroundLookup = this._trimMarkdownLookupText(aroundText);
      if (aroundLookup.length >= 12) {
        return this._buildMarkdownLookupPayload('content', defaultLabel, value, Math.max(0, start - 140), Math.min(value.length, end + 140), aroundText);
      }
      return { target: 'content', label: defaultLabel, lookupText: '' };
    }

    _bindMarkdownTextareaSelectionMemory(textarea) {
      if (!(textarea instanceof HTMLTextAreaElement) || textarea.__dev1MdSelectionMemoryBound) return;
      textarea.__dev1MdSelectionMemoryBound = true;
      const remember = () => {
        const valueLength = String(textarea.value || '').length;
        const start = Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : valueLength;
        const end = Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : start;
        textarea.__dev1MdLastSelection = {
          start: Math.max(0, Math.min(valueLength, start)),
          end: Math.max(0, Math.min(valueLength, end))
        };
      };
      ['select', 'selectionchange', 'keyup', 'mouseup', 'pointerup', 'input', 'focus', 'click'].forEach((eventName) => {
        textarea.addEventListener(eventName, remember);
      });
      remember();
    }

    _getMarkdownLinkTextLength(element) {
      try {
        return Array.from(element.querySelectorAll('a'))
          .reduce((sum, link) => sum + this._getMarkdownSourceText(link).length, 0);
      } catch (_) {
        return 0;
      }
    }

    _findMarkdownSourceElement() {
      const readerArticle = document.querySelector('.obsidian-reader-active .obsidian-reader-content article');
      if (this._isMarkdownSourceCandidateVisible(readerArticle) && this._getMarkdownSourceText(readerArticle).length >= 80) {
        return readerArticle;
      }

      const selectors = [
        'article',
        'main article',
        'main',
        '[role="main"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.markdown-body',
        '.reader-content',
        '.content'
      ];
      const candidates = new Set();
      selectors.forEach((selector) => {
        try {
          document.querySelectorAll(selector).forEach((element) => candidates.add(element));
        } catch (_) { }
      });
      if (candidates.size < 12) {
        try {
          Array.from(document.querySelectorAll('article, main, [role="main"], section, div'))
            .slice(0, 1800)
            .forEach((element) => candidates.add(element));
        } catch (_) { }
      }

      let best = null;
      let bestScore = 0;
      for (const element of candidates) {
        if (!this._isMarkdownSourceCandidateVisible(element)) continue;
        const text = this._getMarkdownSourceText(element);
        const textLength = text.length;
        if (textLength < 160) continue;

        const tagName = String(element.tagName || '').toLowerCase();
        const role = String(element.getAttribute('role') || '').toLowerCase();
        const className = String(element.className || '').toLowerCase();
        let rectArea = 0;
        try {
          const rect = element.getBoundingClientRect();
          rectArea = Math.min((rect.width * rect.height) / 1000, 500);
        } catch (_) { }

        let paragraphCount = 0;
        let headingCount = 0;
        try {
          paragraphCount = element.querySelectorAll('p').length;
          headingCount = element.querySelectorAll('h1,h2,h3').length;
        } catch (_) { }

        const linkRatio = Math.min(1, this._getMarkdownLinkTextLength(element) / Math.max(textLength, 1));
        let score = Math.min(textLength, 8000) + paragraphCount * 240 + headingCount * 120 + rectArea - linkRatio * 2200;
        if (tagName === 'article') score += 1800;
        if (tagName === 'main' || role === 'main') score += 700;
        if (/(article|post|entry|reader|markdown)/i.test(className)) score += 650;
        if (/(nav|menu|sidebar|footer|header|comment|related)/i.test(className)) score -= 2200;

        if (score > bestScore) {
          bestScore = score;
          best = element;
        }
      }
      return best;
    }

    _findMarkdownTitleElement(lookupText = '') {
      const candidates = [];
      try {
        candidates.push(...Array.from(document.querySelectorAll('h1, [itemprop="headline"], .article-title, .post-title, .entry-title')));
      } catch (_) { }
      const lookup = this._normalizeMarkdownLookupText(lookupText || document.title || '');
      let best = null;
      let bestScore = 0;
      for (const element of candidates) {
        if (!this._isMarkdownSourceCandidateVisible(element, { minWidth: 8, minHeight: 1 })) continue;
        const text = this._normalizeMarkdownLookupText(this._getMarkdownSourceText(element));
        if (!text) continue;
        let score = 100;
        if (lookup && text.includes(lookup)) score += 1000;
        if (lookup && lookup.includes(text)) score += 800;
        if (String(element.tagName || '').toLowerCase() === 'h1') score += 250;
        score -= Math.abs(text.length - lookup.length);
        if (score > bestScore) {
          bestScore = score;
          best = element;
        }
      }
      return best;
    }

    _getMarkdownLookupFragments(lookupText) {
      const lookup = this._normalizeMarkdownLookupText(lookupText);
      if (!lookup) return [];
      const fragments = new Set();
      const addFragment = (fragment) => {
        const cleaned = String(fragment || '').replace(/\s+/g, ' ').trim();
        if (cleaned.length >= 8) fragments.add(cleaned);
      };

      addFragment(lookup);
      const lengths = lookup.length >= 80 ? [72, 48, 32, 20] : [48, 32, 20, 12];
      for (const length of lengths) {
        if (lookup.length <= length) continue;
        const starts = [
          0,
          Math.max(0, Math.floor((lookup.length - length) / 2)),
          Math.max(0, lookup.length - length)
        ];
        starts.forEach((start) => addFragment(lookup.slice(start, start + length)));
      }

      const sentences = lookup.split(/\s*[。！？!?；;]\s*|\s{2,}/).filter(Boolean);
      sentences.slice(0, 8).forEach((sentence) => addFragment(sentence.slice(0, 80)));

      const words = lookup.split(/\s+/).filter((word) => word.length >= 2);
      if (words.length >= 4) {
        for (let i = 0; i <= words.length - 4; i += 2) {
          addFragment(words.slice(i, Math.min(words.length, i + 8)).join(' '));
        }
      }

      return Array.from(fragments).sort((a, b) => b.length - a.length).slice(0, 18);
    }

    _scoreMarkdownElementForLookup(element, lookup, fragments = []) {
      if (!this._isMarkdownSourceCandidateVisible(element, { minWidth: 8, minHeight: 1 })) return 0;
      const text = this._normalizeMarkdownLookupText(this._getMarkdownSourceText(element));
      if (text.length < 4) return 0;

      const tagName = String(element.tagName || '').toLowerCase();
      const className = String(element.className || '').toLowerCase();
      let score = 0;

      if (lookup && text.includes(lookup)) {
        score = 26000 - Math.min(text.length, 12000) * 0.8;
      } else if (lookup && lookup.includes(text) && text.length >= Math.min(24, lookup.length)) {
        score = 12000 + text.length;
      } else {
        for (const fragment of fragments) {
          if (fragment.length >= 12 && text.includes(fragment)) {
            score = Math.max(score, 18000 + fragment.length * 5 - Math.min(text.length, 12000) * 0.5);
          }
        }
      }

      if (!score && lookup) {
        const lookupWords = lookup.split(/\s+/).filter((word) => word.length >= 3);
        if (lookupWords.length >= 4) {
          const textWordSet = new Set(text.split(/\s+/).filter((word) => word.length >= 3));
          const hitCount = lookupWords.reduce((count, word) => count + (textWordSet.has(word) ? 1 : 0), 0);
          const ratio = hitCount / lookupWords.length;
          if (hitCount >= 4 && ratio >= 0.55) {
            score = 7000 + hitCount * 180 + ratio * 1800 - Math.min(text.length, 12000) * 0.2;
          }
        }
      }

      if (!score) return 0;
      if (/^(p|li|h1|h2|h3|h4|h5|h6|blockquote|figcaption|td|th|dt|dd|summary)$/i.test(tagName)) score += 1400;
      if (/^(article|main|section)$/i.test(tagName)) score -= 800;
      if (tagName === 'div') score -= 1100;
      if (/(nav|menu|sidebar|footer|header|comment|related|recommend|share|toolbar)/i.test(className)) score -= 2600;
      return score;
    }

    _getMarkdownVisibleTextBlocks() {
      const selectors = [
        'p',
        'li',
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'blockquote',
        'figcaption',
        'td',
        'th',
        'dt',
        'dd',
        'summary',
        'pre',
        'code',
        'article',
        'main',
        '[role="main"]',
        'section',
        'div'
      ].join(',');
      const blocks = [];
      try {
        const elements = Array.from(document.querySelectorAll(selectors)).slice(0, 6000);
        for (const element of elements) {
          if (!this._isMarkdownSourceCandidateVisible(element, { minWidth: 8, minHeight: 1 })) continue;
          const tagName = String(element.tagName || '').toLowerCase();
          if (/^(article|main|section|div)$/i.test(tagName)) {
            try {
              if (element.querySelector('p,li,h1,h2,h3,h4,h5,h6,blockquote,figcaption,td,th,dt,dd,summary,pre')) {
                continue;
              }
            } catch (_) { }
          }
          const text = this._normalizeMarkdownLookupText(this._getMarkdownSourceText(element));
          if (text.length < 4) continue;
          blocks.push({ element, text, tagName, className: String(element.className || '').toLowerCase() });
        }
      } catch (_) { }
      return blocks;
    }

    _scoreMarkdownBlockForLookup(block, lookup, fragments, lookupConfig, blocks, index, hitOrder) {
      if (!block || !block.element) return 0;
      let score = this._scoreMarkdownElementForLookup(block.element, lookup, fragments);
      if (!score) return 0;

      const beforeText = this._normalizeMarkdownLookupText(lookupConfig.beforeText || '');
      const afterText = this._normalizeMarkdownLookupText(lookupConfig.afterText || '');
      const beforeFragments = [
        this._trimMarkdownLookupTail(beforeText, 120),
        this._trimMarkdownLookupTail(beforeText, 72),
        this._trimMarkdownLookupTail(beforeText, 40)
      ].filter((fragment, index, list) => fragment.length >= 8 && list.indexOf(fragment) === index);
      const afterFragments = [
        this._trimMarkdownLookupText(afterText, 120),
        this._trimMarkdownLookupText(afterText, 72),
        this._trimMarkdownLookupText(afterText, 40)
      ].filter((fragment, index, list) => fragment.length >= 8 && list.indexOf(fragment) === index);
      const prevText = blocks.slice(Math.max(0, index - 5), index).map((item) => item.text).join(' ');
      const nextText = blocks.slice(index + 1, Math.min(blocks.length, index + 6)).map((item) => item.text).join(' ');
      const neighborhood = `${prevText} ${block.text} ${nextText}`;

      let beforeHit = false;
      for (const fragment of beforeFragments) {
        if (fragment.length >= 8 && prevText.includes(fragment)) {
          score += 7200;
          beforeHit = true;
          break;
        }
        if (fragment.length >= 12 && neighborhood.includes(fragment)) {
          score += 2600;
          beforeHit = true;
          break;
        }
      }

      let afterHit = false;
      for (const fragment of afterFragments) {
        if (fragment.length >= 8 && nextText.includes(fragment)) {
          score += 7200;
          afterHit = true;
          break;
        }
        if (fragment.length >= 12 && neighborhood.includes(fragment)) {
          score += 2600;
          afterHit = true;
          break;
        }
      }

      if (beforeHit && afterHit) score += 4200;

      const occurrenceIndex = Number(lookupConfig.occurrenceIndex);
      if (Number.isFinite(occurrenceIndex) && occurrenceIndex >= 0 && hitOrder >= 0) {
        score -= Math.min(Math.abs(hitOrder - occurrenceIndex) * 2600, 9000);
      }

      if (/^(p|li|h1|h2|h3|h4|h5|h6|blockquote|figcaption|td|th|dt|dd|summary)$/i.test(block.tagName)) {
        score += 900;
      }
      return score;
    }

    _findMarkdownVisibleTextMatchElement(lookupInput = '') {
      const lookupConfig = lookupInput && typeof lookupInput === 'object'
        ? lookupInput
        : { lookupText: lookupInput };
      const lookup = this._normalizeMarkdownLookupText(lookupConfig.lookupText || '');
      if (lookup.length < 8) return null;
      const fragments = this._getMarkdownLookupFragments(lookup);
      const blocks = this._getMarkdownVisibleTextBlocks();
      let best = null;
      let bestScore = 0;
      let hitOrder = -1;
      for (let index = 0; index < blocks.length; index += 1) {
        const block = blocks[index];
        const hasDirectHit = block.text.includes(lookup)
          || fragments.some((fragment) => fragment.length >= 12 && block.text.includes(fragment));
        if (hasDirectHit) hitOrder += 1;
        const score = this._scoreMarkdownBlockForLookup(block, lookup, fragments, lookupConfig, blocks, index, hasDirectHit ? hitOrder : -1);
        if (score > bestScore) {
          bestScore = score;
          best = block.element;
        }
      }

      if (best && bestScore > 7600) return best;
      return null;
    }

    _getMarkdownVisibleTextMatchCandidates(lookupInput = '', options = {}) {
      const lookupConfig = lookupInput && typeof lookupInput === 'object'
        ? lookupInput
        : { lookupText: lookupInput };
      const lookup = this._normalizeMarkdownLookupText(
        lookupConfig.lookupText || lookupConfig.rawLookupText || lookupConfig.selectedText || ''
      );
      if (lookup.length < 4) return [];
      const fragments = this._getMarkdownLookupFragments(lookup);
      const blocks = this._getMarkdownVisibleTextBlocks();
      const minScore = Number.isFinite(Number(options.minScore)) ? Number(options.minScore) : 3200;
      const limit = Number.isFinite(Number(options.limit)) ? Math.max(1, Number(options.limit)) : 5;
      let hitOrder = -1;
      const scored = [];
      const seen = new Set();
      for (let index = 0; index < blocks.length; index += 1) {
        const block = blocks[index];
        const hasDirectHit = block.text.includes(lookup)
          || fragments.some((fragment) => fragment.length >= 12 && block.text.includes(fragment));
        if (hasDirectHit) hitOrder += 1;
        const score = this._scoreMarkdownBlockForLookup(block, lookup, fragments, lookupConfig, blocks, index, hasDirectHit ? hitOrder : -1);
        if (score < minScore || !block.element || seen.has(block.element)) continue;
        seen.add(block.element);
        scored.push({ element: block.element, score });
      }
      return scored
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((item) => item.element);
    }

    _getMarkdownDefuddle() {
      try {
        const Defuddle = window.__DEV1_DEFUDDLE_FULL;
        return typeof Defuddle === 'function' ? Defuddle : null;
      } catch (_) {
        return null;
      }
    }

    _htmlToMarkdownPlainText(html) {
      const raw = String(html || '');
      if (!raw) return '';
      try {
        const parsed = new DOMParser().parseFromString(raw, 'text/html');
        return this._getMarkdownSourceText(parsed.body);
      } catch (_) {
        return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
    }

    _getMarkdownArticleExtractionContext() {
      const now = Date.now();
      if (this._mdArticleExtractionContext && now - this._mdArticleExtractionContext.time < 5000) {
        return this._mdArticleExtractionContext;
      }

      const context = {
        time: now,
        sourceElement: null,
        contentHtml: '',
        extractedText: '',
        title: '',
        metadata: {}
      };

      try {
        const readerArticle = document.querySelector('.obsidian-reader-active .obsidian-reader-content article');
        if (this._isMarkdownSourceCandidateVisible(readerArticle, { minWidth: 8, minHeight: 1 })) {
          context.sourceElement = readerArticle;
          const originalHtml = readerArticle.getAttribute('data-original-html');
          context.contentHtml = originalHtml || readerArticle.innerHTML || '';
          context.extractedText = this._htmlToMarkdownPlainText(context.contentHtml) || this._getMarkdownSourceText(readerArticle);
        }
      } catch (_) { }

      const Defuddle = this._getMarkdownDefuddle();
      if (Defuddle) {
        try {
          const setElementHTML = (element, html) => {
            const parsed = new DOMParser().parseFromString(String(html || ''), 'text/html');
            element.replaceChildren(...Array.from(parsed.body.childNodes));
          };
          const parseForClip = (inputDoc) => {
            const readerArticle = inputDoc.querySelector('.obsidian-reader-active .obsidian-reader-content article');
            if (readerArticle) {
              const readerDoc = inputDoc.implementation.createHTMLDocument();
              const originalHtml = readerArticle.getAttribute('data-original-html');
              if (originalHtml) {
                setElementHTML(readerDoc.body, originalHtml);
              } else {
                readerDoc.body.replaceChildren(
                  ...Array.from(readerArticle.childNodes).map((node) => readerDoc.importNode(node, true))
                );
              }
              return new Defuddle(readerDoc, { url: '' }).parse();
            }
            const clonedDoc = inputDoc.cloneNode(true);
            return new Defuddle(clonedDoc, { url: inputDoc.URL }).parse();
          };

          const defuddled = parseForClip(document);
          context.contentHtml = String(defuddled?.content || context.contentHtml || '');
          context.extractedText = this._htmlToMarkdownPlainText(context.contentHtml) || context.extractedText;
          context.title = String((defuddled?.title || document.title || '')).trim();
          context.metadata = {
            title: context.title,
            author: String(defuddled?.author || '').trim(),
            published: String(defuddled?.published || '').split(',')[0].trim(),
            description: String(defuddled?.description || '').trim()
          };
        } catch (_) { }
      }

      if (!context.sourceElement && context.extractedText) {
        context.sourceElement = this._findMarkdownSourceElementByExtractedText(context.extractedText);
      }
      if (!context.sourceElement) {
        context.sourceElement = this._findMarkdownSourceElement();
      }
      if (!context.extractedText && context.sourceElement) {
        context.extractedText = this._getMarkdownSourceText(context.sourceElement);
      }

      this._mdArticleExtractionContext = context;
      return context;
    }

    _findMarkdownSourceElementByExtractedText(extractedText) {
      const extracted = this._normalizeMarkdownLookupText(extractedText);
      if (extracted.length < 80) return null;

      const fragments = this._getMarkdownLookupFragments(extracted)
        .filter((fragment) => fragment.length >= 24)
        .slice(0, 14);
      if (!fragments.length) return null;

      const selectors = [
        'article',
        'main article',
        'main',
        '[role="main"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.markdown-body',
        '.reader-content',
        '.content',
        'section',
        'div'
      ].join(',');
      const candidates = new Set();
      try {
        Array.from(document.querySelectorAll(selectors)).slice(0, 2500).forEach((element) => candidates.add(element));
      } catch (_) { }

      let best = null;
      let bestScore = 0;
      for (const element of candidates) {
        if (!this._isMarkdownSourceCandidateVisible(element, { minWidth: 80, minHeight: 20 })) continue;
        const text = this._normalizeMarkdownLookupText(this._getMarkdownSourceText(element));
        if (text.length < 80) continue;

        let score = 0;
        let hitCount = 0;
        let longestHit = 0;
        for (const fragment of fragments) {
          if (text.includes(fragment)) {
            hitCount += 1;
            longestHit = Math.max(longestHit, fragment.length);
            score += 1800 + fragment.length * 48;
          }
        }
        if (hitCount === 0) continue;

        if (text.includes(extracted.slice(0, Math.min(160, extracted.length)))) score += 3400;
        if (text.includes(extracted.slice(Math.max(0, extracted.length - 160)))) score += 2600;
        if (extracted.includes(text) && text.length >= 180) score += Math.min(text.length, 5000);

        const tagName = String(element.tagName || '').toLowerCase();
        const role = String(element.getAttribute('role') || '').toLowerCase();
        const className = String(element.className || '').toLowerCase();
        if (tagName === 'article') score += 1600;
        if (tagName === 'main' || role === 'main') score += 700;
        if (/(article|post|entry|reader|markdown)/i.test(className)) score += 900;
        if (/(nav|menu|sidebar|footer|header|comment|related|recommend|share|toolbar)/i.test(className)) score -= 4000;
        score += hitCount * 900 + longestHit * 20;
        score -= Math.min(Math.abs(text.length - extracted.length), 12000) * 0.12;

        if (score > bestScore) {
          bestScore = score;
          best = element;
        }
      }

      return bestScore > 2200 ? best : null;
    }

    _markdownToPlainSearchText(text) {
      return String(text || '')
        .replace(/```[\s\S]*?```/g, (block) => block.replace(/```[^\n]*\n?|```/g, ' '))
        .replace(/!\[([^\]]*)\]\((?:[^()]|\([^)]*\))*\)/g, ' $1 ')
        .replace(/\[([^\]]+)\]\((?:[^()]|\([^)]*\))*\)/g, ' $1 ')
        .replace(/`([^`]+)`/g, ' $1 ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/^\s{0,3}#{1,6}\s+/gm, ' ')
        .replace(/^\s*[-*+]\s+/gm, ' ')
        .replace(/^\s*\d+[.)]\s+/gm, ' ')
        .replace(/&(?:nbsp|amp|lt|gt|quot);/gi, ' ')
        .replace(/[*_~>#|[\]{}]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    _normalizeMarkdownSearchSegment(text) {
      const raw = String(text || '');
      let out = '';
      let pendingSpace = false;
      for (let offset = 0; offset < raw.length;) {
        const codePoint = raw.codePointAt(offset);
        const char = String.fromCodePoint(codePoint);
        offset += char.length;
        let normalized = '';
        try {
          normalized = char.normalize('NFKC').toLowerCase();
        } catch (_) {
          normalized = char.toLowerCase();
        }
        for (const unit of normalized) {
          if (/[\u200B-\u200D\uFEFF]/u.test(unit)) continue;
          if (/[\p{L}\p{N}]/u.test(unit)) {
            if (pendingSpace && out && !out.endsWith(' ')) out += ' ';
            pendingSpace = false;
            out += unit;
          } else if (out) {
            pendingSpace = true;
          }
        }
      }
      return out.trim();
    }

    _getMarkdownPlainSearchFragments(lookupConfig = {}) {
      const fragments = new Set();
      const add = (value) => {
        const plain = this._markdownToPlainSearchText(value);
        const normalized = this._normalizeMarkdownSearchSegment(plain);
        if (normalized.length >= 8) fragments.add(plain.replace(/\s+/g, ' ').trim());
      };

      [
        lookupConfig.rawLookupText,
        lookupConfig.lookupText,
        lookupConfig.selectedText
      ].forEach(add);

      const base = this._markdownToPlainSearchText(lookupConfig.rawLookupText || lookupConfig.lookupText || '');
      if (base) {
        add(base);
        const sentenceParts = base.split(/\s*[。！？!?；;]\s*|\n+/).filter(Boolean);
        sentenceParts.slice(0, 10).forEach((sentence) => {
          const trimmed = sentence.trim();
          if (trimmed.length > 120) {
            add(trimmed.slice(0, 120));
            add(trimmed.slice(Math.max(0, trimmed.length - 120)));
          } else {
            add(trimmed);
          }
        });

        const words = base.split(/\s+/).filter(Boolean);
        if (words.length >= 4) {
          for (let i = 0; i <= words.length - 4; i += 2) {
            add(words.slice(i, Math.min(words.length, i + 10)).join(' '));
          }
        } else if (base.length >= 24) {
          [0, Math.max(0, Math.floor(base.length / 2) - 36), Math.max(0, base.length - 72)].forEach((start) => {
            add(base.slice(start, start + 72));
          });
        }
      }

      return Array.from(fragments)
        .filter((fragment) => this._normalizeMarkdownSearchSegment(fragment).length >= 8)
        .sort((a, b) => this._normalizeMarkdownSearchSegment(b).length - this._normalizeMarkdownSearchSegment(a).length)
        .slice(0, 22);
    }

    _getMarkdownSearchTokens(text, options = {}) {
      const normalized = this._normalizeMarkdownSearchSegment(this._markdownToPlainSearchText(text));
      if (!normalized) return [];

      const tokens = [];
      const seen = new Set();
      const maxTokens = Number.isFinite(Number(options.maxTokens)) ? Math.max(4, Number(options.maxTokens)) : 80;
      const addToken = (token) => {
        const value = String(token || '').trim();
        if (value.length < 2 || seen.has(value)) return;
        seen.add(value);
        tokens.push(value);
      };

      const cjkPattern = /[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/u;
      const parts = normalized.match(/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]+|[\p{L}\p{N}]+/gu) || [];
      for (const part of parts) {
        if (tokens.length >= maxTokens) break;
        if (cjkPattern.test(part)) {
          if (part.length <= 4) {
            addToken(part);
          } else {
            for (const size of [4, 3, 2]) {
              for (let index = 0; index <= part.length - size && tokens.length < maxTokens; index += size === 2 ? 2 : 1) {
                addToken(part.slice(index, index + size));
              }
            }
          }
        } else {
          addToken(part);
        }
      }

      return tokens
        .sort((a, b) => b.length - a.length)
        .slice(0, maxTokens);
    }

    _getMarkdownContextNeedles(lookupConfig = {}) {
      const beforeSource = lookupConfig.rawBeforeText || lookupConfig.beforeText || '';
      const afterSource = lookupConfig.rawAfterText || lookupConfig.afterText || '';
      const before = this._normalizeMarkdownSearchSegment(this._markdownToPlainSearchText(beforeSource));
      const after = this._normalizeMarkdownSearchSegment(this._markdownToPlainSearchText(afterSource));
      const beforeNeedles = [
        before.slice(Math.max(0, before.length - 180)),
        before.slice(Math.max(0, before.length - 120)),
        before.slice(Math.max(0, before.length - 72)),
        before.slice(Math.max(0, before.length - 40))
      ].filter((item, index, list) => item.length >= 8 && list.indexOf(item) === index);
      const afterNeedles = [
        after.slice(0, 180),
        after.slice(0, 120),
        after.slice(0, 72),
        after.slice(0, 40)
      ].filter((item, index, list) => item.length >= 8 && list.indexOf(item) === index);
      return {
        beforeSource,
        afterSource,
        before,
        after,
        beforeNeedles,
        afterNeedles,
        beforeTokens: this._getMarkdownSearchTokens(beforeSource, { maxTokens: 36 }),
        afterTokens: this._getMarkdownSearchTokens(afterSource, { maxTokens: 36 })
      };
    }

    _isMarkdownTokenBoundary(haystack, index, token) {
      const value = String(token || '');
      if (!/^[a-z0-9]+$/i.test(value)) return true;
      const before = index > 0 ? haystack[index - 1] : ' ';
      const after = index + value.length < haystack.length ? haystack[index + value.length] : ' ';
      return !/[a-z0-9]/i.test(before) && !/[a-z0-9]/i.test(after);
    }

    _getMarkdownTokenOccurrences(haystack, tokens, maxPerToken = 80) {
      const occurrences = [];
      const tokenList = Array.from(new Set((tokens || []).filter(Boolean)));
      tokenList.forEach((token, tokenIndex) => {
        let index = 0;
        let count = 0;
        while ((index = haystack.indexOf(token, index)) !== -1 && count < maxPerToken) {
          if (this._isMarkdownTokenBoundary(haystack, index, token)) {
            occurrences.push({
              token,
              tokenIndex,
              index,
              end: index + token.length,
              weight: Math.max(2, Math.min(token.length, 18))
            });
            count += 1;
          }
          index += Math.max(token.length, 1);
        }
      });
      return occurrences.sort((a, b) => a.index - b.index || b.weight - a.weight);
    }

    _scoreMarkdownContextWindows(haystack, rangeStart, rangeEnd, context) {
      const beforeWindow = haystack.slice(Math.max(0, rangeStart - 1100), rangeStart);
      const afterWindow = haystack.slice(rangeEnd, Math.min(haystack.length, rangeEnd + 1100));
      let score = 0;
      let beforeHit = false;
      let afterHit = false;

      for (const needle of context.beforeNeedles || []) {
        if (beforeWindow.includes(needle)) {
          score += 7200 + Math.min(needle.length, 180) * 12;
          beforeHit = true;
          break;
        }
      }
      for (const needle of context.afterNeedles || []) {
        if (afterWindow.includes(needle)) {
          score += 7200 + Math.min(needle.length, 180) * 12;
          afterHit = true;
          break;
        }
      }

      if (!beforeHit && context.beforeTokens && context.beforeTokens.length) {
        const hits = context.beforeTokens.reduce((count, token) => count + (beforeWindow.includes(token) ? 1 : 0), 0);
        if (hits >= 2) {
          score += Math.min(4200, hits * 420);
          beforeHit = true;
        }
      }
      if (!afterHit && context.afterTokens && context.afterTokens.length) {
        const hits = context.afterTokens.reduce((count, token) => count + (afterWindow.includes(token) ? 1 : 0), 0);
        if (hits >= 2) {
          score += Math.min(4200, hits * 420);
          afterHit = true;
        }
      }

      if (beforeHit && afterHit) score += 5200;
      return { score, beforeHit, afterHit };
    }

    _findMarkdownTokenizedRangeInTextIndex(lookupConfig, searchIndex, context) {
      const haystack = searchIndex && searchIndex.text ? searchIndex.text : '';
      if (!haystack) return null;

      const coreSource = lookupConfig.rawLookupText || lookupConfig.selectedText || lookupConfig.lookupText || '';
      const coreNormalized = this._normalizeMarkdownSearchSegment(this._markdownToPlainSearchText(coreSource));
      const coreTokens = this._getMarkdownSearchTokens(coreSource, { maxTokens: 64 });
      if (!coreTokens.length || coreNormalized.length < 6) return null;

      const occurrences = this._getMarkdownTokenOccurrences(haystack, coreTokens, 70);
      if (!occurrences.length) return null;

      const expectedLength = Math.max(24, Math.min(360, coreNormalized.length + 80));
      const minHitCount = coreTokens.length <= 2 ? 1 : 2;
      const minCoverage = coreTokens.length <= 4 ? 0.34 : 0.24;
      const candidateStarts = [];
      const seenStarts = new Set();

      for (const occurrence of occurrences) {
        const starts = [
          Math.max(0, occurrence.index - Math.floor(expectedLength * 0.25)),
          Math.max(0, occurrence.index - Math.floor(expectedLength * 0.5))
        ];
        for (const start of starts) {
          const bucket = Math.floor(start / 24) * 24;
          if (seenStarts.has(bucket)) continue;
          seenStarts.add(bucket);
          candidateStarts.push(bucket);
          if (candidateStarts.length >= 260) break;
        }
        if (candidateStarts.length >= 260) break;
      }

      let best = null;
      let fuzzyHitOrder = 0;
      for (const windowStart of candidateStarts) {
        const windowEnd = Math.min(haystack.length, windowStart + expectedLength);
        const windowText = haystack.slice(windowStart, windowEnd);
        const hitsByToken = new Map();
        const hitRanges = [];

        for (let tokenIndex = 0; tokenIndex < coreTokens.length; tokenIndex += 1) {
          const token = coreTokens[tokenIndex];
          let localIndex = 0;
          let guard = 0;
          while ((localIndex = windowText.indexOf(token, localIndex)) !== -1 && guard < 12) {
            guard += 1;
            const absoluteIndex = windowStart + localIndex;
            if (this._isMarkdownTokenBoundary(haystack, absoluteIndex, token)) {
              const existing = hitsByToken.get(token);
              if (!existing || token.length > existing.token.length) {
                hitsByToken.set(token, { token, tokenIndex, index: absoluteIndex, end: absoluteIndex + token.length });
              }
              hitRanges.push({ index: absoluteIndex, end: absoluteIndex + token.length, token });
            }
            localIndex += Math.max(token.length, 1);
          }
        }

        const uniqueHits = Array.from(hitsByToken.values());
        if (uniqueHits.length < minHitCount) continue;
        const coverage = uniqueHits.length / Math.max(coreTokens.length, 1);
        const weightedHitLength = uniqueHits.reduce((sum, item) => sum + Math.min(item.token.length, 18), 0);
        const weightedCoverage = weightedHitLength / Math.max(8, coreTokens.reduce((sum, token) => sum + Math.min(token.length, 18), 0));
        const hasStrongSingleHit = uniqueHits.some((item) => item.token.length >= 8);
        if (coverage < minCoverage && weightedCoverage < 0.32 && !hasStrongSingleHit) continue;

        const rangeStart = Math.min(...hitRanges.map((item) => item.index));
        const rangeEnd = Math.max(...hitRanges.map((item) => item.end));
        if (!Number.isFinite(rangeStart) || !Number.isFinite(rangeEnd) || rangeEnd <= rangeStart) continue;

        const contextScore = this._scoreMarkdownContextWindows(haystack, rangeStart, rangeEnd, context);
        let score = 3200
          + uniqueHits.length * 520
          + weightedHitLength * 160
          + coverage * 4200
          + weightedCoverage * 4200
          + contextScore.score
          - Math.max(0, (rangeEnd - rangeStart) - Math.max(coreNormalized.length + 80, 160)) * 7;

        const occurrenceIndex = Number(lookupConfig.occurrenceIndex);
        if (Number.isFinite(occurrenceIndex) && occurrenceIndex >= 0) {
          score -= Math.min(Math.abs(fuzzyHitOrder - occurrenceIndex) * 900, 3600);
        }

        const range = this._createMarkdownRangeFromTextIndex(searchIndex, rangeStart, rangeEnd - rangeStart);
        const rect = range ? this._getMarkdownRangeClientRect(range) : null;
        if (rect && rect.width >= 1 && rect.height >= 1) score += 1000;
        if (range && (!best || score > best.score)) {
          best = { range, score };
        }
        fuzzyHitOrder += 1;
      }

      return best;
    }

    _findMarkdownContextOnlyRangeInTextIndex(searchIndex, context) {
      const haystack = searchIndex && searchIndex.text ? searchIndex.text : '';
      if (!haystack) return null;

      const findAnchors = (needles, direction) => {
        const anchors = [];
        for (const needle of needles || []) {
          let index = direction === 'before' ? haystack.lastIndexOf(needle) : haystack.indexOf(needle);
          let guard = 0;
          while (index !== -1 && guard < 40) {
            anchors.push({ index, end: index + needle.length, length: needle.length });
            guard += 1;
            index = direction === 'before'
              ? haystack.lastIndexOf(needle, Math.max(0, index - 1))
              : haystack.indexOf(needle, index + Math.max(needle.length, 1));
          }
        }
        return anchors.sort((a, b) => b.length - a.length).slice(0, 30);
      };

      const beforeAnchors = findAnchors(context.beforeNeedles, 'before');
      const afterAnchors = findAnchors(context.afterNeedles, 'after');
      let best = null;

      const buildCandidate = (start, end, score) => {
        let rangeStart = Math.max(0, Math.min(haystack.length - 1, start));
        let rangeEnd = Math.max(rangeStart + 1, Math.min(haystack.length, end));
        while (rangeStart < rangeEnd && haystack[rangeStart] === ' ') rangeStart += 1;
        while (rangeEnd > rangeStart && haystack[rangeEnd - 1] === ' ') rangeEnd -= 1;
        if (rangeEnd <= rangeStart) return;
        const range = this._createMarkdownRangeFromTextIndex(searchIndex, rangeStart, rangeEnd - rangeStart);
        const rect = range ? this._getMarkdownRangeClientRect(range) : null;
        if (!range || !rect || rect.width < 1 || rect.height < 1) return;
        const candidate = { range, score: score + Math.min(rangeEnd - rangeStart, 80) * 18 };
        if (!best || candidate.score > best.score) best = candidate;
      };

      for (const beforeAnchor of beforeAnchors) {
        for (const afterAnchor of afterAnchors) {
          if (afterAnchor.index < beforeAnchor.end) continue;
          const gap = afterAnchor.index - beforeAnchor.end;
          if (gap > 2400) continue;
          if (gap >= 4) {
            buildCandidate(beforeAnchor.end, Math.min(afterAnchor.index, beforeAnchor.end + 140), 8400 - gap);
          } else {
            buildCandidate(afterAnchor.index, Math.min(afterAnchor.end, afterAnchor.index + 120), 7600 - gap);
          }
        }
      }

      if (!best && beforeAnchors.length) {
        const anchor = beforeAnchors[0];
        buildCandidate(anchor.end, Math.min(haystack.length, anchor.end + 140), 5200);
      }
      if (!best && afterAnchors.length) {
        const anchor = afterAnchors[0];
        buildCandidate(anchor.index, Math.min(anchor.end, anchor.index + 140), 5000);
      }

      return best;
    }

    _isNodeInsideSnapshotHelper(node) {
      try {
        const root = node && typeof node.getRootNode === 'function' ? node.getRootNode() : null;
        if (root && root.host && root.host.id === HOST_ID) return true;
      } catch (_) { }
      const element = node instanceof Element ? node : (node && node.parentElement);
      return !!(element && (element.id === HOST_ID || element.closest(`#${HOST_ID}`)));
    }

    _isMarkdownTextSearchNodeVisible(node) {
      if (!node || !node.parentElement) return false;
      if (this._isNodeInsideSnapshotHelper(node)) return false;
      let element = node.parentElement;
      while (element && element !== document.documentElement) {
        const tagName = String(element.tagName || '').toLowerCase();
        if (/^(script|style|noscript|template|svg|canvas|iframe|textarea|input|select|option|button)$/i.test(tagName)) return false;
        if (element.id === HOST_ID || element.closest(`#${HOST_ID}`)) return false;
        try {
          const style = getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
        } catch (_) {
          return false;
        }
        element = element.parentElement;
      }
      return true;
    }

    _buildMarkdownTextSearchIndex(rootElement) {
      const root = rootElement instanceof Element ? rootElement : document.body;
      const textParts = [];
      const positions = [];
      let pendingSpacePosition = null;

      const appendSpace = (position) => {
        if (!position || textParts.length === 0 || textParts[textParts.length - 1] === ' ') return;
        textParts.push(' ');
        positions.push(position);
      };

      const appendChar = (unit, position) => {
        if (pendingSpacePosition) {
          appendSpace(pendingSpacePosition);
          pendingSpacePosition = null;
        }
        textParts.push(unit);
        positions.push(position);
      };

      try {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            if (!this._isMarkdownTextSearchNodeVisible(node)) return NodeFilter.FILTER_REJECT;
            const text = String(node.nodeValue || '');
            return text.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        });

        let node = walker.nextNode();
        while (node) {
          const raw = String(node.nodeValue || '');
          for (let offset = 0; offset < raw.length;) {
            const codePoint = raw.codePointAt(offset);
            const char = String.fromCodePoint(codePoint);
            const startOffset = offset;
            const endOffset = offset + char.length;
            offset = endOffset;

            let normalized = '';
            try {
              normalized = char.normalize('NFKC').toLowerCase();
            } catch (_) {
              normalized = char.toLowerCase();
            }
            const position = { node, startOffset, endOffset };
            for (const unit of normalized) {
              if (/[\u200B-\u200D\uFEFF]/u.test(unit)) continue;
              if (/[\p{L}\p{N}]/u.test(unit)) {
                appendChar(unit, position);
              } else if (textParts.length) {
                pendingSpacePosition = pendingSpacePosition || position;
              }
            }
          }
          pendingSpacePosition = pendingSpacePosition || null;
          node = walker.nextNode();
        }
      } catch (_) { }

      return { text: textParts.join(''), positions };
    }

    _createMarkdownRangeFromTextIndex(searchIndex, index, length) {
      if (!searchIndex || !Array.isArray(searchIndex.positions)) return null;
      const start = searchIndex.positions[index];
      const end = searchIndex.positions[index + length - 1];
      if (!start || !end) return null;
      try {
        const range = document.createRange();
        range.setStart(start.node, start.startOffset);
        range.setEnd(end.node, end.endOffset);
        return range;
      } catch (_) {
        return null;
      }
    }

    _findMarkdownRangeInRoot(lookupConfig, rootElement) {
      const fragments = this._getMarkdownPlainSearchFragments(lookupConfig);

      const searchIndex = this._buildMarkdownTextSearchIndex(rootElement);
      const haystack = searchIndex.text || '';
      if (!haystack || haystack.length < 8) return null;

      const context = this._getMarkdownContextNeedles(lookupConfig);

      let best = null;
      let bestScore = 0;
      for (const fragment of fragments) {
        const needle = this._normalizeMarkdownSearchSegment(fragment);
        if (needle.length < 8) continue;

        let index = 0;
        let localHitOrder = 0;
        let guard = 0;
        while ((index = haystack.indexOf(needle, index)) !== -1 && guard < 250) {
          guard += 1;
          const range = this._createMarkdownRangeFromTextIndex(searchIndex, index, needle.length);
          if (range && !this._isNodeInsideSnapshotHelper(range.commonAncestorContainer)) {
            const beforeWindow = haystack.slice(Math.max(0, index - 900), index);
            const afterWindow = haystack.slice(index + needle.length, Math.min(haystack.length, index + needle.length + 900));
            let score = needle.length * 120;

            const beforeHit = context.beforeNeedles.some((item) => beforeWindow.includes(item));
            const afterHit = context.afterNeedles.some((item) => afterWindow.includes(item));
            if (beforeHit) score += 6200;
            if (afterHit) score += 6200;
            if (context.beforeNeedles.length && context.afterNeedles.length && beforeHit && afterHit) {
              score += 3600;
            }
            if (!beforeHit && context.beforeTokens.length) {
              const tokenHits = context.beforeTokens.reduce((count, token) => count + (beforeWindow.includes(token) ? 1 : 0), 0);
              if (tokenHits >= 2) score += Math.min(2800, tokenHits * 360);
            }
            if (!afterHit && context.afterTokens.length) {
              const tokenHits = context.afterTokens.reduce((count, token) => count + (afterWindow.includes(token) ? 1 : 0), 0);
              if (tokenHits >= 2) score += Math.min(2800, tokenHits * 360);
            }

            const occurrenceIndex = Number(lookupConfig.occurrenceIndex);
            if (Number.isFinite(occurrenceIndex) && occurrenceIndex >= 0) {
              score -= Math.min(Math.abs(localHitOrder - occurrenceIndex) * 1200, 4800);
            }

            const rect = this._getMarkdownRangeClientRect(range);
            if (rect && rect.width >= 1 && rect.height >= 1) score += 1200;
            if (score > bestScore) {
              bestScore = score;
              best = { range, score, fragment };
            }
          }
          localHitOrder += 1;
          index += Math.max(needle.length, 1);
        }
      }

      const tokenizedBest = this._findMarkdownTokenizedRangeInTextIndex(lookupConfig, searchIndex, context);
      if (tokenizedBest && tokenizedBest.score > bestScore) {
        best = tokenizedBest;
        bestScore = tokenizedBest.score;
      }

      if (best && bestScore >= 900) return best.range;

      const contextOnlyBest = this._findMarkdownContextOnlyRangeInTextIndex(searchIndex, context);
      if (contextOnlyBest && contextOnlyBest.score >= 4800) return contextOnlyBest.range;

      return null;
    }

    _findMarkdownRangeWithWindowFind(lookupConfig) {
      if (typeof window.find !== 'function') return null;
      const fragments = this._getMarkdownPlainSearchFragments(lookupConfig).slice(0, 12);
      const body = document.body || document.documentElement;
      if (!body) return null;

      for (const fragment of fragments) {
        const query = this._markdownToPlainSearchText(fragment);
        if (this._normalizeMarkdownSearchSegment(query).length < 8) continue;
        try {
          const selection = window.getSelection();
          if (!selection) continue;
          selection.removeAllRanges();
          const startRange = document.createRange();
          startRange.setStart(body, 0);
          startRange.collapse(true);
          selection.addRange(startRange);

          for (let attempt = 0; attempt < 8; attempt += 1) {
            const found = window.find(query, false, false, true, false, false, false);
            if (!found || !selection.rangeCount) break;
            const range = selection.getRangeAt(0);
            if (range && !this._isNodeInsideSnapshotHelper(range.commonAncestorContainer)) {
              return range.cloneRange();
            }
          }
        } catch (_) { }
      }
      return null;
    }

    _findMarkdownSourceRange(lookupConfig, sourceElement) {
      if (!lookupConfig || (!lookupConfig.lookupText && !lookupConfig.rawLookupText)) return null;
      const roots = [];
      if (sourceElement instanceof Element) roots.push(sourceElement);
      if (document.body && !roots.includes(document.body)) roots.push(document.body);

      for (const root of roots) {
        const range = this._findMarkdownRangeInRoot(lookupConfig, root);
        if (range) return range;
      }
      return this._findMarkdownRangeWithWindowFind(lookupConfig);
    }

    _getMarkdownRangeClientRect(range) {
      if (!range) return null;
      try {
        const rects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
        const visibleRects = rects.filter((rect) =>
          rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth
        );
        const targetRects = visibleRects.length ? visibleRects : rects;
        if (!targetRects.length) {
          const rect = range.getBoundingClientRect();
          return rect && rect.width > 0 && rect.height > 0 ? rect : null;
        }
        return targetRects.reduce((acc, rect) => ({
          left: Math.min(acc.left, rect.left),
          top: Math.min(acc.top, rect.top),
          right: Math.max(acc.right, rect.right),
          bottom: Math.max(acc.bottom, rect.bottom),
          width: Math.max(acc.right, rect.right) - Math.min(acc.left, rect.left),
          height: Math.max(acc.bottom, rect.bottom) - Math.min(acc.top, rect.top)
        }), {
          left: targetRects[0].left,
          top: targetRects[0].top,
          right: targetRects[0].right,
          bottom: targetRects[0].bottom,
          width: targetRects[0].width,
          height: targetRects[0].height
        });
      } catch (_) {
        return null;
      }
    }

    _selectMarkdownSourceRange(range) {
      if (!range) return;
      try {
        const selection = window.getSelection();
        if (!selection) return;
        selection.removeAllRanges();
        selection.addRange(range.cloneRange());
      } catch (_) { }
    }

    _scrollMarkdownRangeIntoView(range) {
      if (!range) return;
      try {
        const node = range.startContainer;
        const element = node instanceof Element ? node : node.parentElement;
        if (element && typeof element.scrollIntoView === 'function') {
          element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }
      } catch (_) { }
    }

    _getMarkdownHighlightOverlayBox(rect, options = {}) {
      if (!rect) return null;
      const margin = 8;
      const minWidth = Number.isFinite(Number(options.minWidth)) ? Number(options.minWidth) : 40;
      const minHeight = Number.isFinite(Number(options.minHeight)) ? Number(options.minHeight) : 40;
      const paddingX = Number.isFinite(Number(options.paddingX)) ? Number(options.paddingX) : 6;
      const paddingY = Number.isFinite(Number(options.paddingY)) ? Number(options.paddingY) : 6;
      const viewportWidth = Math.max(margin * 2 + 1, window.innerWidth || 0);
      const viewportHeight = Math.max(margin * 2 + 1, window.innerHeight || 0);
      const centerX = (Number(rect.left) + Number(rect.right)) / 2;
      const centerY = (Number(rect.top) + Number(rect.bottom)) / 2;
      let width = Math.max(minWidth, Number(rect.width || 0) + paddingX * 2);
      let height = Math.max(minHeight, Number(rect.height || 0) + paddingY * 2);

      width = Math.min(width, Math.max(1, viewportWidth - margin * 2));
      height = Math.min(height, Math.max(1, viewportHeight - margin * 2));

      let left = centerX - width / 2;
      let top = centerY - height / 2;
      left = Math.max(margin, Math.min(viewportWidth - margin - width, left));
      top = Math.max(margin, Math.min(viewportHeight - margin - height, top));

      return { left, top, width, height };
    }

    _removeMarkdownSourceHighlight() {
      if (this._mdSourceHighlightTimer) {
        clearTimeout(this._mdSourceHighlightTimer);
        this._mdSourceHighlightTimer = null;
      }
      if (this._mdSourceHighlightFrame) {
        cancelAnimationFrame(this._mdSourceHighlightFrame);
        this._mdSourceHighlightFrame = null;
      }
      const overlay = document.getElementById('dev1-md-source-highlight');
      if (overlay) overlay.remove();
      document.querySelectorAll('.dev1-md-source-candidate-highlight').forEach((node) => node.remove());
      try {
        const highlights = window.CSS && window.CSS.highlights;
        if (highlights && typeof highlights.delete === 'function') {
          highlights.delete('dev1-md-source-candidate');
        }
      } catch (_) { }
    }

    _showMarkdownSourceNotice(message) {
      const notice = document.createElement('div');
      notice.textContent = String(message || '');
      notice.style.cssText = `
        position: fixed;
        left: 50%;
        top: 18px;
        transform: translateX(-50%);
        z-index: 2147483649;
        padding: 7px 10px;
        border-radius: 7px;
        background: rgba(15, 23, 42, 0.92);
        color: #fff;
        font: 12px/1.3 system-ui, -apple-system, sans-serif;
        pointer-events: none;
        box-shadow: 0 8px 22px rgba(15, 23, 42, 0.25);
      `;
      document.documentElement.appendChild(notice);
      setTimeout(() => notice.remove(), 1500);
    }

    _ensureMarkdownSourceHighlightStyles() {
      if (document.getElementById('dev1-md-source-highlight-style')) return;
      const style = document.createElement('style');
      style.id = 'dev1-md-source-highlight-style';
      style.textContent = `
        ::highlight(dev1-md-source-candidate) {
          background-color: rgba(245, 158, 11, 0.34);
          color: inherit;
        }
      `;
      (document.head || document.documentElement).appendChild(style);
    }

    _showMarkdownSourceCandidateHighlights(label = '正文候选', candidates = []) {
      const targets = (Array.isArray(candidates) ? candidates : [])
        .filter((element) => element instanceof Element)
        .slice(0, 5);
      if (!targets.length) return false;

      this._removeMarkdownSourceHighlight();

      try {
        targets[0].scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
      } catch (_) { }

      const createTargetRange = (target) => {
        try {
          const range = document.createRange();
          range.selectNodeContents(target);
          return range;
        } catch (_) {
          return null;
        }
      };

      const ranges = targets
        .map((target) => createTargetRange(target))
        .filter(Boolean);

      try {
        const highlights = window.CSS && window.CSS.highlights;
        const HighlightCtor = typeof Highlight === 'function' ? Highlight : null;
        if (ranges.length && highlights && typeof highlights.set === 'function' && HighlightCtor) {
          this._ensureMarkdownSourceHighlightStyles();
          highlights.set('dev1-md-source-candidate', new HighlightCtor(...ranges));
          this._showMarkdownSourceNotice(`已固定高亮 ${targets.length} 个正文候选`);
          return true;
        }
      } catch (_) { }

      const records = targets.map((target) => {
        const overlay = document.createElement('div');
        overlay.className = 'dev1-md-source-candidate-highlight';
        overlay.style.cssText = `
          position: fixed;
          inset: 0;
          z-index: 2147483646;
          pointer-events: none;
          overflow: hidden;
        `;
        document.documentElement.appendChild(overlay);
        return { target, range: createTargetRange(target), overlay };
      });

      const updateOverlay = () => {
        const liveRecords = records.filter((record) => record.overlay.isConnected && record.target.isConnected && record.range);
        if (!liveRecords.length) {
          this._removeMarkdownSourceHighlight();
          return;
        }
        liveRecords.forEach((record) => {
          let rects = [];
          try {
            rects = Array.from(record.range.getClientRects())
              .filter((rect) => rect.width > 0 && rect.height > 0)
              .filter((rect) => rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth)
              .slice(0, 80);
          } catch (_) { }
          if (!rects.length) {
            record.overlay.style.display = 'none';
            return;
          }
          record.overlay.style.display = '';
          record.overlay.replaceChildren();
          rects.forEach((rect) => {
            const mark = document.createElement('div');
            mark.style.cssText = `
              position: absolute;
              left: ${rect.left}px;
              top: ${rect.top}px;
              width: ${rect.width}px;
              height: ${rect.height}px;
              box-sizing: border-box;
              border-radius: 2px;
              background: rgba(245, 158, 11, 0.34);
              box-shadow: inset 0 -1px 0 rgba(217, 119, 6, 0.42);
            `;
            record.overlay.appendChild(mark);
          });
        });
        this._mdSourceHighlightFrame = requestAnimationFrame(updateOverlay);
      };
      updateOverlay();
      this._showMarkdownSourceNotice(`已固定高亮 ${targets.length} 个正文候选`);
      return true;
    }

    _showMarkdownSourceHighlight(label = '正文来源', lookup = null) {
      const lookupConfig = lookup && typeof lookup === 'object' ? lookup : {};
      const target = lookupConfig.target || 'content';
      if (target === 'metadata') {
        this._showMarkdownSourceNotice(`${lookupConfig.label || '当前字段'} 没有可框选的页面原文位置`);
        return;
      }
      const extractionContext = this._getMarkdownArticleExtractionContext();
      const titleLookup = lookupConfig.rawLookupText || lookupConfig.lookupText || extractionContext.title || document.title || '';
      const source = target === 'title'
        ? (this._findMarkdownTitleElement(titleLookup) || extractionContext.sourceElement || this._findMarkdownSourceElement())
        : (extractionContext.sourceElement || this._findMarkdownSourceElement());
      if (!source) {
        this._showMarkdownSourceNotice('未找到可定位的正文来源');
        return;
      }
      const lookupText = lookupConfig.lookupText || lookupConfig.rawLookupText || '';
      let highlightRange = null;
      let highlightTarget = null;
      if (target === 'title') {
        highlightTarget = source;
        highlightRange = this._findMarkdownSourceRange({
          ...lookupConfig,
          target: 'title',
          lookupText: this._trimMarkdownLookupText(titleLookup),
          rawLookupText: titleLookup
        }, source);
      } else if (lookupText) {
        highlightRange = this._findMarkdownSourceRange(lookupConfig, source);
        highlightTarget = highlightRange ? null : this._findMarkdownVisibleTextMatchElement(lookupConfig);
        if (!highlightRange && !highlightTarget) {
          const candidates = this._getMarkdownVisibleTextMatchCandidates(lookupConfig, { limit: 5, minScore: 3200 });
          if (this._showMarkdownSourceCandidateHighlights('正文候选', candidates)) return;
        }
      } else {
        highlightTarget = source;
      }

      if (!highlightRange && !highlightTarget) {
        this._showMarkdownSourceNotice('未找到当前输入位置对应的原文');
        return;
      }

      try {
        if (highlightRange) {
          this._scrollMarkdownRangeIntoView(highlightRange);
          this._selectMarkdownSourceRange(highlightRange);
        } else if (highlightTarget) {
          highlightTarget.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
        }
      } catch (_) { }

      this._removeMarkdownSourceHighlight();
      const overlay = document.createElement('div');
      overlay.id = 'dev1-md-source-highlight';
      overlay.style.cssText = `
        position: fixed;
        z-index: 2147483646;
        box-sizing: border-box;
        border: 2px solid #3b82f6;
        border-radius: 8px;
        background: rgba(59, 130, 246, 0.08);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.22), inset 0 0 0 1px rgba(255,255,255,0.62);
        pointer-events: none;
        transition: opacity 120ms ease;
      `;
      const badge = document.createElement('div');
      badge.textContent = String(lookupConfig.label || label || '正文来源');
      badge.style.cssText = `
        position: absolute;
        left: -2px;
        top: -26px;
        height: 22px;
        box-sizing: border-box;
        padding: 0 8px;
        border-radius: 7px;
        background: #2563eb;
        color: #fff;
        font: 12px/22px system-ui, -apple-system, sans-serif;
        white-space: nowrap;
        box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
      `;
      overlay.appendChild(badge);
      document.documentElement.appendChild(overlay);

      const updateOverlay = () => {
        if (!overlay.isConnected) return;
        const rect = highlightRange
          ? this._getMarkdownRangeClientRect(highlightRange)
          : highlightTarget.getBoundingClientRect();
        if (!rect) {
          this._removeMarkdownSourceHighlight();
          return;
        }
        const isSingleLineRange = !!highlightRange && rect.height > 0 && rect.height < 28;
        const box = this._getMarkdownHighlightOverlayBox(rect, {
          minWidth: 40,
          minHeight: isSingleLineRange ? 30 : 40,
          paddingX: highlightRange ? 7 : 8,
          paddingY: isSingleLineRange ? 5 : 8
        });
        if (!box) {
          this._removeMarkdownSourceHighlight();
          return;
        }
        overlay.style.left = `${box.left}px`;
        overlay.style.top = `${box.top}px`;
        overlay.style.width = `${box.width}px`;
        overlay.style.height = `${box.height}px`;
        badge.style.top = box.top <= 34 ? 'calc(100% + 4px)' : '-26px';
        this._mdSourceHighlightFrame = requestAnimationFrame(updateOverlay);
      };
      updateOverlay();
    }


    _getMarkdownImageFileMime(file) {
      if (!file) return '';
      const rawType = String(file.type || '').trim().toLowerCase();
      if (/^image\//i.test(rawType)) return rawType;

      const name = String(file.name || '').trim().toLowerCase();
      const ext = (name.match(/\.([a-z0-9]+)$/i) || [])[1] || '';
      const mimeByExt = {
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        avif: 'image/avif',
        bmp: 'image/bmp',
        ico: 'image/x-icon',
        tif: 'image/tiff',
        tiff: 'image/tiff',
        heic: 'image/heic',
        heif: 'image/heif'
      };
      return mimeByExt[ext] || '';
    }

    _isMarkdownImageFile(file) {
      return !!this._getMarkdownImageFileMime(file);
    }

    _extractMarkdownImageFileFromDataTransfer(dt) {
      if (!dt) return null;
      try {
        if (dt.items && dt.items.length) {
          for (const item of Array.from(dt.items)) {
            if (!item || item.kind !== 'file') continue;
            const file = typeof item.getAsFile === 'function' ? item.getAsFile() : null;
            if (this._isMarkdownImageFile(file)) return file;
          }
        }
      } catch (_) { }
      try {
        if (dt.files && dt.files.length) {
          return Array.from(dt.files).find((file) => this._isMarkdownImageFile(file)) || null;
        }
      } catch (_) { }
      return null;
    }

    _readMarkdownImageFileAsDataUrl(file) {
      return new Promise((resolve) => {
        try {
          const reader = new FileReader();
          reader.onload = () => {
            let dataUrl = String(reader.result || '');
            const mime = this._getMarkdownImageFileMime(file);
            if (mime && dataUrl && !/^data:image\//i.test(dataUrl)) {
              dataUrl = dataUrl.replace(/^data:[^;,]*(;base64,)/i, `data:${mime}$1`);
              if (!/^data:image\//i.test(dataUrl) && dataUrl.includes(';base64,')) {
                dataUrl = dataUrl.replace(/^data:/i, `data:${mime}`);
              }
            }
            resolve(dataUrl);
          };
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        } catch (_) {
          resolve('');
        }
      });
    }

    _normalizeMarkdownImageUrl(value) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      if (/^(data:image\/|blob:)/i.test(raw)) return raw;
      try {
        return new URL(raw, location.href).toString();
      } catch (_) {
        return raw;
      }
    }

    _isDurableMarkdownImageUrl(value) {
      try {
        const url = new URL(String(value || '').trim(), location.href);
        return url.protocol === 'http:' || url.protocol === 'https:';
      } catch (_) {
        return false;
      }
    }

    _isLikelyMarkdownImageUrl(value) {
      const url = String(value || '').trim();
      if (!url) return false;
      if (/^data:image\//i.test(url) || /^blob:/i.test(url)) return true;
      return /\.(png|jpe?g|gif|webp|svg|avif|bmp|ico|tiff?|heic|heif)(?:[?#].*)?$/i.test(url);
    }

    _extractFirstImageSrcFromHtml(html) {
      const raw = String(html || '');
      if (!raw) return '';
      try {
        const parsed = new DOMParser().parseFromString(raw, 'text/html');
        const img = parsed.querySelector('img[src], picture source[srcset], source[srcset]');
        if (img) {
          const src = img.getAttribute('src') || String(img.getAttribute('srcset') || '').split(',')[0].trim().split(/\s+/)[0] || '';
          if (src) return this._normalizeMarkdownImageUrl(src);
        }
      } catch (_) { }
      const srcMatch = raw.match(/<img[^>]*\s+src\s*=\s*['"]([^'"]+)['"]/i);
      if (srcMatch && srcMatch[1]) return this._normalizeMarkdownImageUrl(srcMatch[1]);
      const srcsetMatch = raw.match(/<(?:source|img)[^>]*\s+srcset\s*=\s*['"]([^'"]+)['"]/i);
      if (srcsetMatch && srcsetMatch[1]) {
        const first = String(srcsetMatch[1] || '').split(',')[0].trim().split(/\s+/)[0] || '';
        return this._normalizeMarkdownImageUrl(first);
      }
      return '';
    }

    _extractFirstUrlFromMarkdownDropText(text) {
      const raw = String(text || '');
      const direct = raw.match(/\b(data:image\/[a-z0-9+.-]+;base64,[^\s"'<>]+)\b/i);
      if (direct && direct[1]) return direct[1].trim();
      const url = raw.match(/\b((?:https?|file):\/\/[^\s"'<>]+|blob:[^\s"'<>]+)\b/i);
      return url && url[1] ? url[1].trim() : '';
    }

    async _tryFetchMarkdownImageAsDataUrl(src) {
      const url = String(src || '').trim();
      if (!url) return '';
      if (/^data:image\//i.test(url)) return url;
      try {
        const response = await fetch(url);
        if (!response || !response.ok) return '';
        const blob = await response.blob();
        if (!blob || !this._isMarkdownImageFile(blob)) return '';
        return await this._readMarkdownImageFileAsDataUrl(blob);
      } catch (_) {
        return '';
      }
    }

    _buildMarkdownLocalImageId() {
      const time = Date.now().toString(36);
      const random = Math.random().toString(36).slice(2, 9);
      return `img_${time}_${random}`;
    }

    async _storeMarkdownLocalImage(dataUrl, alt = '') {
      const src = String(dataUrl || '').trim();
      if (!/^data:image\//i.test(src)) return '';
      const scoped = this._getScopedStorage();
      const tabId = this.config?.existingTabId;
      const currentUrl = this._getCurrentUrl();
      if (!scoped || tabId == null) return '';
      try {
        const id = this._buildMarkdownLocalImageId();
        const existing = await scoped.getScoped(tabId, 'md_images', currentUrl);
        const images = existing && typeof existing === 'object' && !Array.isArray(existing) ? existing : {};
        images[id] = {
          dataUrl: src,
          alt: String(alt || '').trim(),
          createdAt: new Date().toISOString()
        };
        await scoped.setScoped(tabId, 'md_images', currentUrl, images);
        return `dev1-local-image:${id}`;
      } catch (_) {
        return '';
      }
    }

    async _resolveMarkdownImageUrlDropSource(src, alt = '') {
      const normalized = this._normalizeMarkdownImageUrl(src);
      if (!normalized) return null;
      if (this._isDurableMarkdownImageUrl(normalized)) {
        return { src: normalized, alt };
      }

      const dataUrl = await this._tryFetchMarkdownImageAsDataUrl(normalized);
      if (dataUrl && /^data:image\//i.test(dataUrl)) {
        const placeholder = await this._storeMarkdownLocalImage(dataUrl, alt);
        return { src: placeholder || dataUrl, alt };
      }

      return { src: normalized, alt };
    }

    _dataTransferHasMarkdownImage(dt, allowFileTypeFallback = false) {
      if (!dt) return false;
      if (this._extractMarkdownImageFileFromDataTransfer(dt)) return true;
      try {
        const types = Array.from(dt.types || []).map((type) => String(type || '').toLowerCase());
        if (allowFileTypeFallback && types.includes('files')) return true;
      } catch (_) { }
      let htmlData = '';
      let uriList = '';
      let plainText = '';
      try {
        htmlData = dt.getData('text/html') || '';
        uriList = dt.getData('text/uri-list') || '';
        plainText = dt.getData('text/plain') || '';
      } catch (_) { }
      const imgSrc = this._extractFirstImageSrcFromHtml(htmlData);
      if (imgSrc) return true;
      const url = this._extractFirstUrlFromMarkdownDropText(uriList || plainText);
      return this._isLikelyMarkdownImageUrl(url);
    }

    async _resolveMarkdownImageDropSource(dt) {
      if (!dt) return null;

      const file = this._extractMarkdownImageFileFromDataTransfer(dt);
      if (file) {
        if (Number(file.size) > 20 * 1024) {
          alert(this.config.lang === 'en'
            ? 'Image too large (max 20KB). Only small icons/emojis are inserted as Base64 to avoid bloating Markdown.'
            : '图片过大（最大支持 20KB）。为避免 Base64 过长影响 Markdown，仅支持小图标/表情。');
          return null;
        }
        const dataUrl = await this._readMarkdownImageFileAsDataUrl(file);
        if (dataUrl && /^data:image\//i.test(dataUrl)) {
          const alt = String(file.name || 'image').replace(/[\r\n\[\]]/g, ' ').trim();
          const placeholder = await this._storeMarkdownLocalImage(dataUrl, alt);
          return { src: placeholder || dataUrl, alt };
        }
      }

      let htmlData = '';
      let uriList = '';
      let plainText = '';
      try {
        htmlData = dt.getData('text/html') || '';
        uriList = dt.getData('text/uri-list') || '';
        plainText = dt.getData('text/plain') || '';
      } catch (_) { }

      const imgSrc = this._extractFirstImageSrcFromHtml(htmlData);
      if (imgSrc) return await this._resolveMarkdownImageUrlDropSource(imgSrc, '');

      const url = this._extractFirstUrlFromMarkdownDropText(uriList || plainText);
      if (this._isLikelyMarkdownImageUrl(url)) {
        return await this._resolveMarkdownImageUrlDropSource(url, '');
      }

      return null;
    }

    _insertTextIntoMarkdownTextarea(textarea, text) {
      if (!(textarea instanceof HTMLTextAreaElement)) return false;
      const insertText = String(text || '');
      const value = String(textarea.value || '');
      const start = Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : value.length;
      const end = Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : start;
      let inserted = false;
      try {
        textarea.focus({ preventScroll: true });
        textarea.setSelectionRange(start, end);
        inserted = typeof document.execCommand === 'function'
          && document.execCommand('insertText', false, insertText);
      } catch (_) {
        inserted = false;
      }
      if (!inserted) {
        const nextPos = start + insertText.length;
        if (typeof textarea.setRangeText === 'function') {
          textarea.setRangeText(insertText, start, end, 'end');
        } else {
          textarea.value = value.slice(0, start) + insertText + value.slice(end);
          try { textarea.setSelectionRange(nextPos, nextPos); } catch (_) { }
        }
      }
      try {
        textarea.focus({ preventScroll: true });
      } catch (_) { }
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    _bindMarkdownImageDrop(textarea) {
      if (!(textarea instanceof HTMLTextAreaElement) || textarea.__dev1MarkdownImageDropBound) return;
      textarea.__dev1MarkdownImageDropBound = true;

      textarea.addEventListener('dragover', (event) => {
        const dt = event.dataTransfer;
        if (!dt) return;
        // Check types to see if it is a potential file, HTML or text drop
        try {
          const types = Array.from(dt.types || []).map((type) => String(type || '').toLowerCase());
          if (types.includes('files') || types.includes('text/html') || types.includes('text/plain') || types.includes('text/uri-list')) {
            event.preventDefault();
            try { dt.dropEffect = 'copy'; } catch (_) { }
          }
        } catch (_) { }
      });

      textarea.addEventListener('drop', async (event) => {
        const dt = event.dataTransfer;
        if (!dt) return;

        // 1. First priority: Handle direct image file drops
        const file = this._extractMarkdownImageFileFromDataTransfer(dt);
        if (file) {
          event.preventDefault();
          if (Number(file.size) > 20 * 1024) {
            alert(this.config.lang === 'en'
              ? 'Image too large (max 20KB). Only small icons/emojis are inserted as Base64 to avoid bloating Markdown.'
              : '图片过大（最大支持 20KB）。为避免 Base64 过长影响 Markdown，仅支持小图标/表情。');
            return;
          }
          const dataUrl = await this._readMarkdownImageFileAsDataUrl(file);
          if (dataUrl && /^data:image\//i.test(dataUrl)) {
            const alt = String(file.name || 'image').replace(/[\r\n\[\]]/g, ' ').trim();
            const placeholder = await this._storeMarkdownLocalImage(dataUrl, alt);
            this._insertTextIntoMarkdownTextarea(textarea, `![${alt}](${placeholder || dataUrl})`);
          }
          return;
        }

        // 2. Second priority: Handle text / HTML / URLs drops
        let htmlData = '';
        let plainText = '';
        let uriList = '';
        try {
          htmlData = dt.getData('text/html') || '';
          plainText = dt.getData('text/plain') || '';
          uriList = dt.getData('text/uri-list') || '';
        } catch (_) { }

        const combinedText = uriList || plainText;
        const formatted = await this._convertTextAndHtmlToMarkdown(combinedText, htmlData);
        if (formatted) {
          event.preventDefault();
          this._insertTextIntoMarkdownTextarea(textarea, formatted);
        }
      });
    }

    _bindMarkdownImagePaste(textarea) {
      if (!(textarea instanceof HTMLTextAreaElement) || textarea.__dev1MarkdownImagePasteBound) return;
      textarea.__dev1MarkdownImagePasteBound = true;

      textarea.addEventListener('paste', async (event) => {
        const cd = event.clipboardData;
        if (!cd) return;

        // 1. Handle direct clipboard image pasting (e.g. screenshot pasting)
        if (cd.items && cd.items.length) {
          const imgItem = Array.from(cd.items).find(item => item && item.kind === 'file' && item.type.startsWith('image/'));
          if (imgItem) {
            const file = typeof imgItem.getAsFile === 'function' ? imgItem.getAsFile() : null;
            if (file) {
              event.preventDefault();
              if (Number(file.size) > 20 * 1024) {
                alert(this.config.lang === 'en'
                  ? 'Image too large (max 20KB). Only small icons/emojis are inserted as Base64 to avoid bloating Markdown.'
                  : '图片过大（最大支持 20KB）。为避免 Base64 过长影响 Markdown，仅支持小图标/表情。');
                return;
              }
              const dataUrl = await this._readMarkdownImageFileAsDataUrl(file);
              if (dataUrl && /^data:image\//i.test(dataUrl)) {
                const alt = String(file.name || 'image').replace(/[\r\n\[\]]/g, ' ').trim();
                const placeholder = await this._storeMarkdownLocalImage(dataUrl, alt);
                this._insertTextIntoMarkdownTextarea(textarea, `![${alt}](${placeholder || dataUrl})`);
              }
              return;
            }
          }
        }

        // 2. Handle HTML links, Obsidian wikilinks, image urls, etc.
        let htmlData = '';
        let plainText = '';
        try {
          htmlData = cd.getData('text/html') || '';
          plainText = cd.getData('text/plain') || '';
        } catch (_) { }

        const formatted = await this._convertTextAndHtmlToMarkdown(plainText, htmlData);
        if (formatted) {
          event.preventDefault();
          this._insertTextIntoMarkdownTextarea(textarea, formatted);
        }
      });
    }

    async _convertTextAndHtmlToMarkdown(plainText, htmlData) {
      const trimmedPlain = String(plainText || '').trim();
      const trimmedHtml = String(htmlData || '').trim();

      // 1. Check HTML for img tag first
      const htmlImgSrc = this._extractFirstImageSrcFromHtml(trimmedHtml);
      if (htmlImgSrc) {
        const resolved = await this._resolveMarkdownImageUrlDropSource(htmlImgSrc, '');
        if (resolved && resolved.src) {
          return `![${resolved.alt || ''}](${resolved.src})`;
        }
      }

      // 2. Check Obsidian image wikilink format: ![[image.png]] or ![[image.png|width]]
      const obsImgMatch = trimmedPlain.match(/!\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/);
      if (obsImgMatch) {
        const imgPath = obsImgMatch[1].trim();
        const resolved = await this._resolveMarkdownImageUrlDropSource(imgPath, '');
        return `![image](${resolved ? resolved.src : imgPath})`;
      }

      // 3. Check Obsidian standard image wikilink format: [[image.png]] or [[image.png|width]]
      const obsLinkMatch = trimmedPlain.match(/\[\[([^\]|]+)(?:\|([^\]]*))?\]\]/);
      if (obsLinkMatch) {
        const linkPath = obsLinkMatch[1].trim();
        const dispText = (obsLinkMatch[2] || '').trim() || linkPath;
        if (this._isLikelyMarkdownImageUrl(linkPath)) {
          const resolved = await this._resolveMarkdownImageUrlDropSource(linkPath, '');
          return `![${dispText}](${resolved ? resolved.src : linkPath})`;
        } else {
          return `[${dispText}](${linkPath})`;
        }
      }

      // 4. Check HTML for a link tag: <a href="url">text</a>
      if (trimmedHtml) {
        try {
          const parsed = new DOMParser().parseFromString(trimmedHtml, 'text/html');
          const anchor = parsed.querySelector('a[href]');
          if (anchor) {
            const href = anchor.getAttribute('href');
            const text = anchor.textContent.trim() || href;
            if (href) {
              return `[${text}](${href})`;
            }
          }
        } catch (_) {}
      }

      // 5. Check if it's a standard URL link
      if (this._isDurableMarkdownImageUrl(trimmedPlain)) {
        if (this._isLikelyMarkdownImageUrl(trimmedPlain)) {
          const resolved = await this._resolveMarkdownImageUrlDropSource(trimmedPlain, '');
          return `![image](${resolved ? resolved.src : trimmedPlain})`;
        } else {
          let linkText = '链接';
          try {
            const parsed = new URL(trimmedPlain);
            linkText = parsed.hostname.replace(/^www\./i, '') || '链接';
          } catch (_) {}
          return `[${linkText}](${trimmedPlain})`;
        }
      }

      return '';
    }


    _repositionMdSettingsPanel() {
      const panel = this._getMdSettingsPanel();
      const anchor = this._mdSettingsAnchor;
      if (!panel || !anchor) return;

      const rect = anchor.getBoundingClientRect();
      const PANEL_WIDTH = 340;
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const PANEL_HEIGHT = Math.max(600, Math.floor(viewportHeight * 0.92));
      
      panel.style.height = `${PANEL_HEIGHT}px`;

      if (!panel.__dev1ManuallyDragged) {
        let left = rect.left - PANEL_WIDTH + rect.width;
        if (left + PANEL_WIDTH > window.innerWidth) left = window.innerWidth - PANEL_WIDTH - 10;
        if (left < 10) left = 10;

        let top = rect.top - PANEL_HEIGHT - 10;
        if (top < 10) {
          top = rect.bottom + 10;
          if (top + PANEL_HEIGHT > viewportHeight) {
            top = Math.max(10, viewportHeight - PANEL_HEIGHT - 10);
          }
        }
        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
      } else {
        let left = parseFloat(panel.style.left) || 0;
        let top = parseFloat(panel.style.top) || 0;
        
        if (left + PANEL_WIDTH > window.innerWidth) left = window.innerWidth - PANEL_WIDTH - 10;
        if (left < 10) left = 10;
        if (top + PANEL_HEIGHT > viewportHeight) top = Math.max(10, viewportHeight - PANEL_HEIGHT - 10);
        if (top < 10) top = 10;

        panel.style.left = `${left}px`;
        panel.style.top = `${top}px`;
      }
    }

    async _showMdSettingsPanel(anchor) {
      const existing = this._getMdSettingsPanel();
      if (existing) { this._removeMdSettingsPanel(); return; }

      this._mdSettingsAnchor = anchor;
      const rect = anchor.getBoundingClientRect();
      const PANEL_WIDTH = 340;
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const PANEL_HEIGHT = Math.max(600, Math.floor(viewportHeight * 0.92));
      
      let left = rect.left - PANEL_WIDTH + rect.width;
      if (left + PANEL_WIDTH > window.innerWidth) left = window.innerWidth - PANEL_WIDTH - 10;
      if (left < 10) left = 10;

      let top = rect.top - PANEL_HEIGHT - 10;
      if (top < 10) {
        top = rect.bottom + 10;
        if (top + PANEL_HEIGHT > viewportHeight) {
          top = Math.max(10, viewportHeight - PANEL_HEIGHT - 10);
        }
      }

      const panel = document.createElement('div');
      panel.id = 'md-settings-panel';
      panel.style.cssText = `
        position: fixed;
        top: ${top}px;
        left: ${left}px;
        width: ${PANEL_WIDTH}px;
        height: ${PANEL_HEIGHT}px;
        background: var(--panel-bg);
        border: 1px solid var(--panel-border);
        border-radius: 12px;
        box-shadow: var(--panel-shadow);
        z-index: 2147483648;
        font-family: system-ui, -apple-system, sans-serif;
        color: var(--text-main);
        overflow: hidden;
        display: flex;
        flex-direction: column;
      `;

      const scoped = this._getScopedStorage();
      const currentUrl = this._getCurrentUrl();
      const tabId = this.config?.existingTabId;

      let initialContent = null;
      let initialNotes = '';
      let initialArticle = '';
      let cachedArticle = '';
      let metadata = null;
      if (scoped && tabId != null) {
        try {
          initialContent = await scoped.getScoped(tabId, 'md_content', currentUrl);
          const storedNotes = await scoped.getScoped(tabId, 'md_notes', currentUrl);
          if (storedNotes != null) initialNotes = storedNotes;
          const storedArticle = await scoped.getScoped(tabId, 'md_article', currentUrl);
          if (storedArticle != null) {
            cachedArticle = storedArticle;
            initialArticle = storedArticle;
          }
        } catch (e) {}
      }

      try {
        const response = await sendRuntimeMessage({ action: 'dev1SnapshotHelperGetArticleContent' }, 30000);
        if (response && response.success) {
          initialArticle = response.article || '';
          metadata = response.metadata;
          if (scoped && tabId != null) {
            await scoped.setScoped(tabId, 'md_article', currentUrl, initialArticle);
          }
        } else {
          initialArticle = cachedArticle || '[正文提取失败]';
        }
      } catch (e) {
        initialArticle = cachedArticle || '[正文提取超时或出错]';
      }

      if (initialContent == null) {
        initialContent = this._buildMarkdownDefaultTemplate(metadata, currentUrl);
      }

      const header = document.createElement('div');
      header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        background: var(--header-bg);
        border-bottom: 1px solid var(--panel-border);
        font-size: 13px;
        font-weight: 600;
        cursor: move;
        user-select: none;
        flex-shrink: 0;
      `;
      header.innerHTML = `
        <span style="display:flex; align-items:center; gap:4px; min-width:0;">
          <span>Markdown 模板设置</span>
          <button type="button" class="md-settings-help md-settings-btn" data-no-drag="true" style="
            font-size: 12px; line-height: 1; font-weight: 700; flex: 0 0 26px;
          " title="说明" aria-label="说明">?</button>
        </span>
        <div style="display: flex; gap: 6px; align-items: center;">
          <button type="button" class="md-settings-pin md-settings-btn" style="
            display: flex; align-items: center; justify-content: center;
          " title="取消置顶">
            <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 11V7a4 4 0 0 0-8 0v4L5 14h14l-3-3z"></path><path d="M12 14v7"></path>
            </svg>
          </button>
          <button type="button" class="md-settings-close md-settings-btn" style="
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; line-height: 1;
          ">×</button>
        </div>
      `;

      const tabContainer = document.createElement('div');
      tabContainer.style.cssText = `
        display: flex;
        border-bottom: 1px solid var(--panel-border);
        background: var(--header-bg);
        flex-shrink: 0;
      `;

      const tab1 = document.createElement('button');
      tab1.type = 'button';
      tab1.textContent = '模板与笔记';
      tab1.style.cssText = `
        flex: 1; padding: 10px 0; border: 0; background: transparent;
        color: var(--text-main); font-size: 13px; font-weight: 550;
        cursor: pointer; border-bottom: 2px solid var(--accent-color); transition: all 0.2s;
        outline: none;
      `;

      const tab2 = document.createElement('button');
      tab2.type = 'button';
      tab2.textContent = '正文';
      tab2.style.cssText = `
        flex: 1; padding: 10px 0; border: 0; background: transparent;
        color: var(--text-muted); font-size: 13px; font-weight: 550;
        cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s;
        outline: none;
      `;

      tabContainer.appendChild(tab1);
      tabContainer.appendChild(tab2);

      const body = document.createElement('div');
      body.style.cssText = `
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        flex: 1;
        overflow: hidden;
        box-sizing: border-box;
      `;

      const tab1Content = document.createElement('div');
      tab1Content.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        flex: 1;
        overflow: hidden;
      `;

      const tab2Content = document.createElement('div');
      tab2Content.style.cssText = `
        display: none;
        flex-direction: column;
        gap: 10px;
        flex: 1;
        overflow: hidden;
      `;

      const createSourceLocateButton = (title, label, getLookup) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.noDrag = 'true';
        const tipText = '根据输入闪烁竖条/选中候选，进行定位';
        btn.setAttribute('aria-label', tipText);
        btn.title = title || tipText;
        btn.style.cssText = `
          width: 22px;
          height: 22px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex: 0 0 22px;
          transition: all 0.2s ease;
        `;
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="7"></circle>
            <circle cx="12" cy="12" r="2"></circle>
            <path d="M12 2v3"></path><path d="M12 19v3"></path><path d="M2 12h3"></path><path d="M19 12h3"></path>
          </svg>
        `;
        let sourceTip = null;
        let sourceTipTimer = null;
        const removeSourceTip = () => {
          if (sourceTipTimer) {
            clearTimeout(sourceTipTimer);
            sourceTipTimer = null;
          }
          if (sourceTip) {
            sourceTip.remove();
            sourceTip = null;
          }
        };
        const showSourceTip = () => {
          removeSourceTip();
          sourceTipTimer = setTimeout(() => {
            sourceTip = document.createElement('div');
            sourceTip.textContent = tipText;
            sourceTip.style.cssText = `
              position: fixed;
              z-index: 2147483649;
              height: 24px;
              box-sizing: border-box;
              padding: 0 8px;
              border-radius: 7px;
              background: var(--panel-bg);
              backdrop-filter: var(--backdrop-filter);
              -webkit-backdrop-filter: var(--backdrop-filter);
              border: 1px solid var(--panel-border);
              color: var(--text-main);
              font: 11px/22px system-ui, -apple-system, sans-serif;
              white-space: nowrap;
              pointer-events: none;
              box-shadow: var(--panel-shadow);
            `;
            document.documentElement.appendChild(sourceTip);
            const rect = btn.getBoundingClientRect();
            const tipRect = sourceTip.getBoundingClientRect();
            const gap = 6;
            const left = Math.max(8, Math.min(window.innerWidth - tipRect.width - 8, rect.left + rect.width / 2 - tipRect.width / 2));
            let top = rect.bottom + gap;
            if (top + tipRect.height > window.innerHeight - 8) {
              top = rect.top - tipRect.height - gap;
            }
            sourceTip.style.left = `${left}px`;
            sourceTip.style.top = `${Math.max(8, top)}px`;
          }, 120);
        };
        btn.addEventListener('focus', showSourceTip);
        btn.addEventListener('blur', removeSourceTip);
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          removeSourceTip();
          const lookup = typeof getLookup === 'function' ? getLookup() : null;
          this._showMarkdownSourceHighlight(label, lookup);
        });
        return btn;
      };

      const createFieldRefreshButton = (title) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.noDrag = 'true';
        btn.title = title;
        btn.setAttribute('aria-label', title);
        btn.style.cssText = `
          width: 22px;
          height: 22px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex: 0 0 22px;
          transition: color 0.16s ease, opacity 0.16s ease;
        `;
        btn.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 0 0-15.5-6.3L3 8"></path>
            <path d="M3 3v5h5"></path>
            <path d="M3 12a9 9 0 0 0 15.5 6.3L21 16"></path>
            <path d="M16 16h5v5"></path>
          </svg>
        `;
        btn.addEventListener('mouseenter', () => {
          if (btn.disabled) return;
          btn.style.color = 'var(--text-main)';
        });
        btn.addEventListener('mouseleave', () => {
          if (btn.disabled) return;
          btn.style.color = 'var(--text-muted)';
        });
        return btn;
      };

      const setFieldRefreshState = (btn, state, fallbackTitle) => {
        if (!btn) return;
        if (btn._dev1RefreshStateTimer) {
          clearTimeout(btn._dev1RefreshStateTimer);
          btn._dev1RefreshStateTimer = null;
        }
        const svg = btn.querySelector('svg');
        btn.disabled = state === 'loading';
        btn.setAttribute('aria-busy', state === 'loading' ? 'true' : 'false');
        btn.title = state === 'loading' ? '获取中...' : fallbackTitle;
        btn.style.opacity = state === 'loading' ? '0.58' : '1';
        btn.style.cursor = state === 'loading' ? 'default' : 'pointer';
        btn.style.background = 'transparent';
        btn.style.color = state === 'error' ? '#ef4444' : (state === 'success' ? 'var(--accent-color)' : 'var(--text-muted)');
        if (svg) svg.style.transform = state === 'loading' ? 'rotate(180deg)' : '';
        if (state === 'success' || state === 'error') {
          btn._dev1RefreshStateTimer = setTimeout(() => setFieldRefreshState(btn, 'idle', fallbackTitle), 1200);
        }
      };

      const createSourceLabel = (text, title, highlightLabel, getLookup) => {
        const label = document.createElement('div');
        label.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          box-sizing: border-box;
          font-size: 11px;
          font-weight: 600;
          color: var(--text-muted);
          margin-bottom: -6px;
          flex-shrink: 0;
        `;
        const left = document.createElement('span');
        left.style.cssText = `
          display: inline-flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        `;
        const textEl = document.createElement('span');
        textEl.textContent = text;
        left.appendChild(textEl);
        left.appendChild(createSourceLocateButton(title, highlightLabel, getLookup));
        const actions = document.createElement('span');
        actions.style.cssText = `
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          margin-left: auto;
          flex: 0 0 auto;
        `;
        label.appendChild(left);
        label.appendChild(actions);
        label._leftActions = left;
        label._rightActions = actions;
        return label;
      };

      let textarea = null;
      const templateLabel = createSourceLabel(
        '1. 导出模板（可自定义）',
        '定位 {{content}} 对应正文来源',
        '{{content}} 对应正文来源',
        () => this._getMarkdownTextareaSourceLookup(textarea, 'template', '{{content}} 对应正文来源')
      );
      const refreshTemplateTitle = '重新获取导出模板';
      const refreshTemplateBtn = createFieldRefreshButton(refreshTemplateTitle);
      templateLabel._rightActions.appendChild(refreshTemplateBtn);

      textarea = document.createElement('textarea');
      textarea.style.cssText = `
        width: 100%;
        box-sizing: border-box;
        flex: 2;
        min-height: 150px;
        font-family: monospace;
      `;
      textarea.value = initialContent;
      this._bindMarkdownTextareaSelectionMemory(textarea);
      this._mdTextarea = textarea;

      const notesLabel = document.createElement('div');
      notesLabel.style.cssText = `font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: -6px; margin-top: 4px; flex-shrink: 0;`;
      notesLabel.textContent = '2. 你的笔记（自由输入，插入到正文前）';

      const notesArea = document.createElement('textarea');
      notesArea.style.cssText = `
        width: 100%;
        box-sizing: border-box;
        flex: 1;
        min-height: 80px;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      notesArea.value = initialNotes;
      notesArea.placeholder = '在这里 write 你的笔记、想法、摘要…';
      this._mdNotesArea = notesArea;

      tab1Content.appendChild(templateLabel);
      tab1Content.appendChild(textarea);
      tab1Content.appendChild(notesLabel);
      tab1Content.appendChild(notesArea);

      let articleArea = null;
      const articleLabel = createSourceLabel(
        '正文（提取结果）',
        '定位正文来源',
        '正文来源',
        () => this._getMarkdownTextareaSourceLookup(articleArea, 'article', '正文来源')
      );
      const refreshArticleTitle = '重新获取正文';
      const refreshArticleBtn = createFieldRefreshButton(refreshArticleTitle);
      articleLabel._rightActions.appendChild(refreshArticleBtn);

      articleArea = document.createElement('textarea');
      articleArea.style.cssText = `
        width: 100%;
        box-sizing: border-box;
        flex: 1;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      articleArea.value = initialArticle;
      articleArea.placeholder = '提取的正文内容...';
      this._bindMarkdownTextareaSelectionMemory(articleArea);
      this._mdArticleArea = articleArea;

      // Create TOC Button
      const tocBtn = document.createElement('button');
      tocBtn.type = 'button';
      tocBtn.dataset.noDrag = 'true';
      tocBtn.title = '文章目录';
      tocBtn.setAttribute('aria-label', '文章目录');
      tocBtn.style.cssText = `
        width: 22px;
        height: 22px;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        flex: 0 0 22px;
        transition: all 0.2s ease;
      `;
      tocBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <line x1="8" y1="6" x2="21" y2="6"></line>
          <line x1="8" y1="12" x2="21" y2="12"></line>
          <line x1="8" y1="18" x2="21" y2="18"></line>
          <line x1="3" y1="6" x2="3.01" y2="6"></line>
          <line x1="3" y1="12" x2="3.01" y2="12"></line>
          <line x1="3" y1="18" x2="3.01" y2="18"></line>
        </svg>
      `;
      articleLabel._leftActions.appendChild(tocBtn);

      let tocPanel = null;

      const syncTocPanelPosition = () => {
        if (!tocPanel || !panel) return;
        const panelLeft = parseFloat(panel.style.left) || 0;
        const panelTop = parseFloat(panel.style.top) || 0;
        const panelHeight = parseFloat(panel.style.height) || panel.offsetHeight;
        
        const TOC_WIDTH = 260;
        let left = panelLeft - TOC_WIDTH - 8;
        if (left < 0) {
          left = panelLeft + panel.offsetWidth + 8;
        }
        tocPanel.style.left = `${left}px`;
        tocPanel.style.top = `${panelTop}px`;
        tocPanel.style.height = `${panelHeight}px`;
      };

      const scrollTextareaMatchToCenter = (targetTextarea, matchStart) => {
        if (!targetTextarea || matchStart < 0) return false;
        const textVal = targetTextarea.value || '';
        const style = window.getComputedStyle(targetTextarea);
        const visibleHeight = targetTextarea.clientHeight;
        if (!visibleHeight) return false;

        const mirror = document.createElement('div');
        const rect = targetTextarea.getBoundingClientRect();
        const paddingLeft = parseFloat(style.paddingLeft) || 0;
        const paddingRight = parseFloat(style.paddingRight) || 0;
        const mirrorWidth = Math.max(0, (targetTextarea.clientWidth || rect.width || 0) - paddingLeft - paddingRight);
        if (!mirrorWidth) return false;

        const copyProps = [
          'fontFamily',
          'fontSize',
          'fontWeight',
          'fontStyle',
          'fontVariant',
          'fontStretch',
          'lineHeight',
          'letterSpacing',
          'textTransform',
          'textAlign',
          'textIndent',
          'wordSpacing',
          'wordBreak',
          'tabSize',
          'direction',
          'paddingTop',
          'paddingRight',
          'paddingBottom',
          'paddingLeft'
        ];
        copyProps.forEach(prop => {
          mirror.style[prop] = style[prop];
        });
        mirror.style.cssText += `
          position: absolute;
          left: -100000px;
          top: 0;
          width: ${mirrorWidth}px;
          height: auto;
          min-height: 0;
          visibility: hidden;
          overflow: hidden;
          box-sizing: content-box;
          white-space: ${targetTextarea.wrap === 'off' ? 'pre' : 'pre-wrap'};
          overflow-wrap: break-word;
          word-wrap: break-word;
          pointer-events: none;
          z-index: -1;
        `;

        const marker = document.createElement('span');
        marker.textContent = '\u200b';
        mirror.textContent = textVal.slice(0, matchStart);
        mirror.appendChild(marker);
        (document.body || document.documentElement).appendChild(mirror);

        try {
          const markerTop = marker.offsetTop;
          const lineHeight = parseFloat(style.lineHeight) || marker.offsetHeight || 16;
          const maxScroll = Math.max(0, targetTextarea.scrollHeight - visibleHeight);
          const targetScroll = Math.max(0, Math.min(maxScroll, markerTop - (visibleHeight / 2) + (lineHeight / 2)));
          targetTextarea.scrollTop = targetScroll;
          return true;
        } finally {
          mirror.remove();
        }
      };

      const findAndSelectText = (rawText, occurrenceIndex = 0, exactStart = -1) => {
        const textVal = articleArea.value;
        let pos = -1;
        if (Number.isFinite(exactStart) && exactStart >= 0 && textVal.slice(exactStart, exactStart + rawText.length) === rawText) {
          pos = exactStart;
        } else {
          let currentOccurrence = 0;
          let searchPos = 0;
          while ((searchPos = textVal.indexOf(rawText, searchPos)) !== -1) {
            if (currentOccurrence === occurrenceIndex) {
              pos = searchPos;
              break;
            }
            currentOccurrence++;
            searchPos += rawText.length;
          }

          if (pos === -1) {
            pos = textVal.indexOf(rawText);
          }
        }
        
        if (pos !== -1) {
          articleArea.focus();
          articleArea.setSelectionRange(pos, pos + rawText.length);
          if (!scrollTextareaMatchToCenter(articleArea, pos)) {
            const textBefore = textVal.substring(0, pos);
            const lineCount = textBefore.split('\n').length - 1;
            const style = window.getComputedStyle(articleArea);
            const lineHeight = parseFloat(style.lineHeight) || 16;
            const visibleHeight = articleArea.clientHeight;
            const targetScroll = Math.max(0, lineCount * lineHeight - visibleHeight / 2);
            articleArea.scrollTop = targetScroll;
          }
          
          articleArea.dispatchEvent(new Event('input'));
          articleArea.dispatchEvent(new Event('select'));
          articleArea.focus();
          articleArea.setSelectionRange(pos, pos + rawText.length);
        }
      };

      const renderTocList = () => {
        const listContainer = tocPanel.querySelector('.toc-list-container');
        if (!listContainer) return;
        listContainer.innerHTML = '';
        
        const lines = articleArea.value.split('\n');
        const tocItems = [];
        let lineStart = 0;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          
          const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
          if (headingMatch) {
            tocItems.push({
              type: 'heading',
              level: headingMatch[1].length,
              text: headingMatch[2],
              raw: line,
              startOffset: lineStart,
              index: i
            });
            lineStart += line.length + 1;
            continue;
          }
          
          const sepMatch = trimmed.match(/^(=+|-+)$/);
          if (sepMatch && (trimmed.startsWith('---') || trimmed.startsWith('==='))) {
            let displayName = trimmed;
            if (i > 0 && lines[i-1].trim().length > 0 && !lines[i-1].trim().match(/^(#{1,6})\s+/)) {
              displayName = `${lines[i-1].trim()} (${trimmed})`;
            }
            tocItems.push({
              type: 'separator',
              level: 2,
              text: displayName,
              raw: line,
              startOffset: lineStart,
              index: i
            });
          }
          lineStart += line.length + 1;
        }
        
        if (tocItems.length === 0) {
          const noToc = document.createElement('div');
          noToc.textContent = '无目录项';
          noToc.style.cssText = `
            padding: 16px;
            color: var(--text-muted);
            font-size: 13px;
            text-align: center;
          `;
          listContainer.appendChild(noToc);
          return;
        }
        
        const rawOccurrences = {};
        
        tocItems.forEach((item) => {
          const raw = item.raw;
          if (rawOccurrences[raw] === undefined) {
            rawOccurrences[raw] = 0;
          } else {
            rawOccurrences[raw]++;
          }
          const occurrenceIndex = rawOccurrences[raw];
          
          const itemEl = document.createElement('div');
          itemEl.className = 'toc-item';
          itemEl.title = item.raw;
          
          let indent = (item.level - 1) * 12 + 8;
          let fontSize = 13 - (item.level - 1) * 0.5;
          if (fontSize < 11) fontSize = 11;
          
          itemEl.style.cssText = `
            padding: 6px 12px 6px ${indent}px;
            cursor: pointer;
            font-size: ${fontSize}px;
            font-weight: ${item.type === 'heading' && item.level <= 3 ? '600' : 'normal'};
            color: var(--text-main);
            border-radius: 6px;
            transition: all 0.2s ease;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin: 2px 4px;
            display: flex;
            align-items: center;
            gap: 4px;
          `;
          
          itemEl.addEventListener('mouseenter', () => {
            itemEl.style.background = 'rgba(128,128,128,0.15)';
          });
          itemEl.addEventListener('mouseleave', () => {
            itemEl.style.background = 'transparent';
          });
          
          const dot = document.createElement('span');
          if (item.type === 'heading') {
            dot.textContent = 'H' + item.level;
            dot.style.cssText = `
              font-size: 9px;
              font-weight: bold;
              color: var(--text-muted);
              background: rgba(128,128,128,0.1);
              padding: 1px 3px;
              border-radius: 3px;
              margin-right: 4px;
              flex-shrink: 0;
            `;
          } else {
            dot.textContent = '—';
            dot.style.cssText = `
              font-size: 10px;
              color: var(--text-muted);
              margin-right: 4px;
              flex-shrink: 0;
            `;
          }
          itemEl.appendChild(dot);
          
          const textSpan = document.createElement('span');
          textSpan.textContent = item.text;
          textSpan.style.cssText = `
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          `;
          itemEl.appendChild(textSpan);
          
          itemEl.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            findAndSelectText(item.raw, occurrenceIndex, item.startOffset);
          });
          
          listContainer.appendChild(itemEl);
        });
      };

      const removeTocPanel = () => {
        if (tocPanel) {
          if (tocPanel._observer) {
            tocPanel._observer.disconnect();
          }
          if (tocPanel._cleanupListeners) {
            tocPanel._cleanupListeners();
          }
          tocPanel.remove();
          tocPanel = null;
        }
        tocBtn.style.color = 'var(--text-muted)';
      };

      const showTocPanel = () => {
        if (tocPanel) return;
        
        tocPanel = document.createElement('div');
        tocPanel.id = 'md-toc-panel';
        tocPanel.style.cssText = `
          position: fixed;
          width: 260px;
          background: var(--panel-bg);
          border: 1px solid var(--panel-border);
          border-radius: 12px;
          box-shadow: var(--panel-shadow);
          z-index: 2147483648;
          font-family: system-ui, -apple-system, sans-serif;
          color: var(--text-main);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
        `;
        
        const tocHeader = document.createElement('div');
        tocHeader.style.cssText = `
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 14px;
          background: var(--header-bg);
          border-bottom: 1px solid var(--panel-border);
          font-size: 13px;
          font-weight: 600;
          user-select: none;
          flex-shrink: 0;
        `;
        tocHeader.innerHTML = `
          <span>文章目录</span>
          <button type="button" class="toc-close-btn" style="
            border: 0; background: transparent; color: var(--text-muted);
            font-size: 16px; line-height: 1; cursor: pointer; padding: 2px 6px;
            border-radius: 4px; display: flex; align-items: center; justify-content: center;
          ">×</button>
        `;
        
        const closeBtn = tocHeader.querySelector('.toc-close-btn');
        closeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          removeTocPanel();
        });
        closeBtn.addEventListener('mouseenter', () => {
          closeBtn.style.background = 'var(--btn-close-hover)';
          closeBtn.style.color = '#ef4444';
        });
        closeBtn.addEventListener('mouseleave', () => {
          closeBtn.style.background = 'transparent';
          closeBtn.style.color = 'var(--text-muted)';
        });
        
        const listContainer = document.createElement('div');
        listContainer.className = 'toc-list-container';
        listContainer.style.cssText = `
          padding: 8px 4px;
          overflow-y: auto;
          flex: 1;
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: var(--panel-border) transparent;
        `;
        
        tocPanel.appendChild(tocHeader);
        tocPanel.appendChild(listContainer);
        
        const rootLayer = (this.shadow && this.shadow.querySelector('.dev1-helper-root')) || document.body;
        rootLayer.appendChild(tocPanel);
        
        syncTocPanelPosition();
        
        const observer = new MutationObserver(() => {
          syncTocPanelPosition();
        });
        observer.observe(panel, { attributes: true, attributeFilter: ['style'] });
        tocPanel._observer = observer;
        
        const syncHandler = () => syncTocPanelPosition();
        window.addEventListener('resize', syncHandler);
        window.addEventListener('scroll', syncHandler, { passive: true });
        
        tocPanel._cleanupListeners = () => {
          window.removeEventListener('resize', syncHandler);
          window.removeEventListener('scroll', syncHandler);
        };
        
        renderTocList();
        tocBtn.style.color = 'var(--accent-color)';
      };

      const toggleTocPanel = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (tocPanel) {
          removeTocPanel();
        } else {
          showTocPanel();
        }
      };

      tocBtn.addEventListener('click', toggleTocPanel);
      articleArea.addEventListener('input', () => {
        if (tocPanel) renderTocList();
      });

      tab2Content.appendChild(articleLabel);
      tab2Content.appendChild(articleArea);

      const switchTab = (activeTab) => {
        if (activeTab === 1) {
          tab1.style.borderBottomColor = 'var(--accent-color)';
          tab1.style.color = 'var(--text-main)';
          tab2.style.borderBottomColor = 'transparent';
          tab2.style.color = 'var(--text-muted)';
          tab1Content.style.display = 'flex';
          tab2Content.style.display = 'none';
        } else {
          tab1.style.borderBottomColor = 'transparent';
          tab1.style.color = 'var(--text-muted)';
          tab2.style.borderBottomColor = 'var(--accent-color)';
          tab2.style.color = 'var(--text-main)';
          tab1Content.style.display = 'none';
          tab2Content.style.display = 'flex';
        }
      };

      tab1.addEventListener('click', () => {
        switchTab(1);
        removeTocPanel();
      });
      tab2.addEventListener('click', () => switchTab(2));

      const btnGroup = document.createElement('div');
      btnGroup.style.cssText = `display: flex; justify-content: flex-end; gap: 8px; margin-top: auto; flex-shrink: 0;`;

      const downloadBtn = document.createElement('button');
      downloadBtn.type = 'button';
      downloadBtn.className = 'md-btn md-btn-primary';
      downloadBtn.textContent = '导出';
      downloadBtn.style.cssText = `outline: none; flex: 0 0 calc((100% - 8px) / 2) !important; max-width: calc((100% - 8px) / 2) !important;`;

      btnGroup.appendChild(downloadBtn);

      body.appendChild(tab1Content);
      body.appendChild(tab2Content);
      body.appendChild(btnGroup);

      panel.appendChild(header);
      panel.appendChild(tabContainer);
      panel.appendChild(body);

      this._bindDrag(panel, header, { skipInteractive: true, useLeftTop: true });

      const closeBtn = header.querySelector('.md-settings-close');
      closeBtn.addEventListener('click', () => this._removeMdSettingsPanel());

      const helpBtn = header.querySelector('.md-settings-help');
      let helpPopover = null;
      let helpPopoverOutsideHandler = null;
      const closeHelpPopover = () => {
        if (helpPopoverOutsideHandler) {
          document.removeEventListener('click', helpPopoverOutsideHandler, true);
          helpPopoverOutsideHandler = null;
        }
        if (helpPopover) {
          helpPopover.remove();
          helpPopover = null;
        }
      };
      panel._closeHelpPopover = closeHelpPopover;
      const toggleHelpPopover = (event) => {
        event.stopPropagation();
        if (helpPopover) {
          closeHelpPopover();
          return;
        }
        helpPopover = document.createElement('div');
        helpPopover.className = 'md-help-popover';
        helpPopover.innerHTML = `
          <div>1. 可以拖动图片进入模板、笔记或正文输入框；有 http/https 链接的图片会保留链接，本地或临时图片会临时存储并在导出时转为 Base64。</div>
          <div style="margin-top:6px;">2. 如果处于「队列批量处理」，这里的改变会临时存储，跟随 URL；Tab 页关闭后对应临时存储会清除。</div>
          <div style="margin-top:6px;">3. <span style="color:#f59e0b;">每次打开本面板</span>都会重新获取一次「正文（提取结果）」并<span style="color:#f59e0b;">更新正文框</span>。</div>
        `;
        panel.appendChild(helpPopover);
        helpPopoverOutsideHandler = (outsideEvent) => {
          const path = typeof outsideEvent.composedPath === 'function' ? outsideEvent.composedPath() : [];
          if (path.includes(helpBtn) || path.includes(helpPopover)) return;
          closeHelpPopover();
        };
        setTimeout(() => {
          if (helpPopover && helpPopoverOutsideHandler) {
            document.addEventListener('click', helpPopoverOutsideHandler, true);
          }
        }, 0);
      };
      if (helpBtn) {
        helpBtn.addEventListener('click', toggleHelpPopover);
      }

      let isPinned = true;
      const pinBtn = header.querySelector('.md-settings-pin');
      const updatePinUI = () => {
        pinBtn.title = isPinned ? '取消置顶' : '置顶';
        const svg = pinBtn.querySelector('svg');
        if (svg) {
          svg.style.fill = isPinned ? 'currentColor' : 'none';
          svg.style.opacity = isPinned ? '1' : '0.6';
        }
      };
      pinBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isPinned = !isPinned;
        updatePinUI();
      });

      const outsideHandler = (e) => {
        if (isPinned) return;
        const target = (e.composedPath && e.composedPath()[0]) || e.target;
        if (!panel.contains(target) && (!anchor || !anchor.contains(target))) {
          this._removeMdSettingsPanel();
          document.removeEventListener('click', outsideHandler, true);
        }
      };
      setTimeout(() => document.addEventListener('click', outsideHandler, true), 0);

      const saveContent = async () => {
        try {
          if (scoped && tabId != null) {
            const activeUrl = this._getCurrentUrl();
            await scoped.setScoped(tabId, 'md_content', activeUrl, textarea.value);
            await scoped.setScoped(tabId, 'md_notes', activeUrl, notesArea.value);
            await scoped.setScoped(tabId, 'md_article', activeUrl, articleArea.value);
          }
        } catch(e) { console.error(e); }
      };

      const autoSave = () => {
        if (this._mdSaveTimer) clearTimeout(this._mdSaveTimer);
        this._mdSaveTimer = setTimeout(() => {
          saveContent().catch(console.error);
        }, 300);
      };
      textarea.addEventListener('input', autoSave);
      notesArea.addEventListener('input', autoSave);
      articleArea.addEventListener('input', autoSave);
      this._bindMarkdownImageDrop(textarea);
      this._bindMarkdownImageDrop(notesArea);
      this._bindMarkdownImageDrop(articleArea);
      this._bindMarkdownImagePaste(textarea);
      this._bindMarkdownImagePaste(notesArea);
      this._bindMarkdownImagePaste(articleArea);

      refreshTemplateBtn.addEventListener('click', async () => {
        setFieldRefreshState(refreshTemplateBtn, 'loading', refreshTemplateTitle);
        try {
          const response = await sendRuntimeMessage({ action: 'dev1SnapshotHelperGetArticleContent' }, 30000);
          const didRefresh = !!(response && response.success);
          const nextMetadata = didRefresh ? response.metadata : metadata;
          if (nextMetadata) metadata = nextMetadata;
          textarea.value = this._buildMarkdownDefaultTemplate(nextMetadata, this._getCurrentUrl());
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          await saveContent();
          setFieldRefreshState(refreshTemplateBtn, didRefresh ? 'success' : 'error', refreshTemplateTitle);
        } catch (e) {
          textarea.value = this._buildMarkdownDefaultTemplate(metadata, this._getCurrentUrl());
          textarea.dispatchEvent(new Event('input', { bubbles: true }));
          await saveContent();
          setFieldRefreshState(refreshTemplateBtn, 'error', refreshTemplateTitle);
        }
      });

      refreshArticleBtn.addEventListener('click', async () => {
        setFieldRefreshState(refreshArticleBtn, 'loading', refreshArticleTitle);
        try {
          const response = await sendRuntimeMessage({ action: 'dev1SnapshotHelperGetArticleContent' }, 30000);
          if (response && response.success) {
            articleArea.value = response.article || '';
            if (response.metadata) metadata = response.metadata;
            articleArea.dispatchEvent(new Event('input', { bubbles: true }));
            await saveContent();
            setFieldRefreshState(refreshArticleBtn, 'success', refreshArticleTitle);
          } else {
            setFieldRefreshState(refreshArticleBtn, 'error', refreshArticleTitle);
          }
        } catch (e) {
          setFieldRefreshState(refreshArticleBtn, 'error', refreshArticleTitle);
        }
      });

      downloadBtn.addEventListener('click', async () => {
        await saveContent();
        this._removeMdSettingsPanel();
        this._saveCurrentMd(anchor);
      });

      const onResizeOrScroll = () => {
        this._repositionMdSettingsPanel();
      };
      panel._resizeHandler = onResizeOrScroll;
      window.addEventListener('resize', onResizeOrScroll);
      window.addEventListener('scroll', onResizeOrScroll, { passive: true });

      const rootLayer = (this.shadow && this.shadow.querySelector('.dev1-helper-root')) || document.body;
      rootLayer.appendChild(panel);
    }

// =================================================================================
// V. SCREENSHOT PROCESSING & API EXPORT (截图处理与 API 导出)
// =================================================================================


    _processScreenshot(dataUrl, rect) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        ctx.drawImage(img,
          rect.left * dpr, rect.top * dpr, rect.width * dpr, rect.height * dpr,
          0, 0, rect.width * dpr, rect.height * dpr
        );

        this._showScreenshotResult(canvas.toDataURL('image/png'), 'area_screenshot');
      };
      img.src = dataUrl;
    }

    _showScreenshotResult(dataUrl, kind = 'area_screenshot') {
      // 使用缓存的主题或当前插件主题来决定对话框样式
      const useDarkStyle = this.darkModeEnabled;

      // Create floating dialog with image and buttons (Save, Copy, Cancel)
      const dialog = document.createElement('div');
      const dialogBg = useDarkStyle ? 'rgba(30, 30, 30, 0.85)' : 'rgba(240, 244, 248, 0.85)';
      const dialogColor = useDarkStyle ? '#f0f4f8' : '#1e293b';
      const dialogBorder = useDarkStyle ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)';
      dialog.style.cssText = `position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: ${dialogBg}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); color: ${dialogColor}; padding: 20px; border-radius: 16px; box-shadow: 0 30px 70px rgba(0,0,0,0.35); z-index: 2147483647; max-width: 95vw; max-height: 95vh; display: flex; flex-direction: column; gap: 16px; min-width: 320px; border: ${dialogBorder}; font-family: system-ui, -apple-system, sans-serif;`;

      const title = document.createElement('h3');
      title.textContent = (this.t && this.t('screenshot')) || 'Screenshot';
      title.style.cssText = `margin: 0; font-size: 18px; color: ${dialogColor};`;
      dialog.appendChild(title);

      // Create toolbar container
      const toolbar = document.createElement('div');
      toolbar.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        background: ${useDarkStyle ? 'rgba(20, 20, 20, 0.6)' : 'rgba(255, 255, 255, 0.6)'};
        border: 1px solid ${useDarkStyle ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
        margin-bottom: 4px;
      `;

      const row1 = document.createElement('div');
      row1.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
      `;

      const row2 = document.createElement('div');
      row2.style.cssText = `
        display: flex;
        gap: 6px;
        align-items: center;
        flex-wrap: wrap;
        width: 100%;
      `;

      const subToolbar = document.createElement('div');
      setImportantStyles(subToolbar, {
        'display': 'none',
        'gap': '8px',
        'align-items': 'center',
        'flex-wrap': 'wrap',
        'padding': '6px 10px',
        'border-radius': '8px',
        'background': useDarkStyle ? 'rgba(30, 30, 30, 0.5)' : 'rgba(245, 247, 250, 0.7)',
        'border': `1px dashed ${useDarkStyle ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        'margin-top': '6px',
        'width': '100%',
        'box-sizing': 'border-box'
      });

      toolbar.appendChild(row1);
      toolbar.appendChild(row2);
      toolbar.appendChild(subToolbar);

      let currentTool = 'pen'; // 'pen', 'line', 'shape', 'text', 'blur', 'crop'
      let currentSubTool = ''; // 'straight', 'dashed', 'arrow', 'double-arrow', 'rect', 'flat-rect', 'circle', 'triangle', 'star'
      let currentColor = '#ef4444'; // Red by default
      const history = []; // array of { width, height, imageData }
      const redoHistory = []; // array of { width, height, imageData } for Redo action
      let activeInput = null; // Reference to any active absolute text input overlay

      const lineSubTools = [
        { id: 'straight', label: this.config.lang === 'en' ? 'Solid' : '直线' },
        { id: 'dashed', label: this.config.lang === 'en' ? 'Dashed' : '虚线' },
        { id: 'arrow', label: this.config.lang === 'en' ? 'Arrow' : '箭头' },
        { id: 'double-arrow', label: this.config.lang === 'en' ? 'Double' : '双箭头' }
      ];

      const shapeSubTools = [
        { id: 'rect', label: this.config.lang === 'en' ? 'Hollow Rect' : '矩形' },
        { id: 'flat-rect', label: this.config.lang === 'en' ? 'Flat Rect' : '扁平化矩形' },
        { id: 'circle', label: this.config.lang === 'en' ? 'Circle' : '圆形' },
        { id: 'triangle', label: this.config.lang === 'en' ? 'Triangle' : '三角形' },
        { id: 'star', label: this.config.lang === 'en' ? 'Star' : '五角星' }
      ];

      const renderSubToolbar = () => {
        subToolbar.innerHTML = '';
        let activeSubTools = [];
        if (currentTool === 'line') {
          activeSubTools = lineSubTools;
          if (!lineSubTools.some(s => s.id === currentSubTool)) {
            currentSubTool = 'arrow';
          }
        } else if (currentTool === 'shape') {
          activeSubTools = shapeSubTools;
          if (!shapeSubTools.some(s => s.id === currentSubTool)) {
            currentSubTool = 'rect';
          }
        } else {
          subToolbar.style.setProperty('display', 'none', 'important');
          return;
        }

        subToolbar.style.setProperty('display', 'flex', 'important');

        activeSubTools.forEach(st => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = st.label;
          setImportantStyles(btn, {
            'appearance': 'none',
            '-webkit-appearance': 'none',
            'box-sizing': 'border-box',
            'display': 'inline-flex',
            'align-items': 'center',
            'justify-content': 'center',
            'padding': '4px 10px',
            'margin': '0',
            'border-radius': '4px',
            'border': `1px solid ${useDarkStyle ? '#555' : '#d1d5db'}`,
            'background': st.id === currentSubTool ? '#3b82f6' : (useDarkStyle ? '#333' : '#ffffff'),
            'color': st.id === currentSubTool ? '#ffffff' : (useDarkStyle ? '#e2e8f0' : '#4b5563'),
            'cursor': 'pointer',
            'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            'font-size': '12px',
            'font-weight': '500',
            'line-height': '1.2',
            'letter-spacing': '0',
            'text-indent': '0',
            'text-transform': 'none',
            'white-space': 'nowrap',
            'transition': 'all 0.1s ease',
            'outline': 'none',
            'min-height': '26px',
            'overflow': 'visible',
            'pointer-events': 'auto'
          });
          btn.onclick = () => {
            currentSubTool = st.id;
            renderSubToolbar();
          };
          subToolbar.appendChild(btn);
        });
      };

      const createGroup = () => {
        const grp = document.createElement('div');
        grp.style.cssText = 'display: flex; gap: 6px; align-items: center; flex-wrap: wrap;';
        return grp;
      };

      const createSeparator = () => {
        const sep = document.createElement('div');
        sep.style.cssText = `width: 1px; height: 18px; background: ${useDarkStyle ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}; margin: 0 4px;`;
        return sep;
      };

      // Group 1: Annotation Tools
      const toolsGroup = createGroup();
      const tools = [
        { id: 'pen', label: this.config.lang === 'en' ? '✏️ Pen' : '✏️ 画笔' },
        { id: 'line', label: this.config.lang === 'en' ? '📏 Line' : '📏 线段' },
        { id: 'shape', label: this.config.lang === 'en' ? '🎨 Shape' : '🎨 形状' },
        { id: 'text', label: this.config.lang === 'en' ? '🔤 Text' : '🔤 文字' },
        { id: 'blur', label: this.config.lang === 'en' ? '░ Mosaic' : '░ 马赛克' },
        { id: 'crop', label: this.config.lang === 'en' ? '✂️ Crop' : '✂️ 裁剪' }
      ];

      const toolButtons = {};
      tools.forEach(t => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = t.label;
        setImportantStyles(btn, {
          'appearance': 'none',
          '-webkit-appearance': 'none',
          'box-sizing': 'border-box',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '6px 12px',
          'margin': '0',
          'border-radius': '6px',
          'border': `1px solid ${useDarkStyle ? '#444' : '#cbd5e1'}`,
          'background': useDarkStyle ? '#2a2a2a' : '#ffffff',
          'color': useDarkStyle ? '#f0f4f8' : '#1e293b',
          'cursor': 'pointer',
          'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple Color Emoji', sans-serif",
          'font-size': '13px',
          'font-weight': '500',
          'line-height': '1.2',
          'letter-spacing': '0',
          'text-indent': '0',
          'text-transform': 'none',
          'white-space': 'nowrap',
          'transition': 'all 0.2s ease',
          'user-select': 'none',
          'outline': 'none',
          'min-height': '30px',
          'overflow': 'visible',
          'pointer-events': 'auto'
        });
        btn.onclick = () => {
          if (activeInput) {
            commitTextInput(activeInput, activeInput._canvasX, activeInput._canvasY);
          }
          currentTool = t.id;
          updateToolStyles();
        };
        toolsGroup.appendChild(btn);
        if (t.id === 'text') {
          toolsGroup.appendChild(createSeparator());
        }
        toolButtons[t.id] = btn;
      });
      row2.appendChild(toolsGroup);

      // Group 2: Action Tools (Reset, Undo, Redo - in Row 1 Right)
      const actionsGroup = createGroup();

      const createIconBtn = (svgHtml, titleText) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.innerHTML = svgHtml;
        btn.title = titleText;
        btn.setAttribute('aria-label', titleText);
        setImportantStyles(btn, {
          'appearance': 'none',
          '-webkit-appearance': 'none',
          'box-sizing': 'border-box',
          'background': 'transparent',
          'border': 'none',
          'cursor': 'pointer',
          'width': '28px',
          'height': '28px',
          'min-width': '28px',
          'min-height': '28px',
          'max-width': '28px',
          'max-height': '28px',
          'display': 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'transition': 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          'user-select': 'none',
          'outline': 'none',
          'border-radius': '6px',
          'color': useDarkStyle ? '#e2e8f0' : '#4b5563',
          'padding': '0',
          'margin': '0',
          'line-height': '1',
          'letter-spacing': '0',
          'text-indent': '0',
          'overflow': 'visible',
          'flex': '0 0 auto',
          'pointer-events': 'auto'
        });
        const svg = btn.querySelector('svg');
        if (svg) {
          setImportantStyles(svg, {
            'display': 'block',
            'width': '16px',
            'height': '16px',
            'min-width': '16px',
            'min-height': '16px',
            'overflow': 'visible',
            'fill': 'none',
            'stroke': 'currentColor',
            'flex': '0 0 auto',
            'pointer-events': 'none'
          });
        }
        
        btn.onmouseenter = () => {
          if (btn.style.pointerEvents !== 'none') {
            btn.style.setProperty('background', useDarkStyle ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', 'important');
            btn.style.setProperty('color', useDarkStyle ? '#ffffff' : '#111827', 'important');
            btn.style.setProperty('transform', 'scale(1.05)', 'important');
          }
        };
        btn.onmouseleave = () => {
          btn.style.setProperty('background', 'transparent', 'important');
          btn.style.setProperty('color', useDarkStyle ? '#e2e8f0' : '#4b5563', 'important');
          btn.style.setProperty('transform', 'scale(1)', 'important');
        };
        btn.onmousedown = () => {
          if (btn.style.pointerEvents !== 'none') {
            btn.style.setProperty('transform', 'scale(0.95)', 'important');
          }
        };
        btn.onmouseup = () => {
          if (btn.style.pointerEvents !== 'none') {
            btn.style.setProperty('transform', 'scale(1.05)', 'important');
          }
        };
        
        return btn;
      };

      const resetSvg = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"/>
          <path d="M21 3v5h-5"/>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"/>
          <path d="M3 21v-5h5"/>
        </svg>
      `;

      const undoSvg = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 7v6h6"/>
          <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>
        </svg>
      `;

      const redoSvg = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 7v6h-6"/>
          <path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3l3 2.7"/>
        </svg>
      `;

      const btnReset = createIconBtn(resetSvg, this.config.lang === 'en' ? 'Reset' : '重置');
      const btnUndo = createIconBtn(undoSvg, this.config.lang === 'en' ? 'Undo' : '撤销');
      const btnRedo = createIconBtn(redoSvg, this.config.lang === 'en' ? 'Redo' : '重做');

      const updateActionButtons = () => {
        if (history.length === 0) {
          btnReset.style.setProperty('opacity', '0.3', 'important');
          btnReset.style.setProperty('pointer-events', 'none', 'important');
          btnReset.style.setProperty('background', 'transparent', 'important');
          btnReset.style.setProperty('color', useDarkStyle ? '#e2e8f0' : '#4b5563', 'important');
          btnReset.style.setProperty('transform', 'scale(1)', 'important');

          btnUndo.style.setProperty('opacity', '0.3', 'important');
          btnUndo.style.setProperty('pointer-events', 'none', 'important');
          btnUndo.style.setProperty('background', 'transparent', 'important');
          btnUndo.style.setProperty('color', useDarkStyle ? '#e2e8f0' : '#4b5563', 'important');
          btnUndo.style.setProperty('transform', 'scale(1)', 'important');
        } else {
          btnReset.style.setProperty('opacity', '0.75', 'important');
          btnReset.style.setProperty('pointer-events', 'auto', 'important');

          btnUndo.style.setProperty('opacity', '0.75', 'important');
          btnUndo.style.setProperty('pointer-events', 'auto', 'important');
        }

        if (redoHistory.length === 0) {
          btnRedo.style.setProperty('opacity', '0.3', 'important');
          btnRedo.style.setProperty('pointer-events', 'none', 'important');
          btnRedo.style.setProperty('background', 'transparent', 'important');
          btnRedo.style.setProperty('color', useDarkStyle ? '#e2e8f0' : '#4b5563', 'important');
          btnRedo.style.setProperty('transform', 'scale(1)', 'important');
        } else {
          btnRedo.style.setProperty('opacity', '0.75', 'important');
          btnRedo.style.setProperty('pointer-events', 'auto', 'important');
        }
      };

      btnReset.onclick = () => {
        if (activeInput) {
          activeInput.remove();
          activeInput = null;
        }
        if (confirm(this.config.lang === 'en' ? 'Reset all edits to original?' : '确认重置所有编辑并恢复原图？')) {
          history.push({
            width: editorCanvas.width,
            height: editorCanvas.height,
            imageData: editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height)
          });
          redoHistory.length = 0;
          editorCanvas.width = img.naturalWidth;
          editorCanvas.height = img.naturalHeight;
          editorCanvas.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
          editorCtx.drawImage(img, 0, 0);
          updateActionButtons();
        }
      };

      btnUndo.onclick = () => {
        if (activeInput) {
          activeInput.remove();
          activeInput = null;
        }
        if (history.length > 0) {
          redoHistory.push({
            width: editorCanvas.width,
            height: editorCanvas.height,
            imageData: editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height)
          });
          const prev = history.pop();
          editorCanvas.width = prev.width;
          editorCanvas.height = prev.height;
          editorCanvas.style.aspectRatio = `${prev.width} / ${prev.height}`;
          editorCtx.putImageData(prev.imageData, 0, 0);
          updateActionButtons();
        }
      };

      btnRedo.onclick = () => {
        if (activeInput) {
          activeInput.remove();
          activeInput = null;
        }
        if (redoHistory.length > 0) {
          history.push({
            width: editorCanvas.width,
            height: editorCanvas.height,
            imageData: editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height)
          });
          const next = redoHistory.pop();
          editorCanvas.width = next.width;
          editorCanvas.height = next.height;
          editorCanvas.style.aspectRatio = `${next.width} / ${next.height}`;
          editorCtx.putImageData(next.imageData, 0, 0);
          updateActionButtons();
        }
      };

      actionsGroup.appendChild(btnReset);
      actionsGroup.appendChild(createSeparator());
      actionsGroup.appendChild(btnUndo);
      actionsGroup.appendChild(btnRedo);
      row1.appendChild(actionsGroup);

      // Group 3: Color Palette (in Row 1 Left)
      const colorsContainer = document.createElement('div');
      colorsContainer.style.cssText = `
        display: flex;
        gap: 6px;
        align-items: center;
      `;

      const presetColors = [
        { hex: '#ef4444' }, // Red
        { hex: '#f97316' }, // Orange
        { hex: '#eab308' }, // Yellow
        { hex: '#22c55e' }, // Green
        { hex: '#3b82f6' }, // Blue
        { hex: '#a855f7' }, // Purple
        { hex: '#ffffff' }, // White
        { hex: '#000000' }  // Black
      ];

      const colorOptions = [];
      presetColors.forEach(c => {
        const opt = document.createElement('div');
        opt.style.cssText = `
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: ${c.hex};
          cursor: pointer;
          border: 2px solid ${c.hex === currentColor ? (useDarkStyle ? '#fff' : '#000') : 'transparent'};
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
          transition: transform 0.1s ease;
        `;
        opt.onclick = () => {
          currentColor = c.hex;
          updateColorStyles();
          if (activeInput) {
            activeInput.style.color = currentColor;
            activeInput.style.borderColor = currentColor;
          }
        };
        colorsContainer.appendChild(opt);
        colorOptions.push({ hex: c.hex, el: opt });
      });

      const updateColorStyles = () => {
        colorOptions.forEach(opt => {
          if (opt.hex === currentColor) {
            opt.el.style.border = `2px solid ${useDarkStyle ? '#fff' : '#000'}`;
            opt.el.style.transform = 'scale(1.1)';
          } else {
            opt.el.style.border = '2px solid transparent';
            opt.el.style.transform = 'scale(1)';
          }
        });
      };

      const updateToolStyles = () => {
        Object.keys(toolButtons).forEach(id => {
          const btn = toolButtons[id];
          if (id === currentTool) {
            btn.style.setProperty('background', '#3b82f6', 'important');
            btn.style.setProperty('color', '#ffffff', 'important');
            btn.style.setProperty('border-color', '#3b82f6', 'important');
          } else {
            btn.style.setProperty('background', useDarkStyle ? '#2a2a2a' : '#ffffff', 'important');
            btn.style.setProperty('color', useDarkStyle ? '#f0f4f8' : '#1e293b', 'important');
            btn.style.setProperty('border-color', useDarkStyle ? '#444' : '#cbd5e1', 'important');
          }
        });

        if (currentTool === 'blur' || currentTool === 'crop') {
          colorsContainer.style.setProperty('visibility', 'hidden', 'important');
        } else {
          colorsContainer.style.setProperty('visibility', 'visible', 'important');
        }

        renderSubToolbar();
      };

      row1.insertBefore(colorsContainer, actionsGroup);

      const imgContainer = document.createElement('div');
      imgContainer.style.cssText = 'overflow: auto; max-height: 60vh; border: 1px solid ' + (useDarkStyle ? '#3b3b3b' : '#eee') + '; border-radius: 8px; background: ' + (useDarkStyle ? '#121212' : '#ffffff') + '; background-image: ' + (useDarkStyle ? 'repeating-conic-gradient(#1a1a1a 0% 25%, #121212 0% 50%)' : 'repeating-conic-gradient(#f9f9f9 0% 25%, #ffffff 0% 50%)') + '; background-size: 20px 20px; display: flex; justify-content: center; align-items: flex-start; position: relative; padding: 4px;';

      const editorCanvas = document.createElement('canvas');
      editorCanvas.style.cssText = `
        display: block;
        max-width: 100%;
        height: auto;
        touch-action: none;
        user-select: none;
        cursor: crosshair;
      `;
      const editorCtx = editorCanvas.getContext('2d', { willReadFrequently: true });
      imgContainer.appendChild(editorCanvas);

      const img = new Image();
      img.onload = () => {
        editorCanvas.width = img.naturalWidth;
        editorCanvas.height = img.naturalHeight;
        editorCanvas.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
        editorCtx.drawImage(img, 0, 0);
        updateToolStyles();
        updateColorStyles();
        updateActionButtons();
        setupCanvasEvents();
      };
      img.src = dataUrl;

      const commitTextInput = (inputEl, canvasX, canvasY) => {
        const val = inputEl.value.trim();
        if (val) {
          if (history.length >= 30) history.shift();
          history.push({
            width: editorCanvas.width,
            height: editorCanvas.height,
            imageData: editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height)
          });
          redoHistory.length = 0;

          const canvasFontSize = Math.max(16, Math.round(editorCanvas.width / 40));
          editorCtx.font = `bold ${canvasFontSize}px system-ui, -apple-system, sans-serif`;
          editorCtx.fillStyle = currentColor;
          editorCtx.textBaseline = 'top';
          editorCtx.fillText(val, canvasX, canvasY);
          updateActionButtons();
        }
        inputEl.remove();
        if (activeInput === inputEl) activeInput = null;
      };

      const setupCanvasEvents = () => {
        let isDrawing = false;
        let startX = 0;
        let startY = 0;
        let tempImageData = null;

        const getCanvasCoords = (e) => {
          const rect = editorCanvas.getBoundingClientRect();
          const x = (e.clientX - rect.left) * (editorCanvas.width / rect.width);
          const y = (e.clientY - rect.top) * (editorCanvas.height / rect.height);
          return { x, y };
        };

        const onPointerDown = (e) => {
          e.preventDefault();
          e.stopPropagation();

          if (currentTool === 'text') {
            if (activeInput) {
              const inputEl = activeInput;
              commitTextInput(inputEl, inputEl._canvasX, inputEl._canvasY);
            }

            const coords = getCanvasCoords(e);
            const rect = editorCanvas.getBoundingClientRect();
            const containerRect = imgContainer.getBoundingClientRect();

            const left = e.clientX - containerRect.left;
            const top = e.clientY - containerRect.top;

            const input = document.createElement('input');
            input.type = 'text';
            input.placeholder = this.config.lang === 'en' ? 'Type...' : '输入文字...';

            const layoutFontSize = Math.max(14, Math.min(24, Math.round(rect.width / 40)));
            input.style.cssText = `
              position: absolute;
              left: ${left}px;
              top: ${top}px;
              background: ${useDarkStyle ? '#1e1e1e' : '#ffffff'};
              border: 1.5px dashed ${currentColor};
              color: ${currentColor};
              font: bold ${layoutFontSize}px system-ui, -apple-system, sans-serif;
              padding: 4px 6px;
              outline: none;
              border-radius: 4px;
              z-index: 2147483647;
              min-width: 100px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            `;

            input._canvasX = coords.x;
            input._canvasY = coords.y;

            input.onkeydown = (ev) => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                commitTextInput(input, input._canvasX, input._canvasY);
              } else if (ev.key === 'Escape') {
                ev.preventDefault();
                input.remove();
                if (activeInput === input) activeInput = null;
              }
            };

            input.onblur = () => {
              setTimeout(() => {
                if (document.body.contains(input)) {
                  commitTextInput(input, input._canvasX, input._canvasY);
                }
              }, 120);
            };

            imgContainer.appendChild(input);
            activeInput = input;
            setTimeout(() => input.focus(), 50);
            return;
          }

          if (activeInput) {
            const inputEl = activeInput;
            commitTextInput(inputEl, inputEl._canvasX, inputEl._canvasY);
          }

          isDrawing = true;

          if (history.length >= 30) history.shift();
          history.push({
            width: editorCanvas.width,
            height: editorCanvas.height,
            imageData: editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height)
          });
          redoHistory.length = 0;
          updateActionButtons();

          const coords = getCanvasCoords(e);
          startX = coords.x;
          startY = coords.y;

          tempImageData = editorCtx.getImageData(0, 0, editorCanvas.width, editorCanvas.height);

          if (currentTool === 'pen') {
            editorCtx.beginPath();
            editorCtx.moveTo(startX, startY);
          }
        };

        const onPointerMove = (e) => {
          if (currentTool === 'text') return;
          if (!isDrawing) return;
          e.preventDefault();
          e.stopPropagation();

          const coords = getCanvasCoords(e);
          const curX = coords.x;
          const curY = coords.y;

          const baseWidth = Math.max(3, Math.round(editorCanvas.width / 400));
          editorCtx.strokeStyle = currentColor;
          editorCtx.fillStyle = currentColor;
          editorCtx.lineCap = 'round';
          editorCtx.lineJoin = 'round';

          if (currentTool === 'pen') {
            editorCtx.lineWidth = baseWidth;
            editorCtx.lineTo(curX, curY);
            editorCtx.stroke();
          } else if (currentTool === 'shape') {
            editorCtx.putImageData(tempImageData, 0, 0);
            editorCtx.lineWidth = baseWidth;
            
            if (currentSubTool === 'rect') {
              editorCtx.strokeRect(startX, startY, curX - startX, curY - startY);
            } else if (currentSubTool === 'flat-rect') {
              const x = Math.min(startX, curX);
              const y = Math.min(startY, curY);
              const w = Math.abs(curX - startX);
              const h = Math.abs(curY - startY);
              const bevelSize = Math.min(12, w * 0.15, h * 0.15);
              if (w > 0 && h > 0) {
                editorCtx.beginPath();
                editorCtx.moveTo(x + bevelSize, y);
                editorCtx.lineTo(x + w - bevelSize, y);
                editorCtx.lineTo(x + w, y + bevelSize);
                editorCtx.lineTo(x + w, y + h - bevelSize);
                editorCtx.lineTo(x + w - bevelSize, y + h);
                editorCtx.lineTo(x + bevelSize, y + h);
                editorCtx.lineTo(x, y + h - bevelSize);
                editorCtx.lineTo(x, y + bevelSize);
                editorCtx.closePath();
                editorCtx.stroke();
              }
            } else if (currentSubTool === 'circle') {
              const rx = Math.abs(curX - startX) / 2;
              const ry = Math.abs(curY - startY) / 2;
              const cx = startX + (curX - startX) / 2;
              const cy = startY + (curY - startY) / 2;
              if (rx > 0 && ry > 0) {
                editorCtx.beginPath();
                editorCtx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
                editorCtx.stroke();
              }
            } else if (currentSubTool === 'triangle') {
              editorCtx.beginPath();
              editorCtx.moveTo(startX + (curX - startX) / 2, startY);
              editorCtx.lineTo(startX, curY);
              editorCtx.lineTo(curX, curY);
              editorCtx.closePath();
              editorCtx.stroke();
            } else if (currentSubTool === 'star') {
              const cx = startX + (curX - startX) / 2;
              const cy = startY + (curY - startY) / 2;
              const rOuter = Math.min(Math.abs(curX - startX), Math.abs(curY - startY)) / 2;
              const rInner = rOuter * 0.4;
              if (rOuter > 2) {
                editorCtx.beginPath();
                let angle = Math.PI / 2 * 3;
                const step = Math.PI / 5;
                editorCtx.moveTo(cx + rOuter * Math.cos(angle), cy + rOuter * Math.sin(angle));
                for (let i = 0; i < 5; i++) {
                  angle += step;
                  editorCtx.lineTo(cx + rInner * Math.cos(angle), cy + rInner * Math.sin(angle));
                  angle += step;
                  editorCtx.lineTo(cx + rOuter * Math.cos(angle), cy + rOuter * Math.sin(angle));
                }
                editorCtx.closePath();
                editorCtx.stroke();
              }
            }
          } else if (currentTool === 'line') {
            editorCtx.putImageData(tempImageData, 0, 0);
            
            if (currentSubTool === 'straight') {
              editorCtx.lineWidth = baseWidth;
              editorCtx.beginPath();
              editorCtx.moveTo(startX, startY);
              editorCtx.lineTo(curX, curY);
              editorCtx.stroke();
            } else if (currentSubTool === 'dashed') {
              editorCtx.lineWidth = baseWidth;
              editorCtx.save();
              editorCtx.setLineDash([baseWidth * 3, baseWidth * 3]);
              editorCtx.beginPath();
              editorCtx.moveTo(startX, startY);
              editorCtx.lineTo(curX, curY);
              editorCtx.stroke();
              editorCtx.restore();
            } else if (currentSubTool === 'arrow') {
              editorCtx.lineWidth = baseWidth * 1.6;
              const angle = Math.atan2(curY - startY, curX - startX);
              const headLength = Math.max(18, Math.round(editorCanvas.width / 60));
              
              editorCtx.beginPath();
              editorCtx.moveTo(curX, curY);
              editorCtx.lineTo(curX - headLength * Math.cos(angle - Math.PI / 6), curY - headLength * Math.sin(angle - Math.PI / 6));
              editorCtx.lineTo(curX - headLength * Math.cos(angle + Math.PI / 6), curY - headLength * Math.sin(angle + Math.PI / 6));
              editorCtx.closePath();
              editorCtx.fill();
              
              editorCtx.beginPath();
              editorCtx.moveTo(startX, startY);
              editorCtx.lineTo(curX - (headLength / 2) * Math.cos(angle), curY - (headLength / 2) * Math.sin(angle));
              editorCtx.stroke();
            } else if (currentSubTool === 'double-arrow') {
              editorCtx.lineWidth = baseWidth * 1.6;
              const angle = Math.atan2(curY - startY, curX - startX);
              const headLength = Math.max(18, Math.round(editorCanvas.width / 60));
              
              editorCtx.beginPath();
              editorCtx.moveTo(curX, curY);
              editorCtx.lineTo(curX - headLength * Math.cos(angle - Math.PI / 6), curY - headLength * Math.sin(angle - Math.PI / 6));
              editorCtx.lineTo(curX - headLength * Math.cos(angle + Math.PI / 6), curY - headLength * Math.sin(angle + Math.PI / 6));
              editorCtx.closePath();
              editorCtx.fill();

              editorCtx.beginPath();
              editorCtx.moveTo(startX, startY);
              editorCtx.lineTo(startX + headLength * Math.cos(angle - Math.PI / 6), startY + headLength * Math.sin(angle - Math.PI / 6));
              editorCtx.lineTo(startX + headLength * Math.cos(angle + Math.PI / 6), startY + headLength * Math.sin(angle + Math.PI / 6));
              editorCtx.closePath();
              editorCtx.fill();
              
              editorCtx.beginPath();
              editorCtx.moveTo(startX + (headLength / 2) * Math.cos(angle), startY + (headLength / 2) * Math.sin(angle));
              editorCtx.lineTo(curX - (headLength / 2) * Math.cos(angle), curY - (headLength / 2) * Math.sin(angle));
              editorCtx.stroke();
            }
          } else if (currentTool === 'blur') {
            editorCtx.putImageData(tempImageData, 0, 0);
            editorCtx.save();
            editorCtx.strokeStyle = '#888';
            editorCtx.lineWidth = 1;
            editorCtx.setLineDash([6, 6]);
            editorCtx.strokeRect(startX, startY, curX - startX, curY - startY);
            editorCtx.restore();
          } else if (currentTool === 'crop') {
            editorCtx.putImageData(tempImageData, 0, 0);
            editorCtx.save();
            editorCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            
            const x = Math.min(startX, curX);
            const y = Math.min(startY, curY);
            const w = Math.abs(curX - startX);
            const h = Math.abs(curY - startY);
            
            editorCtx.fillRect(0, 0, editorCanvas.width, y);
            editorCtx.fillRect(0, y + h, editorCanvas.width, editorCanvas.height - (y + h));
            editorCtx.fillRect(0, y, x, h);
            editorCtx.fillRect(x + w, y, editorCanvas.width - (x + w), h);
            
            editorCtx.strokeStyle = '#fff';
            editorCtx.lineWidth = 1.5;
            editorCtx.setLineDash([5, 5]);
            editorCtx.strokeRect(x, y, w, h);
            editorCtx.restore();
          }
        };

        const onPointerUp = (e) => {
          if (currentTool === 'text') return;
          if (!isDrawing) return;
          e.preventDefault();
          e.stopPropagation();
          isDrawing = false;

          const coords = getCanvasCoords(e);
          const curX = coords.x;
          const curY = coords.y;

          if (currentTool === 'blur') {
            editorCtx.putImageData(tempImageData, 0, 0);
            const x = Math.min(startX, curX);
            const y = Math.min(startY, curY);
            const w = Math.abs(curX - startX);
            const h = Math.abs(curY - startY);

            if (w > 2 && h > 2) {
              const size = Math.max(8, Math.round(editorCanvas.width / 150));
              const temp = document.createElement('canvas');
              temp.width = Math.max(1, Math.round(w / size));
              temp.height = Math.max(1, Math.round(h / size));
              const tempCtx = temp.getContext('2d');
              tempCtx.imageSmoothingEnabled = false;
              tempCtx.drawImage(editorCanvas, x, y, w, h, 0, 0, temp.width, temp.height);
              
              editorCtx.imageSmoothingEnabled = false;
              editorCtx.drawImage(temp, 0, 0, temp.width, temp.height, x, y, w, h);
              editorCtx.imageSmoothingEnabled = true;
            }
          } else if (currentTool === 'crop') {
            editorCtx.putImageData(tempImageData, 0, 0);
            const x = Math.max(0, Math.min(startX, curX));
            const y = Math.max(0, Math.min(startY, curY));
            const w = Math.min(editorCanvas.width - x, Math.abs(curX - startX));
            const h = Math.min(editorCanvas.height - y, Math.abs(curY - startY));

            if (w > 10 && h > 10) {
              const croppedData = editorCtx.getImageData(x, y, w, h);
              editorCanvas.width = w;
              editorCanvas.height = h;
              editorCanvas.style.aspectRatio = `${w} / ${h}`;
              editorCtx.putImageData(croppedData, 0, 0);
            } else {
              history.pop();
              updateActionButtons();
            }
          }
        };

        editorCanvas.addEventListener('pointerdown', onPointerDown);
        editorCanvas.addEventListener('pointermove', onPointerMove);
        editorCanvas.addEventListener('pointerup', onPointerUp);
      };

      const actions = document.createElement('div');
      actions.style.cssText = 'display: flex; gap: 12px; justify-content: flex-end;';

      const createBtn = (text, onClick, primary = false) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = text;
        const bg = primary ? '#3b82f6' : (useDarkStyle ? '#374151' : 'white');
        const color = primary ? 'white' : (useDarkStyle ? '#e2e8f0' : '#475569');
        const border = primary ? '#3b82f6' : (useDarkStyle ? '#4b5563' : '#e2e8f0');

        setImportantStyles(btn, {
          'appearance': 'none',
          '-webkit-appearance': 'none',
          'box-sizing': 'border-box',
          'display': 'inline-flex',
          'align-items': 'center',
          'justify-content': 'center',
          'padding': '8px 16px',
          'margin': '0',
          'border-radius': '6px',
          'border': `1px solid ${border}`,
          'background': bg,
          'color': color,
          'cursor': 'pointer',
          'font-family': "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          'font-size': '14px',
          'font-weight': '500',
          'line-height': '1.2',
          'letter-spacing': '0',
          'text-indent': '0',
          'text-transform': 'none',
          'white-space': 'nowrap',
          'min-height': '34px',
          'overflow': 'visible',
          'pointer-events': 'auto'
        });
        btn.onclick = onClick;
        return btn;
      };

      const cleanup = () => {
        dialog.remove();
        if (activeInput) {
          activeInput.remove();
          activeInput = null;
        }
        document.removeEventListener('keydown', onKey);
      };

      actions.appendChild(createBtn((this.t && this.t('screenshot_cancel')) || 'Cancel', cleanup));

      actions.appendChild(createBtn((this.t && this.t('screenshot_copy')) || 'Copy', async () => {
        try {
          if (activeInput) {
            commitTextInput(activeInput, activeInput._canvasX, activeInput._canvasY);
          }
          const blob = await (await fetch(editorCanvas.toDataURL('image/png'))).blob();
          await navigator.clipboard.write([
            new ClipboardItem({
              [blob.type]: blob
            })
          ]);
          const feedback = document.createElement('div');
          feedback.textContent = (this.t && this.t('feedback_copied')) || 'Copied!';
          feedback.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.8); color: white; padding: 10px 20px; border-radius: 6px; z-index: 2147483648; pointer-events: none;';
          document.body.appendChild(feedback);
          setTimeout(() => document.body.removeChild(feedback), 1500);
        } catch (err) {
          console.error(err);
          alert((this.t && this.t('feedback_error_copy')) || 'Copy failed');
        }
      }));

      actions.appendChild(createBtn((this.t && this.t('save_and_clear_cache')) || '保存并删除缓存', async () => {
        try {
          if (activeInput) {
            commitTextInput(activeInput, activeInput._canvasX, activeInput._canvasY);
          }
          const blob = await (await fetch(editorCanvas.toDataURL('image/png'))).blob();
          await this._saveBlob(blob, kind, 'png', 'image/png');
          setTimeout(cleanup, 500);
        } catch (error) {
          alert(((this.t && this.t('screenshot_failed')) || 'Screenshot failed') + ': ' + (error.message || error));
        }
      }, true));

      dialog.appendChild(toolbar);
      dialog.appendChild(imgContainer);
      dialog.appendChild(actions);
      document.body.appendChild(dialog);

      const onKey = (e) => {
        if (e.key === 'Escape') {
          cleanup();
        }
      };
      document.addEventListener('keydown', onKey);

      dialog.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        cleanup();
      });
    }
    }


    const helper = new Dev1SnapshotHelper();
    window[API_KEY] = {
      loaded: true,
      show: (config) => helper.show(config),
      openPanel: (config) => helper.openPanel(config),
      hide: () => helper.hidePanel(),
      destroy: () => helper.destroy(),
      isVisible: () => helper.isVisible()
    };
})();

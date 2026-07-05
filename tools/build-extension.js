const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'Bookmark-Backup-main');
const manifestPath = path.join(srcDir, 'manifest.json');

function readManifestVersion() {
    try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const version = String(manifest.version || '').trim();
        if (!/^\d+(?:\.\d+){1,3}$/.test(version)) {
            throw new Error(`无效的 manifest version: ${version || '(empty)'}`);
        }
        return version;
    } catch (err) {
        console.error(`读取 manifest 版本失败: ${manifestPath}`);
        console.error(err.message);
        process.exit(1);
    }
}

const version = readManifestVersion();
const distDir = path.join(rootDir, `dist_v${version}`);
const zipFile = path.join(rootDir, `Bookmark-Backup-main_v${version}.zip`);

console.log('===================================================');
console.log(`开始打包构建 Bookmark Backup Chrome 扩展程序 v${version}...`);
console.log('===================================================');

if (!fs.existsSync(srcDir)) {
    console.error(`源码目录不存在: ${srcDir}`);
    process.exit(1);
}

// 清理已有的打包输出。只清理构建产物，不改动 Bookmark-Backup-main。
if (fs.existsSync(distDir)) {
    console.log(`正在清理现有的 ${path.basename(distDir)} 目录...`);
    fs.rmSync(distDir, { recursive: true, force: true });
}
if (fs.existsSync(zipFile)) {
    console.log(`正在清理旧的 ${path.basename(zipFile)} 压缩包...`);
    fs.unlinkSync(zipFile);
}

fs.mkdirSync(distDir, { recursive: true });

function processDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.name.startsWith('.') || entry.name === '.DS_Store') continue;

        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            processDirectory(srcPath, destPath);
            continue;
        }

        const ext = path.extname(entry.name).toLowerCase();
        const isMinified = entry.name.includes('.min.')
            || srcPath.includes(path.sep + 'vendor' + path.sep)
            || srcPath.includes(path.sep + 'vendor_reference' + path.sep);

        // 只处理 Bookmark-Backup-main 内未压缩的自定义 JS/CSS：
        // 删除空白/注释，但不启用标识符改名，避免影响跨文件全局调用。
        if ((ext === '.js' || ext === '.css') && !isMinified) {
            const relativePath = path.relative(srcDir, srcPath);
            console.log(`压缩空白: ${relativePath}`);
            try {
                execSync(`npx -y esbuild "${srcPath}" --minify-whitespace --outfile="${destPath}"`, { stdio: 'ignore' });
            } catch (err) {
                console.warn(`esbuild 处理文件 ${entry.name} 失败，将直接复制原文件。`, err.message);
                fs.copyFileSync(srcPath, destPath);
            }
            continue;
        }

        // README.md、manifest.json、HTML、图片、字体、已压缩库等资源直接复制。
        fs.copyFileSync(srcPath, destPath);
    }
}

console.log(`正在处理 Bookmark-Backup-main 并输出到 ${path.basename(distDir)}...`);
processDirectory(srcDir, distDir);
console.log('所有文件处理完成。');

console.log(`正在打包为 ${path.basename(zipFile)}...`);
try {
    execSync(`zip -r "${zipFile}" .`, { cwd: distDir, stdio: 'ignore' });
    console.log('===================================================');
    console.log('打包成功！');
    console.log(`发布包位置: ${zipFile}`);
    console.log('===================================================');
} catch (err) {
    console.error('压缩 Zip 文件失败:', err.message);
    process.exit(1);
}

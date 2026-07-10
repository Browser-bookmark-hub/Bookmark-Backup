## Switch to [English](#english)

[![Linux.do](https://img.shields.io/badge/Linux.do-Portfolio-FFD700?logo=discourse&logoColor=white)](https://linux.do/u/kk1/activity/portfolio)
[![GitHub Releases](https://img.shields.io/github/v/release/Browser-bookmark-hub/Bookmark-Backup?logo=github&logoColor=white&label=GitHub+Releases)](https://github.com/Browser-bookmark-hub/Bookmark-Backup/releases)
[![Microsoft Edge Add-ons](https://img.shields.io/badge/Edge_Add--ons-Available-0078D7?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/%E4%B9%A6%E7%AD%BE%E5%A4%87%E4%BB%BDbookmark-backup/klopopehpngheikchkjgkmplgmbfodek)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/dbdpgedioldmeooemjanbjlhgpocafbc?color=0F9D58&logo=googlechrome&logoColor=white&label=Chrome+Web+Store)](https://chromewebstore.google.com/detail/dbdpgedioldmeooemjanbjlhgpocafbc)

### 简介

`书签备份` 是一款面向 Chrome / Edge 的 Git 式书签版本管理、备份历史追踪与安全恢复扩展。

它把浏览器书签当作可持续留痕的版本资产：每次备份会形成带时间、指纹和快照数据的版本记录，既能保存完整书签树，也能记录当前变化与历史差异。你可以将这些版本同步到本地、WebDAV 或 GitHub 仓库，并在需要时按历史节点恢复、撤销或合并导入。

它也是 [书签画布（Bookmark-Canvas）](https://github.com/Browser-bookmark-hub/Bookmark-Canvas) 生态的关联项目，导出的 JSON 文件兼容书签画布导入的标签与备注格式。

### 路线图

- [ ] **语言增加与调试**：当前界面主要围绕简体中文与英文实现；繁体中文、法语、俄语、西班牙语、阿拉伯语、日语、韩语等语言需要补齐文案并逐页调试布局。详见 [`docs/LIMITATIONS_AND_COMPROMISES.md`](docs/LIMITATIONS_AND_COMPROMISES.md)。
- [ ] **生态数据处理工具**：探索围绕备份、历史与网页快照导出数据的 CLI，用于校验、整理、转换及与书签画布互操作。不同于“书签记录与推荐”对独立客户端的探索，本项目优先考虑轻量、可组合的命令行工具。

### 相关文档

- [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md)：当前项目结构与主要模块说明。
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md)：完整版本更新记录。
- [`docs/LIMITATIONS_AND_COMPROMISES.md`](docs/LIMITATIONS_AND_COMPROMISES.md)：浏览器限制、功能妥协与兼容性说明。
- [`docs/归档/00--归档索引-请先读.md`](docs/%E5%BD%92%E6%A1%A3/00--%E5%BD%92%E6%A1%A3%E7%B4%A2%E5%BC%95-%E8%AF%B7%E5%85%88%E8%AF%BB.md)：历史计划、审计与设计文档索引。

### 更新日志

> [!NOTE]
> #### v3.6.0
> - **本地备份静默升级**：迁移到 Chrome 推荐的 `downloads.ui` / `chrome.downloads.setUiOptions()` 下载 UI 接口，并在下载完成、失败或后台恢复后主动还原界面。
> - **高亮工具与 Markdown 优化**：改进辅助面板中的高亮工具、Markdown 格式处理和刷新逻辑；Markdown 正文目录定位更稳定。
> - **界面与可维护性整理**：设置改为自动保存，修复辅助工具按钮跨页面兼容性；重组核心 JavaScript 注释与分区，清理拆分遗留的无用脚本，方便 AI 与开发者索引代码。
>
> 详见完整的 [`v3.6.0 更新日志`](docs/CHANGELOG.md)。

### 主要视图

- **主界面**：配置本地、WebDAV、GitHub 仓库备份目标，查看书签统计、备份状态和快捷入口。
- **当前变化**：查看当前书签树相对备份基线的数量、结构和内容变化。
- **备份历史**：按时间线查看备份记录、备注、可恢复能力、导出与搜索。
- **恢复与安全快照**：从历史记录或安全快照执行恢复、撤销、合并导入等高风险操作。
- **网页快照**：将网页深度存档为 MHTML / Markdown (MD) 格式，支持划线高亮标记，并提供截图/录屏等辅助留存能力。

### 预览

#### 截图预览

| 主界面 | 设置与初始化 |
| :---: | :---: |
| <img src="../Screenshots%20and%20icons/v3.0/主UI%20zh.png" width="400"> | <img src="../Screenshots%20and%20icons/v3.0/设置与初始化%20zh.png" width="400"> |
| **当前变化** | **备份历史** |
| <img src="../Screenshots%20and%20icons/v3.0/当前变化html%20zh.png" width="400"> | <img src="../Screenshots%20and%20icons/v3.0/备份历史html%20zh.png" width="400"> |
| **网页存档** | **高亮工具** |
| <img src="../Screenshots%20and%20icons/v3.5/网页存档zh.png" width="400"> | <img src="../Screenshots%20and%20icons/v3.5/高亮工具zh.png" width="400"> |

#### 项目结构预览

```text
Bookmark-Backup-main/
|-- manifest.json                     [CORE] Manifest V3 配置、权限、后台入口与快捷键。
|-- background.js                     [CORE] 备份、恢复、历史、迁移、缓存、角标和消息中枢。
|-- popup.html / popup.js             [UI] 主弹窗：备份目标配置、状态、历史入口、初始化和设置。
|-- history_html/                     [UI] 备份历史、当前变化、书签树、搜索、恢复与安全快照页面。
|-- backup_reminder/                  [UI] 手动备份提醒窗口、提醒设置、通知生命周期与计时器。
|-- auto_backup_timer/                [CORE] 自动备份定时与相关设置存储。
|-- dev_1/                            [TOOLS] 网页快照、MHTML/MD、截图、录屏和队列辅助能力。
|-- github/                           [SYNC] GitHub 仓库备份目标的 API 封装。
|-- _locales/                         [I18N] 中英文扩展名称、描述和工具栏标题。
|-- docs/                             [DOC] 项目结构、变更日志、限制与历史归档。
\-- LICENSE                           [DOC] 开源许可。
```

### 特色功能

- **多目标备份**：支持本地下载、WebDAV 云端和 GitHub 仓库备份，适合不同的数据保存习惯。
- **Git 式版本管理**：以时间、指纹和快照记录书签版本，围绕“当前变化—备份历史—安全恢复”形成可回溯时间线。
- **自动/手动备份**：可在书签变化后自动备份，也可以手动触发备份并配合提醒系统使用。
- **当前变化视图**：按数量、结构和内容变化查看当前书签与上次备份之间的差异。
- **备份历史时间线**：记录备份历史、备注、数据能力和可恢复状态，方便回溯与导出。
- **安全恢复体系**：支持覆盖恢复、补丁式恢复/撤销、合并导入，并在高风险操作前生成临时安全快照。
- **手动备份提醒**：在手动模式下结合书签变化状态、循环提醒、准点提醒和浏览器焦点状态提醒用户备份。
- **网页快照辅助**：支持基于 Chrome 官方 `pageCapture.saveAsMHTML` 的 MHTML 格式与基于 [Obsidian Clipper](https://github.com/obsidianmd/obsidian-clipper) 开源算法的 Markdown (MD) 格式导出，提供高亮划线标记工具，并配合队列与即时注入机制实现任意网页深度留存。
- **升级兼容**：对 v2.1 旧历史记录和旧备份产物做兼容处理；没有快照数据的旧记录会作为可读日志保留。
- **中英文 + 主题切换**：支持中英文界面、明暗主题和浏览器主题跟随。

### 安装入口

- **GitHub Releases**：[下载发布包](https://github.com/Browser-bookmark-hub/Bookmark-Backup/releases)，适合手动安装或保留指定版本。
- **Microsoft Edge Add-ons**：[从 Edge 加载项安装](https://microsoftedge.microsoft.com/addons/detail/%E4%B9%A6%E7%AD%BE%E5%A4%87%E4%BB%BDbookmark-backup/klopopehpngheikchkjgkmplgmbfodek)。
- **Chrome Web Store**：[从 Chrome 应用商店安装](https://chromewebstore.google.com/detail/dbdpgedioldmeooemjanbjlhgpocafbc)。

### 手动安装

- **下载发布包**：从 [GitHub Releases](https://github.com/Browser-bookmark-hub/Bookmark-Backup/releases) 下载发布版本。
- **打开扩展管理页**：进入 `chrome://extensions` 或 `edge://extensions`。
- **启用开发者模式**：打开右上角“开发者模式”。
- **加载扩展**：点击“加载已解压的扩展程序”，选择扩展程序根目录。

### 重要提示

- **WebDAV 配置**：请确认服务器地址、账号、密码或应用密码正确，并保持网络稳定。
- **本地备份限制**：浏览器扩展无法静默写入任意本地路径，本地备份会依赖浏览器默认下载目录。
- **曲线云端备份**：如需让本地备份同步到云盘，可将浏览器默认下载目录设置到云盘同步目录，或使用系统级文件夹同步/软链接方案。
- **大规模整理前建议**：导入、批量删除、大量移动或重组书签前，建议暂时关闭实时自动备份，完成后再手动备份。
- **恢复操作需谨慎**：覆盖恢复、撤销和补丁式恢复会写入浏览器书签树；执行前请确认目标记录，并保留安全快照。
- **v2.1 升级记录**：旧版中没有完整快照数据的历史记录会保留为日志/备注，不一定可直接恢复。

### 数据与隐私

- 核心设置、状态、历史索引和缓存数据保存在浏览器本地存储中。
- WebDAV 和 GitHub 仓库备份只会写入用户自行配置的目标位置。
- 扩展会请求书签、存储、下载、标签页、窗口、网页捕获等权限，以实现备份、恢复、快照和辅助工具能力。
- favicon、网页快照和导出文件会根据用户操作生成或缓存，请按自己的隐私需求管理备份目标和下载目录。
- 详细的隐私处理原则与权限说明请参阅 [隐私政策](PRIVACY_POLICY.md)。

### 第三方开源与许可（网页快照 MD）

- 本项目网页快照 MD 导出能力移植自 **Obsidian Clipper**（MIT License）：https://github.com/obsidianmd/obsidian-clipper
- 核心依赖的转换算法来自其使用的 **defuddle**（同为 MIT 生态）并以兼容方式内置于扩展中。

---

<a id="english"></a>

## English

### Overview

`Bookmark Backup` is a Git-style bookmark versioning, backup-history tracking, and safety-recovery extension for Chrome / Edge.

It treats the browser bookmark tree as a versioned asset. Each backup creates a time-stamped, fingerprinted snapshot/history record that can preserve the full bookmark tree and track current changes against historical states. These versions can be synced to local storage, WebDAV, or a GitHub repository, then used later for restore, revert, or import-merge workflows.

It is also an ecosystem-related project for [Bookmark-Canvas](https://github.com/Browser-bookmark-hub/Bookmark-Canvas), with exported JSON files compatible with Bookmark Canvas import formats for tags and notes.

### Roadmap

- [ ] **More languages and UI QA**: the current UI is built around Simplified Chinese and English. Traditional Chinese, French, Russian, Spanish, Arabic, Japanese, Korean, and other languages need complete copy coverage and layout QA. See [`docs/LIMITATIONS_AND_COMPROMISES.md`](docs/LIMITATIONS_AND_COMPROMISES.md).
- [ ] **Ecosystem data tooling**: explore a CLI for validating, organizing, converting, and interoperating with backup, history, and web-snapshot exports. Unlike the possible standalone-client direction of Bookmark Record and Recommend, this project will prioritize small, composable command-line tools.

### Docs

- [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md): current project structure and module map.
- [`docs/CHANGELOG.md`](docs/CHANGELOG.md): complete release history.
- [`docs/LIMITATIONS_AND_COMPROMISES.md`](docs/LIMITATIONS_AND_COMPROMISES.md): browser limitations, implementation compromises, and compatibility notes.
- [`docs/归档/00--归档索引-请先读.md`](docs/%E5%BD%92%E6%A1%A3/00--%E5%BD%92%E6%A1%A3%E7%B4%A2%E5%BC%95-%E8%AF%B7%E5%85%88%E8%AF%BB.md): index of historical plans, audits, and design notes.

### Changelog

> [!NOTE]
> #### v3.6.0
> - **Local-backup download UI upgrade**: migrated to Chrome's recommended `downloads.ui` / `chrome.downloads.setUiOptions()` APIs and restores the download UI after completion, errors, or background recovery.
> - **Highlighter and Markdown improvements**: refined highlighter tools in the helper panel, Markdown formatting/refresh handling, and Markdown body table-of-contents navigation.
> - **UI and maintainability cleanup**: settings now save automatically; helper buttons work more reliably across pages; core JavaScript comments and sections were reorganized and obsolete split-file scripts were removed to improve AI/developer code navigation.
>
> See the complete [`v3.6.0 changelog`](docs/CHANGELOG.md).

### Main Views

- **Main popup**: configure local, WebDAV, and GitHub backup targets; view bookmark stats, backup status, and shortcuts.
- **Current changes**: inspect changes between the current bookmark tree and the backup baseline.
- **Backup history**: browse timeline records, notes, restore capability, exports, and search.
- **Recovery and safety snapshots**: restore, revert, merge, or recover from safety snapshots.
- **Web snapshot**: archive webpages as MHTML / Markdown (MD) with highlighter tools and screenshot/recording helpers when needed.

### Preview

#### Screenshot Preview

| Main UI | Setup & Initialization |
| :---: | :---: |
| <img src="../Screenshots%20and%20icons/v3.0/主UI%20en.png" width="400"> | <img src="../Screenshots%20and%20icons/v3.0/设置与初始化%20en.png" width="400"> |
| **Current Changes** | **Backup History** |
| <img src="../Screenshots%20and%20icons/v3.0/当前变化html%20en.png" width="400"> | <img src="../Screenshots%20and%20icons/v3.0/备份历史html%20en.png" width="400"> |
| **Web Snapshot** | **Highlighter** |
| <img src="../Screenshots%20and%20icons/v3.5/网页存档en.png" width="400"> | <img src="../Screenshots%20and%20icons/v3.5/高亮工具en.png" width="400"> |

#### Project Structure Preview

```text
Bookmark-Backup-main/
|-- manifest.json                     [CORE] Manifest V3 config, permissions, background entry, and commands.
|-- background.js                     [CORE] Backup, restore, history, migration, cache, badge, and message hub.
|-- popup.html / popup.js             [UI] Main popup: target setup, status, history entries, initialization, and settings.
|-- history_html/                     [UI] Backup history, current changes, bookmark tree, search, restore, and safety snapshots.
|-- backup_reminder/                  [UI] Manual backup reminders, reminder settings, notification lifecycle, and timers.
|-- auto_backup_timer/                [CORE] Automatic backup timing and related setting storage.
|-- dev_1/                            [TOOLS] Web snapshot, MHTML/MD, screenshot, recording, and queue helper tools.
|-- github/                           [SYNC] GitHub repository backup API wrapper.
|-- _locales/                         [I18N] Chinese/English extension name, description, and action title.
|-- docs/                             [DOC] Project structure, changelog, limitations, and historical archives.
\-- LICENSE                           [DOC] Open-source license.
```

### Highlights

- **Multiple backup targets**: local downloads, WebDAV cloud storage, and GitHub repository backup.
- **Git-style versioning**: time-stamped, fingerprinted snapshot records build a traceable timeline around current changes, backup history, and safety recovery.
- **Automatic and manual backup**: back up after bookmark changes or trigger backups manually with reminders.
- **Current changes view**: inspect quantity, structure, and content differences from the last backup baseline.
- **Backup history timeline**: review backup records, notes, restore capability, export options, and searchable history.
- **Safety recovery system**: overwrite restore, patch restore/revert, import merge, and temporary safety snapshots before high-risk writes.
- **Manual backup reminders**: cyclic and fixed-time reminders that react to actual bookmark changes and browser focus state.
- **Web snapshot helper**: supports MHTML exports based on Chrome's official `pageCapture.saveAsMHTML` API and Markdown (MD) exports using [Obsidian Clipper](https://github.com/obsidianmd/obsidian-clipper)'s open-source algorithm, with highlighter tools and scheduled queue or instant page injection.
- **Upgrade compatibility**: legacy v2.1 history and backup artifacts are handled where possible; record-only entries remain readable as logs.
- **Bilingual UI + themes**: Chinese/English UI, light/dark themes, and browser theme following.

### Install Links

- **GitHub Releases**: [download release packages](https://github.com/Browser-bookmark-hub/Bookmark-Backup/releases) for manual installation or version pinning.
- **Microsoft Edge Add-ons**: [install from Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/%E4%B9%A6%E7%AD%BE%E5%A4%87%E4%BB%BDbookmark-backup/klopopehpngheikchkjgkmplgmbfodek).
- **Chrome Web Store**: [install from Chrome Web Store](https://chromewebstore.google.com/detail/dbdpgedioldmeooemjanbjlhgpocafbc).

### Manual Installation

- **Download a release package**: get a release from [GitHub Releases](https://github.com/Browser-bookmark-hub/Bookmark-Backup/releases).
- **Open the extension page**: go to `chrome://extensions` or `edge://extensions`.
- **Enable developer mode**: turn on “Developer mode”.
- **Load the extension**: click “Load unpacked” and select the extension root directory.

### Important Notes

- **WebDAV setup**: make sure the server address, username, password/app password, and network connection are correct.
- **Local backup limitation**: browser extensions cannot silently write to arbitrary local paths; local backup depends on the browser’s default download folder.
- **Cloud-sync workaround**: set the browser’s default download folder to a cloud-drive sync folder, or use system-level folder sync/symlink strategies.
- **Before large reorganizations**: consider disabling real-time automatic backup before import, bulk deletion, large moves, or major bookmark restructuring.
- **Restore with care**: overwrite restore, revert, and patch restore write to the browser bookmark tree; verify the target record and keep safety snapshots.
- **v2.1 upgrade records**: legacy history entries without full snapshot data are kept as readable logs/notes and may not be directly restorable.

### Data & Privacy

- Core settings, states, history indexes, and caches are stored in browser local storage.
- WebDAV and GitHub backups are written only to targets configured by the user.
- Permissions include bookmarks, storage, downloads, tabs, windows, page capture, and related APIs to support backup, restore, snapshot, and helper features.
- Favicons, web snapshots, and exported files may be generated or cached according to user actions; manage backup targets and download folders according to your privacy needs.
- Please refer to the [Privacy Policy](PRIVACY_POLICY.md) for detailed principles and permission justifications.

### Third-party Open Source & License (Web Snapshot MD)

- The Web Snapshot MD export in this project is migrated from **Obsidian Clipper** (MIT License): https://github.com/obsidianmd/obsidian-clipper
- The conversion core comes from its **defuddle**-based MIT ecosystem and is embedded in a compatible form inside this extension.

---

## License

MIT. See [LICENSE](LICENSE).

## [Back to top](#switch-to-english)

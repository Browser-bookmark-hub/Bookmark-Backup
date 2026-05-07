# Bookmark Backup v2.1 原地升级到 3.0 迁移与恢复兼容计划

## 目标

当前决定采用“同一个扩展 ID 原地升级”的方案：用户从正在使用的 v2.1 版本直接升级到当前 3.0 代码线，不作为新插件重新发布。迁移层只在新版本中补充，不要求旧版再发迁移工具。

核心目标是：

1. 保留用户原有 `chrome.storage.local` 配置、备份历史记录和用户手动备注。
2. 让新版“恢复”入口能够识别并恢复 v2.1 已产生的旧备份文件。
3. 将 v2.1 旧备份历史明确降级为“仅记录/仅备注”的经典历史记录，不伪装成可恢复快照。
4. 升级后引导用户点击新版初始化/重新初始化备份按钮，建立 3.0 起点之后的新快照和变化数据。

## 已核对路径

旧版 v2.1 真实发布包解包目录：

```txt
/Users/kk/Downloads/Bookmarks/dbdpgedioldmeooemjanbjlhgpocafbc_unpacked
```

旧版 v2 参考源码目录：

```txt
/Users/kk/Downloads/Bookmark Backup/Untitled
```

当前 3.0 代码目录：

```txt
/Users/kk/Downloads/chrome download/Bookmark-Backup/Bookmark-Backup-3.0
```

## v2.1 已有数据事实

### storage 配置

v2.1 使用的关键配置包括：

```txt
serverAddress
username
password
webDAVEnabled
autoSync
syncHistory
lastBookmarkData
defaultDownloadEnabled
customFolderEnabled
customFolderPath
localBackupPath
localBackupEnabled
```

原地升级时，以上 `chrome.storage.local` 数据会留在同一个扩展 ID 下，新版可以继续读取。

### 用户备注

v2.1 的用户备注保存在：

```txt
syncHistory[].note
```

旧版 `popup.js` 中存在：

```txt
showAddNoteDialog(recordTime)
saveNoteForRecord(recordTime, noteText)
```

备注保存方式是更新 `syncHistory` 后写回：

```txt
chrome.storage.local.set({ syncHistory: updatedHistory })
```

因此原地升级时，备注不会因为扩展 ID 变化而丢失。

### v2.1 备份历史结构

v2.1 的 `syncHistory` 主要是记录型数据，大致包含：

```txt
time
direction
type
status
errorMessage
bookmarkStats
isFirstBackup
note
```

它不是 3.0 的快照索引结构，没有稳定的：

```txt
backup_data_${time}
changes_data_${time}
hasData
hasChangeData
changeDataKey
snapshotKey
snapshotName
snapshotFolderName
fingerprint
```

所以 v2.1 历史只能作为日志和备注保留，不能直接作为恢复点。

### v2.1 本地 HTML 备份

v2.1 的本地 HTML 使用 Netscape/Edge 书签 HTML 格式：

```html
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
```

本地默认下载路径形态：

```txt
Bookmarks/YYYYMMDD_HHMMSS.html
```

旧配置路径形态：

```txt
${localBackupPath}/Bookmarks/YYYYMMDD_HHMMSS.html
```

### v2.1 WebDAV 备份

已核对真实发布包 `background.js`，v2.1 的 WebDAV 上传路径包含：

```txt
/bookmarks/chrome_bookmarks.json
```

历史导出路径包含：

```txt
Bookmarks_History/...
```

当前用户关心的是“云端恢复能否识别旧格式 HTML”。虽然旧版主 WebDAV 上传代码中存在 `chrome_bookmarks.json` 路径，但为了兼容用户可能手动迁移或历史版本产生的文件，新版恢复扫描需要同时支持：

```txt
Bookmarks/YYYYMMDD_HHMMSS.html
bookmarks/YYYYMMDD_HHMMSS.html
bookmarks/chrome_bookmarks.json
```

`Bookmarks_History` 下的 TXT/历史导出不是完整快照，不应作为可恢复快照处理。

## 当前 3.0 已有能力

### 本地旧 HTML 文件识别

当前 `popup.js` 的 `collectLocalRestoreCandidates()` 已支持旧时间戳 HTML 文件名：

```txt
YYYYMMDD_HHMMSS.html
YYYYMMDD_HHMM.html
backup_YYYYMMDD_HHMMSS.html
```

核心规则包含：

```txt
/^(?:backup_)?\d{8}_\d{4}(?:\d{2})?(?:_[0-9a-f]{6,12})?\.(html?|xhtml)$/i
```

并且单文件模式 `allowStandalone` 下会读取 HTML 头部，识别 Netscape 书签 HTML。

结论：本地选择旧 HTML 单文件基本兼容；选择旧 `Bookmarks` 文件夹大概率兼容，但仍建议补显式旧目录识别和测试用例。

### HTML 解析恢复

当前 `background.js` 的恢复解析链路会使用：

```txt
extractBookmarkTreeForRestore()
parseNetscapeBookmarkHtmlToTree()
```

v2.1 的 HTML 是标准 Netscape 书签 HTML，因此解析层兼容。

### WebDAV 扫描

当前 `background.js` 的 `listRemoteFiles('webdav')` 主要扫描新版路径：

```txt
书签备份/
Bookmark Backup/
Bookmark_Backup/
bookmark_backup/
BookmarkBackup/
bookmarkbackup/
```

以及新版子路径：

```txt
覆盖 / Overwrite
版本化 / Versioned
YYYYMMDD_HHMMSS_fingerprint/
```

当前扫描没有明确把旧版根路径作为恢复扫描入口：

```txt
Bookmarks/
bookmarks/
```

因此 WebDAV 旧路径恢复是当前最需要补的兼容点。

### 历史记录能力判断

当前 `popup.js` 已有 `getPopupHistoryRecordCapabilities(record)`，能力判断基于：

```txt
record.bookmarkTree
record.hasData
record.hasChangeData
record.changeDataKey
```

没有快照和变化数据的旧记录会自然变成：

```txt
recordOnly: true
canRestore: false
```

迁移层保留旧记录的 `recordOnly` 能力标记即可，UI 按普通“仅记录”显示，不需要额外区分旧版历史标签。

## 必须实施项

### 1. 增加 v2.1 历史记录迁移标记

新增迁移函数，例如：

```txt
migrateV2RecordOnlyHistory()
```

执行时机：

```txt
runtime.onInstalled(update)
runtime.onStartup
```

在现有 `migrateToSplitStorage()` 附近执行。

处理规则：

1. 读取 `syncHistory`。
2. 找出没有 `bookmarkTree`、没有 `hasData`、没有 `hasChangeData`、没有 `changeDataKey`、没有 `snapshotKey` 的旧记录。
3. 保留原字段，特别是：

```txt
time
note
direction
type
status
errorMessage
bookmarkStats
isFirstBackup
```

4. 补充只读日志标记：

```txt
legacyVersion: '2.1'
recordOnly: true
hasData: false
hasChangeData: false
canRestore: false
capabilities: {
  hasSnapshotData: false,
  hasChangeData: false,
  recordOnly: true,
  canRestore: false
}
```

5. 加幂等标记，避免重复迁移：

```txt
v2RecordOnlyMigrated: true
```

注意：不要删除 `note`，不要删除旧 `bookmarkStats`，不要尝试伪造 `backup_data_${time}`。

### 2. WebDAV 恢复扫描补旧路径

在 `listRemoteFiles('webdav')` 中补充旧路径扫描。

建议旧路径候选：

```txt
Bookmarks
bookmarks
```

扫描方式：

```txt
${serverAddress}Bookmarks/
${serverAddress}bookmarks/
```

识别文件：

```txt
YYYYMMDD_HHMMSS.html
YYYYMMDD_HHMM.html
backup_YYYYMMDD_HHMMSS.html
bookmark_backup.html
chrome_bookmarks.json
```

HTML 文件作为：

```txt
source: 'webdav'
type: 'html_backup'
legacyVersion: '2.1'
folderPath: 'Bookmarks' 或 'bookmarks'
snapshotFolder: ''
```

JSON 文件需要先判断是否是书签树 JSON。如果 `chrome_bookmarks.json` 是完整 Chrome bookmark tree，则作为：

```txt
type: 'json_backup'
legacyVersion: '2.1'
```

如果当前恢复链路对远程 JSON 快照支持不足，则第一阶段可以只列入计划，不在 UI 里暴露为可恢复；优先保证 HTML 恢复。

### 3. 本地恢复补旧目录显式兼容

当前本地文件名规则已经覆盖旧 HTML，但建议增加显式路径判断，降低误判风险。

旧目录候选：

```txt
Bookmarks
bookmarks
```

当选择文件夹时，如果 `webkitRelativePath` 包含：

```txt
/Bookmarks/
/bookmarks/
```

且文件名匹配旧 HTML 时间戳，则直接加入：

```txt
type: 'html_backup'
legacyVersion: '2.1'
```

单文件选择继续保持 `allowStandalone` 兜底逻辑，支持任意 Netscape 书签 HTML。

### 4. 恢复列表显示旧版来源

恢复弹窗中，旧版候选文件建议显示来源标签：

```txt
旧版 2.1 HTML
Legacy v2.1 HTML
```

路径显示示例：

```txt
WebDAV / Bookmarks / 20260506_142200.html
Local / Bookmarks / 20260506_142200.html
```

恢复策略建议：

```txt
合并恢复
覆盖恢复
```

不建议把旧 HTML 引导为补丁恢复，因为旧 HTML 不带新版变化数据和稳定快照元信息。

### 5. 历史页和弹窗中按仅记录处理旧记录

对于 `recordOnly: true` 且无快照/变化数据的记录，UI 按现有精简历史的普通“仅记录”状态显示：

```txt
仅记录
```

要求：

1. 保留备注编辑能力。
2. 保留搜索备注能力。
3. 保留导出历史能力。
4. 禁用恢复、补丁恢复、变化查看、快照导出等依赖数据的操作。
5. 不把旧记录算作可恢复版本。

### 6. 升级后初始化引导

用户升级到 3.0 后，不自动伪造历史快照。按当前产品决策，引导用户点击新版初始化/重新初始化备份按钮。

建议新增一次性升级提示状态：

```txt
v2ToV3UpgradeNoticeShown
v2ToV3MigrationCompletedAt
v2LegacyRecordCount
```

提示文案：

```txt
检测到旧版 2.1 备份历史。旧历史记录和备注已保留，但旧记录没有新版快照/变化数据，不能直接恢复。旧 HTML 备份文件可通过本地恢复或 WebDAV 恢复使用。请点击“重新初始化备份”建立 3.0 的第一个可恢复基准。
```

按钮建议：

```txt
去初始化备份
稍后处理
查看旧版恢复说明
```

### 7. 设置兼容与默认值

原地升级会继承旧配置，但新版新增了大量设置。迁移层要保证旧配置不被覆盖。

应保留：

```txt
serverAddress
username
password
webDAVEnabled
autoSync
defaultDownloadEnabled
customFolderEnabled
customFolderPath
localBackupPath
localBackupEnabled
```

应初始化新版缺省项，但不能破坏旧值：

```txt
snapshotBackupEnabled
snapshotBackupFormat
currentChangesArchiveEnabled
backupHistorySlimmingSettings
autoBackupTimerSettings
githubRepoToken/githubRepoOwner/githubRepoName/githubRepoBranch/githubRepoBasePath
```

WebDAV 配置继承后，新版后续备份会写入新版目录：

```txt
书签备份/Bookmark Backup/...
```

这会与旧目录并存。UI 文案应说明：旧文件仍可恢复，新备份会进入新版目录。

## 可选实施项

### 1. 旧 WebDAV JSON 恢复支持

如果确认 `bookmarks/chrome_bookmarks.json` 是完整书签树，可以把它加入恢复源。

需要确认：

1. JSON 顶层是数组还是对象。
2. 是否等同于 `chrome.bookmarks.getTree()` 返回结构。
3. 当前远程 JSON 下载与 `extractBookmarkTreeForRestore()` 是否已经支持。

优先级低于旧 HTML 恢复。

### 2. 旧 `Bookmarks_History` 只读查看

`Bookmarks_History` 下的文件主要是历史 TXT 导出，不是恢复源。

可以在说明里提示：

```txt
旧版 Bookmarks_History 是历史导出日志，不包含完整书签快照，不能用于恢复。
```

不建议把它加入恢复候选。

### 3. 自动生成升级基准快照

之前讨论过升级后自动创建 3.0 基准快照；当前产品决策改为让用户点击初始化按钮。

如果后续想提高安全性，可再考虑自动生成，但这不是本计划的必选项。

## 测试计划

### 准备 v2.1 数据

在测试环境安装/加载 v2.1，生成：

1. 至少 2 条 `syncHistory`。
2. 给其中一条手动添加备注。
3. 本地生成：

```txt
Bookmarks/20260506_142200.html
```

4. WebDAV 放置：

```txt
Bookmarks/20260506_142200.html
bookmarks/20260506_142201.html
bookmarks/chrome_bookmarks.json
Bookmarks_History/书签备份历史记录_*.txt
```

### 原地升级测试

加载 3.0 后检查：

1. `syncHistory[].note` 保留。
2. 旧记录被标记为 `legacyVersion: '2.1'` 或 `recordOnly: true`。
3. 旧记录无恢复按钮。
4. 旧记录仍可搜索备注。
5. 旧记录仍可导出历史。
6. 弹出或显示升级初始化提示。

### 本地恢复测试

测试入口：

1. 选择单个 `20260506_142200.html`。
2. 选择包含 `Bookmarks/20260506_142200.html` 的文件夹。
3. 选择非标准命名但内容是 Netscape bookmark HTML 的文件。

预期：

1. 能出现在恢复列表。
2. 显示为旧版 HTML 或普通 HTML 快照。
3. 能执行合并恢复或覆盖恢复。
4. 恢复前安全事务仍生效。

### WebDAV 恢复测试

测试入口：

```txt
恢复 -> WebDAV
```

预期：

1. 能扫描到 `Bookmarks/*.html`。
2. 能扫描到 `bookmarks/*.html`。
3. 不把 `Bookmarks_History/*.txt` 作为快照。
4. 如果支持 JSON，能识别 `bookmarks/chrome_bookmarks.json`；如果暂不支持，应不显示或显示不可恢复说明。
5. 旧 HTML 能成功下载、解析、恢复。

### 回归测试

必须确认新版路径不受影响：

```txt
书签备份/Bookmark Backup/覆盖/bookmark_backup.html
书签备份/Bookmark Backup/版本化/YYYYMMDD_HHMMSS_hash/YYYYMMDD_HHMMSS_hash.html
Bookmark Backup/Bookmark Backup/Overwrite/bookmark_backup.html
Bookmark Backup/Bookmark Backup/Versioned/YYYYMMDD_HHMMSS_hash/YYYYMMDD_HHMMSS_hash.html
```

还要确认：

1. GitHub 恢复扫描不被 WebDAV 旧路径逻辑污染。
2. 本地 ZIP 恢复不受影响。
3. 当前变化数据恢复不受影响。
4. 恢复事务和自动回滚仍正常。

## 风险点

### 旧历史记录不可恢复

这是数据结构限制，不是 bug。必须通过 UI 文案说明。

### 旧 WebDAV 可能只有 JSON 没有 HTML

已核对 v2.1 主 WebDAV 上传路径包含：

```txt
/bookmarks/chrome_bookmarks.json
```

如果用户从未把 HTML 放到 WebDAV，则 WebDAV 恢复列表可能只有 JSON 或没有 HTML。第一阶段重点是旧 HTML；JSON 是否恢复作为可选增强。

### 新旧路径并存导致用户误解

升级后新版备份会写入新版目录，但旧备份仍留在 `Bookmarks` 或 `bookmarks`。需要在恢复 UI 和升级提示中说明。

### 备注保留依赖原地升级

本计划只适用于同扩展 ID 原地升级。如果未来改成新插件发布，旧备注不会自动进入新插件。

## 实施顺序建议

1. 增加 `migrateV2RecordOnlyHistory()`。
2. 在 `onInstalled(update)` 和 `onStartup` 中调用迁移函数。
3. 给 WebDAV 扫描补 `Bookmarks` / `bookmarks` 旧路径。
4. 给本地恢复补旧目录显式标记。
5. 给恢复列表和历史页补旧版提示标签。
6. 增加升级后初始化提示。
7. 补测试用例和手工验证清单。

## 验收标准

发布前必须满足：

1. 原地升级后旧备注不丢。
2. 旧 `syncHistory` 记录不被当成可恢复快照。
3. 本地旧 HTML 单文件可恢复。
4. 本地旧 `Bookmarks` 文件夹可扫描恢复。
5. WebDAV 旧 `Bookmarks/*.html` 可扫描恢复。
6. WebDAV 旧 `bookmarks/*.html` 可扫描恢复。
7. 旧 `Bookmarks_History` 不误判为快照。
8. 升级后用户能看到重新初始化备份引导。
9. 新版正常备份、恢复路径不回退、不破坏。

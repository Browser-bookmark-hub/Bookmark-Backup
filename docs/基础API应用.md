# 基础 API 应用

更新时间：2026-07-14

## 范围

本文只记录 `chrome.bookmarks` 事件在本项目里的代码现状。官方参考：
https://developer.chrome.com/docs/extensions/reference/api/bookmarks

CodeGraph 检查范围：

- `Bookmark-Backup-main/background.js`
- `Bookmark-Backup-main/history_html/history.js`

## 官方事件列表

官方 `chrome.bookmarks` 事件包括：

| 事件 | 官方/基础用途 | 当前代码现状 |
| --- | --- | --- |
| `onCreated` | 新建书签或文件夹 | 已监听，写新增记录和当前变化 delta |
| `onRemoved` | 删除书签或文件夹 | 已监听，清理近期记录并写删除 delta |
| `onMoved` | 节点移动到新位置 | 已监听，写移动记录、`lastSyncOperations` 和当前变化 delta |
| `onChanged` | 节点标题或 URL 变化 | 已监听，写修改记录、`lastSyncOperations` 和当前变化 delta |
| `onChildrenReordered` | 同一父级下的子节点顺序变化，例如 Chrome 书签管理器里的 Sort by name | 已监听，后台能收到；不写具体 moved id，按移动/结构变化入口处理 |
| `onImportBegan` | 浏览器导入书签开始 | 已监听，用于设置导入 flag、停止刷新/重建定时器 |
| `onImportEnded` | 浏览器导入书签结束 | 已监听，用于清导入 flag，并延迟统一触发一次刷新 |

## 项目当前使用情况

### 监听事件和变化分类的区别

代码现状里要分清两层：

- 监听层：后台监听了官方 7 个 `chrome.bookmarks` 事件。
- 变化分类层：状态卡片、备份统计、当前变化主要归纳为新增、删除、移动、修改四类净变化。

所以“只监听了增加、删除、移动、修改四种基础东西”这个说法不准确。准确说法是：

- 代码监听事件不止四个，后台还监听 `onChildrenReordered`、`onImportBegan`、`onImportEnded`。
- 业务展示/统计分类主要是四类：added、deleted、moved、modified。
- `onChildrenReordered` 是监听事件，但进入统计时归到 moved/结构变化。
- `onImportBegan` / `onImportEnded` 是监听事件，但不进入 added/deleted/moved/modified 分类，只负责导入期间抑制昂贵刷新并在结束后统一刷新。

### 后台近期操作标记

位置：`Bookmark-Backup-main/background.js:2468`

- `onCreated` 记录 `recentAddedIds`。
- `onRemoved` 从 `recentMovedIds`、`recentModifiedIds`、`recentAddedIds` 清理被删除节点。
- `onMoved` 判断节点类型，写入 `lastSyncOperations`，并记录 `recentMovedIds`。
- `onChanged` 判断节点类型，写入 `lastSyncOperations`，并记录修改状态。
- `onChildrenReordered` 后台实际可以监听到，当前不会生成具体 `recentMovedIds`，而是把 `bookmarkMoved` 和 `folderMoved` 都置为 true，写入 `lastSyncOperations`，按移动/结构变化处理。

代码现状：前四个事件负责细粒度记录；`onChildrenReordered` 负责补齐“排序/重排”场景。它不是没有事件，而是事件本身只告诉父级和排序后的子项列表，当前代码没有把它转换成具体 `recentMovedIds`，而是先把结构变化标记为移动类。

### 当前变化缓存与 dirty 入口

位置：`Bookmark-Backup-main/background.js:13497`

- `onCreated` / `onRemoved` / `onMoved` / `onChanged` 会写入 `enqueueChangeCacheDelta(...)`，然后调用 `handleBookmarkChange()`。
- `onChildrenReordered` 不写 delta，只调用 `handleBookmarkChange()`，后续由全树对比识别顺序变化。
- `handleBookmarkChange()` 会标记 `BookmarkSnapshotCache` stale、进入防抖定时器，并在首次 dirty 前确认是否真的存在净变化。

代码现状：事件层负责“记录线索 + 置脏 + 触发检查”，最终变化口径仍以快照对比和净变化确认结果为准。

状态卡片也是这个口径：Chrome 书签管理器执行 Sort by name 时，后台能收到 `onChildrenReordered`，它触发 dirty/刷新；状态卡片展示的“移动/结构变化”不是直接从事件名算出来的，而是由当前浏览器树和上次备份快照进行对比后得到的净变化结果。

### 历史页实时刷新

位置：`Bookmark-Backup-main/history_html/history.js:22223`

历史页只监听：

- `onCreated`
- `onRemoved`
- `onChanged`
- `onMoved`

历史页页面脚本没有单独监听 `onChildrenReordered`，但这不代表项目检测不到。后台能捕获重排并推动 dirty/变化检查；历史页自身的实时树更新主要依赖四个细粒度事件和后续刷新兜底。

### 状态卡片数据来源

位置：

- `Bookmark-Backup-main/popup.js:4902`
- `Bookmark-Backup-main/popup.js:5338`
- `Bookmark-Backup-main/popup.js:5512`
- `Bookmark-Backup-main/background.js:25687`
- `Bookmark-Backup-main/background.js:26231`

状态卡片当前会调用后台 `getBackupStats` / `getBackupStatsInternal()`，然后读取 `backupResponse.stats`：

- `movedTotal` 优先使用 `stats.movedCount`。
- `modifiedTotal` 优先使用 `stats.modifiedCount`。
- 新增/删除数量来自 `resolveAbsoluteDisplayStats(...)` 对 `stats` 和差值的归一化。
- 当 `stats.movedCount` 不存在时，UI 才回退到 `recentMovedIds` 或 `bookmarkMoved` / `folderMoved`。

`stats.movedCount` 来自后台 `computeBookmarkGitDiffSummary(oldTree, newTree, options)`。该函数对比的是上次备份的 `bookmarkTree` 和当前 `bookmarks.getTree()` 得到的树：

- 跨父级变化直接算 moved。
- 同父级顺序变化在没有显式 `recentMovedIds` 时，用 LIS 推导最小 moved 集合。
- `onChildrenReordered` 当前不写 `recentMovedIds`，所以 Sort by name 这类重排最终会走“无显式 moved id 的快照 diff/LIS”路径，被统计进 `movedCount`。

## 批量变化防护

当前代码同时存在两类防护。

导入事件防护位置：`Bookmark-Backup-main/background.js:13585`

- `onImportBegan` 设置 `isBookmarkImporting = true`，写 `bookmarkImportingFlag`，开启 `canvasMarkerBulkMode`，清掉 `bookmarkImportFlushTimer` 和 `bookmarkChangeTimeout`，并阻止导入期间快照自动 rebuild。
- `onImportEnded` 设置 `isBookmarkImporting = false`，清 `bookmarkImportingFlag`，延迟 1000ms 后关闭导入 bulk 标记并调用一次 `handleBookmarkChange()`。

通用 Bulk Mode 位置：`Bookmark-Backup-main/background.js:3321`

- `BOOKMARK_BULK_WINDOW_MS = 1500`
- `BOOKMARK_BULK_THRESHOLD = 30`
- `BOOKMARK_BULK_QUIET_MS = 1200`
- `isBookmarkBulkChanging`
- `enterBookmarkBulkChangeMode(...)`
- `exitBookmarkBulkChangeMode()`
- `noteBookmarkEventForBulkGuard()`

这套机制按短时间事件数量进入 Bulk Mode，在批量变化期间暂停昂贵分析、通信和可能的实时备份，等待安静期后统一调用一次 `handleBookmarkChange()`。

位置：`Bookmark-Backup-main/background.js:13678`

`handleBookmarkChange()` 本身还有防抖，并且在导入、恢复、大量变化、恢复宽限期内直接跳过昂贵处理。

代码现状：`onImportBegan` / `onImportEnded` 当前确实被监听，但它们不是状态卡片/变化统计的分类来源；它们负责导入过程的抑制和导入结束后的统一刷新。其它大量变化由通用 Bulk Mode 负责。

## 代码现状结论

1. 当前代码监听了官方 7 个 `chrome.bookmarks` 事件。
2. `onCreated`、`onRemoved`、`onMoved`、`onChanged` 是细粒度变化和 delta 的主要来源。
3. `onChildrenReordered` 当前后台能监听到；它不会写具体 `recentMovedIds`，但会触发移动/结构变化标记和 `handleBookmarkChange()`。
4. 状态卡片不是直接显示 `onChildrenReordered` 事件名；它读后台统计，后台统计由上次备份快照和当前书签树 diff 得到。因此 Sort by name 触发的重排最终显示为移动/结构变化。
5. `onImportBegan` / `onImportEnded` 当前也被监听；代码用途是导入期间抑制刷新和结束后统一刷新，不是变化分类。

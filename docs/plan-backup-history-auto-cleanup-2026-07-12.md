# 备份历史自动清理计划书

日期：2026-07-12

## 目标

给“备份历史”增加一个默认关闭的自动清理设置。用户主动勾选并确认后，按用户设置的保留阈值和清理批量控制内部历史记录数量，避免 `chrome.storage.local` 中的备份历史长期增长。

建议的用户语义：

- 自动清理：默认关闭。
- 保留阈值：保留多少条最新备份历史记录，例如 `30`。
- 清理批量：超过阈值多少条后触发清理，例如 `5`。
- 日常触发规则：当记录数达到 `保留阈值 + 清理批量` 时，删除最旧记录，截取回 `保留阈值`。
- 升级或已有大量历史时：用户在前台勾选并确认后，如果当前记录数已经超过阈值，提示“将截取至 N 条”，用户确认后立即删到阈值。

## 现状梳理

本次用 CodeGraph 和定向源码阅读确认了“备份历史”的主路径。

### 存储结构

备份历史主索引是 `syncHistory`，存储在 `chrome.storage.local` / `browserAPI.storage.local`。

当前代码已经把大块数据从索引拆出：

- 历史索引：`syncHistory`
- 快照数据：`backup_data_<time>`
- 变化数据：`changes_data_<time>`

相关位置：

- `Bookmark-Backup-main/background.js`：删除逻辑应基于被删 records 收集 `backup_data_*`、默认 `changes_data_*` 和自定义 `changeDataKey`。
- `Bookmark-Backup-main/background.js:24319`：`updateSyncStatus()` 追加 `newSyncRecord`。
- `Bookmark-Backup-main/background.js:24329`：`updateSyncStatus()` 写入 `syncHistory`。

### 已有删除接口

现在前台“部分删除备份历史记录”不是直接删除数据，而是发消息给后台：

- `Bookmark-Backup-main/history_html/history.js:3921`：`clearBackupHistoryPartial(deleteCount)`
- `Bookmark-Backup-main/background.js:12315`：处理 `clearSyncHistoryPartial`

`clearSyncHistoryPartial` 当前已经做了几件关键事情：

- 删除最旧的 N 条：`syncHistory.slice(actualDeleteCount)`
- 清理被删记录对应的 `backup_data_*` / `changes_data_*`
- 维护 `cachedRecordAfterClear`，让删除旧记录后后续对比仍有基准
- 更新 overwrite revert marker
- 必要时重置 comparison generation

结论：自动清理不应该重新实现删除逻辑，应该抽取并复用这套后台逻辑。

### 记录能力矩阵

备份历史不是每条记录都有同样的数据能力。当前代码用 `hasData`、`hasChangeData`、`changeDataKey`、`capabilities`、`dataRetention` 等字段表达记录能否展开、搜索、导出、恢复。

清理时需要按“记录索引 + 可选分离数据”理解，而不是假设每条都有完整快照。

| 记录类型 | 典型字段 | 清理时要做什么 |
| --- | --- | --- |
| 仅记录 | `hasData=false`，`hasChangeData=false` | 只从 `syncHistory` 删除该索引记录 |
| 记录 + 快照 | `hasData=true` | 删除索引记录，并删除 `backup_data_<time>` |
| 记录 + 变化数据 | `hasChangeData=true`，`changeDataKey` | 删除索引记录，并删除 `changeDataKey` 或默认 `changes_data_<time>` |
| 记录 + 快照 + 变化数据 | `hasData=true`，`hasChangeData=true` | 删除索引记录，并删除快照 key 和变化数据 key |
| 旧格式记录 | 可能仍有 `bookmarkTree` 内嵌在记录里 | 删除索引记录即可移除内嵌数据；如果迁移后还有分离 key，也要按 key 清理 |

删除函数应传入“被删 records”而不只是 times，并从 record 本身收集要删除的 key：

```js
function collectBackupHistoryDataKeysForRecords(records) {
  const keys = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    const time = String(record?.time || '').trim();
    if (time && (record?.hasData === true || record?.bookmarkTree)) {
      keys.add(`backup_data_${time}`);
    }
    const changeDataKey = String(record?.changeDataKey || '').trim();
    if (record?.hasChangeData === true || changeDataKey) {
      if (changeDataKey) {
        keys.add(changeDataKey);
      } else if (time) {
        keys.add(`changes_data_${time}`);
      }
    }
  }
  return Array.from(keys);
}
```

这样即使以后 `changeDataKey` 不再严格等于 `changes_data_<time>`，自动清理也不会留下孤立变化数据。

## 新增记录路径

自动清理不能只绑前台按钮，因为很多历史记录来自后台流程。需要覆盖“新增历史记录”的后台入口。

已确认的新增路径：

| 路径 | 位置 | 说明 | 自动清理策略 |
| --- | --- | --- | --- |
| 普通手动/自动/切换备份 | `background.js:19131` -> `updateSyncStatus()` | 主备份路径 | 覆盖 |
| 初始化上传 | `background.js:11320` -> `updateSyncStatus()` | 初始化产生历史 | 覆盖 |
| 初始化下载 | `background.js:11410` -> `updateSyncStatus()` | 下载成功记录 | 覆盖 |
| 恢复/高危操作记录 | `background.js:4461` -> `updateSyncStatus()`，之后补字段 | 先创建记录再补 `restoreInfo`/统计 | 覆盖，但注意后续补字段必须操作清理后的当前记录 |
| 恢复补救失败记录 | `background.js:20575` 直接 `syncHistory.push(nextRecord)` | 没走 `updateSyncStatus()` | 需要纳入公共保存函数 |

不应该触发自动清理的写入：

| 路径 | 位置 | 原因 |
| --- | --- | --- |
| 编辑备注 | `popup.js:20468`、`history.js:10283` | 修改已有记录，不是新增 |
| seqNumber 迁移 | `history.js:5154` | 迁移补字段，不是新增 |
| 手动删除/范围删除 | `background.js:12241`、`background.js:12400`、`background.js:12449` | 删除动作本身，不应再次触发自动清理 |
| restore 记录补字段 | `background.js:4638` | 修改刚创建的记录，不应因为补字段再次清理 |

## 建议方案

### 1. 设置项

新增 storage 配置，例如：

```js
backupHistoryAutoCleanup: {
  enabled: false,
  threshold: 30,
  batchSize: 5
}
```

默认值建议：

- `enabled: false`
- `threshold: 30`
- `batchSize: 5`

校验建议：

- `threshold >= 10`
- `batchSize >= 1`
- `batchSize <= threshold`
- 非法值回退到默认值

### 2. 前台启用确认

用户在 UI 勾选“自动清理”并保存时：

1. 前台读取当前 `syncHistory.length` 或通过 `getSyncHistory` 获取 `totalRecords`。
2. 如果 `enabled=true` 且 `totalRecords > threshold`，弹确认：
   - 示例：`当前已有 120 条备份历史。启用后将截取至最新 30 条，并删除最旧的 90 条。`
3. 用户确认后：
   - 先保存自动清理设置。
   - 调用现有后台接口 `clearSyncHistoryPartial(deleteCount)`，其中 `deleteCount = totalRecords - threshold`。
   - 刷新历史列表和删除按钮颜色状态。
4. 用户取消：
   - 不保存启用状态，或回滚 checkbox 到关闭状态。

这样升级场景不会静默删除；只有用户主动勾选并确认后才立即截取。

### 3. 后台固定兜底

前台确认只处理“用户正在看设置”的场景。后台自动备份、切换备份、恢复记录仍可能在没有前台的情况下继续新增记录，所以后台必须兜底。

建议抽取公共函数：

```js
async function pruneSyncHistoryToAutoCleanupLimit(syncHistory, options = {}) {
  // 读取 backupHistoryAutoCleanup
  // 未开启：原样返回
  // 开启且 syncHistory.length >= threshold + batchSize：
  //   删除 syncHistory.length - threshold 条最旧记录
  //   清理对应 backup_data_* / changes_data_*
  //   维护 cachedRecordAfterClear / marker / generation
  // 返回 { syncHistory, deleted, cleanupApplied }
}
```

更稳的实现方式是先把 `clearSyncHistoryPartial` 的内部逻辑抽成：

```js
async function deleteOldestSyncHistoryRecords(syncHistory, deleteCount) {
  // 返回 { syncHistory: remainingHistory, deleted, remaining }
}
```

这个函数内部应该基于 `deletedRecords` 收集并删除分离数据 key，覆盖 record-only、snapshot-only、change-only、both、旧格式内嵌数据五种情况。

然后：

- `clearSyncHistoryPartial` 继续调用它。
- 自动清理也调用它。

这样不会出现两套删除行为不一致。

### 4. 后台写入收口

在所有“新增历史记录”路径中调用公共保存函数。

建议新增：

```js
async function saveSyncHistoryAfterAppend(syncHistory, extraUpdateData = {}) {
  const cleanupResult = await pruneSyncHistoryToAutoCleanupLimit(syncHistory);
  await browserAPI.storage.local.set({
    ...extraUpdateData,
    syncHistory: cleanupResult.syncHistory
  });
  return cleanupResult;
}
```

需要改造的位置：

- `updateSyncStatus()`：`currentSyncHistory = [...syncHistory, newSyncRecord]` 后，先自动清理，再写 `updateData.syncHistory`。
- `recordRestoreRecoveryFailure()`：`syncHistory.push(nextRecord)` 后，改用公共保存函数。

注意 restore 记录的特殊性：

- `background.js:4461` 创建记录后，后续代码会重新读取 `syncHistory`，通过 `syncTime` 找到刚创建的记录并补字段。
- 自动清理必须保证新记录不会被删。因为删除最旧记录且新记录在末尾，所以正常不会删新记录。
- 但补字段时必须以重新读取后的 `syncHistory` 为准，当前代码已经这样做。

### 5. 日常后台规则

后台不要弹窗，固定规则如下：

```text
如果自动清理关闭：不处理
如果自动清理开启：
  如果 当前记录数 >= 保留阈值 + 清理批量：
    删除 当前记录数 - 保留阈值 条最旧记录
```

示例：

| 当前记录数 | 设置 | 行为 |
| ---: | --- | --- |
| 29 | 阈值 30 / 批量 5 | 不删除 |
| 34 | 阈值 30 / 批量 5 | 不删除 |
| 35 | 阈值 30 / 批量 5 | 删除 5 条，回到 30 |
| 120 | 阈值 30 / 批量 5 | 如果是在前台启用，确认后删除 90 条；如果后台兜底触发，也删除 90 条，回到 30 |

## 性能分析

### 删除 1 条 vs 批量删除

“超过阈值后每新增一条删一条”可行，但会让每次新增记录都额外触发：

- 读取/改写 `syncHistory`
- 删除 `backup_data_*` / `changes_data_*`
- 更新基准缓存和 marker
- UI storage change 刷新

批量删除更合适。`阈值 30 / 批量 5` 表示每 5 次增长才清理一次，减少 storage 写入频率。

### 当前库的性能条件

当前历史索引已经和大数据分离，所以列表读取和分页主要依赖 `syncHistory` 索引，不会每次读取所有快照树。

自动清理的主要成本是：

- 一次性删除多个 storage keys。
- 更新 `syncHistory` 数组。
- 可能读取被删记录中的最后一个有效快照，用于 `cachedRecordAfterClear`。

这些成本在“达到阈值 + 批量”时发生，频率较低。比每条新增都删除 1 条更稳。

### 风险点

1. `cachedRecordAfterClear` 维护不能丢，否则删除旧记录后下一条变化对比可能缺基准。
2. 分离数据清理必须覆盖 `backup_data_*`、默认 `changes_data_*` 和自定义 `changeDataKey`，避免只删索引不删大数据。
3. 更稳的删除函数应从被删 record 的 `changeDataKey` 收集变化数据 key，不能永远假设变化数据 key 都是 `changes_data_<time>`。
4. `postSyncWarnings` 逻辑目前会在 `updateSyncStatus()` 后面再次 `set({ syncHistory: currentSyncHistory })`，自动清理后要避免用未清理的 `currentSyncHistory` 把已删除记录写回来。
5. 恢复补救失败记录直接 push，需要纳入公共保存函数，否则会成为遗漏入口。
6. 前台确认删除时要使用后台接口，不能在前台直接改 `syncHistory`，否则容易漏删拆分数据。

## 实施步骤

1. 抽取后台删除最旧记录函数。
   - 从 `clearSyncHistoryPartial` 中抽出核心逻辑。
   - 保持原有消息接口行为不变。

2. 新增自动清理设置 normalize/get/set helper。
   - 默认关闭。
   - 对阈值和批量做边界校验。

3. 新增后台自动清理函数。
   - 输入当前 `syncHistory`。
   - 读取设置。
   - 判断是否需要删除。
   - 复用“删除最旧记录”函数。

4. 改造新增历史保存路径。
   - `updateSyncStatus()` 写入前先应用自动清理。
   - `recordRestoreRecoveryFailure()` 直接 push 后也应用自动清理。
   - 修正 `postSyncWarnings` 后续写回，确保写回的是清理后的历史数组。

5. 前台设置 UI。
   - 放在“清除记录”弹窗中，和删除按钮颜色提醒阈值放在同一处。
   - 默认不勾选。
   - 勾选后显示保留阈值、清理批量输入框。
   - 保存时如果当前记录数超过阈值，弹确认；确认后调用 `clearSyncHistoryPartial(totalRecords - threshold)`。

6. 国际化和提示。
   - 中文/英文文案补齐。
   - 提示明确说明“只清理插件内部备份历史记录，不删除已经导出的云端/本地备份文件”。

## 验证计划

基础验证：

- 自动清理默认关闭，升级后已有历史不变。
- 开启时当前未超阈值，只保存设置，不删除。
- 开启时当前超过阈值，确认后删除到阈值。
- 取消确认后不启用、不删除。

后台验证：

- 手动备份触发自动清理。
- 自动备份触发自动清理。
- 切换备份触发自动清理。
- 恢复/高危操作创建记录后仍能补全 restore 信息。
- 恢复补救失败记录也触发自动清理。

数据完整性验证：

- 删除后 `syncHistory.length` 正确。
- record-only 记录删除后只减少索引，不尝试依赖不存在的数据。
- snapshot-only 记录删除后 `backup_data_*` 被移除。
- change-only 记录删除后 `changeDataKey` 或 `changes_data_*` 被移除。
- snapshot+change 记录删除后两个分离数据 key 都被移除。
- 旧格式内嵌 `bookmarkTree` 记录删除后不残留索引内大数据。
- `cachedRecordAfterClear` 存在且后续变化对比可用。
- 删除后分页、搜索、备注编辑不报错。

性能验证：

- 构造 120 条历史，启用 `30 / 5` 后一次删除 90 条。
- 构造 34 条历史，新增 1 条后删除 5 条回到 30。
- 构造 30 条历史，新增 4 条不删除。

## 结论

自动清理应采用“前台启用确认 + 后台新增记录兜底”的双层方案。

前台负责用户可见的升级/已有历史截取确认；后台负责所有无 UI 的新增历史记录，避免手动、自动、切换、高危操作等路径遗漏。

删除逻辑必须复用或抽取现有 `clearSyncHistoryPartial` 的后台实现，不能在前台直接删索引，也不能另写一套只删 `syncHistory` 的简化逻辑。

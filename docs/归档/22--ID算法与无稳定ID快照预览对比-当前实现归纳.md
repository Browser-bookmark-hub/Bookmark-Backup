# ID 算法与无稳定 ID 快照预览对比：当前实现归纳

日期：2026-07-16

## 1. 范围结论

本文只记录两个范围：

- `history.html` 里面的预览基本走 ID 体系。
- `popup` 里的 overwrite、patch、auto 恢复预览走后台快照预检链路，核心是补 ID、根映射、节点映射，再按恢复策略展示；changes-view merge 预览走独立的变化树提取链路。

这里不展开备份历史详情页的持久化变化数据展示。

当前代码事实来源：

- `Bookmark-Backup-main/history_html/history.js`
- `Bookmark-Backup-main/background.js`
- `Bookmark-Backup-main/popup.js`

## 2. 有 ID 算法

有 ID 算法的前提是：同一个书签或文件夹在两棵树中保留同一个节点 `id`。严格 patch/revert 口径和恢复预处理链路还会处理顶层根 remap；普通视觉 diff 不能假定一定有这层 remap。

### 2.1 核心入口

| 算法 | 位置 | 角色 |
| --- | --- | --- |
| `computeIdStrictPatchChangeMap(oldTree, newTree)` | `history_html/history.js` | 严格 ID 补丁 changeMap，用于撤销/恢复预览里的 patch 口径 |
| `detectTreeChangesFast(oldTree, newTree, options)` | `history_html/history.js` | ID 主键视觉 diff，用于当前变化和 history 页面本地预览 |
| `detectTreeChangesFastBg(oldTree, newTree, options)` | `background.js` | 后台版 ID 主键视觉 diff，用于归档、恢复预览返回的 `changeEntries` |
| `computeIdStrictRevertDiffSummary(currentTree, snapshotTree)` | `background.js` | 后台严格 ID 统计，用于 auto 策略判断 patch/overwrite |
| `computeBookmarkGitDiffSummary(oldTree, newTree, options)` | `history_html/history.js` / `background.js` | 统计摘要，不输出 changeMap；前后台实现并不完全相同 |

### 2.2 四种基础操作如何判断

以 `computeIdStrictPatchChangeMap` 和 `detectTreeChangesFast` 的共同核心口径为准：

| 操作 | 判定条件 |
| --- | --- |
| 增加 | `newTree` 中存在某个节点 ID，但 `oldTree` 中找不到同 ID 节点 |
| 删除 | `oldTree` 中存在某个节点 ID，但 `newTree` 中找不到同 ID 节点 |
| 修改 | 同 ID 节点同时存在，但 `title` 或 `url` 不同 |
| 移动 | 同 ID 节点同时存在，但父级不同；同父级重排时，使用显式 moved ID 或 LIS 最长递增子序列推导最小 moved 集合 |

补充规则：

- 严格 patch/revert 口径会保护或 remap 顶层根和直属根容器，避免把浏览器根差异误判成普通书签变化；`detectTreeChangesFast()` 这类视觉 diff 本身不通用保护/remap 顶层根。
- 有显式 moved ID 时，只按显式 moved 集合标记同级移动。
- 没有显式 moved ID 时，只在父级 children 集合没有增删/跨级移动的情况下，用 LIS 推导同级排序变化。
- `computeBookmarkGitDiffSummary` 是统计摘要路径，不是 patch changeMap。后台版本按 ID 对齐；history 版本还会对 ID 不同但 URL 相同的书签做一次 deleted/added reconciliation，可能把它们重新归为 moved/modified。因此不能把两个同名实现视为完全相同的纯 ID 算法。

### 2.3 使用对象是否统一

在有 ID 算法里，对象语义基本统一：

| 对象 | 语义 |
| --- | --- |
| `oldTree` / `currentTree` | 操作前或比较基线树 |
| `newTree` / `targetTree` | 操作后或准备恢复/撤销到的目标树 |
| `changeMap` | 从旧树到新树/目标树的变化映射 |
| `diffSummary` | 统计摘要，不是树 |

需要注意：

- `targetTree` 在恢复预览里是选中版本快照，在撤销预览里是要撤回去的基线快照。
- `snapshotTree` 在撤销语境里通常是目标快照，不是当前浏览器快照。
- `changeMap` 里 deleted 节点来自旧树，渲染时需要 `rebuildTreeWithDeleted(oldTree, newTree, changeMap)` 合回展示树。

## 3. 无稳定 ID 快照预览

这里的“无 ID”更准确地说是“无稳定 ID”。代码不会真的在完全无 ID 的对象上直接 diff，而是先把目标快照变成可比较树。

### 3.1 核心入口

| 算法 | 位置 | 角色 |
| --- | --- | --- |
| `ensureRestoreTreeIds(targetTree)` | `background.js` | 给缺 ID 节点补临时 ID，例如 `__restore_tmp_N` |
| `applyRestoreTopLevelRootIdRemap(targetTree, currentTree)` | `background.js` | 把目标快照的顶层根容器映射到当前浏览器根容器 |
| `normalizeTreeIds(targetTree, referenceTree, options)` | `background.js` | 尝试把目标快照节点 ID 改写成当前浏览器树中的对应 ID |
| `buildOverwriteRestoreDiffSummary(previousTree, currentTree)` | `background.js` / `history_html/history.js` | 覆盖恢复统计口径：旧树全删，目标树全加 |
| `buildOverwriteRestorePreview(...)` | `background.js` | popup overwrite、patch、auto 快照预览的后台主入口 |

`popup` 中 overwrite、patch、auto 快照恢复预览通过 `buildOverwriteRestorePreview` 消息调用后台；非 history changes-view 的 merge snapshot 预览也会复用这条结果树链路。后台流程是：

1. 从 `restoreRef` / `localPayload` 提取目标快照树。
2. `ensureRestoreTreeIds(targetTree)` 补齐 ID。
3. `applyRestoreTopLevelRootIdRemap(targetTree, currentTree)` 对齐顶层根。
4. `normalizeTreeIds(targetTree, currentTree, { referenceRootIds, strictGlobalUrlMatch: true })` 尝试映射节点身份。
5. 再根据策略生成 `diffSummary`、`changeEntries`、`targetTree`、`currentTree` 给 popup 使用；patch 预览会使用 `changeEntries` 生成视觉变化，overwrite 预览主要渲染目标树结果。

history changes-view 的 merge 预览是独立链路：popup 调用 `buildMergeRestorePreview`，后台从变化产物提取选定的简略/详细/集合树。它不属于下面这条“当前浏览器树 vs 归一化目标快照”的 patch/overwrite diff 主链。

### 3.2 normalizeTreeIds 如何映射节点

`normalizeTreeIds` 是启发式身份映射，不是强身份。

匹配顺序：

1. 原 ID 精确匹配，且书签/文件夹类型一致。
2. 手动匹配 `manualMatches`。这是 helper 能力；当前 `buildOverwriteRestorePreview()` 主链路只传 `referenceRootIds` 和 `strictGlobalUrlMatch`，没有传入 `manualMatches`。
3. 父子结构匹配：在已匹配父节点下，用同类型、标题、URL、index 等找唯一候选。
4. 全局 URL 匹配书签；`strictGlobalUrlMatch` 为 true 时，多候选不会随便取第一个。
5. 全局文件夹标题匹配。

多候选无法唯一确定时，`normalizeTreeIds()` 内部报告会记录 `ambiguous`；当前 `buildOverwriteRestorePreview()` 主链路没有把这份报告暴露给 popup 或执行层使用。

### 3.3 四种基础操作如何判断

无稳定 ID 快照预览分两层：

第一层是身份归一化：

- 能映射到当前树 ID 的目标节点，会被改写成当前树 ID。
- 不能映射的目标节点保留现有 ID；只有原本缺 ID 的节点才会保留 `ensureRestoreTreeIds()` 补入的临时 ID。
- `ambiguous` 说明候选不唯一，不能视为强匹配；但当前 popup 快照预览主链路不会把该报告展示为用户可处理的歧义列表。

第二层按策略生成展示：

| 策略 | 增加 | 删除 | 移动 | 修改 |
| --- | --- | --- | --- | --- |
| overwrite | 目标树内容全算增加；当前树内容全算删除 | 当前树内容全算删除 | 固定为 0 / false | 固定为 0 / false |
| patch / auto 解析为 patch | 归一化后仍只在目标树存在的 ID | 归一化后只在当前树存在的 ID | 同 ID 跨父级变化；同父级排序的视觉结果使用 LIS 推导 | 归一化后同 ID 标题或 URL 变化 |

patch/auto 预检需要进一步区分三种输出口径：

- auto 策略决策使用 `computeIdStrictRevertDiffSummary()`；同 ID 节点只要父级或原始 `index` 不同就计为 moved，因此同级被动位移也可能进入 `changeScore`。
- 返回给 popup 的 patch `diffSummary` 使用 `computeBookmarkGitDiffSummary()`；同级排序在 children 集合未变化时使用 LIS 推导最小 moved 集合。
- 返回给 popup 的 `changeEntries` 使用 `detectTreeChangesFastBg(..., { explicitMovedIdSet: null })`；同级排序同样走 LIS 视觉口径。

因此，auto 的 `changeScore`、patch 的 `diffSummary.movedCount`、`changeEntries` 中的 moved 数量不保证完全一致。前者服务策略选择，后两者服务摘要和视觉展示。

关键限制：

- `html` 和 `changes_artifact` 来源会被 `isRestoreSourceStableIdComparable()` 判为不适合稳定 ID patch。
- auto 遇到不稳定 ID 来源时，会倾向转为 overwrite。
- popup overwrite 预览倾向展示目标快照结果，不强调 moved/modified。

### 3.4 使用对象是否统一

无稳定 ID 快照预览里的对象语义也基本统一：

| 对象 | 语义 |
| --- | --- |
| `currentTree` | 浏览器当前书签树，操作前状态 |
| `targetTree` | 选中恢复来源提取出的目标快照，经过补 ID 和归一化 |
| `restoreRef` | 恢复来源描述，决定是否稳定 ID 可比 |
| `diffSummary` | 按最终策略生成的统计摘要 |
| `changeEntries` | 后台返回给 popup 的视觉变化条目；patch 预览会使用，overwrite 预览主要渲染目标快照树 |

需要注意：

- `targetTree` 会被就地改写 ID，因此它不是原始快照的逐字复制。
- `buildOverwriteRestoreDiffSummary(previousTree, currentTree)` 的参数名容易误读。在恢复预览语境中，它表达的是“删掉 previousTree，添加 currentTree”，通常实际传入的是“当前浏览器树、目标树”。
- `changeEntries` 即使由 ID 主键 diff 生成，也是在目标树已经经过无稳定 ID 归一化之后得到的，不等同于原始快照 ID 直接对比。

## 4. ID 与无稳定 ID 的核心对比

| 维度 | 有 ID 算法 | 无稳定 ID 快照预览 |
| --- | --- | --- |
| 核心假设 | 节点 `id` 是可信身份 | 原始 ID 不可信或缺失，需要先补 ID / 映射 ID |
| 主要范围 | `history.html` 里面的当前变化、撤销、history 本地恢复预览 | `popup` overwrite/patch/auto 快照预览及后台恢复预检；不含 changes-view merge 提取链路 |
| 增加/删除判断 | old/new 两棵树的 ID 集合差异 | overwrite 下按当前全删、目标全加；patch 下先归一化 ID 再按 ID 差异 |
| 移动判断 | 同 ID 父级变化；同父级排序用显式 moved ID 或 LIS | overwrite 不展示移动；patch 的视觉 diff 先归一化 ID，再对同级排序使用 LIS；auto 决策摘要会直接比较原始 index |
| 修改判断 | 同 ID 的 `title` 或 `url` 变化 | overwrite 不判断修改；patch 下先归一化 ID，再用 ID diff 判断 |
| 风险 | ID 不稳定时会把同一节点误看成删旧加新 | 重复 URL / 重复标题 / 同结构节点可能 ambiguous 或无法强匹配 |
| 安全边界 | 适合 patch/revert 这类需要精确执行的路径 | 适合恢复预览和 overwrite；changes-view merge 走独立提取链路，不稳定来源不应强行 patch |

一句话：

`history.html` 的预览基本处在 ID 体系里；`popup` 的 overwrite/patch/auto 快照预览面对更宽的恢复来源，因此先做补 ID 和身份归一化，再按策略展示。changes-view merge 则直接提取对应变化树。需要特别区分的是：预览可归一化目标树，不等于 patch 执行层会复用这棵归一化树；当前执行边界详见 `05--补丁撤销与补丁合并-历史计划.md`。

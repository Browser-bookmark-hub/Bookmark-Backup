---
title: 网页快照辅助工具高亮工具迁移完整计划
created: 2026-06-08
updated: 2026-06-08
target: /Users/kk/Downloads/chrome download/Bookmark-Backup/Bookmark-Backup-main
reference: /Users/kk/Downloads/new/222-pdf-new-branch/200
status: implementation-plan
---

# 网页快照辅助工具高亮工具迁移完整计划

## 1. 目标

把参考项目里的网页高亮核心能力迁移到本项目「网页快照辅助工具」中，作为一个按需注入的临时网页标注工具。

最终效果：

- 网页快照辅助工具标题栏增加 `高亮工具` 按钮。
- 初次打开网页快照辅助工具时，不加载高亮工具代码。
- 用户点击 `高亮工具` 后，后台才按需注入高亮工具 JS/CSS。
- 高亮工具只在普通网页启用，PDF 不启用。
- 高亮数据只在当前 tab 生命周期内临时保存。
- 数据跟随当前 tab + URL；URL 前进/后退回到同一 URL 时，应恢复该 URL 下的临时高亮。
- tab 关闭后，高亮数据全部清理。

## 2. 已确认决策

### 2.1 按钮位置

`高亮工具` 按钮放在网页快照辅助工具标题栏，和 `MD`、`MHTML` 同一排。

### 2.2 工具栏迁移范围

迁移参考项目底部悬浮工具栏的核心高亮工具体验：

- 选择颜色按钮
- 选择工具按钮
- 中间当前颜色/当前工具 indicator
- 删除按钮及其完整删除面板

说明：

- 颜色选择器、工具选择器、删除面板要尽量完整复制参考项目体验。
- 参考项目里的深色/浅色判断、矩阵点判断页面深浅的逻辑需要一并保留。
- 不迁移设置按钮、隐藏按钮、侧边栏管理入口、辅助线入口等与本次目标无关的按钮。

### 2.3 编辑模式工具

参考项目里的 `md-edit-*` 编辑模式工具先完整复制到工具选择器中，后续再一起修复和适配。

注意：

- 第一版可以让它们出现在工具选择器里。
- 若某些 `md-edit-*` 工具会破坏当前网页或与本项目 MD 工具冲突，后续单独修。
- 本次迁移不把编辑模式和 MD 导出深度打通。

### 2.4 删除功能

完整复制参考项目删除面板。

至少包括：

- 清除全部
- 清除视觉模式
- 清除编辑模式
- 批量删除

迁移时需要删除批注窗、辅助线、AI 相关调用点；删除面板里的文案和动作要改成只作用于本次迁移的临时高亮状态。

### 2.5 最近颜色/最近工具

最近颜色和最近工具跟随当前 tab + URL 临时保存。

要求：

- 同一个 tab 内，URL A 选择过的颜色/工具，切到 URL B 后不污染 URL B。
- 从 URL B 前进/后退回 URL A 时，恢复 URL A 的颜色/工具/高亮。
- tab 关闭后全部消失。
- 不使用参考项目长期 `chrome.storage.sync` 保存。

### 2.6 页面刷新

同一个 tab + 同一个 URL 刷新后，允许恢复临时高亮和当前工具状态。

理由：

- 这和本项目 MD 工具里的正文、模板体验接近。
- 只要 tab 没关、URL 没变成另一个页面，用户不应因为刷新丢掉临时工作。

### 2.7 MD 导出关系

本次不做高亮数据参与 MD 导出。

后续会单独参考：

```text
/Users/kk/Downloads/ 参考/obsidian-editing-toolbar-master
```

再结合迁移过来的编辑模式工具，设计 MD 工具和编辑工具的深度集成。

## 3. 不迁移范围

以下参考项目能力不进入本次迁移：

- PDF 高亮支持
- PDF helper 页面
- 左右辅助线
- 批注窗
- 批注连接线
- 高亮合集页面
- 侧边栏管理页面
- AI
- 全局黑名单和选项页管理
- 长期高亮仓库
- 参考项目 manifest 常驻 content script 模式

需要从参考代码中剥离或替换为空操作的对象：

- `initializePdfSupport`
- `pdfHandler`
- `pdfPageNumber`
- `ensureGuides`
- `guides`
- connector / fingerprint 相关逻辑
- `annotationBoxes`
- `createOrFocusAnnotation`
- `removeAnnotationByHighlightId`
- `window.AI_Core`
- AI message handler
- `refreshHighlightsManagement`
- `refreshStorageHighlightsList`
- `highlights_${url}` 长期存储

## 4. 目标目录

高亮工具必须新起独立目录，不和现有 `snapshot_helper_content.js` 混在一起。

推荐目录：

```text
dev_1/snapshot_highlighter/
  index.js
  styles.css
  storage.js
  toolbar.js
  color_picker.js
  tool_picker.js
  operations.js
  highlight_engine.js
  theme.js
  assets/
  vendor_reference/
```

各文件职责：

- `index.js`：入口。暴露 `window.__dev1SnapshotHighlighter`，管理初始化、显示、隐藏、销毁、重复注入保护。
- `styles.css`：高亮样式、工具栏样式、颜色/工具选择器样式、删除面板样式。
- `storage.js`：tab + URL 临时存储读写，URL hash namespace，迁移状态序列化。
- `toolbar.js`：底部悬浮工具栏、拖拽、当前颜色/工具 indicator。
- `color_picker.js`：颜色选择器，完整迁移参考项目分类、最近颜色、RGB/特殊颜色等必要逻辑。
- `tool_picker.js`：工具选择器，完整迁移参考项目工具分类，包括 `md-edit-*`。
- `operations.js`：删除面板、清空、批量删除。
- `highlight_engine.js`：选区监听、DOM 包装、恢复、删除、高亮序列化。
- `theme.js`：页面深浅色检测、矩阵采样、文字颜色对比、工具 UI 主题选择。
- `assets/`：只放本高亮工具需要的图标、光标或图片资源。
- `vendor_reference/`：第一步从参考项目完整复制过来的原始高亮相关代码，只作为本项目内的拆解来源，不直接接入运行路径。

第一版为了迁移速度，可以先合并成：

```text
dev_1/snapshot_highlighter/
  index.js
  styles.css
  assets/
  vendor_reference/
```

但目录仍必须独立，后续再拆分。

## 5. 迁移方法：先完整复制，再在本项目内拆除

本次迁移不采用“边看参考项目边一段一段手工摘函数”的方式。

推荐流程：

1. 先把参考项目中高亮工具相关的核心文件完整复制到本项目隔离目录：

```text
dev_1/snapshot_highlighter/vendor_reference/
  content.js
  highlight-styles.css
  ripple.css
  assets/
  images/
  locales/
```

2. 在本项目内从 `vendor_reference/content.js` 复制/改造出第一版 `index.js`。
3. 在本项目内从完整代码里删除不需要的 PDF、AI、批注窗、左右辅助线、侧边栏、高亮合集等逻辑。
4. 再把 `index.js` 按需要拆分成 `toolbar.js`、`color_picker.js`、`tool_picker.js`、`operations.js`、`highlight_engine.js`、`theme.js`。
5. 确认运行路径只引用拆好的 `index.js` / `styles.css`，不直接注入 `vendor_reference/content.js`。

这样做的原因：

- 参考项目 `content.js` 耦合很重，单独摘函数容易漏掉隐式依赖。
- 先完整复制到本项目后，可以用本项目的搜索、diff、语法检查逐步拆除。
- `vendor_reference/` 保留原始上下文，后续排查某个工具效果时可以直接对照。
- 只要 `vendor_reference/` 不进入注入路径，就不会把 PDF、AI、批注等不需要的功能带进运行时。

复制后第一轮应删除或断开的模块：

- PDF helper / PDF handler 相关分支。
- AI 初始化和消息处理。
- 批注窗和 connector。
- 左右辅助线、fingerprint。
- 侧边栏、高亮合集刷新消息。
- 长期 `highlights_${url}` 存储。

第一轮不强求把文件拆得很细。优先目标是：

- 在隔离目录里能运行高亮工具主流程。
- 按需注入路径清晰。
- 不加载不需要的 PDF/AI/批注/辅助线能力。
- 存储改成 tab + URL 临时状态。

## 6. 按需注入设计

### 6.1 初始注入

当前网页快照辅助工具仍按现有方式注入：

- `dev_1/mp4-muxer.js`
- `dev_1/tab_scoped_storage.js`
- `dev_1/snapshot_helper_content.js`

这里不注入高亮工具。

### 6.2 用户点击高亮工具

`snapshot_helper_content.js` 的 `高亮工具` 按钮发送：

```js
{
  action: 'dev1SnapshotHelperToggleHighlighter',
  item: this.config
}
```

后台处理流程：

1. 找到当前 tab。
2. 校验 URL 是 `http:` 或 `https:`。
3. 判断不是 PDF。
4. 注入 CSS：

```text
dev_1/snapshot_highlighter/styles.css
```

5. 注入 JS：

```text
dev_1/snapshot_highlighter/index.js
```

6. 调用：

```js
window.__dev1SnapshotHighlighter.toggle(config)
```

### 6.3 高亮工具 API

页面内暴露：

```js
window.__dev1SnapshotHighlighter = {
  show(config),
  hide(),
  toggle(config),
  destroy(),
  isVisible()
}
```

重复点击按钮时：

- 如果未注入：注入并显示。
- 如果已注入但隐藏：显示。
- 如果已显示：隐藏或收起，具体行为第一版可按参考项目体验决定。

## 7. 存储设计

### 7.1 基本原则

参考项目原来长期写：

```text
chrome.storage.local["highlights_${window.location.href}"]
chrome.storage.sync["selectedColor"]
chrome.storage.sync["batchTool"]
chrome.storage.sync["recentColors"]
chrome.storage.sync["recentTools"]
```

本项目不使用这些长期 key。

本项目使用 tab scoped 临时存储：

```text
dev1_scoped_{tabId}_snapshot_highlighter_page_{urlHash}
```

其中：

- `tabId` 来自 `config.existingTabId`
- `urlHash` 由当前完整 URL 计算
- entry 内仍记录完整 URL，用于读取时二次校验

### 7.2 为什么不能只用一个 namespace

如果只使用：

```text
dev1_scoped_{tabId}_snapshot_highlighter_state
```

那么 URL A 写入后，切到 URL B 会覆盖同一个 namespace。用户再前进/后退回 URL A，就无法恢复 URL A 的临时高亮。

所以需要按 URL 分 namespace：

```text
snapshot_highlighter_page_{urlHash}
```

这样同一个 tab 内可以同时保留多个历史 URL 的临时状态，直到 tab 关闭。

### 7.3 保存结构

```json
{
  "url": "https://example.com/article",
  "title": "Article title",
  "entries": [],
  "editFragments": [],
  "toolbar": {
    "color": "#69C0FF",
    "colorName": "Sky",
    "tool": "highlight",
    "toolName": "Classic Highlight",
    "colorVariant": "black"
  },
  "recentColors": [],
  "recentTools": [],
  "toolbarUi": {
    "position": "floating",
    "left": null,
    "top": null,
    "dockState": null
  },
  "updatedAt": 1710000000000
}
```

### 7.4 URL 变化行为

URL 从 A 变到 B：

- 保存 A 的当前状态到 `snapshot_highlighter_page_{hash(A)}`。
- 清除当前页面 DOM 中 A 的高亮元素。
- 切换内存状态到 B。
- 读取 `snapshot_highlighter_page_{hash(B)}`。
- 如果 B 有状态，恢复 B；否则显示空状态。

注意：

- URL 变化时不删除 A 的存储。
- 同 tab 内回到 A 时，应恢复 A。
- tab 关闭时统一删除该 tab 下所有 `dev1_scoped_{tabId}_snapshot_highlighter_*`。

### 7.5 刷新行为

同 tab + 同 URL 刷新：

- 新页面重新注入网页快照辅助工具后，如果用户再次打开高亮工具，则读取同 URL 的 state。
- 若高亮工具在页面 reload 前已打开，reload 后是否自动恢复取决于当前网页快照辅助工具是否重新注入；第一版不要求自动弹出，但要求点击后能恢复。

## 8. PDF 禁用策略

高亮工具按钮点击后先判断：

- 当前 URL 是否以 `.pdf` 结尾。
- 当前 URL 是否是本项目 `pdf-helper.html`。
- 页面是否疑似 Chrome 内置 PDF viewer。
- DOM 是否存在 PDF viewer 特征节点。

命中 PDF 时：

- 不注入高亮工具。
- 网页快照辅助工具面板内显示轻提示：

```text
PDF 页面不启用高亮工具
```

## 9. 参考代码拆除和保留清单

### 9.1 工具栏和 indicator

从参考项目 `content.js` 迁移并整理：

- `createPermanentToolbar`
- `createToolbarButton`
- `createIndicatorCapsule`
- `showIndicatorDetailsPanel`
- `updateIndicatorDetailsPanel`
- `getCurrentToolIcon`
- `getCurrentToolName`
- `getCurrentColorName`
- `updatePermanentToolbarIndicator`
- toolbar 拖拽相关逻辑

需要改造：

- 删除设置按钮。
- 删除隐藏全部按钮，除非后续明确需要。
- 删除 PDF safe bounds 逻辑。
- 删除辅助线/批注/AI 关联。
- 主题判断改用 `theme.js`，保留深浅色和矩阵采样。

### 9.2 颜色选择器

迁移：

- `showColorPicker`
- `showCategoryColors`
- `createColorOption`
- `createColorOptionWithVariant`
- `getAllColorCategories`
- 最近颜色逻辑
- RGB/特殊颜色逻辑
- 深浅色文字变体逻辑

需要改造：

- 所有 `chrome.storage.sync` 改为 `storage.js` 的 tab + URL 临时状态。
- 最近颜色只保存到当前 URL state。
- 保留页面深浅色判断和文字颜色自动对比。

### 9.3 工具选择器

迁移：

- `showToolPicker`
- `showCategoryTools`
- `createToolOption`
- `getAllToolCategories`
- `applyToolStyle`
- 最近工具逻辑
- `md-edit-*` 工具列表

需要改造：

- 所有长期同步 key 改成临时 state。
- PDF hidden/disabled 分支删除。
- `md-edit-*` 先保留，但其真正 MD 导出集成后续再做。

### 9.4 删除面板

迁移：

- `showOperationsPanel`
- `showClearAllConfirmation`
- `clearAllHighlights`
- `_clearEditFragmentsOnly`
- 批量删除相关 UI 和交互

需要改造：

- 删除批注、辅助线、connector 清理逻辑。
- 删除侧边栏刷新消息。
- 删除 AI/合集通知。
- 删除动作只作用于当前 tab + URL state。

### 9.5 高亮 DOM 引擎

迁移：

- 选区监听
- `highlightSelectedText`
- `createHighlight`
- `wrapRangeTextOnly`
- `_serializeHighlightParts`
- `recreateHighlightFromData`
- `restoreHighlightsWithRetry`
- `removeHighlight`
- `removeHighlightById`
- `applyHighlightStyles`
- 工具样式辅助函数

需要改造：

- 不写 `highlights_${url}`。
- 不发送高亮合集/侧边栏消息。
- 不创建批注。
- 不创建左右辅助线。
- 不调用 PDF 页码逻辑。
- 不调用 AI 上下文。

## 10. 样式迁移

从参考项目抽取：

- `highlight-styles.css` 中 `.custom-highlight` 基础样式。
- `.highlight-color-picker`
- `.highlight-tool-picker`
- `.permanent-toolbar`
- `.permanent-toolbar-indicator`
- `.operations-panel`
- 删除面板相关样式。
- 工具效果样式，例如：
  - underline / wavy / dashed
  - box / filled-box / rounded-box
  - neon / glow / gradient
  - dynamic effects
  - `tool-fluid`
  - `tool-neon-blink`
  - `tool-neon-flicker`

注意：

- 不迁移 `.annotation-box`。
- 不迁移 `.annotation-guide`。
- 不迁移 PDF 相关样式。
- 不迁移 AI 面板样式。

## 11. 本项目改动清单

### 11.1 `dev_1/snapshot_helper_content.js`

改动：

- 文案增加：
  - `highlight_tool`
  - `highlight_tooltip`
  - `highlight_tool_unavailable_pdf`
- 标题栏增加 `高亮工具` 按钮。
- 点击后发送 `dev1SnapshotHelperToggleHighlighter`。
- 根据后台返回结果显示轻提示。

不做：

- 不把高亮工具代码直接放进这个文件。
- 不在 `_renderPanel()` 时创建高亮工具 DOM。

### 11.2 `background.js`

改动：

- 增加 `dev1SnapshotHelperToggleHighlighter` 消息处理。
- 增加按需注入函数，例如：

```js
async function dev1ToggleSnapshotHighlighterForTab(tabId, config) {}
```

- 注入 CSS/JS 后调用页面 API。
- 增加 PDF 禁用判断。
- 增强 tab scoped 清理：tab 关闭时删除所有 `dev1_scoped_{tabId}_snapshot_highlighter_*`。

注意：

- 现有 `dev1_scoped_{tabId}_` 清理逻辑目前在部分复核窗口分支里，迁移时需要补成通用逻辑。
- 不要破坏 MD 工具现有 scoped storage。

### 11.3 `manifest.json`

原则上不需要把高亮工具注册为 content script。

可能需要确认：

- `web_accessible_resources` 是否需要暴露 `dev_1/snapshot_highlighter/assets/*`。
- 如果 CSS/JS 都通过 `chrome.scripting` 注入，通常不需要注册成常驻 content script。

### 11.4 新增目录

新增：

```text
dev_1/snapshot_highlighter/
dev_1/snapshot_highlighter/vendor_reference/
```

先把参考项目高亮相关文件完整复制到 `vendor_reference/`，再拆出运行文件。

## 12. 实施阶段

### 阶段 1：完整复制参考代码到隔离目录

目标：

- 建立 `dev_1/snapshot_highlighter/vendor_reference/`。
- 把参考项目高亮相关代码完整复制到该目录。
- 不接入运行路径。

建议复制：

```text
/Users/kk/Downloads/new/222-pdf-new-branch/200/content.js
/Users/kk/Downloads/new/222-pdf-new-branch/200/highlight-styles.css
/Users/kk/Downloads/new/222-pdf-new-branch/200/ripple.css
/Users/kk/Downloads/new/222-pdf-new-branch/200/assets/
/Users/kk/Downloads/new/222-pdf-new-branch/200/images/
/Users/kk/Downloads/new/222-pdf-new-branch/200/locales/
```

验收：

- `vendor_reference/` 中有完整参考代码。
- 本项目运行路径没有引用 `vendor_reference/content.js`。
- 本阶段不改变用户可见功能。

### 阶段 2：建立空壳和按需注入

目标：

- 建立 `dev_1/snapshot_highlighter/`。
- 暴露 `window.__dev1SnapshotHighlighter`。
- 网页快照辅助工具按钮能按需注入并切换空 toolbar。

验收：

- 打开网页快照辅助工具时，没有高亮工具 DOM。
- 点击 `高亮工具` 后才出现高亮工具。
- 再次点击可以关闭或收起。
- PDF 页面点击后不注入。

### 阶段 3：从完整副本拆出 toolbar、indicator、主题判断

目标：

- 迁移底部核心工具栏。
- 迁移当前颜色/工具 indicator。
- 迁移深浅色判断、矩阵点判断和文字对比逻辑。

验收：

- 浅色网页、深色网页下工具栏主题都正确。
- indicator 能显示当前颜色和当前工具。
- 工具栏不影响 MHTML、MD、截图、录屏。

### 阶段 4：从完整副本拆出颜色选择器和工具选择器

目标：

- 迁移完整颜色选择悬浮窗。
- 迁移完整工具选择悬浮窗。
- 保留 `md-edit-*` 工具。
- 最近颜色/最近工具写入当前 tab + URL state。

验收：

- 选择颜色后 indicator 更新。
- 选择工具后 indicator 更新。
- 切 URL 后不污染另一个 URL。
- 前进/后退回原 URL 后恢复最近颜色/工具。

### 阶段 5：从完整副本拆出高亮 DOM 引擎

目标：

- 选择文本后创建高亮。
- 按当前颜色和当前工具渲染。
- 支持恢复同 URL 的临时高亮。
- 支持删除单个高亮。

验收：

- 普通网页可以高亮。
- 多段文本选区可高亮。
- 高亮样式与参考项目一致。
- 页面刷新后点击高亮工具可恢复。
- URL 切换后当前 DOM 高亮清空。
- 返回旧 URL 后恢复旧 URL 高亮。

### 阶段 6：从完整副本拆出删除面板

目标：

- 完整复制参考项目删除面板体验。
- 清除全部、视觉模式、编辑模式、批量删除都接到本项目临时 state。

验收：

- 删除当前 URL 的高亮后 state 同步更新。
- 清除全部不影响同 tab 其他 URL 的 state。
- 批量删除不调用批注、辅助线、AI。

### 阶段 7：临时存储和清理收口

目标：

- 完成 URL hash namespace。
- 完成 tab 关闭清理。
- 完成 URL 切换保存/恢复。
- 去掉所有长期高亮 key 写入。

验收：

- `chrome.storage.local` 不出现参考项目 `highlights_${url}` 新数据。
- 不写 `chrome.storage.sync` 的颜色/工具长期 key。
- tab 关闭后没有残留 `dev1_scoped_{tabId}_snapshot_highlighter_*`。

### 阶段 8：回归验证

必须验证：

- 普通网页打开网页快照辅助工具。
- 点击 `高亮工具` 后才注入高亮工具。
- 选择颜色、选择工具、indicator、删除面板正常。
- 深浅色页面显示正常。
- URL 前进/后退恢复正确。
- 页面刷新恢复正确。
- tab 关闭清理正确。
- PDF 页面不可用。
- MD 工具仍正常。
- MHTML 保存仍正常。
- 区域截图、长截图、录屏仍正常。

## 13. 风险点

### 13.1 参考项目代码耦合很重

参考项目 `content.js` 把高亮、PDF、批注、辅助线、AI、截图、侧边栏管理放在同一个类里。不能整份复制接入。

处理方式：

- 先完整复制到 `vendor_reference/`。
- 再从本项目内的完整副本拆出高亮核心。
- 每拆出一个运行模块，就清理它依赖的无关调用。
- 对不迁移能力做空操作或彻底删除。

### 13.2 编辑模式工具可能和本项目 MD 工具冲突

本次先保留 `md-edit-*`，但不承诺完整 MD 导出集成。

处理方式：

- 首版只保证工具选择器可展示。
- 如果选择后影响高亮主流程，先保护普通高亮能力。
- 后续结合 Obsidian editing toolbar 参考项目单独设计。

### 13.3 URL 临时存储不能覆盖

如果沿用 MD 工具单 namespace 写法，前进/后退回旧 URL 会丢状态。

处理方式：

- 高亮工具使用 `snapshot_highlighter_page_{urlHash}`。
- URL 变化时只卸载当前 DOM，不删除旧 URL state。
- tab 关闭时统一清理。

### 13.4 页面 CSS 污染

参考项目大量使用全局 DOM 和内联样式，迁移后可能被网页 CSS 影响。

处理方式：

- 工具栏、picker、删除面板尽量使用固定 class + 高优先级样式。
- 样式文件限定在 `snapshot_highlighter` 前缀下。
- 避免和本项目 `dev1-helper-*` class 冲突。

## 14. 最终结论

本次迁移应采用“先完整复制到隔离目录 + 在本项目内拆除适配 + 按需注入 + tab/URL 临时状态”的方案。

不要：

- 不要把高亮工具常驻注入所有页面。
- 不要把高亮工具塞进 `snapshot_helper_content.js`。
- 不要把 PDF、批注、辅助线、AI 顺手带进来。
- 不要写参考项目长期 `highlights_${url}` 数据。
- 不要直接注入 `vendor_reference/content.js`。

要做：

- 先把参考项目核心文件完整复制到 `vendor_reference/`。
- 再从完整副本拆出运行模块。
- 点击 `高亮工具` 后再注入。
- 完整迁移颜色选择、工具选择、indicator、删除面板核心体验。
- 保留深浅色和矩阵采样判断。
- 先完整保留编辑模式工具，后续再做 MD 深度适配。
- 临时数据跟随 tab + URL，前进/后退可恢复，tab 关闭清理。

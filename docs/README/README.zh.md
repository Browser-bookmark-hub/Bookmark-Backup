## Switch to [English](../../README.md)...

[![Linux.do](https://img.shields.io/badge/Linux.do-Portfolio-FFD700?logo=discourse&logoColor=white)](https://linux.do/u/kk1/activity/portfolio)
[![GitHub Releases](https://img.shields.io/github/v/release/Browser-bookmark-hub/Bookmark-Backup?logo=github&logoColor=white&label=GitHub+Releases)](https://github.com/Browser-bookmark-hub/Bookmark-Backup/releases)
[![Microsoft Edge Add-ons](https://img.shields.io/badge/Edge_Add--ons-Available-0078D7?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/%E4%B9%A6%E7%AD%BE%E5%A4%87%E4%BB%BDbookmark-backup/klopopehpngheikchkjgkmplgmbfodek)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/dbdpgedioldmeooemjanbjlhgpocafbc?color=0F9D58&logo=googlechrome&logoColor=white&label=Chrome+Web+Store)](https://chromewebstore.google.com/detail/dbdpgedioldmeooemjanbjlhgpocafbc)

### 简介

`书签备份` 是一款面向 Chrome / Edge 的 Git 式书签版本管理、备份历史追踪与安全恢复扩展。

它把浏览器书签当作可持续留痕的版本资产：每次备份会形成带时间、指纹和快照数据的版本记录，既能保存完整书签树，也能记录当前变化与历史差异。你可以将这些版本同步到本地、WebDAV 或 GitHub 仓库，并在需要时按历史节点恢复、撤销或合并导入。

它也是 [书签画布（Bookmark-Canvas）](https://github.com/Browser-bookmark-hub/Bookmark-Canvas) 生态的关联项目，导出的 JSON 变化数据文件兼容书签画布导入的标签格式。

### 预览

#### 截图预览

| 主界面 | 设置与初始化 |
| :---: | :---: |
| <img src="../../Screenshots%20and%20icons/v3.6.5/主UI_v3.6.5%20zh.png" width="400"> | <img src="../../Screenshots%20and%20icons/v3.6.5/设置与初始化_v3.6.5%20zh.png" width="400"> |
| **当前变化** | **备份历史** |
| <img src="../../Screenshots%20and%20icons/v3.6.5/当前变化_v3.6.5%20zh.png" width="400"> | <img src="../../Screenshots%20and%20icons/v3.0/备份历史html%20zh.png" width="400"> |
| **网页存档** | **高亮工具** |
| <img src="../../Screenshots%20and%20icons/v3.5/网页存档zh.png" width="400"> | <img src="../../Screenshots%20and%20icons/v3.5/高亮工具zh.png" width="400"> |

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

### 路线图

- [ ] **语言增加与调试**：当前界面主要围绕简体中文与英文实现；繁体中文、法语、俄语、西班牙语、阿拉伯语、日语、韩语等语言需要补齐文案并逐页调试布局；README 翻译文档可以继续放在 [`docs/README/`](./)。详见 [`LIMITATIONS_AND_COMPROMISES.md`](../LIMITATIONS_AND_COMPROMISES.md)。
- [ ] **生态数据处理工具**：探索围绕备份、历史与网页快照导出数据的 CLI，用于校验、整理、转换及与书签画布互操作。不同于“书签记录与推荐”对独立客户端的探索，本项目优先考虑轻量、可组合的命令行工具。
- [ ] **后续外部变化跟踪**：持续跟踪浏览器更新、浏览器缺陷修复、相关 API 行为变化，以及 GitHub 哈希、上传限制等外部约束对本项目的影响。跟踪文档：[`LIMITATIONS_AND_COMPROMISES.md`](../LIMITATIONS_AND_COMPROMISES.md)。

### 相关文档

- [`PROJECT_STRUCTURE.md`](../PROJECT_STRUCTURE.md)：当前项目结构与主要模块说明。
- [`CHANGELOG.md`](../CHANGELOG.md)：完整版本更新记录。
- [`归档/19--恢复与导入合并后备份写出策略-已落地计划.md`](../归档/19--恢复与导入合并后备份写出策略-已落地计划.md)：恢复、导入合并等高危操作后的备份写出策略。
- [`归档/20--备份历史自动清理-已落地计划.md`](../归档/20--备份历史自动清理-已落地计划.md)：备份历史自动清理的实现计划与落地记录。
- [`LIMITATIONS_AND_COMPROMISES.md`](../LIMITATIONS_AND_COMPROMISES.md)：浏览器限制、功能妥协与兼容性说明。
- [`归档/00--归档索引-请先读.md`](../%E5%BD%92%E6%A1%A3/00--%E5%BD%92%E6%A1%A3%E7%B4%A2%E5%BC%95-%E8%AF%B7%E5%85%88%E8%AF%BB.md)：历史计划、审计与设计文档索引。

### 更新日志

> [!NOTE]
> #### v3.6.5
>
> **主要更新**
> - **重载/初始负载性能优化**（commit: `d685b5b`，tag: `重载get(null)优化`）：以轻量级 Key 注册表替代重载、启动和标签页清理时的 `storage.local.get(null)` 全库读取，明显降低大数据量下的浏览器卡顿；同时合并重复启动/安装监听，角标可在重载后自动恢复。
> - **备份历史自动清理**（commit: `afdb3c6`，tag: `备份历史--自动清理`）：新增默认关闭的历史自动清理设置，可按保留阈值和清理批量删除最旧记录，并同步清理分离的快照与变化数据；弹窗和历史页都会显示阈值、告警和清理状态。
> - **本地备份静默升级**（commit: `b177265`，tag: `静默`）：迁移到 Chrome 推荐的 `downloads.ui` / `chrome.downloads.setUiOptions()` 下载 UI 接口，并在下载完成、失败或后台恢复后主动还原界面。
> - **高危操作后续备份策略规范化**（commit: `c3c8675`，tag: `高危操作后续策略`）：恢复、补丁恢复、覆盖恢复和导入合并完成后，后续备份写出统一按当前 `Overwrite / Versioned` 设置执行，不再跟随来源记录策略；撤销链路保持不触发普通备份写出，只保留事务、临时安全快照和必要边界记录。
> - **新增书签画布变化数据兼容**（commit: `d5efb4e`，tag: `变化数据--书签画布格式`）：在原生变化数据 JSON 基础上新增可选「画布」格式，可将当前变化/历史变化导出为 [书签画布（Bookmark-Canvas）](https://github.com/Browser-bookmark-hub/Bookmark-Canvas) 可导入的临时栏目结构，并保留新增、删除、移动、修改标签；原格式保留，云端、本地、单文件和文件夹恢复流程同时识别两种 JSON。
>
> **其他改进**
> - **Markdown 正文定位与高亮工具优化**（commit: `1913b65`，tag: `md正文定位`）：改进辅助面板中的高亮工具、Markdown 格式处理和刷新逻辑；Markdown 正文目录定位更稳定。
> - **工程可维护性整理**（commit: `98cae09`，tag: `重构js`）：设置改为自动保存，修复辅助工具按钮跨页面兼容性；重组核心 JavaScript 注释与分区，清理拆分遗留的无用脚本，方便 AI 与开发者索引代码。
> - **恢复/导入合并安全措施落地说明**：高危写入前继续依赖确认、预演和临时安全快照；写入完成后只做从当前浏览器书签状态到本地、WebDAV 或 GitHub 目标的备份写出。策略正文见 [`恢复与导入合并后的备份写出策略计划`](../归档/19--恢复与导入合并后备份写出策略-已落地计划.md)。

### 核心算法

#### DIFF 判断以及实际 Bookmark API 应用

DIFF 的核心是把「当前书签树」和「目标书签树」拍平成 `id -> node`。有稳定 Bookmark ID 时，下面这些预览/对比都按同一套规则判断：同 ID 比内容和位置，旧树独有是删除，新树独有是新增。

- 当前变化页面的全量刷新对比。
- HTML 页面里撤销/恢复前的预览。
- 弹窗里撤销前的预览。

补丁撤销和补丁恢复使用同一个写入模型：给定「当前浏览器树」和「目标快照树」，把浏览器一步步改到目标快照。区别只在目标快照从哪里来：撤销的目标是上次备份，恢复的目标是用户选择的历史版本。

实际应用到浏览器时，对应四类 Chrome Bookmarks API 操作：

- `chrome.bookmarks.create()`：目标有、当前没有，补建节点。
- `chrome.bookmarks.remove()` / `chrome.bookmarks.removeTree()`：当前有、目标没有，删除节点。
- `chrome.bookmarks.move()`：同 ID 的父级或同级顺序不同，移动节点。
- `chrome.bookmarks.update()`：同 ID 的标题或 URL 不同，更新节点。

下面四个代码块是基于当前实现抽象出来的算法说明伪代码，不是源码中的真实函数：

```js
// Diff: 新增
// new 里有这个 id，old 里没有，说明目标状态多了一个节点。
function diffAdded(oldNodes, newNodes, changes) {
  for (const [id] of newNodes) {
    if (!oldNodes.has(id)) changes.set(id, { type: 'added' });
  }
}

// Apply: 补丁撤销/恢复时反向执行 -> chrome.bookmarks.create()
// 目标快照有、当前浏览器没有，就创建出来。
async function applyAdded(targetNode, parentId, idRemap) {
  const createdNode = await browserAPI.bookmarks.create({
    parentId,
    title: targetNode.title || '',
    ...(targetNode.url ? { url: String(targetNode.url || '') } : {})
  });
  idRemap.set(String(targetNode.id), String(createdNode.id));
  return createdNode;
}
```

```js
// Diff: 删除
// old 里有这个 id，new 里没有，说明目标状态已经移除了它。
function diffDeleted(oldNodes, newNodes, changes) {
  for (const [id] of oldNodes) {
    if (!newNodes.has(id)) changes.set(id, { type: 'deleted' });
  }
}

function getDeleteRoots(currentNodes, changes, protectedIds, depthById) {
  const deleteSet = new Set();
  for (const [id, change] of changes) {
    if (change.type === 'deleted' && !protectedIds.has(id)) deleteSet.add(id);
  }
  return [...deleteSet]
    .filter(id => {
      const parentId = currentNodes.get(id)?.parentId;
      return !parentId || !deleteSet.has(String(parentId));
    })
    .sort((a, b) => (depthById.get(b) || 0) - (depthById.get(a) || 0));
}

// Apply: 补丁撤销/恢复时反向执行 -> chrome.bookmarks.remove() / removeTree()
// 当前浏览器有、目标快照没有，就删除；文件夹递归删，书签单个删。
async function applyDeleted(deleteRoots, currentNodes) {
  for (const id of deleteRoots) {
    const currentNode = currentNodes.get(id);
    if (!currentNode) continue;
    if (currentNode.isFolder) await browserAPI.bookmarks.removeTree(id);
    else await browserAPI.bookmarks.remove(id);
  }
}
```

```js
// Diff: 移动
// 同一个 id 的 parentId 变了，就是跨文件夹移动。
// parentId 没变但同级顺序变了，用“显式 moved id”或 LIS 推导最小移动集合。
function mergeChangeType(currentType, nextType) {
  const types = new Set(`${currentType || ''}+${nextType}`.split('+').filter(Boolean));
  return ['added', 'deleted', 'modified', 'moved']
    .filter(type => types.has(type))
    .join('+');
}

function diffMoved(oldNode, newNode, changes, sameParentMovedIds = new Set()) {
  const id = String(newNode.id);
  const crossParent = oldNode.parentId !== newNode.parentId;
  if (!crossParent && !sameParentMovedIds.has(id)) return;

  const existing = changes.get(id) || {};
  changes.set(id, {
    ...existing,
    type: mergeChangeType(existing.type, 'moved'),
    moved: {
      oldParentId: oldNode.parentId,
      newParentId: newNode.parentId,
      oldIndex: oldNode.index,
      newIndex: newNode.index
    }
  });
}

// Apply: 补丁撤销/恢复时反向执行 -> chrome.bookmarks.move()
// 先放回目标父文件夹，再按目标 index 对齐同级顺序。
async function applyMoved(id, targetParentId, targetIndex, options = {}) {
  if (options.crossParent) {
    await browserAPI.bookmarks.move(id, { parentId: targetParentId });
  }
  if (options.needsReorder) {
    await browserAPI.bookmarks.move(id, { parentId: targetParentId, index: targetIndex });
  }
}
```

```js
// Diff: 修改
// 同一个 id 的 title 或 url 变了，说明节点内容被修改。
function diffModified(oldNode, newNode, changes) {
  if (oldNode.title !== newNode.title || oldNode.url !== newNode.url) {
    const id = String(newNode.id);
    const existing = changes.get(id) || {};
    changes.set(id, {
      ...existing,
      type: mergeChangeType(existing.type, 'modified')
    });
  }
}

// Apply: 补丁撤销/恢复时反向执行 -> chrome.bookmarks.update()
// 把当前浏览器节点更新成目标快照里的 title/url。
async function applyModified(id, currentNode, targetNode) {
  const currentIsBookmark = !!currentNode.url;
  const targetIsBookmark = !!targetNode.url;
  if (currentIsBookmark !== targetIsBookmark) {
    throw new Error('Node type mismatch; use overwrite restore.');
  }
  const payload = { title: targetNode.title || '' };
  if (targetIsBookmark) payload.url = String(targetNode.url || '');
  await browserAPI.bookmarks.update(id, payload);
}
```

主 UI 的恢复预览不把无 ID 的外部树强行解释成移动/修改 DIFF。覆盖恢复和自动模式走覆盖时，摘要里的绿色 `+` / 红色 `-` 是覆盖前后的数量对比：当前浏览器里的节点会被删除，目标快照里的节点会被创建；预览区直接渲染将要恢复成的目标快照树。导入合并预览则简单展示将导入到目标位置的新增内容，不删除现有书签。

### 数据与隐私

- 核心设置、状态、历史索引和缓存数据保存在浏览器本地存储中。
- WebDAV 和 GitHub 仓库备份只会写入用户自行配置的目标位置。
- 扩展会请求书签、存储、下载、标签页、窗口、网页捕获等权限，以实现备份、恢复、快照和辅助工具能力。
- favicon、网页快照和导出文件会根据用户操作生成或缓存，请按自己的隐私需求管理备份目标和下载目录。
- 详细的隐私处理原则与权限说明请参阅 [隐私政策](../../PRIVACY_POLICY.md)。

### 第三方开源与许可（网页快照 MD）

- 本项目网页快照 MD 导出能力移植自 **Obsidian Clipper**（MIT License）：https://github.com/obsidianmd/obsidian-clipper
- 核心依赖的转换算法来自其使用的 **defuddle**（同为 MIT 生态）并以兼容方式内置于扩展中。

---

## License

MIT. See [LICENSE](../../LICENSE).

## [返回顶部](#switch-to-english)

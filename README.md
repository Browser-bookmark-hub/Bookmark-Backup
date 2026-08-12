## Switch to [中文文档](docs/README/README.zh.md)...

[![Linux.do](https://img.shields.io/badge/Linux.do-Portfolio-FFD700?logo=discourse&logoColor=white)](https://linux.do/u/kk1/activity/portfolio)
[![GitHub Releases](https://img.shields.io/github/v/release/Browser-bookmark-hub/Bookmark-Backup?logo=github&logoColor=white&label=GitHub+Releases)](https://github.com/Browser-bookmark-hub/Bookmark-Backup/releases)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/dbdpgedioldmeooemjanbjlhgpocafbc?color=0F9D58&logo=googlechrome&logoColor=white&label=Chrome+Web+Store)](https://chromewebstore.google.com/detail/dbdpgedioldmeooemjanbjlhgpocafbc)
[![Microsoft Edge Add-ons](https://img.shields.io/badge/Edge_Add--ons-Available-0078D7?logo=microsoftedge&logoColor=white)](https://microsoftedge.microsoft.com/addons/detail/%E4%B9%A6%E7%AD%BE%E5%A4%87%E4%BB%BDbookmark-backup/klopopehpngheikchkjgkmplgmbfodek)
[![GitHub Bookmark-Canvas](https://img.shields.io/badge/GitHub-Bookmark--Canvas-181717?logo=github&logoColor=white)](https://github.com/Browser-bookmark-hub/Bookmark-Canvas) [![GitHub Bookmark-Record-Recommend](https://img.shields.io/badge/GitHub-Bookmark--Record--Recommend-181717?logo=github&logoColor=white)](https://github.com/Browser-bookmark-hub/Bookmark-Record-Recommend)

### Overview

`Bookmark-Backup` is a Git-style bookmark versioning, backup-history tracking, and safety-recovery extension for Chrome / Edge.

It treats the browser bookmark tree as a versioned asset. Each backup creates a time-stamped, fingerprinted snapshot/history record that can preserve the full bookmark tree and track current changes against historical states. These versions can be synced to local storage, WebDAV, or a GitHub repository, then used later for restore, revert, or import-merge workflows.

It is also an ecosystem-related project for [Bookmark-Canvas](https://github.com/Browser-bookmark-hub/Bookmark-Canvas), with exported JSON change-data files compatible with Bookmark Canvas import formats for tags.

### Preview

#### Screenshot Preview

| Main UI | Setup & Initialization |
| :---: | :---: |
| <img src="Screenshots%20and%20icons/v3.6.5/主UI_v3.6.5%20en.png" width="400"> | <img src="Screenshots%20and%20icons/v3.6.5/设置与初始化_v3.6.5%20en.png" width="400"> |
| **Current Changes** | **Backup History** |
| <img src="Screenshots%20and%20icons/v3.6.5/当前变化_v3.6.5%20en.png" width="400"> | <img src="Screenshots%20and%20icons/v3.0/备份历史html%20en.png" width="400"> |
| **Web Snapshot** | **Highlighter** |
| <img src="Screenshots%20and%20icons/v3.5/网页存档en.png" width="400"> | <img src="Screenshots%20and%20icons/v3.5/高亮工具en.png" width="400"> |

#### Bookmark Ecosystem

<table>
  <tr>
    <th width="33.33%"><a href="https://github.com/Browser-bookmark-hub/Bookmark-Canvas">Bookmark-Canvas</a></th>
    <th width="33.33%"><a href="https://github.com/Browser-bookmark-hub/Bookmark-Backup">Bookmark-Backup</a></th>
    <th width="33.33%"><a href="https://github.com/Browser-bookmark-hub/Bookmark-Record-Recommend">Bookmark-Record-Recommend</a></th>
  </tr>
  <tr>
    <td><img width="100%" alt="Bookmark Canvas Codex-processed workspace example" src="Screenshots%20and%20icons/Bookmark-Canvas-ecosystem/生态--书签画布--经过codex处理%20zh%20en.png"></td>
    <td><img width="100%" alt="Bookmark Backup export example" src="Screenshots%20and%20icons/Bookmark-Canvas-ecosystem/生态--书签备份--画布示例--当前变化%20zh%20en.png"></td>
    <td><img width="100%" alt="Bookmark Record and Recommend related-history example" src="Screenshots%20and%20icons/Bookmark-Canvas-ecosystem/生态--书签记录与推荐--画布示例--关联记录zh%20en.png"></td>
  </tr>
</table>

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

### Roadmap

- [ ] **More languages and UI QA**: the current UI is built around Simplified Chinese and English. Traditional Chinese, French, Russian, Spanish, Arabic, Japanese, Korean, and other languages need complete copy coverage and layout QA. README translations can be added under [`docs/README/`](docs/README/). See [`docs/LIMITATIONS_AND_COMPROMISES.md`](docs/LIMITATIONS_AND_COMPROMISES.md).
- [ ] **Ecosystem data tooling**: explore a CLI for validating, organizing, converting, and interoperating with backup, history, and web-snapshot exports. Unlike the possible standalone-client direction of Bookmark Record and Recommend, this project will prioritize small, composable command-line tools.
- [ ] **External-change follow-up tracking**: keep tracking browser updates, browser bug fixes, related API behavior changes, and external constraints such as GitHub hashes and upload limits that may affect this project. Tracking doc: [`docs/LIMITATIONS_AND_COMPROMISES.md`](docs/LIMITATIONS_AND_COMPROMISES.md).

### Docs

- [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md): current project structure and module map.
- [`docs/归档/19--恢复与导入合并后备份写出策略-已落地计划.md`](docs/归档/19--恢复与导入合并后备份写出策略-已落地计划.md): backup write policy after high-risk restore and import-merge operations.
- [`docs/归档/20--备份历史自动清理-已落地计划.md`](docs/归档/20--备份历史自动清理-已落地计划.md): implementation plan and landing notes for automatic backup-history cleanup.
- [`docs/LIMITATIONS_AND_COMPROMISES.md`](docs/LIMITATIONS_AND_COMPROMISES.md): browser limitations, implementation compromises, and compatibility notes.
- [`docs/归档/00--归档索引-请先读.md`](docs/%E5%BD%92%E6%A1%A3/00--%E5%BD%92%E6%A1%A3%E7%B4%A2%E5%BC%95-%E8%AF%B7%E5%85%88%E8%AF%BB.md): index of historical plans, audits, and design notes.

### Changelog

[GitHub Releases](https://github.com/Browser-bookmark-hub/Bookmark-Backup/releases)

### References

**External projects**

- [Obsidian Clipper](https://github.com/obsidianmd/obsidian-clipper) (MIT License)
- [`defuddle`](https://github.com/kepano/defuddle) conversion core, embedded in a compatible form (MIT ecosystem).

### Core Algorithm

#### DIFF Detection And Bookmark API Application

The DIFF core flattens the current bookmark tree and the target bookmark tree into `id -> node`. When stable Bookmark IDs are available, the following previews/comparisons use the same rule set: matching IDs compare content and position, nodes only in the old tree are deleted, and nodes only in the new tree are added.

- Full refresh comparison in the Current Changes page.
- Preview before revert/restore in the HTML page.
- Preview before revert in the popup.

Patch revert and patch restore use the same write model: given the current browser tree and the target snapshot tree, update the browser step by step until it matches the target snapshot. The only difference is where the target snapshot comes from: revert targets the last backup, while restore targets the user-selected history version.

When applied to the browser, the four operation types map to Chrome Bookmarks API calls:

- `chrome.bookmarks.create()`: the target has a node that the current browser does not have, so create it.
- `chrome.bookmarks.remove()` / `chrome.bookmarks.removeTree()`: the current browser has a node that the target does not have, so delete it.
- `chrome.bookmarks.move()`: the same ID has a different parent or sibling order, so move it.
- `chrome.bookmarks.update()`: the same ID has a different title or URL, so update it.

```js
// Diff: Added
// new has this id, old does not, so the target state contains one more node.
function diffAdded(oldNodes, newNodes, changes) {
  for (const [id] of newNodes) {
    if (!oldNodes.has(id)) changes.set(id, { type: 'added' });
  }
}

// Apply: reverse execution during patch revert/restore -> chrome.bookmarks.create()
// The target snapshot has it but the current browser does not, so create it.
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
// Diff: Deleted
// old has this id, new does not, so the target state has removed it.
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

// Apply: reverse execution during patch revert/restore -> chrome.bookmarks.remove() / removeTree()
// The current browser has it but the target snapshot does not, so delete it.
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
// Diff: Moved
// The same id has a different parentId, so it moved across folders.
// If parentId is unchanged but sibling order changed, explicit moved ids or LIS infer the minimal moved set.
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

// Apply: reverse execution during patch revert/restore -> chrome.bookmarks.move()
// Move it back to the target parent, then align sibling order by target index.
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
// Diff: Modified
// The same id has a different title or URL, so the node content changed.
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

// Apply: reverse execution during patch revert/restore -> chrome.bookmarks.update()
// Update the browser node to the title/url from the target snapshot.
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

The main UI restore preview does not force an external tree without IDs into a moved/modified DIFF. For overwrite restore, and for auto mode when it resolves to overwrite, the green `+` and red `-` in the summary are a before/after quantity comparison: current browser nodes will be deleted, and target snapshot nodes will be created; the preview area directly renders the target snapshot tree that will be restored. Import merge preview simply shows the new content that will be imported into the target location, without deleting existing bookmarks.

### Data & Privacy

- Core settings, states, history indexes, and caches are stored in browser local storage.
- WebDAV and GitHub backups are written only to targets configured by the user.
- Permissions include bookmarks, storage, downloads, tabs, windows, page capture, and related APIs to support backup, restore, snapshot, and helper features.
- Favicons, web snapshots, and exported files may be generated or cached according to user actions; manage backup targets and download folders according to your privacy needs.
- Please refer to the [Privacy Policy](PRIVACY_POLICY.md) for detailed principles and permission justifications.

---

## License

MIT. See [LICENSE](LICENSE).

## [Back to top](#switch-to-中文文档)

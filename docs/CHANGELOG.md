[简体中文](#简体中文) | [English](#english)

---

<a name="简体中文"></a>
# 版本更新日志

---

## v3.5.0

- **网页快照深度增强**：
  - 新增对 **高亮标记工具** 与 **Markdown (MD) 格式** 导出的支持，快照保存算法参考了 Obsidian Clipper。
  - 选择高亮工具时默认采用「MD 格式」的 `{==}` 格式，高亮标记可直接导出至 Markdown 文件中；而其他带有特殊样式效果的标记则可以直接在导出的 MHTML 快照中完整查看。
- **补丁算法重构与优化**：
  - 重构了**补丁恢复**与**补丁撤销**事务，引入了精确的节点差异合并算法以提高稳定性。自动切换阈值设定为 500 条。
  - 删除了原有的“中断恢复面板”及“后置校验机制”，将安全保护完全收拢至更稳定可靠的 **临时安全快照**。
- **UI 修正与快捷键重构**：
  - 优化并精简了配置设置页面，支持在记录中直观添加和显示备注。
  - 重构了全局快捷键（修改为 `Alt/Option + Shift` 组合键），避免与页面原有快捷操作发生冲突：
    - `Alt / Option + Shift + Z`：激活扩展（代替原 `Alt+A`）
    - `Alt / Option + Shift + C`：打开当前变化（代替原 `Alt+C`）
    - `Alt / Option + Shift + T`：打开备份历史（代替原 `Alt+H`）
    - `Alt / Option + Shift + X`：打开当前页快照工具（代替原 `Alt+W` / `Alt+1`）

<table>
  <tr>
    <td align="center" width="50%">
      <img width="380" alt="网页存档 zh" src="https://github.com/user-attachments/assets/75408a01-99e4-4592-922f-f39f3e353716" />
    </td>
    <td align="center" width="50%">
      <img width="380" alt="高亮工具 zh" src="https://github.com/user-attachments/assets/6427c56f-1ef1-4009-91c3-a465a931ae42" />
    </td>
  </tr>
</table>

---

## v3.0.6

- 优化扩展图标资源，修复商店版图标过大及部分环境无法解码的问题，并显著减小安装包体积。
- 新增当前页面快捷网页快照工具，并整理当前可用快捷键：
  - `Alt / Option + A`：激活扩展
  - `Alt / Option + C`：打开当前变化
  - `Alt / Option + H`：打开备份历史
  - `Alt / Option + W`：打开当前页快照工具（在当前焦点浏览页面中直接打开网页快照辅助悬浮窗）
- 优化网页快照 UI 与导出体验，调整并统一快照文件保存路径。

<table>
  <tr>
    <td align="center" width="33%">
      <img width="260" alt="录屏设置 zh" src="https://github.com/user-attachments/assets/6ff24a5c-af0f-4aa3-8b50-81c3725b28b1" />
    </td>
    <td align="center" width="33%">
      <img width="260" alt="网页快照悬浮窗 zh" src="https://github.com/user-attachments/assets/f5b2680b-cd4a-4a3b-bdd6-83632af9e950" />
    </td>
    <td align="center" width="33%">
      <img width="260" alt="长截图 zh" src="https://github.com/user-attachments/assets/5197fbc2-41c3-426d-b3a1-cb420082161b" />
    </td>
  </tr>
</table>

---

## v3.0

1. 新增云端 2：支持 GitHub Repo 备份，包含仓库、分支、Base Path、Token 配置与连接测试。
2. 新增设置与初始化：支持快照备份、当前变化归档、备份策略、HTML / JSON 格式和恢复到初始状态。
3. 新增当前变化页面：支持新增、删除、修改、移动的可视化查看，并提供简略、详细、集合视图和当前变化撤销。
4. 新增备份历史恢复：支持补丁恢复、覆盖恢复、导入合并、补丁撤销、覆盖撤销，并加入预演确认和临时安全快照。
5. 新增网页快照：支持从书签树、当前变化、所有窗口 Tab 选取范围，按树 / 域名 / 子域名筛选队列，并导出 Chrome 官方 MHTML 格式。
6. 稳定性优化：优化恢复/撤销事务保护、失败回滚、补丁降级、执行后校验，以及大批量书签下的懒加载、缓存、快速对比和智能移动检测。


## 📢 版本更新 v2.0

<img src="png/v2.0_setting.png" alt="动态提醒设置界面" width="500">

### 🐞 已修复的Bug

-   **✅ 核心状态刷新**：修复了在手动备份或切换模式后，扩展角标未能立即从黄色变回蓝色的问题，确保了状态的即时准确性。
-   **✅ 提醒逻辑健壮性**：修复了因重构计时器逻辑而意外导致「窗口焦点检测」功能失效和提醒通知无法弹出的严重回归问题。
-   **✅ 通知窗口功能**：修复了提醒通知窗口中的"切换模式"按钮有时不创建备份记录的问题，并消除了因竞态条件（Race Condition）获取窗口ID失败而产生的错误日志。
-   **✅ 首次运行体验**：修复了首次安装扩展时，角标和UI语言未能根据用户的浏览器语言环境自动设置的问题。
-   **✅ UI一致性**：统一并优化了主界面与通知设置界面中的多处文本描述、高亮及布局样式，提升了视觉一致性。

### 🚀 新增功能

-   **🌟 引入"内容与顺序感知"的深度指纹系统**：
    -   为解决"增删同等数量但不同内容的书签"无法被识别为变化的根本性问题，我们彻底重构了变化检测机制。
    -   现在，系统会为每一个书签和文件夹根据其**完整路径、名称、顺序及内容**生成一个独一无二的指纹。
        - **文件夹的身份指纹 = 它的完整路径（包括位置、顺序）+ 它的名称 + 它包含的内容（只限定数量，不限定内容的位置、顺序等）；**
        - **书签的身份指纹 = 它所在的完整路径 （包括位置、顺序）+ 它的名称 + 它的URL。**
    -   这使得扩展现在能够极度精确地捕捉到任何细微变化，包括仅调整顺序。只有当书签树状态与上次备份**完全一致**时，角标才会变回蓝色。
-   **🌟 实现智能缓存与后台预热，大幅提升UI响应速度**：
    -   为优化首次打开插件或书签数量庞大时的"观感速度"，我们引入了中央缓存机制。
    -   现在，书签状态分析结果会被缓存在内存中，并在浏览器启动或书签变动时在后台**静默更新**。
    -   用户点击图标时，UI能瞬间从缓存加载数据，实现了"秒开"的流畅体验，同时减少了不必要的重复计算。
-   **🌟 "循环提醒"计时器与角标状态深度绑定**：
    -   重构了提醒逻辑，将"循环提醒"功能的启动与停止，从原先的"切换模式"事件，改为与"角标颜色"直接关联。
    -   现在，只有当角标变为黄色（有变化）时，计时器才会启动；当角标变回蓝色（无变化）时，计时器则停止。这使得提醒功能更节能。

---

## 📢 版本更新 v1.5

<img src="png/v1.5.png" alt="v1.5 新功能界面" width="500">

### 🐞 已修复的Bug

-   **✅ 「多窗口计时兼容问题」**：
    -   修复了「循环提醒」计时器在多窗口环境下无法同步暂停与恢复的问题。
    -   使用 `chrome.windows.onFocusChanged` API 替换原有的 `chrome.idle` API，确保所有窗口失去焦点后才暂停提醒计时。
-   **🌟 增强角标状态控制**：
    -   只有在角标显示黄色（手动模式且发生结构/数量变化）时，才激活窗口焦点状态监听，减少系统资源占用和干扰。
-   **✅ 计时初始化前的判断优化**：
    -   修复了首次安装和自动模式下不必要的计时器初始化。
    -   仅在切换为手动备份模式后才进行初始化，避免冗余初始化。

### 🚀 新增功能

-   **🌟 备份检查记录--日期分割条目**：
    -   备份检查记录现支持每日分隔条目，并以蓝色椭圆形标记，便于区分不同日期。
    -   导出的txt记录格式优化：最新记录置于上方，日期分隔线采用Markdown横线形式，更清晰易读。
-   **🌟 备份检查记录--增加备注功能**：
    -   新增「时间与备注」栏，每条记录可添加备注（建议20字以下，分两行）。
    -   备注通过UI单独输入，不干扰原有功能。
    -   导出的txt记录显示备注。

---

<a name="english"></a>
# Release Notes

---

## v3.5.0

- **Enhanced Web Snapshot**:
  - Added support for **Highlighter tools** and **Markdown (MD) format** export, adopting the open-source algorithm from Obsidian Clipper.
  - Defaults to the MD-compatible `{==}` format for highlight selection, which can be exported directly into Markdown files; other styles with special effects can be fully preserved and viewed directly in exported MHTML snapshots.
- **Refactored Patch Algorithm & Optimization**:
  - Re-implemented **Patch Restore** and **Patch Revert** transactions by introducing a precise node diff merging algorithm to enhance stability. Set the automatic patch/overwrite switching threshold to 500 entries.
  - Removed the deprecated "Interrupted Restore Panel" and "Post-apply verification mechanism", centralizing risk mitigation into the more reliable **Temporary Safety Snapshot**.
- **UI Refinements & Shortcut Redesign**:
  - Streamlined the settings interface and added direct notes entry/display for history records.
  - Redesigned global extension shortcuts using `Alt/Option + Shift` combinations to prevent key conflicts with existing webpage functions:
    - `Alt / Option + Shift + Z`: Activate the extension (previously `Alt+A`)
    - `Alt / Option + Shift + C`: Open Current Changes (previously `Alt+C`)
    - `Alt / Option + Shift + T`: Open Backup History (previously `Alt+H`)
    - `Alt / Option + Shift + X`: Open Quick Snapshot Tool (previously `Alt+W` / `Alt+1`)

<table>
  <tr>
    <td align="center" width="50%">
      <img width="380" alt="Web Snapshot en" src="https://github.com/user-attachments/assets/5cc5762a-1544-4ad0-99db-282639295fa4" />
    </td>
    <td align="center" width="50%">
      <img width="380" alt="Highlighter en" src="https://github.com/user-attachments/assets/f2c527f9-8bc2-4474-a524-a33ef44989f4" />
    </td>
  </tr>
</table>

---

## v3.0.6

- Optimized extension icon assets, fixed oversized store icons and decoding issues in some environments, and significantly reduced package size.
- Added a quick Web Snapshot tool for the current page, with the available shortcuts organized as:
  - `Alt / Option + A`: Activate the extension
  - `Alt / Option + C`: Open Current Changes
  - `Alt / Option + H`: Open Backup History
  - `Alt / Option + W`: Open Quick Snapshot Tool (opens the Web Snapshot helper floating panel directly on the currently focused browsing page)
- Improved the Web Snapshot UI and export experience, with adjusted and unified snapshot file save paths.

<table>
  <tr>
    <td align="center" width="33%">
      <img width="260" alt="Recording settings en" src="https://github.com/user-attachments/assets/3c14627a-d757-4e33-930f-9090c7a09fd8" />
    </td>
    <td align="center" width="33%">
      <img width="260" alt="Web Snapshot floating panel en" src="https://github.com/user-attachments/assets/b632238e-2f1f-4200-81cc-e4b16465f554" />
    </td>
    <td align="center" width="33%">
      <img width="260" alt="Long screenshot en" src="https://github.com/user-attachments/assets/83cba3ed-dfd1-491e-912b-ae36406e906d" />
    </td>
  </tr>
</table>

---

## v3.0

1. Added Cloud 2: GitHub Repo backup with repository, branch, Base Path, Token setup, and connection testing.
2. Added settings and initialization options: snapshot backup, current changes archive, backup strategy, HTML / JSON formats, and reset to initial state.
3. Added Current Changes page: view added, deleted, modified, and moved bookmarks with Simple, Detailed, and Collection views, plus current-change revert.
4. Added Backup History restore: supports Patch Restore, Overwrite Restore, Import Merge, Patch Revert, Overwrite Revert, preflight confirmation, and temporary safety snapshots.
5. Added Web Snapshot: select capture scope from bookmark tree, current changes, or all window tabs, filter by tree / domain / subdomain, and export with Chrome’s official MHTML format.
6. Stability optimizations: improved restore/revert transaction protection, failure rollback, patch fallback, post-apply verification, lazy loading, caching, fast comparison, and smart move detection for large bookmark sets.


## 📢 Release Notes v2.0

<img src="png/v2.0_setting.png" alt="Dynamic Reminder Settings UI" width="500">

### 🐞 Bug Fixes

-   **✅ Core State Refresh**: Fixed an issue where the extension badge did not immediately refresh from yellow to blue after a manual backup or mode switch, ensuring instant state accuracy.
-   **✅ Reminder Logic Robustness**: Fixed a critical regression where refactoring timer logic accidentally disabled the "window focus detection" feature and prevented reminder notifications from appearing.
-   **✅ Notification Window Functionality**: Fixed an issue where the "switch mode" button in the reminder notification window sometimes failed to create a backup record, and eliminated error logs caused by a race condition when fetching the window ID.
-   **✅ First-Run Experience**: Fixed an issue where, on first install, the badge and UI language were not automatically set according to the user's browser language environment.
-   **✅ UI Consistency**: Unified and optimized multiple text descriptions, highlights, and layout styles in the main UI and notification settings UI, improving visual consistency.

### 🚀 New Features

-   **🌟 Introduced a "Content and Order-Aware" Deep Fingerprint System**:
    -   To solve the fundamental problem of not recognizing changes when an equal number of different bookmarks were added and deleted, we completely refactored the change detection mechanism.
    -   The system now generates a unique fingerprint for every bookmark and folder based on its **full path, name, order, and content**.
        - Folder's identity fingerprint = Its full path (incl. position & order) + its name + its contained content (by quantity only, ignoring internal order).
        - Bookmark's identity fingerprint = Its full path (incl. position & order) + its name + its URL.
    -   This allows the extension to capture any subtle change with extreme precision, including simple reordering. The badge will only turn blue when the bookmark tree state is **exactly identical** to the last backup.
-   **🌟 Implemented Smart Caching and Background Pre-heating, Significantly Improving UI Responsiveness**:
    -   To optimize the "perceived speed" when first opening the extension or with a large number of bookmarks, we introduced a central caching mechanism.
    -   The results of bookmark status analysis are now cached in memory and are **silently updated** in the background on browser start-up or when bookmarks change.
    -   When the user clicks the icon, the UI can instantly load data from the cache, achieving a smooth "instant-open" experience while reducing unnecessary repetitive calculations.
-   **🌟 "Loop Reminder" Timer Deeply Bound to Badge State**:
    -   Refactored the reminder logic, changing the start/stop trigger for the "Loop Reminder" feature from the previous "mode switch" event to a direct association with the "badge color".
    -   Now, the timer only starts when the badge turns yellow (has changes) and stops when it turns blue (no changes). This makes the reminder feature more power-efficient.

---

## 📢 Release Notes v1.5

<img src="png/v1.5.png" alt="v1.5 New Features UI" width="500"> 

### 🐞 Bug Fixes

-   **✅ Multi-window Timer Compatibility Issue**:
    -   Fixed an issue where the loop reminder timer did not synchronize pause and resume correctly in a multi-window environment.
    -   Replaced the original `chrome.idle` API with the `chrome.windows.onFocusChanged` API, ensuring the reminder timer pauses only when all windows lose focus.
-   **🌟 Enhanced Badge State Control**:
    -   Window focus monitoring activates only when the badge displays yellow (manual mode with structural/quantity changes), minimizing resource usage and user disruption.
-   **✅ Timer Initialization Optimization**:
    -   Fixed unnecessary timer initialization during first installation and in automatic mode.
    -   Initialization occurs only upon switching to manual backup mode to avoid redundant initialization.

### 🚀 New Features

-   **🌟 Backup Check Records - Daily Dividers**:
    -   Backup check records now include daily dividers marked with blue ovals for easier date differentiation.
    -   Optimized exported txt record format: newest entries appear at the top, with markdown-style horizontal lines for clearer readability.
-   **🌟 Backup Check Records - Notes Feature**:
    -   Added a "Time and Notes" column allowing each record to have notes (recommended under 20 characters, in two lines).
    -   Notes are entered separately via the UI, avoiding interference with existing features.
    -   Notes are included in exported txt records. 
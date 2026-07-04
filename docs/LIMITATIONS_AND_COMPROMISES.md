# Bookmark Backup 3.0 妥协与限制说明

本文档用于收纳不适合放在根目录 `README.md` 中展开的浏览器限制、功能妥协和兼容性说明。

## 限制四：防干扰：只在本地备份时隐藏下载栏

Edge 已改为自己的下载栏，这一策略在 Edge 上已经不适用。

- **Edge 下载 UI 已变化**：Edge 从底部的 **Download Shelf（下载栏）** 切换到了工具栏的 **Download Bubble / Flyout（下载浮窗）**。
- **API 目标是旧下载栏**：`setShelfEnabled` 和 `setUiOptions` 是针对 **Download Shelf** 设计的。
- **Edge 自有下载系统不响应**：Edge 的 **msDownloadsHub**（自有下载管理系统）不再响应这些 API。
- **Chrome 仍保持兼容**：Chrome 虽然也用了 Download Bubble，但仍保持了 API 兼容性；Edge 没有。

因此，“防干扰：备份时隐藏下载栏”只能作为 Chrome 兼容能力理解，且只应在本地备份产生下载时使用；在 Edge 上不应承诺可以隐藏下载浮窗。

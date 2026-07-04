# Bookmark Backup 3.0 项目结构

本文档用于补充根目录 `README.md` 中的简版结构预览，主要帮助快速定位 3.0 版本的核心模块。

## 顶层结构
```text
Bookmark-Backup-3.0/
|-- manifest.json                         [CORE] Manifest V3 配置，声明权限、后台 Service Worker、弹窗入口和快捷键。
|-- background.js                         [CORE] 后台中枢：备份、恢复、迁移、历史、缓存、角标、下载、消息与事件监听。
|-- popup.html                            [UI] 扩展主弹窗结构。
|-- popup.js                              [UI] 主弹窗交互逻辑、备份目标配置、状态展示、历史入口和初始化流程。
|-- theme.js                              [UI] 主题相关逻辑。
|-- safe_tabs.js                          [UTIL] 标签页安全调用辅助。
|-- github-token-guide.html               [UI] GitHub Token 配置说明页。
|-- github-token-guide.js                 [UI] GitHub Token 配置说明页交互脚本。
|-- _locales/                             [I18N] 浏览器扩展国际化资源。
|   |-- en/messages.json                  [I18N] 英文扩展名称、描述和工具栏标题。
|   \-- zh_CN/messages.json               [I18N] 中文扩展名称、描述和工具栏标题。
|-- auto_backup_timer/                    [CORE] 自动备份定时与设置模块。
|   |-- index.js                          [CORE] 自动备份定时入口。
|   |-- settings-ui.js                    [UI] 自动备份设置界面逻辑。
|   |-- storage.js                        [CORE] 自动备份设置存储。
|   \-- timer.js                          [CORE] 自动备份定时器逻辑。
|-- backup_reminder/                      [UI] 手动备份提醒系统。
|   |-- index.js                          [CORE] 提醒系统协调器。
|   |-- timer.js                          [CORE] 循环提醒、准点提醒和提醒状态计时。
|   |-- notification.js                   [CORE] 提醒通知窗口创建与生命周期管理。
|   |-- notification_popup.html           [UI] 提醒弹窗页面结构。
|   |-- notification_popup.js             [UI] 提醒弹窗交互、设置和国际化逻辑。
|   |-- notification_theme.js             [UI] 提醒弹窗早期主题应用。
|   \-- settings.css                      [UI] 提醒设置样式。
|-- history_html/                         [UI] 历史、当前变化、恢复与书签树页面。
|   |-- history.html                      [UI] 历史页面结构。
|   |-- history.js                        [UI] 历史页面主逻辑、当前变化、恢复、安全快照和视图切换。
|   |-- history.css                       [UI] 历史页面样式。
|   |-- history_bootstrap.js              [UI] 历史页面启动辅助。
|   |-- history_theme_bootstrap.js        [UI] 历史页面早期主题应用。
|   |-- bookmark_tree_context_menu.js     [UI] 书签树右键菜单与批量操作。
|   |-- bookmark_tree_drag_drop.js        [UI] 书签树拖拽排序与移动。
|   |-- pointer_drag.js                   [UTIL] 指针拖拽辅助。
|   |-- shortcuts_helpers.js              [UTIL] 快捷键辅助。
|   \-- search/                           [UI] 历史/当前变化/网页快照搜索面板。
|       |-- search.js                      [UI] 搜索逻辑。
|       \-- search.css                     [UI] 搜索样式。
|-- dev_1/                                [TOOLS] 网页快照与页面留存辅助工具。
|   |-- dev1.js                           [TOOLS] 网页快照队列、导出与页面桥接逻辑。
|   |-- dev1.css                          [TOOLS] 网页快照界面样式。
|   |-- snapshot_helper_content.js         [TOOLS] 页面内悬浮辅助面板、长截图和录屏辅助逻辑。
|   \-- mp4-muxer.js                      [TOOLS] 录屏导出辅助库。
|-- github/                               [SYNC] GitHub 仓库备份目标。
|   \-- repo-api.js                       [SYNC] GitHub 内容 API 封装。
|-- doc/                                  [DOC] 产品级说明、审计、恢复设计和结构文档。
|   |-- PROJECT_STRUCTURE.md              [DOC] 当前文件。
|   |-- LIMITATIONS_AND_COMPROMISES.md    [DOC] 浏览器限制、功能妥协与防干扰说明。
|   |-- plan-restore-transaction-recovery.md
|   \-- audit-2x-pre3x-bookmark-safety-2026-04-04.md
|-- docs/                                 [DOC] 迁移、网页快照和开发计划文档。
|   |-- plan-v2-to-v3-local-upgrade-migration-2026-05-06.md
|   |-- plan-dev1-existing-tab-review-2026-04-30.md
|   \-- plan-dev1-silent-capture-batch-zip-2026-04-20.md
|-- tools/                                [DEV] 开发维护脚本。
|-- icons/                                [ASSET] 扩展图标资源。
|-- webfonts/                             [ASSET] 字体图标资源。
|-- font-awesome.min.css                  [ASSET] Font Awesome 样式。
\-- LICENSE                               [DOC] MIT 许可文件。
```

## 模块定位
- **主流程入口**：`popup.html` / `popup.js` 负责用户操作入口，`background.js` 负责实际备份、恢复和事件处理。
- **历史与恢复入口**：`history_html/history.html` / `history_html/history.js` 承载备份历史、当前变化、书签树、搜索、恢复和安全快照。
- **提醒系统入口**：`backup_reminder/index.js` 协调提醒生命周期，`backup_reminder/timer.js` 处理提醒计时。
- **自动备份入口**：`auto_backup_timer/` 管理自动备份相关的定时与设置。
- **网页快照入口**：`dev_1/dev1.js` 管理网页快照队列和导出，`dev_1/snapshot_helper_content.js` 提供页面内辅助面板。
- **云端目标入口**：WebDAV 逻辑主要由后台流程处理，GitHub 仓库目标的 API 封装在 `github/repo-api.js`。

## 文档放置约定
- **根目录 `README.md`**：面向用户与项目访问者，保留简洁介绍、核心功能、安装说明和简版结构预览。
- **`doc/`**：放产品级说明、结构说明、恢复设计、安全审计等长期参考文档。
- **`docs/`**：放迁移方案、实验功能计划和开发过程记录。


// =============================================================================
// 国际化文本
// =============================================================================

const i18n = {
    pageTitle: {
        'zh_CN': '书签备份',
        'en': 'Bookmark Backup'
    },
    pageSubtitle: {
        'zh_CN': '',
        'en': ''
    },
    searchPlaceholder: {
        'zh_CN': '搜索书签、文件夹...',
        'en': 'Search bookmarks, folders...'
    },
    helpTooltip: {
        'zh_CN': '开源信息与快捷键',
        'en': 'Open Source Info & Shortcuts'
    },
    navCurrentChanges: {
        'zh_CN': '当前变化',
        'en': 'Current Changes'
    },
    navHistory: {
        'zh_CN': '备份历史',
        'en': 'Backup History'
    },
    navDev1: {
        'zh_CN': '网页存档',
        'en': 'Web Archive'
    },
    currentChangesViewTitle: {
        'zh_CN': '当前变化',
        'en': 'Current Changes'
    },
    historyViewTitle: {
        'zh_CN': '备份历史',
        'en': 'Backup History'
    },
    dev1ViewTitle: {
        'zh_CN': '网页存档',
        'en': 'Web Archive'
    },
    clearBackupHistoryTooltip: {
        'zh_CN': '清除记录',
        'en': 'Clear history'
    },
    clearBackupHistoryModalTitle: {
        'zh_CN': '清除记录',
        'en': 'Clear Records'
    },
    clearBackupHistoryModalDesc: {
        'zh_CN': '管理插件内部备份历史记录，不会删除云端或本地导出的备份文件。',
        'en': 'Manage internal backup history records only. Cloud backups and locally exported files will not be deleted.'
    },
    clearHistoryManualSectionTitle: {
        'zh_CN': '手动删除',
        'en': 'Manual deletion'
    },
    clearHistoryManualSectionDesc: {
        'zh_CN': '拖动范围选择要删除的记录。',
        'en': 'Drag the range to choose records to delete.'
    },
    clearHistoryAutoSectionTitle: {
        'zh_CN': '自动清理',
        'en': 'Auto cleanup'
    },
    clearHistoryAutoCleanupToggleLabel: {
        'zh_CN': '启用',
        'en': 'Enabled'
    },
    clearHistorySelectionLabel: {
        'zh_CN': '将删除条目',
        'en': 'Items to delete'
    },
    clearHistoryModePercentLabel: {
        'zh_CN': '按百分比删除',
        'en': 'Delete by percentage'
    },
    clearHistoryModeCountLabel: {
        'zh_CN': '按条数删除',
        'en': 'Delete by count'
    },
    clearHistoryPercentLabelBefore: {
        'zh_CN': '删除最旧的',
        'en': 'Delete the oldest'
    },
    clearHistoryCountLabelBefore: {
        'zh_CN': '删除最旧的',
        'en': 'Delete the oldest'
    },
    clearHistoryCountLabelAfter: {
        'zh_CN': '条记录',
        'en': 'records'
    },
    clearHistoryWarningThresholdTitle: {
        'zh_CN': '删除按钮颜色提醒阈值',
        'en': 'Delete button warning thresholds'
    },
    clearHistoryWarnYellowLabel: {
        'zh_CN': '淡黄色起始条数',
        'en': 'Yellow starts at'
    },
    clearHistoryWarnRedLabel: {
        'zh_CN': '淡红色起始条数',
        'en': 'Red starts at'
    },
    clearHistoryWarnThresholdHint: {
        'zh_CN': '默认 25 / 50，可手动修改。',
        'en': 'Defaults: 25 / 50. You can edit these values.'
    },
    clearBackupHistoryCancelBtn: {
        'zh_CN': '取消',
        'en': 'Cancel'
    },
    clearBackupHistoryConfirmBtn: {
        'zh_CN': '确认删除',
        'en': 'Confirm Delete'
    },
    clearBackupHistorySuccess: {
        'zh_CN': (deleted) => `已删除 ${deleted} 条历史记录`,
        'en': (deleted) => `Deleted ${deleted} history records`
    },
    clearBackupHistoryFailed: {
        'zh_CN': '删除历史记录失败',
        'en': 'Failed to delete history'
    },
    // 二次确认弹窗
    clearHistorySecondConfirmTitle: {
        'zh_CN': '确认删除',
        'en': 'Confirm Delete'
    },
    clearHistorySecondConfirmPrefix: {
        'zh_CN': '即将删除',
        'en': 'About to delete'
    },
    clearHistorySecondConfirmSuffix: {
        'zh_CN': '条记录',
        'en': 'records'
    },
    clearHistorySecondConfirmWarning: {
        'zh_CN': '此操作不可撤销，建议先备份再删除',
        'en': 'This action cannot be undone. We recommend exporting first.'
    },
    clearHistoryExportFirstBtn: {
        'zh_CN': '先备份这些记录',
        'en': 'Export these records first'
    },
    clearHistoryDirectDeleteBtn: {
        'zh_CN': '直接删除',
        'en': 'Delete directly'
    },
    clearHistorySecondConfirmCancelBtn: {
        'zh_CN': '返回修改',
        'en': 'Go back'
    },
    historySlimmingSettingsTitle: {
        'zh_CN': '精简设置',
        'en': 'Compaction Settings'
    },
    historySlimmingSettingsDescription: {
        'zh_CN': '选择写入<span style="color: #f97316; font-weight: 500;">插件内部存储（chrome.storage）</span>的历史详情数据。未勾选的数据将不会被保存，以节省<span style="color: #f97316; font-weight: 500;">浏览器</span>的存储空间。',
        'en': 'Choose which detailed history data to write to the <span style="color: #f97316; font-weight: 500;">extension\'s internal storage (chrome.storage)</span>. Unchecked data will not be saved to save <span style="color: #f97316; font-weight: 500;">browser</span> storage space.'
    },
    historySlimmingSettingsStrategyDescription: {
        'zh_CN': '',
        'en': ''
    },
    historySlimmingSaveSnapshotData: {
        'zh_CN': '保存快照数据',
        'en': 'Save snapshot data'
    },
    historySlimmingSaveChangeData: {
        'zh_CN': '保存变化数据',
        'en': 'Save change data'
    },
    historyAutoCleanupEnabled: {
        'zh_CN': '自动清理',
        'en': 'Auto cleanup'
    },
    historyAutoCleanupThreshold: {
        'zh_CN': '阈值/保留最新',
        'en': 'Threshold / keep latest'
    },
    historyAutoCleanupBatch: {
        'zh_CN': '触发清理条数',
        'en': 'Cleanup batch size'
    },
    historyAutoCleanupHint: {
        'zh_CN': '启用后，记录数达到“阈值 + 清理条数”时会在后台截取到阈值。仅清理插件内部备份历史记录。',
        'en': 'When enabled, records are trimmed in the background after the count reaches threshold + batch size. This only removes internal backup history records.'
    },
    historyAutoCleanupConfirm: {
        'zh_CN': (total, threshold, deleted) => `当前已有 ${total} 条备份历史。启用自动清理后将保留最新 ${threshold} 条，并删除最旧的 ${deleted} 条。是否继续？`,
        'en': (total, threshold, deleted) => `There are ${total} backup history records. Enabling auto cleanup will keep the newest ${threshold} records and delete the oldest ${deleted}. Continue?`
    },
    historySlimmingSettingsSaved: {
        'zh_CN': '精简设置已保存',
        'en': 'Compaction settings saved'
    },
    historyAutoCleanupSettingsSaved: {
        'zh_CN': '自动清理设置已保存',
        'en': 'Auto cleanup settings saved'
    },
    historyAutoCleanupDeleted: {
        'zh_CN': (deleted) => `自动清理已保存，已删除 ${deleted} 条旧记录`,
        'en': (deleted) => `Auto cleanup saved. Deleted ${deleted} old records`
    },
    historySlimmingSettingsSaveFailed: {
        'zh_CN': '保存精简设置失败',
        'en': 'Failed to save compaction settings'
    },
    historyAutoCleanupSettingsSaveFailed: {
        'zh_CN': '保存自动清理设置失败',
        'en': 'Failed to save auto cleanup settings'
    },
    historySafetyCheckpointTitle: {
        'zh_CN': '临时安全快照',
        'en': 'Temporary Safety Snapshot'
    },
    historySafetyCheckpointSectionTitle: {
        'zh_CN': '最近一次高危操作快照',
        'en': 'Latest High-Risk Operation Checkpoint'
    },
    historySafetyCheckpointEmpty: {
        'zh_CN': '暂无临时安全快照',
        'en': 'No temporary safety snapshot available'
    },
    historySafetyCheckpointLoading: {
        'zh_CN': '正在加载临时安全快照状态...',
        'en': 'Loading temporary safety snapshot status...'
    },
    historySafetyCheckpointExportBtn: {
        'zh_CN': '导出所选快照',
        'en': 'Export Selected Snapshots'
    },
    historySafetyCheckpointExporting: {
        'zh_CN': '正在导出所选快照...',
        'en': 'Exporting selected snapshots...'
    },
    historySafetyCheckpointExportSuccess: {
        'zh_CN': (count) => `已导出所选快照，共 ${count} 个文件`,
        'en': (count) => `Selected safety snapshot(s) exported: ${count} file(s)`
    },
    historySafetyCheckpointExportFailed: {
        'zh_CN': '导出所选快照失败',
        'en': 'Failed to export selected snapshots'
    },
    historySafetyCheckpointExportOptionsTitle: {
        'zh_CN': '选择导出内容',
        'en': 'Select Export Content'
    },
    historySafetyCheckpointExportAll: {
        'zh_CN': '全部',
        'en': 'All'
    },
    historySafetyCheckpointExportBefore: {
        'zh_CN': '操作前浏览器快照',
        'en': 'Before Operation Browser Snapshot'
    },
    historySafetyCheckpointExportTarget: {
        'zh_CN': '目标状态快照',
        'en': 'Target State Snapshot'
    },
    historySafetyCheckpointExportCurrent: {
        'zh_CN': '当前浏览器快照',
        'en': 'Current Browser Snapshot'
    },
    historySafetyCheckpointSelectOne: {
        'zh_CN': '请至少选择一个要导出的快照',
        'en': 'Select at least one snapshot to export'
    },
    historySafetyCheckpointOperationKind: {
        'zh_CN': '操作类型',
        'en': 'Operation'
    },
    historySafetyCheckpointSource: {
        'zh_CN': '来源',
        'en': 'Source'
    },
    historySafetyCheckpointDisplayTitle: {
        'zh_CN': '标题',
        'en': 'Title'
    },
    historySafetyCheckpointCreatedAt: {
        'zh_CN': '创建时间',
        'en': 'Created'
    },
    historySafetyCheckpointBeforeNodeCount: {
        'zh_CN': '变更前节点数',
        'en': 'Before nodes'
    },
    historySafetyCheckpointTargetNodeCount: {
        'zh_CN': '目标节点数',
        'en': 'Target nodes'
    },
    historySafetyCheckpointSessionId: {
        'zh_CN': '会话 ID',
        'en': 'Session ID'
    },
    modalTitle: {
        'zh_CN': '变化详情',
        'en': 'Change Details'
    },
    shortcutsModalTitle: {
        'zh_CN': '开源信息与快捷键',
        'en': 'Open Source Info & Shortcuts'
    },
    openSourceGithubLabel: {
        'zh_CN': 'GitHub 仓库:',
        'en': 'GitHub Repository:'
    },
    openSourceIssueLabel: {
        'zh_CN': '问题反馈:',
        'en': 'Feedback / Issues:'
    },
    openSourceIssueText: {
        'zh_CN': '提交问题',
        'en': 'Submit Issue'
    },
    shortcutsTitle: {
        'zh_CN': '当前可用快捷键',
        'en': 'Available Shortcuts'
    },
    shortcutsTableHeaderKey: {
        'zh_CN': '按键',
        'en': 'Key'
    },
    shortcutsTableHeaderAction: {
        'zh_CN': '功能',
        'en': 'Action'
    },
    shortcutsSettingsTooltip: {
        'zh_CN': '在浏览器中管理快捷键',
        'en': 'Manage shortcuts in browser'
    },
    shortcutCurrentChanges: {
        'zh_CN': '打开「当前变化」视图',
        'en': 'Open "Current Changes" view'
    },
    shortcutHistory: {
        'zh_CN': '打开「备份历史」视图',
        'en': 'Open "Backup History" view'
    },
    closeShortcutsText: {
        'zh_CN': '关闭',
        'en': 'Close'
    },
    autoBackup: {
        'zh_CN': '自动',
        'en': 'Auto'
    },
    manualBackup: {
        'zh_CN': '手动',
        'en': 'Manual'
    },
    added: {
        'zh_CN': '新增',
        'en': 'Added'
    },
    deleted: {
        'zh_CN': '删除',
        'en': 'Deleted'
    },
    modified: {
        'zh_CN': '修改',
        'en': 'Modified'
    },
    moved: {
        'zh_CN': '移动',
        'en': 'Moved'
    },
    bookmarks: {
        'zh_CN': '书签',
        'en': 'bookmarks'
    },
    folders: {
        'zh_CN': '文件夹',
        'en': 'folders'
    },
    noChanges: {
        'zh_CN': '无变化',
        'en': 'No changes'
    },
    noChangesDesc: {
        'zh_CN': '当前没有未备份的书签变化',
        'en': 'No unbacked bookmark changes'
    },
    emptyHistory: {
        'zh_CN': '暂无备份记录',
        'en': 'No backup records'
    },
    globalExport: {
        'zh_CN': '全局导出',
        'en': 'Global Export'
    },
    globalExportModalTitle: {
        'zh_CN': '全局备份导出',
        'en': 'Global Backup Export'
    },
    globalExportFormatTitle: {
        'zh_CN': '导出格式',
        'en': 'Export Format'
    },
    globalExportFormatHint: {
        'zh_CN': 'HTML / JSON 二选一，同时作用于快照和变化记录；导出结果统一为 ZIP 归档',
        'en': 'Choose either HTML or JSON for snapshots and change records; export always generates a ZIP archive'
    },
    globalExportContentTitle: {
        'zh_CN': '导出内容',
        'en': 'Export Content'
    },
    globalExportContentSnapshot: {
        'zh_CN': '快照',
        'en': 'Snapshot'
    },
    globalExportContentChanges: {
        'zh_CN': '变化记录',
        'en': 'Change Records'
    },
    globalExportContentIndex: {
        'zh_CN': '索引文件',
        'en': 'Index Files'
    },
    globalExportContentHint: {
        'zh_CN': '选择快照或变化记录时会自动附带备份历史log.md。ZIP 下载路径为：书签备份/手动导出/备份历史。',
        'en': 'Selecting snapshot or change records automatically includes backup-history-log.md. ZIP downloads to: Bookmark Backup/Manual Export/Backup_History.'
    },
    globalExportSelectTitle: {
        'zh_CN': '选择备份记录',
        'en': 'Select Backup Records'
    },
    globalExportRangeEnabledText: {
        'zh_CN': '自动勾选',
        'en': 'Auto select'
    },
    globalExportThSeq: {
        'zh_CN': '位置',
        'en': 'Position'
    },
    globalExportThNote: {
        'zh_CN': '备注',
        'en': 'Note'
    },
    globalExportThHash: {
        'zh_CN': '哈希值',
        'en': 'Hash'
    },
    globalExportThStored: {
        'zh_CN': '条目内容',
        'en': 'Stored Data'
    },
    globalExportThViewMode: {
        'zh_CN': '变化记录视图',
        'en': 'Change Records View'
    },
    globalExportThTime: {
        'zh_CN': '时间',
        'en': 'Time'
    },
    globalExportCancel: {
        'zh_CN': '取消',
        'en': 'Cancel'
    },
    globalExportConfirm: {
        'zh_CN': '导出选中项',
        'en': 'Export Selected'
    },

    historyDetailModeSimple: {
        'zh_CN': '简略',
        'en': 'Simple'
    },
    historyDetailModeDetailed: {
        'zh_CN': '详细',
        'en': 'Detailed'
    },
    historyDetailModeCollection: {
        'zh_CN': '集合',
        'en': 'Collection'
    },
    revertConfirmTitle: {
        'zh_CN': '确认撤销全部变化？',
        'en': 'Revert all changes?'
    },
    revertConfirmDesc: {
        'zh_CN': '这将撤销所有未提交的变化（新增/删除/修改/移动），并恢复到上次备份状态。此操作不可撤销。',
        'en': 'This will revert all uncommitted changes (add/delete/modify/move) and restore to the last backup. This cannot be undone.'
    },
    revertSuccess: {
        'zh_CN': '已撤销全部变化，已恢复到上次备份',
        'en': 'All changes reverted. Restored to last backup.'
    },
    revertFailed: {
        'zh_CN': '撤销失败：',
        'en': 'Revert failed: '
    },
    revertNoBackup: {
        'zh_CN': '没有可用的备份快照，无法撤销',
        'en': 'No backup snapshot available. Cannot revert.'
    },
    revertDisabledTip: {
        'zh_CN': '需先有备份',
        'en': 'Backup required'
    },
    revertModalTitle: {
        'zh_CN': '撤销全部变化',
        'en': 'Revert All Changes'
    },
    revertSnapshotBadge: {
        'zh_CN': '快照',
        'en': 'Snapshot'
    },
    revertSnapshotReady: {
        'zh_CN': '参考快照：已就绪',
        'en': 'Snapshot: Ready'
    },
    revertSnapshotMissing: {
        'zh_CN': '参考快照：缺失',
        'en': 'Snapshot: Missing'
    },
    revertSnapshotSubReady: {
        'zh_CN': '来源：上次备份快照',
        'en': 'Source: last backup snapshot'
    },
    revertSnapshotSubMissing: {
        'zh_CN': '请先创建备份作为参考快照',
        'en': 'Create a backup to generate a reference snapshot'
    },
    revertSnapshotTimeLabel: {
        'zh_CN': '快照时间：',
        'en': 'Snapshot Time: '
    },
    revertSnapshotNoTime: {
        'zh_CN': '无可用快照',
        'en': 'No snapshot available'
    },
    revertCurrentLabel: {
        'zh_CN': '当前浏览器',
        'en': 'Current Browser'
    },
    revertSnapshotLabel: {
        'zh_CN': '参考快照',
        'en': 'Snapshot'
    },
    revertBookmarksLabel: {
        'zh_CN': '书签',
        'en': 'Bookmarks'
    },
    revertFoldersLabel: {
        'zh_CN': '文件夹',
        'en': 'Folders'
    },
    revertPreviewTitle: {
        'zh_CN': '预览',
        'en': 'Preview'
    },
    revertPreviewSubOverwrite: {
        'zh_CN': '快照覆盖预览',
        'en': 'Snapshot overwrite preview'
    },
    revertPreviewSubPatch: {
        'zh_CN': '补丁撤销预览',
        'en': 'Patch revert preview'
    },
    revertPreviewHelpBtnTitle: {
        'zh_CN': '补丁撤销说明',
        'en': 'Patch Revert Notes'
    },
    revertPreviewHelpExecLine: {
        'zh_CN': '执行层：底层按真实数据执行新增/删除/移动/修改，结果以实际书签树为准。',
        'en': 'Execution layer: add/delete/move/modify runs on real bookmark data, and the actual bookmark tree is the source of truth.'
    },
    revertPreviewHelpDisplayLine: {
        'zh_CN': '展示层：预览仅展示手动操作项（例如手动移动的 3 项），不展开显示被动联动位移。',
        'en': 'Display layer: preview only shows explicit manual operations (for example, 3 moved items), and does not expand passive linked shifts.'
    },
    revertStrategyAuto: {
        'zh_CN': '自动模式',
        'en': 'Auto Mode'
    },
    revertStrategyManual: {
        'zh_CN': '手动模式',
        'en': 'Manual Mode'
    },
    revertStrategyPatch: {
        'zh_CN': '补丁撤销',
        'en': 'Patch Revert'
    },
    revertStrategyOverwrite: {
        'zh_CN': '覆盖撤销',
        'en': 'Overwrite Revert'
    },
    revertPatchDescription: {
        'zh_CN': '补丁撤销说明：仅按 ID 匹配；ID 匹配执行新增/删除/移动/修改，ID 不匹配时按删除/新增处理。',
        'en': 'Patch revert note: match by ID only; matching IDs support add/delete/move/modify, non-matching IDs are handled as delete/create.'
    },
    revertThresholdText: {
        'zh_CN': '智能阈值',
        'en': 'Smart Threshold'
    },
    revertThresholdTip: {
        'zh_CN': '智能模式下：变化占比 ≤ 阈值 走补丁撤销，> 阈值 走覆盖撤销。',
        'en': 'In Smart mode: uses patch when change ratio is ≤ threshold, otherwise overwrite.'
    },
    revertConfirm: {
        'zh_CN': '撤销',
        'en': 'Revert'
    },
    revertCancel: {
        'zh_CN': '取消',
        'en': 'Cancel'
    },
    emptyTree: {
        'zh_CN': '无法加载书签树',
        'en': 'Unable to load bookmark tree'
    },
    loading: {
        'zh_CN': '加载中...',
        'en': 'Loading...'
    },
    refreshTooltip: {
        'zh_CN': '刷新',
        'en': 'Refresh'
    },
    themeTooltip: {
        'zh_CN': '切换主题',
        'en': 'Toggle Theme'
    },
    langTooltip: {
        'zh_CN': '切换语言',
        'en': 'Switch Language'
    },
    noChanges: {
        'zh_CN': '无变化',
        'en': 'No changes'
    },
    firstBackup: {
        'zh_CN': '首次备份',
        'en': 'First Backup'
    },
    bookmarkGitTitle: {
        'zh_CN': '书签备份',
        'en': 'Bookmark Backup'
    },
    // ==================== 导出变化功能翻译 ====================
    exportChangesModalTitle: {
        'zh_CN': '导出书签变化',
        'en': 'Export Bookmark Changes'
    },
    exportChangesFormatLabel: {
        'zh_CN': '导出格式',
        'en': 'Export Format'
    },
    exportChangesLegendHelp: {
        'zh_CN': '标记说明',
        'en': 'Legend'
    },
    exportChangesLegendTitle: {
        'zh_CN': '标记说明：',
        'en': 'Legend:'
    },
    exportChangesModeLabel: {
        'zh_CN': '导出模式',
        'en': 'Export Mode'
    },
    exportChangesModeSimple: {
        'zh_CN': '简略',
        'en': 'Simple'
    },
    exportChangesModeDetailed: {
        'zh_CN': '详细',
        'en': 'Detailed'
    },
    exportChangesModeCollection: {
        'zh_CN': '集合',
        'en': 'Collection'
    },
    exportChangesModeHelp: {
        'zh_CN': '模式说明',
        'en': 'Mode Help'
    },
    exportChangesActionLabel: {
        'zh_CN': '操作方式',
        'en': 'Action'
    },
    exportChangesActionDownload: {
        'zh_CN': '导出文件',
        'en': 'Download File'
    },
    exportChangesActionCopy: {
        'zh_CN': '复制到剪贴板',
        'en': 'Copy to Clipboard'
    },
    exportChangesActionHelp: {
        'zh_CN': '复制说明',
        'en': 'Copy Help'
    },
    // ==================== 导出变化功能翻译 ====================
    exportChangesModalTitle: {
        'zh_CN': '导出书签变化',
        'en': 'Export Bookmark Changes'
    },
    exportChangesFormatLabel: {
        'zh_CN': '导出格式',
        'en': 'Export Format'
    },
    exportChangesLegendHelp: {
        'zh_CN': '标记说明',
        'en': 'Legend'
    },
    exportChangesLegendTitle: {
        'zh_CN': '标记说明：',
        'en': 'Legend:'
    },
    exportChangesModeLabel: {
        'zh_CN': '导出模式',
        'en': 'Export Mode'
    },
    exportChangesModeSimple: {
        'zh_CN': '简略',
        'en': 'Simple'
    },
    exportChangesModeDetailed: {
        'zh_CN': '详细',
        'en': 'Detailed'
    },
    exportChangesModeCollection: {
        'zh_CN': '集合',
        'en': 'Collection'
    },
    exportChangesModeHelp: {
        'zh_CN': '模式说明',
        'en': 'Mode Help'
    },
    exportChangesActionLabel: {
        'zh_CN': '操作方式',
        'en': 'Action'
    },
    exportChangesActionDownload: {
        'zh_CN': '导出文件',
        'en': 'Download File'
    },
    exportChangesActionCopy: {
        'zh_CN': '复制到剪贴板',
        'en': 'Copy to Clipboard'
    },
    exportChangesActionHelp: {
        'zh_CN': '复制说明',
        'en': 'Copy Help'
    },
    exportChangesConfirmText: {
        'zh_CN': '确认',
        'en': 'Confirm'
    },
    exportChangesCancelText: {
        'zh_CN': '取消',
        'en': 'Cancel'
    },
    // 导出功能翻译
    };
window.i18n = i18n; // 暴露给其他模块使用

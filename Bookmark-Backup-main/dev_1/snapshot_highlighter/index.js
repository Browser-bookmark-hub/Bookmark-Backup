(function () {
  'use strict';

  const API_KEY = '__dev1SnapshotHighlighter';
  const TOOLBAR_ID = 'dev1-snapshot-highlighter-toolbar';
  const STORAGE_PREFIX = 'snapshot_highlighter_page_';
  const AUTORESTORE_PREFIX = 'dev1_snapshot_highlighter_autorestore_';
  const HISTORY_HOOK_KEY = '__dev1SnapshotHighlighterHistoryHooked';
  const URL_CHANGE_EVENT = 'dev1SnapshotHighlighterUrlChange';
  const UI_SELECTOR = [
    '#dev1-snapshot-highlighter-toolbar',
    '.dev1-snapshot-highlighter-panel',
    '.highlight-color-picker',
    '.highlight-tool-picker',
    '.operations-panel',
    '.highlight-action-panel',
    '.indicator-details-panel',
    '#dev1-snapshot-highlighter-batch-overlay',
    '#dev1-snapshot-highlighter-batch-bar',
    '#dev1-snapshot-highlighter-batch-confirm-dialog',
    '[data-dev1-snapshot-highlighter-ui="true"]',
    '#dev1-snapshot-helper-host'
  ].join(',');
  const HIGHLIGHT_SELECTOR = '.custom-highlight.dev1-snapshot-highlight[data-dev1-snapshot-highlighter="true"][data-highlight-id]';
  const HIGHLIGHT_ANY_SELECTOR = [
    HIGHLIGHT_SELECTOR,
    '.custom-highlight[data-highlight-id]',
    '.dev1-snapshot-highlight[data-highlight-id]',
    '[data-dev1-snapshot-highlighter="true"][data-highlight-id]'
  ].join(', ');
  const EDIT_FRAGMENT_SELECTOR = '[data-dev1-snapshot-highlighter-edit="true"][data-edit-fragment-id]';
  const NOTE_STATIC_CLASS = 'dev1-highlight-note-static';
  const NOTE_BUBBLE_CLASS = 'dev1-highlight-note-bubble';

  if (window[API_KEY] && window[API_KEY].loaded === true) return;

  const now = () => Date.now();

  const getDocumentZoom = () => {
    try {
      const doc = document && document.documentElement;
      if (!doc) return 1;
      const datasetZoom = Number(doc.dataset && doc.dataset.pdfHelperZoom);
      if (Number.isFinite(datasetZoom) && datasetZoom > 0) return datasetZoom;
    } catch (_) { }
    return 1;
  };

  function safeString(value) {
    return String(value == null ? '' : value);
  }

  function normalizeLang(lang) {
    return safeString(lang || '').toLowerCase().startsWith('en') ? 'en' : 'zh_CN';
  }

  function hashUrl(value) {
    let input = safeString(value);
    if (input.startsWith('http://') || input.startsWith('https://')) {
      try {
        const parsed = new URL(input);
        if (parsed.hash && !parsed.hash.startsWith('#/')) {
          parsed.hash = '';
        }
        input = parsed.href;
      } catch (_) {}
    }
    let h1 = 0xdeadbeef ^ input.length;
    let h2 = 0x41c6ce57 ^ input.length;
    for (let i = 0; i < input.length; i += 1) {
      const ch = input.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ((h2 >>> 0).toString(36) + (h1 >>> 0).toString(36)).slice(0, 20);
  }

  function debounce(fn, wait) {
    let timer = null;
    return function debounced(...args) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = null;
        fn.apply(this, args);
      }, wait);
    };
  }

  function isElementNode(node) {
    return node && node.nodeType === Node.ELEMENT_NODE;
  }

  function elementFromNode(node) {
    if (!node) return null;
    return isElementNode(node) ? node : node.parentElement;
  }

  function rgbaFromHex(hex, alpha) {
    const raw = safeString(hex).trim();
    if (!/^#[0-9a-f]{6}$/i.test(raw)) return raw;
    const n = parseInt(raw.slice(1), 16);
    const r = (n >> 16) & 255;
    const g = (n >> 8) & 255;
    const b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function parseCssColor(color) {
    const raw = safeString(color).trim();
    if (/^#[0-9a-f]{3}$/i.test(raw)) {
      const r = raw[1] + raw[1];
      const g = raw[2] + raw[2];
      const b = raw[3] + raw[3];
      return [parseInt(r, 16), parseInt(g, 16), parseInt(b, 16)];
    }
    if (/^#[0-9a-f]{6}$/i.test(raw)) {
      const n = parseInt(raw.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const rgb = raw.match(/rgba?\(([^)]+)\)/i);
    if (rgb) {
      const parts = rgb[1].split(',').map(v => Number(String(v).trim()));
      if (parts.length >= 3 && parts.slice(0, 3).every(Number.isFinite)) return parts.slice(0, 3);
    }
    return [255, 235, 59];
  }

  function normalizeCssColor(value) {
    const raw = safeString(value).trim();
    if (!raw || raw.startsWith('special:')) return '';
    if (/^#[0-9a-f]{3,6}$/i.test(raw) || /^rgba?\(/i.test(raw)) return raw;
    try {
      const probe = document.createElement('span');
      probe.style.color = raw;
      if (!probe.style.color) return '';
      document.body.appendChild(probe);
      const resolved = window.getComputedStyle(probe).color;
      probe.remove();
      return resolved || '';
    } catch (_) {
      return '';
    }
  }

  function luminance(color) {
    const [r, g, b] = parseCssColor(color).map(v => {
      const s = Math.max(0, Math.min(255, v)) / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  function contrastText(background, fallback = '#0f172a') {
    if (safeString(background).startsWith('special:')) return '#ffffff';
    if (background === 'transparent') return fallback;
    const lum = luminance(background);
    return lum > 0.38 ? '#0f172a' : '#ffffff';
  }

  class SnapshotHighlighter {
    constructor() {
      this.loaded = true;
      this.config = {};
      this.lang = 'zh_CN';
      this.visible = false;
      this.restoreDisplayOnly = false;
      this.currentUrl = window.location.href;
      this.highlights = new Map();
      this.editFragments = [];
      this.currentColor = '#2196F3';
      this.currentColorKey = 'blue';
      this.currentColorName = '';
      this.currentColorVariant = 'auto';
      this.currentTool = 'highlight';
      this.currentToolName = '';
      this.recentColors = [];
      this.recentTools = [];
      this._recentColorSortMode = 'latest';
      this._recentToolsSortMode = 'latest';
      this._colorPickerViewMode = 'grid';
      this._toolPickerViewMode = 'grid';
      this._mdMode = 'visual';
      this._collapsedToolGroups = new Set();
      this.toolbarUi = this.normalizeToolbarUi();
      this.toolbar = null;
      this.toolbarDockToggle = null;
      this.toolbarDockOutsideClickListener = null;
      this._toolbarDragRafId = null;
      this.activeColorPicker = null;
      this.activeToolPicker = null;
      this.activeOperationsPanel = null;
      this.operationsAnchor = null;
      this.activeHighlightPanel = null;
      this.indicatorPanel = null;
      this.selectionListener = null;
      this.highlightClickListener = null;
      this.urlTimer = null;
      this.urlChangeListener = null;
      this.beforeUnloadListener = null;
      this.documentClickListener = null;
      this.keydownListener = null;
      this.cursorPointerListener = null;
      this.cursorPointerOverListener = null;
      this.cursorPointerUpListener = null;
      this._cursorHeadObserver = null;
      this._cursorEnsureTimer = null;
      this._cursorLifecycleListeners = [];
      this.externalColorListener = null;
      this.overlayRefreshListener = null;
      this.visualViewportRefreshListener = null;
      this.selectedHighlightIds = new Set();
      this.selectedEditFragmentIds = new Set();
      this._batchContainedHighlightIdsByEditId = new Map();
      this.darkModeEnabled = this.detectPageTheme();
      this.frameOverlayLayer = null;
      this.htmlOverlayLayer = null;
      this.groupFrameOverlays = new Map();
      this.groupFrameGeometries = new Map();
      this._globalDefsSvg = null;
      this._sharedRO = null;
      this._pendingRainbowRenders = new Set();
      this._rafRainbowScheduled = false;
      this._ripplePalette = null;
      this._rippleGlobalListenerAttached = false;
      this._rippleGlobalHandler = null;
      this._cursorAnimationTimer = null;
      this._cursorAnimationFrame = 0;
      this._isRainbowCursorActive = false;
      this._cursorAnimationColor = '';
      this._cursorColorOverride = '';
      this._dataUrlBlockedForCursor = undefined;
      this._dataUrlBlockedForCursorPromise = null;
      this._cursorSuppressors = new Set();
      this._releaseTimers = new Map();
      this._panelPositioners = new Set();
      this._panelRepositionListener = null;
      this._restoreRetryTimer = null;
      this._restoreJob = null;
      this._restoreJobTimer = null;
      this._restoreJobSeq = 0;
      this._effectRefreshTimer = null;
      this._toolbarAnchoredFromHelper = false;
      this._visualZoomScale = 1;
      this._rgbPickerLastColor = '';
      this._batchCursorPrevious = null;
      this._mdEditModeActive = false;
      this._mdOriginalBodyEditable = null;
      this._mdOriginalBodyCursor = '';
      this._mdEscapeHandler = null;
      this._mdClickHandler = null;
      this._mdInputHandler = null;
      this._mdRenderTimer = null;
      this._currentMdSourceElement = null;
      this._editOriginalByXPath = new Map();
      this.cursorEnabled = true;
      this.overlayUpdateSoon = debounce(() => this.updateAllGroupFrameOverlays(), 80);
      this.batchCleanup = null;
      this.saveSoon = debounce(() => this.saveState(), 220);
      this.messages = this.createMessages();
    }

    createMessages() {
      return {
        zh_CN: {
          selectColor: '选择颜色',
          selectTool: '选择工具',
          delete: '删除',
          close: '关闭',
          backToSnapshotHelper: '返回网页快照辅助工具',
          applyCurrentColor: '应用当前颜色',
          applyCurrentTool: '应用当前工具',
          highlightNote: '批注',
          highlightNotePlaceholder: '输入这条高亮的批注',
          current: '当前颜色 / 当前工具',
          currentColor: '当前颜色',
          currentTool: '当前工具',
          highlightCount: '当前高亮',
          clearAll: '清除全部',
          operationClearAll: '清除全部',
          operationBatchDelete: '批量删除',
          clearVisual: '清除视觉模式',
          clearEdit: '清除编辑模式',
          batchDelete: '批量删除',
          batchTip: '点击 或 划线 进行批量选择',
          batchExit: '退出',
          deleteSelectedNow: '删除所选',
          deleteSelected: '删除选中',
          selectedCount: '已选择',
          confirm: '确认',
          cancel: '取消',
          emptyEdit: '没有页面编辑内容',
          noSelection: '没有选中的项目',
          cleared: '已清除',
          clearOptionsTitle: '清除选项',
          clearAllOption: '清除全部',
          clearAllDesc: '高亮、批注和编辑',
          clearVisualDesc: '高亮和批注',
          clearEditDesc: '页面编辑内容',
          clearConfirmTitle: '确认清除',
          batchConfirmTitle: '确认删除',
          confirmDeleteItems: '删除 {count} 个选中项目？',
          clickWord: '点击',
          orWord: '或',
          drawSlash: '划线',
          forBatchSelect: '进行批量选择',
          highlightDisabled: '已暂时屏蔽高亮',
          mdEditModeTitle: 'MD 编辑模式',
          mdEditHelpTitle: '功能说明',
          mdEditHelpInput: '输入或选中文字后选择 MD 工具',
          mdEditHelpClick: '点击已渲染内容可返回编辑源码',
          mdEditHelpUndo: '撤销/重做使用浏览器原生命令',
          mdEditApplied: '已应用 MD 编辑',
          mdEditNoSelection: '请先选中文字',
          mdEditExit: '退出',
          gotIt: '知道了',
          unavailablePdf: 'PDF 页面不启用高亮工具',
          chooseColor: '选择颜色',
          chooseTool: '选择工具',
          sortByLatest: '最新选择',
          sortByUsage: '按选择次数排序',
          clearRecent: '清空最近',
          whiteText: '白色字体',
          blackText: '黑色字体',
          autoText: '自动',
          rgbValueLabel: 'RGB',
          hexValueLabel: 'HEX',
          colorPickerNote: '从色轮选择或输入 RGB / HEX',
          viewGrid: '网格视图',
          viewList: '列表视图',
          visualMode: '视觉模式',
          editMode: '编辑模式',
          toolGroupBoxes: '框线',
          toolGroupBrackets: '括号',
          toolGroupPills: '胶囊',
          categoryClassic: '经典高亮',
          categoryRgb: 'RGB 选择器',
          categoryRecentColors: '最近颜色',
          categoryRed: '红色',
          categoryOrange: '橙色',
          categoryYellow: '黄色',
          categoryGreen: '绿色',
          categoryBlue: '蓝色',
          categoryPurple: '紫色',
          categoryOther: '其他',
          categorySpecialColors: '特效颜色',
          toolsRecent: '最近工具',
          toolsMarkdown: 'MD 格式',
          toolsLines: '线条样式',
          toolsFrames: '边框样式',
          toolsSolid: '纯色高亮',
          toolsSpecial: '特殊效果',
          toolsDynamic: '动态效果',
          dynamicMhtmlNotice: 'MHTML 导出不支持这些动态效果；如需保留动态效果，请使用录屏，或用 SingleFile 等方式导出。',
          tool_presentation: '演示笔',
          tool_presentation_desc: '用于演示或指示，支持形状识别与自动消失',
          presentationNotice: '给演示用的，录制视频的时候可以指示。',
          markdownNotice: '在「MD正文」中，只有这里的「MD格式」工具会生效。',
          presentationLineStyle: '线条样式',
          presentationLineSolid: '实线',
          presentationLineDashed: '虚线',
          presentationDisappearTime: '消失时间',
          presentationDisappearImmediately: '立刻',
          presentationDisappearDelay: '延迟消失',
          presentationAutoShape: '几何识别',
          presentationShapeEnable: '启用',
          presentationShapeDisable: '禁用',
          presentationShapeTip: '支持自动识别几何形状 (圆、矩形、三角形、五角星、直线线段)',
          classicHighlight: '经典高亮',
          customColor: '自定义颜色',
          apply: '应用'
        },
        en: {
          selectColor: 'Select Color',
          selectTool: 'Select Tool',
          delete: 'Delete',
          close: 'Close',
          backToSnapshotHelper: 'Back to Web Snapshot Helper',
          applyCurrentColor: 'Apply Current Color',
          applyCurrentTool: 'Apply Current Tool',
          highlightNote: 'Annotation',
          highlightNotePlaceholder: 'Add an annotation for this highlight',
          current: 'Current Color / Tool',
          currentColor: 'Current Color',
          currentTool: 'Current Tool',
          highlightCount: 'Highlights',
          clearAll: 'Clear All',
          operationClearAll: 'Clear All',
          operationBatchDelete: 'Batch Delete',
          clearVisual: 'Clear Visual Mode',
          clearEdit: 'Clear Edit Mode',
          batchDelete: 'Batch Delete',
          batchTip: 'Click or draw a slash to batch select',
          batchExit: 'Exit',
          deleteSelectedNow: 'Delete Selected',
          deleteSelected: 'Delete Selected',
          selectedCount: 'Selected',
          confirm: 'Confirm',
          cancel: 'Cancel',
          emptyEdit: 'No page edits',
          noSelection: 'No selected highlights',
          cleared: 'Cleared',
          clearOptionsTitle: 'Clear Options',
          clearAllOption: 'Clear All',
          clearAllDesc: 'Highlights, annotations, and page edits',
          clearVisualDesc: 'Highlights and annotations',
          clearEditDesc: 'Page edits',
          clearConfirmTitle: 'Confirm Clear',
          batchConfirmTitle: 'Confirm Delete',
          confirmDeleteItems: 'Delete {count} selected items?',
          clickWord: 'Click',
          orWord: 'or',
          drawSlash: 'draw a slash',
          forBatchSelect: 'to batch select',
          highlightDisabled: 'Highlighting is temporarily disabled',
          mdEditModeTitle: 'MD Edit Mode',
          mdEditHelpTitle: 'Help',
          mdEditHelpInput: 'Type or select text, then choose an MD tool',
          mdEditHelpClick: 'Click rendered content to edit its source',
          mdEditHelpUndo: 'Undo/redo uses the browser native stack',
          mdEditApplied: 'MD edit applied',
          mdEditNoSelection: 'Select text first',
          mdEditExit: 'Exit',
          gotIt: 'Got it',
          unavailablePdf: 'Highlight tool is disabled on PDFs',
          chooseColor: 'Choose Color',
          chooseTool: 'Choose Tool',
          sortByLatest: 'Latest',
          sortByUsage: 'Most Used',
          clearRecent: 'Clear Recent',
          whiteText: 'White Text',
          blackText: 'Black Text',
          autoText: 'Auto',
          rgbValueLabel: 'RGB',
          hexValueLabel: 'HEX',
          colorPickerNote: 'Pick from wheel or enter RGB / HEX',
          viewGrid: 'Grid View',
          viewList: 'List View',
          visualMode: 'Visual Mode',
          editMode: 'Edit Mode',
          toolGroupBoxes: 'Boxes',
          toolGroupBrackets: 'Brackets',
          toolGroupPills: 'Pills',
          categoryClassic: 'Classic',
          categoryRgb: 'RGB Picker',
          categoryRecentColors: 'Recent Colors',
          categoryRed: 'Red',
          categoryOrange: 'Orange',
          categoryYellow: 'Yellow',
          categoryGreen: 'Green',
          categoryBlue: 'Blue',
          categoryPurple: 'Purple',
          categoryOther: 'Other',
          categorySpecialColors: 'Effect Colors',
          toolsRecent: 'Recent Tools',
          toolsMarkdown: 'MD Format',
          toolsLines: 'Line Styles',
          toolsFrames: 'Frame Styles',
          toolsSolid: 'Solid Highlights',
          toolsSpecial: 'Special Effects',
          toolsDynamic: 'Dynamic Effects',
          dynamicMhtmlNotice: 'MHTML exports do not preserve these dynamic effects. Use screen recording, or export with tools such as SingleFile when you need to keep them.',
          tool_presentation: 'Presentation Pen',
          tool_presentation_desc: 'Used for presentation or indicators, supports shape recognition and auto-disappearance',
          presentationNotice: 'For presentations. Can be used as an indicator when recording video.',
          markdownNotice: 'In "MD Content", only the "MD Format" tools will take effect.',
          presentationLineStyle: 'Line Style',
          presentationLineSolid: 'Solid',
          presentationLineDashed: 'Dashed',
          presentationDisappearTime: 'Disappear Time',
          presentationDisappearImmediately: 'Immediately',
          presentationDisappearDelay: 'Delay',
          presentationAutoShape: 'Auto Shape',
          presentationShapeEnable: 'Enable',
          presentationShapeDisable: 'Disable',
          presentationShapeTip: 'Supports auto-recognizing shapes (Circle, Rectangle, Triangle, Star, Straight Line)',
          classicHighlight: 'Classic Highlight',
          customColor: 'Custom Color',
          apply: 'Apply'
        }
      };
    }

    t(key) {
      const table = this.messages[this.lang] || this.messages.zh_CN;
      return table[key] || this.messages.en[key] || key;
    }

    lt(zhText, enText) {
      return this.lang === 'en' ? enText : zhText;
    }

    normalizeToolbarUi(value = {}) {
      const raw = value && typeof value === 'object' ? value : {};
      const left = Number(raw.left);
      const top = Number(raw.top);
      return {
        position: 'floating',
        left: Number.isFinite(left) ? left : null,
        top: Number.isFinite(top) ? top : null,
        userMoved: !!raw.userMoved,
        dockState: { position: 'floating', collapsed: false },
        dockAlong: null
      };
    }

    getToolbarDockState() {
      this.toolbarUi = this.normalizeToolbarUi(this.toolbarUi);
      return this.toolbarUi.dockState || { position: 'floating', collapsed: false };
    }

    setToolbarDockState(position = 'floating', collapsed = false, dockAlong = null) {
      const valid = new Set(['floating', 'left', 'right', 'top', 'bottom']);
      const nextPosition = valid.has(position) ? position : 'floating';
      const nextCollapsed = nextPosition !== 'floating' && !!collapsed;
      const center = dockAlong && Number(dockAlong.center);
      this.toolbarUi = this.normalizeToolbarUi({
        ...this.toolbarUi,
        position: nextPosition,
        dockState: { position: nextPosition, collapsed: nextCollapsed },
        dockAlong: nextPosition !== 'floating' && Number.isFinite(center)
          ? { side: nextPosition, center }
          : null,
        userMoved: nextPosition === 'floating' ? !!this.toolbarUi.userMoved : true
      });
    }

    async show(config = {}) {
      if (this.isPdfLikePage()) {
        return { success: false, pdf: true, error: this.t('unavailablePdf') };
      }
      const restoreOnly = config && (config.restoreOnly === true || config.suppressToolbar === true);
      this.config = { ...this.config, ...(config || {}) };
      this.lang = normalizeLang(this.config.lang || this.lang);
      if (!this.config.existingTabId && this.config.tabId) this.config.existingTabId = this.config.tabId;
      this.restoreDisplayOnly = !!restoreOnly;
      if (this.currentUrl !== window.location.href) {
        await this.handleUrlChange(window.location.href);
      }
      await this.loadState();
      this.hydrateExistingDomHighlights();
      this.visible = true;
      this.restoreDisplayOnly = !!restoreOnly;
      if (!this.restoreDisplayOnly) await this.persistAutoRestoreMarker();
      this.darkModeEnabled = this.detectPageTheme();
      if (this.restoreDisplayOnly) {
        this.closeTransientPanels();
        this.removeToolbar();
        this.unbindEvents();
        this.bindRestoreOnlyEvents();
        this.removeCursorStyle();
      } else {
        this.createPermanentToolbar();
        this.bindEvents();
      }
      this.restoreHighlightsWithRetry();
      if (!this.restoreDisplayOnly) {
        this.updatePermanentToolbarIndicator();
        this.updateCursorStyle();
      }
      return { success: true, visible: true, restoreOnly: this.restoreDisplayOnly, url: this.currentUrl, count: this.highlights.size };
    }

    async hide() {
      this.exitMdEditMode({ keepTool: true, silent: true });
      await this.saveState();
      this.visible = false;
      this.restoreDisplayOnly = false;
      await this.clearAutoRestoreMarkersForTab();
      this.cancelRestoreJob();
      this.closePanels();
      this.removeToolbar();
      this.unbindEvents();
      this.removeCursorStyle();
      return { success: true, visible: false, count: this.highlights.size };
    }

    async toggle(config = {}) {
      const wantsFullToolbar = !(config && (config.restoreOnly === true || config.suppressToolbar === true));
      if (this.visible && this.restoreDisplayOnly && wantsFullToolbar) {
        return await this.show({ ...config, restoreOnly: false, suppressToolbar: false });
      }
      if (this.visible) return await this.hide();
      return await this.show(config);
    }

    async destroy() {
      this.exitMdEditMode({ keepTool: true, silent: true });
      await this.saveState();
      this.visible = false;
      this.restoreDisplayOnly = false;
      await this.clearAutoRestoreMarkersForTab();
      this.cancelRestoreJob();
      this.closePanels();
      this.removeToolbar();
      this.unbindEvents();
      this.removeCursorStyle();
      return { success: true, visible: false };
    }

    isVisible() {
      return this.visible === true && !!(this.toolbar && document.body.contains(this.toolbar));
    }

    isPdfLikePage() {
      try {
        const href = window.location.href || '';
        if (/\.pdf(?:[?#]|$)/i.test(href)) return true;
        if (href.includes('pdf-helper.html')) return true;
        if (document.contentType === 'application/pdf') return true;
        if (document.querySelector('embed[type="application/pdf"], iframe[src*=".pdf"], pdf-viewer, viewer-toolbar')) return true;
      } catch (_) { }
      return false;
    }

    storageNamespace(url = this.currentUrl) {
      return `${STORAGE_PREFIX}${hashUrl(url)}`;
    }

    getTabId() {
      const raw = this.config.existingTabId ?? this.config.tabId;
      const id = Number(raw);
      return Number.isFinite(id) ? id : null;
    }

    getScopedStorage() {
      return window.__dev1TabScopedStorage || null;
    }

    getLocalStorageArea() {
      try {
        return (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
          ? chrome.storage.local
          : null;
      } catch (_) {
        return null;
      }
    }

    autoRestoreMarkerPrefix(tabId = this.getTabId()) {
      const id = Number(tabId);
      if (!Number.isFinite(id)) return '';
      return `${AUTORESTORE_PREFIX}${Math.floor(id)}_`;
    }

    autoRestoreMarkerKey(tabId = this.getTabId(), url = this.currentUrl) {
      const prefix = this.autoRestoreMarkerPrefix(tabId);
      return prefix ? `${prefix}${hashUrl(url)}` : '';
    }

    async persistAutoRestoreMarker(url = this.currentUrl) {
      const storage = this.getLocalStorageArea();
      const tabId = this.getTabId();
      const key = this.autoRestoreMarkerKey(tabId, url);
      if (!storage || tabId == null || !key) return;
      try {
        await new Promise((resolve, reject) => {
          storage.set({
            [key]: {
              v: 1,
              tabId,
              url: String(url || ''),
              lang: normalizeLang(this.lang),
              visible: true,
              namespace: this.storageNamespace(url),
              updatedAt: now()
            }
          }, () => {
            if (chrome.runtime && chrome.runtime.lastError) reject(chrome.runtime.lastError);
            else resolve();
          });
        });
      } catch (_) { }
    }

    async clearAutoRestoreMarkersForTab(tabId = this.getTabId()) {
      const storage = this.getLocalStorageArea();
      const prefix = this.autoRestoreMarkerPrefix(tabId);
      if (!storage || !prefix) return;
      try {
        const all = await new Promise(resolve => storage.get(null, resolve));
        const keys = Object.keys(all || {}).filter(key => key.startsWith(prefix));
        if (keys.length) await new Promise(resolve => storage.remove(keys, resolve));
      } catch (_) { }
    }

    async loadState(url = this.currentUrl) {
      const scoped = this.getScopedStorage();
      const tabId = this.getTabId();
      if (!scoped || tabId == null) {
        this.resetPageState();
        return false;
      }
      const state = await scoped.getScoped(tabId, this.storageNamespace(url), url);
      if (!state || typeof state !== 'object') {
        this.resetPageState();
        return false;
      }
      this.highlights.clear();
      (Array.isArray(state.entries) ? state.entries : []).forEach(entry => {
        if (entry && entry.id) {
          const normalizedEntry = { ...entry };
          const note = this.normalizeHighlightNote(entry.note);
          const createdAt = this.normalizeHighlightTimestamp(entry.timestamp);
          const updatedAt = this.normalizeHighlightTimestamp(entry.updatedAt);
          if (note) normalizedEntry.note = note;
          else delete normalizedEntry.note;
          if (createdAt) normalizedEntry.timestamp = createdAt;
          if (updatedAt) normalizedEntry.updatedAt = updatedAt;
          else delete normalizedEntry.updatedAt;
          this.highlights.set(entry.id, normalizedEntry);
        }
      });
      this.editFragments = Array.isArray(state.editFragments) ? state.editFragments.filter(Boolean) : [];
      this._editOriginalByXPath.clear();
      this.editFragments.forEach(fragment => {
        const xpath = this.getEditFragmentXPath(fragment);
        if (xpath && fragment.beforeHtml != null) {
          this._editOriginalByXPath.set(xpath, {
            beforeHtml: String(fragment.beforeHtml),
            beforeText: safeString(fragment.beforeText)
          });
        }
      });
      const toolbar = state.toolbar || {};
      if (toolbar.color) this.currentColor = toolbar.color;
      this.currentColorVariant = toolbar.colorVariant || 'auto';
      this.currentColorKey = toolbar.colorNameKey || this.getColorNameKeyForValue(this.currentColor, this.currentColorVariant, toolbar.colorName || '');
      this.currentColorName = this.getColorNameForValue(this.currentColor, this.currentColorVariant, toolbar.colorName || '', this.currentColorKey);
      if (toolbar.tool) this.currentTool = toolbar.tool;
      this.currentToolName = this.getToolNameForId(this.currentTool, toolbar.toolName || '');
      this._colorPickerViewMode = toolbar.colorPickerViewMode === 'list' ? 'list' : 'grid';
      this._toolPickerViewMode = toolbar.toolPickerViewMode === 'list' ? 'list' : 'grid';
      this.presentationPenStyle = toolbar.presentationPenStyle || 'solid';
      let loadedDelay = toolbar.presentationPenDisappearDelay !== undefined ? Number(toolbar.presentationPenDisappearDelay) : 2000;
      let immediately = toolbar.presentationPenDisappearImmediately !== undefined 
        ? !!toolbar.presentationPenDisappearImmediately 
        : (loadedDelay === 0);
      if (loadedDelay === 0) {
        loadedDelay = 2000;
      } else if (loadedDelay > 0 && loadedDelay <= 10) {
        loadedDelay = loadedDelay * 1000;
      }
      this.presentationPenDisappearDelay = loadedDelay;
      this.presentationPenDisappearImmediately = immediately;
      this.presentationPenAutoRecognize = toolbar.presentationPenAutoRecognize !== undefined ? !!toolbar.presentationPenAutoRecognize : true;
      this._rgbPickerLastColor = /^#[0-9a-f]{6}$/i.test(safeString(toolbar.rgbPickerLastColor || ''))
        ? safeString(toolbar.rgbPickerLastColor).toUpperCase()
        : '';
      this.recentColors = this.normalizeRecentColors(state.recentColors);
      this.recentTools = this.normalizeRecentTools(state.recentTools);
      this.toolbarUi = this.normalizeToolbarUi(state.toolbarUi);
      return true;
    }

    resetPageState() {
      this.highlights.clear();
      this.editFragments = [];
      this.currentColor = '#2196F3';
      this.currentColorKey = 'blue';
      this.currentColorName = this.lt('蓝色', 'Blue');
      this.currentColorVariant = 'auto';
      this.currentTool = 'highlight';
      this.currentToolName = this.t('classicHighlight');
      this.recentColors = [];
      this.recentTools = [];
      this.presentationPenStyle = 'solid';
      this.presentationPenDisappearDelay = 2000;
      this.presentationPenDisappearImmediately = false;
      this.presentationPenAutoRecognize = true;
      this._rgbPickerLastColor = '';
      this._colorPickerViewMode = 'grid';
      this._toolPickerViewMode = 'grid';
      this._mdMode = 'visual';
      this.toolbarUi = this.normalizeToolbarUi();
      this._editOriginalByXPath.clear();
    }

    buildState(url = this.currentUrl) {
      return {
        url,
        title: document.title || '',
        entries: Array.from(this.highlights.values()).filter(Boolean),
        editFragments: this.editFragments.filter(Boolean),
        toolbar: {
          color: this.currentColor,
          colorNameKey: this.currentColorKey || this.getColorNameKeyForValue(this.currentColor, this.currentColorVariant),
          tool: this.currentTool,
          toolNameKey: this.currentTool,
          colorVariant: this.currentColorVariant || '',
          rgbPickerLastColor: this._rgbPickerLastColor || '',
          colorPickerViewMode: this._colorPickerViewMode === 'list' ? 'list' : 'grid',
          toolPickerViewMode: this._toolPickerViewMode === 'list' ? 'list' : 'grid',
          presentationPenStyle: this.presentationPenStyle || 'solid',
          presentationPenDisappearDelay: this.presentationPenDisappearDelay !== undefined ? this.presentationPenDisappearDelay : 2000,
          presentationPenDisappearImmediately: this.presentationPenDisappearImmediately !== undefined ? this.presentationPenDisappearImmediately : false,
          presentationPenAutoRecognize: this.presentationPenAutoRecognize !== undefined ? this.presentationPenAutoRecognize : true
        },
        recentColors: this.recentColors.slice(0, 16),
        recentTools: this.recentTools.slice(0, 16),
        toolbarUi: this.normalizeToolbarUi(this.toolbarUi),
        updatedAt: now()
      };
    }

    async saveState(url = this.currentUrl) {
      const scoped = this.getScopedStorage();
      const tabId = this.getTabId();
      if (!scoped || tabId == null) return;
      await scoped.setScoped(tabId, this.storageNamespace(url), url, this.buildState(url));
      if (this.visible && !this.restoreDisplayOnly) await this.persistAutoRestoreMarker(url);
    }

    requestSave(immediate = false) {
      if (immediate) {
        this.saveState().catch(() => { });
        return;
      }
      this.saveSoon();
    }

    normalizeHighlightNote(value) {
      return safeString(value).replace(/\r\n?/g, '\n').slice(0, 2000);
    }

    normalizeHighlightTimestamp(value) {
      const timestamp = Number(value);
      return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : 0;
    }

    getHighlightDisplayTimestamp(entry = {}, highlightEl = null) {
      const updatedAt = this.normalizeHighlightTimestamp(entry && entry.updatedAt);
      if (updatedAt) return updatedAt;
      const domUpdatedAt = this.normalizeHighlightTimestamp(highlightEl && highlightEl.dataset && highlightEl.dataset.highlightUpdatedAt);
      if (domUpdatedAt) return domUpdatedAt;
      const createdAt = this.normalizeHighlightTimestamp(entry && entry.timestamp);
      if (createdAt) return createdAt;
      const domCreatedAt = this.normalizeHighlightTimestamp(highlightEl && highlightEl.dataset && highlightEl.dataset.timestamp);
      return domCreatedAt || 0;
    }

    formatHighlightTimestamp(value) {
      const timestamp = this.normalizeHighlightTimestamp(value);
      if (!timestamp) return '';
      try {
        return new Intl.DateTimeFormat(this.lang === 'en' ? 'en-US' : 'zh-CN', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }).format(new Date(timestamp));
      } catch (_) {
        const date = new Date(timestamp);
        const pad = number => String(number).padStart(2, '0');
        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
      }
    }

    getHighlightNoteLabel(entry = {}, highlightEl = null) {
      const formatted = this.formatHighlightTimestamp(this.getHighlightDisplayTimestamp(entry, highlightEl));
      return formatted ? `${this.t('highlightNote')}（${formatted}）` : this.t('highlightNote');
    }

    formatHighlightNoteStaticText(note) {
      return `${this.t('highlightNote')}${this.lang === 'en' ? ': ' : '：'}${this.normalizeHighlightNote(note)}`;
    }

    bindEvents() {
      if (!this.selectionListener) {
        this.selectionListener = () => {
          setTimeout(() => this.highlightSelectedText(), 30);
        };
        document.addEventListener('mouseup', this.selectionListener, true);
      }
      if (!this.beforeUnloadListener) {
        this.beforeUnloadListener = () => {
          try { this.requestSave(true); } catch (_) { }
        };
        window.addEventListener('beforeunload', this.beforeUnloadListener);
      }
      if (!this.documentClickListener) {
        this.documentClickListener = (event) => this.handleOutsideClick(event);
        document.addEventListener('mousedown', this.documentClickListener, true);
      }
      if (!this.keydownListener) {
        this.keydownListener = (event) => {
          if (event.key === 'Escape' && (this.activeColorPicker || this.activeToolPicker || this.activeOperationsPanel || this.activeHighlightPanel || this.indicatorPanel)) {
            this.closeTransientPanels();
          }
        };
        document.addEventListener('keydown', this.keydownListener, true);
      }
      if (!this.cursorPointerListener) {
        this.cursorPointerListener = (event) => this._handleGlobalPointerMove(event);
        document.addEventListener('pointermove', this.cursorPointerListener, true);
        document.addEventListener('pointerdown', this.cursorPointerListener, true);
      }
      if (!this.presentationDownListener) {
        this.presentationDownListener = (event) => this.handlePresentationPointerDown(event);
        document.addEventListener('pointerdown', this.presentationDownListener, true);
      }
      this._attachCursorWatchers();
      if (!this.externalColorListener) {
        this.externalColorListener = (event) => {
          const detail = event && event.detail;
          if (detail) this.setColor(detail);
        };
        window.addEventListener('dev1SnapshotHighlighterSetColor', this.externalColorListener);
      }
      if (!this.highlightClickListener) {
        this.highlightClickListener = (event) => this.handleHighlightClick(event);
        document.addEventListener('click', this.highlightClickListener, true);
      }
      if (!this.urlTimer) {
        this.urlTimer = setInterval(() => {
          this.checkUrlChange();
        }, 500);
      }
      if (!this.urlChangeListener) {
        this.installHistoryHooks();
        this.urlChangeListener = () => this.checkUrlChange();
        window.addEventListener(URL_CHANGE_EVENT, this.urlChangeListener);
        window.addEventListener('popstate', this.urlChangeListener);
        window.addEventListener('hashchange', this.urlChangeListener);
      }
      if (!this.overlayRefreshListener) {
        this.overlayRefreshListener = (event) => {
          if (event && event.type === 'scroll') {
            try { this.updateFrameOverlayLayerSize(); } catch (_) { }
            try { this.groupFrameGeometries.clear(); } catch (_) { }
            try { this.overlayUpdateSoon(); } catch (_) { }
            return;
          }
          try { this.groupFrameGeometries.clear(); } catch (_) { }
          try { this.overlayUpdateSoon(); } catch (_) { }
        };
        window.addEventListener('resize', this.overlayRefreshListener, { passive: true });
        window.addEventListener('scroll', this.overlayRefreshListener, { passive: true });
        document.addEventListener('scroll', this.overlayRefreshListener, true);
      }
      if (!this.visualViewportRefreshListener && window.visualViewport) {
        this.visualViewportRefreshListener = (event) => {
          if (event && event.type === 'scroll') {
            try { this.updateFrameOverlayLayerSize(); } catch (_) { }
            try { this.groupFrameGeometries.clear(); } catch (_) { }
            try { this.overlayUpdateSoon(); } catch (_) { }
            return;
          }
          try { this.groupFrameGeometries.clear(); } catch (_) { }
          try { this.overlayUpdateSoon(); } catch (_) { }
        };
        try {
          window.visualViewport.addEventListener('resize', this.visualViewportRefreshListener, { passive: true });
          window.visualViewport.addEventListener('scroll', this.visualViewportRefreshListener, { passive: true });
        } catch (_) { }
      }
    }

    bindRestoreOnlyEvents() {
      if (!this.beforeUnloadListener) {
        this.beforeUnloadListener = () => {
          try { this.requestSave(true); } catch (_) { }
        };
        window.addEventListener('beforeunload', this.beforeUnloadListener);
      }
      if (!this.documentClickListener) {
        this.documentClickListener = (event) => this.handleOutsideClick(event);
        document.addEventListener('mousedown', this.documentClickListener, true);
      }
      if (!this.keydownListener) {
        this.keydownListener = (event) => {
          if (event.key === 'Escape' && (this.activeColorPicker || this.activeToolPicker || this.activeOperationsPanel || this.activeHighlightPanel || this.indicatorPanel)) {
            this.closeTransientPanels();
          }
        };
        document.addEventListener('keydown', this.keydownListener, true);
      }
      if (!this.highlightClickListener) {
        this.highlightClickListener = (event) => this.handleHighlightClick(event);
        document.addEventListener('click', this.highlightClickListener, true);
      }
      if (!this.urlTimer) {
        this.urlTimer = setInterval(() => {
          this.checkUrlChange();
        }, 500);
      }
      if (!this.urlChangeListener) {
        this.installHistoryHooks();
        this.urlChangeListener = () => this.checkUrlChange();
        window.addEventListener(URL_CHANGE_EVENT, this.urlChangeListener);
        window.addEventListener('popstate', this.urlChangeListener);
        window.addEventListener('hashchange', this.urlChangeListener);
      }
      if (!this.overlayRefreshListener) {
        this.overlayRefreshListener = (event) => {
          if (event && event.type === 'scroll') {
            try { this.updateFrameOverlayLayerSize(); } catch (_) { }
            try { this.groupFrameGeometries.clear(); } catch (_) { }
            try { this.overlayUpdateSoon(); } catch (_) { }
            return;
          }
          try { this.groupFrameGeometries.clear(); } catch (_) { }
          try { this.overlayUpdateSoon(); } catch (_) { }
        };
        window.addEventListener('resize', this.overlayRefreshListener, { passive: true });
        window.addEventListener('scroll', this.overlayRefreshListener, { passive: true });
        document.addEventListener('scroll', this.overlayRefreshListener, true);
      }
      if (!this.visualViewportRefreshListener && window.visualViewport) {
        this.visualViewportRefreshListener = (event) => {
          if (event && event.type === 'scroll') {
            try { this.updateFrameOverlayLayerSize(); } catch (_) { }
            try { this.groupFrameGeometries.clear(); } catch (_) { }
            try { this.overlayUpdateSoon(); } catch (_) { }
            return;
          }
          try { this.groupFrameGeometries.clear(); } catch (_) { }
          try { this.overlayUpdateSoon(); } catch (_) { }
        };
        try {
          window.visualViewport.addEventListener('resize', this.visualViewportRefreshListener, { passive: true });
          window.visualViewport.addEventListener('scroll', this.visualViewportRefreshListener, { passive: true });
        } catch (_) { }
      }
    }

    unbindEvents() {
      if (this.selectionListener) {
        document.removeEventListener('mouseup', this.selectionListener, true);
        this.selectionListener = null;
      }
      if (this.beforeUnloadListener) {
        window.removeEventListener('beforeunload', this.beforeUnloadListener);
        this.beforeUnloadListener = null;
      }
      if (this.documentClickListener) {
        document.removeEventListener('mousedown', this.documentClickListener, true);
        this.documentClickListener = null;
      }
      if (this.keydownListener) {
        document.removeEventListener('keydown', this.keydownListener, true);
        this.keydownListener = null;
      }
      if (this.cursorPointerListener) {
        document.removeEventListener('pointermove', this.cursorPointerListener, true);
        document.removeEventListener('pointerdown', this.cursorPointerListener, true);
        this.cursorPointerListener = null;
      }
      if (this.presentationDownListener) {
        document.removeEventListener('pointerdown', this.presentationDownListener, true);
        this.presentationDownListener = null;
      }
      const pOverlay = document.getElementById('dev1-presentation-pen-overlay');
      if (pOverlay) pOverlay.remove();
      this._detachCursorWatchers();
      if (this.externalColorListener) {
        window.removeEventListener('dev1SnapshotHighlighterSetColor', this.externalColorListener);
        this.externalColorListener = null;
      }
      if (this.highlightClickListener) {
        document.removeEventListener('click', this.highlightClickListener, true);
        this.highlightClickListener = null;
      }
      if (this.urlTimer) {
        clearInterval(this.urlTimer);
        this.urlTimer = null;
      }
      if (this.urlChangeListener) {
        window.removeEventListener(URL_CHANGE_EVENT, this.urlChangeListener);
        window.removeEventListener('popstate', this.urlChangeListener);
        window.removeEventListener('hashchange', this.urlChangeListener);
        this.urlChangeListener = null;
      }
      if (this.overlayRefreshListener) {
        window.removeEventListener('resize', this.overlayRefreshListener);
        window.removeEventListener('scroll', this.overlayRefreshListener);
        document.removeEventListener('scroll', this.overlayRefreshListener, true);
        this.overlayRefreshListener = null;
      }
      if (this.visualViewportRefreshListener && window.visualViewport) {
        try {
          window.visualViewport.removeEventListener('resize', this.visualViewportRefreshListener);
          window.visualViewport.removeEventListener('scroll', this.visualViewportRefreshListener);
        } catch (_) { }
        this.visualViewportRefreshListener = null;
      }
    }

    installHistoryHooks() {
      if (window[HISTORY_HOOK_KEY]) return;
      try {
        ['pushState', 'replaceState'].forEach(method => {
          const original = history[method];
          if (typeof original !== 'function') return;
          history[method] = function patchedHistoryMethod(...args) {
            const result = original.apply(this, args);
            try {
              window.dispatchEvent(new Event(URL_CHANGE_EVENT));
            } catch (_) { }
            return result;
          };
        });
        window[HISTORY_HOOK_KEY] = true;
      } catch (_) { }
    }

    checkUrlChange() {
      if (window.location.href !== this.currentUrl) {
        this.handleUrlChange(window.location.href).catch(() => { });
      }
    }

    async handleUrlChange(nextUrl) {
      const oldUrl = this.currentUrl;
      this.exitMdEditMode({ keepTool: true, silent: true });
      await this.saveState(oldUrl);
      this.cancelRestoreJob();
      this.restoreEditFragmentsDomOnly();
      this.removeAllGroupFrameOverlays();
      this.clearDomHighlights();
      this.clearHighlightNoteStaticLabels();
      this.highlights.clear();
      this.editFragments = [];
      this.currentUrl = nextUrl;
      this.closePanels();
      await this.loadState(nextUrl);
      if (this.visible && !this.restoreDisplayOnly) await this.persistAutoRestoreMarker(nextUrl);
      if (!this.restoreDisplayOnly) this.applyToolbarPosition();
      this.restoreHighlightsWithRetry();
      if (!this.restoreDisplayOnly) {
        this.updatePermanentToolbarIndicator();
        this.updateCursorStyle();
      }
    }

    handleOutsideClick(event) {
      const target = event.target;
      if (!target) return;
      if (elementFromNode(target)?.closest(UI_SELECTOR)) return;
      if (elementFromNode(target)?.closest(HIGHLIGHT_ANY_SELECTOR)) return;
      this.closeTransientPanels();
    }

    handleHighlightClick(event) {
      const target = event.target;
      const noteLabel = target && target.closest && target.closest(`.${NOTE_STATIC_CLASS}[data-highlight-id]`);
      if (noteLabel && !this.isUiElement(noteLabel)) {
        if (!this.visible) return;
        const highlightId = noteLabel.dataset.highlightId || '';
        const group = this.getGroupElements(highlightId);
        const el = group[group.length - 1] || group[0] || null;
        if (!el) return;
        event.stopPropagation();
        this.showHighlightActionPanel(el);
        return;
      }
      const el = target && target.closest && target.closest(HIGHLIGHT_ANY_SELECTOR);
      if (!el || this.isUiElement(el)) return;
      if (!this.visible) return;
      event.stopPropagation();
      this.showHighlightActionPanel(el);
    }

    closeTransientPanels() {
      ['activeColorPicker', 'activeToolPicker', 'activeOperationsPanel', 'activeHighlightPanel', 'indicatorPanel'].forEach(key => {
        this.closeTransientPanelByKey(key);
      });
    }

    closeTransientPanelByKey(key) {
      const el = this[key];
      if (el) this.untrackPanelPosition(el);
      if (el && el.parentNode) el.remove();
      this[key] = null;
      this.releaseCursorForPanelKey(key);
    }

    releaseCursorForPanelKey(key) {
      const reasons = {
        activeColorPicker: ['colorPicker', 'hoverUI'],
        activeToolPicker: ['toolPicker', 'hoverUI'],
        activeOperationsPanel: ['operations', 'hoverUI'],
        activeHighlightPanel: ['hoverUI'],
        indicatorPanel: ['hoverUI']
      }[key] || [];
      reasons.forEach(reason => this._releaseCursor(reason));
    }

    closePanels() {
      this.closeTransientPanels();
      this.exitBatchDeleteMode();
      if (this._restoreRetryTimer) {
        clearTimeout(this._restoreRetryTimer);
        this._restoreRetryTimer = null;
      }
      this.cancelRestoreJob();
      this._panelPositioners.clear();
      this.teardownPanelRepositionEventsIfIdle();
      this.selectedHighlightIds.clear();
      this.selectedEditFragmentIds.clear();
    }

    createToolbarButton(icon, label, onClick, className = '') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dev1-snapshot-highlighter-btn ${className}`.trim();
      btn.dataset.dev1SnapshotHighlighterUi = 'true';
      btn.setAttribute('aria-label', label);
      btn.dataset.tooltip = label;
      if (safeString(icon).trim().startsWith('<svg')) {
        btn.innerHTML = icon;
      } else {
        btn.textContent = icon;
      }
      let tooltipTimer = null;
      let tooltipEl = null;
      const showTooltip = () => {
        if (tooltipEl || !btn.dataset.tooltip) return;
        const tip = document.createElement('div');
        tip.className = 'permanent-toolbar-tooltip';
        tip.textContent = btn.dataset.tooltip;
        btn.appendChild(tip);
        requestAnimationFrame(() => tip.classList.add('show'));
        tooltipEl = tip;
      };
      const hideTooltip = () => {
        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          tooltipTimer = null;
        }
        if (tooltipEl && tooltipEl.parentNode) tooltipEl.parentNode.removeChild(tooltipEl);
        tooltipEl = null;
      };
      btn.addEventListener('mouseenter', () => {
        if (tooltipTimer) clearTimeout(tooltipTimer);
        tooltipTimer = setTimeout(showTooltip, 500);
      });
      btn.addEventListener('mouseleave', hideTooltip);
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        hideTooltip();
        onClick(event);
      });
      return btn;
    }

    getEstimatedToolbarSize(position = 'floating') {
      const isVertical = position === 'left' || position === 'right';
      return isVertical
        ? { width: 64, height: 350 }
        : { width: 320, height: 64 };
    }

    clampToolbarPointForSize(left, top, size = {}, padding = 8) {
      const width = Math.max(64, Number(size.width) || 320);
      const height = Math.max(40, Number(size.height) || 64);
      const maxLeft = Math.max(padding, window.innerWidth - width - padding);
      const maxTop = Math.max(padding, window.innerHeight - height - padding);
      return {
        left: Math.max(padding, Math.min(maxLeft, left)),
        top: Math.max(padding, Math.min(maxTop, top))
      };
    }

    calculateToolbarPositionNearAnchorWithSize(anchorRect, size = {}) {
      const margin = 8;
      const gap = 8;
      const toolbarWidth = Math.max(160, Number(size.width) || 316);
      const toolbarHeight = Math.max(34, Number(size.height) || 64);
      const anchorCenterX = anchorRect.left + anchorRect.width / 2;
      const anchorCenterY = anchorRect.top + anchorRect.height / 2;
      const alignRight = anchorCenterX > window.innerWidth / 2;
      const preferAbove = anchorCenterY > window.innerHeight / 2;
      let left = alignRight ? anchorRect.right - toolbarWidth : anchorRect.left;
      let top = preferAbove ? anchorRect.top - toolbarHeight - gap : anchorRect.bottom + gap;
      if (top < margin && preferAbove) top = anchorRect.bottom + gap;
      if (top + toolbarHeight > window.innerHeight - margin && !preferAbove) top = anchorRect.top - toolbarHeight - gap;
      return this.clampToolbarPointForSize(left, top, { width: toolbarWidth, height: toolbarHeight }, margin);
    }

    setToolbarFixedPositionOnElement(toolbar, left, top) {
      if (!toolbar) return;
      toolbar.style.setProperty('position', 'fixed', 'important');
      toolbar.style.setProperty('left', `${left}px`, 'important');
      toolbar.style.setProperty('top', `${top}px`, 'important');
      toolbar.style.setProperty('right', 'auto', 'important');
      toolbar.style.setProperty('bottom', 'auto', 'important');
      toolbar.style.setProperty('transform', 'none', 'important');
      toolbar.style.setProperty('display', 'flex', 'important');
      toolbar.style.setProperty('opacity', '1', 'important');
      toolbar.style.setProperty('pointer-events', 'auto', 'important');
    }

    setToolbarDockPositionOnElement(toolbar, position) {
      if (!toolbar || !position || position === 'floating') return;
      const offset = 12;
      const center = this.getDockAlongCenter(position);
      toolbar.style.setProperty('position', 'fixed', 'important');
      toolbar.style.setProperty('display', 'flex', 'important');
      toolbar.style.setProperty('opacity', '1', 'important');
      toolbar.style.setProperty('pointer-events', 'auto', 'important');
      if (position === 'left') {
        toolbar.style.setProperty('left', `${offset}px`, 'important');
        toolbar.style.setProperty('right', 'auto', 'important');
        toolbar.style.setProperty('top', `${Math.max(offset, Math.min(window.innerHeight - offset, center))}px`, 'important');
        toolbar.style.setProperty('bottom', 'auto', 'important');
        toolbar.style.setProperty('transform', 'translateY(-50%)', 'important');
      } else if (position === 'right') {
        toolbar.style.setProperty('left', 'auto', 'important');
        toolbar.style.setProperty('right', `${offset}px`, 'important');
        toolbar.style.setProperty('top', `${Math.max(offset, Math.min(window.innerHeight - offset, center))}px`, 'important');
        toolbar.style.setProperty('bottom', 'auto', 'important');
        toolbar.style.setProperty('transform', 'translateY(-50%)', 'important');
      } else if (position === 'top') {
        toolbar.style.setProperty('left', `${Math.max(offset, Math.min(window.innerWidth - offset, center))}px`, 'important');
        toolbar.style.setProperty('right', 'auto', 'important');
        toolbar.style.setProperty('top', `${offset}px`, 'important');
        toolbar.style.setProperty('bottom', 'auto', 'important');
        toolbar.style.setProperty('transform', 'translateX(-50%)', 'important');
      } else {
        toolbar.style.setProperty('left', `${Math.max(offset, Math.min(window.innerWidth - offset, center))}px`, 'important');
        toolbar.style.setProperty('right', 'auto', 'important');
        toolbar.style.setProperty('top', 'auto', 'important');
        toolbar.style.setProperty('bottom', `${offset}px`, 'important');
        toolbar.style.setProperty('transform', 'translateX(-50%)', 'important');
      }
    }

    applyInitialToolbarPlacement(toolbar) {
      if (!toolbar) return;
      this.toolbarUi = this.normalizeToolbarUi(this.toolbarUi);
      toolbar.style.setProperty('transition', 'none', 'important');
      this.applyFloatingToolbarLayout();
      const estimatedSize = this.getEstimatedToolbarSize('floating');
      const anchorRect = this.getConfiguredAnchorRect();
      if (anchorRect && !this.toolbarUi.userMoved) {
        const position = this.calculateToolbarPositionNearAnchorWithSize(anchorRect, estimatedSize);
        this.setToolbarFixedPositionOnElement(toolbar, position.left, position.top);
        return;
      }
      const left = Number(this.toolbarUi.left);
      const top = Number(this.toolbarUi.top);
      if (Number.isFinite(left) && Number.isFinite(top)) {
        const position = this.clampToolbarPointForSize(left, top, estimatedSize, 8);
        this.setToolbarFixedPositionOnElement(toolbar, position.left, position.top);
        return;
      }
      if (anchorRect) {
        const position = this.calculateToolbarPositionNearAnchorWithSize(anchorRect, estimatedSize);
        this.setToolbarFixedPositionOnElement(toolbar, position.left, position.top);
      }
    }

    restoreToolbarInitialTransition(toolbar) {
      if (!toolbar) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (toolbar && toolbar.isConnected) toolbar.style.removeProperty('transition');
        });
      });
    }

    createPermanentToolbar() {
      if (this.toolbar && document.body.contains(this.toolbar)) return this.toolbar;
      const toolbar = document.createElement('div');
      toolbar.id = TOOLBAR_ID;
      toolbar.className = 'permanent-toolbar';
      toolbar.dataset.dev1SnapshotHighlighterUi = 'true';
      this.applyPickerTheme(toolbar);
      const dragHandle = document.createElement('div');
      dragHandle.className = 'toolbar-drag-handle';
      dragHandle.dataset.dev1SnapshotHighlighterUi = 'true';
      dragHandle.setAttribute('aria-hidden', 'true');

      const colorBtn = this.createToolbarButton('🎨', this.t('selectColor'), () => this.showColorPicker(colorBtn), 'dev1-color');
      const toolBtn = this.createToolbarButton('🛠️', this.t('selectTool'), () => this.showToolPicker(toolBtn), 'dev1-tool');
      const indicator = this.createIndicatorCapsule();
      const deleteBtn = this.createToolbarButton('🗑️', this.t('delete'), () => {
        try { this._suppressCursor('operations'); } catch (_) { }
        this.showOperationsPanel(deleteBtn);
      }, 'dev1-delete');
      const backIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"></path><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"></path></svg>';
      const backBtn = this.createToolbarButton(backIcon, this.t('backToSnapshotHelper'), () => this.returnToSnapshotHelperPanel(), 'dev1-back');

      toolbar.appendChild(colorBtn);
      toolbar.appendChild(toolBtn);
      toolbar.appendChild(indicator);
      toolbar.appendChild(deleteBtn);
      toolbar.appendChild(backBtn);
      toolbar.appendChild(dragHandle);
      this.toolbar = toolbar;
      this.applyInitialToolbarPlacement(toolbar);
      document.body.appendChild(toolbar);
      this.applyToolbarPosition();
      this.restoreToolbarInitialTransition(toolbar);
      this.makeToolbarDraggable(toolbar);
      return toolbar;
    }

    removeToolbar() {
      if (this.toolbar && this.toolbar.parentNode) this.toolbar.remove();
      this.toolbar = null;
      this.removeDockToggle();
      this.disableToolbarDockOutsideClickCollapse();
    }

    async returnToSnapshotHelperPanel() {
      const config = { ...(this.config || {}), lang: this.lang };
      await this.hide();
      const helper = window.__dev1SnapshotHelper;
      if (!helper || typeof helper !== 'object') return { success: false, error: 'Snapshot helper is unavailable' };
      if (typeof helper.openPanel === 'function') return helper.openPanel(config);
      if (typeof helper.show === 'function') {
        const response = helper.show(config);
        if (typeof helper.openPanel === 'function') return helper.openPanel(config);
        return response || { success: true };
      }
      return { success: false, error: 'Snapshot helper panel API is unavailable' };
    }

    applyToolbarPosition() {
      if (!this.toolbar) return;
      this.toolbarUi = this.normalizeToolbarUi(this.toolbarUi);

      this.hideDockToggle();
      this.disableToolbarDockOutsideClickCollapse();
      this.applyFloatingToolbarLayout();
      const anchorRect = this.getConfiguredAnchorRect();
      if (anchorRect && !this.toolbarUi.userMoved) {
        const position = this.calculateToolbarPositionNearAnchor(anchorRect, this.toolbar);
        this.setToolbarFixedPosition(position.left, position.top);
        this.toolbarUi.left = position.left;
        this.toolbarUi.top = position.top;
        this.toolbarUi.userMoved = false;
        return;
      }
      const left = Number(this.toolbarUi.left);
      const top = Number(this.toolbarUi.top);
      if (Number.isFinite(left) && Number.isFinite(top)) {
        const toolbarWidth = Math.max(160, this.toolbar.offsetWidth || this.toolbar.getBoundingClientRect().width || 220);
        const toolbarHeight = Math.max(34, this.toolbar.offsetHeight || this.toolbar.getBoundingClientRect().height || 34);
        this.setToolbarFixedPosition(
          Math.max(8, Math.min(window.innerWidth - toolbarWidth - 8, left)),
          Math.max(8, Math.min(window.innerHeight - toolbarHeight - 8, top))
        );
        return;
      }
      if (anchorRect) {
        const position = this.calculateToolbarPositionNearAnchor(anchorRect, this.toolbar);
        this.setToolbarFixedPosition(position.left, position.top);
        this.toolbarUi.left = position.left;
        this.toolbarUi.top = position.top;
        this.toolbarUi.userMoved = false;
        return;
      }
    }

    setToolbarFixedPosition(left, top) {
      if (!this.toolbar) return;
      this.toolbar.style.setProperty('position', 'fixed', 'important');
      this.toolbar.style.setProperty('left', `${left}px`, 'important');
      this.toolbar.style.setProperty('top', `${top}px`, 'important');
      this.toolbar.style.setProperty('right', 'auto', 'important');
      this.toolbar.style.setProperty('bottom', 'auto', 'important');
      this.toolbar.style.setProperty('transform', 'none', 'important');
      this.toolbar.style.setProperty('display', 'flex', 'important');
      this.toolbar.style.setProperty('opacity', '1', 'important');
      this.toolbar.style.setProperty('pointer-events', 'auto', 'important');
    }

    getConfiguredAnchorRect() {
      const rect = this.config && this.config.highlighterAnchorRect;
      if (!rect || typeof rect !== 'object') return null;
      const left = Number(rect.left);
      const top = Number(rect.top);
      const right = Number(rect.right);
      const bottom = Number(rect.bottom);
      const width = Number(rect.width);
      const height = Number(rect.height);
      if (![left, top, right, bottom, width, height].every(Number.isFinite)) return null;
      if (width <= 0 || height <= 0) return null;
      return { left, top, right, bottom, width, height };
    }

    calculateToolbarPositionNearAnchor(anchorRect, toolbar) {
      const margin = 8;
      const gap = 8;
      const toolbarWidth = Math.max(160, toolbar.offsetWidth || toolbar.getBoundingClientRect().width || 220);
      const toolbarHeight = Math.max(34, toolbar.offsetHeight || toolbar.getBoundingClientRect().height || 34);
      const anchorCenterX = anchorRect.left + anchorRect.width / 2;
      const anchorCenterY = anchorRect.top + anchorRect.height / 2;
      const alignRight = anchorCenterX > window.innerWidth / 2;
      const preferAbove = anchorCenterY > window.innerHeight / 2;
      let left = alignRight ? anchorRect.right - toolbarWidth : anchorRect.left;
      let top = preferAbove ? anchorRect.top - toolbarHeight - gap : anchorRect.bottom + gap;
      if (top < margin && preferAbove) top = anchorRect.bottom + gap;
      if (top + toolbarHeight > window.innerHeight - margin && !preferAbove) top = anchorRect.top - toolbarHeight - gap;
      left = Math.max(margin, Math.min(window.innerWidth - toolbarWidth - margin, left));
      top = Math.max(margin, Math.min(window.innerHeight - toolbarHeight - margin, top));
      return { left, top };
    }

    getToolbarSize(toolbar = this.toolbar) {
      if (!toolbar) return { width: 220, height: 64 };
      const rect = toolbar.getBoundingClientRect();
      return {
        width: Math.max(80, toolbar.offsetWidth || rect.width || 220),
        height: Math.max(40, toolbar.offsetHeight || rect.height || 64)
      };
    }

    clampToolbarPosition(left, top, toolbar = this.toolbar, padding = 8) {
      const size = this.getToolbarSize(toolbar);
      const maxLeft = Math.max(padding, window.innerWidth - size.width - padding);
      const maxTop = Math.max(padding, window.innerHeight - size.height - padding);
      return {
        left: Math.max(padding, Math.min(maxLeft, left)),
        top: Math.max(padding, Math.min(maxTop, top))
      };
    }

    applyFloatingToolbarLayout() {
      if (!this.toolbar) return;
      this.toolbar.classList.remove('permanent-toolbar-vertical');
      this.toolbar.dataset.dockPosition = 'floating';
      this.toolbar.style.setProperty('flex-direction', 'row', 'important');
      this.toolbar.style.setProperty('align-items', 'center', 'important');
      this.toolbar.style.setProperty('justify-content', 'center', 'important');
      this.toolbar.style.setProperty('padding', '12px 16px', 'important');
      this.toolbar.querySelectorAll('.dev1-snapshot-highlighter-btn').forEach(btn => {
        btn.style.setProperty('margin', '0', 'important');
      });
      const indicator = this.toolbar.querySelector('.permanent-toolbar-indicator');
      if (indicator) indicator.style.setProperty('margin', '0 6px', 'important');
    }

    applyToolbarOrientation(position = 'floating') {
      if (!this.toolbar) return;
      const isVertical = position === 'left' || position === 'right';
      this.toolbar.classList.toggle('permanent-toolbar-vertical', isVertical);
      this.toolbar.dataset.dockPosition = position || 'floating';
      this.toolbar.style.setProperty('flex-direction', isVertical ? 'column' : 'row', 'important');
      this.toolbar.style.setProperty('align-items', 'center', 'important');
      this.toolbar.style.setProperty('justify-content', 'center', 'important');
      this.toolbar.style.setProperty('padding', isVertical ? '16px 12px' : '12px 16px', 'important');
      this.toolbar.querySelectorAll('.dev1-snapshot-highlighter-btn').forEach(btn => {
        btn.style.setProperty('margin', isVertical ? '4px 0' : '0', 'important');
      });
      const indicator = this.toolbar.querySelector('.permanent-toolbar-indicator');
      if (indicator) indicator.style.setProperty('margin', isVertical ? '6px 0' : '0 6px', 'important');
    }

    getDockAlongCenter(position) {
      const dockAlong = this.toolbarUi && this.toolbarUi.dockAlong;
      const center = Number(dockAlong && dockAlong.side === position ? dockAlong.center : NaN);
      if (Number.isFinite(center)) return center;
      return position === 'left' || position === 'right'
        ? window.innerHeight / 2
        : window.innerWidth / 2;
    }

    buildDockAlong(position, rect) {
      if (!rect || !position || position === 'floating') return null;
      const padding = 18;
      if (position === 'left' || position === 'right') {
        const center = Math.max(padding, Math.min(window.innerHeight - padding, rect.top + rect.height / 2));
        return { side: position, center: Math.round(center) };
      }
      const center = Math.max(padding, Math.min(window.innerWidth - padding, rect.left + rect.width / 2));
      return { side: position, center: Math.round(center) };
    }

    setToolbarDockPosition(position) {
      if (!this.toolbar) return;
      const offset = 12;
      const center = this.getDockAlongCenter(position);
      this.toolbar.style.setProperty('position', 'fixed', 'important');
      this.toolbar.style.setProperty('display', 'flex', 'important');
      this.toolbar.style.setProperty('opacity', '1', 'important');
      this.toolbar.style.setProperty('pointer-events', 'auto', 'important');
      if (position === 'left') {
        this.toolbar.style.setProperty('left', `${offset}px`, 'important');
        this.toolbar.style.setProperty('right', 'auto', 'important');
        this.toolbar.style.setProperty('top', `${Math.max(offset, Math.min(window.innerHeight - offset, center))}px`, 'important');
        this.toolbar.style.setProperty('bottom', 'auto', 'important');
        this.toolbar.style.setProperty('transform', 'translateY(-50%)', 'important');
      } else if (position === 'right') {
        this.toolbar.style.setProperty('left', 'auto', 'important');
        this.toolbar.style.setProperty('right', `${offset}px`, 'important');
        this.toolbar.style.setProperty('top', `${Math.max(offset, Math.min(window.innerHeight - offset, center))}px`, 'important');
        this.toolbar.style.setProperty('bottom', 'auto', 'important');
        this.toolbar.style.setProperty('transform', 'translateY(-50%)', 'important');
      } else if (position === 'top') {
        this.toolbar.style.setProperty('left', `${Math.max(offset, Math.min(window.innerWidth - offset, center))}px`, 'important');
        this.toolbar.style.setProperty('right', 'auto', 'important');
        this.toolbar.style.setProperty('top', `${offset}px`, 'important');
        this.toolbar.style.setProperty('bottom', 'auto', 'important');
        this.toolbar.style.setProperty('transform', 'translateX(-50%)', 'important');
      } else {
        this.toolbar.style.setProperty('left', `${Math.max(offset, Math.min(window.innerWidth - offset, center))}px`, 'important');
        this.toolbar.style.setProperty('right', 'auto', 'important');
        this.toolbar.style.setProperty('top', 'auto', 'important');
        this.toolbar.style.setProperty('bottom', `${offset}px`, 'important');
        this.toolbar.style.setProperty('transform', 'translateX(-50%)', 'important');
      }
    }

    findToolbarDockPosition(rect) {
      if (!rect) return null;
      const snapDistance = 18;
      const distances = {
        left: rect.left,
        right: window.innerWidth - rect.right,
        top: rect.top,
        bottom: window.innerHeight - rect.bottom
      };
      let bestPosition = null;
      let bestDistance = snapDistance + 1;
      Object.entries(distances).forEach(([position, distance]) => {
        if (distance <= snapDistance && distance < bestDistance) {
          bestPosition = position;
          bestDistance = distance;
        }
      });
      return bestPosition;
    }

    makeToolbarDraggable(toolbar) {
      let drag = null;
      const scheduleMove = () => {
        if (this._toolbarDragRafId) return;
        this._toolbarDragRafId = requestAnimationFrame(() => {
          this._toolbarDragRafId = null;
          if (!drag) return;
          const event = drag.lastEvent;
          if (!event) return;
          const zoom = Math.max(0.001, Number(drag.zoom) || 1);
          const deltaX = (event.clientX - drag.startX) / zoom;
          const deltaY = (event.clientY - drag.startY) / zoom;
          if (!drag.moved && Math.abs(deltaX) <= 3 && Math.abs(deltaY) <= 3) return;
          drag.moved = true;
          const next = this.clampToolbarPosition(drag.originLeft + deltaX, drag.originTop + deltaY, toolbar, 8);
          drag.nextLeft = next.left;
          drag.nextTop = next.top;
          toolbar.style.setProperty('transform', `translate3d(${Math.round(next.left - drag.originLeft)}px, ${Math.round(next.top - drag.originTop)}px, 0)`, 'important');
          this.toolbarUi.left = next.left;
          this.toolbarUi.top = next.top;
          this.toolbarUi.userMoved = true;
        });
      };
      const move = (event) => {
        if (!drag) return;
        if (drag.pointerId != null && event.pointerId !== drag.pointerId) return;
        if (event.buttons === 0 && event.pointerType !== 'touch') {
          end(event);
          return;
        }
        drag.lastEvent = event;
        scheduleMove();
        event.preventDefault();
      };
      const end = (event) => {
        if (!drag) return;
        if (drag.pointerId != null && event && event.pointerId != null && event.pointerId !== drag.pointerId) return;
        if (this._toolbarDragRafId) {
          cancelAnimationFrame(this._toolbarDragRafId);
          this._toolbarDragRafId = null;
          if (drag.lastEvent) {
            const last = drag.lastEvent;
            const zoom = Math.max(0.001, Number(drag.zoom) || 1);
            const deltaX = (last.clientX - drag.startX) / zoom;
            const deltaY = (last.clientY - drag.startY) / zoom;
            const next = this.clampToolbarPosition(drag.originLeft + deltaX, drag.originTop + deltaY, toolbar, 8);
            drag.nextLeft = next.left;
            drag.nextTop = next.top;
          }
        }
        try { toolbar.releasePointerCapture(drag.pointerId); } catch (_) { }
        toolbar.classList.remove('is-dragging');
        document.documentElement.classList.remove('dev1-snapshot-highlighter-dragging');
        document.removeEventListener('pointermove', move, true);
        document.removeEventListener('pointerup', end, true);
        document.removeEventListener('pointercancel', end, true);
        window.removeEventListener('blur', end, true);
        if (drag.moved) {
          try { delete this.config.highlighterAnchorRect; } catch (_) { this.config.highlighterAnchorRect = null; }
          const finalLeft = Number.isFinite(drag.nextLeft) ? drag.nextLeft : drag.originLeft;
          const finalTop = Number.isFinite(drag.nextTop) ? drag.nextTop : drag.originTop;
          this.applyFloatingToolbarLayout();
          this.setToolbarFixedPosition(finalLeft, finalTop);
          this.toolbarUi.left = finalLeft;
          this.toolbarUi.top = finalTop;
          this.toolbarUi.userMoved = true;
          this.setToolbarDockState('floating', false);
          this.hideDockToggle();
          this.disableToolbarDockOutsideClickCollapse();
          this.repositionTrackedPanels();
          this.requestSave(true);
        } else {
          this.applyToolbarPosition();
        }
        drag = null;
      };
      toolbar.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        if (!event.target || !event.target.closest('.toolbar-drag-handle')) return;
        const rect = toolbar.getBoundingClientRect();
        this.closeTransientPanels();
        this.hideDockToggle();
        this.disableToolbarDockOutsideClickCollapse();
        toolbar.style.setProperty('left', `${rect.left}px`, 'important');
        toolbar.style.setProperty('top', `${rect.top}px`, 'important');
        toolbar.style.setProperty('right', 'auto', 'important');
        toolbar.style.setProperty('bottom', 'auto', 'important');
        toolbar.style.setProperty('transform', 'none', 'important');
        drag = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originLeft: rect.left,
          originTop: rect.top,
          nextLeft: rect.left,
          nextTop: rect.top,
          zoom: getDocumentZoom(),
          moved: false,
          lastEvent: event
        };
        try { toolbar.setPointerCapture(event.pointerId); } catch (_) { }
        toolbar.classList.add('is-dragging');
        document.documentElement.classList.add('dev1-snapshot-highlighter-dragging');
        document.addEventListener('pointermove', move, true);
        document.addEventListener('pointerup', end, true);
        document.addEventListener('pointercancel', end, true);
        window.addEventListener('blur', end, true);
        event.preventDefault();
      });
    }

    createDockToggle() {
      if (this.toolbarDockToggle && document.body.contains(this.toolbarDockToggle)) return this.toolbarDockToggle;
      const toggle = document.createElement('div');
      toggle.className = 'permanent-toolbar-indicator permanent-toolbar-dock-toggle';
      toggle.dataset.dev1SnapshotHighlighterUi = 'true';
      this.applyPickerTheme(toggle);
      toggle.setAttribute('role', 'button');
      toggle.setAttribute('tabindex', '0');
      toggle.dataset.tooltip = this.t('current');
      toggle.innerHTML = `
        <span class="indicator-color-container"><span class="indicator-color"></span></span>
        <span class="indicator-separator"></span>
        <span class="indicator-tool-container"><span class="indicator-tool"></span></span>
      `;
      const expand = (event) => {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        const state = this.getToolbarDockState();
        this.expandToolbarFromDock({ position: state.position || 'bottom' });
      };
      toggle.addEventListener('click', expand);
      toggle.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        expand(event);
      });
      document.body.appendChild(toggle);
      this.toolbarDockToggle = toggle;
      this.updatePermanentToolbarIndicator();
      return toggle;
    }

    removeDockToggle() {
      if (this.toolbarDockToggle && this.toolbarDockToggle.parentNode) this.toolbarDockToggle.remove();
      this.toolbarDockToggle = null;
    }

    hideDockToggle() {
      if (!this.toolbarDockToggle) return;
      this.toolbarDockToggle.style.setProperty('display', 'none', 'important');
      this.toolbarDockToggle.style.setProperty('opacity', '0', 'important');
      this.toolbarDockToggle.style.setProperty('pointer-events', 'none', 'important');
    }

    positionDockToggle(position) {
      const toggle = this.createDockToggle();
      const offset = 10;
      const center = this.getDockAlongCenter(position);
      toggle.dataset.dockPosition = position;
      toggle.classList.toggle('permanent-toolbar-dock-toggle-vertical', position === 'left' || position === 'right');
      toggle.style.setProperty('display', 'inline-flex', 'important');
      toggle.style.setProperty('opacity', '1', 'important');
      toggle.style.setProperty('pointer-events', 'auto', 'important');
      if (position === 'left') {
        toggle.style.setProperty('left', `${offset}px`, 'important');
        toggle.style.setProperty('right', 'auto', 'important');
        toggle.style.setProperty('top', `${Math.max(offset, Math.min(window.innerHeight - offset, center))}px`, 'important');
        toggle.style.setProperty('bottom', 'auto', 'important');
        toggle.style.setProperty('transform', 'translateY(-50%)', 'important');
      } else if (position === 'right') {
        toggle.style.setProperty('left', 'auto', 'important');
        toggle.style.setProperty('right', `${offset}px`, 'important');
        toggle.style.setProperty('top', `${Math.max(offset, Math.min(window.innerHeight - offset, center))}px`, 'important');
        toggle.style.setProperty('bottom', 'auto', 'important');
        toggle.style.setProperty('transform', 'translateY(-50%)', 'important');
      } else if (position === 'top') {
        toggle.style.setProperty('left', `${Math.max(offset, Math.min(window.innerWidth - offset, center))}px`, 'important');
        toggle.style.setProperty('right', 'auto', 'important');
        toggle.style.setProperty('top', `${offset}px`, 'important');
        toggle.style.setProperty('bottom', 'auto', 'important');
        toggle.style.setProperty('transform', 'translateX(-50%)', 'important');
      } else {
        toggle.style.setProperty('left', `${Math.max(offset, Math.min(window.innerWidth - offset, center))}px`, 'important');
        toggle.style.setProperty('right', 'auto', 'important');
        toggle.style.setProperty('top', 'auto', 'important');
        toggle.style.setProperty('bottom', `${offset}px`, 'important');
        toggle.style.setProperty('transform', 'translateX(-50%)', 'important');
      }
    }

    collapseToolbarToDock(position, options = {}) {
      if (!this.toolbar || !position || position === 'floating') return;
      const currentRect = this.toolbar.getBoundingClientRect();
      const dockAlong = this.toolbarUi.dockAlong || this.buildDockAlong(position, currentRect);
      this.setToolbarDockState(position, true, dockAlong);
      this.closeTransientPanels();
      this.applyToolbarOrientation(position);
      this.setToolbarDockPosition(position);
      this.positionDockToggle(position);
      this.toolbar.style.setProperty('display', 'none', 'important');
      this.toolbar.style.setProperty('pointer-events', 'none', 'important');
      this.disableToolbarDockOutsideClickCollapse();
      this.updatePermanentToolbarIndicator();
      if (!options.skipSave) this.requestSave(true);
    }

    expandToolbarFromDock(options = {}) {
      if (!this.toolbar) return;
      const fallback = this.getToolbarDockState().position || 'bottom';
      const position = options.position && options.position !== 'floating' ? options.position : fallback;
      if (!position || position === 'floating') return;
      const dockAlong = this.toolbarUi.dockAlong || { side: position, center: this.getDockAlongCenter(position) };
      this.setToolbarDockState(position, false, dockAlong);
      this.applyToolbarOrientation(position);
      this.setToolbarDockPosition(position);
      this.hideDockToggle();
      this.toolbar.style.setProperty('display', 'flex', 'important');
      this.toolbar.style.setProperty('opacity', '1', 'important');
      this.toolbar.style.setProperty('pointer-events', 'auto', 'important');
      this.enableToolbarDockOutsideClickCollapse();
      this.updatePermanentToolbarIndicator();
      if (!options.skipSave) this.requestSave(true);
    }

    enableToolbarDockOutsideClickCollapse() {
      if (this.toolbarDockOutsideClickListener) return;
      this.toolbarDockOutsideClickListener = (event) => {
        const target = elementFromNode(event && event.target);
        if (!target) return;
        if (target.closest(UI_SELECTOR)) return;
        const state = this.getToolbarDockState();
        if (!state.position || state.position === 'floating' || state.collapsed) return;
        this.collapseToolbarToDock(state.position);
      };
      document.addEventListener('mousedown', this.toolbarDockOutsideClickListener, true);
      document.addEventListener('touchstart', this.toolbarDockOutsideClickListener, true);
    }

    disableToolbarDockOutsideClickCollapse() {
      if (!this.toolbarDockOutsideClickListener) return;
      document.removeEventListener('mousedown', this.toolbarDockOutsideClickListener, true);
      document.removeEventListener('touchstart', this.toolbarDockOutsideClickListener, true);
      this.toolbarDockOutsideClickListener = null;
    }

    repositionTrackedPanels() {
      Array.from(this._panelPositioners || []).forEach(fn => {
        try { fn(); } catch (_) { }
      });
    }

    createIndicatorCapsule() {
      const indicator = document.createElement('div');
      indicator.className = 'permanent-toolbar-indicator';
      indicator.dataset.dev1SnapshotHighlighterUi = 'true';
      indicator.dataset.tooltip = this.t('current');
      indicator.innerHTML = `
        <span class="indicator-color-container"><span class="indicator-color"></span></span>
        <span class="indicator-separator"></span>
        <span class="indicator-tool-container"><span class="indicator-tool"></span></span>
      `;
      let tooltipTimer = null;
      let tooltipEl = null;
      const showTooltip = () => {
        if (tooltipEl || !indicator.dataset.tooltip) return;
        const tip = document.createElement('div');
        tip.className = 'permanent-toolbar-tooltip';
        tip.textContent = indicator.dataset.tooltip;
        indicator.appendChild(tip);
        requestAnimationFrame(() => tip.classList.add('show'));
        tooltipEl = tip;
      };
      const hideTooltip = () => {
        if (tooltipTimer) {
          clearTimeout(tooltipTimer);
          tooltipTimer = null;
        }
        if (tooltipEl && tooltipEl.parentNode) tooltipEl.parentNode.removeChild(tooltipEl);
        tooltipEl = null;
      };
      indicator.addEventListener('mouseenter', () => {
        if (tooltipTimer) clearTimeout(tooltipTimer);
        tooltipTimer = setTimeout(showTooltip, 500);
      });
      indicator.addEventListener('mouseleave', hideTooltip);
      indicator.addEventListener('click', (event) => {
        event.stopPropagation();
        hideTooltip();
        this.showIndicatorDetailsPanel(indicator);
      });
      return indicator;
    }

    applyColorPreview(element, color, key = '') {
      if (!element) return;
      const raw = safeString(color);
      element.classList.toggle('transparent-swatch', raw === 'transparent');
      element.style.removeProperty('background');
      element.style.removeProperty('background-image');
      element.style.removeProperty('-webkit-background-clip');
      element.style.removeProperty('background-clip');
      element.style.removeProperty('-webkit-text-fill-color');
      element.style.removeProperty('color');
      if (this.isRainbowColor(raw)) {
        const seed = this.getRainbowVariant(raw) === 'random'
          ? this._seedFromId(`${this.currentUrl}:${key || raw}:preview`)
          : 0;
        element.style.background = this._buildRainbowGradientPreview(seed);
        return;
      }
      if (raw === 'transparent') return;
      element.style.background = raw || '#2196F3';
    }

    styleRecentColorBadge(badge, item) {
      if (!badge || !item) return;
      const color = safeString(item.color);
      badge.classList.toggle('rainbow-uses', this.isRainbowColor(color));
      badge.classList.toggle('transparent-uses', color === 'transparent');
      badge.style.removeProperty('background');
      badge.style.removeProperty('color');
      badge.style.removeProperty('-webkit-background-clip');
      badge.style.removeProperty('background-clip');
      badge.style.removeProperty('-webkit-text-fill-color');
      if (this.isRainbowColor(color)) {
        badge.style.setProperty('background', 'transparent', 'important');
        const seed = this.getRainbowVariant(color) === 'random'
          ? this._seedFromId(`${this.currentUrl}:${item.key || item.name || color}:recent`)
          : 0;
        badge.style.setProperty('background-image', this._buildRainbowGradientPreview(seed), 'important');
        badge.style.setProperty('-webkit-background-clip', 'text');
        badge.style.setProperty('background-clip', 'text');
        badge.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
        return;
      }
      if (color === 'transparent') {
        badge.style.setProperty('background', this.darkModeEnabled ? 'rgba(255,255,255,.18)' : 'rgba(15,23,42,.12)', 'important');
        badge.style.setProperty('color', this.darkModeEnabled ? '#f8fafc' : '#0f172a', 'important');
        return;
      }
      const renderColor = this.getRenderableColor(color);
      badge.style.setProperty('background', /^#[0-9a-f]{6}$/i.test(renderColor) ? rgbaFromHex(renderColor, 0.18) : 'rgba(25,118,210,.12)', 'important');
      badge.style.setProperty('color', renderColor || '#1976d2', 'important');
    }

    updatePermanentToolbarIndicator() {
      const indicators = [];
      const toolbarIndicator = this.toolbar && this.toolbar.querySelector('.permanent-toolbar-indicator');
      if (toolbarIndicator) indicators.push(toolbarIndicator);
      if (this.toolbarDockToggle) indicators.push(this.toolbarDockToggle);
      indicators.forEach(indicator => {
        const colorDot = indicator.querySelector('.indicator-color');
        const toolIcon = indicator.querySelector('.indicator-tool');
        if (colorDot) {
          this.applyColorPreview(colorDot, this.currentColor, this.currentColorKey || this.currentColor);
        }
        if (toolIcon) {
          const tool = this.findTool(this.currentTool);
          const markup = tool ? this.getToolIconMarkup(tool) : this.escapeHtml(this.getCurrentToolIcon());
          if (safeString(markup).trim().startsWith('<svg')) toolIcon.innerHTML = markup;
          else toolIcon.textContent = this.getCurrentToolIcon();
        }
        indicator.dataset.tooltip = `${this.t('currentColor')}: ${this.getCurrentColorName()} | ${this.t('currentTool')}: ${this.getCurrentToolName()}`;
        indicator.removeAttribute('title');
      });
    }

    showIndicatorDetailsPanel(anchor) {
      if (this.indicatorPanel && this.indicatorPanel.parentNode) {
        this.closeTransientPanelByKey('indicatorPanel');
        return;
      }
      this.closeTransientPanels();
      const panel = this.createPanel('indicator-details-panel', anchor);
      this.applyPickerTheme(panel);
      panel.innerHTML = `
        <div class="dev1-panel-title">${this.t('current')}</div>
        <div class="dev1-indicator-row"><span>${this.t('currentColor')}</span><strong>${this.escapeHtml(this.getCurrentColorName())}</strong></div>
        <div class="dev1-indicator-row"><span>${this.t('currentTool')}</span><strong>${this.escapeHtml(this.getCurrentToolName())}</strong></div>
        <div class="dev1-indicator-row"><span>${this.t('highlightCount')}</span><strong>${this.highlights.size}</strong></div>
      `;
      document.body.appendChild(panel);
      this.trackPanelPosition(panel, anchor, 'top');
      this.indicatorPanel = panel;
    }

    showHighlightActionPanel(highlightEl) {
      const highlightId = highlightEl && highlightEl.getAttribute('data-highlight-id');
      if (!highlightId) return;
      if (this.activeHighlightPanel && this.activeHighlightPanel.parentNode) {
        const currentId = this.activeHighlightPanel.dataset.highlightId || '';
        this.untrackPanelPosition(this.activeHighlightPanel);
        this.activeHighlightPanel.remove();
        this.activeHighlightPanel = null;
        if (currentId === highlightId) return;
      }
      this.closeTransientPanels();
      const entry = this.ensureHighlightEntryFromElement(highlightEl) || {};
      const color = entry.color || highlightEl.dataset.color || this.currentColor;
      const colorVariant = entry.textColorOverride || highlightEl.dataset.textColorOverride || '';
      const colorName = this.getColorNameForValue(color, colorVariant, entry.colorName || highlightEl.dataset.colorName || '', entry.colorNameKey || highlightEl.dataset.colorKey || '');
      const toolId = entry.toolStyle || highlightEl.dataset.toolStyle || 'highlight';
      const toolName = this.getToolNameForId(toolId);
      const noteText = this.normalizeHighlightNote(entry.note != null ? entry.note : highlightEl.dataset.highlightNote || '');
      const noteInputId = `dev1-highlight-note-${hashUrl(highlightId)}`;
      const noteLabel = this.getHighlightNoteLabel(entry, highlightEl);
      const accent = this.getUiAccent(color, highlightEl);
      const panel = this.createPanel('highlight-action-panel', highlightEl);
      this.applyPickerTheme(panel);
      panel.classList.add('dev1-highlight-action-tooltip');
      panel.classList.toggle('dev1-highlight-action-rainbow', !!accent.isRainbow);
      panel.dataset.highlightId = highlightId;
      panel.style.setProperty('--dev1-highlight-panel-accent', accent.color);
      panel.style.setProperty('--dev1-highlight-panel-accent-visible', accent.visibleColor);
      panel.style.setProperty('--dev1-highlight-panel-accent-soft', accent.soft);
      panel.style.setProperty('--dev1-highlight-panel-hover', accent.hoverBg);
      panel.style.setProperty('--dev1-highlight-panel-gradient', accent.gradient);
      panel.style.setProperty('--dev1-highlight-panel-bg', this.darkModeEnabled ? '#2a2a2a' : '#ffffff');
      panel.innerHTML = `
        <div class="dev1-highlight-action-summary">
          <span class="dev1-highlight-action-swatch" aria-hidden="true"></span>
          <span class="dev1-highlight-action-meta">
            <strong>${this.escapeHtml(colorName)}</strong>
            <span>${this.escapeHtml(toolName)}</span>
          </span>
          <div class="dev1-highlight-action-buttons" role="group"></div>
        </div>
        <div class="dev1-highlight-note-field">
          <label class="dev1-highlight-note-label" for="${noteInputId}">${this.escapeHtml(noteLabel)}</label>
          <textarea id="${noteInputId}" class="dev1-highlight-note-input" rows="3" maxlength="2000" data-highlight-note="${this.escapeHtml(noteText)}" placeholder="${this.escapeHtml(this.t('highlightNotePlaceholder'))}">${this.escapeHtml(noteText)}</textarea>
        </div>
      `;
      const swatch = panel.querySelector('.dev1-highlight-action-swatch');
      if (swatch) this.applyColorPreview(swatch, color, entry.colorNameKey || highlightEl.dataset.colorKey || color);
      const noteLabelEl = panel.querySelector('.dev1-highlight-note-label');
      const refreshNoteLabel = () => {
        if (noteLabelEl) noteLabelEl.textContent = this.getHighlightNoteLabel(this.highlights.get(highlightId) || entry, highlightEl);
      };
      const noteInput = panel.querySelector('.dev1-highlight-note-input');
      if (noteInput) {
        const stopPanelEvent = event => event.stopPropagation();
        ['mousedown', 'mouseup', 'click', 'dblclick', 'keydown', 'keyup', 'touchstart', 'touchend'].forEach(type => {
          noteInput.addEventListener(type, stopPanelEvent);
        });
        noteInput.addEventListener('input', (event) => {
          event.stopPropagation();
          const target = event.currentTarget;
          const normalized = this.normalizeHighlightNote(target.value);
          if (target.value !== normalized) {
            const cursor = Math.min(normalized.length, target.selectionStart || normalized.length);
            target.value = normalized;
            try { target.setSelectionRange(cursor, cursor); } catch (_) { }
          }
          try {
            target.defaultValue = normalized;
            if (normalized) target.dataset.highlightNote = normalized;
            else delete target.dataset.highlightNote;
          } catch (_) { }
          this.updateHighlightNote(highlightId, normalized);
          refreshNoteLabel();
        });
        noteInput.addEventListener('change', (event) => {
          event.stopPropagation();
          this.updateHighlightNote(highlightId, event.currentTarget.value, { immediate: true });
          refreshNoteLabel();
        });
        noteInput.addEventListener('blur', () => {
          this.requestSave(true);
        });
      }
      const actions = panel.querySelector('.dev1-highlight-action-buttons');
      const addAction = (className, label, icon, handler, danger = false) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `dev1-highlight-action-btn ${className}${danger ? ' danger' : ''}`;
        btn.title = label;
        btn.setAttribute('aria-label', label);
        btn.textContent = icon;
        btn.addEventListener('click', (event) => {
          event.stopPropagation();
          handler(event);
        });
        actions.appendChild(btn);
        return btn;
      };
      addAction('dev1-delete-highlight', this.t('delete'), '🗑️', () => {
        this.removeHighlightById(highlightId);
        this.untrackPanelPosition(panel);
        if (panel.parentNode) panel.remove();
        this.activeHighlightPanel = null;
        this.requestSave(true);
      }, true);
      addAction('dev1-change-highlight-color', this.t('selectColor'), '🎨', () => {
        this.showColorPicker(highlightEl, { highlightId });
      });
      addAction('dev1-change-highlight-tool', this.t('selectTool'), '🛠️', () => {
        this.showToolPicker(highlightEl, { highlightId });
      });
      addAction('dev1-close-highlight-panel', this.t('close'), '×', () => {
        this.untrackPanelPosition(panel);
        if (panel.parentNode) panel.remove();
        this.activeHighlightPanel = null;
      });
      document.body.appendChild(panel);
      this.trackPanelPosition(panel, highlightEl, 'top');
      this.activeHighlightPanel = panel;
    }

    ensureHighlightEntryFromElement(highlightEl) {
      const highlightId = highlightEl && highlightEl.getAttribute('data-highlight-id');
      if (!highlightId) return null;
      const existing = this.highlights.get(highlightId);
      if (existing) return existing;
      const group = this.getGroupElements(highlightId);
      const first = group[0] || highlightEl;
      const color = first.dataset.color || this.currentColor;
      const textColorOverride = first.dataset.textColorOverride || '';
      const colorNameKey = first.dataset.colorKey || this.getColorNameKeyForValue(color, textColorOverride, first.dataset.colorName || '');
      const colorName = this.getColorNameForValue(color, textColorOverride, first.dataset.colorName || '', colorNameKey);
      const toolStyle = first.dataset.toolStyle || 'highlight';
      const note = this.normalizeHighlightNote(first.dataset.highlightNote || highlightEl.dataset.highlightNote || '');
      const timestamp = Number(first.dataset.timestamp);
      const updatedAt = this.normalizeHighlightTimestamp(first.dataset.highlightUpdatedAt || first.dataset.updatedAt);
      const entry = {
        id: highlightId,
        color,
        colorName,
        colorNameKey,
        textColorOverride,
        toolStyle,
        toolName: this.getToolNameForId(toolStyle),
        mode: this.isEditTool(toolStyle) ? 'edit' : 'visual',
        text: group.map(el => safeString(el.dataset.text || el.textContent || '')).join(''),
        timestamp: Number.isFinite(timestamp) ? timestamp : now(),
        url: this.currentUrl,
        pageTitle: document.title || '',
        segments: []
      };
      if (first.dataset.randomSeed) entry.randomSeed = first.dataset.randomSeed;
      if (note) entry.note = note;
      if (updatedAt) entry.updatedAt = updatedAt;
      this.highlights.set(highlightId, entry);
      if (note || updatedAt) this.syncHighlightNoteToDom(highlightId, note);
      return entry;
    }

    hydrateExistingDomHighlights() {
      const seen = new Set();
      this.queryAllDeep(HIGHLIGHT_ANY_SELECTOR).forEach(el => {
        if (!el || this.isUiElement(el)) return;
        const highlightId = el.getAttribute('data-highlight-id');
        if (!highlightId || seen.has(highlightId)) return;
        seen.add(highlightId);
        const entry = this.ensureHighlightEntryFromElement(el);
        if (entry) this.syncHighlightEntryToDom(entry);
      });
    }

    updateHighlightNote(highlightId, value, options = {}) {
      if (!highlightId) return false;
      const entry = this.highlights.get(highlightId);
      if (!entry) return false;
      const note = this.normalizeHighlightNote(value);
      if (note) entry.note = note;
      else delete entry.note;
      const updatedAt = this.markHighlightModified(highlightId, { syncDom: false });
      this.syncHighlightNoteToDom(highlightId, note);
      if (options.save !== false) this.requestSave(options.immediate === true);
      return updatedAt;
    }

    markHighlightModified(highlightId, options = {}) {
      if (!highlightId) return 0;
      const updatedAt = now();
      const entry = this.highlights.get(highlightId);
      if (entry) entry.updatedAt = updatedAt;
      if (options.syncDom !== false) this.syncHighlightUpdatedAtToDom(highlightId, updatedAt);
      return updatedAt;
    }

    syncHighlightUpdatedAtToDom(highlightId, value) {
      if (!highlightId) return;
      const updatedAt = this.normalizeHighlightTimestamp(value);
      this.getGroupElements(highlightId).forEach(el => {
        if (updatedAt) el.dataset.highlightUpdatedAt = String(updatedAt);
        else {
          delete el.dataset.highlightUpdatedAt;
          el.removeAttribute('data-highlight-updated-at');
        }
      });
    }

    getAdjacentHighlightNoteNodes(el) {
      if (!el || !el.classList) return [];
      const highlightId = el.dataset.highlightId || '';
      const nodes = [];
      let next = el.nextElementSibling;
      while (
        next
        && next.classList
        && (next.classList.contains(NOTE_STATIC_CLASS) || next.classList.contains(NOTE_BUBBLE_CLASS))
        && (!highlightId || next.dataset.highlightId === highlightId)
      ) {
        nodes.push(next);
        next = next.nextElementSibling;
      }
      return nodes;
    }

    getHighlightNoteStaticStyle() {
      return {
        bg: '#fff8b3',
        border: '#f2d34f',
        text: '#5f4b00'
      };
    }

    syncHighlightNoteStaticLabelToElement(el, noteValue = '', options = {}) {
      if (!el || !el.classList) return;
      const note = this.normalizeHighlightNote(noteValue != null ? noteValue : el.dataset.highlightNote || '');
      try {
        el.querySelectorAll(`:scope > .${NOTE_BUBBLE_CLASS}, :scope > .${NOTE_STATIC_CLASS}`).forEach(node => node.remove());
      } catch (_) { }
      const adjacent = this.getAdjacentHighlightNoteNodes(el);
      let label = adjacent.find(node => node.classList && node.classList.contains(NOTE_STATIC_CLASS)) || null;
      adjacent.forEach(node => {
        if (node !== label) {
          try { node.remove(); } catch (_) { }
        }
      });
      el.removeAttribute('title');
      if (!note || options.visible === false || !el.parentNode) {
        if (label) {
          try { label.remove(); } catch (_) { }
        }
        return;
      }
      if (!label) {
        label = document.createElement('span');
        label.className = NOTE_STATIC_CLASS;
        el.parentNode.insertBefore(label, el.nextSibling);
      }
      const staticStyle = this.getHighlightNoteStaticStyle(el);
      label.dataset.highlightId = el.dataset.highlightId || '';
      label.dataset.note = note;
      label.dataset.dev1HighlightNoteStatic = 'true';
      label.setAttribute('contenteditable', 'false');
      const labelText = this.formatHighlightNoteStaticText(note);
      label.setAttribute('aria-label', labelText);
      label.style.setProperty('--dev1-note-static-bg', staticStyle.bg);
      label.style.setProperty('--dev1-note-static-border', staticStyle.border);
      label.style.setProperty('--dev1-note-static-text', staticStyle.text);
      label.textContent = labelText;
    }

    syncHighlightNoteToDom(highlightId, value) {
      if (!highlightId) return;
      const entry = this.highlights.get(highlightId) || {};
      const note = this.normalizeHighlightNote(arguments.length > 1 ? value : entry.note);
      const updatedAt = this.normalizeHighlightTimestamp(entry.updatedAt);
      const group = this.getGroupElements(highlightId);
      group.forEach((el, index) => {
        if (note) el.dataset.highlightNote = note;
        else {
          delete el.dataset.highlightNote;
          el.removeAttribute('data-highlight-note');
        }
        if (updatedAt) el.dataset.highlightUpdatedAt = String(updatedAt);
        else {
          delete el.dataset.highlightUpdatedAt;
          el.removeAttribute('data-highlight-updated-at');
        }
        this.syncHighlightNoteStaticLabelToElement(el, note, { visible: index === group.length - 1 });
      });
    }

    syncHighlightEntryToDom(entry, options = {}) {
      if (!entry || !entry.id) return;
      const color = entry.color || this.currentColor;
      const textColorOverride = entry.textColorOverride || '';
      const colorName = this.getColorNameForValue(color, textColorOverride, entry.colorName || '', entry.colorNameKey || '');
      const colorNameKey = entry.colorNameKey || this.getColorNameKeyForValue(color, textColorOverride, colorName);
      const toolStyle = entry.toolStyle || 'highlight';
      this.getGroupElements(entry.id).forEach((el, index) => {
        el.dataset.color = this.getCssColorDataValue(color);
        el.dataset.colorName = colorName;
        el.dataset.colorKey = colorNameKey;
        el.dataset.toolStyle = toolStyle;
        if (textColorOverride) el.dataset.textColorOverride = textColorOverride;
        else delete el.dataset.textColorOverride;
        if (entry.randomSeed) el.dataset.randomSeed = safeString(entry.randomSeed || this._seedFromId(`${entry.id}:${index}`));
        else {
          delete el.dataset.randomSeed;
          delete el.dataset.rbVariant;
        }
        if (options.applyStyles !== false) this.applyHighlightStyles(el, color, toolStyle, textColorOverride);
      });
      this.syncHighlightNoteToDom(entry.id, entry.note || '');
    }

    applyCurrentColorToHighlight(highlightId) {
      return this.applyColorItemToHighlight(highlightId, {
        color: this.currentColor,
        key: this.currentColorKey || this.getColorNameKeyForValue(this.currentColor, this.currentColorVariant, this.currentColorName || ''),
        name: this.getCurrentColorName(),
        variant: this.currentColorVariant || 'auto'
      }, { trackRecent: false });
    }

    applyColorItemToHighlight(highlightId, item = {}, options = {}) {
      if (!highlightId) return;
      const entry = this.highlights.get(highlightId);
      if (!entry) return;
      if (!item || !item.color) return;
      const color = item.color;
      const resolvedVariant = this.resolveColorVariant(color, item.variant || '');
      const colorNameKey = item.key || this.getColorNameKeyForValue(color, resolvedVariant, item.name || '');
      const colorName = this.getColorNameForValue(color, resolvedVariant, item.name || color, colorNameKey);
      const textColorOverride = resolvedVariant === 'white' || resolvedVariant === 'black' ? resolvedVariant : '';
      entry.color = color;
      entry.colorNameKey = colorNameKey;
      entry.colorName = colorName;
      entry.textColorOverride = textColorOverride;
      this.markHighlightModified(highlightId);
      if (this.isRainbowColor(color)) {
        entry.randomSeed = safeString(entry.randomSeed || this._seedFromId(highlightId));
      } else {
        delete entry.randomSeed;
      }
      const toolStyle = entry.toolStyle || 'highlight';
      this.getGroupElements(highlightId).forEach((el, index) => {
        el.dataset.color = this.getCssColorDataValue(color);
        el.dataset.colorName = colorName;
        el.dataset.colorKey = colorNameKey;
        if (textColorOverride) el.dataset.textColorOverride = textColorOverride;
        else delete el.dataset.textColorOverride;
        if (this.isRainbowColor(color)) {
          const seed = safeString(entry.randomSeed || this._seedFromId(`${highlightId}:${index}`));
          el.dataset.randomSeed = seed;
          this.ensureRainbowSeed(el, color);
        } else {
          delete el.dataset.randomSeed;
          delete el.dataset.rbVariant;
        }
        this.applyHighlightStyles(el, color, toolStyle, textColorOverride);
        this.scheduleElementEffectRefresh(el, toolStyle, color);
      });
      this.syncHighlightNoteToDom(highlightId, entry.note || '');
      this.refreshGroupEffects(highlightId, toolStyle, color);
      if (options.trackRecent !== false) {
        this.pushRecentColor({ color, key: colorNameKey, name: colorName, variant: resolvedVariant });
      }
      this.updatePermanentToolbarIndicator();
      this.requestSave(true);
      return true;
    }

    applyCurrentToolToHighlight(highlightId) {
      const tool = this.findTool(this.currentTool) || {
        id: this.currentTool || 'highlight',
        name: this.currentToolName || this.getToolNameForId(this.currentTool || 'highlight')
      };
      return this.applyToolItemToHighlight(highlightId, tool, { trackRecent: false });
    }

    applyToolItemToHighlight(highlightId, tool, options = {}) {
      if (!highlightId) return;
      const entry = this.highlights.get(highlightId);
      if (!entry) return;
      const nextTool = safeString(typeof tool === 'string' ? tool : tool && tool.id) || 'highlight';
      const toolInfo = (tool && typeof tool === 'object' ? tool : null) || this.findTool(nextTool);
      if (toolInfo && toolInfo.isAction) {
        this.showToast(this.t('highlightDisabled'));
        return;
      }
      if (this.isEditTool(nextTool)) {
        this.showToast(this.t('mdEditNoSelection'));
        return;
      }
      entry.toolStyle = nextTool;
      entry.mode = this.isEditTool(nextTool) ? 'edit' : 'visual';
      entry.toolName = this.getToolNameForId(nextTool, toolInfo && toolInfo.name ? toolInfo.name : '');
      this.markHighlightModified(highlightId);
      const color = entry.color || this.currentColor;
      const textColorOverride = entry.textColorOverride || '';
      this.removeGroupFrameOverlay(highlightId);
      this.getGroupElements(highlightId).forEach(el => {
        el.dataset.toolStyle = nextTool;
        this.applyHighlightStyles(el, color, nextTool, textColorOverride);
        this.scheduleElementEffectRefresh(el, nextTool, color);
      });
      this.syncHighlightNoteToDom(highlightId, entry.note || '');
      this.refreshGroupEffects(highlightId, nextTool, color);
      if (options.trackRecent !== false && toolInfo) this.pushRecentTool(toolInfo);
      this.updatePermanentToolbarIndicator();
      this.requestSave(true);
      return true;
    }

    createPanel(className, anchor) {
      const panel = document.createElement('div');
      panel.className = `dev1-snapshot-highlighter-panel ${className}`;
      panel.dataset.dev1SnapshotHighlighterUi = 'true';
      panel.dataset.anchorId = anchor ? (anchor.id || anchor.className || '') : '';
      return panel;
    }

    applyPickerTheme(panel) {
      if (!panel || !panel.classList) return;
      panel.classList.toggle('dark-theme', !!this.darkModeEnabled);
      panel.classList.toggle('light-theme', !this.darkModeEnabled);
    }

    applyPickerColorFrame(panel, frameColor = this.currentColor) {
      if (!panel || !panel.style) return;
      const color = frameColor || this.currentColor || '#69C0FF';
      const accent = this.getUiAccent(color, { textContent: 'picker' });
      panel.classList.toggle('rainbow-frame', this.isRainbowColor(color));
      panel.style.setProperty('--dev1-option-accent', accent.color);
      panel.style.setProperty('--dev1-option-accent-soft', accent.soft);
      panel.style.setProperty('--dev1-option-hover-bg', accent.hoverBg);
      panel.style.setProperty('--dev1-option-accent-gradient', accent.gradient);
      if (this.isRainbowColor(color)) {
        panel.style.setProperty('--picker-frame-color', 'transparent');
        panel.style.setProperty('--picker-frame-gradient', this.buildRainbowGradient(color, { textContent: 'picker' }));
      } else if (this.isTransparentColor(color)) {
        panel.style.setProperty('--picker-frame-color', this.darkModeEnabled ? 'rgba(255,255,255,.72)' : 'rgba(15,23,42,.42)');
        panel.style.removeProperty('--picker-frame-gradient');
      } else {
        panel.style.setProperty('--picker-frame-color', this.getRenderableColor(color));
        panel.style.removeProperty('--picker-frame-gradient');
      }
    }

    getUiAccent(color = this.currentColor, element = null) {
      const raw = safeString(color || this.currentColor || '#1976d2');
      const isRainbow = this.isRainbowColor(raw);
      const gradient = isRainbow
        ? this.buildRainbowGradient(raw, element || { textContent: 'accent' })
        : '';
      const renderColor = isRainbow
        ? this.getRenderableColor(raw, element || { textContent: 'accent' })
        : this.getRenderableColor(raw);
      const colorValue = normalizeCssColor(renderColor) || renderColor || '#1976d2';
      let soft = this.darkModeEnabled ? 'rgba(77, 163, 255, .22)' : 'rgba(25, 118, 210, .16)';
      try {
        soft = this.hexToRgba(colorValue, this.darkModeEnabled ? 0.28 : 0.18);
      } catch (_) { }
      if (this.isTransparentColor(raw)) soft = this.darkModeEnabled ? 'rgba(226,232,240,.22)' : 'rgba(15,23,42,.14)';
      let hoverBg = this.darkModeEnabled ? '#333' : '#f0f8ff';
      try {
        hoverBg = this.isTransparentColor(raw)
          ? (this.darkModeEnabled ? 'rgba(226,232,240,.12)' : 'rgba(15,23,42,.06)')
          : this.hexToRgba(colorValue, this.darkModeEnabled ? 0.18 : 0.1);
      } catch (_) { }
      return {
        raw,
        isRainbow,
        color: isRainbow ? 'transparent' : colorValue,
        visibleColor: colorValue,
        soft,
        gradient: gradient || 'linear-gradient(90deg,#ff3b30,#ff9500,#ffcc00,#34c759,#00c7ff,#007aff,#af52de)',
        hoverBg
      };
    }

    applyOptionAccent(element, color = this.currentColor, options = {}) {
      if (!element || !element.style) return this.getUiAccent(color);
      const accent = this.getUiAccent(color, element);
      element.classList.toggle('dev1-rainbow-accent-option', !!accent.isRainbow || !!options.rainbow);
      element.style.setProperty('--dev1-option-accent', accent.color, 'important');
      element.style.setProperty('--dev1-option-accent-visible', accent.visibleColor, 'important');
      element.style.setProperty('--dev1-option-accent-soft', accent.soft, 'important');
      element.style.setProperty('--dev1-option-hover-bg', accent.hoverBg, 'important');
      element.style.setProperty('--dev1-option-accent-gradient', accent.gradient, 'important');
      return accent;
    }

    stylePickerCategoryButton(btn, active, accentColor = this.currentColor) {
      if (!btn) return;
      const dark = !!this.darkModeEnabled;
      const accent = this.getUiAccent(accentColor || this.currentColor, btn);
      btn.classList.toggle('active', !!active);
      btn.style.setProperty('display', 'flex', 'important');
      btn.style.setProperty('align-items', 'center', 'important');
      btn.style.setProperty('gap', '6px', 'important');
      btn.style.setProperty('width', '100%', 'important');
      btn.style.setProperty('padding', '9px 12px', 'important');
      btn.style.setProperty('border', 'none', 'important');
      btn.style.setProperty('background', active ? (dark ? accent.soft : accent.soft) : 'transparent', 'important');
      btn.style.setProperty('color', active ? (dark ? '#fff' : accent.visibleColor) : (dark ? '#ccc' : '#666'), 'important');
      btn.style.setProperty('cursor', 'pointer', 'important');
      btn.style.setProperty('transition', 'all .2s ease', 'important');
      btn.style.setProperty('font-size', '12px', 'important');
      btn.style.setProperty('font-weight', '500', 'important');
      btn.style.setProperty('text-align', 'left', 'important');
      btn.style.setProperty('border-left', `3px solid ${active ? accent.visibleColor : 'transparent'}`, 'important');
    }

    getToolbarPanelPreferredSide(anchor, defaultSide = 'top') {
      const anchoredToToolbar = !!(
        anchor &&
        (
          anchor === this.toolbar ||
          anchor === this.toolbarDockToggle ||
          (this.toolbar && this.toolbar.contains(anchor)) ||
          (this.toolbarDockToggle && this.toolbarDockToggle.contains(anchor)) ||
          (anchor.closest && anchor.closest('#dev1-snapshot-highlighter-toolbar, .permanent-toolbar-dock-toggle'))
        )
      );
      if (!anchoredToToolbar) return defaultSide;
      let position = this.getToolbarDockState().position || 'floating';
      if (position === 'floating' && this.toolbar) {
        const rect = this.toolbar.getBoundingClientRect();
        const threshold = 24;
        if (rect.left <= threshold) position = 'left';
        else if (window.innerWidth - rect.right <= threshold) position = 'right';
        else if (rect.top <= threshold) position = 'top';
        else if (window.innerHeight - rect.bottom <= threshold) position = 'bottom';
      }
      if (position === 'left') return 'right';
      if (position === 'right') return 'left';
      if (position === 'top') return 'bottom';
      if (position === 'bottom') return 'top';
      return defaultSide;
    }

    positionPanel(panel, anchor, side = 'top') {
      const isPicker = panel.classList.contains('highlight-color-picker') || panel.classList.contains('highlight-tool-picker');
      const anchorElement = isPicker && this.toolbar && anchor && this.toolbar.contains(anchor)
        ? this.toolbar
        : anchor;
      const resolvedSide = this.getToolbarPanelPreferredSide(anchorElement, side);
      const rect = anchorElement ? anchorElement.getBoundingClientRect() : {
        left: window.innerWidth / 2,
        right: window.innerWidth / 2,
        top: window.innerHeight / 2,
        bottom: window.innerHeight / 2,
        width: 0,
        height: 0
      };
      const margin = 10;
      const gap = 10;
      const isHorizontalPlacement = resolvedSide === 'left' || resolvedSide === 'right';
      const prefersBottom = resolvedSide === 'bottom';
      const availableAbove = Math.max(0, rect.top - margin - gap);
      const availableBelow = Math.max(0, window.innerHeight - rect.bottom - margin - gap);
      const minimumHeight = isPicker ? 220 : 120;
      let shouldOpenBelow = prefersBottom;
      if (!isHorizontalPlacement) {
        if (prefersBottom && availableBelow < minimumHeight && availableAbove > availableBelow) {
          shouldOpenBelow = false;
        }
        if (!prefersBottom && availableAbove < minimumHeight && availableBelow > availableAbove) {
          shouldOpenBelow = true;
        }
      }
      const availableHeight = Math.max(0, shouldOpenBelow ? availableBelow : availableAbove);

      if (isPicker) {
        const preferredHeight = 420;
        const maxViewportHeight = Math.max(minimumHeight, window.innerHeight - margin * 2);
        const nextHeight = Math.max(minimumHeight, Math.min(preferredHeight, isHorizontalPlacement ? maxViewportHeight : (availableHeight || preferredHeight), maxViewportHeight));
        panel.style.setProperty('--dev1-picker-height', `${nextHeight}px`);
        panel.style.height = `${nextHeight}px`;
        panel.style.maxHeight = `${nextHeight}px`;
      }

      const panelRect = panel.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - panelRect.width / 2;
      let top = shouldOpenBelow ? rect.bottom + gap : rect.top - panelRect.height - gap;
      let placement = shouldOpenBelow ? 'bottom' : 'top';
      if (isHorizontalPlacement) {
        const availableLeft = Math.max(0, rect.left - margin - gap);
        const availableRight = Math.max(0, window.innerWidth - rect.right - margin - gap);
        let shouldOpenRight = resolvedSide === 'right';
        if (shouldOpenRight && availableRight < panelRect.width && availableLeft > availableRight) shouldOpenRight = false;
        if (!shouldOpenRight && availableLeft < panelRect.width && availableRight > availableLeft) shouldOpenRight = true;
        left = shouldOpenRight ? rect.right + gap : rect.left - panelRect.width - gap;
        top = rect.top + rect.height / 2 - panelRect.height / 2;
        placement = shouldOpenRight ? 'right' : 'left';
      }
      left = Math.max(margin, Math.min(window.innerWidth - panelRect.width - margin, left));
      top = Math.max(margin, Math.min(window.innerHeight - panelRect.height - margin, top));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.dataset.placement = placement;
    }

    trackPanelPosition(panel, anchor, side = 'top') {
      if (!panel) return;
      this.untrackPanelPosition(panel);
      const positioner = () => {
        if (!panel.isConnected) {
          this.untrackPanelPosition(panel);
          return;
        }
        this.positionPanel(panel, anchor, side);
      };
      panel.__dev1PanelPositioner = positioner;
      this._panelPositioners.add(positioner);
      this.ensurePanelRepositionEvents();
      positioner();
    }

    untrackPanelPosition(panel) {
      const positioner = panel && panel.__dev1PanelPositioner;
      if (positioner) {
        this._panelPositioners.delete(positioner);
        try { delete panel.__dev1PanelPositioner; } catch (_) { panel.__dev1PanelPositioner = null; }
      }
      this.teardownPanelRepositionEventsIfIdle();
    }

    ensurePanelRepositionEvents() {
      if (this._panelRepositionListener) return;
      this._panelRepositionListener = (event) => {
        if (event && event.type === 'scroll') {
          const target = elementFromNode(event.target);
          if (target && target.closest && target.closest(UI_SELECTOR)) return;
        }
        Array.from(this._panelPositioners).forEach(fn => {
          try { fn(); } catch (_) { }
        });
      };
      window.addEventListener('resize', this._panelRepositionListener, true);
      window.addEventListener('scroll', this._panelRepositionListener, true);
      if (window.visualViewport) {
        try {
          window.visualViewport.addEventListener('resize', this._panelRepositionListener, true);
          window.visualViewport.addEventListener('scroll', this._panelRepositionListener, true);
        } catch (_) { }
      }
    }

    teardownPanelRepositionEventsIfIdle() {
      if (this._panelPositioners.size || !this._panelRepositionListener) return;
      window.removeEventListener('resize', this._panelRepositionListener, true);
      window.removeEventListener('scroll', this._panelRepositionListener, true);
      if (window.visualViewport) {
        try {
          window.visualViewport.removeEventListener('resize', this._panelRepositionListener, true);
          window.visualViewport.removeEventListener('scroll', this._panelRepositionListener, true);
        } catch (_) { }
      }
      this._panelRepositionListener = null;
    }

    getHighlightPickerContext(highlightId) {
      const id = safeString(highlightId);
      if (!id) return null;
      const entry = this.highlights.get(id);
      const el = this.getGroupElements(id)[0];
      if (!entry && !el) return null;
      const color = (entry && entry.color) || (el && el.dataset.color) || this.currentColor;
      const variant = (entry && entry.textColorOverride) || (el && el.dataset.textColorOverride) || this.resolveColorVariant(color, '');
      return {
        highlightId: id,
        color,
        variant,
        colorKey: (entry && entry.colorNameKey) || (el && el.dataset.colorKey) || this.getColorNameKeyForValue(color, variant),
        colorName: (entry && entry.colorName) || (el && el.dataset.colorName) || this.getColorNameForValue(color, variant),
        toolId: (entry && entry.toolStyle) || (el && el.dataset.toolStyle) || 'highlight'
      };
    }

    getPickerContextAccentColor(context = null) {
      return context && context.color ? context.color : this.currentColor;
    }

    isColorSelectionActive(color, variant, colorKey, context = null) {
      const activeColor = context && context.color ? context.color : this.currentColor;
      const activeVariant = context && context.variant != null ? context.variant : this.currentColorVariant;
      const activeKey = context && context.colorKey ? context.colorKey : this.currentColorKey;
      const normVariant = (variant === 'auto' || !variant) ? 'auto' : variant;
      const normActiveVariant = (activeVariant === 'auto' || !activeVariant) ? 'auto' : activeVariant;
      return (safeString(color).toLowerCase() === safeString(activeColor).toLowerCase()
        && safeString(normVariant) === safeString(normActiveVariant))
        || (!!colorKey && colorKey === activeKey);
    }

    commitColorSelection(item, closeColorPicker = null, context = null) {
      const resolvedVariant = this.resolveColorVariant(item.color, item.variant || '');
      const colorKey = item.key || this.getColorNameKeyForValue(item.color, resolvedVariant, item.name || '');
      if (context && context.highlightId) {
        this.applyColorItemToHighlight(context.highlightId, { ...item, key: colorKey, variant: item.variant || '' });
        if (typeof closeColorPicker === 'function') closeColorPicker();
        return;
      }
      this.selectColor({ ...item, key: colorKey, variant: item.variant || '' });
      if (typeof closeColorPicker === 'function') closeColorPicker();
    }

    commitToolSelection(tool, context = null) {
      if (context && context.highlightId) {
        const applied = this.applyToolItemToHighlight(context.highlightId, tool);
        if (applied && this.activeToolPicker) this.closeTransientPanelByKey('activeToolPicker');
        return;
      }
      this.selectTool(tool);
    }

    showColorPicker(anchor, options = {}) {
      if (this.activeColorPicker && this.activeColorPicker.parentNode) {
        this.closeTransientPanelByKey('activeColorPicker');
        return;
      }
      this.closeTransientPanels();
      const pickerContext = this.getHighlightPickerContext(options && options.highlightId);
      const accentColor = this.getPickerContextAccentColor(pickerContext);
      const panel = this.createPanel('highlight-color-picker', anchor);
      this.applyPickerTheme(panel);
      this.applyPickerColorFrame(panel, accentColor);
      if (pickerContext && pickerContext.highlightId) panel.dataset.targetHighlightId = pickerContext.highlightId;
      const categories = this.getAllColorCategories();
      const closeColorPicker = () => {
        this.untrackPanelPosition(panel);
        if (panel.parentNode) panel.remove();
        this.activeColorPicker = null;
        this._releaseCursor('colorPicker');
      };
      const header = document.createElement('div');
      header.className = 'dev1-picker-header';
      header.innerHTML = `<h3><span>🎨</span><span>${this.escapeHtml(this.t('chooseColor'))}</span></h3>`;
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'dev1-picker-close';
      closeBtn.setAttribute('aria-label', this.t('cancel'));
      closeBtn.textContent = '✕';
      header.appendChild(closeBtn);
      const body = document.createElement('div');
      body.className = 'color-picker-content dev1-picker-body';
      const sidebar = document.createElement('div');
      sidebar.className = 'category-sidebar dev1-picker-sidebar';
      const content = document.createElement('div');
      content.className = 'color-area dev1-picker-content';
      body.appendChild(sidebar);
      body.appendChild(content);
      panel.appendChild(header);
      panel.appendChild(body);
      closeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        closeColorPicker();
      });
      panel.addEventListener('mouseenter', () => this._suppressCursor('colorPicker'));
      panel.addEventListener('mouseleave', () => {
        this._releaseCursor('colorPicker');
        this._releaseCursor('hoverUI');
      });
      const renderCategory = (category) => this.showCategoryColors(category, content, closeColorPicker, pickerContext);
      const activeId = categories.some(category => category.id === 'classic') ? 'classic' : (categories[0] && categories[0].id);
      categories.forEach((category) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `dev1-picker-tab category-btn category-btn-${category.id}`;
        btn.dataset.categoryId = category.id;
        btn.innerHTML = `<span class="dev1-category-icon">${this.escapeHtml(category.icon || this.getCategoryIcon(category.id))}</span><span>${this.escapeHtml(category.title)}</span>`;
        btn.addEventListener('click', () => {
          sidebar.querySelectorAll('.category-btn').forEach(el => this.stylePickerCategoryButton(el, false, accentColor));
          this.stylePickerCategoryButton(btn, true, accentColor);
          renderCategory(category);
        });
        btn.addEventListener('mouseenter', () => {
          if (!btn.classList.contains('active')) {
            const accent = this.getUiAccent(accentColor, btn);
            btn.style.setProperty('background', accent.soft, 'important');
            btn.style.setProperty('color', this.darkModeEnabled ? '#fff' : accent.visibleColor, 'important');
            btn.style.setProperty('border-left', `3px solid ${accent.visibleColor}`, 'important');
          }
        });
        btn.addEventListener('mouseleave', () => {
          if (!btn.classList.contains('active')) this.stylePickerCategoryButton(btn, false);
        });
        sidebar.appendChild(btn);
        if (category.id === activeId) {
          this.stylePickerCategoryButton(btn, true, accentColor);
          renderCategory(category);
        } else {
          this.stylePickerCategoryButton(btn, false, accentColor);
        }
      });
      document.body.appendChild(panel);
      this.trackPanelPosition(panel, anchor, 'top');
      this.activeColorPicker = panel;
    }

    showCategoryColors(category, content, closeColorPicker, pickerContext = null) {
      content.innerHTML = '';
      content.classList.add('color-area');
      content.style.overflowY = '';
      try {
        content.scrollTop = 0;
        content.scrollLeft = 0;
      } catch (_) { }
      const pickerPanel = content.closest && content.closest('.highlight-color-picker');
      if (pickerPanel) {
        pickerPanel.querySelectorAll('.dev1-color-view-toggle, .dev1-clear-recent.dev1-clear-colors').forEach(node => node.remove());
      }
      if (!category) return;
      if (category.id === 'rgb') {
        this.renderRgbPicker(content, closeColorPicker, pickerContext);
        return;
      }
      if (category.id === 'recent') {
        const scrollWrap = document.createElement('div');
        scrollWrap.className = 'recent-scroll-wrap';
        const controls = document.createElement('div');
        controls.className = 'dev1-recent-controls';
        const latest = document.createElement('button');
        latest.type = 'button';
        latest.textContent = this.t('sortByLatest');
        const usage = document.createElement('button');
        usage.type = 'button';
        usage.textContent = this.t('sortByUsage');
        const setMode = (mode) => {
          this._recentColorSortMode = mode;
          latest.classList.toggle('active', mode === 'latest');
          usage.classList.toggle('active', mode === 'usage');
          renderRecent();
        };
        latest.addEventListener('click', () => setMode('latest'));
        usage.addEventListener('click', () => setMode('usage'));
        controls.appendChild(latest);
        controls.appendChild(usage);
        scrollWrap.appendChild(controls);
        const grid = document.createElement('div');
        const viewMode = this._colorPickerViewMode === 'list' ? 'list' : 'grid';
        grid.className = `dev1-color-grid recent-color-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`;
        scrollWrap.appendChild(grid);
        content.appendChild(scrollWrap);
        this.createRecentClearButton('colors', content, (event) => {
          event.stopPropagation();
          this.recentColors = [];
          this.requestSave(true);
          if (this.activeColorPicker) {
            const recentTab = this.activeColorPicker.querySelector('.category-btn-recent');
            if (recentTab) recentTab.remove();
            const classicTab = this.activeColorPicker.querySelector('.category-btn-classic') || this.activeColorPicker.querySelector('.dev1-picker-tab');
            if (classicTab) classicTab.click();
          }
        });
        const renderRecent = () => {
          const sorted = this.recentColors.map(item => this.localizeRecentColor(item));
          if (this._recentColorSortMode === 'usage') {
            sorted.sort((a, b) => Number(b.uses || 0) - Number(a.uses || 0));
          }
          grid.innerHTML = '';
          sorted.forEach(item => {
            const option = this.createColorOption(item, closeColorPicker, viewMode, pickerContext);
            const uses = Number(item.uses || 0);
            if (uses > 0) {
              const count = document.createElement('span');
              count.className = 'color-uses';
              count.textContent = String(uses);
              count.style.display = this._recentColorSortMode === 'usage' ? 'block' : 'none';
              this.styleRecentColorBadge(count, item);
              option.appendChild(count);
              option.addEventListener('mouseenter', () => {
                if (this._recentColorSortMode !== 'usage') count.style.display = 'block';
              });
              option.addEventListener('mouseleave', () => {
                if (this._recentColorSortMode !== 'usage') count.style.display = 'none';
              });
            }
            grid.appendChild(option);
          });
        };
        setMode(this._recentColorSortMode === 'usage' ? 'usage' : 'latest');
        this.createColorViewToggle(category, content, closeColorPicker, pickerContext);
        return;
      }

      const variantBar = document.createElement('div');
      variantBar.className = 'dev1-color-variant-bar';
      const contextVariant = pickerContext && (pickerContext.variant === 'white' || pickerContext.variant === 'black' || pickerContext.variant === 'auto')
        ? pickerContext.variant
        : '';
      const preferredVariant = contextVariant || (this.currentColorVariant === 'white' || this.currentColorVariant === 'black' || this.currentColorVariant === 'auto'
        ? this.currentColorVariant
        : 'auto');
      let activeVariant = preferredVariant;
      const blackBtn = this.createVariantButton(this.t('blackText'), 'black');
      const whiteBtn = this.createVariantButton(this.t('whiteText'), 'white');
      const autoBtn = this.createVariantButton(this.t('autoText'), 'auto');
      const refreshVariantButtons = () => {
        blackBtn.classList.toggle('active', activeVariant === 'black');
        whiteBtn.classList.toggle('active', activeVariant === 'white');
        autoBtn.classList.toggle('active', activeVariant === 'auto');
      };
      const grid = document.createElement('div');
      grid.className = 'dev1-color-grid';
      const renderGrid = () => {
        refreshVariantButtons();
        grid.innerHTML = '';
        (category.colors || []).forEach(item => {
          const explicitVariant = this.normalizeColorVariant(item.variant || '');
          if (activeVariant !== 'auto' && explicitVariant && explicitVariant !== activeVariant) return;
          const color = safeString(item.color).toLowerCase();
          if (activeVariant === 'white' && color === '#ffffff') return;
          if (activeVariant === 'black' && color === '#000000') return;
          grid.appendChild(this.createColorOption({
            ...item,
            variant: explicitVariant || activeVariant
          }, closeColorPicker, 'grid', pickerContext));
        });
      };
      blackBtn.addEventListener('click', () => {
        activeVariant = 'black';
        renderGrid();
      });
      whiteBtn.addEventListener('click', () => {
        activeVariant = 'white';
        renderGrid();
      });
      autoBtn.addEventListener('click', () => {
        activeVariant = 'auto';
        renderGrid();
      });
      variantBar.appendChild(whiteBtn);
      variantBar.appendChild(blackBtn);
      variantBar.appendChild(autoBtn);
      content.appendChild(variantBar);
      content.appendChild(grid);
      renderGrid();
    }

    createVariantButton(label, variant) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dev1-color-variant-btn ${variant === 'white' ? 'white-text' : (variant === 'black' ? 'black-text' : 'auto-text')}`;
      btn.dataset.variant = variant;
      btn.textContent = label;
      return btn;
    }

    createRecentClearButton(kind, content, onClick) {
      const panel = (content && content.closest && content.closest('.highlight-color-picker, .highlight-tool-picker'))
        || (kind === 'colors' ? this.activeColorPicker : this.activeToolPicker);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dev1-clear-recent dev1-clear-${kind}`;
      btn.title = this.t('clearRecent');
      btn.setAttribute('aria-label', this.t('clearRecent'));
      btn.textContent = '🗑️';
      btn.addEventListener('click', onClick);
      if (panel) {
        panel.querySelectorAll(`.dev1-clear-recent.dev1-clear-${kind}`).forEach(node => node.remove());
        panel.appendChild(btn);
        return btn;
      }
      if (content) content.appendChild(btn);
      return btn;
    }

    createColorViewToggle(category, content = null, closeColorPicker = null, pickerContext = null) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isList = this._colorPickerViewMode === 'list';
      btn.className = 'dev1-color-view-toggle';
      btn.dataset.categoryId = category && category.id ? category.id : '';
      btn.title = isList ? this.t('viewGrid') : this.t('viewList');
      btn.setAttribute('aria-label', btn.title);
      btn.innerHTML = isList ? this.getGridIconSvg() : this.getListIconSvg();
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        this._colorPickerViewMode = isList ? 'grid' : 'list';
        this.requestSave(true);
        const targetContent = this.activeColorPicker && this.activeColorPicker.querySelector('.dev1-picker-content');
        if (targetContent) this.showCategoryColors(category, targetContent, closeColorPicker, pickerContext);
      });
      const panel = (content && content.closest && content.closest('.highlight-color-picker')) || this.activeColorPicker;
      if (panel) {
        panel.querySelectorAll('.dev1-color-view-toggle').forEach(node => node.remove());
        panel.appendChild(btn);
        return btn;
      }
      return btn;
    }

    renderRgbPicker(content, closeColorPicker = null, pickerContext = null) {
      content.style.overflowY = 'hidden';
      const wrap = document.createElement('div');
      wrap.className = 'dev1-rgb-picker';
      const wheelSize = 140;
      const bufferSize = 280;
      const canvas = document.createElement('canvas');
      canvas.width = wheelSize;
      canvas.height = wheelSize;
      canvas.className = 'dev1-rgb-wheel';
      const preview = document.createElement('div');
      preview.className = 'dev1-rgb-preview';
      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.inputMode = 'text';
      hexInput.maxLength = 7;
      hexInput.setAttribute('aria-label', this.t('hexValueLabel'));
      const rgbInput = document.createElement('input');
      rgbInput.type = 'text';
      rgbInput.inputMode = 'text';
      rgbInput.setAttribute('aria-label', this.t('rgbValueLabel'));
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.textContent = this.t('apply');
      const note = document.createElement('div');
      note.className = 'dev1-rgb-note';
      note.textContent = this.t('colorPickerNote');
      const drawWheel = () => {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const buffer = document.createElement('canvas');
        buffer.width = bufferSize;
        buffer.height = bufferSize;
        const bufferCtx = buffer.getContext('2d');
        if (!bufferCtx) return;
        const radius = bufferSize / 2;
        const image = bufferCtx.createImageData(bufferSize, bufferSize);
        for (let y = 0; y < bufferSize; y += 1) {
          for (let x = 0; x < bufferSize; x += 1) {
            const dx = x - radius;
            const dy = y - radius;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const index = (y * bufferSize + x) * 4;
            if (dist <= radius) {
              const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
              const sat = dist / radius;
              const [r, g, b] = this._hsvToRgb(hue / 360, sat, 1);
              image.data[index] = r;
              image.data[index + 1] = g;
              image.data[index + 2] = b;
              image.data[index + 3] = 255;
            } else {
              image.data[index + 3] = 0;
            }
          }
        }
        bufferCtx.putImageData(image, 0, 0);
        ctx.clearRect(0, 0, wheelSize, wheelSize);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(buffer, 0, 0, wheelSize, wheelSize);
      };
      const toHex = (r, g, b) => `#${[r, g, b].map(value => Math.max(0, Math.min(255, value)).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
      const parseRgbInput = (value) => {
        const match = safeString(value).match(/rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
        if (!match) return null;
        return [1, 2, 3].map(i => Math.max(0, Math.min(255, Number(match[i]) || 0)));
      };
      const parseHexInput = (value) => {
        const raw = safeString(value).trim();
        const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
        if (!/^#[0-9a-f]{6}$/i.test(prefixed)) return null;
        return prefixed.toUpperCase();
      };
      const syncFromHex = (hex) => {
        const normalized = parseHexInput(hex);
        if (!normalized) return false;
        const [r, g, b] = parseCssColor(normalized);
        preview.style.background = normalized;
        hexInput.value = normalized;
        rgbInput.value = `rgb(${r}, ${g}, ${b})`;
        return true;
      };
      const pickFromCanvas = (event, commit = false) => {
        const rect = canvas.getBoundingClientRect();
        const radius = rect.width / 2;
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const dx = x - radius;
        const dy = y - radius;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius) return;
        const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
        const sat = Math.min(1, dist / radius);
        const hex = toHex(...this._hsvToRgb(hue / 360, sat, 1));
        syncFromHex(hex);
        if (commit) preview.dataset.locked = hex;
      };
      drawWheel();
      const initialHex = this._rgbPickerLastColor
        || (/^#[0-9a-f]{6}$/i.test(this.currentColor) ? this.currentColor : '#FF0000');
      syncFromHex(initialHex);
      canvas.addEventListener('mousemove', event => {
        if (preview.dataset.locked) return;
        pickFromCanvas(event, false);
      });
      canvas.addEventListener('mouseleave', () => {
        if (preview.dataset.locked) syncFromHex(preview.dataset.locked);
      });
      canvas.addEventListener('click', event => {
        pickFromCanvas(event, true);
        this.pulseCursorFeedback('#22c55e');
      });
      hexInput.addEventListener('input', () => {
        const normalized = parseHexInput(hexInput.value);
        if (normalized) syncFromHex(normalized);
      });
      rgbInput.addEventListener('input', () => {
        const rgb = parseRgbInput(rgbInput.value);
        if (rgb) syncFromHex(toHex(...rgb));
      });
      apply.addEventListener('click', () => {
        const hex = parseHexInput(hexInput.value) || (parseRgbInput(rgbInput.value) ? toHex(...parseRgbInput(rgbInput.value)) : '');
        if (!hex) return;
        this._rgbPickerLastColor = hex;
        this.commitColorSelection({ color: hex, key: hex, name: hex }, closeColorPicker, pickerContext);
        this.pulseCursorFeedback('#22c55e');
      });
      const topRow = document.createElement('div');
      topRow.className = 'dev1-rgb-top-row';
      topRow.appendChild(canvas);
      topRow.appendChild(preview);
      const inputRow = document.createElement('div');
      inputRow.className = 'dev1-rgb-input-row';
      const rgbGroup = document.createElement('label');
      rgbGroup.innerHTML = `<span>${this.escapeHtml(this.t('rgbValueLabel'))}</span>`;
      rgbGroup.appendChild(rgbInput);
      const hexGroup = document.createElement('label');
      hexGroup.innerHTML = `<span>${this.escapeHtml(this.t('hexValueLabel'))}</span>`;
      hexGroup.appendChild(hexInput);
      inputRow.appendChild(rgbGroup);
      inputRow.appendChild(hexGroup);
      wrap.appendChild(topRow);
      wrap.appendChild(inputRow);
      wrap.appendChild(apply);
      wrap.appendChild(note);
      content.appendChild(wrap);
    }

    _hsvToRgb(h, s, v) {
      const i = Math.floor(h * 6);
      const f = h * 6 - i;
      const p = v * (1 - s);
      const q = v * (1 - f * s);
      const t = v * (1 - (1 - f) * s);
      const mod = i % 6;
      const tuple = mod === 0 ? [v, t, p]
        : mod === 1 ? [q, v, p]
          : mod === 2 ? [p, v, t]
            : mod === 3 ? [p, q, v]
              : mod === 4 ? [t, p, v]
                : [v, p, q];
      return tuple.map(value => Math.round(value * 255));
    }

    getCategoryIcon(id) {
      return ({
        recent: '⭐',
        classic: '🖍️',
        rgb: '🎯',
        red: '🟥',
        orange: '🟧',
        yellow: '🟨',
        green: '🟩',
        blue: '🟦',
        purple: '🟪',
        other: '🎨'
      })[id] || '•';
    }

    createColorOption(item, closeColorPicker = null, viewMode = 'grid', pickerContext = null) {
      const btn = document.createElement('div');
      btn.tabIndex = 0;
      btn.setAttribute('role', 'button');
      btn.className = `color-option ${viewMode === 'list' ? 'list-option' : 'grid-option'}`;
      const color = item.color;
      const resolvedVariant = this.resolveColorVariant(color, item.variant || '');
      const colorKey = item.key || this.getColorNameKeyForValue(color, resolvedVariant, item.name || '');
      btn.dataset.colorKey = colorKey;
      btn.dataset.variant = resolvedVariant;
      if (this.isRainbowColor(color)) btn.dataset.rainbowOption = 'true';
      const accent = this.applyOptionAccent(btn, color);
      if (this.isColorSelectionActive(color, item.variant || '', colorKey, pickerContext)) {
        btn.classList.add('active');
      }
      const preview = document.createElement('span');
      preview.className = 'color-preview';
      this.applyColorPreview(preview, color, colorKey || 'color-option');
      const sample = document.createElement('span');
      sample.className = 'color-sample';
      sample.textContent = 'Aa';
      sample.style.color = resolvedVariant === 'white' ? '#ffffff' : '#0f172a';
      preview.appendChild(sample);
      const label = document.createElement('span');
      label.className = 'color-name';
      label.textContent = item.name || color;
      btn.appendChild(preview);
      btn.appendChild(label);
      const commit = () => {
        this.commitColorSelection({ ...item, key: colorKey, variant: item.variant || '' }, closeColorPicker, pickerContext);
      };
      btn.addEventListener('click', commit);
      btn.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          commit();
        }
      });
      btn.addEventListener('mouseenter', () => {
        if (accent.isRainbow) btn.style.removeProperty('background');
        else btn.style.setProperty('background', accent.hoverBg, 'important');
        btn.style.setProperty('border-color', accent.color, 'important');
        btn.style.setProperty('transform', 'scale(1.05)', 'important');
        preview.style.transform = 'scale(1.1)';
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.removeProperty('background');
        btn.style.removeProperty('border-color');
        btn.style.removeProperty('background-image');
        btn.style.removeProperty('background-clip');
        btn.style.removeProperty('background-origin');
        btn.style.setProperty('transform', 'scale(1)', 'important');
        preview.style.transform = 'scale(1)';
      });
      return btn;
    }

    createColorOptionWithVariant(color, name, variant, _highlightElement, closeCallback) {
      return this.createColorOption({ color, name, variant }, closeCallback);
    }

    selectColor(item) {
      const resolvedVariant = this.resolveColorVariant(item.color, item.variant || '');
      this.currentColor = item.color;
      this.currentColorVariant = item.variant === 'auto' ? 'auto' : resolvedVariant;
      this.currentColorKey = item.key || this.getColorNameKeyForValue(item.color, resolvedVariant, item.name || '');
      this.currentColorName = this.getColorNameForItem(item);
      this.pushRecentColor({ ...item, variant: item.variant || '' });
      this.updatePermanentToolbarIndicator();
      this.updateCursorStyle();
      if (this.activeColorPicker) {
        this.closeTransientPanelByKey('activeColorPicker');
      }
      this.requestSave(true);
    }

    setColor(item = {}) {
      if (!item || !item.color) return { success: false };
      const resolved = {
        color: item.color,
        key: item.key || item.colorNameKey || this.getColorNameKeyForValue(item.color, item.variant || '', item.name || item.color),
        name: item.name || item.colorName || item.color,
        variant: item.variant || item.textColorOverride || ''
      };
      this.selectColor(resolved);
      return { success: true, color: this.currentColor, variant: this.currentColorVariant };
    }

    pushRecentColor(item) {
      const key = `${item.color}|${item.variant || ''}`;
      const existing = this.recentColors.find(c => `${c.color}|${c.variant || ''}` === key);
      const uses = Number(existing?.uses || item.uses || 0) + 1;
      const filtered = this.recentColors.filter(c => `${c.color}|${c.variant || ''}` !== key);
      this.recentColors = [{
        color: item.color,
        key: item.key || this.getColorNameKeyForValue(item.color, item.variant || ''),
        variant: item.variant || '',
        name: item.name || '',
        uses
      }, ...filtered].slice(0, 16);
    }

    normalizeColorVariant(value) {
      const raw = safeString(value).toLowerCase();
      return raw === 'white' || raw === 'black' ? raw : '';
    }

    resolveColorVariant(color, variant = '') {
      const explicit = this.normalizeColorVariant(variant);
      if (explicit) return explicit;
      const raw = safeString(color);
      if (!raw || raw.startsWith('special:')) return '';
      if (raw === 'transparent') return this.detectPageTheme() ? 'white' : 'black';
      try {
        return luminance(raw) <= 0.38 ? 'white' : 'black';
      } catch (_) {
        return '';
      }
    }

    normalizeRecentColors(list) {
      return (Array.isArray(list) ? list : [])
        .filter(item => item && item.color)
        .map(item => ({
          color: item.color,
          key: item.key || this.getColorNameKeyForValue(item.color, this.normalizeColorVariant(item.variant || item.id), item.name || item.color),
          variant: this.normalizeColorVariant(item.variant || item.id),
          name: item.name || '',
          uses: Number.isFinite(Number(item.uses)) ? Number(item.uses) : 0
        }))
        .slice(0, 16);
    }

    getColorNameForItem(item = {}) {
      return this.getColorNameForValue(item.color, item.variant || '', item.name || '', item.key || '');
    }

    getColorNameForValue(color, variant = '', fallback = '', key = '') {
      const wantedColor = safeString(color).toLowerCase();
      const wantedVariant = safeString(variant);
      const wantedKey = safeString(key);
      if (wantedKey === 'custom_color') return this.t('customColor');
      const categories = this.getColorCatalogCategories();
      for (const category of categories) {
        for (const item of category.colors || []) {
          if (wantedKey && item.key === wantedKey) return item.name;
          if (safeString(item.color).toLowerCase() === wantedColor && safeString(item.variant || '') === wantedVariant) {
            return item.name;
          }
        }
      }
      return fallback || color || '';
    }

    getColorNameKeyForValue(color, variant = '', fallback = '') {
      const wantedColor = safeString(color).toLowerCase();
      const wantedVariant = safeString(variant);
      const fallbackText = safeString(fallback).toLowerCase();
      if (fallbackText && (fallbackText === safeString(this.messages.zh_CN.customColor).toLowerCase() || fallbackText === safeString(this.messages.en.customColor).toLowerCase())) {
        return 'custom_color';
      }
      const categories = this.getColorCatalogCategories();
      for (const category of categories) {
        for (const item of category.colors || []) {
          if (safeString(item.color).toLowerCase() === wantedColor && safeString(item.variant || '') === wantedVariant) {
            return item.key || item.color;
          }
          if (fallbackText && safeString(item.name).toLowerCase() === fallbackText) {
            return item.key || item.color;
          }
        }
      }
      return color || '';
    }

    localizeRecentColor(item) {
      return {
        color: item.color,
        key: item.key || this.getColorNameKeyForValue(item.color, this.normalizeColorVariant(item.variant || item.id), item.name || ''),
        variant: this.normalizeColorVariant(item.variant || item.id),
        uses: Number.isFinite(Number(item.uses)) ? Number(item.uses) : 0,
        name: this.getColorNameForValue(item.color, this.normalizeColorVariant(item.variant || item.id), item.name || item.color, item.key || '')
      };
    }

    getColorCatalogCategories() {
      const category = (id, title, colors) => ({ id, title, colors });
      return [
        category('classic', this.t('categoryClassic'), [
          { key: 'yellow', color: '#FFEB3B', name: this.lt('黄色', 'Yellow') },
          { key: 'green', color: '#4CAF50', name: this.lt('绿色', 'Green') },
          { key: 'blue', color: '#2196F3', name: this.lt('蓝色', 'Blue') },
          { key: 'orange', color: '#FF9800', name: this.lt('橙色', 'Orange') },
          { key: 'red', color: '#FF3B30', name: this.lt('红色', 'Red') },
          { key: 'sky', color: '#69C0FF', name: this.lt('天蓝', 'Sky') },
          { key: 'jade', color: '#00C853', name: this.lt('翡翠绿', 'Jade') },
          { key: 'violet', color: '#8A2BE2', name: this.lt('紫罗兰', 'Violet') },
          { key: 'black', color: '#000000', name: this.lt('黑色', 'Black'), variant: 'white' },
          { key: 'white', color: '#FFFFFF', name: this.lt('白色', 'White'), variant: 'black' },
          { key: 'transparent', color: 'transparent', name: this.lt('透明', 'Transparent') },
          { key: 'rainbow_fixed_black', color: 'special:rainbow-fixed', name: this.lt('固定彩虹', 'Fixed Rainbow'), variant: 'black' },
          { key: 'rainbow_fixed_white', color: 'special:rainbow-fixed', name: this.lt('固定彩虹', 'Fixed Rainbow'), variant: 'white' }
        ]),
        category('rgb', this.t('categoryRgb'), []),
        category('special-colors', this.t('categorySpecialColors'), [
          { key: 'neon_pink', color: '#FF0080', name: this.lt('霓虹粉', 'Neon Pink') },
          { key: 'neon_green', color: '#00FF80', name: this.lt('霓虹绿', 'Neon Green') },
          { key: 'neon_purple', color: '#8000FF', name: this.lt('霓虹紫', 'Neon Purple') },
          { key: 'neon_orange', color: '#FF4000', name: this.lt('霓虹橙', 'Neon Orange') },
          { key: 'neon_cyan', color: '#00FFFF', name: this.lt('霓虹青', 'Neon Cyan') },
          { key: 'indigo_neon', color: '#4B0082', name: this.lt('靛蓝霓虹', 'Indigo Neon') },
          { key: 'deep_pink_neon', color: '#FF1493', name: this.lt('亮粉霓虹', 'Deep Pink Neon') },
          { key: 'dark_turquoise_neon', color: '#00CED1', name: this.lt('绿松霓虹', 'Turquoise Neon') },
          { key: 'dark_violet_neon', color: '#9400D3', name: this.lt('深紫霓虹', 'Violet Neon') },
          { key: 'fire_tomato', color: '#FF6347', name: this.lt('火焰番茄', 'Fire Tomato') },
          { key: 'fire_crimson', color: '#DC143C', name: this.lt('火焰深红', 'Fire Crimson') },
          { key: 'fire_orange', color: '#FF8C00', name: this.lt('火焰橙', 'Fire Orange') },
          { key: 'fire_gold', color: '#FFD700', name: this.lt('火焰金', 'Fire Gold') }
        ]),
        category('red', this.t('categoryRed'), [
          { key: 'pink', color: '#FF85A1', name: this.lt('粉色', 'Pink') }, { key: 'salmon', color: '#FFA07A', name: this.lt('鲑红', 'Salmon') }, { key: 'coral', color: '#FF6B6B', name: this.lt('珊瑚红', 'Coral') }, { key: 'rose', color: '#FF4D6D', name: this.lt('玫瑰红', 'Rose') }, { key: 'tomato', color: '#FF6347', name: this.lt('番茄红', 'Tomato') }, { key: 'red_group', color: '#FF3B30', name: this.lt('红色', 'Red') }, { key: 'magenta_red', color: '#FF00A8', name: this.lt('洋红', 'Magenta') }, { key: 'crimson', color: '#DC143C', name: this.lt('深红', 'Crimson') }, { key: 'berry', color: '#C2185B', name: this.lt('莓红', 'Berry') }, { key: 'brick', color: '#B22222', name: this.lt('砖红', 'Brick') }
        ]),
        category('orange', this.t('categoryOrange'), [
          { key: 'apricot', color: '#FFCC99', name: this.lt('杏色', 'Apricot') }, { key: 'peach', color: '#FFB084', name: this.lt('桃色', 'Peach') }, { key: 'golden', color: '#FFD54F', name: this.lt('金色', 'Golden') }, { key: 'amber', color: '#FFC107', name: this.lt('琥珀', 'Amber') }, { key: 'orange_group', color: '#FF9800', name: this.lt('橙色', 'Orange') }, { key: 'tangerine', color: '#FF7A45', name: this.lt('橘色', 'Tangerine') }, { key: 'carrot', color: '#ED6C02', name: this.lt('胡萝卜橙', 'Carrot') }, { key: 'pumpkin', color: '#FF6A00', name: this.lt('南瓜橙', 'Pumpkin') }, { key: 'copper', color: '#B87333', name: this.lt('铜色', 'Copper') }, { key: 'rust', color: '#C75100', name: this.lt('锈橙', 'Rust') }
        ]),
        category('yellow', this.t('categoryYellow'), [
          { key: 'cream', color: '#FFF3CD', name: this.lt('奶油黄', 'Cream') }, { key: 'light_yellow', color: '#FFF59D', name: this.lt('浅黄', 'Light Yellow') }, { key: 'lemon', color: '#FFF176', name: this.lt('柠檬黄', 'Lemon') }, { key: 'sand', color: '#F4D06F', name: this.lt('沙黄', 'Sand') }, { key: 'sunny', color: '#FFD54F', name: this.lt('阳光黄', 'Sunny') }, { key: 'honey', color: '#FFCA28', name: this.lt('蜂蜜黄', 'Honey') }, { key: 'yellow_group', color: '#FFEB3B', name: this.lt('黄色', 'Yellow') }, { key: 'maize', color: '#FDD835', name: this.lt('玉米黄', 'Maize') }, { key: 'mustard', color: '#FFC107', name: this.lt('芥末黄', 'Mustard') }, { key: 'goldenrod', color: '#DAA520', name: this.lt('金菊黄', 'Goldenrod') }
        ]),
        category('green', this.t('categoryGreen'), [
          { key: 'mint', color: '#98FF98', name: this.lt('薄荷绿', 'Mint') }, { key: 'aqua', color: '#00FFA6', name: this.lt('水绿', 'Aqua') }, { key: 'seafoam', color: '#2ED573', name: this.lt('海沫绿', 'Seafoam') }, { key: 'lime', color: '#AEEA00', name: this.lt('青柠', 'Lime') }, { key: 'emerald', color: '#2ECC71', name: this.lt('祖母绿', 'Emerald') }, { key: 'green_group', color: '#4CAF50', name: this.lt('绿色', 'Green') }, { key: 'jade_group', color: '#00C853', name: this.lt('翡翠绿', 'Jade') }, { key: 'teal', color: '#008080', name: this.lt('蓝绿', 'Teal') }, { key: 'forest', color: '#228B22', name: this.lt('森林绿', 'Forest') }, { key: 'olive', color: '#808000', name: this.lt('橄榄绿', 'Olive') }
        ]),
        category('blue', this.t('categoryBlue'), [
          { key: 'baby_blue', color: '#87CEFA', name: this.lt('浅天蓝', 'Baby Blue') }, { key: 'sky_group', color: '#69C0FF', name: this.lt('天蓝', 'Sky') }, { key: 'cyan', color: '#00BCD4', name: this.lt('青色', 'Cyan') }, { key: 'azure', color: '#1E90FF', name: this.lt('蔚蓝', 'Azure') }, { key: 'blue_group', color: '#2196F3', name: this.lt('蓝色', 'Blue') }, { key: 'steel', color: '#4682B4', name: this.lt('钢蓝', 'Steel') }, { key: 'royal', color: '#4169E1', name: this.lt('皇家蓝', 'Royal') }, { key: 'indigo_blue', color: '#3F51B5', name: this.lt('靛蓝', 'Indigo') }, { key: 'deep_blue', color: '#003366', name: this.lt('深蓝', 'Deep Blue') }, { key: 'teal_blue', color: '#008C9E', name: this.lt('蓝绿色', 'Teal Blue') }
        ]),
        category('purple', this.t('categoryPurple'), [
          { key: 'lilac', color: '#C8A2C8', name: this.lt('丁香紫', 'Lilac') }, { key: 'lavender', color: '#B57EDC', name: this.lt('薰衣草紫', 'Lavender') }, { key: 'orchid', color: '#DA70D6', name: this.lt('兰花紫', 'Orchid') }, { key: 'purple_glow', color: '#8000FF', name: this.lt('荧光紫', 'Purple Glow') }, { key: 'violet_group', color: '#8A2BE2', name: this.lt('紫罗兰', 'Violet') }, { key: 'grape', color: '#7D3CFF', name: this.lt('葡萄紫', 'Grape') }, { key: 'eggplant', color: '#5D3FD3', name: this.lt('茄紫', 'Eggplant') }, { key: 'indigo', color: '#4B0082', name: this.lt('靛紫', 'Indigo') }, { key: 'magenta_purple', color: '#FF00FF', name: this.lt('洋红', 'Magenta') }, { key: 'plum', color: '#9B59B6', name: this.lt('梅紫', 'Plum') }
        ]),
        category('other', this.t('categoryOther'), [
          { key: 'rainbow_random', color: 'special:rainbow-random', name: this.lt('随机彩虹', 'Random Rainbow') }, { key: 'brown', color: '#795548', name: this.lt('棕色', 'Brown') }, { key: 'silver', color: '#C0C0C0', name: this.lt('银色', 'Silver') }, { key: 'slate', color: '#708090', name: this.lt('石板灰', 'Slate') }, { key: 'tan', color: '#D2B48C', name: this.lt('茶褐色', 'Tan') }
        ])
      ];
    }

    getAllColorCategories() {
      const colors = this.getColorCatalogCategories();
      if (this.recentColors.length) {
        colors.unshift({
          id: 'recent',
          title: this.t('categoryRecentColors'),
          icon: this.getCategoryIcon('recent'),
          colors: this.recentColors.map(item => this.localizeRecentColor(item))
        });
      }
      colors.forEach(category => {
        if (!category.icon) category.icon = this.getCategoryIcon(category.id);
      });
      return colors;
    }

    showToolPicker(anchor, options = {}) {
      if (this.activeToolPicker && this.activeToolPicker.parentNode) {
        this.closeTransientPanelByKey('activeToolPicker');
        return;
      }
      this.closeTransientPanels();
      const pickerContext = this.getHighlightPickerContext(options && options.highlightId);
      const accentColor = this.getPickerContextAccentColor(pickerContext);
      const panel = this.createPanel('highlight-tool-picker', anchor);
      this.applyPickerTheme(panel);
      this.applyPickerColorFrame(panel, accentColor);
      if (pickerContext && pickerContext.highlightId) panel.dataset.targetHighlightId = pickerContext.highlightId;
      let categories = this.getAllToolCategories();
      if (pickerContext) {
        categories = categories.filter(cat => cat.id !== 'presentation');
      }
      const closeToolPicker = () => {
        this.untrackPanelPosition(panel);
        if (panel.parentNode) panel.remove();
        this.activeToolPicker = null;
        this._releaseCursor('toolPicker');
      };
      const header = document.createElement('div');
      header.className = 'dev1-picker-header';
      header.innerHTML = `<h3><span>🛠️</span><span>${this.escapeHtml(this.t('chooseTool'))}</span></h3>`;
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'dev1-picker-close';
      closeBtn.setAttribute('aria-label', this.t('cancel'));
      closeBtn.textContent = '✕';
      header.appendChild(closeBtn);
      const body = document.createElement('div');
      body.className = 'tool-picker-content dev1-picker-body';
      const sidebar = document.createElement('div');
      sidebar.className = 'category-sidebar dev1-picker-sidebar';
      const content = document.createElement('div');
      content.className = 'tool-area dev1-picker-content';
      body.appendChild(sidebar);
      body.appendChild(content);
      panel.appendChild(header);
      panel.appendChild(body);
      closeBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        closeToolPicker();
      });
      panel.addEventListener('mouseenter', () => this._suppressCursor('toolPicker'));
      panel.addEventListener('mouseleave', () => {
        this._releaseCursor('toolPicker');
        this._releaseCursor('hoverUI');
      });
      const renderCategory = (category) => this.showCategoryTools(category, content, pickerContext);
      const preferredCategoryId = pickerContext && pickerContext.toolId
        ? this.getToolCategoryIdForTool(pickerContext.toolId)
        : ((this._mdEditModeActive || this.isEditTool(this.currentTool)) ? 'markdown' : '');
      categories.forEach((category, index) => {
        if (category.id === 'markdown') {
          const divider = document.createElement('div');
          divider.className = 'dev1-picker-divider';
          sidebar.appendChild(divider);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `dev1-picker-tab category-btn category-btn-${category.id}`;
        btn.dataset.categoryId = category.id;
        btn.innerHTML = `<span class="dev1-category-icon">${this.escapeHtml(category.icon || '')}</span><span>${this.escapeHtml(category.title)}</span>`;
        btn.addEventListener('click', () => {
          sidebar.querySelectorAll('.category-btn').forEach(el => this.stylePickerCategoryButton(el, false, accentColor));
          this.stylePickerCategoryButton(btn, true, accentColor);
          if (category.id === 'markdown' && (this._mdEditModeActive || this.isEditTool(this.currentTool))) this._mdMode = 'edit';
          renderCategory(category);
        });
        btn.addEventListener('mouseenter', () => {
          if (!btn.classList.contains('active')) {
            const accent = this.getUiAccent(accentColor, btn);
            btn.style.setProperty('background', accent.soft, 'important');
            btn.style.setProperty('color', this.darkModeEnabled ? '#fff' : accent.visibleColor, 'important');
            btn.style.setProperty('border-left', `3px solid ${accent.visibleColor}`, 'important');
          }
        });
        btn.addEventListener('mouseleave', () => {
          if (!btn.classList.contains('active')) this.stylePickerCategoryButton(btn, false);
        });
        sidebar.appendChild(btn);
        if ((preferredCategoryId && category.id === preferredCategoryId) || (!preferredCategoryId && index === 0)) {
          this.stylePickerCategoryButton(btn, true, accentColor);
          if (category.id === 'markdown' && (this._mdEditModeActive || this.isEditTool(this.currentTool))) this._mdMode = 'edit';
          renderCategory(category);
        } else {
          this.stylePickerCategoryButton(btn, false, accentColor);
        }
      });
      document.body.appendChild(panel);
      this.trackPanelPosition(panel, anchor, 'top');
      this.activeToolPicker = panel;
    }

    showCategoryTools(category, content, pickerContext = null) {
      content.innerHTML = '';
      content.classList.add('tool-area');
      try {
        content.scrollTop = 0;
        content.scrollLeft = 0;
      } catch (_) { }
      const pickerPanel = content.closest && content.closest('.highlight-tool-picker');
      if (pickerPanel) {
        pickerPanel.querySelectorAll('.dev1-tool-view-toggle, .dev1-clear-recent.dev1-clear-tools').forEach(node => node.remove());
      }
      if (!category) return;
      if (category.id === 'presentation') {
        const tool = category.tools && category.tools[0];
        if (tool && (!pickerContext && this.currentTool !== tool.id)) {
          this.currentTool = tool.id;
          this.currentToolName = this.getToolNameForId(tool.id, tool.name || '');
          this.exitMdEditMode({ keepTool: true, silent: true });
          this.pushRecentTool(tool);
          this.updatePermanentToolbarIndicator();
          this.requestSave(true);
        }
        this.renderPresentationPenSettings(content, pickerContext);
        return;
      }
      const viewMode = this._toolPickerViewMode === 'list' ? 'list' : 'grid';
      if (category.id === 'recent') {
        const scrollWrap = document.createElement('div');
        scrollWrap.className = 'recent-tools-scroll-wrap';
        const controls = document.createElement('div');
        controls.className = 'dev1-recent-controls';
        const latest = document.createElement('button');
        latest.type = 'button';
        latest.textContent = this.t('sortByLatest');
        const usage = document.createElement('button');
        usage.type = 'button';
        usage.textContent = this.t('sortByUsage');
        controls.appendChild(latest);
        controls.appendChild(usage);
        scrollWrap.appendChild(controls);
        const grid = document.createElement('div');
        grid.className = `dev1-tool-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`;
        scrollWrap.appendChild(grid);
        content.appendChild(scrollWrap);
        const renderRecent = () => {
          latest.classList.toggle('active', this._recentToolsSortMode !== 'usage');
          usage.classList.toggle('active', this._recentToolsSortMode === 'usage');
          const tools = this.recentTools.map(item => this.localizeRecentTool(item)).filter(Boolean);
          if (this._recentToolsSortMode === 'usage') tools.sort((a, b) => Number(b.uses || 0) - Number(a.uses || 0));
          grid.innerHTML = '';
          tools.forEach(tool => {
            const option = this.createToolOption(tool, viewMode, pickerContext);
            const uses = Number(tool.uses || 0);
            if (uses > 0) {
              const count = document.createElement('span');
              count.className = 'tool-uses';
              count.textContent = String(uses);
              count.style.display = this._recentToolsSortMode === 'usage' ? 'block' : 'none';
              option.appendChild(count);
              option.addEventListener('mouseenter', () => {
                if (this._recentToolsSortMode !== 'usage') count.style.display = 'block';
              });
              option.addEventListener('mouseleave', () => {
                if (this._recentToolsSortMode !== 'usage') count.style.display = 'none';
              });
            }
            grid.appendChild(option);
          });
        };
        latest.addEventListener('click', () => {
          this._recentToolsSortMode = 'latest';
          renderRecent();
        });
        usage.addEventListener('click', () => {
          this._recentToolsSortMode = 'usage';
          renderRecent();
        });
        this.createRecentClearButton('tools', content, (event) => {
          event.stopPropagation();
          this.recentTools = [];
          this.requestSave(true);
          if (this.activeToolPicker) {
            const recentTab = this.activeToolPicker.querySelector('.category-btn-recent');
            if (recentTab) recentTab.remove();
            const firstTab = this.activeToolPicker.querySelector('.dev1-picker-tab');
            if (firstTab) firstTab.click();
          }
        });
        renderRecent();
        this.createToolViewToggle(category, content, pickerContext);
        return;
      }

      if (category.id === 'markdown') {
        const modeBar = document.createElement('div');
        modeBar.className = 'dev1-md-mode-bar';
        const visual = document.createElement('button');
        visual.type = 'button';
        visual.textContent = this.t('visualMode');
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = this.t('editMode');
        modeBar.appendChild(visual);
        modeBar.appendChild(edit);
        content.appendChild(modeBar);
        const notice = document.createElement('div');
        notice.className = 'dev1-dynamic-mhtml-notice';
        notice.textContent = this.t('markdownNotice');
        content.appendChild(notice);
        const grid = document.createElement('div');
        grid.className = `dev1-tool-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`;
        content.appendChild(grid);
        const renderMarkdown = () => {
          visual.classList.toggle('active', this._mdMode !== 'edit');
          edit.classList.toggle('active', this._mdMode === 'edit');
          let tools = (category.tools || []).filter(tool => {
            const isEdit = this.isEditTool(tool.id);
            return this._mdMode === 'edit' ? isEdit : (!isEdit && tool.id !== 'md-edit-disable-highlight');
          });
          if (this._mdMode === 'edit') {
            const order = [
              'md-edit-disable-highlight',
              'md-edit-bold', 'md-edit-italic', 'md-edit-bold-italic', 'md-edit-strikethrough',
              'md-edit-mark', 'md-edit-code-inline', 'md-edit-sup', 'md-edit-sub',
              'md-edit-link', 'md-edit-image', 'md-edit-table',
              'md-edit-h1', 'md-edit-h2', 'md-edit-h3', 'md-edit-ul', 'md-edit-ol',
              'md-edit-task', 'md-edit-quote', 'md-edit-code', 'md-edit-hr'
            ];
            tools = tools.slice().sort((a, b) => {
              const ia = order.indexOf(a.id);
              const ib = order.indexOf(b.id);
              return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
            });
          }
          grid.innerHTML = '';
          tools.forEach(tool => grid.appendChild(this.createToolOption(tool, viewMode, pickerContext)));
        };
        visual.addEventListener('click', () => {
          this._mdMode = 'visual';
          if (!pickerContext) this.exitMdEditMode({ keepTool: false, silent: true });
          if (!pickerContext && this.isEditTool(this.currentTool)) {
            this.currentTool = 'highlight';
            this.currentToolName = this.t('classicHighlight');
            this.updatePermanentToolbarIndicator();
            this.requestSave(true);
          }
          renderMarkdown();
        });
        edit.addEventListener('click', () => {
          this._mdMode = 'edit';
          if (!pickerContext) this.enterMdEditMode();
          renderMarkdown();
        });
        renderMarkdown();
        this.createToolViewToggle(category, content, pickerContext);
        return;
      }

      if (category.id === 'frames' && (category.tools || []).some(tool => tool.group)) {
        const groups = [
          { id: 'boxes', label: this.t('toolGroupBoxes') },
          { id: 'brackets', label: this.t('toolGroupBrackets') },
          { id: 'pills', label: this.t('toolGroupPills') }
        ];
        groups.forEach(group => {
          const tools = (category.tools || []).filter(tool => tool.group === group.id);
          if (!tools.length) return;
          const header = document.createElement('button');
          header.type = 'button';
          header.className = 'tool-group-header';
          header.dataset.groupId = group.id;
          header.innerHTML = `<span class="tool-group-arrow">▼</span><span>${this.escapeHtml(group.label)}</span>`;
          const grid = document.createElement('div');
          grid.className = `dev1-tool-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'}`;
          tools.forEach(tool => grid.appendChild(this.createToolOption(tool, viewMode, pickerContext)));
          const sync = () => {
            const collapsed = this._collapsedToolGroups.has(group.id);
            header.classList.toggle('collapsed', collapsed);
            grid.style.display = collapsed ? 'none' : '';
          };
          header.addEventListener('click', () => {
            if (this._collapsedToolGroups.has(group.id)) this._collapsedToolGroups.delete(group.id);
            else this._collapsedToolGroups.add(group.id);
            sync();
          });
          content.appendChild(header);
          content.appendChild(grid);
          sync();
        });
        this.createToolViewToggle(category, content, pickerContext);
        return;
      }

      const grid = document.createElement('div');
      grid.className = `dev1-tool-grid ${viewMode === 'list' ? 'list-view' : 'grid-view'} ${category.id === 'dynamic' ? 'dynamic-tools' : ''}`;
      if (category.id === 'dynamic') {
        const notice = document.createElement('div');
        notice.className = 'dev1-dynamic-mhtml-notice';
        notice.textContent = this.t('dynamicMhtmlNotice');
        content.appendChild(notice);
      }
      (category.tools || []).forEach(tool => grid.appendChild(this.createToolOption(tool, viewMode, pickerContext)));
      content.appendChild(grid);
      this.createToolViewToggle(category, content, pickerContext);
    }

    createToolViewToggle(category, content = null, pickerContext = null) {
      const btn = document.createElement('button');
      btn.type = 'button';
      const isList = this._toolPickerViewMode === 'list';
      btn.className = 'dev1-tool-view-toggle';
      btn.dataset.categoryId = category && category.id ? category.id : '';
      btn.title = isList ? this.t('viewGrid') : this.t('viewList');
      btn.setAttribute('aria-label', btn.title);
      btn.innerHTML = isList ? this.getGridIconSvg() : this.getListIconSvg();
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        this._toolPickerViewMode = isList ? 'grid' : 'list';
        this.requestSave(true);
        const content = this.activeToolPicker && this.activeToolPicker.querySelector('.dev1-picker-content');
        if (content) this.showCategoryTools(category, content, pickerContext);
      });
      const panel = (content && content.closest && content.closest('.highlight-tool-picker')) || this.activeToolPicker;
      if (panel) {
        panel.querySelectorAll('.dev1-tool-view-toggle').forEach(node => node.remove());
        panel.appendChild(btn);
        return btn;
      }
      return btn;
    }

    createToolOption(tool, viewMode = 'grid', pickerContext = null) {
      const btn = document.createElement('div');
      btn.tabIndex = 0;
      btn.setAttribute('role', 'button');
      btn.className = `tool-option ${viewMode === 'list' ? 'list-option' : 'grid-option'}`;
      btn.dataset.toolId = tool.id;
      const toolAccent = this.applyOptionAccent(btn, this.getPickerContextAccentColor(pickerContext) || '#1976d2');
      const icon = document.createElement('span');
      icon.className = 'tool-icon';
      const iconMarkup = this.getToolIconMarkup(tool);
      if (safeString(iconMarkup).trim().startsWith('<svg')) icon.innerHTML = iconMarkup;
      else icon.textContent = tool.icon || '•';
      const name = document.createElement('span');
      name.className = 'tool-name';
      name.textContent = tool.name;
      btn.appendChild(icon);
      btn.appendChild(name);
      if (viewMode === 'list') {
        const help = document.createElement('span');
        help.className = 'tool-help-btn';
        help.textContent = '?';
        const tooltip = document.createElement('span');
        tooltip.className = 'tool-help-tooltip';
        tooltip.textContent = tool.description || '';
        help.appendChild(tooltip);
        btn.appendChild(help);
      } else {
        const desc = document.createElement('span');
        desc.className = 'tool-desc';
        desc.textContent = tool.description || '';
        btn.appendChild(desc);
      }
      const activeToolId = pickerContext && pickerContext.toolId ? pickerContext.toolId : this.currentTool;
      if (tool.id === activeToolId) btn.classList.add('active');
      const commit = () => this.commitToolSelection(tool, pickerContext);
      btn.addEventListener('click', commit);
      btn.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          commit();
        }
      });
      const baseIconStroke = this.darkModeEnabled ? '#eef2ff' : '#2c3e50';
      const setCustomIconStroke = (strokeColor) => {
        try {
          if (tool.id === 'wavy') {
            const path = icon.querySelector('svg path');
            if (path) path.setAttribute('stroke', strokeColor);
            return;
          }
          if (tool.id === 'dashed-box') {
            const rect = icon.querySelector('svg rect');
            if (rect) rect.setAttribute('stroke', strokeColor);
            return;
          }
          if (tool.id === 'outline') {
            const text = icon.querySelector('svg text');
            if (text) text.setAttribute('stroke', strokeColor);
            return;
          }
          if (tool.id === 'gradient') {
            const rect = icon.querySelector('svg rect');
            if (rect) rect.setAttribute('stroke', strokeColor);
            return;
          }
          if (tool.id === 'mosaic') {
            const outer = icon.querySelector('svg rect');
            if (outer) outer.setAttribute('stroke', strokeColor);
          }
        } catch (_) { }
      };
      btn.addEventListener('mouseenter', () => {
        const hoverStroke = toolAccent.visibleColor || (this.darkModeEnabled ? '#f5f7ff' : '#1976d2');
        setCustomIconStroke(hoverStroke);
      });
      btn.addEventListener('mouseleave', () => {
        setCustomIconStroke(baseIconStroke);
      });
      return btn;
    }

    getToolIconMarkup(tool) {
      const id = safeString(tool && tool.id);
      if (id === 'wavy') return this.getWavyIconSVG(this.darkModeEnabled ? '#eef2ff' : '#2c3e50', 24);
      if (['dashed-box', 'gradient', 'mosaic', 'outline', 'liquidglass'].includes(id)) return this.getCustomToolIconSVG(id, 24);
      return this.escapeHtml(tool.icon || '•');
    }

    isEffectiveUiDarkMode() {
      try {
        return !!this.darkModeEnabled || !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
      } catch (_) {
        return !!this.darkModeEnabled;
      }
    }

    shouldUseLightIconForTool(toolId) {
      const lineTools = new Set(['underline', 'double-underline', 'wavy', 'dotted', 'dashed', 'strikethrough', 'thick-underline']);
      const frameTools = new Set(['box', 'filled-box', 'rounded-box', 'dashed-box', 'double-box']);
      const bracketTools = new Set(['brackets-corner', 'brackets-round', 'brackets-angle', 'brackets-book', 'brackets-cjk', 'brackets-curly', 'brackets-square']);
      return lineTools.has(toolId) || frameTools.has(toolId) || bracketTools.has(toolId) || toolId === 'pill';
    }

    getWavyIconSVG(strokeColor = '#eef2ff', size = 24) {
      const s = Number(size) || 24;
      return `<svg data-dev1-custom-tool-icon="true" width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path d="M2 12c2 4 6-4 10 0s6-4 10 0" stroke="${strokeColor}" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    getCustomToolIconSVG(toolId, size = 24) {
      const s = Number(size) || 24;
      const uiDark = !!this.darkModeEnabled;
      const stroke = uiDark ? '#eef2ff' : '#2c3e50';
      const faint = uiDark ? '#cfd8ff' : '#94a3b8';
      const fillLight = uiDark ? '#3b82f6' : '#60a5fa';
      const fillDark = uiDark ? '#8b5cf6' : '#7c3aed';
      const uid = `${toolId.replace(/[^a-z0-9_-]/gi, '')}_${Math.random().toString(36).slice(2, 8)}`;
      if (toolId === 'dashed-box') {
        return `<svg data-dev1-custom-tool-icon="true" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="3" ry="3" fill="none" stroke="${stroke}" stroke-width="2" stroke-dasharray="4 3"/></svg>`;
      }
      if (toolId === 'gradient') {
        return `<svg data-dev1-custom-tool-icon="true" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><linearGradient id="${uid}_grad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="${fillLight}"/><stop offset="100%" stop-color="${fillDark}"/></linearGradient></defs><rect x="3.5" y="4.5" width="17" height="15" rx="3" ry="3" fill="url(#${uid}_grad)" stroke="${stroke}" stroke-width="1.5"/></svg>`;
      }
      if (toolId === 'mosaic') {
        return `<svg data-dev1-custom-tool-icon="true" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><rect x="3.5" y="3.5" width="17" height="17" rx="3" ry="3" fill="none" stroke="${stroke}" stroke-width="1.5"/>${[0, 1, 2].map(r => [0, 1, 2].map(c => { const x = 5 + c * 5.5; const y = 5 + r * 5.5; const col = ((r + c) % 2 === 0) ? faint : stroke; return `<rect x="${x}" y="${y}" width="4" height="4" fill="${col}" rx="0.8"/>`; }).join('')).join('')}</svg>`;
      }
      if (toolId === 'outline') {
        return `<svg data-dev1-custom-tool-icon="true" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><text x="12" y="16" text-anchor="middle" dominant-baseline="middle" font-size="18" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-weight="600" fill="none" stroke="${stroke}" stroke-width="1.2">Aa</text></svg>`;
      }
      if (toolId === 'liquidglass') {
        return `<svg data-dev1-custom-tool-icon="true" width="${s}" height="${s}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"><defs><radialGradient id="${uid}_bg" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#e8fff6"/><stop offset="60%" stop-color="#ccf7e9"/><stop offset="100%" stop-color="#b7efdf"/></radialGradient><linearGradient id="${uid}_st" x1="19" y1="5" x2="5" y2="19" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#22c55e" stop-opacity="0"/><stop offset="18%" stop-color="#22c55e" stop-opacity="0.7"/><stop offset="50%" stop-color="#16b38a" stop-opacity="0.85"/><stop offset="82%" stop-color="#0ea5a1" stop-opacity="0.65"/><stop offset="100%" stop-color="#0ea5a1" stop-opacity="0"/></linearGradient><filter id="${uid}_blur" x="-12%" y="-12%" width="124%" height="124%"><feGaussianBlur in="SourceGraphic" stdDeviation="0.7"/></filter><filter id="${uid}_sblur" x="-15%" y="-15%" width="130%" height="130%"><feGaussianBlur in="SourceGraphic" stdDeviation="1.4"/></filter><clipPath id="${uid}_clip"><circle cx="12" cy="12" r="9"/></clipPath></defs><circle cx="12" cy="12" r="9" fill="url(#${uid}_bg)" stroke="#8bd3bf" stroke-width="1"/><g clip-path="url(#${uid}_clip)" opacity="0.95"><path d="M19 5 L5 19" stroke="url(#${uid}_st)" stroke-width="9.2" fill="none" filter="url(#${uid}_sblur)" stroke-linecap="round" stroke-opacity="0.32" transform="translate(-0.7,-0.7)"/><path d="M19 5 L5 19" stroke="url(#${uid}_st)" stroke-width="9.2" fill="none" filter="url(#${uid}_sblur)" stroke-linecap="round" stroke-opacity="0.28" transform="translate(0.7,0.7)"/><path d="M19 5 L5 19" stroke="url(#${uid}_st)" stroke-width="7.4" fill="none" filter="url(#${uid}_blur)" stroke-linecap="round" stroke-opacity="0.9"/></g><circle cx="12" cy="9" r="5" fill="#ffffff" opacity="0.15"/><path d="M7 6 C10 5, 14 5, 17 7" stroke="#ffffff" stroke-width="1.1" stroke-opacity="0.35" fill="none" stroke-linecap="round"/></svg>`;
      }
      return '';
    }

    getGridIconSvg() {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="3" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><rect x="14" y="14" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
    }

    getListIconSvg() {
      return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
    }

    selectTool(tool) {
      if (tool.id === 'md-edit-disable-highlight') {
        this.currentTool = tool.id;
        this.currentToolName = this.getToolNameForId(tool.id, tool.name || '');
        this._mdMode = 'edit';
        this.enterMdEditMode();
        this.pushRecentTool(tool);
        this.updatePermanentToolbarIndicator();
        if (this.activeToolPicker) this.activeToolPicker.querySelectorAll('.tool-option').forEach(option => {
          option.classList.toggle('active', option.dataset.toolId === tool.id);
        });
        this.showToast(this.t('highlightDisabled'));
        this.requestSave(true);
        return;
      }
      this.currentTool = tool.id;
      this.currentToolName = this.getToolNameForId(tool.id, tool.name || '');
      if (this.isEditTool(tool.id)) {
        this._mdMode = 'edit';
        this.enterMdEditMode();
        this.applyMdEditTool(tool);
      } else {
        this.exitMdEditMode({ keepTool: true, silent: true });
      }
      this.pushRecentTool(tool);
      this.updatePermanentToolbarIndicator();
      if (this.activeToolPicker && tool.id !== 'presentation-pen') {
        this.closeTransientPanelByKey('activeToolPicker');
      }
      this.requestSave(true);
    }

    pushRecentTool(tool) {
      const existing = this.recentTools.find(item => item.id === tool.id);
      const uses = Number(existing?.uses || 0) + 1;
      const filtered = this.recentTools.filter(item => item.id !== tool.id);
      this.recentTools = [{ id: tool.id, uses }, ...filtered].slice(0, 16);
    }

    normalizeRecentTools(list) {
      return (Array.isArray(list) ? list : [])
        .map(item => {
          const id = safeString(item && item.id);
          if (!id) return null;
          return {
            id,
            uses: Number.isFinite(Number(item.uses)) ? Number(item.uses) : 0
          };
        })
        .filter(Boolean)
        .slice(0, 16);
    }

    getToolNameForId(id, fallback = '') {
      const tool = this.findToolInCatalog(id);
      return tool ? tool.name : (fallback || this.t('classicHighlight'));
    }

    localizeRecentTool(item) {
      const tool = this.findToolInCatalog(item.id);
      if (!tool) return null;
      return {
        ...tool,
        uses: Number.isFinite(Number(item.uses)) ? Number(item.uses) : 0
      };
    }

    findToolInCatalog(id) {
      const wanted = safeString(id);
      for (const cat of this.getToolCatalogCategories()) {
        const tool = (cat.tools || []).find(item => item.id === wanted);
        if (tool) return tool;
      }
      return null;
    }

    getToolCategoryIdForTool(id) {
      const wanted = safeString(id);
      if (!wanted) return '';
      for (const cat of this.getToolCatalogCategories()) {
        if ((cat.tools || []).some(item => item.id === wanted)) return cat.id;
      }
      return '';
    }

    getToolCatalogCategories() {
      const tool = (id, zhName, enName, icon, zhDescription, enDescription, extra = {}) => ({
        id,
        name: this.lt(zhName, enName),
        icon,
        description: this.lt(zhDescription, enDescription),
        ...extra
      });
      return [
        { id: 'markdown', title: this.t('toolsMarkdown'), icon: '📝', tools: [
          tool('md-bold', '加粗', 'Bold', 'B', '**text**', '**text**'),
          tool('md-italic', '斜体', 'Italic', 'I', '*text*', '*text*'),
          tool('md-bold-italic', '粗斜体', 'Bold Italic', 'BI', '***text***', '***text***'),
          tool('md-underline', '下划线', 'Underline', 'U̲', '<u>text</u>', '<u>text</u>'),
          tool('md-strikethrough', '删除线', 'Strikethrough', 'S̶', '~~text~~', '~~text~~'),
          tool('md-mark', '高亮', 'Mark', '==', '==text==', '==text=='),
          tool('md-sup', '上标', 'Superscript', 'X²', '^sup^', '^sup^'),
          tool('md-sub', '下标', 'Subscript', 'X₂', '~sub~', '~sub~'),
          tool('md-edit-disable-highlight', '暂时屏蔽高亮', 'Disable Highlight', '🚫', '清空工具', 'Temporarily disable selection highlighting', { isAction: true }),
          tool('md-edit-h1', 'H1 标题', 'H1 Heading', 'H1', '# text', '# text'),
          tool('md-edit-h2', 'H2 标题', 'H2 Heading', 'H2', '## text', '## text'),
          tool('md-edit-h3', 'H3 标题', 'H3 Heading', 'H3', '### text', '### text'),
          tool('md-edit-ul', '无序列表', 'Bulleted List', '•', '- item', '- item'),
          tool('md-edit-ol', '有序列表', 'Numbered List', '1.', '1. item', '1. item'),
          tool('md-edit-task', '任务列表', 'Task List', '☐', '- [ ] task', '- [ ] task'),
          tool('md-edit-quote', '引用', 'Quote', '>', '> quote', '> quote'),
          tool('md-edit-code', '代码块', 'Code Block', '```', '```code```', '```code```'),
          tool('md-edit-hr', '分隔线', 'Divider', '─', '---', '---'),
          tool('md-edit-link', '链接', 'Link', '🔗', '[text](url)', '[text](url)'),
          tool('md-edit-image', '图片', 'Image', '🖼', '![alt](url)', '![alt](url)'),
          tool('md-edit-table', '表格', 'Table', '⊞', '| col | col |', '| col | col |'),
          tool('md-edit-bold', '加粗', 'Bold', 'B', '**text**', '**text**'),
          tool('md-edit-italic', '斜体', 'Italic', 'I', '*text*', '*text*'),
          tool('md-edit-bold-italic', '粗斜体', 'Bold Italic', 'BI', '***text***', '***text***'),
          tool('md-edit-strikethrough', '删除线', 'Strikethrough', 'S̶', '~~text~~', '~~text~~'),
          tool('md-edit-mark', '高亮', 'Mark', '==', '==text==', '==text=='),
          tool('md-edit-code-inline', '行内代码', 'Inline Code', '`', '`code`', '`code`'),
          tool('md-edit-sup', '上标', 'Superscript', 'X²', '^sup^', '^sup^'),
          tool('md-edit-sub', '下标', 'Subscript', 'X₂', '~sub~', '~sub~')
        ] },
        { id: 'presentation', title: this.t('tool_presentation'), icon: '🖋️', tools: [
          tool('presentation-pen', '演示笔', 'Presentation Pen', '🖋️', '用于临时画画，可自动识别形状', 'Used for temporary drawing, supports auto shape recognition')
        ] },
        { id: 'lines', title: this.t('toolsLines'), icon: '📏', tools: [
          tool('underline', '下划线', 'Underline', 'U̲', '直线下划线', 'Straight underline'),
          tool('double-underline', '双下划线', 'Double Underline', '═', '双线下划线', 'Double line'),
          tool('wavy', '波浪线', 'Wavy Underline', '〰️', '波浪下划线', 'Wavy line'),
          tool('dotted', '点状下划线', 'Dotted Underline', '⋯', '点状线条', 'Dotted line'),
          tool('dashed', '虚线下划线', 'Dashed Underline', '┅', '虚线线条', 'Dashed line'),
          tool('strikethrough', '删除线', 'Strikethrough', 'S̶', '文字中线', 'Line through text'),
          tool('thick-underline', '粗下划线', 'Thick Underline', 'U̲̲̲', '加粗下划线', 'Bold underline')
        ] },
        { id: 'frames', title: this.t('toolsFrames'), icon: '📦', tools: [
          tool('box', '矩形框', 'Simple Box', '▢', '矩形边框', 'Rectangular border', { group: 'boxes' }),
          tool('filled-box', '填充框', 'Filled Box', '▣', '边框与浅填充', 'Border with matching fill', { group: 'boxes' }),
          tool('rounded-box', '圆角框', 'Rounded Box', '▢', '圆角边框', 'Rounded border', { group: 'boxes' }),
          tool('dashed-box', '虚线框', 'Dashed Box', '⬚', '虚线边框', 'Dashed border', { group: 'boxes' }),
          tool('double-box', '双线框', 'Double Box', '▣', '双线边框', 'Double border', { group: 'boxes' }),
          tool('callout', '气泡框', 'Callout', '💬', '气泡样式', 'Speech bubble', { group: 'boxes' }),
          tool('sticker', '贴纸', 'Sticker', '🏷️', '标签样式', 'Label style', { group: 'boxes' }),
          tool('brackets-corner', '直角括号', 'Corner Brackets', '「」', '直角括号', 'Corner brackets', { group: 'brackets' }),
          tool('brackets-round', '圆括号', 'Round Brackets', '()', '圆括号', 'Round brackets', { group: 'brackets' }),
          tool('brackets-angle', '尖括号', 'Angle Brackets', '<>', '尖括号', 'Angle brackets', { group: 'brackets' }),
          tool('brackets-book', '书名号', 'Book Brackets', '《》', '书名号括起', 'Book brackets', { group: 'brackets' }),
          tool('brackets-cjk', '方头括号', 'CJK Brackets', '【】', '中文方括号', 'CJK brackets', { group: 'brackets' }),
          tool('brackets-curly', '花括号', 'Curly Brackets', '{}', '花括号', 'Curly brackets', { group: 'brackets' }),
          tool('brackets-square', '方括号', 'Square Brackets', '[]', '方括号', 'Square brackets', { group: 'brackets' }),
          tool('pill', '胶囊', 'Pill', '💊', '胶囊形状', 'Pill shaped', { group: 'pills' })
        ] },
        { id: 'solid', title: this.t('toolsSolid'), icon: '🖍️', tools: [
          tool('highlight', '经典高亮', 'Classic Highlight', '🖍️', '纯色背景', 'Solid background'),
          tool('marker', '马克笔', 'Marker', '🖊️', '马克笔样式', 'Marker style'),
          tool('pastel', '柔和高亮', 'Pastel', '🎨', '柔和背景', 'Soft background'),
          tool('neon', '霓虹高亮', 'Neon', '⚡', '明亮发光', 'Bright glow'),
          tool('transparent', '透明高亮', 'Transparent', '👻', '轻量覆盖', 'Subtle overlay'),
          tool('highlighter-pen', '荧光笔', 'Highlighter Pen', '🖊️', '荧光笔效果', 'Realistic highlighter')
        ] },
        { id: 'special', title: this.t('toolsSpecial'), icon: '✨', tools: [
          tool('glow', '发光', 'Glow', '🌟', '外发光', 'Glowing outline'),
          tool('blur', '模糊', 'Blur', '🌫️', '模糊背景', 'Blurred background'),
          tool('liquidglass', '液体玻璃', 'Liquid Glass', '💎', '玻璃高亮', 'Glass highlight'),
          tool('mosaic', '马赛克', 'Mosaic', '▦', '马赛克效果', 'Mosaic effect'),
          tool('outline', '文字描边', 'Outline', 'A', '描边文字', 'Outlined text'),
          tool('rainbow', '彩虹', 'Rainbow', '🌈', '彩虹渐变', 'Rainbow gradient'),
          tool('spotlight', '聚光灯', 'Spotlight', '🔦', '径向聚光背景', 'Radial spotlight'),
          tool('gradient', '渐变', 'Gradient', '🎚️', '渐变背景', 'Gradient background')
        ] },
        { id: 'dynamic', title: this.t('toolsDynamic'), icon: '🎞️', tools: [
          tool('running-line', '流动线框', 'Running Line', '⬚↻', '动画边框', 'Animated border'),
          tool('neon-blink', '霓虹闪烁', 'Neon Blink', '🌬', '闪烁霓虹', 'Blinking neon'),
          tool('neon-flicker', '霓虹抖动', 'Neon Flicker', '⚡', '抖动发光', 'Flicker glow'),
          tool('ripple', '涟漪', 'Ripple', '◎', '涟漪脉冲', 'Ripple pulse'),
          tool('fluid', '流体', 'Fluid', '🌊', '流动色彩', 'Wave-like color drift')
        ] }
      ];
    }

    getAllToolCategories() {
      const categories = [];
      if (this.recentTools.length) {
        const recent = this.recentTools.map(item => this.localizeRecentTool(item)).filter(Boolean);
        if (recent.length) categories.push({ id: 'recent', title: this.t('toolsRecent'), icon: '⭐', tools: recent });
      }
      categories.push(...this.getToolCatalogCategories());
      return categories;
    }

    getCurrentToolIcon() {
      const tool = this.findTool(this.currentTool);
      return tool ? tool.icon : '🖍️';
    }

    getCurrentToolName() {
      const tool = this.findTool(this.currentTool);
      return tool ? tool.name : (this.currentToolName || this.t('classicHighlight'));
    }

    isEditTool(toolId) {
      return safeString(toolId).startsWith('md-edit-');
    }

    isEditEntry(entry) {
      if (!entry || typeof entry !== 'object') return false;
      if (entry.mode === 'edit' || entry.kind === 'edit') return true;
      return this.isEditTool(entry.toolStyle || entry.tool || entry.toolId);
    }

    getCurrentColorName() {
      return this.getColorNameForValue(this.currentColor, this.currentColorVariant, this.currentColorName || this.currentColor, this.currentColorKey || '');
    }

    findTool(id) {
      for (const cat of this.getAllToolCategories()) {
        const tool = (cat.tools || []).find(item => item.id === id);
        if (tool) return tool;
      }
      return null;
    }

    showOperationsPanel(anchor) {
      if (this.activeOperationsPanel && this.activeOperationsPanel.parentNode) {
        this.closeTransientPanelByKey('activeOperationsPanel');
        return;
      }
      this.closeTransientPanels();
      this.operationsAnchor = anchor || null;
      const panel = this.createPanel('operations-panel', anchor);
      this.applyPickerTheme(panel);
      panel.appendChild(this.createOperationButton(this.t('operationClearAll'), () => this.showClearOptionsPanel(), { icon: '🧹' }));
      panel.appendChild(this.createOperationButton(this.t('operationBatchDelete'), () => this.enterBatchDeleteMode(), { icon: '🗑️' }));
      document.body.appendChild(panel);
      this.trackPanelPosition(panel, anchor, 'top');
      this.activeOperationsPanel = panel;
    }

    createOperationButton(text, action, options = false, legacyMeta = '') {
      const opts = typeof options === 'object'
        ? options
        : { danger: !!options, meta: legacyMeta };
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = opts.danger ? 'danger' : '';
      if (opts.mode) btn.dataset.clearMode = opts.mode;
      if (opts.accent) btn.style.setProperty('--dev1-operation-accent', opts.accent);
      if (opts.icon) {
        const icon = document.createElement('span');
        icon.className = 'dev1-operation-icon';
        icon.textContent = opts.icon;
        btn.appendChild(icon);
      }
      const label = document.createElement('span');
      label.className = 'dev1-operation-label';
      label.textContent = text;
      btn.appendChild(label);
      const meta = opts.meta || '';
      if (meta) {
        const sub = document.createElement('span');
        sub.className = 'dev1-operation-meta';
        sub.textContent = meta;
        btn.appendChild(sub);
      }
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        this._releaseCursor('plugin-ui');
        this._releaseCursor('operations');
        action();
      });
      return btn;
    }

    showClearOptionsPanel() {
      if (this.activeOperationsPanel) {
        this.closeTransientPanelByKey('activeOperationsPanel');
      }
      const anchor = this.operationsAnchor || this.toolbar;
      const panel = this.createPanel('operations-panel clear-options-panel', anchor);
      this.applyPickerTheme(panel);
      const title = document.createElement('div');
      title.className = 'dev1-panel-title';
      title.textContent = this.t('clearOptionsTitle');
      panel.appendChild(title);
      [
        { mode: 'all', icon: '🧹', label: this.t('clearAllOption'), desc: this.t('clearAllDesc'), danger: true, accent: '#ef4444' },
        { mode: 'visual', icon: '🎨', label: this.t('clearVisual'), desc: this.t('clearVisualDesc'), accent: '#f59e0b' },
        { mode: 'edit', icon: '✏️', label: this.t('clearEdit'), desc: this.t('clearEditDesc'), accent: '#3b82f6' }
      ].forEach(option => {
        panel.appendChild(this.createOperationButton(option.label, () => {
          this.closeTransientPanelByKey('activeOperationsPanel');
          this.confirmAndClear(option.mode);
        }, { danger: option.danger, icon: option.icon, meta: option.desc, mode: option.mode, accent: option.accent }));
      });
      panel.appendChild(this.createOperationButton(this.t('cancel'), () => {
        this.closeTransientPanelByKey('activeOperationsPanel');
      }, { icon: '↩' }));
      document.body.appendChild(panel);
      this.trackPanelPosition(panel, anchor, 'top');
      this.activeOperationsPanel = panel;
    }

    confirmAndClear(mode) {
      const count = this.getClearCount(mode);
      if (!count) {
        this.showToast(mode === 'edit' ? this.t('emptyEdit') : this.t('cleared'));
        return;
      }
      const label = mode === 'visual' ? this.t('clearVisual') : (mode === 'edit' ? this.t('clearEdit') : this.t('clearAll'));
      if (this.activeOperationsPanel) {
        this.closeTransientPanelByKey('activeOperationsPanel');
      }
      const anchor = this.operationsAnchor || this.toolbar;
      const panel = this.createPanel('operations-panel clear-confirm-panel', anchor);
      this.applyPickerTheme(panel);
      const title = document.createElement('div');
      title.className = 'dev1-panel-title';
      title.textContent = this.t('clearConfirmTitle');
      const body = document.createElement('div');
      body.className = 'dev1-confirm-body';
      body.textContent = `${label} (${count})`;
      panel.appendChild(title);
      panel.appendChild(body);
      panel.appendChild(this.createOperationButton(this.t('confirm'), () => {
        this.clearByMode(mode);
        this.showToast(this.t('cleared'));
        this.requestSave(true);
        this.closeTransientPanelByKey('activeOperationsPanel');
      }, { danger: true, icon: '✓' }));
      panel.appendChild(this.createOperationButton(this.t('cancel'), () => {
        this.closeTransientPanelByKey('activeOperationsPanel');
      }, { icon: '↶' }));
      document.body.appendChild(panel);
      this.trackPanelPosition(panel, anchor, 'top');
      this.activeOperationsPanel = panel;
    }

    getClearCount(mode) {
      this.hydrateExistingDomHighlights();
      const visualCount = this.getAllHighlightIds(true).size;
      const editCount = this.getEditFragmentCount();
      if (mode === 'all') return visualCount + editCount;
      if (mode === 'edit') return editCount;
      return visualCount;
    }

    clearByMode(mode) {
      this.hydrateExistingDomHighlights();
      if (mode === 'all') {
        this.clearEverything();
        return;
      }
      if (mode === 'edit') {
        this.clearEditFragments();
        return;
      }
      this.clearVisualMode();
      this.updatePermanentToolbarIndicator();
    }

    collectBatchDeleteSelection() {
      const highlightIds = new Set(this.selectedHighlightIds);
      const editFragmentIds = new Set(this.selectedEditFragmentIds);
      this.getAllHighlightElements().forEach(el => {
        if (!el.classList || !el.classList.contains('batch-selected')) return;
        const id = el && el.getAttribute('data-highlight-id');
        if (id) highlightIds.add(id);
      });
      this.queryAllDeep(`${EDIT_FRAGMENT_SELECTOR}.batch-selected, ${EDIT_FRAGMENT_SELECTOR}.batch-selected-edit`).forEach(el => {
        const id = el && el.getAttribute('data-edit-fragment-id');
        if (id) editFragmentIds.add(id);
      });
      return { highlightIds, editFragmentIds };
    }

    getBatchDeleteSelectionCount() {
      const selection = this.collectBatchDeleteSelection();
      return selection.highlightIds.size + selection.editFragmentIds.size;
    }

    enterBatchDeleteMode() {
      this.darkModeEnabled = this.detectPageTheme();
      this.closeTransientPanels();
      if (this.batchCleanup) {
        this.exitBatchDeleteMode();
        return;
      }
      this.selectedHighlightIds.clear();
      this.selectedEditFragmentIds.clear();
      this._batchContainedHighlightIdsByEditId.clear();
      this._cursorColorOverride = '#ff4444';
      this.updateCursorStyle();
      const overlay = document.createElement('div');
      overlay.id = 'dev1-snapshot-highlighter-batch-overlay';
      overlay.dataset.dev1SnapshotHighlighterUi = 'true';
      overlay.classList.toggle('dark-theme', !!this.darkModeEnabled);
      overlay.classList.toggle('light-theme', !this.darkModeEnabled);
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      overlay.appendChild(svg);
      const bar = document.createElement('div');
      bar.id = 'dev1-snapshot-highlighter-batch-bar';
      bar.dataset.dev1SnapshotHighlighterUi = 'true';
      bar.classList.toggle('dark-theme', !!this.darkModeEnabled);
      bar.classList.toggle('light-theme', !this.darkModeEnabled);
      const tip = document.createElement('span');
      tip.className = 'dev1-batch-tip';
      tip.innerHTML = `${this.escapeHtml(this.t('clickWord'))} <strong>${this.escapeHtml(this.t('orWord'))}</strong> <em>${this.escapeHtml(this.t('drawSlash'))}</em> ${this.escapeHtml(this.t('forBatchSelect'))}`;
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = this.t('batchExit');
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'danger';
      const updateDelete = () => {
        const count = this.getBatchDeleteSelectionCount();
        del.textContent = count > 0 ? `${this.t('deleteSelectedNow')} (${count})` : this.t('deleteSelectedNow');
        del.disabled = count === 0;
      };
      updateDelete();
      bar.appendChild(tip);
      bar.appendChild(cancel);
      bar.appendChild(del);
      document.body.appendChild(overlay);
      document.body.appendChild(bar);

      let drawing = false;
      let polyline = null;
      let suppressNextClick = false;
      const points = [];
      const pointString = () => points.map(p => `${p.x},${p.y}`).join(' ');
      const updateOverlayBounds = () => {
        const doc = document.documentElement;
        const body = document.body;
        const width = Math.max(window.innerWidth, doc?.scrollWidth || 0, body?.scrollWidth || 0);
        const height = Math.max(window.innerHeight, doc?.scrollHeight || 0, body?.scrollHeight || 0);
        overlay.style.setProperty('left', '0', 'important');
        overlay.style.setProperty('top', '0', 'important');
        overlay.style.setProperty('width', `${width}px`, 'important');
        overlay.style.setProperty('height', `${height}px`, 'important');
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(height));
      };
      const positionBatchBar = () => {
        const margin = 12;
        const toolbarRect = this.toolbar ? this.toolbar.getBoundingClientRect() : null;
        const barRect = bar.getBoundingClientRect();
        if (!toolbarRect) {
          bar.style.setProperty('left', '50%', 'important');
          bar.style.setProperty('top', '16px', 'important');
          bar.style.setProperty('bottom', 'auto', 'important');
          bar.style.setProperty('transform', 'translateX(-50%)', 'important');
          return;
        }
        const centerX = toolbarRect.left + toolbarRect.width / 2;
        const left = Math.max(margin, Math.min(window.innerWidth - barRect.width - margin, centerX - barRect.width / 2));
        const preferBelow = toolbarRect.top < window.innerHeight / 2;
        let top = preferBelow ? toolbarRect.bottom + 10 : toolbarRect.top - barRect.height - 10;
        if (top < margin) top = toolbarRect.bottom + 10;
        if (top + barRect.height > window.innerHeight - margin) top = toolbarRect.top - barRect.height - 10;
        bar.style.setProperty('left', `${left}px`, 'important');
        bar.style.setProperty('top', `${Math.max(margin, Math.min(window.innerHeight - barRect.height - margin, top))}px`, 'important');
        bar.style.setProperty('bottom', 'auto', 'important');
        bar.style.setProperty('transform', 'none', 'important');
      };
      const selectByPoint = (x, y, toggle = false) => {
        overlay.style.setProperty('pointer-events', 'none', 'important');
        const el = document.elementFromPoint(x, y);
        overlay.style.setProperty('pointer-events', 'all', 'important');
        const edit = el && el.closest && el.closest(EDIT_FRAGMENT_SELECTOR);
        if (edit) {
          const id = edit.getAttribute('data-edit-fragment-id');
          if (toggle) this.toggleEditFragment(id);
          else this.selectEditFragment(id, true);
          updateDelete();
          return;
        }
        const hl = this.getClosestBatchHighlightElement(el);
        if (hl) {
          const id = hl.getAttribute('data-highlight-id');
          if (toggle) this.toggleHighlightGroup(id);
          else this.selectHighlightGroup(id, true);
        }
        updateDelete();
      };
      const down = (event) => {
        if (event.target !== overlay && event.target !== svg) return;
        drawing = true;
        suppressNextClick = false;
        points.length = 0;
        polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        polyline.setAttribute('fill', 'none');
        polyline.setAttribute('stroke', '#ff4444');
        polyline.setAttribute('stroke-width', '4');
        polyline.setAttribute('stroke-linecap', 'round');
        polyline.setAttribute('stroke-linejoin', 'round');
        svg.appendChild(polyline);
        points.push({ x: event.pageX, y: event.pageY });
        polyline.setAttribute('points', pointString());
      };
      const move = (event) => {
        if (!drawing) return;
        const last = points[points.length - 1];
        if (!last || Math.hypot(event.pageX - last.x, event.pageY - last.y) > 2) {
          points.push({ x: event.pageX, y: event.pageY });
          suppressNextClick = true;
          polyline.setAttribute('points', pointString());
          this.updateSelectionByStroke(points);
          updateDelete();
        }
      };
      const up = () => { drawing = false; polyline = null; };
      const key = (event) => { if (event.key === 'Escape') this.exitBatchDeleteMode(); };
      const cleanup = () => {
        document.removeEventListener('mousemove', move, true);
        document.removeEventListener('mouseup', up, true);
        document.removeEventListener('keydown', key, true);
        window.removeEventListener('resize', updateOverlayBounds, true);
        window.removeEventListener('resize', positionBatchBar, true);
        overlay.removeEventListener('mousedown', down, true);
        if (overlay.parentNode) overlay.remove();
        if (bar.parentNode) bar.remove();
        const dialog = document.getElementById('dev1-snapshot-highlighter-batch-confirm-dialog');
        if (dialog && typeof dialog.__dev1Close === 'function') dialog.__dev1Close();
        else if (dialog) dialog.remove();
        this.getAllHighlightElements().forEach(el => el.classList.remove('batch-selected'));
        this.queryAllDeep(`${EDIT_FRAGMENT_SELECTOR}.batch-selected, ${EDIT_FRAGMENT_SELECTOR}.batch-selected-edit`).forEach(el => el.classList.remove('batch-selected', 'batch-selected-edit'));
        this.selectedHighlightIds.clear();
        this.selectedEditFragmentIds.clear();
        this._batchContainedHighlightIdsByEditId.clear();
        this.batchCleanup = null;
        this._cursorColorOverride = '';
        this.updateCursorStyle();
      };
      updateOverlayBounds();
      requestAnimationFrame(positionBatchBar);
      overlay.addEventListener('mousedown', down, true);
      document.addEventListener('mousemove', move, true);
      document.addEventListener('mouseup', up, true);
      document.addEventListener('keydown', key, true);
      window.addEventListener('resize', updateOverlayBounds, true);
      window.addEventListener('resize', positionBatchBar, true);
      overlay.addEventListener('click', (event) => {
        if (suppressNextClick) {
          suppressNextClick = false;
          return;
        }
        selectByPoint(event.clientX, event.clientY, true);
      }, true);
      cancel.addEventListener('click', () => this.exitBatchDeleteMode());
      del.addEventListener('click', () => {
        if (!this.getBatchDeleteSelectionCount()) {
          this.showToast(this.t('noSelection'));
          return;
        }
        this.showBatchDeleteConfirmDialog(() => {
          this.executeBatchDelete();
          this.exitBatchDeleteMode();
        });
      });
      this.batchCleanup = cleanup;
    }

    exitBatchDeleteMode() {
      if (this.batchCleanup) {
        const cleanup = this.batchCleanup;
        cleanup();
        return;
      }
      this.selectedHighlightIds.clear();
      this.selectedEditFragmentIds.clear();
      this._batchContainedHighlightIdsByEditId.clear();
      this._cursorColorOverride = '';
      this.updateCursorStyle();
    }

    executeBatchDelete() {
      const selection = this.collectBatchDeleteSelection();
      const editIds = Array.from(selection.editFragmentIds);
      const containedHighlightIds = new Set();
      editIds.forEach(id => {
        this.getRemovableHighlightIdsForEditFragmentId(id).forEach(highlightId => containedHighlightIds.add(highlightId));
      });
      containedHighlightIds.forEach(id => this.removeHighlightById(id));
      editIds.forEach(id => this.removeEditFragmentById(id));
      Array.from(selection.highlightIds).forEach(id => {
        if (containedHighlightIds.has(id)) return;
        const elements = this.getGroupElements(id);
        if (!elements.length) {
          this.removeHighlightById(id);
          return;
        }
        if (elements.some(el => !el.closest(EDIT_FRAGMENT_SELECTOR))) this.removeHighlightById(id);
        else {
          this.removeHighlightById(id);
        }
      });
      this.updatePermanentToolbarIndicator();
      this.requestSave(true);
    }

    showBatchDeleteConfirmDialog(onConfirm) {
      this.darkModeEnabled = this.detectPageTheme();
      const existing = document.getElementById('dev1-snapshot-highlighter-batch-confirm-dialog');
      if (existing) existing.remove();
      const count = this.getBatchDeleteSelectionCount();
      const dialog = document.createElement('div');
      dialog.id = 'dev1-snapshot-highlighter-batch-confirm-dialog';
      dialog.dataset.dev1SnapshotHighlighterUi = 'true';
      dialog.classList.toggle('dark-theme', !!this.darkModeEnabled);
      dialog.classList.toggle('light-theme', !this.darkModeEnabled);
      const message = document.createElement('div');
      message.className = 'dev1-batch-confirm-message';
      message.textContent = this.t('confirmDeleteItems').replace('{count}', String(count));
      const row = document.createElement('div');
      row.className = 'dev1-batch-confirm-actions';
      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'danger';
      confirm.textContent = this.t('confirm');
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = this.t('cancel');
      row.appendChild(confirm);
      row.appendChild(cancel);
      dialog.appendChild(message);
      dialog.appendChild(row);
      document.body.appendChild(dialog);
      const positionDialog = () => {
        const bar = document.getElementById('dev1-snapshot-highlighter-batch-bar');
        const rect = bar ? bar.getBoundingClientRect() : null;
        const dialogRect = dialog.getBoundingClientRect();
        const margin = 12;
        if (!rect) {
          dialog.style.left = '50%';
          dialog.style.bottom = '150px';
          dialog.style.top = 'auto';
          dialog.style.transform = 'translateX(-50%)';
          return;
        }
        const centerX = rect.left + rect.width / 2;
        const left = Math.max(margin, Math.min(window.innerWidth - dialogRect.width - margin, centerX - dialogRect.width / 2));
        const above = rect.top > window.innerHeight / 2;
        let top = above ? rect.top - dialogRect.height - 12 : rect.bottom + 12;
        if (top < margin) top = rect.bottom + 12;
        if (top + dialogRect.height > window.innerHeight - margin) top = rect.top - dialogRect.height - 12;
        dialog.style.left = `${left}px`;
        dialog.style.top = `${Math.max(margin, Math.min(window.innerHeight - dialogRect.height - margin, top))}px`;
        dialog.style.bottom = 'auto';
        dialog.style.transform = 'none';
      };
      const close = () => {
        document.removeEventListener('keydown', onKey, true);
        document.removeEventListener('mousedown', onOutside, true);
        window.removeEventListener('resize', positionDialog, true);
        if (dialog.parentNode) dialog.remove();
      };
      dialog.__dev1Close = close;
      const onKey = (event) => {
        if (event.key === 'Escape') close();
      };
      const onOutside = (event) => {
        if (!dialog.contains(event.target)) close();
      };
      confirm.addEventListener('click', (event) => {
        event.stopPropagation();
        close();
        if (typeof onConfirm === 'function') onConfirm();
      });
      cancel.addEventListener('click', (event) => {
        event.stopPropagation();
        close();
      });
      requestAnimationFrame(positionDialog);
      window.addEventListener('resize', positionDialog, true);
      document.addEventListener('keydown', onKey, true);
      setTimeout(() => document.addEventListener('mousedown', onOutside, true), 0);
    }

    updateSelectionByStroke(points) {
      if (!Array.isArray(points) || !points.length) return;
      const radius = 6;
      this.queryAllDeep(EDIT_FRAGMENT_SELECTOR).forEach(el => {
        if (this.isUiElement(el)) return;
        const rect = el.getBoundingClientRect();
        const pageRect = { left: rect.left + window.scrollX, right: rect.right + window.scrollX, top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
        const hit = points.some(p => p.x >= pageRect.left - radius && p.x <= pageRect.right + radius && p.y >= pageRect.top - radius && p.y <= pageRect.bottom + radius);
        if (hit) this.selectEditFragment(el.getAttribute('data-edit-fragment-id'), true);
      });
      this.getAllHighlightElements().forEach(el => {
        if (el.closest(EDIT_FRAGMENT_SELECTOR)) return;
        const rect = el.getBoundingClientRect();
        const pageRect = { left: rect.left + window.scrollX, right: rect.right + window.scrollX, top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
        const hit = points.some(p => p.x >= pageRect.left - radius && p.x <= pageRect.right + radius && p.y >= pageRect.top - radius && p.y <= pageRect.bottom + radius);
        if (hit) this.selectHighlightGroup(el.getAttribute('data-highlight-id'), true);
      });
    }

    selectHighlightGroup(id, selected) {
      if (!id) return;
      const elements = this.getGroupElements(id);
      elements.forEach(el => el.classList.toggle('batch-selected', selected));
      if (selected) this.selectedHighlightIds.add(id);
      else this.selectedHighlightIds.delete(id);
    }

    toggleHighlightGroup(id) {
      if (!id) return;
      this.selectHighlightGroup(id, !this.selectedHighlightIds.has(id));
    }

    selectEditFragment(id, selected) {
      if (!id) return;
      const elements = this.getEditFragmentElements(id);
      elements.forEach(el => {
        el.classList.toggle('batch-selected', selected);
        el.classList.toggle('batch-selected-edit', selected);
      });
      if (selected) {
        this.selectedEditFragmentIds.add(id);
        this._batchContainedHighlightIdsByEditId.set(id, this.getRemovableHighlightIdsForEditFragmentId(id));
      } else {
        this.selectedEditFragmentIds.delete(id);
        this._batchContainedHighlightIdsByEditId.delete(id);
      }
    }

    toggleEditFragment(id) {
      if (!id) return;
      this.selectEditFragment(id, !this.selectedEditFragmentIds.has(id));
    }

    highlightSelectedText() {
      if (!this.visible || this.isPdfLikePage()) return;
      if (this.currentTool === 'presentation-pen') return;
      if (this.currentTool === 'md-edit-disable-highlight') return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
      if (this.isSelectionInsideUi(selection) || this.isSelectionInHighlight(selection)) return;
      if (!this.isTextOnlySelection(selection)) return;
      if (this.isEditTool(this.currentTool)) {
        const tool = this.findTool(this.currentTool);
        if (tool) this.applyMdEditTool(tool);
        return;
      }
      const text = selection.toString();
      this.createHighlight(selection, text);
      setTimeout(() => {
        try { selection.removeAllRanges(); } catch (_) { }
      }, 50);
    }

    isSelectionInsideUi(selection) {
      const nodes = [];
      try {
        if (selection.anchorNode) nodes.push(selection.anchorNode);
        if (selection.focusNode) nodes.push(selection.focusNode);
        if (selection.rangeCount) nodes.push(selection.getRangeAt(0).commonAncestorContainer);
      } catch (_) { }
      return nodes.some(node => {
        const el = elementFromNode(node);
        return !!(el && el.closest && el.closest(UI_SELECTOR));
      });
    }

    isSelectionInHighlight(selection) {
      const nodes = [];
      try {
        if (selection.anchorNode) nodes.push(selection.anchorNode);
        if (selection.focusNode) nodes.push(selection.focusNode);
        if (selection.rangeCount) nodes.push(selection.getRangeAt(0).commonAncestorContainer);
      } catch (_) { }
      return nodes.some(node => {
        const el = elementFromNode(node);
        return !!(el && el.closest && el.closest(HIGHLIGHT_ANY_SELECTOR));
      });
    }

    isTextOnlySelection(selection) {
      try {
        const range = selection.getRangeAt(0);
        const fragment = range.cloneContents();
        return !fragment.querySelector || !fragment.querySelector('img,video,audio,canvas,svg,iframe,input,textarea,select,button');
      } catch (_) {
        return true;
      }
    }

    enterMdEditMode() {
      if (this._mdEditModeActive) return;
      this._mdEditModeActive = true;
      this._mdMode = 'edit';
      this._mdOriginalBodyEditable = document.body ? document.body.contentEditable : 'inherit';
      this._mdOriginalBodyCursor = document.body ? (document.body.style.cursor || '') : '';
      if (!this.isEditTool(this.currentTool)) {
        this.currentTool = 'md-edit-disable-highlight';
        this.currentToolName = this.getToolNameForId(this.currentTool);
      }
      if (document.body) {
        document.body.contentEditable = 'true';
        document.body.dataset.dev1SnapshotMdEditing = 'true';
        document.body.classList.remove('highlighter-cursor');
      }
      this._suppressCursor('md-edit');
      this._stopCursorAnimation();
      try {
        const dynamicCursor = document.getElementById('dynamic-cursor-style');
        if (dynamicCursor) dynamicCursor.remove();
      } catch (_) { }
      this.createMdEditModeChrome();
      this.applyMdEditCursorStyle();
      this.protectHighlighterUiFromMdEditing();
      this._mdEscapeHandler = (event) => {
        if (event.key !== 'Escape') return;
        if (this._currentMdSourceElement) {
          event.preventDefault();
          event.stopPropagation();
          this.finishMdSourceEdit(this._currentMdSourceElement);
          return;
        }
        if (this._mdEditModeActive) {
          event.preventDefault();
          event.stopPropagation();
          this.exitMdEditMode({ keepTool: false });
        }
      };
      this._mdClickHandler = (event) => {
        const target = event.target && event.target.closest && event.target.closest('.md-rendered-content[data-dev1-snapshot-highlighter-edit="true"][data-md-source]');
        if (event.target && event.target.closest && event.target.closest('.md-editing-source, .md-image-source-overlay')) return;
        if (this._currentMdSourceElement && (!target || target !== this._currentMdSourceElement)) {
          this.finishMdSourceEdit(this._currentMdSourceElement);
        }
        if (!target || this.isUiElement(target)) return;
        event.preventDefault();
        event.stopPropagation();
        this.showMdSource(target);
      };
      this._mdInputHandler = () => {
        clearTimeout(this._mdRenderTimer);
        this._mdRenderTimer = setTimeout(() => {
          this.captureDirectMdEditFromSelection();
          this.renderSimpleMarkdownNearSelection();
        }, 450);
      };
      document.addEventListener('keydown', this._mdEscapeHandler, true);
      document.addEventListener('click', this._mdClickHandler, true);
      document.addEventListener('input', this._mdInputHandler, true);
      this.updatePermanentToolbarIndicator();
    }

    exitMdEditMode(options = {}) {
      if (!this._mdEditModeActive) return;
      this._mdEditModeActive = false;
      clearTimeout(this._mdRenderTimer);
      this._mdRenderTimer = null;
      if (this._currentMdSourceElement) this.finishMdSourceEdit(this._currentMdSourceElement);
      if (this._mdEscapeHandler) document.removeEventListener('keydown', this._mdEscapeHandler, true);
      if (this._mdClickHandler) document.removeEventListener('click', this._mdClickHandler, true);
      if (this._mdInputHandler) document.removeEventListener('input', this._mdInputHandler, true);
      this._mdEscapeHandler = null;
      this._mdClickHandler = null;
      this._mdInputHandler = null;
      ['md-edit-mode-overlay', 'md-edit-mode-hint', 'md-edit-help-panel', 'dev1-md-edit-cursor-style'].forEach(id => {
        const node = document.getElementById(id);
        if (node) node.remove();
      });
      if (document.body) {
        if (this._mdOriginalBodyEditable != null) document.body.contentEditable = this._mdOriginalBodyEditable || 'false';
        else document.body.contentEditable = 'false';
        document.body.style.cursor = this._mdOriginalBodyCursor || '';
        delete document.body.dataset.dev1SnapshotMdEditing;
      }
      this._cursorSuppressors.delete('md-edit');
      if (document.body && this._cursorSuppressors.size === 0) document.body.classList.remove('suppress-cursor');
      document.querySelectorAll(UI_SELECTOR).forEach(el => {
        if (el && el.dataset && el.dataset.dev1PreviousContenteditable != null) {
          const value = el.dataset.dev1PreviousContenteditable;
          if (value) el.setAttribute('contenteditable', value);
          else el.removeAttribute('contenteditable');
          delete el.dataset.dev1PreviousContenteditable;
        }
      });
      if (!options.keepTool && this.isEditTool(this.currentTool)) {
        this.currentTool = 'highlight';
        this.currentToolName = this.t('classicHighlight');
        this._mdMode = 'visual';
      }
      this.updatePermanentToolbarIndicator();
      this.updateCursorStyle();
      if (!options.silent) this.requestSave(true);
    }

    createMdEditModeChrome() {
      let overlay = document.getElementById('md-edit-mode-overlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'md-edit-mode-overlay';
        overlay.dataset.dev1SnapshotHighlighterUi = 'true';
        document.body.appendChild(overlay);
      }
      let hint = document.getElementById('md-edit-mode-hint');
      if (!hint) {
        hint = document.createElement('div');
        hint.id = 'md-edit-mode-hint';
        hint.dataset.dev1SnapshotHighlighterUi = 'true';
        hint.contentEditable = 'false';
        const title = document.createElement('span');
        title.textContent = this.t('mdEditModeTitle');
        const help = document.createElement('button');
        help.type = 'button';
        help.className = 'md-edit-help-btn';
        help.textContent = '?';
        help.title = this.t('mdEditHelpTitle');
        help.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.showMdEditHelpPanel();
        });
        const exit = document.createElement('button');
        exit.type = 'button';
        exit.className = 'md-edit-exit-btn';
        exit.textContent = this.t('mdEditExit');
        exit.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.exitMdEditMode({ keepTool: false });
        });
        hint.appendChild(title);
        hint.appendChild(help);
        hint.appendChild(exit);
        document.body.appendChild(hint);
      }
    }

    showMdEditHelpPanel() {
      const existing = document.getElementById('md-edit-help-panel');
      if (existing) {
        existing.remove();
        return;
      }
      const panel = document.createElement('div');
      panel.id = 'md-edit-help-panel';
      panel.dataset.dev1SnapshotHighlighterUi = 'true';
      panel.contentEditable = 'false';
      const title = document.createElement('div');
      title.className = 'md-edit-help-title';
      title.textContent = this.t('mdEditHelpTitle');
      const list = document.createElement('ul');
      [this.t('mdEditHelpInput'), this.t('mdEditHelpClick'), this.t('mdEditHelpUndo')].forEach(text => {
        const item = document.createElement('li');
        item.textContent = text;
        list.appendChild(item);
      });
      const close = document.createElement('button');
      close.type = 'button';
      close.textContent = this.t('gotIt');
      close.addEventListener('click', () => panel.remove());
      panel.appendChild(title);
      panel.appendChild(list);
      panel.appendChild(close);
      document.body.appendChild(panel);
    }

    applyMdEditCursorStyle() {
      let style = document.getElementById('dev1-md-edit-cursor-style');
      if (!style) {
        style = document.createElement('style');
        style.id = 'dev1-md-edit-cursor-style';
        document.head.appendChild(style);
      }
      style.textContent = `
body[data-dev1-snapshot-md-editing="true"],
body[data-dev1-snapshot-md-editing="true"] * {
  cursor: text !important;
}
body[data-dev1-snapshot-md-editing="true"] a,
body[data-dev1-snapshot-md-editing="true"] button,
body[data-dev1-snapshot-md-editing="true"] input,
body[data-dev1-snapshot-md-editing="true"] select,
body[data-dev1-snapshot-md-editing="true"] textarea,
body[data-dev1-snapshot-md-editing="true"] summary,
body[data-dev1-snapshot-md-editing="true"] [role="button"] {
  cursor: pointer !important;
}
body[data-dev1-snapshot-md-editing="true"] input[type="text"],
body[data-dev1-snapshot-md-editing="true"] input[type="search"],
body[data-dev1-snapshot-md-editing="true"] input[type="url"],
body[data-dev1-snapshot-md-editing="true"] input[type="email"],
body[data-dev1-snapshot-md-editing="true"] textarea,
body[data-dev1-snapshot-md-editing="true"] [contenteditable="true"] {
  cursor: text !important;
}
body[data-dev1-snapshot-md-editing="true"] [data-dev1-snapshot-highlighter-ui="true"],
body[data-dev1-snapshot-md-editing="true"] [data-dev1-snapshot-highlighter-ui="true"] * {
  cursor: default !important;
}
body[data-dev1-snapshot-md-editing="true"] [data-dev1-snapshot-highlighter-ui="true"] button {
  cursor: pointer !important;
}
`;
    }

    protectHighlighterUiFromMdEditing() {
      document.querySelectorAll(UI_SELECTOR).forEach(el => {
        if (!el || !el.dataset) return;
        if (el.dataset.dev1PreviousContenteditable == null) {
          el.dataset.dev1PreviousContenteditable = el.getAttribute('contenteditable') || '';
        }
        el.setAttribute('contenteditable', 'false');
      });
    }

    applyMdEditTool(tool) {
      if (!tool || !this.isEditTool(tool.id) || tool.id === 'md-edit-disable-highlight') return false;
      this.enterMdEditMode();
      const selection = window.getSelection();
      const allowEmptySelection = tool.id === 'md-edit-hr';
      if (!selection || !selection.rangeCount || (!allowEmptySelection && (selection.isCollapsed || !selection.toString().trim()))) {
        this.showToast(this.t('mdEditNoSelection'));
        return false;
      }
      if (this.isSelectionInsideUi(selection)) return false;
      const range = selection.getRangeAt(0).cloneRange();
      const text = allowEmptySelection ? '' : selection.toString();
      const block = this.findNearestEditableBlock(range.commonAncestorContainer);
      if (!block) return false;
      const snapshot = this.captureEditBlockBefore(block);
      const fragmentId = `edit-fragment-${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const rendered = this.buildMdRenderedElement(tool, text, fragmentId);
      let inserted = null;
      try {
        selection.removeAllRanges();
        selection.addRange(range);
        const html = rendered.outerHTML;
        const canInsertHtml = typeof document.execCommand === 'function'
          && (!document.queryCommandSupported || document.queryCommandSupported('insertHTML'));
        if (!canInsertHtml || !document.execCommand('insertHTML', false, html)) {
          throw new Error('insertHTML unsupported');
        }
        inserted = this.getEditFragmentElements(fragmentId)[0] || null;
        if (!inserted) throw new Error('insertHTML inserted no edit fragment');
        selection.removeAllRanges();
      } catch (_) {
        try {
          range.deleteContents();
          range.insertNode(rendered);
          inserted = rendered;
          selection.removeAllRanges();
        } catch (error) {
          return false;
        }
      }
      const afterBlock = this.findNearestEditableBlock(inserted || rendered) || block;
      const fragment = this.buildEditFragmentRecord(fragmentId, snapshot, afterBlock, tool, text);
      this.upsertEditFragment(fragment);
      this.requestSave(true);
      this.showToast(this.t('mdEditApplied'));
      return true;
    }

    findNearestEditableBlock(node) {
      const el = elementFromNode(node);
      if (!el) return null;
      if (this.isUiElement(el)) return null;
      const blockSelector = 'p,li,blockquote,pre,td,th,h1,h2,h3,h4,h5,h6,article,section,main,div';
      let block = el.closest && el.closest(blockSelector);
      if (!block || block === document.body || block === document.documentElement) {
        block = el.parentElement && el.parentElement !== document.body ? el.parentElement : el;
      }
      return block && !this.isUiElement(block) ? block : null;
    }

    captureEditBlockBefore(block) {
      const xpath = this.getXPathForElement(block);
      const cached = this._editOriginalByXPath.get(xpath);
      if (cached) {
        return { xpath, beforeHtml: cached.beforeHtml, beforeText: cached.beforeText };
      }
      const beforeHtml = this.sanitizeEditFragmentHtml(block.outerHTML || '');
      const beforeText = block.innerText || block.textContent || '';
      this._editOriginalByXPath.set(xpath, { beforeHtml, beforeText });
      return { xpath, beforeHtml, beforeText };
    }

    buildEditFragmentRecord(id, snapshot, block, tool, selectedText = '') {
      const afterHtml = this.sanitizeEditFragmentHtml(block.outerHTML || '');
      const afterText = block.innerText || block.textContent || '';
      const afterMarkdown = this.editFragmentHtmlToMarkdownHtml(afterHtml, tool && tool.id, selectedText);
      return {
        id,
        type: 'edit-fragment',
        targetXPath: snapshot.xpath,
        parentXPath: snapshot.xpath,
        anchor: {
          xpath: snapshot.xpath,
          textFingerprint: safeString(snapshot.beforeText).slice(0, 200),
          surroundingText: safeString(afterText).slice(0, 240)
        },
        beforeHtml: snapshot.beforeHtml,
        afterHtml,
        afterMarkdown,
        beforeText: snapshot.beforeText,
        afterText,
        toolId: tool.id,
        color: this.currentColor,
        textColorOverride: this.currentColorVariant === 'white' || this.currentColorVariant === 'black' || this.currentColorVariant === 'auto' ? this.currentColorVariant : 'auto',
        selectedText,
        pageUrl: this.currentUrl,
        pageTitle: document.title || '',
        createdAt: now(),
        updatedAt: now()
      };
    }

    upsertEditFragment(fragment) {
      if (!fragment || !fragment.id) return;
      const xpath = this.getEditFragmentXPath(fragment);
      const existingIndex = this.editFragments.findIndex(item => this.getEditFragmentXPath(item) === xpath);
      if (existingIndex >= 0) {
        const existing = this.editFragments[existingIndex];
        const stableId = existing.id || fragment.id;
        const normalizedAfterHtml = safeString(fragment.afterHtml).replace(
          new RegExp(`data-edit-fragment-id=(["'])${this.escapeRegExp(fragment.id)}\\1`, 'g'),
          `data-edit-fragment-id="${stableId}"`
        );
        this.editFragments[existingIndex] = {
          ...existing,
          ...fragment,
          id: stableId,
          afterHtml: normalizedAfterHtml || fragment.afterHtml,
          beforeHtml: existing.beforeHtml || fragment.beforeHtml,
          beforeText: existing.beforeText || fragment.beforeText,
          createdAt: existing.createdAt || fragment.createdAt,
          updatedAt: now()
        };
        this.syncEditFragmentDomIds(fragment.id, this.editFragments[existingIndex].id);
        return;
      }
      this.editFragments.push(fragment);
    }

    syncEditFragmentDomIds(oldId, nextId) {
      if (!oldId || !nextId || oldId === nextId) return;
      document.querySelectorAll(`[data-dev1-snapshot-highlighter-edit="true"][data-edit-fragment-id="${CSS.escape(oldId)}"]`).forEach(el => {
        el.setAttribute('data-edit-fragment-id', nextId);
      });
    }

    updateEditFragmentAfterElement(element) {
      const id = element && element.getAttribute && element.getAttribute('data-edit-fragment-id');
      if (!id) return;
      const fragment = this.editFragments.find(item => this.getEditFragmentId(item) === id);
      if (!fragment) return;
      const block = this.locateEditTarget(fragment) || this.findNearestEditableBlock(element);
      if (!block) return;
      fragment.afterHtml = this.sanitizeEditFragmentHtml(block.outerHTML || '');
      fragment.afterText = block.innerText || block.textContent || '';
      fragment.afterMarkdown = this.editFragmentHtmlToMarkdownHtml(fragment.afterHtml, fragment.toolId || '', fragment.selectedText || '');
      fragment.updatedAt = now();
      this.requestSave();
    }

    buildMdRenderedElement(tool, text, fragmentId) {
      const source = this.getMdSourceForTool(tool.id, text);
      const span = document.createElement('span');
      span.className = 'md-rendered-content';
      span.dataset.dev1SnapshotHighlighterEdit = 'true';
      span.dataset.editFragmentId = fragmentId;
      span.dataset.mdSource = source;
      span.dataset.mdTool = tool.id;
      span.dataset.mdColor = this.currentColor;
      span.dataset.mdColorVariant = this.currentColorVariant || '';
      span.contentEditable = 'false';
      span.innerHTML = this.renderMdToolHtml(tool.id, text, source, this.currentColor, this.currentColorVariant);
      return span;
    }

    getMdSourceForTool(toolId, text) {
      const value = safeString(text);
      switch (toolId) {
        case 'md-edit-bold': return `**${value}**`;
        case 'md-edit-italic': return `*${value}*`;
        case 'md-edit-bold-italic': return `***${value}***`;
        case 'md-edit-strikethrough': return `~~${value}~~`;
        case 'md-edit-mark': return `==${value}==`;
        case 'md-edit-code-inline': return `\`${value}\``;
        case 'md-edit-sup': return `^${value}^`;
        case 'md-edit-sub': return `~${value}~`;
        case 'md-edit-h1': return `# ${value}`;
        case 'md-edit-h2': return `## ${value}`;
        case 'md-edit-h3': return `### ${value}`;
        case 'md-edit-ul': return `- ${value}`;
        case 'md-edit-ol': return `1. ${value}`;
        case 'md-edit-task': return `- [ ] ${value}`;
        case 'md-edit-quote': return `> ${value}`;
        case 'md-edit-code': return `\`\`\`\n${value}\n\`\`\``;
        case 'md-edit-hr': return '---';
        case 'md-edit-link': return `[${value}](url)`;
        case 'md-edit-image': {
          const looksLikeUrl = /^(https?:\/\/|data:image\/|\/\/)|\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(?:[?#]|$)/i.test(value);
          if (looksLikeUrl) {
            const url = /^(https?:\/\/|data:image\/|\/\/)/i.test(value) ? value : `https://${value}`;
            return `![image](${url})`;
          }
          return `![${value || 'image'}](url)`;
        }
        case 'md-edit-table': return value.includes('|') ? value : `| 列1 | 列2 |\n| --- | --- |\n| ${value || 'A'} | B |`;
        default: return value;
      }
    }

    renderMdToolHtml(toolId, text, source = '', colorOverride = '', variantOverride = '') {
      const escaped = this.escapeHtml(text);
      const color = colorOverride || this.currentColor || '#1976d2';
      const renderColor = this.getRenderableColor(color);
      const colorVariant = variantOverride || this.currentColorVariant || '';
      const resolvedVariant = this.resolveColorVariant(color, colorVariant);
      const variant = resolvedVariant === 'white' ? '#ffffff' : '#0f172a';
      const isRainbow = this.isRainbowColor(color);
      const rainbow = isRainbow ? this.buildRainbowGradient(color, { textContent: text || source || '' }) : '';
      const textStyle = isRainbow
        ? `background:${rainbow};-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;`
        : `color:${variant};`;
      const softBg = isRainbow ? this.buildRainbowGradient(color, { textContent: text || source || '' }, 0.28) : rgbaFromHex(renderColor, 0.18);
      switch (toolId) {
        case 'md-edit-bold': return `<strong style="${textStyle}">${escaped}</strong>`;
        case 'md-edit-italic': return `<em style="${textStyle}">${escaped}</em>`;
        case 'md-edit-bold-italic': return `<strong style="${textStyle}"><em>${escaped}</em></strong>`;
        case 'md-edit-strikethrough': return `<del style="${textStyle}text-decoration-color:${renderColor};text-decoration-thickness:2px;">${escaped}</del>`;
        case 'md-edit-mark': return `<mark style="background:${softBg};color:${resolvedVariant === 'white' ? '#ffffff' : '#0f172a'};border-radius:3px;padding:1px 3px;">${escaped}</mark>`;
        case 'md-edit-code-inline': return `<code style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;background:${this.darkModeEnabled ? 'rgba(45,45,45,.92)' : 'rgba(244,244,244,.96)'};border:1px solid ${rgbaFromHex(renderColor, 0.45)};border-radius:4px;padding:1px 4px;${textStyle}">${escaped}</code>`;
        case 'md-edit-sup': return `<sup style="${textStyle}">${escaped}</sup>`;
        case 'md-edit-sub': return `<sub style="${textStyle}">${escaped}</sub>`;
        case 'md-edit-h1': return `<span style="${textStyle}font-size:2em;font-weight:700;">${escaped}</span>`;
        case 'md-edit-h2': return `<span style="${textStyle}font-size:1.5em;font-weight:700;">${escaped}</span>`;
        case 'md-edit-h3': return `<span style="${textStyle}font-size:1.17em;font-weight:700;">${escaped}</span>`;
        case 'md-edit-ul': return `<span style="${textStyle}">• ${escaped}</span>`;
        case 'md-edit-ol': return `<span style="${textStyle}">1. ${escaped}</span>`;
        case 'md-edit-task': return `<span style="${textStyle}">☐ ${escaped}</span>`;
        case 'md-edit-quote': return `<span style="border-left:3px solid ${renderColor};padding-left:8px;${textStyle}">${escaped}</span>`;
        case 'md-edit-code': return `<pre style="display:inline-block;margin:2px 0;padding:6px 8px;border-radius:5px;background:${this.darkModeEnabled ? '#2d2d2d' : '#f4f4f4'};"><code style="${textStyle}">${escaped}</code></pre>`;
        case 'md-edit-hr': return `<span style="display:inline-block;width:8em;border-bottom:2px solid ${renderColor};vertical-align:middle;"></span>`;
        case 'md-edit-link': return `<a href="javascript:void(0)" style="${textStyle}text-decoration:underline;text-underline-offset:2px;cursor:text;">${escaped}</a>`;
        case 'md-edit-image': return this.renderMdImageHtml(source || text, renderColor, escaped);
        case 'md-edit-table': return this.renderMdTableHtml(source || text, renderColor, textStyle);
        default: return `<span style="${textStyle}">${escaped}</span>`;
      }
    }

    renderMdImageHtml(source, renderColor, fallbackText) {
      const raw = safeString(source);
      const match = raw.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      const alt = this.escapeHtml(match ? match[1] : (fallbackText || 'image'));
      const url = safeString(match ? match[2] : '').trim();
      if (/^(https?:\/\/|data:image\/|\/\/)/i.test(url)) {
        const safeUrl = this.escapeHtml(url);
        return `<img class="md-rendered md-image" src="${safeUrl}" alt="${alt}" style="max-width:100%;max-height:300px;border:2px solid ${renderColor};border-radius:4px;vertical-align:middle;">`;
      }
      return `<span class="md-rendered md-image" style="color:${renderColor};background:transparent;padding:4px 8px;border:1px dashed ${renderColor};border-radius:4px;display:inline-block;">${alt || 'image'}</span>`;
    }

    renderMdTableHtml(source, renderColor, textStyle) {
      const lines = safeString(source).split(/\r?\n/).map(line => line.trim()).filter(line => line.includes('|'));
      if (lines.length < 2) return `<span style="border:1px dashed ${renderColor};padding:2px 6px;border-radius:4px;${textStyle}">${this.escapeHtml(source)}</span>`;
      const rows = lines.filter(line => !/^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line)).map(line => {
        const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => this.escapeHtml(cell.trim()));
        return cells;
      });
      if (!rows.length) return '';
      const head = rows.shift();
      const th = head.map(cell => `<th style="border:1px solid ${renderColor};padding:4px 8px;${textStyle}">${cell}</th>`).join('');
      const body = rows.map(row => `<tr>${row.map(cell => `<td style="border:1px solid ${renderColor};padding:4px 8px;${textStyle}">${cell}</td>`).join('')}</tr>`).join('');
      return `<table class="md-rendered md-table" style="display:inline-table;border-collapse:collapse;margin:2px 0;border:1px solid ${renderColor};"><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`;
    }

    showMdSource(element) {
      if (!element || element.classList.contains('md-editing-source')) return;
      const source = element.getAttribute('data-md-source') || element.textContent || '';
      element.dataset.mdRenderedHtml = element.innerHTML;
      const image = element.querySelector('img');
      const isImage = image && /!\[[^\]]*\]\([^)]+\)/.test(source);
      const isTable = element.querySelector('table') || source.split(/\r?\n/).some(line => line.includes('|'));
      if (isImage) {
        const imageHtml = image.outerHTML;
        element.innerHTML = '';
        const wrap = document.createElement('span');
        wrap.className = 'md-image-edit-container';
        wrap.style.cssText = 'position:relative;display:inline-block;max-width:100%;';
        const textarea = document.createElement('textarea');
        textarea.className = 'md-image-source-overlay';
        textarea.value = source;
        textarea.style.cssText = 'position:absolute;top:4px;left:4px;z-index:2;min-width:220px;max-width:calc(100% - 8px);min-height:34px;resize:none;overflow:hidden;padding:5px 7px;border:1px solid #c4b5fd;border-radius:5px;background:rgba(255,255,255,.96);color:#6d28d9;font:12px/1.4 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;box-shadow:0 4px 14px rgba(15,23,42,.18);';
        const imageShell = document.createElement('span');
        imageShell.innerHTML = imageHtml;
        wrap.appendChild(textarea);
        wrap.appendChild(imageShell);
        element.appendChild(wrap);
        element.contentEditable = 'false';
        element.classList.add('md-editing-source', 'md-editing-image');
        this._currentMdSourceElement = element;
        const resize = () => {
          textarea.style.height = 'auto';
          textarea.style.height = `${Math.max(34, textarea.scrollHeight)}px`;
        };
        textarea.addEventListener('input', resize);
        const finish = () => this.finishMdSourceEdit(element);
        element._dev1MdSourceBlur = finish;
        textarea.addEventListener('blur', finish, { once: true });
        setTimeout(() => {
          resize();
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }, 0);
        return;
      }
      element.textContent = source;
      element.contentEditable = 'true';
      element.classList.add('md-editing-source');
      if (isTable) element.classList.add('md-editing-table');
      this._currentMdSourceElement = element;
      const finish = () => this.finishMdSourceEdit(element);
      element._dev1MdSourceBlur = finish;
      element.addEventListener('blur', finish, { once: true });
      setTimeout(() => {
        try {
          const range = document.createRange();
          range.selectNodeContents(element);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
          element.focus();
        } catch (_) { }
      }, 0);
    }

    finishMdSourceEdit(element) {
      if (!element || !element.classList || !element.classList.contains('md-editing-source')) return;
      const sourceInput = element.querySelector && element.querySelector('.md-image-source-overlay');
      const source = sourceInput ? (sourceInput.value || sourceInput.textContent || '') : (element.textContent || '');
      const toolId = element.getAttribute('data-md-tool') || this.currentTool || 'md-edit-mark';
      element.setAttribute('data-md-source', source);
      element.contentEditable = 'false';
      element.classList.remove('md-editing-source', 'md-editing-image', 'md-editing-table');
      const text = this.extractMdPlainText(source, toolId);
      const color = element.getAttribute('data-md-color') || this.currentColor || '#1976d2';
      const variant = element.getAttribute('data-md-color-variant') || this.currentColorVariant || '';
      element.innerHTML = this.renderMdToolHtml(toolId, text, source, color, variant);
      if (this._currentMdSourceElement === element) this._currentMdSourceElement = null;
      this.updateEditFragmentAfterElement(element);
    }

    extractMdPlainText(source, toolId = '') {
      const raw = safeString(source);
      switch (toolId) {
        case 'md-edit-bold': return raw.replace(/^\*\*|\*\*$/g, '');
        case 'md-edit-italic': return raw.replace(/^\*|\*$/g, '');
        case 'md-edit-bold-italic': return raw.replace(/^\*\*\*|\*\*\*$/g, '');
        case 'md-edit-strikethrough': return raw.replace(/^~~|~~$/g, '');
        case 'md-edit-mark': return raw.replace(/^==|==$/g, '');
        case 'md-edit-code-inline': return raw.replace(/^`|`$/g, '');
        case 'md-edit-sup': return raw.replace(/^\^|\^$/g, '');
        case 'md-edit-sub': return raw.replace(/^~|~$/g, '');
        case 'md-edit-h1': return raw.replace(/^#\s+/, '');
        case 'md-edit-h2': return raw.replace(/^##\s+/, '');
        case 'md-edit-h3': return raw.replace(/^###\s+/, '');
        case 'md-edit-ul': return raw.replace(/^-\s+/, '');
        case 'md-edit-ol': return raw.replace(/^\d+\.\s+/, '');
        case 'md-edit-task': return raw.replace(/^-\s+\[[ x]\]\s+/i, '');
        case 'md-edit-quote': return raw.replace(/^>\s?/, '');
        case 'md-edit-code': return raw.replace(/^```\n?/, '').replace(/\n?```$/, '');
        default: return raw;
      }
    }

    captureDirectMdEditFromSelection() {
      if (!this._mdEditModeActive) return;
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const block = this.findNearestEditableBlock(selection.getRangeAt(0).commonAncestorContainer);
      if (!block || this.isUiElement(block)) return;
      const snapshot = this.captureEditBlockBefore(block);
      const id = `edit-fragment-${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      this.upsertEditFragment(this.buildEditFragmentRecord(id, snapshot, block, { id: 'md-edit-direct' }, ''));
      this.requestSave();
    }

    findMarkdownSyntaxMatch(text) {
      const value = safeString(text);
      if (!value) return null;
      const patterns = [
        { toolId: 'md-edit-image', regex: /!\[([^\]\n]*)\]\(([^)\n]+)\)/g, plainIndex: 0 },
        { toolId: 'md-edit-link', regex: /\[([^\]\n]+)\]\(([^)\n]+)\)/g, plainIndex: 0 },
        { toolId: 'md-edit-bold-italic', regex: /\*\*\*([^*\n]+)\*\*\*/g, plainIndex: 0 },
        { toolId: 'md-edit-bold', regex: /\*\*([^*\n]+)\*\*/g, plainIndex: 0 },
        { toolId: 'md-edit-italic', regex: /(^|[^*])\*([^*\n]+)\*(?!\*)/g, plainIndex: 1, prefixIndex: 0 },
        { toolId: 'md-edit-strikethrough', regex: /~~([^~\n]+)~~/g, plainIndex: 0 },
        { toolId: 'md-edit-mark', regex: /==([^=\n]+)==/g, plainIndex: 0 },
        { toolId: 'md-edit-code-inline', regex: /`([^`\n]+)`/g, plainIndex: 0 },
        { toolId: 'md-edit-sup', regex: /\^([^^\n]+)\^/g, plainIndex: 0 },
        { toolId: 'md-edit-sub', regex: /(^|[^~])~([^~\n]+)~(?!~)/g, plainIndex: 1, prefixIndex: 0 }
      ];
      let best = null;
      patterns.forEach(pattern => {
        pattern.regex.lastIndex = 0;
        const match = pattern.regex.exec(value);
        if (!match) return;
        const prefix = pattern.prefixIndex != null ? safeString(match[pattern.prefixIndex + 1]) : '';
        const start = match.index + prefix.length;
        const full = match[0].slice(prefix.length);
        const plain = match[(pattern.plainIndex || 0) + 1] || '';
        const candidate = {
          start,
          end: start + full.length,
          source: full,
          text: plain,
          toolId: pattern.toolId
        };
        if (!best || candidate.start < best.start || (candidate.start === best.start && candidate.source.length > best.source.length)) {
          best = candidate;
        }
      });
      if (best) return best;
      const line = value.trim();
      const lineOffset = value.indexOf(line);
      if (!line) return null;
      let match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        return {
          start: lineOffset,
          end: lineOffset + line.length,
          source: line,
          text: match[2],
          toolId: `md-edit-h${match[1].length}`
        };
      }
      match = line.match(/^>\s+(.+)$/);
      if (match) return { start: lineOffset, end: lineOffset + line.length, source: line, text: match[1], toolId: 'md-edit-quote' };
      match = line.match(/^-\s+\[[ x]\]\s+(.+)$/i);
      if (match) return { start: lineOffset, end: lineOffset + line.length, source: line, text: match[1], toolId: 'md-edit-task' };
      match = line.match(/^[-*+]\s+(.+)$/);
      if (match) return { start: lineOffset, end: lineOffset + line.length, source: line, text: match[1], toolId: 'md-edit-ul' };
      match = line.match(/^\d+\.\s+(.+)$/);
      if (match) return { start: lineOffset, end: lineOffset + line.length, source: line, text: match[1], toolId: 'md-edit-ol' };
      if (/^-{3,}$/.test(line)) return { start: lineOffset, end: lineOffset + line.length, source: line, text: '', toolId: 'md-edit-hr' };
      return null;
    }

    renderSimpleMarkdownNearSelection() {
      if (!this._mdEditModeActive) return;
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;
      const block = this.findNearestEditableBlock(selection.getRangeAt(0).commonAncestorContainer);
      if (!block || this.isUiElement(block) || block.querySelector('.md-editing-source')) return;
      const snapshot = this.captureEditBlockBefore(block);
      let changed = false;
      let lastToolId = 'md-edit-direct';
      let lastText = '';
      const processOne = () => {
        const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent || parent.closest(UI_SELECTOR) || parent.closest('.md-rendered-content')) return NodeFilter.FILTER_REJECT;
            return this.findMarkdownSyntaxMatch(node.nodeValue || '') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        });
        const node = walker.nextNode() ? walker.currentNode : null;
        if (!node || !node.parentNode) return false;
        const text = node.nodeValue || '';
        const match = this.findMarkdownSyntaxMatch(text);
        if (!match) return false;
        const id = `edit-fragment-${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const rendered = this.buildMdRenderedElement({ id: match.toolId }, match.text, id);
        rendered.setAttribute('data-md-source', match.source);
        const range = document.createRange();
        range.setStart(node, match.start);
        range.setEnd(node, match.end);
        try {
          selection.removeAllRanges();
          selection.addRange(range);
          const canInsertHtml = typeof document.execCommand === 'function'
            && (!document.queryCommandSupported || document.queryCommandSupported('insertHTML'));
          if (!canInsertHtml || !document.execCommand('insertHTML', false, rendered.outerHTML)) {
            throw new Error('insertHTML unsupported');
          }
        } catch (_) {
          try {
            range.deleteContents();
            range.insertNode(rendered);
          } catch (error) {
            return false;
          }
        }
        lastToolId = match.toolId;
        lastText = match.text;
        changed = true;
        return true;
      };
      let iterations = 0;
      while (processOne() && iterations < 80) iterations += 1;
      if (!changed) return;
      selection.removeAllRanges();
      this.upsertEditFragment(this.buildEditFragmentRecord(
        `edit-fragment-${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        snapshot,
        block,
        { id: lastToolId },
        lastText
      ));
      this.requestSave();
    }

    normalizeMarkdownHtmlColor(value, fallback = '#1976d2') {
      const raw = safeString(value).trim();
      if (this.isRainbowColor(raw)) return this.getRenderableColor(raw);
      if (this.isTransparentColor(raw)) return fallback;
      const normalized = normalizeCssColor(raw) || raw || fallback;
      const [r, g, b] = parseCssColor(normalized);
      const toHex = part => Math.max(0, Math.min(255, Math.round(part))).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    wrapMarkdownHtmlColor(text, color, type = 'font') {
      const safeColor = this.normalizeMarkdownHtmlColor(color);
      const wrapLine = (line) => {
        if (!line.trim()) return line;
        const escaped = this.escapeHtml(line);
        if (type === 'background') return `<mark style="background:${safeColor}">${escaped}</mark>`;
        return `<font color="${safeColor}">${escaped}</font>`;
      };
      return safeString(text).split('\n').map(wrapLine).join('\n');
    }

    exportMdRenderedElementToMarkdownHtml(element, fallbackTool = '') {
      if (!element || !element.getAttribute) return '';
      const toolId = element.getAttribute('data-md-tool') || fallbackTool || '';
      const source = element.getAttribute('data-md-source') || element.textContent || '';
      const color = element.getAttribute('data-md-color') || this.currentColor || '#1976d2';
      const text = this.extractMdPlainText(source, toolId) || element.textContent || source;
      const font = value => this.wrapMarkdownHtmlColor(value, color, 'font');
      const mark = value => this.wrapMarkdownHtmlColor(value, color, 'background');
      switch (toolId) {
        case 'md-edit-mark': return mark(text);
        case 'md-edit-bold': return `**${font(text)}**`;
        case 'md-edit-italic': return `*${font(text)}*`;
        case 'md-edit-bold-italic': return `***${font(text)}***`;
        case 'md-edit-strikethrough': return `~~${font(text)}~~`;
        case 'md-edit-code-inline': return `<code style="color:${this.normalizeMarkdownHtmlColor(color)}">${this.escapeHtml(text)}</code>`;
        case 'md-edit-sup': return `<sup style="color:${this.normalizeMarkdownHtmlColor(color)}">${this.escapeHtml(text)}</sup>`;
        case 'md-edit-sub': return `<sub style="color:${this.normalizeMarkdownHtmlColor(color)}">${this.escapeHtml(text)}</sub>`;
        case 'md-edit-h1': return `# ${font(text)}`;
        case 'md-edit-h2': return `## ${font(text)}`;
        case 'md-edit-h3': return `### ${font(text)}`;
        case 'md-edit-ul': return `- ${font(text)}`;
        case 'md-edit-ol': {
          const match = safeString(source).match(/^(\d+)\.\s+/);
          return `${match ? match[1] : '1'}. ${font(text)}`;
        }
        case 'md-edit-task': {
          const match = safeString(source).match(/^-\s+\[([ x])\]\s+/i);
          return `- [${match && /^x$/i.test(match[1]) ? 'x' : ' '}] ${font(text)}`;
        }
        case 'md-edit-quote': return `> ${font(text)}`;
        case 'md-edit-code': return `\`\`\`\n${text}\n\`\`\``;
        case 'md-edit-hr': return '---';
        case 'md-edit-link': {
          const match = safeString(source).match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          return match ? `[${font(match[1])}](${match[2]})` : font(text);
        }
        case 'md-edit-image':
        case 'md-edit-table':
          return safeString(source || text);
        default:
          return font(text || source);
      }
    }

    editFragmentHtmlToMarkdownHtml(html, fallbackTool = '', fallbackText = '') {
      const raw = safeString(html);
      if (!raw) return safeString(fallbackText);
      try {
        const temp = document.createElement('div');
        temp.innerHTML = raw;
        temp.querySelectorAll(UI_SELECTOR).forEach(node => node.remove());
        temp.querySelectorAll('.md-rendered-content[data-dev1-snapshot-highlighter-edit="true"], .md-rendered-content[data-md-source]').forEach(node => {
          node.replaceWith(document.createTextNode(this.exportMdRenderedElementToMarkdownHtml(node, fallbackTool)));
        });
        return safeString(temp.textContent || fallbackText).replace(/\n{3,}/g, '\n\n').trim();
      } catch (_) {
        return safeString(fallbackText);
      }
    }

    sanitizeEditFragmentHtml(html) {
      const temp = document.createElement('div');
      temp.innerHTML = safeString(html);
      temp.querySelectorAll(UI_SELECTOR).forEach(node => node.remove());
      temp.querySelectorAll('[contenteditable], [data-md-editing], .md-editing-source').forEach(node => {
        node.removeAttribute('contenteditable');
        node.removeAttribute('data-md-editing');
        node.classList.remove('md-editing-source');
      });
      temp.querySelectorAll('.md-rendered-content[data-edit-fragment-id]').forEach(node => {
        node.setAttribute('data-dev1-snapshot-highlighter-edit', 'true');
      });
      return temp.innerHTML;
    }

    createHighlight(selection, text) {
      let range = null;
      try { range = selection.getRangeAt(0).cloneRange(); } catch (_) { }
      if (!range) return;
      const id = `h-${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const color = this.currentColor;
      const colorName = this.getCurrentColorName();
      const colorNameKey = this.currentColorKey || this.getColorNameKeyForValue(color, this.currentColorVariant, colorName);
      const toolStyle = this.currentTool || 'highlight';
      let textColorOverride = this.currentColorVariant === 'white' || this.currentColorVariant === 'black' || this.currentColorVariant === 'auto' ? this.currentColorVariant : 'auto';
      this.cacheGroupLineBoxesFromRange(id, range);
      this._creatingHighlightGroupId = id;
      let segments = [];
      try {
        segments = this.wrapRangeTextOnly(range, id, color, colorName, colorNameKey, toolStyle, textColorOverride);
      } finally {
        this._creatingHighlightGroupId = null;
      }
      if (!segments.length) return;
      const randomSeed = this.isRainbowColor(color)
        ? safeString((segments.find(segment => segment.randomSeed) || {}).randomSeed || this._seedFromId(id))
        : '';
      const entry = {
        id,
        text,
        color,
        colorNameKey,
        toolStyle,
        mode: this.isEditTool(toolStyle) ? 'edit' : 'visual',
        textColorOverride,
        randomSeed,
        timestamp: now(),
        url: this.currentUrl,
        pageTitle: document.title || '',
        segments
      };
      this.highlights.set(id, entry);
      this.refreshGroupEffects(id, toolStyle, color);
      this.requestSave(true);
      this.updatePermanentToolbarIndicator();
    }

    wrapRangeTextOnly(range, id, color, colorName, colorNameKey, toolStyle, textColorOverride, randomSeed = '') {
      const textNodes = this.getIntersectingTextNodes(range);
      const prepared = [];
      const firstTextNode = textNodes[0] || null;
      const lastTextNode = textNodes[textNodes.length - 1] || null;
      textNodes.forEach(node => {
        const text = node.nodeValue || '';
        let start = node === range.startContainer ? range.startOffset : 0;
        let end = node === range.endContainer ? range.endOffset : text.length;
        start = Math.max(0, Math.min(text.length, start));
        end = Math.max(start, Math.min(text.length, end));
        let selected = text.slice(start, end);
        const leading = node === firstTextNode ? selected.match(/^\s*/)[0].length : 0;
        const trailing = node === lastTextNode ? selected.match(/\s*$/)[0].length : 0;
        start += leading;
        end -= trailing;
        selected = text.slice(start, end);
        if (!selected) return;
        const parent = node.parentElement;
        if (!parent || this.isUiElement(parent) || parent.closest(HIGHLIGHT_ANY_SELECTOR)) return;
        const parentXPath = this.getXPathForElement(parent);
        const startInParent = this.getTextOffsetWithin(parent, node, start);
        const endInParent = this.getTextOffsetWithin(parent, node, end);
        prepared.push({ node, start, end, selected, parentXPath, startInParent, endInParent, parentText: this.getTextContentForHighlightOffsets(parent) });
      });
      prepared.sort((a, b) => {
        if (a.node === b.node) return b.start - a.start;
        const pos = a.node.compareDocumentPosition(b.node);
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1;
      });
      const segments = [];
      prepared.forEach((item, index) => {
        const span = this.wrapTextNodePart(item.node, item.start, item.end, id, color, colorName, colorNameKey, toolStyle, textColorOverride, index, randomSeed);
        if (span) {
          segments.push({
            parentXPath: item.parentXPath,
            startInParent: item.startInParent,
            endInParent: item.endInParent,
            text: item.selected,
            parentText: item.parentText,
            partIndex: index,
            randomSeed: span.getAttribute('data-random-seed') || ''
          });
        }
      });
      return segments.sort((a, b) => a.partIndex - b.partIndex);
    }

    getIntersectingTextNodes(range) {
      const root = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
        ? range.commonAncestorContainer.parentNode
        : range.commonAncestorContainer;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          const parent = node.parentElement;
          if (!parent || this.isUiElement(parent)) return NodeFilter.FILTER_REJECT;
          if (parent.closest(`script,style,noscript,textarea,input,select,button,.${NOTE_STATIC_CLASS},${HIGHLIGHT_ANY_SELECTOR}`)) return NodeFilter.FILTER_REJECT;
          try {
            return range.intersectsNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          } catch (_) {
            return NodeFilter.FILTER_REJECT;
          }
        }
      });
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      if (range.commonAncestorContainer.nodeType === Node.TEXT_NODE && !nodes.includes(range.commonAncestorContainer)) {
        nodes.push(range.commonAncestorContainer);
      }
      return nodes;
    }

    wrapTextNodePart(node, start, end, id, color, colorName, colorNameKey, toolStyle, textColorOverride, partIndex, randomSeed = '') {
      const text = node.nodeValue || '';
      if (start < 0 || end > text.length || start >= end) return null;
      const before = text.slice(0, start);
      const selected = text.slice(start, end);
      const after = text.slice(end);
      const span = document.createElement('span');
      span.className = 'custom-highlight dev1-snapshot-highlight';
      span.dataset.dev1SnapshotHighlighter = 'true';
      span.dataset.highlightId = id;
      span.dataset.color = this.getCssColorDataValue(color);
      span.dataset.colorName = colorName;
      span.dataset.colorKey = colorNameKey || this.getColorNameKeyForValue(color, textColorOverride || '', colorName || '');
      span.dataset.toolStyle = toolStyle || 'highlight';
      span.dataset.partIndex = String(partIndex || 0);
      span.dataset.text = selected;
      span.dataset.timestamp = String(now());
      try {
        const originalColor = node.parentElement ? window.getComputedStyle(node.parentElement).color : '';
        if (originalColor) span.dataset.originalColor = originalColor;
      } catch (_) { }
      if (textColorOverride) span.dataset.textColorOverride = textColorOverride;
      if (randomSeed) span.dataset.randomSeed = safeString(randomSeed);
      if (this.isRainbowColor(color)) this.ensureRainbowSeed(span, color);
      span.textContent = selected;
      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(span);
      if (after) frag.appendChild(document.createTextNode(after));
      node.parentNode.replaceChild(frag, node);
      this.applyHighlightStyles(span, color, toolStyle, textColorOverride);
      this.scheduleElementEffectRefresh(span, toolStyle, color);
      return span;
    }

    applyHighlightStyles(element, color = this.currentColor, toolStyle = 'highlight', textColorOverride = '') {
      const tool = toolStyle || 'highlight';
      this.resetHighlightEffectDom(element, tool);
      element.className = 'custom-highlight dev1-snapshot-highlight';
      element.classList.add(`tool-${tool}`);
      element.dataset.toolStyle = tool;
      element.dataset.color = this.getCssColorDataValue(color);
      if (!element.dataset.colorKey) {
        element.dataset.colorKey = this.getColorNameKeyForValue(color, textColorOverride || '', element.dataset.colorName || '');
      }
      if (textColorOverride) element.dataset.textColorOverride = textColorOverride;
      const variantColor = textColorOverride === 'white' ? '#ffffff' : (textColorOverride === 'black' ? '#0f172a' : '');
      const originalTextColor = safeString(element.dataset.originalColor || '');
      const textColor = variantColor || contrastText(color, originalTextColor || (this.darkModeEnabled ? '#ffffff' : '#0f172a'));
      const renderColor = this.getRenderableColor(color, element);
      const rgba = /^#[0-9a-f]{6}$/i.test(renderColor) ? rgbaFromHex(renderColor, 0.32) : renderColor;
      const isRainbow = this.isRainbowColor(color);
      const isTransparent = this.isTransparentColor(color);
      const rainbowGradient = isRainbow ? this.buildRainbowGradient(color, element) : '';
      const rainbowSoft = isRainbow ? this.buildRainbowGradient(color, element, 0.36) : '';
      const fixedRainbowGradient = 'linear-gradient(90deg, #ff3b30, #ff9500, #ffcc00, #34c759, #007aff, #af52de)';
      const rainbowToolGradient = isRainbow ? rainbowGradient : fixedRainbowGradient;
      const frameBg = isRainbow ? this.buildRainbowGradient(color, element, 0.24) : rgbaFromHex(renderColor, isTransparent ? 0.14 : 0.12);
      element.style.removeProperty('background');
      element.style.removeProperty('background-color');
      element.style.removeProperty('background-image');
      element.style.removeProperty('background-size');
      element.style.removeProperty('background-position');
      element.style.removeProperty('background-blend-mode');
      element.style.removeProperty('color');
      element.style.removeProperty('border');
      element.style.removeProperty('border-radius');
      element.style.removeProperty('box-shadow');
      element.style.removeProperty('text-decoration');
      element.style.removeProperty('text-decoration-skip-ink');
      element.style.removeProperty('text-shadow');
      element.style.removeProperty('animation');
      element.style.removeProperty('filter');
      element.style.removeProperty('transform');
      element.style.removeProperty('backdrop-filter');
      element.style.removeProperty('-webkit-backdrop-filter');
      element.style.removeProperty('-webkit-text-fill-color');
      element.style.removeProperty('-webkit-text-stroke');
      element.style.removeProperty('-webkit-background-clip');
      element.style.removeProperty('background-clip');
      element.style.removeProperty('display');
      element.style.removeProperty('padding');
      element.style.removeProperty('outline');
      element.style.removeProperty('position');
      element.style.removeProperty('isolation');
      element.style.removeProperty('mix-blend-mode');
      element.style.removeProperty('will-change');
      element.style.removeProperty('opacity');
      element.style.removeProperty('box-decoration-break');
      element.style.removeProperty('-webkit-box-decoration-break');
      element.style.removeProperty('font-weight');
      element.style.removeProperty('font-style');
      element.style.removeProperty('font-size');
      element.style.removeProperty('font-family');
      element.style.removeProperty('line-height');
      element.style.removeProperty('vertical-align');
      element.style.removeProperty('margin');
      element.style.removeProperty('border-left');
      element.style.removeProperty('border-right');
      element.style.removeProperty('border-top');
      element.style.removeProperty('border-bottom');
      element.style.removeProperty('padding-left');
      element.style.removeProperty('padding-right');
      element.style.removeProperty('padding-top');
      element.style.removeProperty('padding-bottom');
      element.style.removeProperty('text-decoration-line');
      element.style.removeProperty('text-decoration-style');
      element.style.removeProperty('text-decoration-color');
      element.style.removeProperty('text-decoration-thickness');
      element.style.removeProperty('text-underline-offset');
      element.style.removeProperty('letter-spacing');
      element.style.removeProperty('--dev1-glow-bg');
      element.style.removeProperty('--dev1-sticker-bg');
      element.style.removeProperty('--dev1-sticker-border');
      element.style.setProperty('--dev1-highlight-color', renderColor);
      element.style.setProperty('--dev1-highlight-rgba', rgba);
      element.style.setProperty('--dev1-highlight-text', textColor);
      element.style.setProperty('--dev1-highlight-frame-bg', frameBg);
      if (isRainbow) {
        const seed = this.ensureRainbowSeed(element, color);
        const variant = this.getRainbowVariant(color);
        element.dataset.rbVariant = variant;
        element.style.setProperty('--rb-angle', `${Math.abs(seed) % 360}deg`);
        element.style.setProperty('--rb-grad', rainbowGradient);
        element.style.setProperty('--rb-grad-soft', rainbowSoft || rainbowGradient);
      }
      const gid = element.getAttribute('data-highlight-id');
      const isMultiLine = this.isMultiLineHighlightGroup(gid);
      const overlayTools = new Set([
        'box', 'filled-box', 'rounded-box', 'dashed-box', 'double-box',
        'brackets-corner', 'brackets-round', 'brackets-angle', 'brackets-book',
        'brackets-cjk', 'brackets-curly', 'brackets-square',
        'running-line', 'ripple',
        'blur', 'mosaic', 'callout', 'sticker', 'neon-blink', 'neon-flicker', 'liquidglass',
        'highlight', 'marker', 'pastel', 'neon', 'transparent', 'highlighter-pen',
        'pill', 'glow', 'rainbow', 'spotlight', 'gradient'
      ]);
      if (isMultiLine && overlayTools.has(tool)) {
        element.style.setProperty('background', 'transparent', 'important');
        element.style.setProperty('background-color', 'transparent', 'important');
        element.style.setProperty('background-image', 'none', 'important');
        element.style.setProperty('border', 'none', 'important');
        element.style.setProperty('border-width', '0', 'important');
        element.style.setProperty('border-radius', '0', 'important');
        element.style.setProperty('box-shadow', 'none', 'important');
        element.style.setProperty('padding', '0', 'important');
        element.style.setProperty('margin', '0', 'important');
        element.style.setProperty('backdrop-filter', 'none', 'important');
        element.style.setProperty('webkit-backdrop-filter', 'none', 'important');
        element.style.setProperty('animation', 'none', 'important');
        element.style.setProperty('transform', 'none', 'important');
        element.style.setProperty('text-shadow', 'none', 'important');
        element.style.setProperty('mix-blend-mode', 'normal', 'important');
        element.style.setProperty('isolation', 'auto', 'important');
        
        if (tool === 'sticker' || tool === 'liquidglass') {
          element.style.setProperty('color', 'transparent', 'important');
          element.style.setProperty('-webkit-text-fill-color', 'transparent', 'important');
        } else {
          element.style.setProperty('color', originalTextColor || 'inherit', 'important');
        }

        if (tool === 'running-line') {
          this.ensureRunningLineLayers(element, renderColor, color);
        } else if (tool === 'ripple') {
          this.ensureRippleStructure(element, renderColor, color);
        } else if (tool === 'neon-blink' || tool === 'neon-flicker') {
          element.querySelectorAll(':scope > .neon-fog, :scope > .neon-frame').forEach(node => node.remove());
        } else if (/^brackets-/.test(tool)) {
          element.removeAttribute('data-bracket-dom');
        }

        if (gid) this.applyGroupFrameOverlayIfNeeded(gid, tool, color);
        return;
      }
      const lineTools = new Set(['underline', 'double-underline', 'wavy', 'dotted', 'dashed', 'thick-underline', 'strikethrough']);
      if (this.applyMarkdownLikeToolStyle(element, color, tool, textColor, rgba)) {
        return;
      } else if (lineTools.has(tool)) {
        element.style.background = 'transparent';
        element.style.color = 'inherit';
        element.style.textDecorationSkipInk = 'none';
        if (isRainbow) {
          element.style.setProperty('text-decoration', 'none', 'important');
          element.style.setProperty('text-decoration-line', 'none', 'important');
          const seed = this.ensureRainbowSeed(element, color);
          const lineMeta = {
            underline: ['underline', { thickness: 2, offset: 2 }],
            'double-underline': ['double', { thickness: 2, gap: 3, offset: 2 }],
            wavy: ['wavy', { thickness: 2, amplitude: 2.2, period: 12, offset: 3 }],
            dotted: ['dotted', { thickness: 2, offset: 2 }],
            dashed: ['dashed', { thickness: 2, offset: 2 }],
            'thick-underline': ['underline', { thickness: 4, offset: 3 }],
            strikethrough: ['strikethrough', { thickness: 2, position: 'middle' }]
          }[tool];
          this.renderRainbowLineAfterLayout(element, lineMeta[0], seed, lineMeta[1]);
        } else {
          this.removeRainbowLine(element);
        }
      } else if (tool === 'pill') {
        const fillColor = isRainbow ? rainbowSoft : (isTransparent ? this.neutralColor(0.12, 0.18) : rgbaFromHex(renderColor, 0.2));
        const borderColor = isRainbow ? renderColor : rgbaFromHex(renderColor, isTransparent ? 0.5 : 0.85);
        element.style.display = 'inline-block';
        element.style.background = fillColor;
        element.style.border = `1px solid ${borderColor}`;
        element.style.borderRadius = '999px';
        element.style.padding = '2px 8px';
        element.style.fontWeight = '600';
        element.style.color = textColor;
      } else if (tool === 'filled-box') {
        const fillColor = isRainbow ? rainbowSoft : rgbaFromHex(renderColor, isTransparent ? 0.14 : 0.24);
        const borderColor = isRainbow ? renderColor : renderColor;
        element.style.background = fillColor;
        element.style.border = `1.5px solid ${borderColor}`;
        element.style.borderRadius = '3px';
        element.style.padding = '2px 4px';
        element.style.color = textColor;
      } else if (tool === 'callout') {
        const gid = element.getAttribute('data-highlight-id');
        if (this.isMultiLineHighlightGroup(gid)) {
          element.style.background = 'transparent';
          element.style.backgroundColor = 'transparent';
          element.style.border = 'none';
          element.style.padding = '0';
          element.style.margin = '0';
          element.style.boxShadow = 'none';
          element.style.color = originalTextColor || 'inherit';
          if (gid) this.applyGroupFrameOverlayIfNeeded(gid, tool, color);
          return;
        }
        const calloutBg = isRainbow ? rainbowSoft : rgbaFromHex(renderColor, isTransparent ? 0.1 : 0.12);
        element.style.background = calloutBg;
        element.style.borderLeft = `4px solid ${renderColor}`;
        element.style.borderRadius = '0 4px 4px 0';
        element.style.padding = '4px 8px';
        element.style.margin = '2px 0';
        element.style.color = originalTextColor || textColor;
        element.style.boxShadow = 'none';
      } else if (tool === 'sticker') {
        const gid = element.getAttribute('data-highlight-id');
        if (this.isMultiLineHighlightGroup(gid)) {
          element.style.background = 'transparent';
          element.style.backgroundColor = 'transparent';
          element.style.border = 'none';
          element.style.boxShadow = 'none';
          element.style.transform = '';
          element.style.textShadow = 'none';
          element.style.padding = '0';
          element.style.color = 'transparent';
          element.style.webkitTextFillColor = 'transparent';
          if (gid) this.applyGroupFrameOverlayIfNeeded(gid, tool, color);
          return;
        }
        element.style.display = 'inline-block';
        const stickerBg = isRainbow
          ? `linear-gradient(135deg, rgba(255,255,255,.88), rgba(255,255,255,.72)), ${rainbowSoft}`
          : '#fffbe6';
        const stickerBorder = isRainbow ? renderColor : rgbaFromHex(renderColor, isTransparent ? 0.55 : 0.9);
        element.style.setProperty('--dev1-sticker-bg', stickerBg);
        element.style.setProperty('--dev1-sticker-border', stickerBorder);
        element.style.background = stickerBg;
        element.style.backgroundBlendMode = isRainbow ? 'multiply' : 'normal';
        element.style.border = `2px dashed ${stickerBorder}`;
        element.style.borderRadius = '8px';
        element.style.padding = '6px 10px';
        element.style.boxShadow = '0 6px 12px rgba(0,0,0,.2)';
        element.style.transform = 'rotate(-2deg)';
        element.style.textShadow = '0 1px 0 rgba(255,255,255,.6)';
        element.style.color = '#1a1a1a';
      } else if (/^brackets-/.test(tool)) {
        const gid = element.getAttribute('data-highlight-id');
        if (this.isMultiLineHighlightGroup(gid)) {
          element.style.background = 'transparent';
          element.style.color = originalTextColor || 'inherit';
          element.style.padding = '0';
          element.style.margin = '0';
          element.removeAttribute('data-bracket-dom');
          if (gid) this.applyGroupFrameOverlayIfNeeded(gid, tool, color);
          return;
        }
        if (this.applyBracketDomStyle(element, tool, renderColor)) return;
      } else if (this.applyBracketDomStyle(element, tool, renderColor)) {
        return;
      } else if (tool === 'outline') {
        element.style.background = 'transparent';
        if (isRainbow) {
          element.style.background = rainbowGradient;
          element.style.webkitBackgroundClip = 'text';
          element.style.backgroundClip = 'text';
          element.style.color = 'transparent';
          element.style.webkitTextFillColor = 'transparent';
        } else {
          element.style.color = 'transparent';
          element.style.webkitTextStroke = `1px ${renderColor}`;
          element.style.textShadow = `0 0 1px ${renderColor}`;
        }
      } else if (tool === 'blur') {
        const gid = element.getAttribute('data-highlight-id');
        if (this.isMultiLineHighlightGroup(gid)) {
          element.style.background = 'transparent';
          element.style.backgroundColor = 'transparent';
          element.style.border = 'none';
          element.style.boxShadow = 'none';
          element.style.padding = '0';
          element.style.margin = '0';
          element.style.backdropFilter = 'none';
          element.style.webkitBackdropFilter = 'none';
          element.style.color = originalTextColor || 'inherit';
          if (gid) this.applyGroupFrameOverlayIfNeeded(gid, tool, color);
          return;
        }
        const inner = this.ensureInnerWrapper(element, 'gh-blur-inner');
        element.style.background = isRainbow ? rainbowSoft : rgbaFromHex(renderColor, isTransparent ? 0.18 : 0.3);
        element.style.borderRadius = '6px';
        element.style.padding = '2px 5px';
        element.style.boxShadow = `0 8px 22px ${rgbaFromHex(renderColor, isTransparent ? 0.2 : 0.34)}`;
        element.style.backdropFilter = 'blur(6px) saturate(1.18)';
        element.style.webkitBackdropFilter = 'blur(6px) saturate(1.18)';
        element.style.color = textColor;
        if (inner) {
          inner.style.filter = 'blur(2.4px)';
          inner.style.webkitFilter = 'blur(2.4px)';
          inner.style.opacity = '0.94';
        }
      } else if (tool === 'mosaic') {
        const gid = element.getAttribute('data-highlight-id');
        if (this.isMultiLineHighlightGroup(gid)) {
          element.style.display = '';
          element.style.background = 'transparent';
          element.style.backgroundColor = 'transparent';
          element.style.backgroundImage = 'none';
          element.style.backgroundBlendMode = '';
          element.style.border = 'none';
          element.style.boxShadow = 'none';
          element.style.padding = '0';
          element.style.margin = '0';
          element.style.color = originalTextColor || 'inherit';
          element.style.webkitTextFillColor = '';
          if (gid) this.applyGroupFrameOverlayIfNeeded(gid, tool, color);
          return;
        }
        const inner = this.ensureInnerWrapper(element, 'gh-mosaic-inner');
        element.style.display = 'inline-block';
        element.style.padding = '2px 5px';
        element.style.borderRadius = '4px';
        element.style.backgroundColor = rgbaFromHex(renderColor, isTransparent ? 0.08 : 0.12);
        element.style.backgroundImage = isRainbow
          ? `${rainbowSoft}, repeating-linear-gradient(0deg, rgba(255,255,255,.24) 0 6px, transparent 6px 12px), repeating-linear-gradient(90deg, rgba(255,255,255,.24) 0 6px, transparent 6px 12px)`
          : `repeating-linear-gradient(0deg, ${rgbaFromHex(renderColor, isTransparent ? 0.28 : 0.42)} 0 6px, transparent 6px 12px), repeating-linear-gradient(90deg, ${rgbaFromHex(renderColor, isTransparent ? 0.28 : 0.42)} 0 6px, transparent 6px 12px)`;
        element.style.backgroundBlendMode = isRainbow ? 'multiply, normal, normal' : '';
        element.style.color = 'transparent';
        if (inner) inner.style.color = 'transparent';
      } else if (tool === 'glow') {
        element.style.setProperty('--dev1-glow-bg', isRainbow ? rainbowGradient : 'transparent');
        element.style.background = isRainbow ? rainbowGradient : 'transparent';
        element.style.padding = '1px 2px';
        element.style.borderRadius = '4px';
        element.style.boxShadow = isRainbow
          ? '0 0 10px rgba(0,0,0,.25), 0 0 18px rgba(0,0,0,.15)'
          : `0 0 10px ${rgbaFromHex(renderColor, isTransparent ? 0.42 : 0.8)}, 0 0 18px ${rgbaFromHex(renderColor, isTransparent ? 0.28 : 0.5)}`;
        element.style.textShadow = isRainbow
          ? '0 0 4px rgba(0,0,0,.25)'
          : `0 0 4px ${rgbaFromHex(renderColor, isTransparent ? 0.42 : 0.8)}`;
        element.style.color = isRainbow ? (textColorOverride === 'black' ? '#000000' : '#ffffff') : (originalTextColor || 'inherit');
      } else if (tool === 'liquidglass') {
        element.style.display = 'inline-block';
        element.style.padding = '3px 7px';
        element.style.borderRadius = '8px';
        element.style.border = `1px solid ${isRainbow ? 'rgba(255,255,255,.32)' : rgbaFromHex(renderColor, 0.36)}`;
        element.style.background = isRainbow
          ? `linear-gradient(135deg, rgba(255,255,255,.42), rgba(255,255,255,.08) 42%, rgba(255,255,255,.28)), ${rainbowSoft}`
          : `linear-gradient(135deg, rgba(255,255,255,.48), rgba(255,255,255,.14) 34%, ${rgbaFromHex(renderColor, isTransparent ? 0.18 : 0.32)} 58%, rgba(255,255,255,.32)), linear-gradient(90deg, ${rgbaFromHex(renderColor, 0.14)}, ${rgbaFromHex(renderColor, isTransparent ? 0.26 : 0.4)}, ${rgbaFromHex(renderColor, 0.14)})`;
        element.style.boxShadow = `inset 0 1px 3px rgba(255,255,255,.55), inset 0 -1px 2px rgba(0,0,0,.12), 0 4px 14px ${rgbaFromHex(renderColor, 0.24)}`;
        element.style.backdropFilter = 'blur(8px) saturate(1.8) brightness(1.08)';
        element.style.webkitBackdropFilter = 'blur(8px) saturate(1.8) brightness(1.08)';
        element.style.fontWeight = '600';
        element.style.letterSpacing = '0.3px';
        element.style.color = textColor;
        const gid = element.getAttribute('data-highlight-id');
        if (this.isMultiLineHighlightGroup(gid)) {
          element.style.background = 'transparent';
          element.style.backgroundImage = 'none';
          element.style.border = 'none';
          element.style.boxShadow = 'none';
          element.style.backdropFilter = 'none';
          element.style.webkitBackdropFilter = 'none';
          element.style.padding = '0';
          element.style.margin = '0';
          element.style.color = 'transparent';
          element.style.webkitTextFillColor = 'transparent';
          if (gid) this.applyGroupFrameOverlayIfNeeded(gid, tool, color);
          return;
        }
      } else if (tool === 'running-line') {
        this.ensureRunningLineLayers(element, renderColor, color);
        element.style.background = 'transparent';
        element.style.backgroundImage = 'none';
        element.style.border = 'none';
        element.style.boxShadow = 'none';
        element.style.padding = '0';
        element.style.color = originalTextColor || 'inherit';
        element.style.animation = 'none';
        const gid = element.getAttribute('data-highlight-id');
        if (gid) this.applyGroupFrameOverlayIfNeeded(gid, 'running-line', color);
      } else if (tool === 'neon-blink' || tool === 'neon-flicker') {
        const gid = element.getAttribute('data-highlight-id');
        if (this.isMultiLineHighlightGroup(gid)) {
          element.classList.remove(`tool-${tool}`);
          element.removeAttribute('data-neon-mode');
          element.removeAttribute('data-neon-clarity');
          element.removeAttribute('data-rb-variant');
          element.querySelectorAll(':scope > .neon-fog, :scope > .neon-frame').forEach(node => node.remove());
          element.style.background = 'transparent';
          element.style.backgroundImage = 'none';
          element.style.boxShadow = 'none';
          element.style.padding = '0';
          element.style.borderRadius = '';
          element.style.mixBlendMode = 'normal';
          element.style.color = originalTextColor || 'inherit';
          return;
        }
        this.ensureNeonLayers(element, renderColor, color, tool);
        element.style.display = 'inline-block';
        element.style.position = 'relative';
        element.style.background = rgbaFromHex(renderColor, tool === 'neon-flicker' ? 0.1 : 0.08);
        element.style.borderRadius = '5px';
        element.style.padding = '2px 5px';
        element.style.color = originalTextColor || 'inherit';
        element.style.boxShadow = tool === 'neon-flicker'
          ? `0 0 22px ${rgbaFromHex(renderColor, 0.5)}`
          : `0 0 18px ${rgbaFromHex(renderColor, 0.45)}`;
        element.style.isolation = 'isolate';
      } else if (tool === 'ripple') {
        this.ensureRippleStructure(element, renderColor, color);
        element.style.background = 'transparent';
        element.style.border = '0';
        element.style.padding = '0';
        element.style.boxShadow = 'none';
        element.style.color = 'inherit';
      } else if (tool === 'fluid') {
        element.dataset.fluidMode = isRainbow ? 'rainbow' : 'mono';
        if (isRainbow) element.style.removeProperty('--fluid-color');
        else element.style.setProperty('--fluid-color', renderColor);
        element.style.color = originalTextColor || 'inherit';
      } else if (tool === 'rainbow' || (isRainbow && tool === 'highlight')) {
        element.style.background = rainbowToolGradient;
        element.style.backgroundSize = '200% 100%';
        element.style.animation = 'dev1SnapshotRainbowPulse 3s ease-in-out infinite';
        element.style.padding = '2px 4px';
        element.style.borderRadius = '6px';
        element.style.color = textColor;
      } else if (isTransparent && tool === 'highlight') {
        element.style.background = 'transparent';
        element.style.color = textColor;
        element.style.outline = `1px dashed ${this.darkModeEnabled ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.38)'}`;
      } else if (tool === 'gradient') {
        element.style.background = isRainbow ? rainbowGradient : `linear-gradient(90deg, ${rgbaFromHex(renderColor, 0.85)}, ${rgbaFromHex(renderColor, isTransparent ? 0.14 : 0.2)})`;
        element.style.backgroundSize = '200% 100%';
        element.style.animation = 'dev1SnapshotRainbowPulse 3s ease-in-out infinite';
        element.style.color = textColor;
      } else if (tool === 'spotlight') {
        const spot = isTransparent ? this.neutralColor(0.18, 0.26) : rgbaFromHex(renderColor, 0.35);
        element.style.backgroundImage = isRainbow
          ? `${rainbowGradient}, radial-gradient(circle at 50% 50%, rgba(255,255,255,0.35) 0%, transparent 70%)`
          : `radial-gradient(circle at 50% 50%, ${spot} 0%, transparent 70%)`;
        element.style.padding = '2px 4px';
        element.style.borderRadius = '50px';
        element.style.color = textColor;
      } else if (tool === 'marker') {
        element.style.background = isRainbow ? rainbowGradient : renderColor;
        element.style.padding = '2px 3px';
        element.style.borderRadius = '1px';
        element.style.fontWeight = '900';
        element.style.letterSpacing = '0.2px';
        element.style.color = textColor;
      } else if (tool === 'highlighter-pen') {
        element.style.background = isRainbow
          ? this.buildRainbowGradient(color, element, 0.5)
          : `linear-gradient(0deg, ${rgbaFromHex(renderColor, 0.35)} 0%, ${rgbaFromHex(renderColor, 0.25)} 100%)`;
        element.style.padding = '2px 4px';
        element.style.borderRadius = '3px';
        element.style.boxShadow = 'inset 0 -1px 0 rgba(0,0,0,.12)';
        element.style.color = textColorOverride ? textColor : (isRainbow ? '#ffffff' : (originalTextColor || textColor));
      } else if (tool === 'neon') {
        element.style.background = isRainbow ? this.buildRainbowGradient(color, element, 0.7) : renderColor;
        element.style.padding = '2px 4px';
        element.style.borderRadius = '4px';
        element.style.boxShadow = isRainbow ? '0 0 10px rgba(0,0,0,.25)' : `0 0 8px ${renderColor}`;
        element.style.fontWeight = 'bold';
        element.style.color = textColor;
      } else if (tool === 'transparent') {
        const overlay = isRainbow ? this.buildRainbowGradient(color, element, 0.18) : rgbaFromHex(renderColor, 0.1);
        element.style.background = overlay;
        element.style.borderBottom = `1px solid ${renderColor}`;
        element.style.color = textColorOverride ? textColor : (originalTextColor || (isRainbow ? '#ffffff' : textColor));
      } else if (tool === 'pastel') {
        element.style.background = isRainbow ? rainbowSoft : rgbaFromHex(renderColor, isTransparent ? 0.12 : 0.2);
        element.style.color = textColorOverride ? textColor : (isRainbow ? '#ffffff' : (originalTextColor || (this.darkModeEnabled ? '#ffffff' : '#111111')));
      } else {
        element.style.background = color;
        element.style.color = textColor;
      }
      if (tool !== 'fluid' && !isRainbow && this.isFireColor(renderColor)) {
        element.classList.add('fire-highlight');
        element.style.background = `linear-gradient(45deg, ${renderColor}, #ff6347, #ff8c00, ${renderColor})`;
        element.style.backgroundSize = '400% 400%';
        element.style.animation = 'fireBackground 2s ease-in-out infinite, fireFlicker 1.5s ease-in-out infinite alternate';
        element.style.boxShadow = `0 0 8px ${rgbaFromHex(renderColor, 0.8)}, 0 0 15px rgba(255,99,71,.5)`;
      } else if (tool !== 'fluid' && !isRainbow && this.isNeonColor(renderColor) && !['neon-blink', 'neon-flicker'].includes(tool)) {
        element.style.boxShadow = element.style.boxShadow || `0 0 8px ${renderColor}, 0 0 18px ${rgbaFromHex(renderColor, 0.35)}`;
        element.style.textShadow = element.style.textShadow || '0 0 4px rgba(255,255,255,.45)';
      }
    }

    resetHighlightEffectDom(element, nextTool = '') {
      if (!element) return;
      try {
        element.querySelectorAll(`:scope > .${NOTE_BUBBLE_CLASS}, :scope > .${NOTE_STATIC_CLASS}`).forEach(node => node.remove());
        element.classList.remove('fire-highlight');
        if (element.dataset.bracketDom === 'true') {
          const inner = element.querySelector(':scope > .hl-bracket-inner');
          element.textContent = inner ? inner.textContent : (element.dataset.text || element.textContent || '');
        }
        element.removeAttribute('data-bracket-dom');
        element.removeAttribute('data-fluid-mode');
        element.removeAttribute('data-neon-mode');
        element.removeAttribute('data-neon-clarity');
        element.removeAttribute('data-rb-variant');
        element.style.removeProperty('--fluid-color');
        const text = element.dataset.text || element.textContent || '';
        const keepNeonLayers = ['neon-blink', 'neon-flicker'].includes(safeString(nextTool))
          && element.classList.contains(`tool-${nextTool}`)
          && !element.querySelector(':scope > .ripple-box, :scope > .gh-blur-inner, :scope > .gh-mosaic-inner, :scope > .hl-bracket-inner');
        if (keepNeonLayers) {
          let textNode = Array.from(element.childNodes || []).find(node => node.nodeType === Node.TEXT_NODE);
          if (!textNode) {
            textNode = document.createTextNode(text);
            element.insertBefore(textNode, element.firstChild || null);
          } else {
            textNode.nodeValue = text;
          }
          Array.from(element.childNodes || []).forEach(node => {
            if (node === textNode) return;
            if (node.nodeType === Node.ELEMENT_NODE && node.classList && (node.classList.contains('neon-fog') || node.classList.contains('neon-frame'))) return;
            try { node.remove(); } catch (_) { }
          });
        } else {
          element.textContent = text;
        }
      } catch (_) { }
    }

    applyBracketDomStyle(element, tool, renderColor) {
      const bracketMap = {
        'brackets-corner': ['「', '」'],
        'brackets-round': ['(', ')'],
        'brackets-angle': ['<', '>'],
        'brackets-book': ['《', '》'],
        'brackets-cjk': ['【', '】'],
        'brackets-curly': ['{', '}'],
        'brackets-square': ['[', ']']
      };
      const chars = bracketMap[tool];
      if (!chars) return false;
      const text = element.dataset.text || element.textContent || '';
      element.textContent = '';
      element.dataset.bracketDom = 'true';
      element.style.background = 'transparent';
      element.style.color = 'inherit';
      const left = document.createElement('span');
      left.className = 'hl-bracket-left';
      left.textContent = chars[0];
      const inner = document.createElement('span');
      inner.className = 'hl-bracket-inner';
      inner.textContent = text;
      const right = document.createElement('span');
      right.className = 'hl-bracket-right';
      right.textContent = chars[1];
      [left, right].forEach(mark => {
        mark.style.display = 'inline-block';
        mark.style.color = renderColor;
        mark.style.fontWeight = '700';
        mark.style.margin = '0 2px';
        mark.style.verticalAlign = 'middle';
      });
      element.appendChild(left);
      element.appendChild(inner);
      element.appendChild(right);
      return true;
    }

    ensureInnerWrapper(element, className) {
      if (!element) return null;
      let inner = Array.from(element.children || []).find(child => child.classList && child.classList.contains(className));
      if (!inner) {
        inner = document.createElement('span');
        inner.className = className;
        while (element.firstChild) inner.appendChild(element.firstChild);
        element.appendChild(inner);
      }
      return inner;
    }

    isMultiLineHighlightGroup(gid) {
      if (!gid) return false;
      try {
        const cached = this.groupFrameGeometries && this.groupFrameGeometries.get(gid);
        if (cached && cached.distinctLines) return cached.distinctLines > 1;
        const lines = this.computeLineBoxesForGroup(gid) || [];
        return Math.max(lines._distinctLineCount || lines.length || 0, 0) > 1;
      } catch (_) {
        return false;
      }
    }

    ensureRunningLineLayers(element, renderColor, rawColor = '') {
      const isRainbow = this.isRainbowColor(rawColor);
      if (isRainbow) {
        element.dataset.rbVariant = this.getRainbowVariant(rawColor);
        element.style.setProperty('--flow-gradient-stops', this.buildRainbowStops(rawColor, element));
      } else {
        element.removeAttribute('data-rb-variant');
        element.style.removeProperty('--flow-gradient-stops');
      }
      element.style.setProperty('--flow-color', renderColor);
      element.style.setProperty('--flow-color-soft', rgbaFromHex(renderColor, 0.34));
      element.querySelectorAll(':scope > .flow-ring-ov, :scope > .rl-overlay').forEach(node => node.remove());
    }

    ensureNeonLayers(element, renderColor, rawColor, tool) {
      const isRainbow = this.isRainbowColor(rawColor);
      const seed = isRainbow ? this.ensureRainbowSeed(element, rawColor) : 0;
      const isFlicker = tool === 'neon-flicker';
      element.dataset.neonMode = isRainbow ? 'rainbow' : 'mono';
      if (isFlicker) element.dataset.neonClarity = 'crisp';
      if (isRainbow) {
        element.dataset.rbVariant = this.getRainbowVariant(rawColor);
        element.style.setProperty('--rb-angle', `${Math.abs(seed) % 360}deg`);
        element.style.setProperty('--rb-grad', this.buildRainbowGradient(rawColor, element));
      }
      const fillAlpha = isFlicker ? (this.darkModeEnabled ? 0.26 : 0.18) : (this.darkModeEnabled ? 0.24 : 0.16);
      const haloAlpha = isFlicker ? (this.darkModeEnabled ? 0.58 : 0.44) : (this.darkModeEnabled ? 0.55 : 0.42);
      const fill = isRainbow ? this.buildRainbowGradient(rawColor, element) : rgbaFromHex(renderColor, fillAlpha);
      const halo = isRainbow ? this.buildRainbowGradient(rawColor, element, 0.52) : rgbaFromHex(renderColor, haloAlpha);
      element.style.setProperty('--neon-color', renderColor);
      element.style.setProperty('--neon-fill', fill);
      element.style.setProperty('--neon-halo', halo);
      element.style.setProperty('--neon-frame-color', isRainbow ? 'rgba(255,255,255,.82)' : rgbaFromHex(renderColor, this.darkModeEnabled ? 0.78 : 0.64));
      element.style.setProperty('--neon-frame-glow', isRainbow ? 'rgba(255,210,160,.5)' : rgbaFromHex(renderColor, this.darkModeEnabled ? 0.45 : 0.36));
      const phase = (Date.now() / 1000) % (isFlicker ? 3.2 : 2.4);
      element.style.setProperty('--neon-delay', `-${phase.toFixed(3)}s`);
      ['neon-fog', 'neon-frame'].forEach(className => {
        let node = element.querySelector(`:scope > .${className}`);
        if (!node) {
          node = document.createElement('span');
          node.className = className;
          element.appendChild(node);
        }
        node.setAttribute('aria-hidden', 'true');
        node.style.pointerEvents = 'none';
        if (className === 'neon-frame') {
          node.style.setProperty('--neon-frame-color', isRainbow ? 'rgba(255,255,255,.82)' : rgbaFromHex(renderColor, this.darkModeEnabled ? 0.78 : 0.64));
          node.style.setProperty('--neon-frame-glow', isRainbow ? 'rgba(255,210,160,.5)' : rgbaFromHex(renderColor, this.darkModeEnabled ? 0.45 : 0.36));
        }
      });
    }

    ensureRippleStructure(element, renderColor, rawColor) {
      const [r, g, b] = parseCssColor(renderColor);
      const isRainbow = this.isRainbowColor(rawColor);
      const seed = isRainbow ? this.ensureRainbowSeed(element, rawColor) : 0;
      const variant = isRainbow ? this.getRainbowVariant(rawColor) : '';
      element.classList.toggle('ripple-rainbow', isRainbow && variant === 'fixed');
      element.classList.toggle('ripple-rainbow-fixed', isRainbow && variant === 'fixed');
      element.classList.toggle('ripple-rainbow-random', isRainbow && variant === 'random');
      element.style.setProperty('--ripple-rgb', `${r}, ${g}, ${b}`);
      const box = this.ensureInnerWrapper(element, 'ripple-box');
      if (!box) return;
      const rgbValue = `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`;
      box.style.setProperty('--ripple-rgb', rgbValue);
      box.style.setProperty('--ripple-vpad', '3px');
      box.style.removeProperty('--ripple-vpad-top');
      box.style.removeProperty('--ripple-vpad-bottom');
      box.style.removeProperty('--ripple-offset-y');
      element.style.removeProperty('--ripple-offset-y');
      box.style.setProperty('--ripple-y-shift', '0px');
      if (isRainbow) {
        box.dataset.rbVariant = variant;
        box.style.removeProperty('--rainbow-delay');
        box.style.setProperty('--rb-grad-soft', this.buildRainbowGradient(rawColor, element, 0.3));
        this._ensureRippleGlobalSyncInit();
      }
      const nowS = (typeof performance !== 'undefined' && performance.now) ? performance.now() / 1000 : Date.now() / 1000;
      box.style.setProperty('--ripple-delay-2s', `-${(nowS % 2).toFixed(3)}s`);
      box.style.setProperty('--ripple-delay-2p4s', `-${(nowS % 2.4).toFixed(3)}s`);
      box.style.setProperty('--rb-alpha-lo', this.darkModeEnabled ? '0.35' : '0.50');
      box.style.setProperty('--rb-alpha-hi', this.darkModeEnabled ? '0.85' : '0.95');
      let edge = box.querySelector(':scope > .ripple-edge');
      if (!edge) {
        edge = document.createElement('span');
        edge.className = 'ripple-edge';
        edge.setAttribute('aria-hidden', 'true');
        box.appendChild(edge);
      }
      box.querySelectorAll(':scope > .ripple-edge-tertiary').forEach(node => node.remove());
      box.querySelectorAll(':scope > .ripple-edge.edge-strong, :scope > .ripple-edge.edge-weak').forEach(node => node.remove());
      edge.style.setProperty('--rfw-strong', '22px');
      edge.style.setProperty('--rf-max-strong', '300px');
      edge.style.setProperty('--rfw-weak', '18px');
      edge.style.setProperty('--rf-max-weak', '210px');
      const computeAndSetRippleAtten = () => {
        try {
          const rect = box.getBoundingClientRect();
          const width = Math.max(1, rect.width);
          const height = Math.max(1, rect.height);
          const diag = Math.sqrt(width * width + height * height);
          const atten = Math.max(0.35, Math.min(1, Math.exp(-(diag / 360)) * 0.85 + 0.15));
          edge.style.setProperty('--rf-atten', atten.toFixed(3));
        } catch (_) { }
      };
      computeAndSetRippleAtten();
      try {
        if (!edge._dev1RippleResizeObserver && typeof ResizeObserver !== 'undefined') {
          const observer = new ResizeObserver(() => computeAndSetRippleAtten());
          observer.observe(box);
          edge._dev1RippleResizeObserver = observer;
        }
      } catch (_) { }
      if (isRainbow) {
        const idx = variant === 'random' ? (Math.abs(this._seedFromId(element.getAttribute('data-highlight-id') || '')) % (this._ripplePalette || []).length) : (this._rbIdxFixed || 0);
        this._applyRipplePaletteIndex(box, idx || 0);
      } else {
        box.removeAttribute('data-rb-variant');
        box.removeAttribute('data-random-seed');
        box.style.removeProperty('--rainbow-delay');
        box.style.removeProperty('--rb-grad-soft');
      }
    }

    getRenderableColor(color, element = null) {
      const raw = safeString(color);
      if (this.isRainbowColor(raw)) {
        return this.getRainbowRepresentativeColor(raw, element);
      }
      if (this.isTransparentColor(raw)) return this.darkModeEnabled ? '#e5e7eb' : '#334155';
      return normalizeCssColor(raw) || raw || '#2196f3';
    }

    getCssColorDataValue(color) {
      const raw = safeString(color).trim();
      const normalized = normalizeCssColor(raw) || raw;
      return safeString(normalized).toLowerCase();
    }

    isFireColor(color) {
      const raw = safeString(color).toLowerCase();
      return ['#ff6347', '#dc143c', '#ff8c00', '#ffd700'].includes(raw);
    }

    isNeonColor(color) {
      const raw = safeString(color).toLowerCase();
      return [
        '#ff0080', '#00ff80', '#8000ff', '#ff4000', '#00ffff',
        '#4b0082', '#ff1493', '#00ced1', '#9400d3',
        '#00ff00', '#ff00ff', '#ffff00'
      ].includes(raw);
    }

    applyMarkdownLikeToolStyle(element, color, tool, textColor, rgba) {
      const id = safeString(tool);
      const isRainbow = this.isRainbowColor(color);
      const isTransparent = this.isTransparentColor(color);
      const renderColor = this.getRenderableColor(color, element);
      const solidColor = renderColor || (this.darkModeEnabled ? '#e5e7eb' : '#334155');
      const readableText = textColor || 'inherit';
      const applyTextColor = () => {
        if (isRainbow) {
          element.style.background = this.buildRainbowGradient(color, element);
          element.style.webkitBackgroundClip = 'text';
          element.style.backgroundClip = 'text';
          element.style.color = 'transparent';
          element.style.webkitTextFillColor = 'transparent';
          return;
        }
        element.style.color = isTransparent ? readableText : solidColor;
      };
      const softBg = isRainbow ? this.buildRainbowGradient(color, element, 0.36) : (isTransparent ? this.neutralColor(0.1, 0.16) : rgba);
      const clearBg = () => {
        element.style.background = 'transparent';
        element.style.backgroundColor = 'transparent';
      };
      switch (id) {
        case 'md-bold':
        case 'md-edit-bold':
          clearBg();
          element.style.fontWeight = '700';
          applyTextColor();
          return true;
        case 'md-italic':
        case 'md-edit-italic':
          clearBg();
          element.style.fontStyle = 'italic';
          applyTextColor();
          return true;
        case 'md-bold-italic':
        case 'md-edit-bold-italic':
          clearBg();
          element.style.fontWeight = '700';
          element.style.fontStyle = 'italic';
          applyTextColor();
          return true;
        case 'md-underline':
          clearBg();
          element.style.color = 'inherit';
          if (isRainbow) {
            element.style.setProperty('text-decoration', 'none', 'important');
            element.style.setProperty('text-decoration-line', 'none', 'important');
            this.renderRainbowLineAfterLayout(element, 'underline', this.ensureRainbowSeed(element, color), { thickness: 2, offset: 2 });
          } else {
            this.removeRainbowLine(element);
            element.style.textDecoration = `underline solid ${solidColor}`;
            element.style.textDecorationThickness = '2px';
            element.style.textUnderlineOffset = '2px';
          }
          return true;
        case 'md-strikethrough':
        case 'md-edit-strikethrough':
          clearBg();
          element.style.color = isRainbow ? 'inherit' : (isTransparent ? readableText : solidColor);
          if (isRainbow) {
            element.style.setProperty('text-decoration', 'none', 'important');
            element.style.setProperty('text-decoration-line', 'none', 'important');
            this.renderRainbowLineAfterLayout(element, 'strikethrough', this.ensureRainbowSeed(element, color), { thickness: 2, position: 'middle' });
          } else {
            this.removeRainbowLine(element);
            element.style.textDecoration = `line-through solid ${solidColor}`;
            element.style.textDecorationThickness = '2px';
          }
          return true;
        case 'md-mark':
        case 'md-edit-mark':
          element.style.background = softBg;
          element.style.borderRadius = '2px';
          element.style.padding = '1px 2px';
          element.style.color = textColor;
          return true;
        case 'md-sup':
        case 'md-edit-sup':
          clearBg();
          element.style.verticalAlign = 'super';
          element.style.fontSize = '0.75em';
          element.style.lineHeight = '0';
          applyTextColor();
          return true;
        case 'md-sub':
        case 'md-edit-sub':
          clearBg();
          element.style.verticalAlign = 'sub';
          element.style.fontSize = '0.75em';
          element.style.lineHeight = '0';
          applyTextColor();
          return true;
        case 'md-edit-h1':
          clearBg();
          element.style.fontSize = '2em';
          element.style.fontWeight = '700';
          applyTextColor();
          return true;
        case 'md-edit-h2':
          clearBg();
          element.style.fontSize = '1.5em';
          element.style.fontWeight = '700';
          applyTextColor();
          return true;
        case 'md-edit-h3':
          clearBg();
          element.style.fontSize = '1.17em';
          element.style.fontWeight = '700';
          applyTextColor();
          return true;
        case 'md-edit-ul':
        case 'md-edit-ol':
        case 'md-edit-task':
          clearBg();
          element.style.color = !isRainbow && !isTransparent ? solidColor : readableText;
          element.style.paddingLeft = '2px';
          return true;
        case 'md-edit-quote':
          clearBg();
          element.style.borderLeft = `3px solid ${solidColor}`;
          element.style.paddingLeft = '8px';
          element.style.color = 'inherit';
          return true;
        case 'md-edit-code':
        case 'md-edit-code-inline':
          element.style.background = this.darkModeEnabled ? 'rgba(45,45,45,.92)' : 'rgba(244,244,244,.96)';
          element.style.border = `1px solid ${this.hexToRgba(solidColor, isTransparent ? 0.35 : 0.45)}`;
          element.style.borderRadius = '4px';
          element.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
          element.style.padding = id === 'md-edit-code' ? '4px 6px' : '1px 4px';
          element.style.color = isTransparent ? readableText : solidColor;
          return true;
        case 'md-edit-hr':
          clearBg();
          element.style.borderBottom = `2px solid ${solidColor}`;
          element.style.paddingBottom = '2px';
          element.style.color = 'transparent';
          return true;
        case 'md-edit-link':
          clearBg();
          element.style.color = solidColor;
          element.style.textDecoration = `underline solid ${solidColor}`;
          element.style.textUnderlineOffset = '2px';
          return true;
        case 'md-edit-image':
        case 'md-edit-table':
          element.style.background = this.hexToRgba(solidColor, isTransparent ? 0.1 : 0.12);
          element.style.border = `1px dashed ${solidColor}`;
          element.style.borderRadius = '4px';
          element.style.padding = '2px 6px';
          element.style.color = isTransparent ? readableText : solidColor;
          return true;
        case 'md-edit-disable-highlight':
          clearBg();
          element.style.outline = '1px dashed rgba(120,130,150,.55)';
          element.style.color = 'inherit';
          return true;
        default:
          return false;
      }
    }

    renderPresentationPenSettings(content, pickerContext = null) {
      const notice = document.createElement('div');
      notice.className = 'dev1-dynamic-mhtml-notice';
      notice.textContent = this.t('presentationNotice');
      content.appendChild(notice);

      const wrapper = document.createElement('div');
      wrapper.className = 'dev1-presentation-pen-settings';

      // Line Style Row
      const rowStyle = document.createElement('div');
      rowStyle.className = 'dev1-presentation-row';
      rowStyle.innerHTML = `
        <span class="dev1-presentation-label">${this.t('presentationLineStyle')}</span>
        <div class="dev1-presentation-options">
          <button class="dev1-presentation-btn ${this.presentationPenStyle === 'solid' ? 'active' : ''}" data-style="solid" type="button">${this.t('presentationLineSolid')}</button>
          <button class="dev1-presentation-btn ${this.presentationPenStyle === 'dashed' ? 'active' : ''}" data-style="dashed" type="button">${this.t('presentationLineDashed')}</button>
        </div>
      `;
      wrapper.appendChild(rowStyle);

      // Disappear Delay Row
      const isImmediately = this.presentationPenDisappearImmediately;
      const rowDisappear = document.createElement('div');
      rowDisappear.className = 'dev1-presentation-row';
      rowDisappear.innerHTML = `
        <span class="dev1-presentation-label">${this.t('presentationDisappearTime')}</span>
        <div class="dev1-presentation-options">
          <button class="dev1-presentation-btn ${isImmediately ? 'active' : ''}" data-disappear="immediately" type="button">${this.t('presentationDisappearImmediately')}</button>
          <button class="dev1-presentation-btn ${!isImmediately ? 'active' : ''}" data-disappear="delay" type="button">${this.t('presentationDisappearDelay')}</button>
          <div class="dev1-presentation-input-wrap" style="display: ${isImmediately ? 'none' : 'inline-flex'};">
            <input type="number" class="dev1-presentation-input" min="100" max="10000" step="100" value="${this.presentationPenDisappearDelay}" />
            <span class="dev1-presentation-unit">ms</span>
          </div>
        </div>
      `;
      wrapper.appendChild(rowDisappear);

      // Shape Recognition Row
      const rowShape = document.createElement('div');
      rowShape.className = 'dev1-presentation-row';
      rowShape.innerHTML = `
        <span class="dev1-presentation-label">${this.t('presentationAutoShape')}</span>
        <div class="dev1-presentation-options">
          <button class="dev1-presentation-btn ${this.presentationPenAutoRecognize ? 'active' : ''}" data-shape="enable" type="button">${this.t('presentationShapeEnable')}</button>
          <button class="dev1-presentation-btn ${!this.presentationPenAutoRecognize ? 'active' : ''}" data-shape="disable" type="button">${this.t('presentationShapeDisable')}</button>
        </div>
      `;
      wrapper.appendChild(rowShape);

      const tipShape = document.createElement('div');
      tipShape.className = 'dev1-presentation-tip';
      tipShape.textContent = this.t('presentationShapeTip');
      wrapper.appendChild(tipShape);

      content.appendChild(wrapper);

      // Event Listeners for UI
      rowStyle.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const style = btn.getAttribute('data-style');
          this.presentationPenStyle = style;
          rowStyle.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === btn));
          this.requestSave(true);
        });
      });

      const immediatelyBtn = rowDisappear.querySelector('[data-disappear="immediately"]');
      const delayBtn = rowDisappear.querySelector('[data-disappear="delay"]');
      const inputWrap = rowDisappear.querySelector('.dev1-presentation-input-wrap');
      const numInput = rowDisappear.querySelector('.dev1-presentation-input');

      immediatelyBtn.addEventListener('click', () => {
        this.presentationPenDisappearImmediately = true;
        immediatelyBtn.classList.add('active');
        delayBtn.classList.remove('active');
        inputWrap.style.display = 'none';
        this.requestSave(true);
      });

      delayBtn.addEventListener('click', () => {
        const val = parseFloat(numInput.value) || 2000;
        this.presentationPenDisappearDelay = Math.max(100, Math.min(10000, val));
        this.presentationPenDisappearImmediately = false;
        immediatelyBtn.classList.remove('active');
        delayBtn.classList.add('active');
        inputWrap.style.display = 'inline-flex';
        this.requestSave(true);
      });

      numInput.addEventListener('change', () => {
        let val = parseFloat(numInput.value);
        if (isNaN(val)) val = 2000;
        val = Math.max(100, Math.min(10000, val));
        numInput.value = val;
        this.presentationPenDisappearDelay = val;
        this.requestSave(true);
      });

      const enableShapeBtn = rowShape.querySelector('[data-shape="enable"]');
      const disableShapeBtn = rowShape.querySelector('[data-shape="disable"]');

      enableShapeBtn.addEventListener('click', () => {
        this.presentationPenAutoRecognize = true;
        enableShapeBtn.classList.add('active');
        disableShapeBtn.classList.remove('active');
        this.requestSave(true);
      });

      disableShapeBtn.addEventListener('click', () => {
        this.presentationPenAutoRecognize = false;
        enableShapeBtn.classList.remove('active');
        disableShapeBtn.classList.add('active');
        this.requestSave(true);
      });
    }

    getPresentationPenColor() {
      let color = this.currentColor;
      if (this.isRainbowColor(color)) {
        if (this.getRainbowVariant(color) === 'random') {
          const palette = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7ff', '#007aff', '#af52de'];
          if (!this._presentationRandomColor) {
            this._presentationRandomColor = palette[Math.floor(Math.random() * palette.length)];
          }
          return this._presentationRandomColor;
        } else {
          return 'url(#dev1-presentation-rainbow-gradient)';
        }
      }
      if (this.isTransparentColor(color)) {
        return 'rgba(148, 163, 184, 0.6)';
      }
      return color;
    }

    ensurePresentationOverlay() {
      let overlay = document.getElementById('dev1-presentation-pen-overlay');
      if (!overlay) {
        overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        overlay.id = 'dev1-presentation-pen-overlay';
        overlay.setAttribute('style', 'position: absolute !important; inset: 0 !important; width: 100% !important; height: 100% !important; z-index: 2147483500 !important; pointer-events: none !important; overflow: visible !important; border: none !important; background: transparent !important; margin: 0 !important; padding: 0 !important;');
        
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.id = 'dev1-presentation-rainbow-gradient';
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '100%');
        
        const colors = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7ff', '#007aff', '#af52de'];
        colors.forEach((color, index) => {
          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop.setAttribute('offset', `${(index / (colors.length - 1)) * 100}%`);
          stop.setAttribute('stop-color', color);
          gradient.appendChild(stop);
        });
        
        defs.appendChild(gradient);
        overlay.appendChild(defs);
        document.body.appendChild(overlay);
      }
      try {
        const bodyHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.offsetHeight,
          document.body.clientHeight,
          document.documentElement.clientHeight
        );
        const bodyWidth = Math.max(
          document.body.scrollWidth,
          document.documentElement.scrollWidth,
          document.body.offsetWidth,
          document.documentElement.offsetWidth,
          document.body.clientWidth,
          document.documentElement.clientWidth
        );
        overlay.style.width = `${bodyWidth}px`;
        overlay.style.height = `${bodyHeight}px`;
      } catch (_) {}
      return overlay;
    }

    handlePresentationPointerDown(event) {
      if (this.currentTool !== 'presentation-pen') return;
      if (!this.visible || this.restoreDisplayOnly) return;
      
      // Ignore clicks on our UI
      if (this._isPluginUiNode(event)) return;
      
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      
      event.preventDefault();
      event.stopPropagation();
      
      this._presentationPoints = [{ x: event.pageX, y: event.pageY }];
      this._presentationRandomColor = null; // resets for each stroke
      
      const overlay = this.ensurePresentationOverlay();
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('fill', 'none');
      
      if (this.presentationPenStyle === 'dashed') {
        path.setAttribute('stroke-dasharray', '8, 8');
      }
      
      const strokeColor = this.getPresentationPenColor();
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('stroke-width', '3.5');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      
      this._presentationCurrentPath = path;
      overlay.appendChild(path);
      
      this.updatePresentationPath();
      
      const moveHandler = (e) => {
        e.preventDefault();
        if (this._presentationPoints) {
          this._presentationPoints.push({ x: e.pageX, y: e.pageY });
          this.updatePresentationPath();
        }
      };
      
      const upHandler = (e) => {
        window.removeEventListener('pointermove', moveHandler, true);
        window.removeEventListener('pointerup', upHandler, true);
        window.removeEventListener('pointercancel', upHandler, true);
        
        this.finalizePresentationDrawing();
      };
      
      window.addEventListener('pointermove', moveHandler, true);
      window.addEventListener('pointerup', upHandler, true);
      window.addEventListener('pointercancel', upHandler, true);
    }

    updatePresentationPath() {
      if (!this._presentationCurrentPath || !this._presentationPoints || !this._presentationPoints.length) return;
      const pts = this._presentationPoints;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x} ${pts[i].y}`;
      }
      this._presentationCurrentPath.setAttribute('d', d);
    }

    finalizePresentationDrawing() {
      if (!this._presentationCurrentPath || !this._presentationPoints || !this._presentationPoints.length) return;
      
      let finalElement = this._presentationCurrentPath;
      
      if (this.presentationPenAutoRecognize) {
        const recognized = this.recognizeShape(this._presentationPoints);
        if (recognized) {
          const overlay = this.ensurePresentationOverlay();
          const shapeEl = this.createSvgShapeElement(recognized);
          if (shapeEl) {
            overlay.appendChild(shapeEl);
            this._presentationCurrentPath.remove();
            finalElement = shapeEl;
          }
        }
      }
      
      this._presentationCurrentPath = null;
      this._presentationPoints = null;
      
      if (this.presentationPenDisappearImmediately) {
        setTimeout(() => {
          finalElement.remove();
        }, 100);
      } else {
        const delay = this.presentationPenDisappearDelay;
        setTimeout(() => {
          finalElement.style.transition = 'opacity 0.3s ease-in-out';
          finalElement.style.opacity = '0';
          setTimeout(() => {
            finalElement.remove();
          }, 350);
        }, delay);
      }
    }

    createSvgShapeElement(shape) {
      const color = this.getPresentationPenColor();
      const style = this.presentationPenStyle;
      let el = null;
      
      if (shape.type === 'line') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        el.setAttribute('x1', shape.x1);
        el.setAttribute('y1', shape.y1);
        el.setAttribute('x2', shape.x2);
        el.setAttribute('y2', shape.y2);
      } else if (shape.type === 'circle') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        el.setAttribute('cx', shape.cx);
        el.setAttribute('cy', shape.cy);
        el.setAttribute('r', shape.r);
        el.setAttribute('fill', color);
        el.setAttribute('fill-opacity', '0.12');
      } else if (shape.type === 'rectangle') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        el.setAttribute('x', shape.x);
        el.setAttribute('y', shape.y);
        el.setAttribute('width', shape.w);
        el.setAttribute('height', shape.h);
        el.setAttribute('rx', '4');
        el.setAttribute('ry', '4');
        el.setAttribute('fill', color);
        el.setAttribute('fill-opacity', '0.12');
      } else if (shape.type === 'triangle' || shape.type === 'star') {
        el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const pointsStr = shape.points.map(p => `${p.x},${p.y}`).join(' ');
        el.setAttribute('points', pointsStr);
        el.setAttribute('fill', color);
        el.setAttribute('fill-opacity', '0.12');
      }
      
      if (el) {
        el.setAttribute('stroke', color);
        el.setAttribute('stroke-width', '3.5');
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        if (style === 'dashed') {
          el.setAttribute('stroke-dasharray', '8, 8');
        }
      }
      return el;
    }

    recognizeShape(points) {
      if (points.length < 6) return null;

      // Helper to check if two line segments (a1, a2) and (b1, b2) intersect
      const segmentsIntersect = (a1, a2, b1, b2) => {
        const det = (a2.x - a1.x) * (b2.y - b1.y) - (a2.y - a1.y) * (b2.x - b1.x);
        if (det === 0) return false;
        const lambda = ((b2.y - b1.y) * (b2.x - a1.x) + (b1.x - b2.x) * (b2.y - a1.y)) / det;
        const gamma = ((a1.y - a2.y) * (b2.x - a1.x) + (a2.x - a1.x) * (b2.y - a1.y)) / det;
        return (0.01 < lambda && lambda < 0.99) && (0.01 < gamma && gamma < 0.99);
      };

      // Helper to count self-intersections in a path
      const countSelfIntersections = (pts) => {
        let count = 0;
        const n = pts.length;
        for (let i = 0; i < n - 2; i++) {
          for (let j = i + 2; j < n; j++) {
            if (i === 0 && j === n - 1) continue;
            if (segmentsIntersect(pts[i], pts[i+1], pts[j], pts[(j+1)%n])) {
              count++;
            }
          }
        }
        return count;
      };

      const distToSeg = (p, v, w) => {
        const l2 = (v.x - w.x)**2 + (v.y - w.y)**2;
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
      };

      const rdpRun = (pts, epsilon) => {
        if (pts.length <= 2) return pts;
        let maxD = 0, idx = 0;
        const end = pts.length - 1;
        for (let i = 1; i < end; i++) {
          const d = distToSeg(pts[i], pts[0], pts[end]);
          if (d > maxD) {
            idx = i;
            maxD = d;
          }
        }
        if (maxD > epsilon) {
          const r1 = rdpRun(pts.slice(0, idx + 1), epsilon);
          const r2 = rdpRun(pts.slice(idx), epsilon);
          return r1.slice(0, r1.length - 1).concat(r2);
        } else {
          return [pts[0], pts[end]];
        }
      };

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const p of points) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
      }

      const w = maxX - minX;
      const h = maxY - minY;
      const diag = Math.hypot(w, h);

      if (diag < 15) return null;

      let sumX = 0, sumY = 0;
      for (const p of points) {
        sumX += p.x;
        sumY += p.y;
      }
      const cx = sumX / points.length;
      const cy = sumY / points.length;

      const start = points[0];
      const end = points[points.length - 1];
      const distStartEnd = Math.hypot(end.x - start.x, end.y - start.y);

      let pathLength = 0;
      for (let i = 1; i < points.length; i++) {
        pathLength += Math.hypot(points[i].x - points[i-1].x, points[i].y - points[i-1].y);
      }

      // 1. Line check
      if (distStartEnd > 50 && pathLength / distStartEnd < 1.35) {
        let maxDev = 0;
        for (const p of points) {
          const d = distToSeg(p, start, end);
          if (d > maxDev) maxDev = d;
        }
        if (maxDev < 35 || maxDev / distStartEnd < 0.22) {
          return { type: 'line', x1: start.x, y1: start.y, x2: end.x, y2: end.y };
        }
      }

      // 2. Pentagram self-intersection check (one-stroke star)
      const simplifiedForIntersections = rdpRun(points, diag * 0.04);
      const selfIntersects = countSelfIntersections(simplifiedForIntersections);

      if (selfIntersects >= 3 && selfIntersects <= 8) {
        const R_outer = diag / 2;
        const R_inner = R_outer * 0.4;
        let maxDist = 0;
        let anchorIdx = 0;
        for (let i = 0; i < simplifiedForIntersections.length; i++) {
          const d = Math.hypot(simplifiedForIntersections[i].x - cx, simplifiedForIntersections[i].y - cy);
          if (d > maxDist) {
            maxDist = d;
            anchorIdx = i;
          }
        }
        const anchor = simplifiedForIntersections[anchorIdx];
        const theta_offset = Math.atan2(anchor.y - cy, anchor.x - cx);

        const starPoints = [];
        for (let k = 0; k < 10; k++) {
          const angle = theta_offset + (k * Math.PI) / 5;
          const r = k % 2 === 0 ? R_outer : R_inner;
          starPoints.push({
            x: cx + r * Math.cos(angle),
            y: cy + r * Math.sin(angle)
          });
        }
        return { type: 'star', points: starPoints };
      }

      const isClosed = distStartEnd < 100 || distStartEnd / diag < 0.50;
      if (!isClosed) return null;

      // 3. Compute Shoelace Area and Area Ratio
      let area = 0;
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];
        const p2 = points[(i + 1) % points.length];
        area += p1.x * p2.y - p2.x * p1.y;
      }
      area = Math.abs(area) / 2;
      const areaRatio = area / (w * h);

      // 4. Compute circularity (RDP simplified lightly to remove noise)
      const simplifiedForCirc = rdpRun(points, diag * 0.025);
      let simplifiedArea = 0;
      for (let i = 0; i < simplifiedForCirc.length; i++) {
        const p1 = simplifiedForCirc[i];
        const p2 = simplifiedForCirc[(i + 1) % simplifiedForCirc.length];
        simplifiedArea += p1.x * p2.y - p2.x * p1.y;
      }
      simplifiedArea = Math.abs(simplifiedArea) / 2;

      let simplifiedPerimeter = 0;
      for (let i = 1; i < simplifiedForCirc.length; i++) {
        simplifiedPerimeter += Math.hypot(simplifiedForCirc[i].x - simplifiedForCirc[i-1].x, simplifiedForCirc[i].y - simplifiedForCirc[i-1].y);
      }
      const circularity = simplifiedPerimeter > 0 ? (4 * Math.PI * simplifiedArea) / (simplifiedPerimeter * simplifiedPerimeter) : 0;

      const dists = points.map(p => Math.hypot(p.x - cx, p.y - cy));
      const avgR = dists.reduce((a, b) => a + b, 0) / dists.length;
      const variance = dists.reduce((sum, d) => sum + (d - avgR)**2, 0) / dists.length;
      const stdDev = Math.sqrt(variance);
      const coeffOfVariation = stdDev / avgR;
      const aspect = w / h;

      // RDP simplification for triangle and rectangle detection
      const simplifiedPol = rdpRun(points, diag * 0.045);
      const verts = [...simplifiedPol];
      if (verts.length > 2) {
        if (distStartEnd < diag * 0.25) {
          verts.pop();
        }
      }

      // Circle Check:
      // - Area ratio is close to pi/4 (~0.785)
      // - Aspect ratio is close to 1.0
      // - Circularity is high
      if (areaRatio >= 0.65 && areaRatio <= 0.85 && aspect >= 0.70 && aspect <= 1.43 && circularity > 0.65) {
        return { type: 'circle', cx, cy, r: avgR };
      }

      // Ellipse Check (Morphed to Rectangle):
      // - Area ratio is close to pi/4
      // - Aspect ratio is squashed
      // - Circularity is moderate-to-high
      if (areaRatio >= 0.62 && areaRatio <= 0.85 && circularity > 0.58) {
        if ((aspect >= 0.35 && aspect < 0.70) || (aspect > 1.43 && aspect <= 2.8)) {
          return { type: 'rectangle', x: minX, y: minY, w, h };
        }
      }

      // Rectangle Check:
      // - Area ratio is very high (close to 1.0)
      // - Or simplified to 4 vertices
      if (areaRatio >= 0.82 || (verts.length === 4 && areaRatio >= 0.72)) {
        return { type: 'rectangle', x: minX, y: minY, w, h };
      }

      // Triangle Check:
      // - Area ratio is close to 0.50
      // - Or simplified to 3 vertices
      if ((areaRatio >= 0.35 && areaRatio <= 0.65 && circularity < 0.68) || verts.length === 3) {
        return { type: 'triangle', points: verts };
      }

      // 4. Peak-valley analysis for star outlines
      const smoothedDists = [];
      const windowSize = Math.max(2, Math.floor(points.length / 25));
      for (let i = 0; i < points.length; i++) {
        let sum = 0, count = 0;
        for (let j = -windowSize; j <= windowSize; j++) {
          const idx = (i + j + points.length) % points.length;
          sum += Math.hypot(points[idx].x - cx, points[idx].y - cy);
          count++;
        }
        smoothedDists.push(sum / count);
      }

      const peaks = [];
      const peakWindow = Math.max(4, Math.floor(points.length / 10));
      const circDist = (idx1, idx2) => Math.min(Math.abs(idx1 - idx2), points.length - Math.abs(idx1 - idx2));

      for (let i = 0; i < points.length; i++) {
        let isPeak = true;
        const val = smoothedDists[i];
        for (let j = -peakWindow; j <= peakWindow; j++) {
          if (j === 0) continue;
          const idx = (i + j + points.length) % points.length;
          if (smoothedDists[idx] > val) {
            isPeak = false;
            break;
          }
        }
        if (isPeak) {
          if (peaks.every(p => circDist(i, p.index) > peakWindow)) {
            peaks.push({ index: i, val });
          }
        }
      }

      if (peaks.length === 5) {
        const avgPeakDist = peaks.reduce((sum, p) => sum + p.val, 0) / 5;
        let sumValley = 0, valleyCount = 0;
        for (let i = 0; i < 5; i++) {
          const p1 = peaks[i].index;
          const p2 = peaks[(i + 1) % 5].index;
          let minVal = Infinity;
          let startIdx = p1;
          let endIdx = p2;
          if (startIdx > endIdx) endIdx += points.length;
          for (let j = startIdx; j <= endIdx; j++) {
            const val = smoothedDists[j % points.length];
            if (val < minVal) minVal = val;
          }
          if (minVal !== Infinity) {
            sumValley += minVal;
            valleyCount++;
          }
        }
        const avgValleyDist = valleyCount > 0 ? sumValley / valleyCount : avgPeakDist * 0.4;
        const ratio = avgPeakDist / avgValleyDist;

        if (ratio > 1.25) {
          const R_outer = avgPeakDist;
          const R_inner = R_outer * 0.45;
          const firstPeakIndex = peaks[0].index;
          const firstPeakPoint = points[firstPeakIndex];
          const theta_offset = Math.atan2(firstPeakPoint.y - cy, firstPeakPoint.x - cx);

          const starPoints = [];
          for (let k = 0; k < 10; k++) {
            const angle = theta_offset + (k * Math.PI) / 5;
            const r = k % 2 === 0 ? R_outer : R_inner;
            starPoints.push({
              x: cx + r * Math.cos(angle),
              y: cy + r * Math.sin(angle)
            });
          }
          return { type: 'star', points: starPoints };
        }
      }

      // Fallback
      if (areaRatio >= 0.68 && areaRatio <= 0.86) {
        if (aspect >= 0.70 && aspect <= 1.43) {
          return { type: 'circle', cx, cy, r: avgR };
        } else {
          return { type: 'rectangle', x: minX, y: minY, w, h };
        }
      }

      return null;
    }

    isRainbowColor(color) {
      return safeString(color).startsWith('special:rainbow');
    }

    getRainbowVariant(color) {
      return /random/i.test(safeString(color)) ? 'random' : 'fixed';
    }

    getRainbowPalette(color = '', element = null) {
      const palette = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7ff', '#007aff', '#af52de'];
      if (!this.isRainbowColor(color) || this.getRainbowVariant(color) !== 'random') return palette;
      const seed = this.ensureRainbowSeed(element, color);
      const offset = Math.abs(seed) % palette.length;
      return palette.slice(offset).concat(palette.slice(0, offset));
    }

    ensureRainbowSeed(element, color = '') {
      if (!this.isRainbowColor(color)) return 0;
      const variant = this.getRainbowVariant(color);
      if (!element || typeof element.getAttribute !== 'function') return variant === 'fixed' ? 0 : this._seedFromId(`${this.currentUrl}:${color}`);
      if (variant === 'fixed') {
        try { element.setAttribute('data-random-seed', '0'); } catch (_) { }
        return 0;
      }
      const existing = Number(element.getAttribute('data-random-seed'));
      if (Number.isFinite(existing) && existing > 0) return existing;
      const id = safeString(element.getAttribute('data-highlight-id'));
      const text = safeString(element.textContent).slice(0, 80);
      const seed = this._seedFromId(id || `${this.currentUrl}:${text}:${color}`) || 137;
      try { element.setAttribute('data-random-seed', String(seed)); } catch (_) { }
      return seed;
    }

    seedFromString(value) {
      const raw = hashUrl(safeString(value));
      const seed = parseInt(raw.slice(0, 10), 36);
      return Number.isFinite(seed) ? Math.abs(seed) : 0;
    }

    _seedFromId(id = '') {
      try {
        let s = 0;
        const text = safeString(id);
        for (let i = 0; i < text.length; i += 1) {
          s = (s * 131 + text.charCodeAt(i)) | 0;
        }
        s = Math.abs(s % 360);
        return s === 0 ? 137 : s;
      } catch (_) {
        return Math.floor(Math.random() * 359) + 1;
      }
    }

    getRainbowRepresentativeColor(color, element = null) {
      const palette = this.getRainbowPalette(color, element);
      const seed = this.ensureRainbowSeed(element, color);
      return palette[Math.abs(seed || 0) % palette.length] || palette[0];
    }

    buildRainbowStops(color = '', element = null, alpha = 1) {
      const palette = this.getRainbowPalette(color, element);
      const colors = palette.concat(palette[0]);
      return colors.map(item => alpha >= 1 ? item : rgbaFromHex(item, alpha)).join(', ');
    }

    _buildRainbowGradient(element, seed = 0, bands = null, alphaOverride = null) {
      const textLen = safeString(element && element.textContent).trim().length;
      const steps = bands || Math.max(18, Math.min(36, Math.floor((textLen || 8) * 1.2)));
      let s = (seed || 0) >>> 0;
      const rnd = () => {
        s ^= s << 13;
        s ^= s >>> 17;
        s ^= s << 5;
        return ((s >>> 0) / 4294967296);
      };
      const phase = seed ? rnd() * 360 : 0;
      const alpha = typeof alphaOverride === 'number'
        ? Math.min(1, Math.max(0, alphaOverride))
        : 0.98;
      const alphaStr = alpha.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
      const ease = x => x * x * (3 - 2 * x);
      const stops = [];
      for (let i = 0; i < steps; i += 1) {
        const t = steps <= 1 ? 0 : i / (steps - 1);
        const jitter = seed ? (Math.sin(t * Math.PI * 1.5 + phase / 57.2958) * 8) : 0;
        let hue = (t * 360 + phase + jitter) % 360;
        if (hue < 0) hue += 360;
        const sat = 72 + Math.round(12 * ease(0.5 + (Math.sin((t + 0.1) * Math.PI * 2) * 0.5)));
        const lig = 64 + Math.round(6 * ease(0.5 + (Math.cos((t + 0.15) * Math.PI * 2) * 0.5)));
        const pos = (t * 100).toFixed(2);
        stops.push(`hsla(${Math.round(hue)}, ${sat}%, ${lig}%, ${alphaStr}) ${pos}%`);
      }
      const angleDeg = seed ? `${(Math.abs(seed) % 360) || 1}deg` : '90deg';
      return `linear-gradient(${angleDeg}, ${stops.join(', ')})`;
    }

    _buildRainbowGradientPreview(seed = 0) {
      return this._buildRainbowGradient({ textContent: 'preview' }, Math.floor(Number(seed) || 0), 5);
    }

    buildRainbowGradient(color = '', element = null, alpha = 1) {
      const seed = this.ensureRainbowSeed(element, color);
      const alphaOverride = typeof alpha === 'number' ? alpha : null;
      return this._buildRainbowGradient(element || { textContent: '' }, seed, null, alphaOverride);
    }

    isTransparentColor(color) {
      try {
        const raw = safeString(color).trim().toLowerCase();
        if (!raw) return false;
        if (raw === 'transparent') return true;
        const rgba = raw.match(/^rgba\s*\(([^)]+)\)$/);
        if (!rgba) return false;
        const parts = rgba[1].split(',').map(part => Number(part.trim()));
        return parts.length >= 4 && Number.isFinite(parts[3]) && parts[3] <= 0;
      } catch (_) {
        return false;
      }
    }

    neutralColor(lightAlpha = 0.14, darkAlpha = 0.2) {
      return this.darkModeEnabled
        ? `rgba(226, 232, 240, ${darkAlpha})`
        : `rgba(15, 23, 42, ${lightAlpha})`;
    }

    hexToRgba(color, alpha) {
      const normalized = normalizeCssColor(color);
      if (/^#[0-9a-f]{3}$/i.test(normalized)) {
        const expanded = `#${normalized.slice(1).split('').map(ch => ch + ch).join('')}`;
        return rgbaFromHex(expanded, alpha);
      }
      if (/^#[0-9a-f]{6}$/i.test(normalized)) return rgbaFromHex(normalized, alpha);
      const [r, g, b] = parseCssColor(normalized || color);
      return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
    }

    interpolateColor(colorA, colorB, progress = 0) {
      const [r1, g1, b1] = parseCssColor(colorA);
      const [r2, g2, b2] = parseCssColor(colorB);
      const t = Math.max(0, Math.min(1, Number(progress) || 0));
      const toHex = value => Math.round(Math.max(0, Math.min(255, value))).toString(16).padStart(2, '0');
      return `#${toHex(r1 + (r2 - r1) * t)}${toHex(g1 + (g2 - g1) * t)}${toHex(b1 + (b2 - b1) * t)}`;
    }

    updateCursorStyle() {
      try {
        if (this._mdEditModeActive) {
          this._stopCursorAnimation();
          const dynamicCursor = document.getElementById('dynamic-cursor-style');
          if (dynamicCursor) dynamicCursor.remove();
          if (document.body) {
            document.body.classList.remove('highlighter-cursor');
            document.body.classList.add('suppress-cursor');
          }
          return;
        }
        if (!this.visible || !this.cursorEnabled || !document.body) {
          this.removeCursorStyle();
          return;
        }
        document.body.classList.add('highlighter-cursor');
        const activeColor = this._cursorColorOverride || this.currentColor || '#69C0FF';
        if (this.isRainbowColor(activeColor) && this.getRainbowVariant(activeColor) === 'random') {
          this._startCursorAnimation(activeColor);
          return;
        }
        this._stopCursorAnimation();
        this._applyDynamicCursorCss(activeColor);
      } catch (_) { }
    }

    pulseCursorFeedback(color = '#22c55e', duration = 220) {
      try {
        const previous = this._cursorColorOverride;
        this._cursorColorOverride = color;
        this.updateCursorStyle();
        setTimeout(() => {
          if (this._cursorColorOverride === color) {
            this._cursorColorOverride = previous || '';
            this.updateCursorStyle();
          }
        }, Math.max(80, Number(duration) || 220));
      } catch (_) { }
    }

    _suppressCursor(reason = 'generic') {
      try {
        this._cursorSuppressors.add(String(reason));
        if (document.body) document.body.classList.add('suppress-cursor');
      } catch (_) { }
    }

    _releaseCursor(reason = 'generic') {
      try {
        this._cursorSuppressors.delete(String(reason));
        if (this._cursorSuppressors.size === 0 && document.body) {
          if (this._mdEditModeActive) {
            document.body.classList.add('suppress-cursor');
            return;
          }
          document.body.classList.remove('suppress-cursor');
          this.updateCursorStyle();
        }
      } catch (_) { }
    }

    _scheduleReleaseCursor(reason = 'generic', delay = 90) {
      try {
        const key = String(reason);
        if (this._releaseTimers.has(key)) clearTimeout(this._releaseTimers.get(key));
        const timer = setTimeout(() => {
          this._releaseTimers.delete(key);
          this._releaseCursor(key);
        }, Math.max(0, delay));
        this._releaseTimers.set(key, timer);
      } catch (_) { }
    }

    _isPluginUiNode(node) {
      try {
        if (!node) return false;
        const path = typeof node.composedPath === 'function' ? node.composedPath() : [];
        if (Array.isArray(path) && path.some(item => item && item.nodeType === Node.ELEMENT_NODE && item.matches && item.matches(UI_SELECTOR))) {
          return true;
        }
        const el = elementFromNode(node.target || node);
        return !!(el && el.closest && el.closest(UI_SELECTOR));
      } catch (_) {
        return false;
      }
    }

    _handleGlobalPointerMove(event) {
      if (!this.visible) return;
      if (this._isPluginUiNode(event)) {
        this._suppressCursor('plugin-ui');
      } else {
        this._releaseCursor('plugin-ui');
        this._releaseCursor('hoverUI');
        this._ensureCursorVisibleOnWeb();
      }
    }

    _queueCursorEnsure(delay = 0) {
      try {
        if (this._cursorEnsureTimer) clearTimeout(this._cursorEnsureTimer);
        this._cursorEnsureTimer = setTimeout(() => {
          this._cursorEnsureTimer = null;
          this._ensureCursorVisibleOnWeb();
        }, Math.max(0, Number(delay) || 0));
      } catch (_) { }
    }

    _ensureCursorVisibleOnWeb() {
      try {
        if (!this.visible || this.restoreDisplayOnly || !this.cursorEnabled || !document.body || this._mdEditModeActive) return;
        if (this._cursorSuppressors.size > 0) return;
        document.body.classList.remove('suppress-cursor');
        if (!document.body.classList.contains('highlighter-cursor')) {
          document.body.classList.add('highlighter-cursor');
        }
        this._ensureDynamicCursorStyle();
      } catch (_) { }
    }

    _ensureDynamicCursorStyle() {
      try {
        const style = document.getElementById('dynamic-cursor-style');
        if (!style || style.disabled || !style.textContent || !style.textContent.includes('cursor: url')) {
          this.updateCursorStyle();
        }
      } catch (_) { }
    }

    _attachCursorWatchers() {
      try {
        const head = document.head || document.getElementsByTagName('head')[0];
        if (head && !this._cursorHeadObserver && typeof MutationObserver !== 'undefined') {
          this._cursorHeadObserver = new MutationObserver(() => {
            const style = document.getElementById('dynamic-cursor-style');
            if (!style || style.disabled || !style.textContent) this._queueCursorEnsure();
          });
          this._cursorHeadObserver.observe(head, { childList: true, subtree: true, characterData: true });
        }

        const ensure = () => this._queueCursorEnsure();
        if (!this._cursorLifecycleListeners.length) {
          this._cursorLifecycleListeners = [
            [document, 'selectionchange', ensure, { passive: true }],
            [document, 'visibilitychange', ensure, { passive: true }],
            [window, 'pageshow', ensure, false],
            [window, 'focus', ensure, false],
            [window, 'resize', ensure, { passive: true }],
            [window, 'scroll', ensure, { passive: true }]
          ];
          this._cursorLifecycleListeners.forEach(([target, type, listener, options]) => {
            try { target.addEventListener(type, listener, options); } catch (_) { }
          });
        }

        if (!this.cursorPointerOverListener) {
          this.cursorPointerOverListener = (event) => {
            if (!this.visible || this.restoreDisplayOnly) return;
            if (this._isPluginUiNode(event)) {
              this._suppressCursor('plugin-ui');
              return;
            }
            this._releaseCursor('plugin-ui');
            this._releaseCursor('hoverUI');
            this._ensureCursorVisibleOnWeb();
          };
          document.addEventListener('pointerover', this.cursorPointerOverListener, true);
        }
        if (!this.cursorPointerUpListener) {
          this.cursorPointerUpListener = () => {
            if (!this.visible || this.restoreDisplayOnly) return;
            this._releaseCursor('plugin-ui');
            this._releaseCursor('hoverUI');
            this._ensureCursorVisibleOnWeb();
          };
          document.addEventListener('pointerup', this.cursorPointerUpListener, true);
        }
      } catch (_) { }
    }

    _detachCursorWatchers() {
      try {
        if (this._cursorHeadObserver) {
          this._cursorHeadObserver.disconnect();
          this._cursorHeadObserver = null;
        }
      } catch (_) { }
      try {
        this._cursorLifecycleListeners.forEach(([target, type, listener, options]) => {
          try { target.removeEventListener(type, listener, options); } catch (_) { }
        });
        this._cursorLifecycleListeners = [];
      } catch (_) { }
      try {
        if (this.cursorPointerOverListener) {
          document.removeEventListener('pointerover', this.cursorPointerOverListener, true);
          this.cursorPointerOverListener = null;
        }
        if (this.cursorPointerUpListener) {
          document.removeEventListener('pointerup', this.cursorPointerUpListener, true);
          this.cursorPointerUpListener = null;
        }
      } catch (_) { }
      try {
        if (this._cursorEnsureTimer) clearTimeout(this._cursorEnsureTimer);
        this._cursorEnsureTimer = null;
      } catch (_) { }
    }

    removeCursorStyle() {
      try { this._stopCursorAnimation(); } catch (_) { }
      try {
        this._releaseTimers.forEach(timer => clearTimeout(timer));
        this._releaseTimers.clear();
        this._cursorSuppressors.clear();
      } catch (_) { }
      try {
        if (document.body) {
          document.body.classList.remove('highlighter-cursor');
          document.body.classList.remove('suppress-cursor');
          document.body.style.removeProperty('cursor');
        }
      } catch (_) { }
      try {
        const style = document.getElementById('dynamic-cursor-style');
        if (style) style.remove();
      } catch (_) { }
    }

    getCursorSvgFillColor(color, normalizedColor = '') {
      const fallback = '#69C0FF';
      try {
        const raw = safeString(color).trim();
        const normalized = safeString(normalizedColor).trim();
        if (this.isTransparentColor(raw) || this.isTransparentColor(normalized)) return fallback;
        if (this.isRainbowColor(raw)) return fallback;
        if (normalized) return normalized;
        if (/^#|^rgb/i.test(raw)) return raw;
        return fallback;
      } catch (_) {
        return fallback;
      }
    }

    getCursorSvgOutlineColor(fillColor, isRainbow = false) {
      try {
        if (isRainbow) return this.darkModeEnabled ? '#ffffff' : '#0f172a';
        return luminance(fillColor) > 0.55 ? '#0f172a' : '#ffffff';
      } catch (_) {
        return '#0f172a';
      }
    }

    _buildHighlighterCursorSvg(color, animationFrame = 0) {
      try {
        const rawColor = safeString(color);
        const isRainbow = this.isRainbowColor(rawColor);
        const isRainbowRandom = isRainbow && this.getRainbowVariant(rawColor) === 'random';
        const normalized = normalizeCssColor(rawColor);
        const fill = this.getCursorSvgFillColor(rawColor, normalized);
        let defs = '';

        if (isRainbow) {
          if (isRainbowRandom) {
            const sequence = [
              '#ff3b30', '#ff6b47', '#ff9500', '#ffb347',
              '#ffcc00', '#e6d83d', '#bde65d', '#34c759',
              '#47d4a6', '#00c7ff', '#47a3ff', '#007aff',
              '#4f7aff', '#af52de', '#d452a6', '#ff3b6b'
            ];
            const frame = Number(animationFrame) || 0;
            const getStopColor = (index) => {
              const speeds = [0.8, 1.0, 0.6, 0.9, 1.1, 0.7, 0.95];
              const offsets = [0, 3, 7, 2, 9, 5, 11];
              const position = (frame * speeds[index % speeds.length] + offsets[index % offsets.length]) % sequence.length;
              const current = Math.floor(position) % sequence.length;
              const next = (current + 1) % sequence.length;
              return this.interpolateColor(sequence[current], sequence[next], position - Math.floor(position));
            };
            const stops = [0, 1, 2, 3, 4, 5, 6].map(getStopColor);
            defs = `
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="${stops[0]}"/>
                  <stop offset="16%" stop-color="${stops[1]}"/>
                  <stop offset="32%" stop-color="${stops[2]}"/>
                  <stop offset="48%" stop-color="${stops[3]}"/>
                  <stop offset="64%" stop-color="${stops[4]}"/>
                  <stop offset="80%" stop-color="${stops[5]}"/>
                  <stop offset="100%" stop-color="${stops[6]}"/>
                </linearGradient>
                <radialGradient id="g2" cx="50%" cy="30%" r="80%">
                  <stop offset="0%" stop-color="${stops[2]}" stop-opacity="0.8"/>
                  <stop offset="50%" stop-color="${stops[0]}" stop-opacity="0.6"/>
                  <stop offset="100%" stop-color="${stops[4]}" stop-opacity="0.4"/>
                </radialGradient>
              </defs>
            `;
          } else {
            defs = `
              <defs>
                <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#ff3b30"/>
                  <stop offset="16%" stop-color="#ff9500"/>
                  <stop offset="32%" stop-color="#ffcc00"/>
                  <stop offset="48%" stop-color="#34c759"/>
                  <stop offset="64%" stop-color="#00c7ff"/>
                  <stop offset="80%" stop-color="#007aff"/>
                  <stop offset="100%" stop-color="#af52de"/>
                </linearGradient>
              </defs>
            `;
          }
        }

        const faPath = 'M0 479.98L99.92 512l35.45-35.45-67.04-67.04L0 479.98zm124.61-240.01a36.592 36.592 0 0 0-10.79 38.1l13.05 42.83-50.93 50.94 96.23 96.23 50.86-50.86 42.74 13.08c13.73 4.2 28.65-.01 38.15-10.78l35.55-41.64-173.34-173.34-41.52 35.44zm403.31-160.7l-63.2-63.2c-20.49-20.49-53.38-21.52-75.12-2.35L190.55 183.68l169.77 169.78L530.27 154.4c19.18-21.74 18.15-54.63-2.35-75.13z';
        const bodyFill = isRainbow ? 'url(#g)' : (fill || '#69C0FF');
        const outlinePrimary = this.getCursorSvgOutlineColor(fill, isRainbow);
        const outlineSecondary = outlinePrimary === '#ffffff' ? '#0f172a' : '#ffffff';
        const outlineElements = `<path d="${faPath}" fill="none" stroke="${outlineSecondary}" stroke-width="48" stroke-linejoin="round" stroke-linecap="round" opacity="0.74"/><path d="${faPath}" fill="none" stroke="${outlinePrimary}" stroke-width="26" stroke-linejoin="round" stroke-linecap="round" opacity="0.9"/>`;
        const pathElements = isRainbowRandom
          ? `${outlineElements}<path d="${faPath}" fill="${bodyFill}" opacity="1"/><path d="${faPath}" fill="url(#g2)" opacity="0.7"/>`
          : `${outlineElements}<path d="${faPath}" fill="${bodyFill}"/>`;
        const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 544 512">${defs}${pathElements}</svg>`;
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
      } catch (_) {
        const fallback = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><circle cx="10" cy="10" r="7" fill="#69C0FF" stroke="#2c3e50" stroke-width="2"/></svg>';
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(fallback)))}`;
      }
    }

    async _applyDynamicCursorCss(color, animationFrame = 0) {
      try {
        if (this._mdEditModeActive || !this.visible || !this.cursorEnabled) return;
        const url = await this._resolveCursorUrl(color, animationFrame);
        if (this._mdEditModeActive || !this.visible || !this.cursorEnabled) return;
        let style = document.getElementById('dynamic-cursor-style');
        if (!style) {
          style = document.createElement('style');
          style.id = 'dynamic-cursor-style';
          document.head.appendChild(style);
        }
        style.textContent = `
body.highlighter-cursor:not(.suppress-cursor), body.highlighter-cursor:not(.suppress-cursor) * {
  cursor: url("${url}") 5 20, auto !important;
}
body.highlighter-cursor:not(.suppress-cursor) .custom-highlight.dev1-snapshot-highlight[data-dev1-snapshot-highlighter="true"],
body.highlighter-cursor:not(.suppress-cursor) .custom-highlight.dev1-snapshot-highlight[data-dev1-snapshot-highlighter="true"] *,
body.highlighter-cursor:not(.suppress-cursor) .dev1-highlight-note-static {
  cursor: url("${url}") 5 20, auto !important;
}
body.highlighter-cursor:not(.suppress-cursor) [data-dev1-snapshot-highlighter-ui="true"],
body.highlighter-cursor:not(.suppress-cursor) [data-dev1-snapshot-highlighter-ui="true"] *,
body.highlighter-cursor:not(.suppress-cursor) .dev1-snapshot-highlighter-panel,
body.highlighter-cursor:not(.suppress-cursor) .dev1-snapshot-highlighter-panel * {
  cursor: default !important;
}
body.highlighter-cursor:not(.suppress-cursor) [data-dev1-snapshot-highlighter-ui="true"] button,
body.highlighter-cursor:not(.suppress-cursor) .dev1-snapshot-highlighter-btn,
body.highlighter-cursor:not(.suppress-cursor) .permanent-toolbar-indicator {
  cursor: pointer !important;
}
body.highlighter-cursor:not(.suppress-cursor) .toolbar-drag-handle,
body.highlighter-cursor:not(.suppress-cursor) .toolbar-drag-handle * {
  cursor: grab !important;
}
body.highlighter-cursor:not(.suppress-cursor) #dev1-snapshot-highlighter-toolbar.is-dragging,
body.highlighter-cursor:not(.suppress-cursor) #dev1-snapshot-highlighter-toolbar.is-dragging * {
  cursor: grabbing !important;
}
`;
      } catch (_) { }
    }

    async _resolveCursorUrl(color, animationFrame = 0) {
      const dynamicUrl = this._buildHighlighterCursorSvg(color, animationFrame);
      try {
        const blocked = await this._siteBlocksDataUrlForCursor();
        if (!blocked) return dynamicUrl;
      } catch (_) {
        return dynamicUrl;
      }
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.getURL === 'function') {
          const isRed = safeString(color).toLowerCase().startsWith('#ff');
          return chrome.runtime.getURL(isRed
            ? 'dev_1/snapshot_highlighter/assets/highlighter-red.svg'
            : 'dev_1/snapshot_highlighter/assets/highlighter.svg');
        }
      } catch (_) { }
      return dynamicUrl;
    }

    async _siteBlocksDataUrlForCursor() {
      if (this._dataUrlBlockedForCursor !== undefined) return this._dataUrlBlockedForCursor;
      if (this._dataUrlBlockedForCursorPromise) return this._dataUrlBlockedForCursorPromise;
      this._dataUrlBlockedForCursorPromise = new Promise((resolve) => {
        try {
          const testData = "data:image/svg+xml;utf8,<?xml version='1.0' encoding='UTF-8'?><svg xmlns='http://www.w3.org/2000/svg' width='2' height='2' viewBox='0 0 2 2'><rect width='2' height='2' fill='%23000'/></svg>";
          const probe = document.createElement('div');
          probe.style.cursor = `url(${testData}) 0 0, auto`;
          probe.style.position = 'fixed';
          probe.style.left = '-9999px';
          probe.style.top = '-9999px';
          document.body.appendChild(probe);
          const applied = (window.getComputedStyle(probe).cursor || '').toLowerCase();
          probe.remove();
          const cssOk = applied.includes('url(');
          const img = new Image();
          let settled = false;
          const finish = (imgOk) => {
            if (settled) return;
            settled = true;
            this._dataUrlBlockedForCursor = !(cssOk || imgOk);
            this._dataUrlBlockedForCursorPromise = null;
            resolve(this._dataUrlBlockedForCursor);
          };
          img.onload = () => finish(true);
          img.onerror = () => finish(false);
          setTimeout(() => finish(false), 300);
          img.src = testData;
        } catch (_) {
          this._dataUrlBlockedForCursor = false;
          this._dataUrlBlockedForCursorPromise = null;
          resolve(false);
        }
      });
      return this._dataUrlBlockedForCursorPromise;
    }

    _startCursorAnimation(color) {
      const key = safeString(color);
      if (this._cursorAnimationTimer && this._isRainbowCursorActive && this._cursorAnimationColor === key) return;
      this._stopCursorAnimation();
      this._isRainbowCursorActive = true;
      this._cursorAnimationColor = key;
      this._cursorAnimationFrame = 0;
      this._applyDynamicCursorCss(key, this._cursorAnimationFrame);
      this._cursorAnimationTimer = setInterval(() => {
        if (document.hidden || !this.visible) return;
        this._cursorAnimationFrame = (this._cursorAnimationFrame + 0.25) % 360;
        this._applyDynamicCursorCss(key, this._cursorAnimationFrame);
      }, 30);
    }

    _stopCursorAnimation() {
      if (this._cursorAnimationTimer) {
        clearInterval(this._cursorAnimationTimer);
        this._cursorAnimationTimer = null;
      }
      this._isRainbowCursorActive = false;
      this._cursorAnimationColor = '';
    }

    isPageDarkMode() {
      return !!this.darkModeEnabled;
    }

    ensureGlobalDefs() {
      if (this._globalDefsSvg && document.body.contains(this._globalDefsSvg)) return this._globalDefsSvg;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'dev1-global-rb-defs');
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.style.width = '0';
      svg.style.height = '0';
      svg.style.overflow = 'hidden';
      svg.style.pointerEvents = 'none';
      svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
      document.body.appendChild(svg);
      this._globalDefsSvg = svg;
      return svg;
    }

    getRainbowGradientId(seedVal = 0) {
      try {
        const svg = this.ensureGlobalDefs();
        const defs = svg.querySelector('defs');
        const seed = Math.abs(Number(seedVal) || 0);
        const id = `dev1RbGradSeed_${seed}`;
        if (defs.querySelector(`#${CSS.escape(id)}`)) return id;
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', id);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '0%');
        const steps = 18;
        const phase = seed ? seed % 360 : 0;
        for (let i = 0; i < steps; i += 1) {
          const t = i / (steps - 1);
          const hue = Math.round((phase + t * 360) % 360);
          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop.setAttribute('offset', `${(t * 100).toFixed(2)}%`);
          stop.setAttribute('stop-color', `hsl(${hue}, 82%, 64%)`);
          gradient.appendChild(stop);
        }
        defs.appendChild(gradient);
        return id;
      } catch (_) {
        return 'dev1RbGradSeed_0';
      }
    }

    getMonoGradientId(color, isTransparent) {
      try {
        const svg = this.ensureGlobalDefs();
        const defs = svg.querySelector('defs');
        const cleanColor = color.replace(/[^a-zA-Z0-9]/g, '');
        const id = `dev1MonoGrad_${cleanColor}_${isTransparent ? 't' : 'o'}`;
        if (defs.querySelector(`#${CSS.escape(id)}`)) return id;
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        gradient.setAttribute('id', id);
        gradient.setAttribute('x1', '0%');
        gradient.setAttribute('y1', '0%');
        gradient.setAttribute('x2', '100%');
        gradient.setAttribute('y2', '0%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', color);
        stop1.setAttribute('stop-opacity', '0.85');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', color);
        stop2.setAttribute('stop-opacity', isTransparent ? '0.14' : '0.2');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        return id;
      } catch (_) {
        return '';
      }
    }

    getSpotlightGradientId(color, isTransparent) {
      try {
        const svg = this.ensureGlobalDefs();
        const defs = svg.querySelector('defs');
        const cleanColor = color.replace(/[^a-zA-Z0-9]/g, '');
        const id = `dev1SpotGrad_${cleanColor}_${isTransparent ? 't' : 'o'}`;
        if (defs.querySelector(`#${CSS.escape(id)}`)) return id;
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', id);
        gradient.setAttribute('cx', '50%');
        gradient.setAttribute('cy', '50%');
        gradient.setAttribute('r', '70%');
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', color);
        stop1.setAttribute('stop-opacity', isTransparent ? '0.18' : '0.35');
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', color);
        stop2.setAttribute('stop-opacity', '0');
        
        gradient.appendChild(stop1);
        gradient.appendChild(stop2);
        defs.appendChild(gradient);
        return id;
      } catch (_) {
        return '';
      }
    }

    getRainbowRadialGradientId(seedVal = 0) {
      try {
        const svg = this.ensureGlobalDefs();
        const defs = svg.querySelector('defs');
        const seed = Math.abs(Number(seedVal) || 0);
        const id = `dev1RbRadialGradSeed_${seed}`;
        if (defs.querySelector(`#${CSS.escape(id)}`)) return id;
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'radialGradient');
        gradient.setAttribute('id', id);
        gradient.setAttribute('cx', '50%');
        gradient.setAttribute('cy', '50%');
        gradient.setAttribute('r', '70%');
        const steps = 18;
        const phase = seed ? seed % 360 : 0;
        for (let i = 0; i < steps; i += 1) {
          const t = i / (steps - 1);
          const hue = Math.round((phase + t * 360) % 360);
          const stop = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
          stop.setAttribute('offset', `${(t * 100).toFixed(2)}%`);
          stop.setAttribute('stop-color', `hsl(${hue}, 82%, 64%)`);
          stop.setAttribute('stop-opacity', String((1 - t) * 0.35));
          gradient.appendChild(stop);
        }
        defs.appendChild(gradient);
        return id;
      } catch (_) {
        return 'dev1RbRadialGradSeed_0';
      }
    }

    ensureSharedResizeObserver() {
      if (this._sharedRO) return this._sharedRO;
      try {
        this._sharedRO = new ResizeObserver(entries => {
          entries.forEach(entry => {
            const el = entry.target;
            if (el && el._dev1RbLineMeta) this._pendingRainbowRenders.add(el);
          });
          if (this._rafRainbowScheduled) return;
          this._rafRainbowScheduled = true;
          requestAnimationFrame(() => {
            this._rafRainbowScheduled = false;
            const items = Array.from(this._pendingRainbowRenders);
            this._pendingRainbowRenders.clear();
            items.forEach(el => this._rerenderRainbowLineElement(el));
          });
        });
      } catch (_) {
        this._sharedRO = null;
      }
      return this._sharedRO;
    }

    renderRainbowLineAfterLayout(element, kind, seed = 0, opts = {}) {
      if (!element) return;
      try { element._dev1RbLineMeta = { kind, seed, opts }; } catch (_) { }
      const ro = this.ensureSharedResizeObserver();
      try { if (ro) ro.observe(element); } catch (_) { }
      requestAnimationFrame(() => this._renderRainbowLine(element, kind, seed, opts));
    }

    _rerenderRainbowLineElement(element) {
      try {
        const meta = element && element._dev1RbLineMeta;
        if (!meta) return;
        this._renderRainbowLine(element, meta.kind, meta.seed, meta.opts || {});
      } catch (_) { }
    }

    removeRainbowLine(element, clearMeta = true) {
      if (!element) return;
      try { element.querySelectorAll(':scope > .rb-line-ov').forEach(node => node.remove()); } catch (_) { }
      if (clearMeta) {
        try { delete element._dev1RbLineMeta; } catch (_) { }
      }
    }

    _renderRainbowLine(element, kind, seed = 0, opts = {}) {
      if (!element || !document.body.contains(element)) return;
      this.removeRainbowLine(element, false);
      const rect = element.getBoundingClientRect();
      if (!rect || rect.width <= 1 || rect.height <= 1) return;
      let rects = [];
      try {
        const range = document.createRange();
        range.selectNodeContents(element);
        rects = Array.from(range.getClientRects()).filter(r => r.width > 1 && r.height > 1);
        range.detach();
      } catch (_) { }
      if (!rects.length) rects = [rect];
      if (!element.style.position || element.style.position === 'static') element.style.position = 'relative';
      try {
        element.style.boxDecorationBreak = 'clone';
        element.style.webkitBoxDecorationBreak = 'clone';
      } catch (_) { }
      const overlay = document.createElement('span');
      overlay.className = 'rb-line-ov';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.style.position = 'absolute';
      overlay.style.left = '0';
      overlay.style.top = '0';
      overlay.style.width = `${Math.max(1, rect.width)}px`;
      overlay.style.height = `${Math.max(1, rect.height)}px`;
      overlay.style.pointerEvents = 'none';
      overlay.style.overflow = 'visible';
      overlay.style.zIndex = '2';
      const gradientId = this.getRainbowGradientId(seed);
      const thickness = Math.max(1, Number(opts.thickness || 2));
      const gap = Math.max(1, Number(opts.gap || 3));
      const amp = Math.max(1, Number(opts.amplitude || 2));
      const period = Math.max(8, Number(opts.period || 12));
      const offset = Number(opts.offset || 2);
      const makeWavyPath = (width, y) => {
        let d = `M 0 ${y}`;
        for (let x = 0; x < width; x += period) {
          const x1 = Math.min(width, x + period / 2);
          const x2 = Math.min(width, x + period);
          d += ` C ${x + period / 4} ${y - amp}, ${x1 - period / 4} ${y - amp}, ${x1} ${y}`;
          d += ` S ${x2 - period / 4} ${y + amp}, ${x2} ${y}`;
        }
        return d;
      };
      rects.forEach(lineRect => {
        const width = Math.max(1, lineRect.width);
        const height = Math.max(1, lineRect.height + offset + thickness + gap + amp * 2);
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', String(width));
        svg.setAttribute('height', String(height));
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.position = 'absolute';
        svg.style.left = `${lineRect.left - rect.left}px`;
        svg.style.top = `${lineRect.top - rect.top}px`;
        svg.style.overflow = 'visible';
        const y = opts.position === 'middle'
          ? Math.max(thickness, lineRect.height / 2)
          : Math.max(thickness, lineRect.height + offset);
        const stroke = `url(#${gradientId})`;
        const drawLine = (yPos, dash = '') => {
          const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          line.setAttribute('x1', '0');
          line.setAttribute('x2', String(width));
          line.setAttribute('y1', String(yPos));
          line.setAttribute('y2', String(yPos));
          line.setAttribute('stroke', stroke);
          line.setAttribute('stroke-width', String(thickness));
          line.setAttribute('stroke-linecap', 'round');
          if (dash) line.setAttribute('stroke-dasharray', dash);
          svg.appendChild(line);
        };
        if (kind === 'wavy') {
          const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', makeWavyPath(width, y));
          path.setAttribute('fill', 'none');
          path.setAttribute('stroke', stroke);
          path.setAttribute('stroke-width', String(thickness));
          path.setAttribute('stroke-linecap', 'round');
          svg.appendChild(path);
        } else if (kind === 'double') {
          drawLine(y, '');
          drawLine(y + gap + thickness, '');
        } else if (kind === 'dotted') {
          drawLine(y, `0 ${Math.max(4, thickness * 3)}`);
        } else if (kind === 'dashed') {
          drawLine(y, `${Math.max(6, thickness * 4)} ${Math.max(4, thickness * 2)}`);
        } else {
          drawLine(y, '');
        }
        overlay.appendChild(svg);
      });
      element.appendChild(overlay);
    }

    ensureFrameOverlayLayer() {
      if (this.frameOverlayLayer && document.body.contains(this.frameOverlayLayer)) return this.frameOverlayLayer;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('id', 'frame-overlay-layer');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
      svg.style.position = 'absolute';
      svg.style.left = '0';
      svg.style.top = '0';
      svg.style.pointerEvents = 'none';
      svg.style.setProperty('z-index', '2147483602', 'important');
      document.body.appendChild(svg);
      this.frameOverlayLayer = svg;
      this.updateFrameOverlayLayerSize();
      return svg;
    }

    ensureHtmlOverlayLayer() {
      if (this.htmlOverlayLayer && document.body.contains(this.htmlOverlayLayer)) return this.htmlOverlayLayer;
      const div = document.createElement('div');
      div.setAttribute('id', 'html-overlay-layer');
      div.style.position = 'absolute';
      div.style.left = '0';
      div.style.top = '0';
      div.style.pointerEvents = 'none';
      div.style.setProperty('z-index', '2147483602', 'important');
      document.body.appendChild(div);
      this.htmlOverlayLayer = div;
      return div;
    }

    updateFrameOverlayLayerSize() {
      if (!this.frameOverlayLayer) return;
      const helperZoom = Math.max(0.001, this._getFrameViewBoxZoom());
      const invZoom = 1 / helperZoom;
      const docWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth, window.innerWidth);
      const docHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, window.innerHeight);
      const viewWidth = docWidth * invZoom;
      const viewHeight = docHeight * invZoom;
      this.frameOverlayLayer.style.setProperty('width', `${docWidth}px`, 'important');
      this.frameOverlayLayer.style.setProperty('height', `${docHeight}px`, 'important');
      this.frameOverlayLayer.setAttribute('width', String(docWidth));
      this.frameOverlayLayer.setAttribute('height', String(docHeight));
      this.frameOverlayLayer.setAttribute('viewBox', `0 0 ${viewWidth} ${viewHeight}`);
      this.frameOverlayLayer.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    }

    _getFrameViewBoxZoom() {
      try {
        const helperZoom = getDocumentZoom();
        const stored = Number(this._visualZoomScale);
        const base = Number.isFinite(helperZoom) && helperZoom > 0
          ? helperZoom
          : (Number.isFinite(stored) && stored > 0 ? stored : 1);
        const viewportScale = window.visualViewport && Number(window.visualViewport.scale) ? Number(window.visualViewport.scale) : 1;
        return Math.max(0.001, (Number(base) || 1) * (Number(viewportScale) || 1));
      } catch (_) {
        return 1;
      }
    }

    _getRootCssZoom() {
      try {
        const doc = document && document.documentElement;
        if (!doc) return 1;
        const computedZoom = Number(window.getComputedStyle(doc).zoom);
        if (Number.isFinite(computedZoom) && computedZoom > 0) return computedZoom;
        const styleZoom = Number(doc.style && doc.style.zoom);
        if (Number.isFinite(styleZoom) && styleZoom > 0) return styleZoom;
      } catch (_) { }
      return 1;
    }

    _getOverallVisualZoom() {
      try {
        const helperZoom = getDocumentZoom();
        const stored = Number(this._visualZoomScale);
        const base = Number.isFinite(helperZoom) && helperZoom > 0
          ? helperZoom
          : (Number.isFinite(stored) && stored > 0 ? stored : 1);
        const cssZoom = this._getRootCssZoom();
        const viewportScale = window.visualViewport && Number(window.visualViewport.scale) ? Number(window.visualViewport.scale) : 1;
        return Math.max(0.001, (Number(base) || 1) * (Number(cssZoom) || 1) * (Number(viewportScale) || 1));
      } catch (_) {
        return 1;
      }
    }

    computeLineBoxesForGroup(gid) {
      const elems = this.getGroupElements(gid);
      if (!elems.length) return [];
      const rects = [];
      elems.forEach(el => {
        try {
          const range = document.createRange();
          range.selectNodeContents(el);
          Array.from(range.getClientRects()).forEach(rect => {
            if (rect.width > 1 && rect.height > 1) {
              rects.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
            }
          });
          range.detach();
        } catch (_) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 1 && rect.height > 1) {
            rects.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
          }
        }
      });
      rects.sort((a, b) => a.top - b.top || a.left - b.left);
      const lines = [];
      const thresholdY = 2.5;
      rects.forEach(rect => {
        const line = lines.find(item => !(rect.bottom < item.top || rect.top > item.bottom)
          || Math.abs(rect.top - item.top) <= thresholdY
          || Math.abs(rect.bottom - item.bottom) <= thresholdY);
        if (line) {
          line.left = Math.min(line.left, rect.left);
          line.right = Math.max(line.right, rect.right);
          line.top = Math.min(line.top, rect.top);
          line.bottom = Math.max(line.bottom, rect.bottom);
        } else {
          lines.push({ ...rect });
        }
      });
      lines.sort((a, b) => a.top - b.top || a.left - b.left);
      lines._rawRectCount = rects.length;
      lines._distinctLineCount = lines.length;
      return lines;
    }

    computeLineBoxesForRange(range) {
      if (!range) return [];
      const rects = [];
      try {
        Array.from(range.getClientRects()).forEach(rect => {
          if (rect.width > 1 && rect.height > 1) {
            rects.push({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom });
          }
        });
      } catch (_) { }
      rects.sort((a, b) => a.top - b.top || a.left - b.left);
      const lines = [];
      const thresholdY = 2.5;
      rects.forEach(rect => {
        const line = lines.find(item => !(rect.bottom < item.top || rect.top > item.bottom)
          || Math.abs(rect.top - item.top) <= thresholdY
          || Math.abs(rect.bottom - item.bottom) <= thresholdY);
        if (line) {
          line.left = Math.min(line.left, rect.left);
          line.right = Math.max(line.right, rect.right);
          line.top = Math.min(line.top, rect.top);
          line.bottom = Math.max(line.bottom, rect.bottom);
        } else {
          lines.push({ ...rect });
        }
      });
      lines.sort((a, b) => a.top - b.top || a.left - b.left);
      lines._rawRectCount = rects.length;
      lines._distinctLineCount = lines.length;
      return lines;
    }

    cacheGroupLineBoxesFromRange(gid, range) {
      if (!gid || !range) return;
      try {
        const lines = this.computeLineBoxesForRange(range);
        if (!lines.length) return;
        const scrollX = window.scrollX || window.pageXOffset || 0;
        const scrollY = window.scrollY || window.pageYOffset || 0;
        const linesDoc = lines.map(line => ({
          left: line.left + scrollX,
          right: line.right + scrollX,
          top: line.top + scrollY,
          bottom: line.bottom + scrollY
        }));
        this.groupFrameGeometries.set(gid, {
          linesDoc,
          distinctLines: lines._distinctLineCount || lines.length,
          rawRectCount: lines._rawRectCount || lines.length
        });
      } catch (_) { }
    }

    buildSteppedOutlinePath(lines) {
      if (!Array.isArray(lines) || !lines.length) return '';
      const sorted = lines.slice().sort((a, b) => a.top - b.top || a.left - b.left);
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      let d = `M ${first.left} ${first.top} H ${first.right}`;
      for (let i = 1; i < sorted.length; i += 1) {
        const prev = sorted[i - 1];
        const cur = sorted[i];
        d += ` V ${prev.bottom}`;
        if (cur.right !== prev.right) d += ` H ${cur.right}`;
      }
      d += ` V ${last.bottom} H ${last.left}`;
      for (let i = sorted.length - 2; i >= 0; i -= 1) {
        const next = sorted[i + 1];
        const cur = sorted[i];
        d += ` V ${next.top}`;
        if (cur.left !== next.left) d += ` H ${cur.left}`;
      }
      d += ` V ${first.top} Z`;
      return d;
    }

    refreshGroupEffects(gid, toolId, color) {
      requestAnimationFrame(() => {
        this.applyGroupFrameOverlayIfNeeded(gid, toolId, color);
        this.getGroupElements(gid).forEach(el => this.scheduleElementEffectRefresh(el, toolId, color));
      });
    }

    scheduleElementEffectRefresh(element, toolId, color) {
      if (!element) return;
      if (this.isRainbowColor(color)) {
        const tool = safeString(toolId);
        const lineTools = {
          underline: ['underline', { thickness: 2, offset: 2 }],
          'double-underline': ['double', { thickness: 2, gap: 3, offset: 2 }],
          wavy: ['wavy', { thickness: 2, amplitude: 2.2, period: 12, offset: 3 }],
          dotted: ['dotted', { thickness: 2, offset: 2 }],
          dashed: ['dashed', { thickness: 2, offset: 2 }],
          'thick-underline': ['underline', { thickness: 4, offset: 3 }],
          strikethrough: ['strikethrough', { thickness: 2, position: 'middle' }],
          'md-underline': ['underline', { thickness: 2, offset: 2 }],
          'md-strikethrough': ['strikethrough', { thickness: 2, position: 'middle' }],
          'md-edit-strikethrough': ['strikethrough', { thickness: 2, position: 'middle' }]
        };
        const meta = lineTools[tool];
        if (meta) this.renderRainbowLineAfterLayout(element, meta[0], this.ensureRainbowSeed(element, color), meta[1]);
      }
    }

    applyGroupFrameOverlayIfNeeded(gid, toolId, color, retryLevel = 0) {
      const tool = safeString(toolId || 'highlight');
      if (retryLevel > 3) return;
      const overlayTools = new Set([
        'box', 'filled-box', 'rounded-box', 'dashed-box', 'double-box',
        'brackets-corner', 'brackets-round', 'brackets-angle', 'brackets-book',
        'brackets-cjk', 'brackets-curly', 'brackets-square',
        'running-line', 'ripple',
        'blur', 'mosaic', 'callout', 'sticker', 'neon-blink', 'neon-flicker', 'liquidglass',
        'highlight', 'marker', 'pastel', 'neon', 'transparent', 'highlighter-pen',
        'pill', 'glow', 'rainbow', 'spotlight', 'gradient'
      ]);
      if (!gid || !overlayTools.has(tool)) {
        this.removeGroupFrameOverlay(gid);
        return;
      }
      const elems = this.getGroupElements(gid);
      if (!elems.length) {
        if (this._creatingHighlightGroupId === gid) return;
        const hasCachedGeometry = this.groupFrameGeometries && this.groupFrameGeometries.has(gid);
        if (hasCachedGeometry && retryLevel < 3) {
          requestAnimationFrame(() => this.applyGroupFrameOverlayIfNeeded(gid, tool, color, retryLevel + 1));
          return;
        }
        this.removeGroupFrameOverlay(gid);
        return;
      }
      const cachedGeometry = this.groupFrameGeometries && this.groupFrameGeometries.get(gid);
      const overallZoom = Math.max(0.001, this._getOverallVisualZoom());
      const invZoom = 1 / overallZoom;
      const useCachedGeometry = tool !== 'running-line'
        && cachedGeometry
        && Array.isArray(cachedGeometry.linesDoc)
        && cachedGeometry.linesDoc.length;
      const rawLines = useCachedGeometry
        ? cachedGeometry.linesDoc.map(line => ({ ...line }))
        : this.computeLineBoxesForGroup(gid);
      if (!rawLines.length) return;
      if (!cachedGeometry && tool !== 'running-line' && this.groupFrameGeometries) {
        try {
          const freezeScrollX = window.scrollX || window.pageXOffset || 0;
          const freezeScrollY = window.scrollY || window.pageYOffset || 0;
          this.groupFrameGeometries.set(gid, {
            linesDoc: rawLines.map(line => ({
              left: line.left + freezeScrollX,
              right: line.right + freezeScrollX,
              top: line.top + freezeScrollY,
              bottom: line.bottom + freezeScrollY
            })),
            distinctLines: rawLines._distinctLineCount || rawLines.length,
            rawRectCount: rawLines._rawRectCount || rawLines.length
          });
        } catch (_) { }
      }
      if (cachedGeometry && cachedGeometry.distinctLines) rawLines._distinctLineCount = cachedGeometry.distinctLines;
      const distinctLines = rawLines._distinctLineCount || rawLines.length;
      const mustUseOverlay = tool === 'running-line' || (distinctLines > 1 && overlayTools.has(tool));
      if (!mustUseOverlay) {
        this.removeGroupFrameOverlay(gid);
        return;
      }

      this.updateFrameOverlayLayerSize();
      const svg = this.ensureFrameOverlayLayer();
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const lines = useCachedGeometry
        ? rawLines.map(line => ({ ...line }))
        : rawLines.map(line => ({
          left: line.left + scrollX,
          right: line.right + scrollX,
          top: line.top + scrollY,
          bottom: line.bottom + scrollY
        }));
      const scaledLines = lines.map(line => ({
          left: line.left * invZoom,
          right: line.right * invZoom,
          top: line.top * invZoom,
          bottom: line.bottom * invZoom
        }));
      const minLeft = Math.min(...scaledLines.map(line => line.left));
      const maxRight = Math.max(...scaledLines.map(line => line.right));
      const minTop = Math.min(...scaledLines.map(line => line.top));
      const maxBottom = Math.max(...scaledLines.map(line => line.bottom));
      const mergedRect = {
        left: minLeft - 6 * invZoom,
        right: maxRight + 6 * invZoom,
        top: minTop - 4 * invZoom,
        bottom: maxBottom + 4 * invZoom
      };
      const runningLineRect = {
        left: minLeft - 6 * invZoom,
        right: maxRight + 6 * invZoom,
        top: minTop - 3 * invZoom,
        bottom: maxBottom + 3 * invZoom
      };

      elems.forEach(el => {
        el.classList.add('group-overlay-active');
        if (tool === 'running-line') {
          el.style.background = 'transparent';
          el.style.backgroundImage = 'none';
          el.style.border = 'none';
          el.style.boxShadow = 'none';
          el.style.padding = '0';
          el.style.animation = 'none';
        }
      });
      if (tool === 'ripple') {
        this._setRippleOverlayClass(elems, true);
        this._renderRippleMergedBoxOverlay(gid, svg, mergedRect, color, invZoom);
        return;
      }
      this._setRippleOverlayClass(elems, false);

      const effectTools = new Set(['blur', 'mosaic', 'callout', 'sticker', 'neon-blink', 'neon-flicker', 'liquidglass']);
      if (effectTools.has(tool)) {
        this._renderEffectMergedBoxOverlay(gid, svg, mergedRect, color, invZoom, tool);
        return;
      }

      let node = this.groupFrameOverlays.get(gid);
      const overlayKind = bracketMapForTool(tool) ? 'brackets' : (tool === 'running-line' ? 'running-line' : `frame-${tool}`);
      if (!node || node.ownerSVGElement !== svg || node.getAttribute('data-kind') !== overlayKind) {
        if (node && node.parentNode) node.parentNode.removeChild(node);
        node = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        node.setAttribute('data-highlight-id', gid);
        node.setAttribute('data-kind', overlayKind);
        node.setAttribute('data-tool', tool);
        svg.appendChild(node);
        this.groupFrameOverlays.set(gid, node);
      }
      if (tool !== 'running-line') {
        while (node.firstChild) node.removeChild(node.firstChild);
      }
      const renderColor = this.getRenderableColor(color, elems[0]);
      const isRainbow = this.isRainbowColor(color);
      const isTransparent = this.isTransparentColor(color);
      const stroke = isRainbow ? `url(#${this.getRainbowGradientId(this.ensureRainbowSeed(elems[0], color))})` : renderColor;
      const solidTools = new Set([
        'highlight', 'marker', 'pastel', 'neon', 'transparent', 'highlighter-pen',
        'rainbow', 'gradient', 'spotlight', 'glow'
      ]);
      const isSolidTool = solidTools.has(tool);
      const mergedFrameTools = new Set([
        'box', 'filled-box', 'rounded-box', 'dashed-box', 'double-box', 'pill',
        ...solidTools
      ]);
      const pathLines = tool === 'running-line'
        ? [runningLineRect]
        : (distinctLines > 1 && mergedFrameTools.has(tool)
          ? [mergedRect]
          : scaledLines.map(line => ({
            left: line.left - 5 * invZoom,
            right: line.right + 5 * invZoom,
            top: line.top - 3 * invZoom,
            bottom: line.bottom - 3 * invZoom
          })));
      const bracketMap = {
        'brackets-corner': ['「', '」'],
        'brackets-round': ['(', ')'],
        'brackets-angle': ['<', '>'],
        'brackets-book': ['《', '》'],
        'brackets-cjk': ['【', '】'],
        'brackets-curly': ['{', '}'],
        'brackets-square': ['[', ']']
      };
      if (bracketMap[tool]) {
        const [leftMark, rightMark] = bracketMap[tool];
        const fontSize = Math.max(18, Math.min(34, (mergedRect.bottom - mergedRect.top) * 0.36));
        [
          { text: leftMark, x: mergedRect.left - fontSize * 0.7, anchor: 'start' },
          { text: rightMark, x: mergedRect.right + fontSize * 0.2, anchor: 'end' }
        ].forEach(item => {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.classList.add('frame-overlay-bracket');
          text.textContent = item.text;
          text.setAttribute('x', String(item.x));
          text.setAttribute('y', String((mergedRect.top + mergedRect.bottom) / 2));
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('text-anchor', item.anchor);
          text.setAttribute('fill', stroke);
          text.setAttribute('font-size', String(fontSize));
          node.appendChild(text);
        });
        this.scheduleGroupFrameOverlayRetry(gid, tool, color, retryLevel);
        return;
      }
      const d = this.buildSteppedOutlinePath(pathLines);
      if (tool === 'running-line') {
        let path = node.querySelector(':scope > path.running-line-overlay-path');
        if (!path) {
          while (node.firstChild) node.removeChild(node.firstChild);
          path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.classList.add('frame-overlay-path', 'tool-running-line', 'running-line-overlay-path');
          path.setAttribute('data-kind', 'running-line');
          path.style.animation = 'dash-move 4s linear infinite';
          node.appendChild(path);
        }
        path.setAttribute('d', d);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', stroke);
        path.setAttribute('stroke-width', '2');
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        path.setAttribute('stroke-dasharray', `${14 * invZoom} ${10 * invZoom}`);
        this.scheduleGroupFrameOverlayRetry(gid, tool, color, retryLevel);
        return;
      }
      const makePath = (className, inset = 0) => {
        let path;
        const isRect = pathLines.length === 1;
        if (isRect) {
          path = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
          const rectLine = pathLines[0];
          const x = rectLine.left + inset;
          const y = rectLine.top + inset;
          const w = Math.max(0, rectLine.right - rectLine.left - 2 * inset);
          const h = Math.max(0, rectLine.bottom - rectLine.top - 2 * inset);
          path.setAttribute('x', String(x));
          path.setAttribute('y', String(y));
          path.setAttribute('width', String(w));
          path.setAttribute('height', String(h));
          if (tool === 'rounded-box') {
            const rx = 6 * invZoom;
            const ry = 6 * invZoom;
            path.setAttribute('rx', String(rx));
            path.setAttribute('ry', String(ry));
          } else if (tool === 'pill') {
            const r = h / 2;
            path.setAttribute('rx', String(r));
            path.setAttribute('ry', String(r));
          }
        } else {
          path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', inset ? this.buildSteppedOutlinePath(pathLines.map(line => ({
            left: line.left + inset,
            right: line.right - inset,
            top: line.top + inset,
            bottom: line.bottom - inset
          }))) : d);
        }
        path.classList.add('frame-overlay-path', className);
        
        let fillVal = 'none';
        let fillOpacityVal = '1';
        let strokeVal = stroke;
        let strokeWidthVal = '2';
        let strokeOpacityVal = '1';
        
        if (isSolidTool) {
          strokeVal = 'none';
          strokeWidthVal = '0';
          if (tool === 'gradient') {
            fillVal = isRainbow
              ? `url(#${this.getRainbowGradientId(this.ensureRainbowSeed(elems[0], color))})`
              : `url(#${this.getMonoGradientId(renderColor, isTransparent)})`;
            fillOpacityVal = isRainbow ? '0.3' : '1';
          } else if (tool === 'spotlight') {
            fillVal = isRainbow
              ? `url(#${this.getRainbowRadialGradientId(this.ensureRainbowSeed(elems[0], color))})`
              : `url(#${this.getSpotlightGradientId(renderColor, isTransparent)})`;
            fillOpacityVal = '1';
          } else if (tool === 'glow') {
            fillVal = stroke;
            fillOpacityVal = '0.08';
            strokeVal = stroke;
            strokeWidthVal = '1';
            strokeOpacityVal = '0.3';
            path.style.filter = `drop-shadow(0 0 ${4 * invZoom}px ${renderColor}) drop-shadow(0 0 ${8 * invZoom}px ${renderColor})`;
          } else {
            fillVal = stroke;
            const opacities = {
              highlight: '0.3',
              marker: '0.4',
              pastel: '0.2',
              neon: '0.35',
              transparent: '0.12',
              'highlighter-pen': '0.28',
              rainbow: '0.3'
            };
            fillOpacityVal = opacities[tool] || '0.3';
          }
        } else {
          if (tool === 'filled-box') {
            fillVal = isRainbow ? this.buildRainbowGradient(color, elems[0], 0.22) : this.hexToRgba(renderColor, 0.18);
          } else if (['box', 'rounded-box', 'dashed-box', 'double-box', 'pill'].includes(tool)) {
            fillVal = isRainbow ? this.buildRainbowGradient(color, elems[0], 0.12) : this.hexToRgba(renderColor, 0.08);
          }
          if (tool === 'dashed-box') {
            path.setAttribute('stroke-dasharray', '8 5');
          }
        }
        
        path.setAttribute('fill', fillVal);
        path.setAttribute('fill-opacity', fillOpacityVal);
        path.setAttribute('stroke', strokeVal);
        path.setAttribute('stroke-width', strokeWidthVal);
        path.setAttribute('stroke-opacity', strokeOpacityVal);
        path.setAttribute('stroke-linejoin', 'round');
        path.setAttribute('stroke-linecap', 'round');
        path.setAttribute('vector-effect', 'non-scaling-stroke');
        node.appendChild(path);
      };
      makePath(`tool-${tool}`);
      if (tool === 'double-box') makePath(`tool-${tool}-inner`, 4);
      this.scheduleGroupFrameOverlayRetry(gid, tool, color, retryLevel);

      function bracketMapForTool(id) {
        return /^brackets-/.test(id);
      }
    }

    scheduleGroupFrameOverlayRetry(gid, tool, color, retryLevel = 0) {
      if (retryLevel !== 0) return;
      requestAnimationFrame(() => {
        try { this.applyGroupFrameOverlayIfNeeded(gid, tool, color, 1); } catch (_) { }
      });
      requestAnimationFrame(() => {
        try { this.applyGroupFrameOverlayIfNeeded(gid, tool, color, 2); } catch (_) { }
      });
    }

    _renderRippleMergedBoxOverlay(gid, svg, rect, color, invZoom = 1) {
      if (!rect) return;
      const htmlContainer = this.ensureHtmlOverlayLayer();
      let node = this.groupFrameOverlays.get(gid);
      if (!node || node.parentNode !== htmlContainer || node.tagName !== 'DIV' || node.getAttribute('data-kind') !== 'ripple') {
        if (node && node.parentNode) node.parentNode.removeChild(node);
        node = document.createElement('div');
        node.setAttribute('data-highlight-id', gid);
        node.setAttribute('data-kind', 'ripple');
        node.style.position = 'absolute';
        node.style.pointerEvents = 'none';
        node.style.overflow = 'visible';
        htmlContainer.appendChild(node);
        const box = document.createElement('div');
        box.className = 'ripple-merged-box';
        const inner = document.createElement('div');
        inner.className = 'ripple-merged-box-inner';
        inner.innerHTML = '<span class="ripple-edge ripple-edge-overlay" aria-hidden="true"></span>';
        box.appendChild(inner);
        node.appendChild(box);
        this.groupFrameOverlays.set(gid, node);
        
        const nowS = (typeof performance !== 'undefined' && performance.now) ? performance.now() / 1000 : Date.now() / 1000;
        box.style.setProperty('--ripple-delay-2s', `-${(nowS % 2).toFixed(3)}s`);
        box.style.setProperty('--ripple-delay-2p4s', `-${(nowS % 2.4).toFixed(3)}s`);
        inner.style.setProperty('--ripple-delay-2s', `-${(nowS % 2).toFixed(3)}s`);
        inner.style.setProperty('--ripple-delay-2p4s', `-${(nowS % 2.4).toFixed(3)}s`);
      }
      const width = Math.max(1, rect.right - rect.left);
      const height = Math.max(1, rect.bottom - rect.top);
      node.style.left = `${rect.left.toFixed(2)}px`;
      node.style.top = `${rect.top.toFixed(2)}px`;
      node.style.width = `${width.toFixed(2)}px`;
      node.style.height = `${height.toFixed(2)}px`;
      const box = node.querySelector('.ripple-merged-box');
      const inner = node.querySelector('.ripple-merged-box-inner');
      if (!box || !inner) return;
      box.style.width = '100%';
      box.style.height = '100%';
      inner.style.width = '100%';
      inner.style.height = '100%';
      let edge = inner.querySelector(':scope > .ripple-edge');
      if (!edge) {
        edge = document.createElement('span');
        edge.className = 'ripple-edge ripple-edge-overlay';
        edge.setAttribute('aria-hidden', 'true');
        inner.appendChild(edge);
      }
      edge.classList.add('ripple-edge-overlay');
      inner.querySelectorAll(':scope > .ripple-edge-tertiary').forEach(node => node.remove());
      edge.style.setProperty('--rfw-strong', '22px');
      edge.style.setProperty('--rf-max-strong', '300px');
      edge.style.setProperty('--rfw-weak', '18px');
      edge.style.setProperty('--rf-max-weak', '210px');
      try {
        const diag = Math.sqrt(Math.max(1e-3, width * width + height * height));
        const atten = Math.max(0.35, Math.min(1, Math.exp(-(diag / 520)) * 0.85 + 0.15));
        box.style.setProperty('--rf-atten', atten.toFixed(3));
        inner.style.setProperty('--rf-atten', atten.toFixed(3));
        edge.style.setProperty('--rf-atten', atten.toFixed(3));
      } catch (_) { }
      const light = !this.isPageDarkMode();
      const alphaLo = light ? '0.55' : '0.40';
      const alphaHi = light ? '0.95' : '0.82';
      box.style.setProperty('--rb-alpha-lo', alphaLo);
      box.style.setProperty('--rb-alpha-hi', alphaHi);
      inner.style.setProperty('--rb-alpha-lo', alphaLo);
      inner.style.setProperty('--rb-alpha-hi', alphaHi);
      inner.style.setProperty('--ripple-y-shift', '0px');
      inner.style.setProperty('--ripple-overlay-blur', `${Math.max(12 * invZoom, 8)}px`);
      const isRainbow = this.isRainbowColor(color);
      const variant = isRainbow ? this.getRainbowVariant(color) : '';
      if (isRainbow) {
        box.dataset.rbVariant = variant;
        inner.dataset.rbVariant = variant;
      } else {
        box.removeAttribute('data-rb-variant');
        box.removeAttribute('data-random-seed');
        inner.removeAttribute('data-rb-variant');
      }
      inner.classList.toggle('ripple-rainbow', isRainbow);
      inner.classList.toggle('ripple-rainbow-random', isRainbow && variant === 'random');
      const rgb = this._colorToRgbTriple(color, gid);
      const rgbValue = `${Math.round(rgb[0])}, ${Math.round(rgb[1])}, ${Math.round(rgb[2])}`;
      box.style.setProperty('--ripple-rgb', rgbValue);
      inner.style.setProperty('--ripple-rgb', rgbValue);
      if (isRainbow) {
        this._ensureRippleGlobalSyncInit();
        const grad = this.buildRainbowGradient(color, this.getGroupElements(gid)[0], 0.3);
        box.style.setProperty('--rb-grad-soft', grad);
        inner.style.setProperty('--rb-grad-soft', grad);
        if (variant === 'random') {
          const seed = this._seedFromId(gid || '');
          box.setAttribute('data-random-seed', String(seed));
          box.style.removeProperty('--rainbow-delay');
        } else {
          box.setAttribute('data-random-seed', '0');
          box.style.removeProperty('--rainbow-delay');
        }
        const idx = variant === 'random' ? (Math.abs(this._seedFromId(gid)) % (this._ripplePalette || []).length) : (this._rbIdxFixed || 0);
        this._applyRipplePaletteIndex(box, idx || 0);
        this._applyRipplePaletteIndex(inner, idx || 0);
      } else {
        box.style.removeProperty('--rb-grad-soft');
        box.style.removeProperty('--rainbow-delay');
        inner.style.removeProperty('--rb-grad-soft');
      }
    }

    _renderEffectMergedBoxOverlay(gid, svg, rect, color, invZoom = 1, toolId = 'blur') {
      if (!rect) return;
      const htmlContainer = this.ensureHtmlOverlayLayer();
      const kind = `effect-${toolId}`;
      let node = this.groupFrameOverlays.get(gid);
      if (!node || node.parentNode !== htmlContainer || node.tagName !== 'DIV' || node.getAttribute('data-kind') !== kind) {
        if (node && node.parentNode) node.parentNode.removeChild(node);
        node = document.createElement('div');
        node.setAttribute('data-highlight-id', gid);
        node.setAttribute('data-kind', kind);
        node.style.position = 'absolute';
        node.style.pointerEvents = 'none';
        node.style.overflow = 'visible';
        htmlContainer.appendChild(node);
        const container = document.createElement('div');
        container.className = 'effect-merged-box';
        const inner = document.createElement('div');
        inner.className = 'effect-merged-box-inner';
        container.appendChild(inner);
        node.appendChild(container);
        this.groupFrameOverlays.set(gid, node);
      }
      const width = Math.max(1, rect.right - rect.left);
      const height = Math.max(1, rect.bottom - rect.top);
      node.style.left = `${rect.left.toFixed(2)}px`;
      node.style.top = `${rect.top.toFixed(2)}px`;
      node.style.width = `${width.toFixed(2)}px`;
      node.style.height = `${height.toFixed(2)}px`;
      const container = node.querySelector('.effect-merged-box');
      const inner = node.querySelector('.effect-merged-box-inner');
      if (!container || !inner) return;
      container.style.width = '100%';
      container.style.height = '100%';
      inner.dataset.effectTool = toolId;
      inner.style.width = '100%';
      inner.style.height = '100%';
      inner.style.position = 'relative';
      const renderColor = this.getRenderableColor(color);
      const isRainbow = this.isRainbowColor(color);
      const isTransparent = this.isTransparentColor(color);
      inner.style.setProperty('--effect-color', renderColor);
      inner.style.setProperty('--effect-rgba', isTransparent ? this.neutralColor(0.16, 0.24) : this.hexToRgba(renderColor, 0.28));
      inner.style.setProperty('--effect-rgba-strong', isTransparent ? this.neutralColor(0.28, 0.38) : this.hexToRgba(renderColor, 0.56));
      inner.style.setProperty('--effect-rb-grad', isRainbow ? this.buildRainbowGradient(color, this.getGroupElements(gid)[0], 0.72) : '');
      inner.style.setProperty('--dev1-highlight-color', renderColor);
      inner.style.setProperty('--dev1-highlight-rgba', isTransparent ? this.neutralColor(0.16, 0.24) : this.hexToRgba(renderColor, 0.28));
      inner.style.setProperty('--rb-grad-soft', isRainbow ? this.buildRainbowGradient(color, this.getGroupElements(gid)[0], 0.36) : '');
      const groupElems = this.getGroupElements(gid);
      const groupRef = groupElems[0] || null;
      const isDarkPage = this.isPageDarkMode();
      const rainbowSoft = isRainbow ? this.buildRainbowGradient(color, groupRef, 0.36) : '';
      const rainbowStrong = isRainbow ? this.buildRainbowGradient(color, groupRef, 0.72) : '';
      inner.style.removeProperty('background-blend-mode');
      inner.style.removeProperty('filter');
      inner.style.removeProperty('transform');
      inner.style.removeProperty('mix-blend-mode');
      inner.style.removeProperty('animation');
      if (toolId === 'blur') {
        const bg = isRainbow
          ? this.buildRainbowGradient(color, groupRef, 0.18)
          : (isTransparent ? (isDarkPage ? 'rgba(15,23,42,0.22)' : 'rgba(255,255,255,0.24)') : this.hexToRgba(renderColor, 0.14));
        const halo = isRainbow
          ? 'rgba(15,23,42,0.28)'
          : (isTransparent ? (isDarkPage ? 'rgba(15,23,42,0.55)' : 'rgba(148,163,184,0.55)') : this.hexToRgba(renderColor, 0.42));
        const border = isRainbow
          ? 'rgba(255,255,255,0.48)'
          : (isTransparent ? (isDarkPage ? 'rgba(148,163,184,0.45)' : 'rgba(148,163,184,0.55)') : this.hexToRgba(renderColor, 0.5));
        inner.style.borderRadius = '14px';
        inner.style.border = `1px solid ${border}`;
        inner.style.background = bg;
        inner.style.boxShadow = `0 14px 32px ${halo}, 0 4px 10px rgba(0,0,0,0.22)`;
        inner.style.backdropFilter = 'none';
        inner.style.webkitBackdropFilter = 'none';
      } else if (toolId === 'mosaic') {
        const cell = isRainbow
          ? 'rgba(255,255,255,0.32)'
          : (isTransparent ? (isDarkPage ? 'rgba(148,163,184,0.5)' : 'rgba(148,163,184,0.6)') : this.hexToRgba(renderColor, 0.42));
        const bg = isRainbow
          ? rainbowSoft
          : (isTransparent ? (isDarkPage ? 'rgba(15,23,42,0.9)' : 'rgba(248,250,252,0.95)') : this.hexToRgba(renderColor, 0.16));
        const bgLayer = isRainbow ? bg : `linear-gradient(${bg}, ${bg})`;
        inner.style.borderRadius = '8px';
        inner.style.background = `
          ${bgLayer},
          repeating-linear-gradient(0deg, ${cell} 0 6px, transparent 6px 12px),
          repeating-linear-gradient(90deg, ${cell} 0 6px, transparent 6px 12px)
        `;
        inner.style.backgroundBlendMode = isRainbow ? 'multiply, normal, normal' : '';
        inner.style.boxShadow = '0 10px 24px rgba(0,0,0,0.25)';
        inner.style.backdropFilter = 'blur(4px) saturate(1.1)';
        inner.style.webkitBackdropFilter = 'blur(4px) saturate(1.1)';
      } else if (toolId === 'callout') {
        const bg = isRainbow ? rainbowSoft : (isTransparent ? (isDarkPage ? 'rgba(15,23,42,0.9)' : 'rgba(248,250,252,0.98)') : this.hexToRgba(renderColor, 0.12));
        const border = isRainbow ? renderColor : (isTransparent ? (isDarkPage ? '#60a5fa' : '#2563eb') : this.hexToRgba(renderColor, 0.9));
        inner.style.borderRadius = '6px';
        inner.style.border = 'none';
        inner.style.borderLeft = `4px solid ${border}`;
        inner.style.background = bg;
        inner.style.boxShadow = '0 8px 20px rgba(0,0,0,0.18)';
      } else if (toolId === 'sticker') {
        const border = isRainbow ? renderColor : (isTransparent ? '#f59e0b' : this.hexToRgba(renderColor, 0.9));
        inner.style.borderRadius = '10px';
        inner.style.border = `2px dashed ${border}`;
        inner.style.background = isRainbow
          ? `linear-gradient(135deg, rgba(255,255,255,.88), rgba(255,255,255,.72)), ${rainbowSoft}`
          : '#fffbe6';
        inner.style.backgroundBlendMode = isRainbow ? 'multiply' : '';
        inner.style.boxShadow = '0 10px 26px rgba(0,0,0,0.22)';
        inner.style.transformOrigin = 'center center';
        inner.style.transform = 'none';
      } else if (toolId === 'liquidglass') {
        let glassBg = '';
        if (isRainbow) {
          glassBg = `
            linear-gradient(135deg, rgba(255,255,255,0.42), rgba(255,255,255,0.08) 42%, rgba(255,255,255,0.28)),
            ${rainbowStrong || rainbowSoft}
          `;
        } else {
          const [r, g, b] = parseCssColor(renderColor);
          const a1 = isTransparent ? 0.16 : 0.2;
          const a2 = isTransparent ? 0.24 : 0.4;
          glassBg = `
            linear-gradient(135deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 25%, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},0.3) 50%, rgba(255,255,255,0.15) 75%, rgba(255,255,255,0.4) 100%),
            linear-gradient(90deg, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a1}) 0%, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a2}) 50%, rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a1}) 100%)
          `;
        }
        inner.style.borderRadius = '8px';
        inner.style.border = `1px solid ${isRainbow ? 'rgba(255,255,255,.32)' : this.hexToRgba(renderColor, 0.3)}`;
        inner.style.background = glassBg;
        inner.style.boxShadow = `
          inset 0 1px 3px rgba(255,255,255,0.5),
          inset 0 -1px 2px rgba(0,0,0,0.1),
          0 8px 22px ${this.hexToRgba(renderColor, isDarkPage ? 0.26 : 0.2)}
        `;
        inner.style.backdropFilter = 'blur(8px) saturate(1.8) brightness(1.08)';
        inner.style.webkitBackdropFilter = 'blur(8px) saturate(1.8) brightness(1.08)';
      }
      if (toolId === 'neon-blink' || toolId === 'neon-flicker') {
        const isFlicker = toolId === 'neon-flicker';
        const halo = this.hexToRgba(renderColor, isFlicker ? (this.darkModeEnabled ? 0.7 : 0.55) : (this.darkModeEnabled ? 0.65 : 0.5));
        const fill = isRainbow
          ? this.buildRainbowGradient(color, groupRef, 0.24)
          : this.hexToRgba(renderColor, isFlicker ? (this.darkModeEnabled ? 0.32 : 0.22) : (this.darkModeEnabled ? 0.3 : 0.2));
        inner.style.setProperty('--neon-fill', fill);
        inner.style.setProperty('--neon-halo', halo);
        inner.style.borderRadius = '10px';
        inner.style.background = fill;
        inner.style.boxShadow = isFlicker ? `0 0 28px ${halo}, 0 0 72px ${halo}` : `0 0 26px ${halo}, 0 0 60px ${halo}`;
        inner.style.mixBlendMode = 'screen';
        inner.style.animation = isFlicker ? 'neonFlickerHalo 2.6s linear infinite' : 'neonHalo 2.4s ease-in-out infinite';
      }
      if (toolId === 'liquidglass' || toolId === 'sticker') {
        let textHost = inner.querySelector('.effect-merged-box-text');
        if (!textHost) {
          textHost = document.createElement('div');
          textHost.className = 'effect-merged-box-text';
          inner.appendChild(textHost);
        }
        textHost.textContent = groupElems.map(el => el.textContent || '').join('');
        const ref = groupRef;
        textHost.style.position = 'absolute';
        textHost.style.left = '0';
        textHost.style.right = '0';
        textHost.style.top = '50%';
        textHost.style.transform = 'translateY(-50%)';
        textHost.style.zIndex = '1';
        textHost.style.width = '100%';
        textHost.style.boxSizing = 'border-box';
        textHost.style.whiteSpace = 'pre-wrap';
        textHost.style.margin = '0';
        textHost.style.padding = toolId === 'sticker' ? '6px 10px' : '4px 8px';
        textHost.style.color = toolId === 'sticker'
          ? '#1a1a1a'
          : (isDarkPage ? '#e5f7ee' : '#102a43');
        textHost.style.textShadow = 'none';
        try {
          const cs = ref ? window.getComputedStyle(ref) : null;
          if (cs) {
            textHost.style.fontFamily = cs.fontFamily;
            textHost.style.fontSize = cs.fontSize;
            textHost.style.fontStyle = cs.fontStyle;
            textHost.style.fontWeight = toolId === 'liquidglass' ? '600' : cs.fontWeight;
            textHost.style.lineHeight = cs.lineHeight;
            textHost.style.textAlign = cs.textAlign;
            textHost.style.letterSpacing = cs.letterSpacing;
            textHost.style.wordSpacing = cs.wordSpacing;
          }
        } catch (_) { }
      } else {
        inner.querySelectorAll(':scope > .effect-merged-box-text').forEach(node => node.remove());
      }
    }

    _ensureRippleGlobalSyncInit() {
      if (!this._ripplePalette) {
        this._ripplePalette = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7ff', '#007aff', '#af52de'];
      }
      if (typeof this._rbIdxFixed !== 'number') this._rbIdxFixed = 0;
      if (typeof this._rbIdxRandom !== 'number') this._rbIdxRandom = 0;
      if (this._rippleGlobalListenerAttached) return;
      this._rippleGlobalListenerAttached = true;
      this._rippleGlobalHandler = event => {
        try {
          if (!event || event.animationName !== 'pulse-wave') return;
          const nowMs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
          if (this._lastRipplePaletteStep && nowMs - this._lastRipplePaletteStep < 900) return;
          this._lastRipplePaletteStep = nowMs;
          const len = this._ripplePalette.length;
          this._rbIdxFixed = (this._rbIdxFixed + 1) % len;
          this._rbIdxRandom = (this._rbIdxRandom + 3) % len;
          this._updateAllRippleRainbowColors();
        } catch (_) { }
      };
      document.addEventListener('animationiteration', this._rippleGlobalHandler, true);
    }

    _applyRipplePaletteIndex(target, idx) {
      if (!target) return;
      this._ensureRippleGlobalSyncInit();
      const palette = this._ripplePalette || [];
      if (!palette.length) return;
      const hex = palette[((idx % palette.length) + palette.length) % palette.length];
      const [r, g, b] = parseCssColor(hex);
      target.style.setProperty('--ripple-rgb', `${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}`);
    }

    _updateAllRippleRainbowColors() {
      document.querySelectorAll(`${HIGHLIGHT_SELECTOR}.tool-ripple > .ripple-box, .ripple-merged-box, .ripple-merged-box-inner`).forEach(node => {
        const variant = node.getAttribute('data-rb-variant') || node.dataset.rbVariant || '';
        if (!variant) return;
        this._applyRipplePaletteIndex(node, variant === 'random' ? (this._rbIdxRandom || 0) : (this._rbIdxFixed || 0));
      });
    }

    _colorToRgbTriple(color, gid = '') {
      if (this.isRainbowColor(color)) {
        this._ensureRippleGlobalSyncInit();
        const palette = this._ripplePalette || [];
        const idx = this.getRainbowVariant(color) === 'random'
          ? Math.abs(this._seedFromId(gid)) % palette.length
          : (this._rbIdxFixed || 0);
        return parseCssColor(palette[idx] || palette[0] || '#4285f4');
      }
      return parseCssColor(this.getRenderableColor(color));
    }

    _setRippleOverlayClass(groupElems, active) {
      (groupElems || []).forEach(el => {
        if (el && el.classList) el.classList.toggle('ripple-overlay-active', !!active);
      });
    }

    updateAllGroupFrameOverlays() {
      try { this.updateFrameOverlayLayerSize(); } catch (_) { }
      const ids = new Set();
      if (this.groupFrameOverlays) {
        this.groupFrameOverlays.forEach((_, id) => ids.add(id));
      }
      this.highlights.forEach((entry, id) => ids.add(id));
      ids.forEach(id => {
        const entry = this.highlights.get(id);
        if (!entry) {
          this.removeGroupFrameOverlay(id);
          return;
        }
        this.applyGroupFrameOverlayIfNeeded(id, entry.toolStyle || 'highlight', entry.color || this.currentColor);
      });
    }

    removeGroupFrameOverlay(gid) {
      if (!gid) return;
      const node = this.groupFrameOverlays && this.groupFrameOverlays.get(gid);
      if (node && node.parentNode) {
        try { node.parentNode.removeChild(node); } catch (_) { }
      }
      if (this.groupFrameOverlays) this.groupFrameOverlays.delete(gid);
      if (this.groupFrameGeometries) this.groupFrameGeometries.delete(gid);
      try {
        this.getGroupElements(gid).forEach(el => {
          el.classList.remove('group-overlay-active', 'ripple-overlay-active');
        });
      } catch (_) { }
    }

    removeAllGroupFrameOverlays() {
      if (this.groupFrameOverlays) {
        Array.from(this.groupFrameOverlays.values()).forEach(node => {
          if (node && node.parentNode) {
            try { node.parentNode.removeChild(node); } catch (_) { }
          }
        });
        this.groupFrameOverlays.clear();
      }
      if (this.groupFrameGeometries) this.groupFrameGeometries.clear();
      if (this.frameOverlayLayer && this.frameOverlayLayer.parentNode) {
        try { this.frameOverlayLayer.parentNode.removeChild(this.frameOverlayLayer); } catch (_) { }
      }
      this.frameOverlayLayer = null;
      if (this.htmlOverlayLayer && this.htmlOverlayLayer.parentNode) {
        try { this.htmlOverlayLayer.parentNode.removeChild(this.htmlOverlayLayer); } catch (_) { }
      }
      this.htmlOverlayLayer = null;
      this.queryAllDeep(`${HIGHLIGHT_SELECTOR}.group-overlay-active, ${HIGHLIGHT_SELECTOR}.ripple-overlay-active`).forEach(el => {
        el.classList.remove('group-overlay-active', 'ripple-overlay-active');
      });
    }

    cancelRestoreJob() {
      if (this._restoreJob) this._restoreJob.cancelled = true;
      this._restoreJob = null;
      if (this._restoreJobTimer) {
        clearTimeout(this._restoreJobTimer);
        this._restoreJobTimer = null;
      }
      if (this._effectRefreshTimer) {
        clearTimeout(this._effectRefreshTimer);
        this._effectRefreshTimer = null;
      }
    }

    restoreHighlightsWithRetry(attempt = 0) {
      if (this._restoreRetryTimer) {
        clearTimeout(this._restoreRetryTimer);
        this._restoreRetryTimer = null;
      }
      const restoredEdits = this.restoreSavedEditFragments();
      const restored = this.restoreHighlights({ attempt });
      if (this._restoreJob) return false;
      if ((restored && restoredEdits) || attempt >= 5) return restored && restoredEdits;
      const delay = 120 * (attempt + 1);
      this._restoreRetryTimer = setTimeout(() => {
        this._restoreRetryTimer = null;
        this.restoreHighlightsWithRetry(attempt + 1);
      }, delay);
      return false;
    }

    restoreSavedEditFragments() {
      if (!Array.isArray(this.editFragments) || !this.editFragments.length) return true;
      let allRestored = true;
      this.editFragments.forEach(fragment => {
        if (!this.restoreSavedEditFragment(fragment)) allRestored = false;
      });
      return allRestored;
    }

    restoreSavedEditFragment(fragment) {
      const id = this.getEditFragmentId(fragment);
      if (id && this.getEditFragmentElements(id).length > 0) return true;
      const html = safeString(fragment && fragment.afterHtml);
      if (!html) return true;
      const target = this.locateEditTarget(fragment);
      if (!target || !target.parentNode) return false;
      try {
        target.outerHTML = this.sanitizeEditFragmentHtml(html);
        return true;
      } catch (_) {
        return false;
      }
    }

    restoreHighlights(options = {}) {
      if (!this.highlights.size) return true;
      const entries = Array.from(this.highlights.values()).filter(Boolean);
      const allGroupsPresent = entries.every(entry => this.isHighlightEntryRestored(entry));
      if (allGroupsPresent) {
        entries.forEach(entry => this.syncHighlightEntryToDom(entry));
        this.updateAllGroupFrameOverlays();
        return true;
      }
      const flattened = [];
      entries.forEach(entry => {
        if (this.isHighlightEntryRestored(entry)) return;
        (entry.segments || []).forEach(segment => flattened.push({ entry, segment }));
      });
      flattened.sort((a, b) => {
        const pa = safeString(a.segment.parentXPath);
        const pb = safeString(b.segment.parentXPath);
        if (pa === pb) return Number(b.segment.startInParent || 0) - Number(a.segment.startInParent || 0);
        return pb.localeCompare(pa);
      });
      if (this.shouldRestoreHighlightsGradually(flattened)) {
        this.startGradualHighlightRestore(entries, flattened, options);
        return false;
      }
      flattened.forEach(({ entry, segment }) => this.restoreSegment(entry, segment));
      entries.forEach(entry => this.syncHighlightEntryToDom(entry));
      this.refreshRestoredHighlightEffectsGradually(entries);
      return entries.every(entry => this.isHighlightEntryRestored(entry));
    }

    isHighlightEntryRestored(entry) {
      if (!entry || !entry.id) return false;
      const count = this.getGroupElements(entry.id).length;
      const expected = Math.max(1, Array.isArray(entry.segments) ? entry.segments.length : 0);
      return count >= expected;
    }

    shouldRestoreHighlightsGradually(flattened = []) {
      return Array.isArray(flattened) && flattened.length > 12;
    }

    startGradualHighlightRestore(entries, flattened, options = {}) {
      if (!Array.isArray(flattened) || !flattened.length) return;
      this.cancelRestoreJob();
      const job = {
        id: ++this._restoreJobSeq,
        entries,
        flattened,
        index: 0,
        attempt: Number(options.attempt || 0),
        cancelled: false
      };
      this._restoreJob = job;
      const batchSize = Math.max(6, Math.min(18, Number(this.config.restoreBatchSize) || 10));
      const maxSliceMs = Math.max(6, Math.min(16, Number(this.config.restoreSliceMs) || 10));
      const run = () => {
        if (!this._restoreJob || this._restoreJob !== job || job.cancelled) return;
        const started = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
        let processed = 0;
        while (job.index < job.flattened.length && processed < batchSize) {
          const item = job.flattened[job.index];
          job.index += 1;
          processed += 1;
          try {
            if (item && item.entry && item.segment) this.restoreSegment(item.entry, item.segment);
          } catch (_) { }
          const elapsed = (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - started;
          if (elapsed >= maxSliceMs) break;
        }
        if (job.index < job.flattened.length) {
          this._restoreJobTimer = setTimeout(() => {
            this._restoreJobTimer = null;
            requestAnimationFrame(run);
          }, 24);
          return;
        }
        this._restoreJob = null;
        this._restoreJobTimer = null;
        job.entries.forEach(entry => this.syncHighlightEntryToDom(entry));
        this.refreshRestoredHighlightEffectsGradually(job.entries);
        const done = job.entries.every(entry => this.isHighlightEntryRestored(entry));
        if (!done && job.attempt < 5 && this.visible) {
          const delay = 160 * (job.attempt + 1);
          this._restoreRetryTimer = setTimeout(() => {
            this._restoreRetryTimer = null;
            this.restoreHighlightsWithRetry(job.attempt + 1);
          }, delay);
        }
      };
      this._restoreJobTimer = setTimeout(() => {
        this._restoreJobTimer = null;
        requestAnimationFrame(run);
      }, 24);
    }

    refreshRestoredHighlightEffectsGradually(entries = []) {
      if (this._effectRefreshTimer) {
        clearTimeout(this._effectRefreshTimer);
        this._effectRefreshTimer = null;
      }
      const queue = (Array.isArray(entries) ? entries : [])
        .filter(entry => entry && this.getGroupElements(entry.id).length > 0);
      if (!queue.length) return;
      let index = 0;
      const batchSize = 8;
      const run = () => {
        const end = Math.min(queue.length, index + batchSize);
        for (; index < end; index += 1) {
          const entry = queue[index];
          try {
            this.refreshGroupEffects(entry.id, entry.toolStyle || 'highlight', entry.color || this.currentColor);
          } catch (_) { }
        }
        if (index < queue.length) {
          this._effectRefreshTimer = setTimeout(() => {
            this._effectRefreshTimer = null;
            requestAnimationFrame(run);
          }, 24);
          return;
        }
        this._effectRefreshTimer = null;
        try { this.updateAllGroupFrameOverlays(); } catch (_) { }
      };
      requestAnimationFrame(run);
    }

    restoreSegment(entry, segment) {
      const parent = this.evaluateXPath(segment.parentXPath);
      if (!parent) return false;
      let start = Number(segment.startInParent);
      let end = Number(segment.endInParent);
      const expected = safeString(segment.text);
      const currentText = this.getTextContentForHighlightOffsets(parent);
      if (!Number.isFinite(start) || !Number.isFinite(end) || currentText.slice(start, end) !== expected) {
        const found = this.findNearestTextIndex(currentText, expected, Number.isFinite(start) ? start : 0);
        if (found < 0) return false;
        start = found;
        end = found + expected.length;
      }
      const startPos = this.findTextPosition(parent, start);
      const endPos = this.findTextPosition(parent, end);
      const colorName = this.getColorNameForValue(entry.color, entry.textColorOverride || '', entry.colorName || '', entry.colorNameKey || '');
      const colorNameKey = entry.colorNameKey || this.getColorNameKeyForValue(entry.color, entry.textColorOverride || '', colorName);
      if (!startPos || !endPos) return false;
      if (startPos.node !== endPos.node) {
        try {
          const range = document.createRange();
          range.setStart(startPos.node, startPos.offset);
          range.setEnd(endPos.node, endPos.offset);
          this.cacheGroupLineBoxesFromRange(entry.id, range);
          const restoredParts = this.wrapRangeTextOnly(
            range,
            entry.id,
            entry.color,
            colorName,
            colorNameKey,
            entry.toolStyle || 'highlight',
            entry.textColorOverride || '',
            entry.randomSeed || segment.randomSeed || ''
          );
          return Array.isArray(restoredParts) && restoredParts.length > 0;
        } catch (_) { }
        return false;
      }
      try {
        const range = document.createRange();
        range.setStart(startPos.node, startPos.offset);
        range.setEnd(endPos.node, endPos.offset);
        this.cacheGroupLineBoxesFromRange(entry.id, range);
      } catch (_) { }
      return !!this.wrapTextNodePart(
        startPos.node,
        startPos.offset,
        endPos.offset,
        entry.id,
        entry.color,
        colorName,
        colorNameKey,
        entry.toolStyle || 'highlight',
        entry.textColorOverride || '',
        segment.partIndex || 0,
        entry.randomSeed || segment.randomSeed || ''
      );
    }

    findNearestTextIndex(text, expected, preferredIndex = 0) {
      const haystack = safeString(text);
      const needle = safeString(expected);
      if (!needle) return -1;
      const preferred = Math.max(0, Number(preferredIndex) || 0);
      let best = -1;
      let bestDistance = Infinity;
      let index = haystack.indexOf(needle);
      while (index >= 0) {
        const distance = Math.abs(index - preferred);
        if (distance < bestDistance) {
          best = index;
          bestDistance = distance;
        }
        index = haystack.indexOf(needle, index + 1);
      }
      return best;
    }

    findTextPosition(parent, charOffset) {
      const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest(UI_SELECTOR)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest(`.${NOTE_STATIC_CLASS}`)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let remaining = Math.max(0, Number(charOffset) || 0);
      let last = null;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        last = node;
        const length = node.nodeValue.length;
        if (remaining <= length) return { node, offset: remaining };
        remaining -= length;
      }
      return last ? { node: last, offset: last.nodeValue.length } : null;
    }

    getTextOffsetWithin(parent, textNode, nodeOffset) {
      const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest(UI_SELECTOR)) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest(`.${NOTE_STATIC_CLASS}`)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      });
      let offset = 0;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node === textNode) return offset + nodeOffset;
        offset += (node.nodeValue || '').length;
      }
      return offset;
    }

    getTextContentForHighlightOffsets(parent) {
      if (!parent) return '';
      const parts = [];
      try {
        const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
            if (node.parentElement && node.parentElement.closest(UI_SELECTOR)) return NodeFilter.FILTER_REJECT;
            if (node.parentElement && node.parentElement.closest(`.${NOTE_STATIC_CLASS}`)) return NodeFilter.FILTER_REJECT;
            return NodeFilter.FILTER_ACCEPT;
          }
        });
        while (walker.nextNode()) parts.push(walker.currentNode.nodeValue || '');
      } catch (_) {
        return parent.textContent || '';
      }
      return parts.join('');
    }

    getXPathForElement(element) {
      if (!element || element.nodeType !== Node.ELEMENT_NODE) return '';
      const parts = [];
      let node = element;
      while (node && node.nodeType === Node.ELEMENT_NODE) {
        const tag = node.nodeName.toLowerCase();
        let index = 1;
        let prev = node.previousElementSibling;
        while (prev) {
          if (prev.nodeName.toLowerCase() === tag) index += 1;
          prev = prev.previousElementSibling;
        }
        parts.unshift(`${tag}[${index}]`);
        node = node.parentElement;
      }
      return `/${parts.join('/')}`;
    }

    evaluateXPath(xpath) {
      if (!xpath) return null;
      try {
        return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      } catch (_) {
        return null;
      }
    }

    queryAllDeep(selector, root = document) {
      const results = [];
      const seenRoots = new Set();
      const visit = (scope) => {
        if (!scope || seenRoots.has(scope)) return;
        seenRoots.add(scope);
        try {
          scope.querySelectorAll(selector).forEach(el => {
            if (!results.includes(el)) results.push(el);
          });
        } catch (_) { }
        try {
          scope.querySelectorAll('*').forEach(el => {
            if (el && el.shadowRoot) visit(el.shadowRoot);
          });
        } catch (_) { }
      };
      visit(root);
      return results;
    }

    getAllHighlightElements() {
      const elements = [];
      const seen = new Set();
      const add = (el) => {
        if (!el || seen.has(el) || this.isUiElement(el)) return;
        if (!el.getAttribute || !el.getAttribute('data-highlight-id')) return;
        seen.add(el);
        elements.push(el);
      };
      this.queryAllDeep(HIGHLIGHT_ANY_SELECTOR).forEach(add);
      return elements;
    }

    getAllHighlightIds(includeEditFragmentHtml = false) {
      const ids = new Set();
      this.highlights.forEach((_, id) => {
        const normalized = safeString(id);
        if (normalized) ids.add(normalized);
      });
      this.getAllHighlightElements().forEach(el => {
        const id = safeString(el && el.getAttribute && el.getAttribute('data-highlight-id'));
        if (id) ids.add(id);
      });
      if (includeEditFragmentHtml && Array.isArray(this.editFragments)) {
        this.editFragments.forEach(fragment => {
          this.collectHighlightIdsFromHtml(fragment && fragment.beforeHtml).forEach(id => ids.add(id));
          this.collectHighlightIdsFromHtml(fragment && fragment.afterHtml).forEach(id => ids.add(id));
        });
      }
      return ids;
    }

    getEditFragmentCount() {
      const ids = new Set();
      let anonymous = 0;
      (Array.isArray(this.editFragments) ? this.editFragments : []).forEach(fragment => {
        const id = this.getEditFragmentId(fragment);
        if (id) ids.add(id);
        else anonymous += 1;
      });
      return ids.size + anonymous;
    }

    getGroupElements(id) {
      if (!id) return [];
      const wanted = safeString(id);
      return this.getAllHighlightElements().filter(el => safeString(el.getAttribute('data-highlight-id')) === wanted);
    }

    getClosestBatchHighlightElement(node) {
      try {
        const el = elementFromNode(node);
        if (!el || !el.closest) return null;
        const target = el.closest(`${HIGHLIGHT_ANY_SELECTOR}, .${NOTE_STATIC_CLASS}[data-highlight-id]`);
        if (!target || this.isUiElement(target)) return null;
        return target.getAttribute('data-highlight-id') ? target : null;
      } catch (_) {
        return null;
      }
    }

    removeHighlightById(id) {
      this.removeGroupFrameOverlay(id);
      const elements = this.getGroupElements(id);
      elements.forEach(el => this.unwrapHighlightElement(el));
      this.scrubHighlightFromEditFragments(id);
      this.highlights.delete(id);
      this.selectedHighlightIds.delete(id);
      this.updatePermanentToolbarIndicator();
    }

    cleanupHighlightNode(el) {
      if (!el) return;
      try {
        this.getAdjacentHighlightNoteNodes(el).forEach(node => node.remove());
      } catch (_) { }
      try { this.removeRainbowLine(el); } catch (_) { }
      try { if (this._sharedRO) this._sharedRO.unobserve(el); } catch (_) { }
      try { delete el._dev1RbLineMeta; } catch (_) { }
      try {
        el.querySelectorAll('.rb-line-ov').forEach(node => node.remove());
      } catch (_) { }
      try {
        el.querySelectorAll('.ripple-edge').forEach(edge => {
          const observer = edge && edge._dev1RippleResizeObserver;
          if (observer && typeof observer.disconnect === 'function') observer.disconnect();
          try { delete edge._dev1RippleResizeObserver; } catch (_) { }
        });
      } catch (_) { }
    }

    collectHighlightIdsFromHtml(html) {
      const ids = new Set();
      if (html == null || html === '') return [];
      try {
        const temp = document.createElement('div');
        temp.innerHTML = safeString(html);
        temp.querySelectorAll(HIGHLIGHT_ANY_SELECTOR).forEach(node => {
          const id = node.getAttribute('data-highlight-id');
          if (id) ids.add(id);
        });
      } catch (_) { }
      return Array.from(ids);
    }

    unwrapHighlightHtml(html, highlightId) {
      if (html == null || html === '' || !highlightId) return html;
      try {
        const temp = document.createElement('div');
        temp.innerHTML = safeString(html);
        let changed = false;
        temp.querySelectorAll(`.${NOTE_STATIC_CLASS}[data-highlight-id="${CSS.escape(highlightId)}"]`).forEach(node => {
          node.remove();
          changed = true;
        });
        temp.querySelectorAll(HIGHLIGHT_ANY_SELECTOR).forEach(node => {
          if (safeString(node.getAttribute('data-highlight-id')) !== highlightId) return;
          this.cleanupHighlightNode(node);
          node.replaceWith(document.createTextNode(this.getHighlightTextForUnwrap(node)));
          changed = true;
        });
        if (!changed) return html;
        temp.normalize();
        return this.sanitizeEditFragmentHtml(temp.innerHTML);
      } catch (_) {
        return html;
      }
    }

    removeHighlightReferencesFromFragment(fragment, highlightId) {
      if (!fragment || typeof fragment !== 'object' || !highlightId) return false;
      let changed = false;
      ['beforeHtml', 'afterHtml'].forEach(field => {
        if (fragment[field] == null) return;
        const nextHtml = this.unwrapHighlightHtml(fragment[field], highlightId);
        if (nextHtml !== fragment[field]) {
          fragment[field] = nextHtml;
          changed = true;
        }
      });
      ['highlightIds', 'containedHighlightIds', 'relatedHighlightIds', 'highlights'].forEach(field => {
        if (!Array.isArray(fragment[field])) return;
        const next = fragment[field].filter(item => {
          const id = typeof item === 'string' ? item : safeString(item && (item.id || item.highlightId));
          return id !== highlightId;
        });
        if (next.length !== fragment[field].length) {
          fragment[field] = next;
          changed = true;
        }
      });
      if (changed) fragment.updatedAt = now();
      return changed;
    }

    scrubHighlightFromEditFragments(highlightId) {
      if (!highlightId || !Array.isArray(this.editFragments)) return false;
      let changed = false;
      this.editFragments.forEach(fragment => {
        if (this.removeHighlightReferencesFromFragment(fragment, highlightId)) changed = true;
      });
      return changed;
    }

    getEditFragmentId(fragment) {
      return safeString(fragment && (fragment.id || fragment.fragmentId || fragment.editFragmentId));
    }

    getEditFragmentXPath(fragment) {
      if (!fragment || typeof fragment !== 'object') return '';
      return safeString(fragment.targetXPath || fragment.parentXPath || fragment.xpath || (fragment.anchor && fragment.anchor.xpath));
    }

    getEditFragmentElements(id) {
      if (!id) return [];
      return this.queryAllDeep(`[data-dev1-snapshot-highlighter-edit="true"][data-edit-fragment-id="${CSS.escape(id)}"]`);
    }

    locateEditTarget(fragment) {
      if (!fragment || typeof fragment !== 'object') return null;
      const id = this.getEditFragmentId(fragment);
      const xpath = this.getEditFragmentXPath(fragment);
      if (xpath) {
        const byXPath = this.evaluateXPath(xpath);
        if (byXPath && byXPath.nodeType === Node.ELEMENT_NODE) return byXPath;
      }
      const selector = safeString(fragment.selector || fragment.targetSelector);
      if (selector) {
        try {
          const bySelector = document.querySelector(selector);
          if (bySelector) return bySelector;
        } catch (_) { }
      }
      const elementId = safeString(fragment.elementId || fragment.targetId);
      if (elementId) {
        const byId = document.getElementById(elementId);
        if (byId) return byId;
      }
      return id ? this.getEditFragmentElements(id)[0] || null : null;
    }

    getEditFragmentHighlightIds(fragment) {
      if (!fragment || typeof fragment !== 'object') return [];
      const candidates = [
        fragment.highlightIds,
        fragment.containedHighlightIds,
        fragment.relatedHighlightIds,
        fragment.highlights
      ];
      const ids = [];
      candidates.forEach(list => {
        if (!Array.isArray(list)) return;
        list.forEach(item => {
          const id = typeof item === 'string' ? item : safeString(item && (item.id || item.highlightId));
          if (id && !ids.includes(id)) ids.push(id);
        });
      });
      return ids;
    }

    getContainedHighlightIdsForEditFragmentId(id) {
      if (!id) return [];
      const ids = new Set(this._batchContainedHighlightIdsByEditId.get(id) || []);
      try {
        const fragment = (Array.isArray(this.editFragments) ? this.editFragments : [])
          .find(item => this.getEditFragmentId(item) === id);
        this.getEditFragmentHighlightIds(fragment).forEach(highlightId => ids.add(highlightId));
        this.collectHighlightIdsFromHtml(fragment && fragment.afterHtml).forEach(highlightId => ids.add(highlightId));
      } catch (_) { }
      this.getEditFragmentElements(id).forEach(el => {
        try {
          el.querySelectorAll(HIGHLIGHT_ANY_SELECTOR).forEach(highlight => {
            const highlightId = highlight.getAttribute('data-highlight-id');
            if (highlightId) ids.add(highlightId);
          });
        } catch (_) { }
      });
      return Array.from(ids);
    }

    getRemovableHighlightIdsForEditFragment(fragment) {
      if (!fragment || typeof fragment !== 'object') return [];
      const id = this.getEditFragmentId(fragment);
      const beforeIds = new Set(this.collectHighlightIdsFromHtml(fragment.beforeHtml));
      const ids = new Set();
      this.getEditFragmentHighlightIds(fragment).forEach(highlightId => ids.add(highlightId));
      this.collectHighlightIdsFromHtml(fragment.afterHtml).forEach(highlightId => ids.add(highlightId));
      if (id) {
        this.getEditFragmentElements(id).forEach(el => {
          try {
            el.querySelectorAll(HIGHLIGHT_ANY_SELECTOR).forEach(highlight => {
              const highlightId = highlight.getAttribute('data-highlight-id');
              if (highlightId) ids.add(highlightId);
            });
          } catch (_) { }
        });
      }
      beforeIds.forEach(highlightId => ids.delete(highlightId));
      return Array.from(ids);
    }

    getRemovableHighlightIdsForEditFragmentId(id) {
      if (!id) return [];
      const fragment = (Array.isArray(this.editFragments) ? this.editFragments : [])
        .find(item => this.getEditFragmentId(item) === id);
      return this.getRemovableHighlightIdsForEditFragment(fragment);
    }

    restoreEditFragment(fragment) {
      const target = this.locateEditTarget(fragment);
      if (!target || !target.parentNode) return false;
      if (fragment.beforeHtml != null) {
        try {
          target.outerHTML = String(fragment.beforeHtml);
          return true;
        } catch (_) { }
      }
      if (fragment.beforeText != null) {
        try {
          target.textContent = String(fragment.beforeText);
          target.removeAttribute('data-edit-fragment-id');
          target.removeAttribute('data-dev1-snapshot-highlighter-edit');
          target.classList.remove('batch-selected');
          return true;
        } catch (_) { }
      }
      target.removeAttribute('data-edit-fragment-id');
      target.removeAttribute('data-dev1-snapshot-highlighter-edit');
      target.classList.remove('batch-selected');
      return true;
    }

    removeEditFragmentById(id) {
      if (!id) return;
      const index = this.editFragments.findIndex(fragment => this.getEditFragmentId(fragment) === id);
      if (index >= 0) {
        const [fragment] = this.editFragments.splice(index, 1);
        this.getRemovableHighlightIdsForEditFragment(fragment).forEach(highlightId => this.removeHighlightById(highlightId));
        this.restoreEditFragment(fragment);
        const xpath = this.getEditFragmentXPath(fragment);
        if (xpath) this._editOriginalByXPath.delete(xpath);
        return;
      }
      this.getEditFragmentElements(id).forEach(el => {
        el.removeAttribute('data-edit-fragment-id');
        el.removeAttribute('data-dev1-snapshot-highlighter-edit');
        el.classList.remove('batch-selected');
      });
    }

    clearEditFragments() {
      const fragments = Array.isArray(this.editFragments) ? [...this.editFragments] : [];
      const removableIds = new Set();
      fragments.forEach(fragment => this.getRemovableHighlightIdsForEditFragment(fragment).forEach(id => removableIds.add(id)));
      removableIds.forEach(id => this.removeHighlightById(id));
      fragments.forEach(fragment => this.restoreEditFragment(fragment));
      fragments.forEach(fragment => {
        const xpath = this.getEditFragmentXPath(fragment);
        if (xpath) this._editOriginalByXPath.delete(xpath);
      });
      this.editFragments = [];
      this.selectedEditFragmentIds.clear();
      this._batchContainedHighlightIdsByEditId.clear();
      this.hydrateExistingDomHighlights();
      this.highlights.forEach(entry => {
        try { this.syncHighlightEntryToDom(entry); } catch (_) { }
      });
      try { this.updateAllGroupFrameOverlays(); } catch (_) { }
      this.updatePermanentToolbarIndicator();
    }

    restoreEditFragmentsDomOnly() {
      const fragments = Array.isArray(this.editFragments) ? [...this.editFragments] : [];
      fragments.forEach(fragment => {
        try { this.restoreEditFragment(fragment); } catch (_) { }
      });
      this.selectedEditFragmentIds.clear();
    }

    unwrapHighlightElement(el) {
      if (!el || !el.parentNode) return;
      this.cleanupHighlightNode(el);
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(this.getHighlightTextForUnwrap(el)), el);
      parent.normalize();
    }

    getHighlightTextForUnwrap(el) {
      if (!el || typeof el.getAttribute !== 'function') return '';
      const storedText = el.getAttribute('data-text');
      if (storedText != null) return storedText;
      const bracketInner = el.querySelector && el.querySelector(':scope > .hl-bracket-inner');
      if (bracketInner) return bracketInner.textContent || '';
      return el.textContent || '';
    }

    clearDomHighlights() {
      this.removeAllGroupFrameOverlays();
      this.getAllHighlightElements().forEach(el => this.unwrapHighlightElement(el));
    }

    clearHighlightNoteStaticLabels(ids = null) {
      const filter = ids instanceof Set ? ids : null;
      this.queryAllDeep(`.${NOTE_STATIC_CLASS}[data-highlight-id]`).forEach(node => {
        const id = safeString(node && node.getAttribute && node.getAttribute('data-highlight-id'));
        if (!filter || filter.has(id)) {
          try { node.remove(); } catch (_) { }
        }
      });
    }

    clearVisualMode() {
      const ids = this.getAllHighlightIds(true);
      ids.forEach(id => this.scrubHighlightFromEditFragments(id));
      this.clearDomHighlights();
      this.clearHighlightNoteStaticLabels(ids);
      this.highlights.clear();
      this.selectedHighlightIds.clear();
      this._batchContainedHighlightIdsByEditId.clear();
      this.updatePermanentToolbarIndicator();
    }

    clearAllHighlights() {
      this.clearVisualMode();
    }

    clearEverything() {
      this.removeAllGroupFrameOverlays();
      this.restoreEditFragmentsDomOnly();
      this.clearDomHighlights();
      this.clearHighlightNoteStaticLabels();
      this.highlights.clear();
      this.editFragments = [];
      this._editOriginalByXPath.clear();
      this.selectedHighlightIds.clear();
      this.selectedEditFragmentIds.clear();
      this._batchContainedHighlightIdsByEditId.clear();
      this.updatePermanentToolbarIndicator();
    }

    isUiElement(element) {
      return !!(element && element.closest && element.closest(UI_SELECTOR));
    }

    detectPageTheme() {
      try {
        const html = document.documentElement;
        const body = document.body || html;
        const candidates = [body, html];
        for (const el of candidates) {
          const bg = window.getComputedStyle(el).backgroundColor || '';
          const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
          if (!match) continue;
          const r = Number(match[1]);
          const g = Number(match[2]);
          const b = Number(match[3]);
          return ((0.299 * r + 0.587 * g + 0.114 * b) / 255) < 0.5;
        }
      } catch (_) { }
      return false;
    }

    findEffectiveBackground(element) {
      let el = element;
      while (el && el !== document.documentElement) {
        const bg = window.getComputedStyle(el).backgroundColor;
        if (bg && bg !== 'transparent' && !/rgba\([^)]*,\s*0\)/i.test(bg)) return bg;
        el = el.parentElement;
      }
      return window.getComputedStyle(document.documentElement).backgroundColor || '#ffffff';
    }

    showToast(text) {
      const toast = document.createElement('div');
      toast.className = 'dev1-snapshot-highlighter-toast';
      toast.dataset.dev1SnapshotHighlighterUi = 'true';
      toast.textContent = text;
      document.body.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('show'));
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 180);
      }, 1800);
    }

    escapeRegExp(value) {
      return safeString(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    escapeHtml(value) {
      return safeString(value).replace(/[&<>"']/g, ch => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[ch]));
    }
  }

  const highlighter = new SnapshotHighlighter();
  window[API_KEY] = {
    loaded: true,
    show: (config) => highlighter.show(config),
    hide: () => highlighter.hide(),
    toggle: (config) => highlighter.toggle(config),
    setColor: (item) => highlighter.setColor(item),
    destroy: () => highlighter.destroy(),
    isVisible: () => highlighter.isVisible(),
    _instance: highlighter
  };
})();

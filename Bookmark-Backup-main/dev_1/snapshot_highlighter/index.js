(function () {
  'use strict';

  const API_KEY = '__dev1SnapshotHighlighter';
  const TOOLBAR_ID = 'dev1-snapshot-highlighter-toolbar';
  const STORAGE_PREFIX = 'snapshot_highlighter_page_';
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
    '[data-dev1-snapshot-highlighter-ui="true"]',
    '#dev1-snapshot-helper-host'
  ].join(',');

  if (window[API_KEY] && window[API_KEY].loaded === true) return;

  const now = () => Date.now();

  function safeString(value) {
    return String(value == null ? '' : value);
  }

  function normalizeLang(lang) {
    return safeString(lang || '').toLowerCase().startsWith('en') ? 'en' : 'zh_CN';
  }

  function hashUrl(value) {
    const input = safeString(value);
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

  function contrastText(background, fallback = '#000000') {
    if (safeString(background).startsWith('special:')) return '#ffffff';
    if (background === 'transparent') return fallback;
    const lum = luminance(background);
    return lum > 0.58 ? '#000000' : '#ffffff';
  }

  class SnapshotHighlighter {
    constructor() {
      this.loaded = true;
      this.config = {};
      this.lang = 'zh_CN';
      this.visible = false;
      this.currentUrl = window.location.href;
      this.highlights = new Map();
      this.editFragments = [];
      this.currentColor = '#FFEB3B';
      this.currentColorKey = 'yellow';
      this.currentColorName = '';
      this.currentColorVariant = '';
      this.currentTool = 'highlight';
      this.currentToolName = '';
      this.recentColors = [];
      this.recentTools = [];
      this.toolbarUi = { left: null, top: null };
      this.toolbar = null;
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
      this.selectedHighlightIds = new Set();
      this.selectedEditFragmentIds = new Set();
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
          current: '当前颜色 / 当前工具',
          currentColor: '当前颜色',
          currentTool: '当前工具',
          highlightCount: '当前高亮',
          clearAll: '清除全部',
          clearVisual: '清除视觉模式',
          clearEdit: '清除编辑模式',
          batchDelete: '批量删除',
          batchTip: '划过或点击高亮进行选择',
          deleteSelected: '删除选中',
          selectedCount: '已选择',
          confirm: '确认',
          cancel: '取消',
          emptyEdit: '当前版本暂未接入编辑片段',
          noSelection: '没有选中的高亮',
          cleared: '已清除',
          clearOptionsTitle: '选择清除范围',
          clearConfirmTitle: '确认清除',
          batchConfirmTitle: '再次点击确认删除',
          highlightDisabled: '已暂时屏蔽高亮',
          unavailablePdf: 'PDF 页面不启用高亮工具',
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
          toolsRecent: '最近工具',
          toolsMarkdown: 'MD 编辑',
          toolsLines: '线条',
          toolsFrames: '框选',
          toolsSolid: '填充',
          toolsSpecial: '特效',
          toolsDynamic: '动态',
          classicHighlight: '经典高亮',
          customColor: '自定义颜色',
          apply: '应用'
        },
        en: {
          selectColor: 'Select Color',
          selectTool: 'Select Tool',
          delete: 'Delete',
          current: 'Current Color / Tool',
          currentColor: 'Current Color',
          currentTool: 'Current Tool',
          highlightCount: 'Highlights',
          clearAll: 'Clear All',
          clearVisual: 'Clear Visual Mode',
          clearEdit: 'Clear Edit Mode',
          batchDelete: 'Batch Delete',
          batchTip: 'Drag over or click highlights to select',
          deleteSelected: 'Delete Selected',
          selectedCount: 'Selected',
          confirm: 'Confirm',
          cancel: 'Cancel',
          emptyEdit: 'Edit fragments are not connected yet',
          noSelection: 'No selected highlights',
          cleared: 'Cleared',
          clearOptionsTitle: 'Choose Clear Scope',
          clearConfirmTitle: 'Confirm Clear',
          batchConfirmTitle: 'Click again to confirm',
          highlightDisabled: 'Highlighting is temporarily disabled',
          unavailablePdf: 'Highlight tool is disabled on PDFs',
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
          toolsRecent: 'Recent Tools',
          toolsMarkdown: 'MD Edit',
          toolsLines: 'Lines',
          toolsFrames: 'Frames',
          toolsSolid: 'Solid',
          toolsSpecial: 'Special',
          toolsDynamic: 'Dynamic',
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

    async show(config = {}) {
      if (this.isPdfLikePage()) {
        return { success: false, pdf: true, error: this.t('unavailablePdf') };
      }
      this.config = { ...this.config, ...(config || {}) };
      this.lang = normalizeLang(this.config.lang || this.lang);
      if (!this.config.existingTabId && this.config.tabId) this.config.existingTabId = this.config.tabId;
      if (this.currentUrl !== window.location.href) {
        await this.handleUrlChange(window.location.href);
      }
      await this.loadState();
      this.visible = true;
      this.darkModeEnabled = this.detectPageTheme();
      this.createPermanentToolbar();
      this.bindEvents();
      this.restoreHighlights();
      this.updatePermanentToolbarIndicator();
      return { success: true, visible: true, url: this.currentUrl, count: this.highlights.size };
    }

    async hide() {
      await this.saveState();
      this.visible = false;
      this.closePanels();
      this.removeToolbar();
      this.unbindEvents();
      return { success: true, visible: false, count: this.highlights.size };
    }

    async toggle(config = {}) {
      if (this.visible) return await this.hide();
      return await this.show(config);
    }

    async destroy() {
      await this.saveState();
      this.visible = false;
      this.closePanels();
      this.removeToolbar();
      this.unbindEvents();
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

    async loadState(url = this.currentUrl) {
      const scoped = this.getScopedStorage();
      const tabId = this.getTabId();
      if (!scoped || tabId == null) return;
      const state = await scoped.getScoped(tabId, this.storageNamespace(url), url);
      if (!state || typeof state !== 'object') return;
      this.highlights.clear();
      (Array.isArray(state.entries) ? state.entries : []).forEach(entry => {
        if (entry && entry.id) this.highlights.set(entry.id, entry);
      });
      this.editFragments = Array.isArray(state.editFragments) ? state.editFragments.filter(Boolean) : [];
      const toolbar = state.toolbar || {};
      if (toolbar.color) this.currentColor = toolbar.color;
      this.currentColorVariant = toolbar.colorVariant || '';
      this.currentColorKey = toolbar.colorNameKey || this.getColorNameKeyForValue(this.currentColor, this.currentColorVariant, toolbar.colorName || '');
      this.currentColorName = this.getColorNameForValue(this.currentColor, this.currentColorVariant, toolbar.colorName || '', this.currentColorKey);
      if (toolbar.tool) this.currentTool = toolbar.tool;
      this.currentToolName = this.getToolNameForId(this.currentTool, toolbar.toolName || '');
      this.recentColors = this.normalizeRecentColors(state.recentColors);
      this.recentTools = this.normalizeRecentTools(state.recentTools);
      this.toolbarUi = state.toolbarUi && typeof state.toolbarUi === 'object' ? { ...state.toolbarUi } : { left: null, top: null };
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
          colorVariant: this.currentColorVariant || ''
        },
        recentColors: this.recentColors.slice(0, 16),
        recentTools: this.recentTools.slice(0, 16),
        toolbarUi: { ...this.toolbarUi },
        updatedAt: now()
      };
    }

    async saveState(url = this.currentUrl) {
      const scoped = this.getScopedStorage();
      const tabId = this.getTabId();
      if (!scoped || tabId == null) return;
      await scoped.setScoped(tabId, this.storageNamespace(url), url, this.buildState(url));
    }

    requestSave(immediate = false) {
      if (immediate) {
        this.saveState().catch(() => { });
        return;
      }
      this.saveSoon();
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
      await this.saveState(oldUrl);
      this.clearDomHighlights();
      this.highlights.clear();
      this.editFragments = [];
      this.currentUrl = nextUrl;
      this.closePanels();
      await this.loadState(nextUrl);
      this.restoreHighlights();
      this.updatePermanentToolbarIndicator();
    }

    handleOutsideClick(event) {
      const target = event.target;
      if (!target) return;
      if (elementFromNode(target)?.closest(UI_SELECTOR)) return;
      if (elementFromNode(target)?.closest('.custom-highlight')) return;
      this.closeTransientPanels();
    }

    handleHighlightClick(event) {
      const target = event.target;
      const el = target && target.closest && target.closest('.custom-highlight[data-highlight-id]');
      if (!el || this.isUiElement(el)) return;
      if (!this.visible) return;
      event.stopPropagation();
      this.showHighlightActionPanel(el);
    }

    closeTransientPanels() {
      ['activeColorPicker', 'activeToolPicker', 'activeOperationsPanel', 'activeHighlightPanel', 'indicatorPanel'].forEach(key => {
        const el = this[key];
        if (el && el.parentNode) el.remove();
        this[key] = null;
      });
    }

    closePanels() {
      this.closeTransientPanels();
      if (this.batchCleanup) this.batchCleanup();
      this.batchCleanup = null;
      this.selectedHighlightIds.clear();
      this.selectedEditFragmentIds.clear();
    }

    createToolbarButton(icon, label, onClick, className = '') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dev1-snapshot-highlighter-btn ${className}`.trim();
      btn.dataset.dev1SnapshotHighlighterUi = 'true';
      btn.setAttribute('aria-label', label);
      btn.title = label;
      btn.textContent = icon;
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        onClick(event);
      });
      return btn;
    }

    createPermanentToolbar() {
      if (this.toolbar && document.body.contains(this.toolbar)) return this.toolbar;
      const toolbar = document.createElement('div');
      toolbar.id = TOOLBAR_ID;
      toolbar.className = 'permanent-toolbar';
      toolbar.dataset.dev1SnapshotHighlighterUi = 'true';

      const colorBtn = this.createToolbarButton('🎨', this.t('selectColor'), () => this.showColorPicker(colorBtn), 'dev1-color');
      const toolBtn = this.createToolbarButton('🛠', this.t('selectTool'), () => this.showToolPicker(toolBtn), 'dev1-tool');
      const indicator = this.createIndicatorCapsule();
      const deleteBtn = this.createToolbarButton('🗑', this.t('delete'), () => this.showOperationsPanel(deleteBtn), 'dev1-delete');

      toolbar.appendChild(colorBtn);
      toolbar.appendChild(toolBtn);
      toolbar.appendChild(indicator);
      toolbar.appendChild(deleteBtn);
      document.body.appendChild(toolbar);
      this.toolbar = toolbar;
      this.applyToolbarPosition();
      this.makeToolbarDraggable(toolbar);
      return toolbar;
    }

    removeToolbar() {
      if (this.toolbar && this.toolbar.parentNode) this.toolbar.remove();
      this.toolbar = null;
    }

    applyToolbarPosition() {
      if (!this.toolbar) return;
      const left = Number(this.toolbarUi.left);
      const top = Number(this.toolbarUi.top);
      if (Number.isFinite(left) && Number.isFinite(top)) {
        this.toolbar.style.left = `${Math.max(8, Math.min(window.innerWidth - 80, left))}px`;
        this.toolbar.style.top = `${Math.max(8, Math.min(window.innerHeight - 48, top))}px`;
        this.toolbar.style.right = 'auto';
        this.toolbar.style.bottom = 'auto';
        this.toolbar.style.transform = 'none';
      }
    }

    makeToolbarDraggable(toolbar) {
      let drag = null;
      toolbar.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) return;
        if (event.target && event.target.closest('button,.permanent-toolbar-indicator')) return;
        const rect = toolbar.getBoundingClientRect();
        drag = { dx: event.clientX - rect.left, dy: event.clientY - rect.top, moved: false };
        toolbar.setPointerCapture(event.pointerId);
        toolbar.classList.add('is-dragging');
      });
      toolbar.addEventListener('pointermove', (event) => {
        if (!drag) return;
        drag.moved = true;
        const left = Math.max(8, Math.min(window.innerWidth - toolbar.offsetWidth - 8, event.clientX - drag.dx));
        const top = Math.max(8, Math.min(window.innerHeight - toolbar.offsetHeight - 8, event.clientY - drag.dy));
        toolbar.style.left = `${left}px`;
        toolbar.style.top = `${top}px`;
        toolbar.style.right = 'auto';
        toolbar.style.bottom = 'auto';
        toolbar.style.transform = 'none';
        this.toolbarUi.left = left;
        this.toolbarUi.top = top;
      });
      const end = (event) => {
        if (!drag) return;
        try { toolbar.releasePointerCapture(event.pointerId); } catch (_) { }
        toolbar.classList.remove('is-dragging');
        if (drag.moved) this.requestSave(true);
        drag = null;
      };
      toolbar.addEventListener('pointerup', end);
      toolbar.addEventListener('pointercancel', end);
    }

    createIndicatorCapsule() {
      const indicator = document.createElement('div');
      indicator.className = 'permanent-toolbar-indicator';
      indicator.dataset.dev1SnapshotHighlighterUi = 'true';
      indicator.title = this.t('current');
      indicator.innerHTML = `
        <span class="indicator-color-container"><span class="indicator-color"></span></span>
        <span class="indicator-separator"></span>
        <span class="indicator-tool-container"><span class="indicator-tool"></span></span>
      `;
      indicator.addEventListener('click', (event) => {
        event.stopPropagation();
        this.showIndicatorDetailsPanel(indicator);
      });
      return indicator;
    }

    updatePermanentToolbarIndicator() {
      const indicator = this.toolbar && this.toolbar.querySelector('.permanent-toolbar-indicator');
      if (!indicator) return;
      const colorDot = indicator.querySelector('.indicator-color');
      const toolIcon = indicator.querySelector('.indicator-tool');
      if (colorDot) {
        if (this.isRainbowColor(this.currentColor)) {
          colorDot.style.background = 'conic-gradient(#ff3b30,#ff9500,#ffcc00,#34c759,#00c7ff,#007aff,#af52de,#ff3b30)';
        } else if (this.currentColor === 'transparent') {
          colorDot.style.background = 'linear-gradient(135deg, transparent 0 45%, #ef4444 46% 54%, transparent 55%), repeating-conic-gradient(#ddd 0 25%, #fff 0 50%) 0/8px 8px';
        } else {
          colorDot.style.background = this.currentColor;
        }
      }
      if (toolIcon) toolIcon.textContent = this.getCurrentToolIcon();
      indicator.dataset.tooltip = `${this.t('currentColor')}: ${this.getCurrentColorName()} | ${this.t('currentTool')}: ${this.getCurrentToolName()}`;
    }

    showIndicatorDetailsPanel(anchor) {
      if (this.indicatorPanel && this.indicatorPanel.parentNode) {
        this.indicatorPanel.remove();
        this.indicatorPanel = null;
        return;
      }
      this.closeTransientPanels();
      const panel = this.createPanel('indicator-details-panel', anchor);
      panel.innerHTML = `
        <div class="dev1-panel-title">${this.t('current')}</div>
        <div class="dev1-indicator-row"><span>${this.t('currentColor')}</span><strong>${this.escapeHtml(this.getCurrentColorName())}</strong></div>
        <div class="dev1-indicator-row"><span>${this.t('currentTool')}</span><strong>${this.escapeHtml(this.getCurrentToolName())}</strong></div>
        <div class="dev1-indicator-row"><span>${this.t('highlightCount')}</span><strong>${this.highlights.size}</strong></div>
      `;
      document.body.appendChild(panel);
      this.positionPanel(panel, anchor, 'top');
      this.indicatorPanel = panel;
    }

    showHighlightActionPanel(highlightEl) {
      const highlightId = highlightEl && highlightEl.getAttribute('data-highlight-id');
      if (!highlightId) return;
      if (this.activeHighlightPanel && this.activeHighlightPanel.parentNode) {
        const currentId = this.activeHighlightPanel.dataset.highlightId || '';
        this.activeHighlightPanel.remove();
        this.activeHighlightPanel = null;
        if (currentId === highlightId) return;
      }
      this.closeTransientPanels();
      const entry = this.highlights.get(highlightId) || {};
      const color = entry.color || highlightEl.dataset.color || this.currentColor;
      const colorName = this.getColorNameForValue(color, entry.textColorOverride || '', entry.colorName || highlightEl.dataset.colorName || '', entry.colorNameKey || '');
      const toolName = this.getToolNameForId(entry.toolStyle || highlightEl.dataset.toolStyle || 'highlight');
      const panel = this.createPanel('highlight-action-panel', highlightEl);
      panel.dataset.highlightId = highlightId;
      panel.innerHTML = `
        <div class="dev1-panel-title">${this.escapeHtml(this.t('current'))}</div>
        <div class="dev1-indicator-row"><span>${this.escapeHtml(this.t('currentColor'))}</span><strong>${this.escapeHtml(colorName)}</strong></div>
        <div class="dev1-indicator-row"><span>${this.escapeHtml(this.t('currentTool'))}</span><strong>${this.escapeHtml(toolName)}</strong></div>
      `;
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'danger';
      deleteBtn.textContent = this.t('delete');
      deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation();
        this.removeHighlightById(highlightId);
        if (panel.parentNode) panel.remove();
        this.activeHighlightPanel = null;
        this.requestSave(true);
      });
      panel.appendChild(deleteBtn);
      document.body.appendChild(panel);
      this.positionPanel(panel, highlightEl, 'top');
      this.activeHighlightPanel = panel;
    }

    createPanel(className, anchor) {
      const panel = document.createElement('div');
      panel.className = `dev1-snapshot-highlighter-panel ${className}`;
      panel.dataset.dev1SnapshotHighlighterUi = 'true';
      panel.dataset.anchorId = anchor ? (anchor.id || anchor.className || '') : '';
      return panel;
    }

    positionPanel(panel, anchor, side = 'top') {
      const isPicker = panel.classList.contains('highlight-color-picker') || panel.classList.contains('highlight-tool-picker');
      const anchorElement = isPicker && this.toolbar && anchor && this.toolbar.contains(anchor)
        ? this.toolbar
        : anchor;
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
      const prefersBottom = side === 'bottom';
      const availableAbove = Math.max(0, rect.top - margin - gap);
      const availableBelow = Math.max(0, window.innerHeight - rect.bottom - margin - gap);
      const minimumHeight = isPicker ? 220 : 120;
      let shouldOpenBelow = prefersBottom;
      if (prefersBottom && availableBelow < minimumHeight && availableAbove > availableBelow) {
        shouldOpenBelow = false;
      }
      if (!prefersBottom && availableAbove < minimumHeight && availableBelow > availableAbove) {
        shouldOpenBelow = true;
      }
      const availableHeight = Math.max(0, shouldOpenBelow ? availableBelow : availableAbove);

      if (isPicker) {
        const preferredHeight = panel.classList.contains('highlight-tool-picker') ? 360 : 320;
        const maxViewportHeight = Math.max(minimumHeight, window.innerHeight - margin * 2);
        const nextHeight = Math.max(minimumHeight, Math.min(preferredHeight, availableHeight || preferredHeight, maxViewportHeight));
        panel.style.setProperty('--dev1-picker-height', `${nextHeight}px`);
        panel.style.height = `${nextHeight}px`;
        panel.style.maxHeight = `${nextHeight}px`;
      }

      const panelRect = panel.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - panelRect.width / 2;
      let top = shouldOpenBelow ? rect.bottom + gap : rect.top - panelRect.height - gap;
      left = Math.max(margin, Math.min(window.innerWidth - panelRect.width - margin, left));
      top = Math.max(margin, Math.min(window.innerHeight - panelRect.height - margin, top));
      panel.style.left = `${left}px`;
      panel.style.top = `${top}px`;
      panel.dataset.placement = shouldOpenBelow ? 'bottom' : 'top';
    }

    showColorPicker(anchor) {
      if (this.activeColorPicker && this.activeColorPicker.parentNode) {
        this.activeColorPicker.remove();
        this.activeColorPicker = null;
        return;
      }
      this.closeTransientPanels();
      const panel = this.createPanel('highlight-color-picker', anchor);
      const categories = this.getAllColorCategories();
      panel.innerHTML = `<div class="dev1-picker-sidebar"></div><div class="dev1-picker-content"></div>`;
      const sidebar = panel.querySelector('.dev1-picker-sidebar');
      const content = panel.querySelector('.dev1-picker-content');
      const renderCategory = (category) => {
        content.innerHTML = '';
        const title = document.createElement('div');
        title.className = 'dev1-panel-title';
        title.textContent = category.title;
        content.appendChild(title);
        if (category.id === 'rgb') {
          this.renderRgbPicker(content);
          return;
        }
        const grid = document.createElement('div');
        grid.className = 'dev1-color-grid';
        category.colors.forEach(item => grid.appendChild(this.createColorOption(item)));
        content.appendChild(grid);
      };
      categories.forEach((category, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dev1-picker-tab';
        btn.textContent = category.title;
        btn.addEventListener('click', () => {
          sidebar.querySelectorAll('.dev1-picker-tab').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
          renderCategory(category);
        });
        sidebar.appendChild(btn);
        if (index === 0) {
          btn.classList.add('active');
          renderCategory(category);
        }
      });
      document.body.appendChild(panel);
      this.positionPanel(panel, anchor, 'top');
      this.activeColorPicker = panel;
    }

    renderRgbPicker(content) {
      const wrap = document.createElement('div');
      wrap.className = 'dev1-rgb-picker';
      const input = document.createElement('input');
      input.type = 'color';
      input.value = /^#[0-9a-f]{6}$/i.test(this.currentColor) ? this.currentColor : '#69C0FF';
      const hexInput = document.createElement('input');
      hexInput.type = 'text';
      hexInput.inputMode = 'text';
      hexInput.maxLength = 7;
      hexInput.value = input.value.toUpperCase();
      hexInput.setAttribute('aria-label', 'HEX');
      const rgbFields = ['R', 'G', 'B'].map((labelText, index) => {
        const field = document.createElement('input');
        field.type = 'number';
        field.min = '0';
        field.max = '255';
        field.step = '1';
        field.setAttribute('aria-label', labelText);
        field.dataset.rgbIndex = String(index);
        return field;
      });
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.textContent = this.t('apply');
      const name = document.createElement('span');
      name.textContent = input.value.toUpperCase();
      const setRgbFields = (hex) => {
        const [r, g, b] = parseCssColor(hex);
        rgbFields[0].value = String(r);
        rgbFields[1].value = String(g);
        rgbFields[2].value = String(b);
      };
      const syncFromHex = (hex) => {
        const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : '';
        if (!normalized) return false;
        input.value = normalized;
        hexInput.value = normalized;
        name.textContent = normalized;
        setRgbFields(normalized);
        return true;
      };
      const syncFromRgb = () => {
        const values = rgbFields.map(field => Math.max(0, Math.min(255, Math.round(Number(field.value) || 0))));
        const hex = `#${values.map(value => value.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
        syncFromHex(hex);
      };
      setRgbFields(input.value);
      input.addEventListener('input', () => syncFromHex(input.value));
      hexInput.addEventListener('input', () => {
        const raw = hexInput.value.trim();
        const prefixed = raw.startsWith('#') ? raw : `#${raw}`;
        if (/^#[0-9a-f]{6}$/i.test(prefixed)) syncFromHex(prefixed);
      });
      rgbFields.forEach(field => field.addEventListener('input', syncFromRgb));
      apply.addEventListener('click', () => {
        this.selectColor({ color: input.value.toUpperCase(), key: 'custom_color', name: this.t('customColor') });
      });
      wrap.appendChild(input);
      wrap.appendChild(hexInput);
      rgbFields.forEach(field => wrap.appendChild(field));
      wrap.appendChild(name);
      wrap.appendChild(apply);
      content.appendChild(wrap);
    }

    createColorOption(item) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'color-option';
      const color = item.color;
      if (safeString(color).toLowerCase() === safeString(this.currentColor).toLowerCase()
        && safeString(item.variant || '') === safeString(this.currentColorVariant || '')) {
        btn.classList.add('active');
      }
      const swatch = document.createElement('span');
      swatch.className = 'color-swatch';
      if (this.isRainbowColor(color)) {
        swatch.style.background = 'conic-gradient(#ff3b30,#ff9500,#ffcc00,#34c759,#00c7ff,#007aff,#af52de,#ff3b30)';
      } else if (color === 'transparent') {
        swatch.classList.add('transparent-swatch');
      } else {
        swatch.style.background = color;
      }
      const label = document.createElement('span');
      label.className = 'color-name';
      label.textContent = item.name;
      btn.appendChild(swatch);
      btn.appendChild(label);
      if (item.variant) {
        const variant = document.createElement('span');
        variant.className = 'color-variant';
        variant.textContent = item.variant === 'white' ? 'W' : 'B';
        btn.appendChild(variant);
      }
      btn.addEventListener('click', () => this.selectColor(item));
      return btn;
    }

    selectColor(item) {
      const resolvedVariant = this.resolveColorVariant(item.color, item.variant || '');
      this.currentColor = item.color;
      this.currentColorVariant = resolvedVariant;
      this.currentColorKey = item.key || this.getColorNameKeyForValue(item.color, resolvedVariant, item.name || '');
      this.currentColorName = this.getColorNameForItem(item);
      this.pushRecentColor({ ...item, variant: resolvedVariant });
      this.updatePermanentToolbarIndicator();
      if (this.activeColorPicker) {
        this.activeColorPicker.remove();
        this.activeColorPicker = null;
      }
      this.requestSave(true);
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
      if (raw === 'transparent') return this.darkModeEnabled ? 'white' : 'black';
      try {
        return luminance(raw) < 0.5 ? 'white' : 'black';
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
          colors: this.recentColors.map(item => this.localizeRecentColor(item))
        });
      }
      return colors;
    }

    showToolPicker(anchor) {
      if (this.activeToolPicker && this.activeToolPicker.parentNode) {
        this.activeToolPicker.remove();
        this.activeToolPicker = null;
        return;
      }
      this.closeTransientPanels();
      const panel = this.createPanel('highlight-tool-picker', anchor);
      const categories = this.getAllToolCategories();
      panel.innerHTML = `<div class="dev1-picker-sidebar"></div><div class="dev1-picker-content"></div>`;
      const sidebar = panel.querySelector('.dev1-picker-sidebar');
      const content = panel.querySelector('.dev1-picker-content');
      const renderCategory = (category) => {
        content.innerHTML = '';
        const title = document.createElement('div');
        title.className = 'dev1-panel-title';
        title.textContent = category.title;
        content.appendChild(title);
        const grid = document.createElement('div');
        grid.className = 'dev1-tool-grid';
        category.tools.forEach(tool => grid.appendChild(this.createToolOption(tool)));
        content.appendChild(grid);
      };
      categories.forEach((category, index) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'dev1-picker-tab';
        btn.textContent = `${category.icon || ''} ${category.title}`.trim();
        btn.addEventListener('click', () => {
          sidebar.querySelectorAll('.dev1-picker-tab').forEach(el => el.classList.remove('active'));
          btn.classList.add('active');
          renderCategory(category);
        });
        sidebar.appendChild(btn);
        if (index === 0) {
          btn.classList.add('active');
          renderCategory(category);
        }
      });
      document.body.appendChild(panel);
      this.positionPanel(panel, anchor, 'top');
      this.activeToolPicker = panel;
    }

    createToolOption(tool) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tool-option';
      btn.dataset.toolId = tool.id;
      btn.innerHTML = `<span class="tool-icon">${this.escapeHtml(tool.icon || '•')}</span><span class="tool-name">${this.escapeHtml(tool.name)}</span><span class="tool-desc">${this.escapeHtml(tool.description || '')}</span>`;
      if (tool.id === this.currentTool) btn.classList.add('active');
      btn.addEventListener('click', () => this.selectTool(tool));
      return btn;
    }

    selectTool(tool) {
      if (tool.id === 'md-edit-disable-highlight') {
        this.currentTool = tool.id;
        this.currentToolName = this.getToolNameForId(tool.id, tool.name || '');
        this.pushRecentTool(tool);
        this.updatePermanentToolbarIndicator();
        if (this.activeToolPicker) {
          this.activeToolPicker.remove();
          this.activeToolPicker = null;
        }
        this.showToast(this.t('highlightDisabled'));
        this.requestSave(true);
        return;
      }
      this.currentTool = tool.id;
      this.currentToolName = this.getToolNameForId(tool.id, tool.name || '');
      this.pushRecentTool(tool);
      this.updatePermanentToolbarIndicator();
      if (this.activeToolPicker) {
        this.activeToolPicker.remove();
        this.activeToolPicker = null;
      }
      this.requestSave(true);
    }

    pushRecentTool(tool) {
      const filtered = this.recentTools.filter(item => item.id !== tool.id);
      this.recentTools = [{ id: tool.id, uses: ((tool.uses || 0) + 1) }, ...filtered].slice(0, 16);
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
        { id: 'lines', title: this.t('toolsLines'), icon: '📏', tools: [
          tool('underline', '下划线', 'Underline', 'U̲', '直线下划线', 'Straight underline'),
          tool('double-underline', '双下划线', 'Double Underline', '═', '双线下划线', 'Double line'),
          tool('wavy', '波浪线', 'Wavy Underline', '〰', '波浪下划线', 'Wavy line'),
          tool('dotted', '点状下划线', 'Dotted Underline', '⋯', '点状线条', 'Dotted line'),
          tool('dashed', '虚线下划线', 'Dashed Underline', '┅', '虚线线条', 'Dashed line'),
          tool('strikethrough', '删除线', 'Strikethrough', 'S̶', '文字中线', 'Line through text'),
          tool('thick-underline', '粗下划线', 'Thick Underline', 'U̲̲̲', '加粗下划线', 'Bold underline')
        ] },
        { id: 'frames', title: this.t('toolsFrames'), icon: '📦', tools: [
          tool('box', '矩形框', 'Simple Box', '▢', '矩形边框', 'Rectangular border'),
          tool('filled-box', '填充框', 'Filled Box', '▣', '边框与浅填充', 'Border with matching fill'),
          tool('rounded-box', '圆角框', 'Rounded Box', '▢', '圆角边框', 'Rounded border'),
          tool('dashed-box', '虚线框', 'Dashed Box', '⬚', '虚线边框', 'Dashed border'),
          tool('double-box', '双线框', 'Double Box', '▣', '双线边框', 'Double border'),
          tool('callout', '气泡框', 'Callout', '💬', '气泡样式', 'Speech bubble'),
          tool('sticker', '贴纸', 'Sticker', '🏷', '标签样式', 'Label style'),
          tool('brackets-corner', '直角括号', 'Corner Brackets', '「」', '直角括号', 'Corner brackets'),
          tool('brackets-round', '圆括号', 'Round Brackets', '()', '圆括号', 'Round brackets'),
          tool('brackets-angle', '尖括号', 'Angle Brackets', '<>', '尖括号', 'Angle brackets'),
          tool('brackets-book', '书名号', 'Book Brackets', '《》', '书名号括起', 'Book brackets'),
          tool('brackets-cjk', '方头括号', 'CJK Brackets', '【】', '中文方括号', 'CJK brackets'),
          tool('brackets-curly', '花括号', 'Curly Brackets', '{}', '花括号', 'Curly brackets'),
          tool('brackets-square', '方括号', 'Square Brackets', '[]', '方括号', 'Square brackets'),
          tool('pill', '胶囊', 'Pill', '💊', '胶囊形状', 'Pill shaped')
        ] },
        { id: 'solid', title: this.t('toolsSolid'), icon: '🖍', tools: [
          tool('highlight', '经典高亮', 'Classic Highlight', '🖍', '纯色背景', 'Solid background'),
          tool('marker', '马克笔', 'Marker', '🖊', '马克笔样式', 'Marker style'),
          tool('pastel', '柔和高亮', 'Pastel', '🎨', '柔和背景', 'Soft background'),
          tool('neon', '霓虹高亮', 'Neon', '⚡', '明亮发光', 'Bright glow'),
          tool('transparent', '透明高亮', 'Transparent', '👻', '轻量覆盖', 'Subtle overlay'),
          tool('highlighter-pen', '荧光笔', 'Highlighter Pen', '🖊', '荧光笔效果', 'Realistic highlighter')
        ] },
        { id: 'special', title: this.t('toolsSpecial'), icon: '✨', tools: [
          tool('glow', '发光', 'Glow', '🌟', '外发光', 'Glowing outline'),
          tool('blur', '模糊', 'Blur', '🌫', '模糊背景', 'Blurred background'),
          tool('liquidglass', '液体玻璃', 'Liquid Glass', '💎', '玻璃高亮', 'Glass highlight'),
          tool('mosaic', '马赛克', 'Mosaic', '▦', '马赛克效果', 'Mosaic effect'),
          tool('outline', '文字描边', 'Outline', 'A', '描边文字', 'Outlined text'),
          tool('rainbow', '彩虹', 'Rainbow', '🌈', '彩虹渐变', 'Rainbow gradient'),
          tool('gradient', '渐变', 'Gradient', '🎚', '渐变背景', 'Gradient background')
        ] },
        { id: 'dynamic', title: this.t('toolsDynamic'), icon: '🎞', tools: [
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
      return tool ? tool.icon : '🖍';
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
        this.activeOperationsPanel.remove();
        this.activeOperationsPanel = null;
        return;
      }
      this.closeTransientPanels();
      this.operationsAnchor = anchor || null;
      const panel = this.createPanel('operations-panel', anchor);
      const title = document.createElement('div');
      title.className = 'dev1-panel-title';
      title.textContent = this.t('delete');
      panel.appendChild(title);
      panel.appendChild(this.createOperationButton(this.t('clearAll'), () => this.showClearOptionsPanel(), true));
      panel.appendChild(this.createOperationButton(this.t('batchDelete'), () => this.enterBatchDeleteMode()));
      document.body.appendChild(panel);
      this.positionPanel(panel, anchor, 'top');
      this.activeOperationsPanel = panel;
    }

    createOperationButton(text, action, danger = false, meta = '') {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = danger ? 'danger' : '';
      btn.textContent = text;
      if (meta) {
        const sub = document.createElement('span');
        sub.className = 'dev1-operation-meta';
        sub.textContent = meta;
        btn.appendChild(sub);
      }
      btn.addEventListener('click', (event) => {
        event.stopPropagation();
        action();
      });
      return btn;
    }

    showClearOptionsPanel() {
      if (this.activeOperationsPanel && this.activeOperationsPanel.parentNode) this.activeOperationsPanel.remove();
      const anchor = this.operationsAnchor || this.toolbar;
      const panel = this.createPanel('operations-panel clear-options-panel', anchor);
      const title = document.createElement('div');
      title.className = 'dev1-panel-title';
      title.textContent = this.t('clearOptionsTitle');
      panel.appendChild(title);
      [
        ['all', this.t('clearAll')],
        ['visual', this.t('clearVisual')],
        ['edit', this.t('clearEdit')]
      ].forEach(([mode, label]) => {
        const count = this.getClearCount(mode);
        panel.appendChild(this.createOperationButton(label, () => this.confirmAndClear(mode), true, `${count}`));
      });
      panel.appendChild(this.createOperationButton(this.t('cancel'), () => {
        if (panel.parentNode) panel.remove();
        this.activeOperationsPanel = null;
      }));
      document.body.appendChild(panel);
      this.positionPanel(panel, anchor, 'top');
      this.activeOperationsPanel = panel;
    }

    confirmAndClear(mode) {
      const count = this.getClearCount(mode);
      if (!count) {
        this.showToast(mode === 'edit' ? this.t('emptyEdit') : this.t('cleared'));
        return;
      }
      const label = mode === 'visual' ? this.t('clearVisual') : (mode === 'edit' ? this.t('clearEdit') : this.t('clearAll'));
      if (this.activeOperationsPanel && this.activeOperationsPanel.parentNode) this.activeOperationsPanel.remove();
      const anchor = this.operationsAnchor || this.toolbar;
      const panel = this.createPanel('operations-panel clear-confirm-panel', anchor);
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
        if (panel.parentNode) panel.remove();
        this.activeOperationsPanel = null;
      }, true));
      panel.appendChild(this.createOperationButton(this.t('cancel'), () => {
        if (panel.parentNode) panel.remove();
        this.activeOperationsPanel = null;
      }));
      document.body.appendChild(panel);
      this.positionPanel(panel, anchor, 'top');
      this.activeOperationsPanel = panel;
    }

    getClearCount(mode) {
      if (mode === 'all') return this.highlights.size + this.editFragments.length;
      if (mode === 'edit') {
        return Array.from(this.highlights.values()).filter(entry => this.isEditEntry(entry)).length + this.editFragments.length;
      }
      return Array.from(this.highlights.values()).filter(entry => !this.isEditEntry(entry)).length;
    }

    clearByMode(mode) {
      if (mode === 'all') {
        this.clearAllHighlights();
        this.clearEditFragments();
        return;
      }
      const removeIds = [];
      this.highlights.forEach((entry, id) => {
        const edit = this.isEditEntry(entry);
        if ((mode === 'edit' && edit) || (mode === 'visual' && !edit)) removeIds.push(id);
      });
      removeIds.forEach(id => this.removeHighlightById(id));
      if (mode === 'edit') this.clearEditFragments();
      this.updatePermanentToolbarIndicator();
    }

    enterBatchDeleteMode() {
      this.closeTransientPanels();
      if (this.batchCleanup) this.batchCleanup();
      this.selectedHighlightIds.clear();
      this.selectedEditFragmentIds.clear();
      const overlay = document.createElement('div');
      overlay.id = 'dev1-snapshot-highlighter-batch-overlay';
      overlay.dataset.dev1SnapshotHighlighterUi = 'true';
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      overlay.appendChild(svg);
      const bar = document.createElement('div');
      bar.id = 'dev1-snapshot-highlighter-batch-bar';
      bar.dataset.dev1SnapshotHighlighterUi = 'true';
      const tip = document.createElement('span');
      tip.textContent = this.t('batchTip');
      const cancel = document.createElement('button');
      cancel.type = 'button';
      cancel.textContent = this.t('cancel');
      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'danger';
      let confirmArmed = false;
      const updateDelete = () => {
        const count = this.selectedHighlightIds.size + this.selectedEditFragmentIds.size;
        confirmArmed = false;
        del.textContent = count > 0 ? `${this.t('deleteSelected')} (${count})` : this.t('deleteSelected');
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
        overlay.style.width = `${width}px`;
        overlay.style.height = `${height}px`;
      };
      const selectByPoint = (x, y, toggle = false) => {
        overlay.style.pointerEvents = 'none';
        const el = document.elementFromPoint(x, y);
        overlay.style.pointerEvents = '';
        const hl = el && el.closest && el.closest('.custom-highlight');
        const edit = el && el.closest && el.closest('[data-edit-fragment-id]');
        if (hl) {
          const id = hl.getAttribute('data-highlight-id');
          if (toggle) this.toggleHighlightGroup(id);
          else this.selectHighlightGroup(id, true);
        }
        if (edit) {
          const id = edit.getAttribute('data-edit-fragment-id');
          if (toggle) this.toggleEditFragment(id);
          else this.selectEditFragment(id, true);
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
      const key = (event) => { if (event.key === 'Escape') cleanup(); };
      const cleanup = () => {
        document.removeEventListener('mousemove', move, true);
        document.removeEventListener('mouseup', up, true);
        document.removeEventListener('keydown', key, true);
        window.removeEventListener('resize', updateOverlayBounds, true);
        overlay.removeEventListener('mousedown', down, true);
        if (overlay.parentNode) overlay.remove();
        if (bar.parentNode) bar.remove();
        document.querySelectorAll('.custom-highlight.batch-selected').forEach(el => el.classList.remove('batch-selected'));
        document.querySelectorAll('[data-edit-fragment-id].batch-selected').forEach(el => el.classList.remove('batch-selected'));
        this.selectedHighlightIds.clear();
        this.selectedEditFragmentIds.clear();
        this.batchCleanup = null;
      };
      updateOverlayBounds();
      overlay.addEventListener('mousedown', down, true);
      document.addEventListener('mousemove', move, true);
      document.addEventListener('mouseup', up, true);
      document.addEventListener('keydown', key, true);
      window.addEventListener('resize', updateOverlayBounds, true);
      overlay.addEventListener('click', (event) => {
        if (suppressNextClick) {
          suppressNextClick = false;
          return;
        }
        selectByPoint(event.clientX, event.clientY, true);
      }, true);
      cancel.addEventListener('click', cleanup);
      del.addEventListener('click', () => {
        if (!this.selectedHighlightIds.size && !this.selectedEditFragmentIds.size) {
          this.showToast(this.t('noSelection'));
          return;
        }
        if (!confirmArmed) {
          confirmArmed = true;
          const count = this.selectedHighlightIds.size + this.selectedEditFragmentIds.size;
          del.textContent = `${this.t('confirm')} ${this.t('deleteSelected')} (${count})`;
          this.showToast(this.t('batchConfirmTitle'));
          return;
        }
        Array.from(this.selectedHighlightIds).forEach(id => this.removeHighlightById(id));
        Array.from(this.selectedEditFragmentIds).forEach(id => this.removeEditFragmentById(id));
        cleanup();
        this.requestSave(true);
      });
      this.batchCleanup = cleanup;
    }

    updateSelectionByStroke(points) {
      if (!Array.isArray(points) || !points.length) return;
      const radius = 6;
      document.querySelectorAll('.custom-highlight').forEach(el => {
        const rect = el.getBoundingClientRect();
        const pageRect = { left: rect.left + window.scrollX, right: rect.right + window.scrollX, top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
        const hit = points.some(p => p.x >= pageRect.left - radius && p.x <= pageRect.right + radius && p.y >= pageRect.top - radius && p.y <= pageRect.bottom + radius);
        if (hit) this.selectHighlightGroup(el.getAttribute('data-highlight-id'), true);
      });
      document.querySelectorAll('[data-edit-fragment-id]').forEach(el => {
        if (this.isUiElement(el)) return;
        const rect = el.getBoundingClientRect();
        const pageRect = { left: rect.left + window.scrollX, right: rect.right + window.scrollX, top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY };
        const hit = points.some(p => p.x >= pageRect.left - radius && p.x <= pageRect.right + radius && p.y >= pageRect.top - radius && p.y <= pageRect.bottom + radius);
        if (hit) this.selectEditFragment(el.getAttribute('data-edit-fragment-id'), true);
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
      elements.forEach(el => el.classList.toggle('batch-selected', selected));
      if (selected) this.selectedEditFragmentIds.add(id);
      else this.selectedEditFragmentIds.delete(id);
    }

    toggleEditFragment(id) {
      if (!id) return;
      this.selectEditFragment(id, !this.selectedEditFragmentIds.has(id));
    }

    highlightSelectedText() {
      if (!this.visible || this.isPdfLikePage()) return;
      if (this.currentTool === 'md-edit-disable-highlight') return;
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || !selection.toString().trim()) return;
      if (this.isSelectionInsideUi(selection) || this.isSelectionInHighlight(selection)) return;
      if (!this.isTextOnlySelection(selection)) return;
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
        return !!(el && el.closest && el.closest('.custom-highlight'));
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

    createHighlight(selection, text) {
      let range = null;
      try { range = selection.getRangeAt(0).cloneRange(); } catch (_) { }
      if (!range) return;
      const id = `h-${now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const color = this.currentColor;
      const colorName = this.getCurrentColorName();
      const colorNameKey = this.currentColorKey || this.getColorNameKeyForValue(color, this.currentColorVariant, colorName);
      const toolStyle = this.currentTool || 'highlight';
      const textColorOverride = this.currentColorVariant === 'white' || this.currentColorVariant === 'black' ? this.currentColorVariant : '';
      const segments = this.wrapRangeTextOnly(range, id, color, colorName, toolStyle, textColorOverride);
      if (!segments.length) return;
      const entry = {
        id,
        text,
        color,
        colorNameKey,
        toolStyle,
        mode: this.isEditTool(toolStyle) ? 'edit' : 'visual',
        textColorOverride,
        timestamp: now(),
        url: this.currentUrl,
        pageTitle: document.title || '',
        segments
      };
      this.highlights.set(id, entry);
      this.requestSave(true);
      this.updatePermanentToolbarIndicator();
    }

    wrapRangeTextOnly(range, id, color, colorName, toolStyle, textColorOverride) {
      const textNodes = this.getIntersectingTextNodes(range);
      const prepared = [];
      textNodes.forEach(node => {
        const text = node.nodeValue || '';
        let start = node === range.startContainer ? range.startOffset : 0;
        let end = node === range.endContainer ? range.endOffset : text.length;
        start = Math.max(0, Math.min(text.length, start));
        end = Math.max(start, Math.min(text.length, end));
        let selected = text.slice(start, end);
        const leading = selected.match(/^\s*/)[0].length;
        const trailing = selected.match(/\s*$/)[0].length;
        start += leading;
        end -= trailing;
        selected = text.slice(start, end);
        if (!selected) return;
        const parent = node.parentElement;
        if (!parent || this.isUiElement(parent) || parent.closest('.custom-highlight')) return;
        const parentXPath = this.getXPathForElement(parent);
        const startInParent = this.getTextOffsetWithin(parent, node, start);
        const endInParent = this.getTextOffsetWithin(parent, node, end);
        prepared.push({ node, start, end, selected, parentXPath, startInParent, endInParent, parentText: parent.textContent || '' });
      });
      prepared.sort((a, b) => {
        if (a.node === b.node) return b.start - a.start;
        const pos = a.node.compareDocumentPosition(b.node);
        return pos & Node.DOCUMENT_POSITION_FOLLOWING ? 1 : -1;
      });
      const segments = [];
      prepared.forEach((item, index) => {
        const span = this.wrapTextNodePart(item.node, item.start, item.end, id, color, colorName, toolStyle, textColorOverride, index);
        if (span) {
          segments.push({
            parentXPath: item.parentXPath,
            startInParent: item.startInParent,
            endInParent: item.endInParent,
            text: item.selected,
            parentText: item.parentText,
            partIndex: index
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
          if (parent.closest('script,style,noscript,textarea,input,select,button,.custom-highlight')) return NodeFilter.FILTER_REJECT;
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

    wrapTextNodePart(node, start, end, id, color, colorName, toolStyle, textColorOverride, partIndex) {
      const text = node.nodeValue || '';
      if (start < 0 || end > text.length || start >= end) return null;
      const before = text.slice(0, start);
      const selected = text.slice(start, end);
      const after = text.slice(end);
      const span = document.createElement('span');
      span.className = 'custom-highlight dev1-snapshot-highlight';
      span.dataset.highlightId = id;
      span.dataset.color = color;
      span.dataset.colorName = colorName;
      span.dataset.toolStyle = toolStyle || 'highlight';
      span.dataset.partIndex = String(partIndex || 0);
      if (textColorOverride) span.dataset.textColorOverride = textColorOverride;
      span.textContent = selected;
      this.applyHighlightStyles(span, color, toolStyle, textColorOverride);
      const frag = document.createDocumentFragment();
      if (before) frag.appendChild(document.createTextNode(before));
      frag.appendChild(span);
      if (after) frag.appendChild(document.createTextNode(after));
      node.parentNode.replaceChild(frag, node);
      return span;
    }

    applyHighlightStyles(element, color = this.currentColor, toolStyle = 'highlight', textColorOverride = '') {
      const tool = toolStyle || 'highlight';
      element.className = 'custom-highlight dev1-snapshot-highlight';
      element.classList.add(`tool-${tool}`);
      element.dataset.toolStyle = tool;
      element.dataset.color = color;
      if (textColorOverride) element.dataset.textColorOverride = textColorOverride;
      const variantColor = textColorOverride === 'white' ? '#ffffff' : (textColorOverride === 'black' ? '#000000' : '');
      const textColor = variantColor || contrastText(color, this.darkModeEnabled ? '#ffffff' : '#000000');
      const renderColor = this.getRenderableColor(color, element);
      const rgba = /^#[0-9a-f]{6}$/i.test(renderColor) ? rgbaFromHex(renderColor, 0.32) : renderColor;
      element.style.removeProperty('background');
      element.style.removeProperty('background-color');
      element.style.removeProperty('color');
      element.style.removeProperty('border');
      element.style.removeProperty('box-shadow');
      element.style.removeProperty('text-decoration');
      element.style.removeProperty('text-shadow');
      element.style.setProperty('--dev1-highlight-color', renderColor);
      element.style.setProperty('--dev1-highlight-rgba', rgba);
      element.style.setProperty('--dev1-highlight-text', textColor);
      const lineTools = new Set(['underline', 'double-underline', 'wavy', 'dotted', 'dashed', 'thick-underline', 'strikethrough']);
      if (this.applyMarkdownLikeToolStyle(element, color, tool, textColor, rgba)) {
        return;
      } else if (lineTools.has(tool)) {
        element.style.background = 'transparent';
        element.style.color = 'inherit';
      } else if (tool === 'filled-box') {
        const fillColor = this.isRainbowColor(color) ? this.buildRainbowGradient(color) : rgbaFromHex(color, 0.24);
        const borderColor = this.isRainbowColor(color) ? renderColor : (color === 'transparent' ? (this.darkModeEnabled ? '#e5e7eb' : '#334155') : color);
        element.style.background = fillColor;
        element.style.border = `1.5px solid ${borderColor}`;
        element.style.borderRadius = '3px';
        element.style.padding = '2px 4px';
        element.style.color = textColor;
      } else if (tool === 'outline') {
        element.style.background = 'transparent';
        if (this.isRainbowColor(color)) {
          element.style.background = this.buildRainbowGradient(color);
          element.style.webkitBackgroundClip = 'text';
          element.style.backgroundClip = 'text';
          element.style.color = 'transparent';
          element.style.webkitTextFillColor = 'transparent';
        } else {
          element.style.color = 'transparent';
          element.style.webkitTextStroke = `1px ${color}`;
          element.style.textShadow = `0 0 1px ${color}`;
        }
      } else if (this.isRainbowColor(color) || tool === 'rainbow') {
        element.style.background = this.buildRainbowGradient(color);
        element.style.color = textColorOverride === 'black' ? '#000000' : '#ffffff';
      } else if (color === 'transparent') {
        element.style.background = 'transparent';
        element.style.color = this.darkModeEnabled ? '#ffffff' : '#000000';
        element.style.outline = `1px dashed ${this.darkModeEnabled ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.38)'}`;
      } else if (tool === 'gradient') {
        element.style.background = `linear-gradient(90deg, ${rgbaFromHex(color, 0.85)}, ${rgbaFromHex(color, 0.2)})`;
        element.style.color = textColor;
      } else if (tool === 'marker' || tool === 'highlighter-pen') {
        element.style.background = `linear-gradient(transparent 38%, ${rgbaFromHex(color, 0.78)} 38% 88%, transparent 88%)`;
        element.style.color = this.darkModeEnabled ? '#ffffff' : '#111111';
      } else if (tool === 'pastel' || tool === 'transparent') {
        element.style.background = rgbaFromHex(color, 0.2);
        element.style.color = this.darkModeEnabled ? '#ffffff' : '#111111';
      } else {
        element.style.background = color;
        element.style.color = textColor;
      }
    }

    getRenderableColor(color, element = null) {
      const raw = safeString(color);
      if (this.isRainbowColor(raw)) {
        const palette = ['#ff3b30', '#ff9500', '#ffcc00', '#34c759', '#00c7ff', '#007aff', '#af52de'];
        const id = safeString(element && element.getAttribute && element.getAttribute('data-highlight-id'));
        const seed = parseInt(hashUrl(`${raw}:${id || this.currentUrl}`).slice(0, 8), 36);
        return palette[Math.abs(seed || 0) % palette.length];
      }
      if (raw === 'transparent') return this.darkModeEnabled ? '#e5e7eb' : '#334155';
      return normalizeCssColor(raw) || raw || '#ffeb3b';
    }

    applyMarkdownLikeToolStyle(element, color, tool, textColor, rgba) {
      const id = safeString(tool);
      const isRainbow = this.isRainbowColor(color);
      const renderColor = this.getRenderableColor(color, element);
      const applyTextColor = () => {
        if (isRainbow) {
          element.style.background = this.buildRainbowGradient(color);
          element.style.webkitBackgroundClip = 'text';
          element.style.backgroundClip = 'text';
          element.style.color = 'transparent';
          element.style.webkitTextFillColor = 'transparent';
          return;
        }
        if (color && color !== 'transparent') element.style.color = color;
      };
      const softBg = isRainbow ? this.buildRainbowGradient(color) : rgba;
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
          element.style.textDecoration = `underline solid ${isRainbow ? renderColor : color}`;
          element.style.textDecorationThickness = '2px';
          element.style.textUnderlineOffset = '2px';
          return true;
        case 'md-strikethrough':
        case 'md-edit-strikethrough':
          clearBg();
          element.style.color = isRainbow ? '#ffffff' : (color || 'inherit');
          element.style.textDecoration = `line-through solid ${isRainbow ? renderColor : color}`;
          element.style.textDecorationThickness = '2px';
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
          element.style.color = color && color !== 'transparent' && !isRainbow ? color : 'inherit';
          element.style.paddingLeft = '2px';
          return true;
        case 'md-edit-quote':
          clearBg();
          element.style.borderLeft = `3px solid ${isRainbow ? renderColor : color}`;
          element.style.paddingLeft = '8px';
          element.style.color = 'inherit';
          return true;
        case 'md-edit-code':
        case 'md-edit-code-inline':
          element.style.background = this.darkModeEnabled ? 'rgba(45,45,45,.92)' : 'rgba(244,244,244,.96)';
          element.style.border = `1px solid ${isRainbow ? rgbaFromHex(renderColor, 0.45) : rgbaFromHex(color, 0.42)}`;
          element.style.borderRadius = '4px';
          element.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
          element.style.padding = id === 'md-edit-code' ? '4px 6px' : '1px 4px';
          element.style.color = isRainbow ? renderColor : (color || textColor);
          return true;
        case 'md-edit-hr':
          clearBg();
          element.style.borderBottom = `2px solid ${isRainbow ? renderColor : color}`;
          element.style.paddingBottom = '2px';
          element.style.color = 'transparent';
          return true;
        case 'md-edit-link':
          clearBg();
          element.style.color = isRainbow ? renderColor : color;
          element.style.textDecoration = `underline solid ${isRainbow ? renderColor : color}`;
          element.style.textUnderlineOffset = '2px';
          return true;
        case 'md-edit-image':
        case 'md-edit-table':
          element.style.background = isRainbow ? rgbaFromHex(renderColor, 0.12) : rgbaFromHex(color, 0.12);
          element.style.border = `1px dashed ${isRainbow ? renderColor : color}`;
          element.style.borderRadius = '4px';
          element.style.padding = '2px 6px';
          element.style.color = isRainbow ? renderColor : (color || textColor);
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

    buildRainbowGradient(color) {
      if (color === 'special:rainbow-random') {
        const shift = Math.floor(Math.random() * 360);
        return `linear-gradient(90deg, hsl(${shift},95%,60%), hsl(${(shift + 80) % 360},95%,58%), hsl(${(shift + 170) % 360},95%,62%), hsl(${(shift + 260) % 360},95%,58%))`;
      }
      return 'linear-gradient(90deg,#ff3b30,#ff9500,#ffcc00,#34c759,#00c7ff,#007aff,#af52de)';
    }

    isRainbowColor(color) {
      return safeString(color).startsWith('special:rainbow');
    }

    restoreHighlights() {
      if (!this.highlights.size) return;
      const existing = document.querySelector('.custom-highlight[data-highlight-id]');
      if (existing) return;
      const flattened = [];
      this.highlights.forEach(entry => {
        (entry.segments || []).forEach(segment => flattened.push({ entry, segment }));
      });
      flattened.sort((a, b) => {
        const pa = safeString(a.segment.parentXPath);
        const pb = safeString(b.segment.parentXPath);
        if (pa === pb) return Number(b.segment.startInParent || 0) - Number(a.segment.startInParent || 0);
        return pb.localeCompare(pa);
      });
      flattened.forEach(({ entry, segment }) => {
        this.restoreSegment(entry, segment);
      });
    }

    restoreSegment(entry, segment) {
      const parent = this.evaluateXPath(segment.parentXPath);
      if (!parent) return;
      let start = Number(segment.startInParent);
      let end = Number(segment.endInParent);
      const expected = safeString(segment.text);
      const currentText = parent.textContent || '';
      if (!Number.isFinite(start) || !Number.isFinite(end) || currentText.slice(start, end) !== expected) {
        const found = currentText.indexOf(expected);
        if (found < 0) return;
        start = found;
        end = found + expected.length;
      }
      const startPos = this.findTextPosition(parent, start);
      const endPos = this.findTextPosition(parent, end);
      const colorName = this.getColorNameForValue(entry.color, entry.textColorOverride || '', entry.colorName || '', entry.colorNameKey || '');
      if (!startPos || !endPos) return;
      if (startPos.node !== endPos.node) {
        try {
          const range = document.createRange();
          range.setStart(startPos.node, startPos.offset);
          range.setEnd(endPos.node, endPos.offset);
          this.wrapRangeTextOnly(
            range,
            entry.id,
            entry.color,
            colorName,
            entry.toolStyle || 'highlight',
            entry.textColorOverride || ''
          );
        } catch (_) { }
        return;
      }
      this.wrapTextNodePart(
        startPos.node,
        startPos.offset,
        endPos.offset,
        entry.id,
        entry.color,
        colorName,
        entry.toolStyle || 'highlight',
        entry.textColorOverride || '',
        segment.partIndex || 0
      );
    }

    findTextPosition(parent, charOffset) {
      const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => {
          if (!node.nodeValue) return NodeFilter.FILTER_REJECT;
          if (node.parentElement && node.parentElement.closest(UI_SELECTOR)) return NodeFilter.FILTER_REJECT;
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
      const walker = document.createTreeWalker(parent, NodeFilter.SHOW_TEXT, null);
      let offset = 0;
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (node === textNode) return offset + nodeOffset;
        offset += (node.nodeValue || '').length;
      }
      return offset;
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

    getGroupElements(id) {
      if (!id) return [];
      return Array.from(document.querySelectorAll(`.custom-highlight[data-highlight-id="${CSS.escape(id)}"]`));
    }

    removeHighlightById(id) {
      const elements = this.getGroupElements(id);
      elements.forEach(el => this.unwrapHighlightElement(el));
      this.highlights.delete(id);
      this.updatePermanentToolbarIndicator();
    }

    getEditFragmentId(fragment) {
      return safeString(fragment && (fragment.id || fragment.fragmentId || fragment.editFragmentId));
    }

    getEditFragmentElements(id) {
      if (!id) return [];
      return Array.from(document.querySelectorAll(`[data-edit-fragment-id="${CSS.escape(id)}"]`));
    }

    locateEditTarget(fragment) {
      if (!fragment || typeof fragment !== 'object') return null;
      const id = this.getEditFragmentId(fragment);
      const xpath = safeString(fragment.targetXPath || fragment.xpath || fragment.parentXPath);
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
          target.classList.remove('batch-selected');
          return true;
        } catch (_) { }
      }
      target.removeAttribute('data-edit-fragment-id');
      target.classList.remove('batch-selected');
      return true;
    }

    removeEditFragmentById(id) {
      if (!id) return;
      const index = this.editFragments.findIndex(fragment => this.getEditFragmentId(fragment) === id);
      if (index >= 0) {
        const [fragment] = this.editFragments.splice(index, 1);
        this.getEditFragmentHighlightIds(fragment).forEach(highlightId => this.removeHighlightById(highlightId));
        this.restoreEditFragment(fragment);
        return;
      }
      this.getEditFragmentElements(id).forEach(el => {
        el.removeAttribute('data-edit-fragment-id');
        el.classList.remove('batch-selected');
      });
    }

    clearEditFragments() {
      const fragments = Array.isArray(this.editFragments) ? [...this.editFragments] : [];
      fragments.forEach(fragment => {
        this.getEditFragmentHighlightIds(fragment).forEach(highlightId => this.removeHighlightById(highlightId));
      });
      fragments.forEach(fragment => this.restoreEditFragment(fragment));
      this.editFragments = [];
      this.selectedEditFragmentIds.clear();
    }

    unwrapHighlightElement(el) {
      if (!el || !el.parentNode) return;
      const parent = el.parentNode;
      parent.replaceChild(document.createTextNode(el.textContent || ''), el);
      parent.normalize();
    }

    clearDomHighlights() {
      document.querySelectorAll('.custom-highlight[data-highlight-id]').forEach(el => this.unwrapHighlightElement(el));
    }

    clearAllHighlights() {
      this.clearDomHighlights();
      this.highlights.clear();
      this.updatePermanentToolbarIndicator();
    }

    isUiElement(element) {
      return !!(element && element.closest && element.closest(UI_SELECTOR));
    }

    detectPageTheme() {
      try {
        const themeTokens = [
          document.documentElement?.dataset?.theme,
          document.body?.dataset?.theme,
          document.documentElement?.className,
          document.body?.className
        ].map(value => safeString(value).toLowerCase()).join(' ');
        if (/(^|[\s_-])(dark|night|black|dim)([\s_-]|$)|darkmode|darktheme/.test(themeTokens)) return true;
        if (/(^|[\s_-])(light|white)([\s_-]|$)|lightmode|lighttheme/.test(themeTokens)) return false;
        const metaTheme = document.querySelector('meta[name="theme-color"]')?.getAttribute('content');
        const normalizedMetaTheme = normalizeCssColor(metaTheme);
        if (normalizedMetaTheme && luminance(normalizedMetaTheme) < 0.36) return true;
        if (normalizedMetaTheme && luminance(normalizedMetaTheme) > 0.72) return false;
      } catch (_) { }
      try {
        const points = [
          [Math.floor(window.innerWidth * 0.2), Math.floor(window.innerHeight * 0.2)],
          [Math.floor(window.innerWidth * 0.5), Math.floor(window.innerHeight * 0.2)],
          [Math.floor(window.innerWidth * 0.8), Math.floor(window.innerHeight * 0.2)],
          [Math.floor(window.innerWidth * 0.2), Math.floor(window.innerHeight * 0.5)],
          [Math.floor(window.innerWidth * 0.5), Math.floor(window.innerHeight * 0.5)],
          [Math.floor(window.innerWidth * 0.8), Math.floor(window.innerHeight * 0.5)],
          [Math.floor(window.innerWidth * 0.2), Math.floor(window.innerHeight * 0.8)],
          [Math.floor(window.innerWidth * 0.5), Math.floor(window.innerHeight * 0.8)],
          [Math.floor(window.innerWidth * 0.8), Math.floor(window.innerHeight * 0.8)]
        ];
        let dark = 0;
        let seen = 0;
        points.forEach(([x, y]) => {
          const stack = typeof document.elementsFromPoint === 'function' ? document.elementsFromPoint(x, y) : [document.elementFromPoint(x, y)];
          const el = stack.find(candidate => candidate && !this.isUiElement(candidate));
          if (!el || this.isUiElement(el)) return;
          const bg = this.findEffectiveBackground(el);
          if (!bg) return;
          seen += 1;
          if (luminance(bg) < 0.36) dark += 1;
        });
        if (seen >= 3) return dark / seen > 0.5;
      } catch (_) { }
      try {
        const bg = this.findEffectiveBackground(document.body) || '#ffffff';
        return luminance(bg) < 0.36;
      } catch (_) {
        try {
          return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        } catch (_) {
          return false;
        }
      }
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
    destroy: () => highlighter.destroy(),
    isVisible: () => highlighter.isVisible(),
    _instance: highlighter
  };
})();

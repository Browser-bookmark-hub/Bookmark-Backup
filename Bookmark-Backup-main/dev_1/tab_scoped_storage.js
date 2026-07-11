(function () {
    'use strict';

    const PREFIX = 'dev1_scoped_';

    /**
     * Build storage key: dev1_scoped_{tabId}_{namespace}
     */
    function buildKey(tabId, namespace) {
        const id = Number(tabId);
        if (!Number.isFinite(id)) throw new Error('Invalid tabId');
        return `${PREFIX}${id}_${String(namespace || 'default')}`;
    }

    /**
     * Normalize URL for comparison: keep hashes starting with #/ for hash routing, strip others.
     */
    function normalizeUrl(url) {
        if (!url) return '';
        try {
            const parsed = new URL(url);
            if (parsed.hash && !parsed.hash.startsWith('#/')) {
                parsed.hash = '';
            }
            return parsed.href;
        } catch (_) {
            return String(url).trim();
        }
    }

    /**
     * Read scoped value. Returns null if:
     * - No stored value
     * - Stored URL doesn't match currentUrl (page navigated away)
     */
    async function getScoped(tabId, namespace, currentUrl) {
        const key = buildKey(tabId, namespace);
        const normUrl = normalizeUrl(currentUrl);
        try {
            const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
                ? chrome.storage.local
                : null;
            if (!storage) return null;
            const res = await new Promise(resolve => storage.get([key], resolve));
            const entry = res && res[key];
            if (!entry || typeof entry !== 'object') return null;
            if (normalizeUrl(entry.u) !== normUrl) return null;
            return entry.v;
        } catch (_) {
            return null;
        }
    }

    /**
     * Write scoped value bound to currentUrl.
     */
    async function setScoped(tabId, namespace, currentUrl, value) {
        const key = buildKey(tabId, namespace);
        const normUrl = normalizeUrl(currentUrl);
        try {
            const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
                ? chrome.storage.local
                : null;
            if (!storage) return;
            await new Promise((resolve, reject) => {
                storage.set({ [key]: { v: value, u: normUrl } }, () => {
                    if (chrome.runtime && chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });

            // Register key to dev1ActiveTabKeys
            try {
                const regData = await new Promise(resolve => storage.get(['dev1ActiveTabKeys'], resolve));
                const reg = regData?.dev1ActiveTabKeys || {};
                const idStr = String(tabId);
                if (!reg[idStr]) reg[idStr] = [];
                if (!reg[idStr].includes(key)) {
                    reg[idStr].push(key);
                    await new Promise(resolve => storage.set({ dev1ActiveTabKeys: reg }, resolve));
                }
            } catch (_) {}
        } catch (_) { }
    }

    /**
     * Remove all scoped entries for a tabId.
     */
    async function removeAllForTab(tabId) {
        const id = Number(tabId);
        if (!Number.isFinite(id)) return;
        try {
            const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
                ? chrome.storage.local
                : null;
            if (!storage) return;
            const regData = await new Promise(resolve => storage.get(['dev1ActiveTabKeys'], resolve));
            const reg = regData?.dev1ActiveTabKeys || {};
            const idStr = String(id);
            const keysToRemove = reg[idStr] || [];
            if (keysToRemove.length > 0) {
                await new Promise(resolve => storage.remove(keysToRemove, resolve));
                delete reg[idStr];
                await new Promise(resolve => storage.set({ dev1ActiveTabKeys: reg }, resolve));
            }
        } catch (_) { }
    }

    const api = { getScoped, setScoped, removeAllForTab, buildKey, PREFIX };
    if (typeof window !== 'undefined') {
        window.__dev1TabScopedStorage = api;
    }
    if (typeof globalThis !== 'undefined') {
        globalThis.__dev1TabScopedStorage = api;
    }
})();

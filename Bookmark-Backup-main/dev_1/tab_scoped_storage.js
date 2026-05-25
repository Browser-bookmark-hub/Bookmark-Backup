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
     * Read scoped value. Returns null if:
     * - No stored value
     * - Stored URL doesn't match currentUrl (page navigated away)
     */
    async function getScoped(tabId, namespace, currentUrl) {
        const key = buildKey(tabId, namespace);
        try {
            const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
                ? chrome.storage.local
                : null;
            if (!storage) return null;
            const res = await new Promise(resolve => storage.get([key], resolve));
            const entry = res && res[key];
            if (!entry || typeof entry !== 'object') return null;
            if (String(entry.u || '') !== String(currentUrl || '')) return null;
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
        try {
            const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
                ? chrome.storage.local
                : null;
            if (!storage) return;
            await new Promise((resolve, reject) => {
                storage.set({ [key]: { v: value, u: String(currentUrl || '') } }, () => {
                    if (chrome.runtime && chrome.runtime.lastError) {
                        reject(chrome.runtime.lastError);
                    } else {
                        resolve();
                    }
                });
            });
        } catch (_) { }
    }

    /**
     * Remove all scoped entries for a tabId.
     */
    async function removeAllForTab(tabId) {
        const id = Number(tabId);
        if (!Number.isFinite(id)) return;
        const prefix = `${PREFIX}${id}_`;
        try {
            const storage = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local)
                ? chrome.storage.local
                : null;
            if (!storage) return;
            const all = await new Promise(resolve => storage.get(null, resolve));
            const keysToRemove = Object.keys(all || {}).filter(k => k.startsWith(prefix));
            if (keysToRemove.length > 0) {
                await new Promise(resolve => storage.remove(keysToRemove, resolve));
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

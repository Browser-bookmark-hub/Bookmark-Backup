(function () {
  'use strict';

  const HOOK_KEY = '__dev1SnapshotHighlighterHistoryHooked';
  const URL_CHANGE_EVENT = 'dev1SnapshotHighlighterUrlChange';

  if (window[HOOK_KEY]) return;

  function notify() {
    try {
      window.dispatchEvent(new Event(URL_CHANGE_EVENT));
    } catch (_) { }
  }

  try {
    ['pushState', 'replaceState'].forEach((method) => {
      const original = history[method];
      if (typeof original !== 'function') return;
      history[method] = function dev1SnapshotHighlighterHistoryMethod(...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      };
    });
    window.addEventListener('popstate', notify);
    window.addEventListener('hashchange', notify);
    window[HOOK_KEY] = true;
  } catch (_) { }
})();

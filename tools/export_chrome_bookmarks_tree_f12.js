(async function () {
    if (typeof chrome === 'undefined' || !chrome.bookmarks || !chrome.bookmarks.getTree) {
        throw new Error('chrome.bookmarks.getTree is unavailable. Open DevTools for the extension popup or service worker.');
    }

    const tree = await chrome.bookmarks.getTree();
    const blob = new Blob([JSON.stringify(tree, null, 2)], {
        type: 'application/json;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chrome-bookmarks-getTree.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);

    console.log(tree);
}());

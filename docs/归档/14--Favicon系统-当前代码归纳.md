# Favicon 系统当前代码归纳

整理基准：2026-07-04 当前代码现状。

这份文档不是历史计划，而是为了替换旧的 favicon 计划文档，补齐归档目录中的当前实现快照。后续如果 favicon 代码继续变化，应以代码为准。

## 1. 当前结论

当前 favicon 系统是独立能力，不属于备份、恢复、GitHub/WebDAV 同步或旧迁移计划的附属功能。不要因为清理旧同步/旧计划文档而删除 manifest 中的 `favicon` 权限或 `<all_urls>`。

当前系统由三层组成：

- 历史页完整缓存与渲染：`history_html/history.js` 的 `FaviconCache`、`getFaviconUrl()`、`getFaviconUrlAsync()`、`updateFaviconImages()`、`warmupFaviconCache()`。
- 弹窗页轻量缓存与渲染：`popup.js` 也有一套同名 `FaviconCache`，共享 IndexedDB 名称和 store，但参数更偏高质量图标。
- 后台 tab favicon 补充：`background.js` 监听 `tabs.onUpdated` 的 `changeInfo.favIconUrl`，转换成 data URL 后广播给前台页面。

## 2. Manifest 与权限

当前 `manifest.json` 中 favicon 相关点：

- `permissions` 包含 `favicon`。
- `host_permissions` 包含 `<all_urls>`。

`<all_urls>` 与 `favicon` 当前仍有用途：

- 前台 `FaviconCache` 会跨域请求 Google S2、Cravatar、DuckDuckGo、GStatic 等 favicon 源。
- 前台会通过浏览器内置 `/_favicon/` 服务兜底。
- 后台会把 `tab.favIconUrl` 或 `/_favicon` 结果转换为 data URL，再发给前台缓存。

## 3. 缓存模型

当前缓存数据库：

```text
IndexedDB: BookmarkFaviconCache
store: favicons
failure store: failures
key: hostname/domain
```

历史页 `history_html/history.js` 的核心参数：

- `failureTtlMs = 60000`
- `requestTimeoutMs = 2200`
- `maxFetchedBytes = 512 * 1024`
- `minFaviconDimensionPx = 16`
- `minFallbackFaviconDimensionPx = 16`
- `minTerminalFallbackFaviconDimensionPx = 16`
- `browserFaviconSizeCandidates = [16, 32, 64, 96, 128]`
- `publicFaviconSizeCandidates = [64, 96, 128, 192, 256]`
- `googleS2SizeCandidates = [64, 128]`
- `cravatarSizeCandidates = [64, 128]`
- `cacheQualityVersion = 3`

历史页内存缓存：

- `memoryCache`：hostname -> favicon data URL，最多 4000。
- `dimensionCache`：data URL -> 图片尺寸，最多 3000。
- `visualProfileCache`：data URL -> 视觉特征，最多 3000。
- `failureCache`：hostname -> 最近失败时间，最多 4000。
- `cravatarDefaultCheckCache`：Cravatar 默认图标检测结果，最多 1200。
- `pendingRequests`：按 hostname 合并进行中的请求。

弹窗页 `popup.js` 的核心参数与历史页不同：

- `requestTimeoutMs = 4000`
- `minFaviconDimensionPx = 96`
- `minFallbackFaviconDimensionPx = 32`
- `browserFaviconSizeCandidates = [128, 96, 64]`
- `publicFaviconSizeCandidates = [256, 192, 128, 96, 64]`
- 没有 `visualProfileCache`，链路比历史页轻。

容量清理：

- `FaviconCache.init()` 成功后调用 `scheduleIdleCleanup()`。
- `checkAndEvictOldest()` 在 `favicons` store 数量达到 2000 个域名时，按 `timestamp` 淘汰最老 500 个。
- 淘汰时同步删除 `memoryCache` 中对应 domain。

## 4. 前台获取流程

同步入口 `getFaviconUrl(url)` 用于渲染时兼容：

1. 只接受 `http://` / `https://`，并过滤 localhost、内网地址、`.local`。
2. 按 hostname 查 `FaviconCache.memoryCache`。
3. 命中短期失败缓存时先返回灰色星标，同时异步忽略失败缓存重试。
4. 未命中时异步触发 `FaviconCache.fetch(url)`。
5. 当前渲染先返回灰色星标 `fallbackIcon`。
6. 异步成功后调用 `updateFaviconImages(url, dataUrl)` 刷新页面中同 hostname 的图标。

异步入口：

```js
getFaviconUrlAsync(url, options)
```

会直接等待 `FaviconCache.fetch(url, options)`。

预热入口：

```js
warmupFaviconCache(bookmarkUrls)
```

会把 IndexedDB 中已有的 hostname 图标批量加载到 `memoryCache`，主要用于避免历史页切换视图时真实 favicon 闪回灰色星标。

## 5. 图标来源顺序

历史页 `history_html/history.js` 会根据语言/网络分支构造不同来源。

中文/国内分支：

```text
Cravatar -> Google S2 -> browser /_favicon
```

非中文/海外分支：

```text
Google S2 -> DuckDuckGo -> t3.gstatic.com -> browser /_favicon
```

浏览器内置 favicon 服务：

```text
chrome-extension://.../_favicon/?pageUrl=...&size=...
```

历史页的 `_fetchFavicon()` 分三轮：

- 第一轮：严格阈值，默认极速链路，通常 >= 16px；高分辨率请求会拉高 strict minimum。
- 第二轮：如果需要，放宽到 fallback 阈值。
- 第三轮：终极兜底，最低放宽到 `minTerminalFallbackFaviconDimensionPx`。

弹窗页 `popup.js` 也使用 Google S2、Cravatar、DuckDuckGo、GStatic、`/_favicon/`，但默认更偏 96px 以上的高质量图标。

## 6. 后台广播流程

`background.js` 监听 `browserAPI.tabs.onUpdated`：

1. 只处理 `changeInfo.favIconUrl` 且 tab URL 是 HTTP/HTTPS 的页面。
2. 跳过 localhost、内网地址和 `.local`。
3. 对同一个 URL 做 `FAVICON_UPDATE_COOLDOWN = 5000` 冷却。
4. 优先使用 `tab.favIconUrl || changeInfo.favIconUrl`。
5. 如果 primary favicon 不可抓取或失败，回退到：

```text
/_favicon?pageUrl=...&size=32
```

6. `convertFaviconToBase64()` 校验可抓取协议、HTTP 状态、content-type、大小、尺寸，并转换为 data URL。
7. 成功后广播：

```js
{
  action: 'updateFaviconFromTab',
  url: tab.url,
  favIconUrl: finalDataUrl
}
```

前台收到后会判断是否为 `data:image/`，再写入 `FaviconCache.save()` 并刷新已渲染 DOM。

## 7. 渲染覆盖范围

历史页会更新这些图标元素：

```text
img.tree-icon
img.change-tree-item-icon
img.search-result-favicon
img[class*="favicon"]
img[data-bookmark-url]
img[data-node-url]
img[data-url]
img[data-favicon-url]
```

弹窗页会更新较小范围：

```text
img.tree-icon
img[data-bookmark-url]
img[data-node-url]
img[data-url]
```

搜索页 `history_html/search/search.js` 使用全局 `getFaviconUrl()`，渲染 `search-result-favicon`，并通过 data attributes 绑定原 URL。

## 8. 删除与显式清理

当前仍存在显式 runtime message：

```js
{ action: 'clearFaviconCache', url }
```

前台收到后会调用 `FaviconCache.clear(url)`，按 hostname 删除：

- `memoryCache`
- 尺寸/视觉相关内存缓存
- `failureCache`
- IndexedDB `favicons`
- IndexedDB `failures`

注意：普通书签删除是否触发 favicon 清理，必须以当前书签删除/实时更新代码为准，不能从旧计划推断。favicon 缓存以 hostname 为主键，同域多个书签共享图标，直接清理可能影响仍存在的同域书签。

## 9. 当前注意点

- favicon 当前没有独立自动化测试覆盖。
- 历史页和弹窗页各有一套 `FaviconCache`，共享 IndexedDB 名称和 store，但策略参数不同。
- 缓存主键是 hostname，不是完整 URL；同域不同页面共享 favicon 是当前设计。
- 灰色星标 fallback 是正常占位，不代表最终获取失败。
- failure cache 只短期抑制频繁失败，失败域名后续仍会重试。
- Cravatar 默认图标会通过固定 SHA-256 和字节数检测后丢弃，避免把默认占位图当真实 favicon。
- `cacheQualityVersion = 3` 当前同时出现在历史页和弹窗页；升级该值会清空 favicon/failure store。
- 后台 `convertFaviconToBase64()` 支持 http/https/data/blob/扩展协议和相对路径，但会拒绝不可 fetch 的 scheme。
- 不要用旧的三项目 favicon 计划判断 Bookmark Backup 当前状态；本项目当前事实以 `history_html/history.js`、`popup.js`、`background.js` 和 `manifest.json` 为准。

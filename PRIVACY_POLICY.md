[简体中文](#简体中文) | [English](#english)

---
<a name="简体中文"></a>

# 书签备份扩展程序隐私政策

**最后更新日期:** 2026年05月07日

本隐私政策描述了"书签备份"扩展程序（以下简称"本扩展"）如何处理您的信息。我们极度重视您的隐私。本扩展的核心原则是：**您的数据，永远属于您自己**。

## 1. 我们处理的数据

为了实现核心功能，本扩展需要处理以下类型的数据：

*   **您的书签数据**: 包括您书签的URL、标题和文件夹结构。这是创建备份文件所必需的。
*   **您的云端备份凭据**: 如果您选择使用 WebDAV 或 GitHub 仓库（云端二）作为备份目标，您需要提供相应的服务器 URL、用户名、密码或个人访问令牌（PAT）。
*   **您的网页快照与缓存数据**: 当您使用网页快照和辅助留存工具时，扩展可能会在本地临时生成或缓存 MHTML、截图、录屏或 favicon 数据。

## 2. 您的数据如何被处理

**您的所有数据都永远在您的掌控之中。**

*   **本地处理**: 所有的数据处理（包括读取书签、生成备份文件、截取网页快照等）都在您自己设备上的浏览器内部完全本地完成。
*   **本地存储**: 您的所有设置、历史索引和云端凭据都通过 `chrome.storage.local` API 存储在您自己的计算机上。开发者或任何第三方都无法访问这些数据。
*   **本地下载与导出**: 当您执行本地备份或导出时，扩展会调用浏览器的下载功能，将文件直接保存到您的本地设备中。
*   **云端同步 (WebDAV & GitHub)**: 当您使用云端备份功能时，本扩展会将您的书签数据**直接从您的浏览器发送到您自己配置的 WebDAV 服务器或 GitHub 仓库**。开发者**无法**访问您的服务器、仓库或您的任何凭据，也无法接触正在传输的数据。所有的网络连接都是由您的浏览器直接建立的。

**我们，"书签备份"扩展程序的开发者，绝不会收集、存储、查看或以任何方式访问您的书签数据、网页快照或您的凭据。**

## 3. 权限说明

本扩展请求的权限都严格用于其声明的核心功能：
*   `bookmarks`: 用于读取和写入您的书签以进行备份与恢复。
*   `storage`: 用于在本地保存您的设置和历史索引。
*   `downloads`: 用于将本地备份、导出数据或网页快照保存到您的设备。
*   `tabs`, `windows`, `pageCapture`: 仅用于在您主动需要时执行网页快照、截图或录屏等辅助动作，所有处理均在本地进行。
*   `host_permissions`: 仅用于允许扩展直接连接到**您自己**配置的 WebDAV 服务器或 GitHub API 接口。

## 4. 政策变更

我们可能会不时更新我们的隐私政策。我们会通过在此页面上发布新的隐私政策来通知您任何更改。

## 5. 联系我们

如果您对本隐私政策有任何疑问，您可以通过在我们的 [GitHub仓库](https://github.com/kwenxu/Bookmark-Backup/issues) 提交一个 issue 来联系我们。

---
<a name="english"></a>

# Privacy Policy for Bookmark Backup

**Last Updated:** 2026-05-07

This Privacy Policy describes how Bookmark Backup ("the Extension") handles your information. Your privacy is critically important to us. The core principle of this extension is that **your data is YOUR data**.

## 1. Data We Handle

The Extension needs to handle the following types of user data to perform its core functions:

*   **Your Bookmarks:** This includes the URL, title, and folder structure of your bookmarks. This data is required to create backup and history files.
*   **Your Cloud Credentials:** If you choose to use the WebDAV or GitHub repository backup targets, you will need to provide your corresponding server URL, username, password, or Personal Access Token (PAT).
*   **Your Web Snapshots & Caches:** When using web snapshot and helper tools, MHTML files, screenshots, recordings, or favicon caches may be generated locally.

## 2. How Your Data is Handled

**Your data never leaves your control.**

*   **Local Processing:** All data processing, including reading your bookmarks, preparing backups, and capturing web snapshots, happens locally within your browser on your own device.
*   **Local Storage:** Your settings, history indexes, and cloud credentials are stored locally on your computer using the `chrome.storage.local` API. This data is not accessible to the developer or any other third party.
*   **Local Downloads & Exports:** When performing a local backup or export, the extension saves the files directly to your local device using the browser's download mechanisms.
*   **Cloud Sync (WebDAV & GitHub):** If you use the cloud backup features, the Extension will send your bookmark data **directly from your browser to the WebDAV server or GitHub repository you have configured**. The developer **does not** have access to your servers, your repositories, your credentials, or the data being transmitted. The connections are made directly by your browser.

**We, the developers of Bookmark Backup, do not collect, store, see, or have any access to your bookmarks, web snapshots, or your credentials.**

## 3. Permissions Justification

The Extension requests certain permissions to function. All permissions are strictly used for the stated core purposes of the extension:
*   `bookmarks`: To read and write your bookmarks for backup and restore workflows.
*   `storage`: To save your settings and history indexes locally.
*   `downloads`: To save local backups, exported data, or web snapshots directly to your device.
*   `tabs`, `windows`, `pageCapture`: To perform web snapshots, screenshots, or screen recordings when triggered by you. All processing is completely local.
*   `host_permissions`: To allow the extension to connect directly to the WebDAV server or GitHub APIs **you** provide.

## 4. Changes to This Privacy Policy

We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.

## 5. Contact Us

If you have any questions about this Privacy Policy, you can contact us by opening an issue on our [GitHub repository](https://github.com/kwenxu/Bookmark-Backup/issues). 
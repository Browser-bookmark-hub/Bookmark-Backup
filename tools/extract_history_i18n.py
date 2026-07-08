#!/usr/bin/env python3
"""
Extract history_html/history.js localization data into history_i18n.js.

This mirrors the reference repo's low-risk split: move the existing i18n
section as one contiguous block and load it before history.js.
"""

from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[1]
HISTORY_DIR = REPO_ROOT / "Bookmark-Backup-main" / "history_html"
JS_PATH = HISTORY_DIR / "history.js"
HTML_PATH = HISTORY_DIR / "history.html"
I18N_PATH = HISTORY_DIR / "history_i18n.js"

I18N_HEADER = "// 国际化文本"
NEXT_HEADER = "// 初始化"


def find_section(lines):
    start = -1
    end = -1

    for idx, line in enumerate(lines):
        if line.strip() == I18N_HEADER:
            start = idx
            break
    if start == -1:
        raise RuntimeError(f"Could not find i18n header: {I18N_HEADER}")

    while start > 0:
        prev = lines[start - 1].strip()
        if prev.startswith("//") or prev == "":
            start -= 1
        else:
            break

    for idx in range(start + 1, len(lines)):
        if lines[idx].strip() == NEXT_HEADER:
            end = idx
            break
    if end == -1:
        raise RuntimeError(f"Could not find next section header: {NEXT_HEADER}")

    while end > start:
        prev = lines[end - 1].strip()
        if prev.startswith("//") or prev == "":
            end -= 1
        else:
            break

    return start, end


def update_html():
    html = HTML_PATH.read_text(encoding="utf-8")
    i18n_tag = '<script src="history_i18n.js" defer></script>'
    history_tag = '<script src="history.js" defer></script>'
    if i18n_tag in html:
        return
    if history_tag not in html:
        raise RuntimeError(f"Could not find script tag: {history_tag}")
    HTML_PATH.write_text(
        html.replace(history_tag, f"{i18n_tag}\n    {history_tag}", 1),
        encoding="utf-8",
    )


def main():
    lines = JS_PATH.read_text(encoding="utf-8").splitlines(keepends=True)
    start, end = find_section(lines)

    section_lines = lines[start:end]
    I18N_PATH.write_text("".join(section_lines), encoding="utf-8")

    replacement = [
        "// =============================================================================\n",
        "/* 国际化文本 - 已移动到 history_i18n.js */\n",
        "// =============================================================================\n",
        "\n",
    ]
    JS_PATH.write_text("".join(lines[:start] + replacement + lines[end:]), encoding="utf-8")
    update_html()

    print(f"Extracted lines {start + 1}-{end} to {I18N_PATH}")


if __name__ == "__main__":
    main()

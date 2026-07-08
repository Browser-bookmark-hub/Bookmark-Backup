#!/usr/bin/env python3
"""
reorganize_sections.py

A general-purpose tool to reorganize sections in a JavaScript file based on a JSON configuration.
This script slices a JS file using comments as boundaries and regroups them into structured sections
with a generated Table of Contents at the top.

Usage:
  python3 reorganize_sections.py --config config.json
"""

import os
import sys
import json
import shutil
import argparse
import subprocess


def parse_args():
    parser = argparse.ArgumentParser(description="Reorganize JS files based on section comment markers.")
    parser.add_argument("--config", required=True, help="Path to the JSON configuration file.")
    parser.add_argument("--no-backup", action="store_true", help="Disable creating a backup of the source file.")
    parser.add_argument("--check-command", help="Command to check syntax after reorganizing (e.g., 'node -c').")
    return parser.parse_args()


def load_config(config_path):
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def find_chunk_boundaries(lines, markers):
    found_markers = []
    for m in markers:
        name = m["name"]
        exact = m["exact"]
        found_idx = -1
        for i, line in enumerate(lines):
            if line.strip() == exact:
                found_idx = i
                break
        if found_idx == -1:
            raise ValueError(f"Required marker not found in source file: '{exact}'")
        found_markers.append((name, found_idx))

    # Trace back to find start indices (including header comments and empty lines)
    computed_starts = []
    for name, idx in found_markers:
        start_idx = idx
        while start_idx > 0:
            prev_line = lines[start_idx - 1].strip()
            if prev_line.startswith("//") or prev_line == "":
                start_idx -= 1
            else:
                break
        computed_starts.append((name, start_idx))

    # Sort chunks by start index to ensure we partition the file linearly
    computed_starts.sort(key=lambda x: x[1])
    return computed_starts


def main():
    args = parse_args()
    try:
        config = load_config(args.config)
    except Exception as e:
        print(f"Error loading config file: {e}")
        sys.exit(1)

    source_file = config.get("source_file")
    if not source_file:
        print("Config must specify 'source_file'")
        sys.exit(1)

    source_file = os.path.abspath(source_file)
    if not os.path.exists(source_file):
        print(f"Source file not found: {source_file}")
        sys.exit(1)

    # 1. Backup source file
    if not args.no_backup:
        backup_file = source_file + ".bak"
        if not os.path.exists(backup_file):
            print(f"Creating backup: {backup_file}")
            shutil.copy2(source_file, backup_file)
        else:
            print(f"Backup already exists: {backup_file}")

    # 2. Read source file
    with open(source_file, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # 3. Find chunk boundaries
    try:
        chunk_starts = find_chunk_boundaries(lines, config.get("markers", []))
    except Exception as e:
        print(f"Error finding markers: {e}")
        sys.exit(1)

    # Slice the lines into chunks
    chunks = {}
    for i in range(len(chunk_starts)):
        name, start = chunk_starts[i]
        end = chunk_starts[i + 1][1] if i + 1 < len(chunk_starts) else len(lines)
        chunks[name] = lines[start:end]

    # 4. Generate reorganized content
    new_lines = []
    toc_title = config.get("table_of_contents_title", "TABLE OF CONTENTS (目录索引)")

    new_lines.append("// =================================================================================\n")
    new_lines.append(f"// {toc_title}\n")
    new_lines.append("// =================================================================================\n")

    sections = config.get("sections", [])
    for sec in sections:
        roman = sec["id"]
        title = sec["title"]
        roman_padded = f"{roman}."
        new_lines.append(f"// {roman_padded:<6} {title}\n")
    new_lines.append("// =================================================================================\n\n")

    # Output each section and its mapped chunks
    for sec in sections:
        roman = sec["id"]
        title = sec["title"]
        new_lines.append("// =================================================================================\n")
        new_lines.append(f"// {roman}. {title}\n")
        new_lines.append("// =================================================================================\n\n")

        for chunk_name in sec["chunks"]:
            if chunk_name not in chunks:
                print(f"Warning: Chunk '{chunk_name}' specified in section '{roman}' was not found in source.")
                continue
            chunk_lines = chunks[chunk_name]
            new_lines.extend(chunk_lines)
            if chunk_lines and not chunk_lines[-1].endswith("\n"):
                new_lines.append("\n")
            new_lines.append("\n")

    # 5. Write to destination file
    try:
        with open(source_file, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"Reorganization completed successfully! Written to: {source_file}")
    except Exception as e:
        print(f"Error writing to source file: {e}")
        sys.exit(1)

    # 6. Syntax Check
    check_cmd = args.check_command or config.get("check_command")
    if check_cmd:
        print(f"Running syntax verification command: {check_cmd} ...")
        cmd_parts = check_cmd.split()
        cmd_parts.append(source_file)
        try:
            res = subprocess.run(cmd_parts, capture_output=True, text=True)
            if res.returncode == 0:
                print("Syntax check PASSED successfully!")
            else:
                print("Syntax check FAILED!")
                print(res.stderr)
                if not args.no_backup:
                    shutil.copy2(backup_file, source_file)
                    print("Restored backup due to syntax errors.")
                sys.exit(1)
        except Exception as e:
            print(f"Failed to execute syntax check command: {e}")


if __name__ == "__main__":
    main()

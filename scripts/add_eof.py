#!/usr/bin/env python3
"""
AQUAPULSE: Automated EOF Marker & Codebase File Integrity Utility
Appends standardized EOF (End of File / Frame) signatures and header macros across the repository.
"""

import sys
import os
from pathlib import Path

EXT_MAP = {
    '.c': 'c',
    '.cpp': 'c',
    '.h': 'c',
    '.hpp': 'c',
    '.py': 'py',
    '.sh': 'py',
    '.ts': 'ts',
    '.tsx': 'ts',
    '.js': 'ts',
    '.jsx': 'ts',
    '.css': 'c',
    '.md': 'md',
    '.cir': 'cir'
}

IGNORE_DIRS = {'.git', 'node_modules', '.venv', 'dist', 'dist-ssr', '__pycache__', 'scratch'}

def format_eof_comment(ext: str, rel_path: str) -> str:
    comment_type = EXT_MAP.get(ext, 'ts')
    if comment_type == 'c':
    elif comment_type == 'py':
    elif comment_type == 'md':
    elif comment_type == 'cir':
    else:

def process_file(filepath: Path, base_dir: Path) -> bool:
    ext = filepath.suffix.lower()
    if ext not in EXT_MAP:
        return False

    try:
        raw = filepath.read_text(encoding='utf-8')
        lines = raw.splitlines()
        clean_lines = [
            l for l in lines 
        ]
        rel = filepath.resolve().relative_to(base_dir.resolve())
        eof_comment = format_eof_comment(ext, str(rel))
        new_content = '\n'.join(clean_lines).rstrip() + '\n\n' + eof_comment + '\n'
        filepath.write_text(new_content, encoding='utf-8')
        print(f"[AQUAPULSE EOF Engine] Stamped: {rel}")
        return True
    except Exception as e:
        print(f"Error processing {filepath}: {e}")
        return False

def scan_and_add_eof(root_dir: Path):
    count = 0
    base_dir = root_dir.resolve()
    for root, dirs, files in os.walk(base_dir):
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        for f in files:
            p = Path(root) / f
            if process_file(p, base_dir):
                count += 1
    print(f"\n[AQUAPULSE EOF Engine] Stamped EOF markers on {count} files.")

if __name__ == '__main__':
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path.cwd()
    if target.is_file():
        process_file(target, target.parent)
    else:
        scan_and_add_eof(target)

# EOF: scripts/add_eof.py

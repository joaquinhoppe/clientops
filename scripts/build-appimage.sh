#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "=========================================================="
echo "          Building ClientOps Linux AppImage               "
echo "=========================================================="

npm --prefix frontend run package:appimage

echo ""
echo ">> AppImage Build Complete!"
echo ">> Output file:"
ls -lh "$ROOT_DIR/frontend/release/"*.AppImage

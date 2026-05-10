#!/bin/bash
# 配布用ZIPを生成するスクリプト
# 使い方: ./scripts/package-zip.sh
# 出力: dist/mirai-admin-beta-<日付>.zip

set -e
cd "$(dirname "$0")/.."

echo "▶ Next.js をビルド中..."
npm run build

DIST_NAME="mirai-admin-beta"
INNER_NAME="📁 アプリ本体（さわらないでください）"
STAMP=$(date +%Y%m%d-%H%M%S)
STAGE="dist/${DIST_NAME}"
INNER="${STAGE}/${INNER_NAME}"

echo "▶ ステージング: ${STAGE}"
rm -rf "dist"
mkdir -p "${INNER}"

# Next.js standalone のサーバ + 必要なアセットを「📁 アプリ本体」の中へ
cp -R .next/standalone/. "${INNER}/"
mkdir -p "${INNER}/.next"
cp -R .next/static "${INNER}/.next/static"
cp -R public "${INNER}/public" 2>/dev/null || true

# データディレクトリは「📁 アプリ本体」内に空で作る
mkdir -p "${INNER}/data/receipt-images"

# ランチャー本体スクリプトも内側へ
cp scripts/launcher/start.mjs "${INNER}/start.mjs"

# トップ階層: ユーザーがクリックするのは これだけ
cp scripts/launcher/launch-mac.command "${STAGE}/🌱 アプリを起動 (Mac).command"
cp scripts/launcher/launch-windows.bat "${STAGE}/🌱 アプリを起動 (Windows).bat"
cp scripts/launcher/README-はじめにお読みください.txt "${STAGE}/📌 まずはこれを読む.txt"

chmod +x "${STAGE}/🌱 アプリを起動 (Mac).command"

# ZIP化
ZIP_PATH="dist/${DIST_NAME}-${STAMP}.zip"
echo "▶ ZIP生成: ${ZIP_PATH}"
cd dist
zip -qr "${DIST_NAME}-${STAMP}.zip" "${DIST_NAME}"
cd ..

SIZE=$(du -sh "${ZIP_PATH}" | cut -f1)
echo ""
echo "============================================"
echo "  ✓ 完成: ${ZIP_PATH} (${SIZE})"
echo "============================================"
echo ""
echo "ZIP直下の見た目（解凍後）:"
echo "  ├── 🌱 アプリを起動 (Mac).command"
echo "  ├── 🌱 アプリを起動 (Windows).bat"
echo "  ├── 📌 まずはこれを読む.txt"
echo "  └── 📁 アプリ本体（さわらないでください）/"
echo ""
echo "配布手順:"
echo "  1. ZIPを議員に送る"
echo "  2. 解凍 → 自分のOSに合った '🌱 アプリを起動' をダブルクリック"

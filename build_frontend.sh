#!/bin/bash
# ============================================================
# フロントエンド本番ビルドスクリプト
# 使い方:
#   ./build_frontend.sh https://your-app-name.onrender.com/api
# ============================================================

set -e

RENDER_URL="${1:-}"

if [ -z "$RENDER_URL" ]; then
    echo "❌ RenderのバックエンドURLを引数で指定してください"
    echo "   例: ./build_frontend.sh https://koujibashosho-api.onrender.com/api"
    exit 1
fi

echo "==================================================="
echo "  工事箇所表分析プラットフォーム フロントエンドビルド"
echo "==================================================="
echo "  バックエンドURL: $RENDER_URL"
echo ""

# Node.js のパスを設定（Raycast インストール版）
export PATH="/Users/iwanaga/Library/Application Support/com.raycast.macos/NodeJS/runtime/22.14.0/bin:$PATH"

# frontend/.env.production を書き換え
ENV_FILE="frontend/.env.production"
echo "VITE_API_URL=${RENDER_URL}" > "$ENV_FILE"
echo "✅ ${ENV_FILE} を更新しました: VITE_API_URL=${RENDER_URL}"

# ビルド
cd frontend
echo ""
echo "📦 npm run build 実行中..."
npm run build

echo ""
echo "✅ ビルド完了！"
echo ""

# ZIPアーカイブ作成
cd ..
ZIP_NAME="frontend_dist_$(date +%Y%m%d_%H%M%S).zip"
cd frontend/dist
zip -r "../../${ZIP_NAME}" .
cd ../..

echo "📦 ZIPファイル作成: ${ZIP_NAME}"
echo ""
echo "==================================================="
echo "  次のステップ（Xserverアップロード）"
echo "==================================================="
echo "  1. Xserver ファイルマネージャー または FTP クライアントで"
echo "     public_html/ 以下にZIPを展開してください"
echo ""
echo "  ※ ZIPの中身（index.html, assets/ など）を"
echo "    そのまま public_html/ に配置します"
echo "==================================================="

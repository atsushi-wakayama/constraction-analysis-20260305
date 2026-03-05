#!/bin/bash
# 開発サーバー起動スクリプト（バックエンド＋フロントエンド同時起動）

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Node.js のパスを追加（環境によって変わる場合は修正してください）
RAYCAST_NODE="/Users/iwanaga/Library/Application Support/com.raycast.macos/NodeJS/runtime/22.14.0/bin"
if [ -d "$RAYCAST_NODE" ]; then
    export PATH="$RAYCAST_NODE:$PATH"
fi

echo "🚀 工事箇所表分析プラットフォームを起動中..."

# バックエンド起動
cd "$SCRIPT_DIR/backend"
"$SCRIPT_DIR/backend/venv/bin/uvicorn" main:app --reload --port 8000 &
BACKEND_PID=$!
echo "✅ バックエンド起動 (PID: $BACKEND_PID, http://localhost:8000)"

# フロントエンド起動
cd "$SCRIPT_DIR/frontend"
if command -v npm &>/dev/null; then
    npm run dev &
elif command -v bun &>/dev/null; then
    bun run dev &
fi
FRONTEND_PID=$!
echo "✅ フロントエンド起動 (PID: $FRONTEND_PID, http://localhost:5173)"

echo ""
echo "🌐 ブラウザで http://localhost:5173 を開いてください"
echo "終了するには Ctrl+C を押してください"

# 終了時にプロセスをクリーンアップ
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo '停止しました'" EXIT

wait

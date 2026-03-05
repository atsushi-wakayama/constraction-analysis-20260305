#!/bin/bash
# 工事箇所表分析プラットフォーム セットアップスクリプト

set -e

echo "=== 工事箇所表分析プラットフォーム セットアップ ==="
echo ""

# --- Python バックエンド ---
echo "📦 Pythonパッケージをインストール中..."
cd backend

# Python 3.8+ を優先して検索
PYTHON=""
for candidate in python3.12 python3.11 python3.10 python3.9 python3.8 \
    "/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9"; do
    if command -v "$candidate" &>/dev/null; then
        VER=$("$candidate" -c "import sys; print(sys.version_info.minor)" 2>/dev/null)
        MAJOR=$("$candidate" -c "import sys; print(sys.version_info.major)" 2>/dev/null)
        if [ "$MAJOR" = "3" ] && [ "$VER" -ge 8 ] 2>/dev/null; then
            PYTHON="$candidate"
            break
        fi
    fi
done

if [ -z "$PYTHON" ]; then
    # フルパスでCommandLineTools Python 3.9を試す
    if [ -f "/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9" ]; then
        PYTHON="/Library/Developer/CommandLineTools/Library/Frameworks/Python3.framework/Versions/3.9/bin/python3.9"
    else
        echo "❌ Python 3.8以上が見つかりません。Python 3.9以上をインストールしてください。"
        exit 1
    fi
fi
echo "使用するPython: $PYTHON ($($PYTHON --version))"

$PYTHON -m venv venv 2>/dev/null || true
source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null || true
pip install -r requirements.txt -q

echo "✅ バックエンド依存関係インストール完了"
cd ..

# --- フロントエンド ---
echo "📦 npmパッケージをインストール中..."
cd frontend

if command -v npm &>/dev/null; then
    npm install
elif command -v bun &>/dev/null; then
    bun install
elif command -v yarn &>/dev/null; then
    yarn install
else
    echo "❌ npm/bun/yarnが見つかりません。Node.jsをインストールしてください。"
    exit 1
fi

echo "✅ フロントエンド依存関係インストール完了"
cd ..

echo ""
echo "=== セットアップ完了！ ==="
echo ""
echo "起動方法："
echo "  バックエンド: cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "  フロントエンド: cd frontend && npm run dev"
echo ""
echo "ブラウザで http://localhost:5173 を開いてください"

#!/bin/bash
# 政務活動費 管理ツール ベータ版 (macOS用ランチャー)
# このファイルを ダブルクリック すると起動します

cd "$(dirname "$0")/📁 アプリ本体（さわらないでください）" || {
  osascript -e 'display dialog "「📁 アプリ本体（さわらないでください）」フォルダが見つかりません。\nZIPを正しく解凍できているか確認してください。" buttons {"OK"} default button 1 with icon stop with title "起動できませんでした"'
  exit 1
}

# Finderから起動した場合、PATHが最小限なので Node.js のよくある場所を追加する
export PATH="/opt/homebrew/bin:/usr/local/bin:/opt/local/bin:$PATH"

# nvm インストール済みなら読み込む
if [ -s "$HOME/.nvm/nvm.sh" ]; then
  export NVM_DIR="$HOME/.nvm"
  # shellcheck disable=SC1091
  . "$HOME/.nvm/nvm.sh" --no-use 2>/dev/null
  # default alias または最新の node を使う
  if command -v nvm &> /dev/null; then
    nvm use default >/dev/null 2>&1 || nvm use node >/dev/null 2>&1 || true
  fi
fi

# volta / fnm / asdf も対応
[ -d "$HOME/.volta/bin" ] && export PATH="$HOME/.volta/bin:$PATH"
[ -d "$HOME/.fnm" ] && [ -s "$HOME/.fnm/farm.sh" ] && . "$HOME/.fnm/farm.sh" 2>/dev/null
[ -s "$HOME/.asdf/asdf.sh" ] && . "$HOME/.asdf/asdf.sh" 2>/dev/null

# それでもnodeが見つからないとき: nvm の最新版を直接探す
if ! command -v node &> /dev/null; then
  if [ -d "$HOME/.nvm/versions/node" ]; then
    LATEST=$(ls -t "$HOME/.nvm/versions/node" 2>/dev/null | head -1)
    if [ -n "$LATEST" ] && [ -x "$HOME/.nvm/versions/node/$LATEST/bin/node" ]; then
      export PATH="$HOME/.nvm/versions/node/$LATEST/bin:$PATH"
    fi
  fi
fi

# Node.js チェック
if ! command -v node &> /dev/null; then
  osascript -e 'display dialog "Node.js がインストールされていません。\n\nhttps://nodejs.org/ja から最新版（LTS）をインストールしてから再度起動してください。\n（一度インストールすれば次回からは何もしなくてOKです）" buttons {"OK"} default button 1 with icon caution with title "起動できませんでした"'
  exit 1
fi

echo "✓ Node.js: $(node --version) ($(command -v node))"
exec node start.mjs

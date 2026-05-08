# mirai-wakayama-gikai-admin

政務活動費の各種書類をブラウザ上で編集・印刷するための限定公開アプリ。

`mirai-wakayama-gikai`（公開ポータル）とは独立した別サイトで、パスワード認証により議員・事務局のみがアクセスする想定。

## 起動

```bash
cp .env.example .env.local
# .env.local で ADMIN_PASSWORD と SESSION_SECRET を設定
npm install
npm run dev
# http://localhost:3001
```

## 認証

- 単一パスワード（`ADMIN_PASSWORD`）+ HMAC署名済 httpOnly cookie
- 12時間で自動ログアウト
- `middleware.ts` で `/login` と `/api/auth` 以外を全保護

## データ保存

`data/payments.json` にJSONで保存（gitignore済）。
将来的にDB（SQLite等）に移行する想定。

## Phase 1の対応書類

- 別記第7号様式 支払証明書（調査研究費 ほか）

## 今後の拡張予定

- 会議費領収書一覧
- 視察報告書
- 月次集計（自動合計）
- PDFダウンロード（@page A4印刷とは別に直接生成）
- 複数ユーザー / 監査ログ

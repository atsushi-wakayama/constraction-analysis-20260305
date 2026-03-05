# デプロイ手順書

## 構成

```
[ユーザーのブラウザ]
        │
        ├─→ [Xserver] ← React フロントエンド（静的ファイル）
        │
        └─→ [Render.com] ← FastAPI バックエンド（Python）
```

---

## STEP 1: GitHubリポジトリを作成する

Render.com はGitHubと連携してデプロイします。

1. https://github.com/new でリポジトリを作成（プライベートでOK）
2. ローカルでプッシュ：

```bash
cd /path/to/tender-matsumoto
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/あなたのユーザー名/リポジトリ名.git
git push -u origin main
```

---

## STEP 2: Render.com にバックエンドをデプロイ

### 2-1. アカウント作成
- https://render.com でGitHubアカウントでサインアップ

### 2-2. Web Service 作成
1. Dashboard → **New** → **Web Service**
2. GitHubリポジトリを選択
3. 以下のように設定：

| 設定項目 | 値 |
|---------|-----|
| Name | `koujibashosho-api`（任意） |
| Region | Singapore（日本に近い） |
| Root Directory | `backend` |
| Runtime | Python 3 |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Plan | Free |

### 2-3. 環境変数を設定
**Environment** タブで以下を追加：

| Key | Value |
|-----|-------|
| `ALLOWED_ORIGINS` | Xserverのドメイン（後で設定、まず `*` でも可） |

### 2-4. Diskを追加（SQLiteデータ永続化）
**Advanced** → **Add Disk**：

| 設定項目 | 値 |
|---------|-----|
| Name | `sqlite-data` |
| Mount Path | `/opt/render/project/src` |
| Size | 1 GB |

> ⚠️ Diskを設定しないとデプロイのたびにデータが消えます

### 2-5. デプロイ実行
**Create Web Service** → 数分待つ

デプロイ完了後、URLを確認：
```
https://koujibashosho-api.onrender.com
```

ヘルスチェック：
```
https://koujibashosho-api.onrender.com/api/health
```
→ `{"status":"ok"}` が返れば成功

---

## STEP 3: フロントエンドをビルドしてXserverにアップロード

### 3-1. ビルドスクリプトを実行
RenderのURLが確定したら、以下を実行：

```bash
cd /path/to/tender-matsumoto
./build_frontend.sh https://koujibashosho-api.onrender.com/api
```

成功すると `frontend_dist_YYYYMMDD_HHMMSS.zip` が生成されます。

### 3-2. Xserver にアップロード

#### FTPクライアント（FileZillaなど）を使う場合
1. FileZillaでXserverに接続（FTPホスト・ユーザー・パスワードはXserverの管理画面から確認）
2. `frontend/dist/` の中身を `public_html/` に転送

#### Xserver ファイルマネージャーを使う場合
1. Xserver管理画面 → ファイルマネージャー
2. `public_html/` に移動
3. ZIPをアップロードして解凍

> ※ `index.html` が `public_html/index.html` になるように配置します

### 3-3. XserverのドメインをRenderに登録

1. Render Dashboard → `koujibashosho-api` → **Environment**
2. `ALLOWED_ORIGINS` の値をXserverのドメインに更新：
   ```
   https://yourdomain.xsrv.jp
   ```
   （複数ドメインある場合はカンマ区切り：`https://domain1.com,https://domain2.com`）
3. **Save Changes** → 自動で再デプロイが始まる

---

## STEP 4: 動作確認

1. `https://yourdomain.xsrv.jp` にアクセス
2. PDFをアップロードして解析できるか確認
3. ダッシュボードにデータが表示されるか確認

---

## よくある問題

### CORS エラーが出る
Render の環境変数 `ALLOWED_ORIGINS` にXserverのドメインが正しく入っているか確認。

### Render が "service unavailable" になる
Renderの無料プランは15分使われないとスリープします。初回アクセス時に30〜60秒かかることがあります。

### データがデプロイ後に消える
Render の **Disk** が設定されていない可能性があります。STEP 2-4 を確認してください。

### Xserver で `404 Not Found`
`index.html` が `public_html/` 直下にあるか確認してください。

---

## ファイル構成（本番）

```
tender-matsumoto/
├── backend/           → Render.com にデプロイ
│   ├── main.py
│   ├── database.py
│   ├── parser.py
│   └── requirements.txt
├── frontend/          → npm run build → Xserver にアップロード
│   ├── dist/          → ここをアップロード
│   └── .env.production  → VITE_API_URL を設定
├── render.yaml        → Render の設定ファイル（参考用）
└── build_frontend.sh  → フロントエンドビルド＆ZIP作成スクリプト
```

# はじめに

ブランチのclaudeの方をご覧くだされば全体像がわかります

# 工事箇所表分析プラットフォーム

和歌山県日高郡・御坊市の工事箇所表を分析し、市町別予算配分を可視化するWebアプリケーションです。

## 対象市町

- **御坊市**
- **日高郡**: 由良町・日高町・美浜町・日高川町・印南町・みなべ町

## 機能

- 📤 **工事箇所表PDFのアップロード・自動解析**
- 📊 **ダッシュボード**: 市町別予算の棒グラフ・円グラフ
- 📈 **年度比較**: 複数年度の予算推移（折れ線・棒グラフ）
- 📋 **工事箇所一覧**: 市町・年度でフィルタリング可能
- ✏️ **手動データ登録**: PDF解析が難しい場合のフォールバック

## セットアップ

### 必要環境

- Python 3.8以上
- Node.js 18以上

### インストール

```bash
chmod +x setup.sh
./setup.sh
```

### 起動

```bash
chmod +x start.sh
./start.sh
```

または個別に起動：

**バックエンド（ターミナル1）**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

**フロントエンド（ターミナル2）**
```bash
cd frontend
npm run dev
```

ブラウザで `http://localhost:5173` を開いてください。

## 技術スタック

| 層 | 技術 |
|---|---|
| フロントエンド | React 18 + Vite + TypeScript |
| グラフ | Recharts |
| バックエンド | FastAPI (Python) |
| PDF解析 | pdfplumber |
| DB | SQLite (SQLAlchemy) |

## PDFについて

工事箇所表のPDFは様々な形式があります。自動解析が難しい場合：

1. 「データ取込」画面で年度を手動指定して試してください
2. 「データ管理」画面から手動でデータを入力できます
3. 実際のPDFを共有いただくとパーサーを最適化できます

## データ構造

```
construction_items テーブル
├── fiscal_year  (年度)
├── municipality (市町名)
├── route_name   (路線名)
├── location     (箇所名)
├── work_type    (工事種別)
├── budget       (予算額 千円)
├── department   (担当課)
└── source_file  (元PDFファイル名)
```

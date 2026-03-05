"""
工事箇所表PDF解析モジュール
和歌山県 令和X年度工事箇所表（定例会）形式に特化したパーサー

【当初予算フォーマット】（6列）
  Col 0: 番号
  Col 1: 箇所名
  Col 2: 市町村
  Col 3: 字
  Col 4: 事業費（千円）
  Col 5: 備考

【補正予算フォーマット】（8列）
  Col 0: 番号
  Col 1: 箇所名
  Col 2: 市町村
  Col 3: 字
  Col 4: 既定事業費（千円）
  Col 5: 補正事業費（千円）  ← これを使用（'-' はスキップ）
  Col 6: 計（千円）
  Col 7: 備考

ページヘッダー構造:
  （款）○○費 （項）○○費 （目）○○費
  （事業名）○○事業

複数市町にまたがる場合は按分（÷市町数）する。
"""
import pdfplumber
import re
import json
from typing import List, Dict, Optional, Tuple
from pathlib import Path

# 対象市町リスト
TARGET_MUNICIPALITIES = [
    "御坊市",
    "由良町",
    "日高町",
    "美浜町",
    "日高川町",
    "印南町",
    "みなべ町",
]

# 略称マッピング
MUNICIPALITY_NORMALIZE = {
    "みなべ": "みなべ町",
    "南部":   "みなべ町",
    "御坊":   "御坊市",
    "由良":   "由良町",
    "日高":   "日高町",
    "美浜":   "美浜町",
    "日高川": "日高川町",
    "印南":   "印南町",
}

# ========== 正規表現 ==========

# ページヘッダー（re.DOTALL で複数行対応）
RE_KUAN = re.compile(r"（款）\s*(.+?)\s*（項）", re.DOTALL)
RE_ITEM = re.compile(r"（項）\s*(.+?)\s*（目）", re.DOTALL)
RE_MOKU = re.compile(r"（目）\s*(.+?)$", re.M)
RE_JIGY = re.compile(r"（事業名）\s*(.+?)$", re.M)

# 年度検出
RE_YEAR_REIWA   = re.compile(r"令和\s*(\d+)\s*年")
RE_YEAR_HEISEI  = re.compile(r"平成\s*(\d+)\s*年")
RE_YEAR_SEIREKI = re.compile(r"20(\d{2})\s*年")
RE_YEAR_R       = re.compile(r"\bR\s*(\d+)\b", re.I)

# セッション検出
RE_SESSION_MONTH = re.compile(r"令和\s*\d+\s*年\s*(\d+)\s*月定例会")
RE_TOSHO         = re.compile(r"当初予算")
RE_HOSEI         = re.compile(r"補正予算")

# 集計行スキップパターン
SKIP_PATTERNS = re.compile(r"^(合\s*計|小\s*計|総\s*計)$")

# 補正欄のゼロ扱い記号
HOSEI_ZERO = re.compile(r"^[-－−—]+$")


# ========== ユーティリティ ==========

def normalize_number(text: str) -> Optional[float]:
    """数値文字列を正規化して浮動小数点に変換（千円単位）"""
    if not text:
        return None
    cleaned = (text
               .replace(",", "").replace("，", "")
               .replace(" ", "").replace("\u3000", "")
               .replace("千円", "").replace("円", "")
               .strip())
    cleaned = cleaned.translate(str.maketrans(
        "０１２３４５６７８９", "0123456789"
    ))
    cleaned = re.sub(r"\s+", "", cleaned)
    try:
        val = float(cleaned)
        return val if val > 0 else None
    except ValueError:
        return None


def extract_municipalities_from_cell(text: str) -> List[str]:
    """
    市町村セルから対象市町リストを抽出する。
    「、」「，」「・」「\\n」区切りの複数市町に対応。
    """
    if not text:
        return []

    parts = re.split(r"[、，・\n/／]+", text)
    result: List[str] = []

    for part in parts:
        part = part.strip()
        if not part:
            continue
        # 完全一致
        if part in TARGET_MUNICIPALITIES:
            if part not in result:
                result.append(part)
            continue
        # 前方一致・部分一致
        matched = False
        for muni in TARGET_MUNICIPALITIES:
            if muni in part:
                if muni not in result:
                    result.append(muni)
                matched = True
                break
        if matched:
            continue
        # 略称マッピング
        for alias, full in MUNICIPALITY_NORMALIZE.items():
            if alias in part:
                if full not in result:
                    result.append(full)
                break

    return result


def extract_fiscal_year(text: str) -> Optional[int]:
    """PDFテキストから年度を抽出"""
    m = RE_YEAR_REIWA.search(text)
    if m:
        return 2018 + int(m.group(1))
    m = RE_YEAR_SEIREKI.search(text)
    if m:
        return 2000 + int(m.group(1))
    m = RE_YEAR_HEISEI.search(text)
    if m:
        return 1988 + int(m.group(1))
    m = RE_YEAR_R.search(text)
    if m:
        return 2018 + int(m.group(1))
    return None


def extract_session(text: str) -> str:
    """
    PDFタイトルからセッション種別を返す。
    例: '令和７年12月定例会' + '補正予算' → '12月補正'
        '令和８年２月定例会' + '当初予算' → '当初'
    """
    m = RE_SESSION_MONTH.search(text)
    month = int(m.group(1)) if m else 0
    if RE_HOSEI.search(text):
        return f"{month}月補正" if month else "補正"
    return "当初"


def extract_page_header(text: str) -> Dict[str, str]:
    """ページ上部のヘッダーから款・項・目・事業名を抽出"""
    info: Dict[str, str] = {}
    for regex, key in [
        (RE_JIGY, "jigyoumei"),
        (RE_KUAN, "kuan"),
        (RE_ITEM, "kou"),
        (RE_MOKU, "moku"),
    ]:
        m = regex.search(text)
        if m:
            info[key] = m.group(1).strip()
    return info


def detect_table_format(table: List[List]) -> str:
    """
    テーブルのヘッダー行を検査して形式を判定。
    '補正事業費' を含む列があれば 'hosei'（補正予算）、なければ 'tosho'（当初予算）。
    """
    for row in table[:3]:
        cells = [
            str(c).replace(" ", "").replace("\n", "").replace("\u3000", "")
            if c else ""
            for c in row
        ]
        if any("補正事業費" in c or "既定事業費" in c for c in cells):
            return "hosei"
    return "tosho"


def is_skip_row(row: List) -> bool:
    """合計行・空行などスキップすべき行かどうか判定"""
    cells = [str(c).strip() if c else "" for c in row]
    if not any(cells):
        return True
    for c in cells[:3]:
        normalized = c.replace(" ", "").replace("\u3000", "")
        if normalized and SKIP_PATTERNS.match(normalized):
            return True
    return False


def is_header_row(row: List) -> bool:
    """テーブルのヘッダー行かどうか判定"""
    cells = [str(c).strip() if c else "" for c in row]
    header_kw = {
        "番号", "番 号", "箇所名", "箇 所 名",
        "位置", "位 置", "事業費", "市町村", "市 町 村", "備考",
        "既定事業費", "補正事業費",
    }
    count = sum(
        1 for c in cells
        if c in header_kw
        or c.replace(" ", "") in {k.replace(" ", "") for k in header_kw}
    )
    return count >= 2


# ========== テーブル解析 ==========

def parse_table(
    table: List[List],
    page_header: Dict[str, str],
    page_num: int,
    fmt: str = "tosho",
) -> List[Dict]:
    """
    1テーブルを解析してアイテムリストを返す。

    fmt:
        'tosho' … 当初予算（6列）: Col4 = 事業費
        'hosei' … 補正予算（8列）: Col5 = 補正事業費、'-' はスキップ
    """
    items = []

    # 列インデックスをフォーマットによって切り替え
    COL_NUMBER   = 0
    COL_LOCATION = 1
    COL_MUNI     = 2
    COL_AZA      = 3
    COL_BUDGET   = 4 if fmt == "tosho" else 5   # 当初:事業費 / 補正:補正事業費

    # ヘッダー行を検出してスキップ
    data_start = 0
    for i, row in enumerate(table[:5]):
        if is_header_row(row):
            data_start = i + 1
            # 2行ヘッダー（「市 町 村」「字」の副ヘッダー行）
            if data_start < len(table):
                next_cells = [str(c).strip() if c else "" for c in table[data_start]]
                if any("市" in c and "町" in c for c in next_cells if c):
                    data_start += 1
            break

    for row in table[data_start:]:
        if is_skip_row(row):
            continue

        cells = [str(c).strip() if c else "" for c in row]
        while len(cells) < 8:
            cells.append("")

        muni_text   = cells[COL_MUNI]
        budget_text = cells[COL_BUDGET]
        loc_name    = cells[COL_LOCATION]

        # 補正PDFで '-' (変更なし) はスキップ
        if fmt == "hosei" and HOSEI_ZERO.match(budget_text.replace(" ", "")):
            continue

        budget = normalize_number(budget_text)
        if budget is None:
            continue

        target_munis = extract_municipalities_from_cell(muni_text)
        if not target_munis:
            continue

        # ===== 按分処理 =====
        n = len(target_munis)
        # 切り捨てで按分（端数は切り捨て、精度よりシンプルさを優先）
        apportioned = round(budget / n) if n > 1 else budget

        dept = " ".join(filter(None, [
            page_header.get("kuan", ""),
            page_header.get("kou", ""),
        ]))

        for muni in target_munis:
            # 按分注釈
            note = ""
            if n > 1:
                others = [m for m in target_munis if m != muni]
                note = f"{'・'.join(others)}と按分（1/{n}）"

            items.append({
                "municipality": muni,
                "location":     loc_name,
                "route_name":   loc_name,
                "work_type":    page_header.get("jigyoumei", ""),
                "department":   dept,
                "budget":       apportioned,
                "note":         note,          # 按分注釈
                "joint_munis":  target_munis,  # 共同市町リスト（生データ用）
                "page":         page_num,
            })

    return items


# ========== PDFメイン解析 ==========

def parse_pdf(file_path: str, fiscal_year: Optional[int] = None) -> Dict:
    """
    工事箇所表PDFを解析してデータを抽出する

    Returns:
        {
            "fiscal_year": int,
            "session": str,        # 当初 / 6月補正 / 9月補正 / 12月補正
            "items": [...],
            "errors": [...],
            "municipality_totals": {市町名: 合計額（千円、按分済み）},
            "total_budget": float,
            "source_file": str,
        }
    """
    result: Dict = {
        "fiscal_year":         fiscal_year,
        "session":             "当初",
        "items":               [],
        "errors":              [],
        "municipality_totals": {m: 0.0 for m in TARGET_MUNICIPALITIES},
        "total_budget":        0.0,
        "source_file":         Path(file_path).name,
    }

    try:
        with pdfplumber.open(file_path) as pdf:
            # ===== 年度・セッション検出（先頭3ページ） =====
            header_text = ""
            for page in pdf.pages[:3]:
                header_text += (page.extract_text() or "") + "\n"

            if result["fiscal_year"] is None:
                yr = extract_fiscal_year(header_text)
                if yr:
                    result["fiscal_year"] = yr

            result["session"] = extract_session(header_text)

            # ===== 各ページを解析 =====
            all_items: List[Dict] = []

            for page_num, page in enumerate(pdf.pages, 1):
                text = page.extract_text() or ""

                # 対象市町を含まないページはスキップ（高速化）
                if not any(t in text for t in TARGET_MUNICIPALITIES):
                    continue

                page_header = extract_page_header(text)

                # テーブル抽出（線ベース優先）
                tables = page.extract_tables({
                    "vertical_strategy":      "lines",
                    "horizontal_strategy":    "lines",
                    "intersection_tolerance": 5,
                    "snap_tolerance":         3,
                })
                if not tables:
                    tables = page.extract_tables({
                        "vertical_strategy":   "text",
                        "horizontal_strategy": "text",
                    })

                for table in tables:
                    if not table:
                        continue
                    fmt = detect_table_format(table)
                    all_items.extend(parse_table(table, page_header, page_num, fmt))

            result["items"] = all_items

            for item in all_items:
                muni = item["municipality"]
                if muni in result["municipality_totals"]:
                    result["municipality_totals"][muni] += item["budget"]

            result["total_budget"] = sum(result["municipality_totals"].values())

    except Exception as e:
        import traceback
        result["errors"].append(f"PDF解析エラー: {str(e)}")
        result["errors"].append(traceback.format_exc())

    return result


def parse_pdf_with_manual_mapping(
    file_path: str,
    fiscal_year: int,
    municipality_col: int,
    budget_col: int,
    location_col: Optional[int] = None,
    header_row: int = 0,
) -> Dict:
    """手動列指定による解析（フォールバック用）"""
    result: Dict = {
        "fiscal_year":         fiscal_year,
        "session":             "当初",
        "items":               [],
        "errors":              [],
        "municipality_totals": {m: 0.0 for m in TARGET_MUNICIPALITIES},
        "total_budget":        0.0,
        "source_file":         Path(file_path).name,
    }
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, 1):
                for table in (page.extract_tables() or []):
                    if not table:
                        continue
                    for row in table[header_row + 1:]:
                        if not row or len(row) <= max(municipality_col, budget_col):
                            continue
                        muni_text   = str(row[municipality_col] or "").strip()
                        budget_text = str(row[budget_col] or "").strip()
                        budget = normalize_number(budget_text)
                        if not budget:
                            continue
                        munis = extract_municipalities_from_cell(muni_text)
                        n = len(munis)
                        apportioned = round(budget / n) if n > 1 else budget
                        for muni in munis:
                            note = ""
                            if n > 1:
                                others = [m for m in munis if m != muni]
                                note = f"{'・'.join(others)}と按分（1/{n}）"
                            item = {
                                "municipality": muni,
                                "budget":       apportioned,
                                "note":         note,
                                "location":     str(row[location_col] or "").strip() if location_col else "",
                                "page":         page_num,
                            }
                            result["items"].append(item)
                            result["municipality_totals"][muni] = (
                                result["municipality_totals"].get(muni, 0.0) + apportioned
                            )
        result["total_budget"] = sum(result["municipality_totals"].values())
    except Exception as e:
        result["errors"].append(str(e))
    return result

"""
工事箇所表分析プラットフォーム - バックエンドAPI
"""
import os
import json
import shutil
import tempfile
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from pydantic import BaseModel

from database import get_db, init_db, ConstructionItem
from parser import parse_pdf, TARGET_MUNICIPALITIES

app = FastAPI(
    title="工事箇所表分析API",
    description="和歌山県日高郡・御坊市の工事箇所表を分析するAPI",
    version="1.0.0",
)

# CORS設定: 環境変数 ALLOWED_ORIGINS（カンマ区切り）で本番ドメインを追加可能
_default_origins = "http://localhost:5173,http://localhost:3000"
_origins_env = os.environ.get("ALLOWED_ORIGINS", _default_origins)
ALLOWED_ORIGINS = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    init_db()


# ========== Pydantic スキーマ ==========

class ConstructionItemCreate(BaseModel):
    fiscal_year: int
    municipality: str
    route_name: Optional[str] = ""
    location: Optional[str] = ""
    work_type: Optional[str] = ""
    work_overview: Optional[str] = ""
    budget: float
    department: Optional[str] = ""


class ConstructionItemResponse(BaseModel):
    id: int
    fiscal_year: int
    session: Optional[str]
    municipality: str
    route_name: Optional[str]
    location: Optional[str]
    work_type: Optional[str]
    work_overview: Optional[str]  # 按分注釈
    budget: float
    department: Optional[str]
    source_file: Optional[str]

    class Config:
        from_attributes = True


class MunicipalityBudget(BaseModel):
    municipality: str
    total_budget: float
    item_count: int


class YearComparison(BaseModel):
    municipality: str
    budgets: Dict[int, float]


# ========== エンドポイント ==========

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "工事箇所表分析API稼働中"}


@app.post("/api/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    fiscal_year: Optional[int] = Form(None),
    db: Session = Depends(get_db),
):
    """
    工事箇所表PDFをアップロードして解析・登録する
    """
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDFファイルのみアップロード可能です")

    # 一時ファイルに保存
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # PDF解析
        parse_result = parse_pdf(tmp_path, fiscal_year)

        if parse_result.get("errors"):
            # エラーがあっても部分的に取得できたデータは返す
            pass

        if not parse_result["items"] and parse_result.get("errors"):
            raise HTTPException(
                status_code=422,
                detail=f"PDF解析に失敗しました: {'; '.join(parse_result['errors'])}",
            )

        detected_year = parse_result.get("fiscal_year")
        if not detected_year:
            raise HTTPException(
                status_code=422,
                detail="年度を検出できませんでした。年度を手動で指定してください。",
            )

        # ファイル名だけ記録（PDFは保存しない：Renderのエフェメラルストレージを消費しないため）
        saved_filename = f"{detected_year}_{file.filename}"

        # DBに登録（重複チェック: 同じ年度・ソースファイルは上書き）
        existing = (
            db.query(ConstructionItem)
            .filter(
                ConstructionItem.fiscal_year == detected_year,
                ConstructionItem.source_file == saved_filename,
            )
            .first()
        )
        if existing:
            db.query(ConstructionItem).filter(
                ConstructionItem.fiscal_year == detected_year,
                ConstructionItem.source_file == saved_filename,
            ).delete()
            db.commit()

        # アイテム登録
        created_items = []
        session = parse_result.get("session", "当初")
        for item in parse_result["items"]:
            db_item = ConstructionItem(
                fiscal_year=detected_year,
                session=session,
                municipality=item.get("municipality") or "不明",
                route_name=item.get("route_name", ""),
                location=item.get("location", ""),
                work_type=item.get("work_type", ""),
                work_overview=item.get("note", ""),
                department=item.get("department", ""),
                budget=item["budget"],
                source_file=saved_filename,
                raw_data=json.dumps({
                    "joint_munis": item.get("joint_munis", []),
                    "page": item.get("page"),
                }, ensure_ascii=False),
            )
            db.add(db_item)
            created_items.append(db_item)

        db.commit()

        return {
            "success": True,
            "fiscal_year": detected_year,
            "session": session,
            "filename": saved_filename,
            "total_items": len(created_items),
            "municipality_totals": parse_result["municipality_totals"],
            "total_budget": parse_result["total_budget"],
            "warnings": parse_result.get("errors", []),
        }

    finally:
        os.unlink(tmp_path)


@app.get("/api/years")
def get_fiscal_years(db: Session = Depends(get_db)):
    """登録済み年度一覧を返す"""
    years = db.query(distinct(ConstructionItem.fiscal_year)).order_by(
        ConstructionItem.fiscal_year.desc()
    ).all()
    return {"years": [y[0] for y in years]}


@app.get("/api/municipalities")
def get_municipalities():
    """対象市町一覧を返す"""
    return {"municipalities": TARGET_MUNICIPALITIES}


@app.get("/api/summary")
def get_summary(
    fiscal_year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """市町別予算集計サマリーを返す"""
    query = db.query(
        ConstructionItem.municipality,
        func.sum(ConstructionItem.budget).label("total_budget"),
        func.count(ConstructionItem.id).label("item_count"),
    ).group_by(ConstructionItem.municipality)

    if fiscal_year:
        query = query.filter(ConstructionItem.fiscal_year == fiscal_year)

    results = query.all()

    # 全市町を含む結果を作成（データなしは0）
    totals = {m: {"total_budget": 0.0, "item_count": 0} for m in TARGET_MUNICIPALITIES}
    for row in results:
        if row.municipality in totals:
            totals[row.municipality] = {
                "total_budget": float(row.total_budget),
                "item_count": row.item_count,
            }

    return {
        "fiscal_year": fiscal_year,
        "municipalities": [
            {
                "municipality": m,
                "total_budget": totals[m]["total_budget"],
                "item_count": totals[m]["item_count"],
            }
            for m in TARGET_MUNICIPALITIES
        ],
        "grand_total": sum(v["total_budget"] for v in totals.values()),
    }


@app.get("/api/comparison")
def get_year_comparison(
    municipalities: Optional[List[str]] = Query(None),
    db: Session = Depends(get_db),
):
    """複数年度の市町別予算比較データを返す"""
    years_q = db.query(distinct(ConstructionItem.fiscal_year)).order_by(
        ConstructionItem.fiscal_year
    ).all()
    years = [y[0] for y in years_q]

    target_munis = municipalities if municipalities else TARGET_MUNICIPALITIES

    result = []
    for muni in target_munis:
        muni_data: Dict[str, Any] = {"municipality": muni, "budgets": {}}
        for year in years:
            total = (
                db.query(func.sum(ConstructionItem.budget))
                .filter(
                    ConstructionItem.municipality == muni,
                    ConstructionItem.fiscal_year == year,
                )
                .scalar()
            ) or 0
            muni_data["budgets"][year] = float(total)
        result.append(muni_data)

    return {"years": years, "data": result}


@app.get("/api/sessions")
def get_sessions(
    fiscal_year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """登録済みセッション一覧を返す（例: 当初, 6月補正, ...）"""
    query = db.query(distinct(ConstructionItem.session)).order_by(ConstructionItem.session)
    if fiscal_year:
        query = query.filter(ConstructionItem.fiscal_year == fiscal_year)
    sessions = [s[0] for s in query.all() if s[0]]
    return {"sessions": sessions}


@app.get("/api/items")
def get_items(
    fiscal_year: Optional[int] = Query(None),
    municipality: Optional[str] = Query(None),
    session: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
):
    """工事箇所一覧を返す"""
    query = db.query(ConstructionItem)

    if fiscal_year:
        query = query.filter(ConstructionItem.fiscal_year == fiscal_year)
    if municipality:
        query = query.filter(ConstructionItem.municipality == municipality)
    if session:
        query = query.filter(ConstructionItem.session == session)

    total = query.count()
    items = query.order_by(
        ConstructionItem.fiscal_year.desc(),
        ConstructionItem.municipality,
        ConstructionItem.budget.desc(),
    ).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [ConstructionItemResponse.from_orm(item) for item in items],
    }


@app.get("/api/categories")
def get_categories(
    fiscal_year: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    """款・項別予算集計"""
    query = db.query(
        ConstructionItem.department,
        func.sum(ConstructionItem.budget).label("total_budget"),
        func.count(ConstructionItem.id).label("item_count"),
    ).group_by(ConstructionItem.department)

    if fiscal_year:
        query = query.filter(ConstructionItem.fiscal_year == fiscal_year)

    results = query.order_by(func.sum(ConstructionItem.budget).desc()).all()

    # 款レベルでも集計（departmentの最初のスペースで区切り）
    kuan_totals: Dict[str, float] = {}
    kuan_counts: Dict[str, int] = {}
    dept_list = []

    for row in results:
        dept = row.department or "不明"
        parts = dept.split()
        kuan = parts[0] if parts else dept
        dept_list.append({
            "department": dept,
            "kuan": kuan,
            "total_budget": float(row.total_budget),
            "item_count": row.item_count,
        })
        kuan_totals[kuan] = kuan_totals.get(kuan, 0.0) + float(row.total_budget)
        kuan_counts[kuan] = kuan_counts.get(kuan, 0) + row.item_count

    kuan_list = sorted(
        [{"kuan": k, "total_budget": v, "item_count": kuan_counts[k]} for k, v in kuan_totals.items()],
        key=lambda x: -x["total_budget"],
    )

    return {
        "fiscal_year": fiscal_year,
        "departments": dept_list,
        "kuan": kuan_list,
    }


@app.get("/api/projects")
def get_projects(
    fiscal_year: Optional[int] = Query(None),
    limit: int = Query(20, le=100),
    db: Session = Depends(get_db),
):
    """事業名別予算集計（上位N件）"""
    query = db.query(
        ConstructionItem.work_type,
        func.sum(ConstructionItem.budget).label("total_budget"),
        func.count(ConstructionItem.id).label("item_count"),
    ).group_by(ConstructionItem.work_type)

    if fiscal_year:
        query = query.filter(ConstructionItem.fiscal_year == fiscal_year)

    results = (
        query
        .order_by(func.sum(ConstructionItem.budget).desc())
        .limit(limit)
        .all()
    )

    return {
        "fiscal_year": fiscal_year,
        "projects": [
            {
                "work_type": row.work_type or "不明",
                "total_budget": float(row.total_budget),
                "item_count": row.item_count,
            }
            for row in results
        ],
    }


@app.delete("/api/data/{fiscal_year}")
def delete_fiscal_year_data(fiscal_year: int, db: Session = Depends(get_db)):
    """指定年度のデータを削除する"""
    count = (
        db.query(ConstructionItem)
        .filter(ConstructionItem.fiscal_year == fiscal_year)
        .count()
    )
    if count == 0:
        raise HTTPException(status_code=404, detail="データが見つかりません")

    db.query(ConstructionItem).filter(
        ConstructionItem.fiscal_year == fiscal_year
    ).delete()
    db.commit()
    return {"success": True, "deleted_count": count}


@app.post("/api/items/manual")
def create_item_manual(
    item: ConstructionItemCreate,
    db: Session = Depends(get_db),
):
    """手動でデータを登録する（PDF解析が失敗した場合のフォールバック）"""
    db_item = ConstructionItem(
        fiscal_year=item.fiscal_year,
        municipality=item.municipality,
        route_name=item.route_name,
        location=item.location,
        work_type=item.work_type,
        work_overview=item.work_overview,
        budget=item.budget,
        department=item.department,
        source_file="manual",
    )
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return ConstructionItemResponse.from_orm(db_item)

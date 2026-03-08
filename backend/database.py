from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# 本番 (Render): DATABASE_URL 環境変数に PostgreSQL URL が入る
# 開発: ローカルの SQLite を使用
_db_url = os.environ.get("DATABASE_URL", "sqlite:///./construction_budget.db")
# Render の PostgreSQL URL は "postgres://" で始まる場合があるので修正
if _db_url.startswith("postgres://"):
    _db_url = _db_url.replace("postgres://", "postgresql://", 1)

DATABASE_URL = _db_url
_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class ConstructionItem(Base):
    __tablename__ = "construction_items"

    id = Column(Integer, primary_key=True, index=True)
    fiscal_year = Column(Integer, index=True, nullable=False)  # 年度
    session = Column(String(20))                               # 当初/6月補正/9月補正/12月補正
    municipality = Column(String(50), index=True, nullable=False)  # 市町名
    route_name = Column(String(200))  # 路線名
    location = Column(String(500))    # 箇所名
    work_type = Column(String(200))   # 事業名
    work_overview = Column(Text)      # 按分注釈（複数市町にまたがる場合）
    budget = Column(Float, nullable=False)  # 予算額（千円）※按分済み
    department = Column(String(200))  # 款・項
    source_file = Column(String(500)) # 元PDFファイル名
    created_at = Column(DateTime, default=datetime.utcnow)
    raw_data = Column(Text)           # 生データ（JSON）


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _add_column_if_missing(conn, table: str, col: str, col_def: str):
    """既存DBに列がなければ ALTER TABLE で追加する"""
    try:
        conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {col} {col_def}"))
        conn.commit()
    except Exception:
        pass  # 既に存在する場合は無視


def init_db():
    Base.metadata.create_all(bind=engine)
    # 既存DBへの列追加（マイグレーション）
    with engine.connect() as conn:
        _add_column_if_missing(conn, "construction_items", "session",      "VARCHAR(20)")
        _add_column_if_missing(conn, "construction_items", "work_overview", "TEXT")
        _add_column_if_missing(conn, "construction_items", "department",   "VARCHAR(200)")

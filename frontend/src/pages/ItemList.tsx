import { useEffect, useState, useCallback } from "react";
import { api, ConstructionItem } from "../api/client";
import { getMuniColor } from "../components/MunicipalityColors";

const MUNICIPALITIES = ["御坊市", "由良町", "日高町", "美浜町", "日高川町", "印南町", "みなべ町"];
const PAGE_SIZE = 50;

// セッションの表示順（当初 → 6月補正 → 9月補正 → 12月補正）
const SESSION_ORDER = ["当初", "6月補正", "9月補正", "12月補正"];

function sessionColor(session: string | null): string {
  if (!session) return "#9ca3af";
  if (session === "当初") return "#1d4ed8";
  if (session.includes("6月")) return "#15803d";
  if (session.includes("9月")) return "#b45309";
  if (session.includes("12月")) return "#be185d";
  return "#6b7280";
}

interface ItemListProps {
  years: number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
}

export default function ItemList({ years, selectedYear, onYearChange }: ItemListProps) {
  const [items, setItems] = useState<ConstructionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muni, setMuni] = useState<string>("");
  const [session, setSession] = useState<string>("");
  const [sessions, setSessions] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  // 年度が変わったらセッション一覧を取得
  useEffect(() => {
    api.getSessions(selectedYear ?? undefined)
      .then((r) => {
        const sorted = [...r.sessions].sort(
          (a, b) => SESSION_ORDER.indexOf(a) - SESSION_ORDER.indexOf(b)
        );
        setSessions(sorted);
        // 現在選択中のセッションが新年度にない場合はリセット
        if (session && !sorted.includes(session)) setSession("");
      })
      .catch(() => setSessions([]));
  }, [selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getItems({
        fiscal_year: selectedYear ?? undefined,
        municipality: muni || undefined,
        session: session || undefined,
        skip: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setItems(res.items);
      setTotal(res.total);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, muni, session, page]);

  useEffect(() => {
    setPage(0);
  }, [selectedYear, muni, session]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="page-header">
        <h2>📋 工事箇所一覧</h2>
        <span className="text-muted text-sm">全 {total.toLocaleString()} 件</span>
      </div>

      <div className="page-body">
        {/* フィルター */}
        <div className="card section">
          <div className="flex gap-4 items-center" style={{ flexWrap: "wrap" }}>
            <div>
              <label className="input-label">年度</label>
              <select
                className="input-field"
                value={selectedYear ?? ""}
                onChange={(e) => onYearChange(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">全年度</option>
                {years.map((y) => (
                  <option key={y} value={y}>{y}年度</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">議会セッション</label>
              <select
                className="input-field"
                value={session}
                onChange={(e) => setSession(e.target.value)}
              >
                <option value="">全セッション</option>
                {sessions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">市町</label>
              <select
                className="input-field"
                value={muni}
                onChange={(e) => setMuni(e.target.value)}
              >
                <option value="">全市町</option>
                {MUNICIPALITIES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>データを読み込み中...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>該当するデータがありません</h3>
              <p>条件を変更するか、PDFをアップロードしてください</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>年度</th>
                    <th>セッション</th>
                    <th>市町</th>
                    <th>箇所名</th>
                    <th>事業名</th>
                    <th style={{ textAlign: "right" }}>予算（千円）</th>
                    <th>按分・共同</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{item.fiscal_year}年度</td>
                      <td>
                        {item.session && (
                          <span
                            style={{
                              display: "inline-block",
                              padding: "2px 8px",
                              borderRadius: 12,
                              background: sessionColor(item.session) + "20",
                              color: sessionColor(item.session),
                              fontWeight: 600,
                              fontSize: 11,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.session}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "2px 8px",
                            borderRadius: 12,
                            background: getMuniColor(item.municipality) + "20",
                            color: getMuniColor(item.municipality),
                            fontWeight: 600,
                            fontSize: 12,
                            whiteSpace: "nowrap",
                          }}
                        >
                          {item.municipality}
                        </span>
                      </td>
                      <td
                        style={{
                          maxWidth: 240,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={item.location ?? ""}
                      >
                        {item.location || "—"}
                      </td>
                      <td
                        style={{
                          maxWidth: 180,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.work_type || "—"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {item.budget.toLocaleString()}
                      </td>
                      <td style={{ fontSize: 11, color: "#6b7280", minWidth: 120 }}>
                        {item.work_overview ? (
                          <span
                            title={item.work_overview}
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              padding: "1px 6px",
                              borderRadius: 8,
                              whiteSpace: "nowrap",
                            }}
                          >
                            ÷ {item.work_overview}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ページネーション */}
            {totalPages > 1 && (
              <div
                className="flex items-center justify-between mt-4"
                style={{ paddingTop: 12, borderTop: "1px solid var(--color-border)" }}
              >
                <span className="text-muted text-sm">
                  {page * PAGE_SIZE + 1}〜{Math.min((page + 1) * PAGE_SIZE, total)} 件 / 全 {total} 件
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    ← 前へ
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    次へ →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

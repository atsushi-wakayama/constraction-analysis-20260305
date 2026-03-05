import { useEffect, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  api,
  SummaryResponse,
  CategoriesResponse,
  ProjectsResponse,
} from "../api/client";
import {
  getMuniColor,
  formatBudget,
  formatBudgetFull,
} from "../components/MunicipalityColors";

// 款・事業名カテゴリ用カラーパレット（市町色と区別）
const CATEGORY_PALETTE = [
  "#1d4ed8", // indigo
  "#15803d", // green
  "#b45309", // amber
  "#be185d", // pink
  "#7c3aed", // violet
  "#0e7490", // cyan
  "#c2410c", // orange
  "#4d7c0f", // lime
  "#1e40af", // blue
  "#6b21a8", // purple
  "#0f766e", // teal
  "#92400e", // yellow-brown
];

function getCatColor(index: number): string {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length];
}

// -------- ツールチップ --------
interface HBarTooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: { name: string; item_count: number };
  }>;
}

function HBarTooltip({ active, payload }: HBarTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{d.payload.name}</div>
      <div className="tooltip-row">
        <span>予算合計</span>
        <span style={{ fontWeight: 700 }}>{formatBudgetFull(d.value)}</span>
      </div>
      <div className="tooltip-row" style={{ marginTop: 2 }}>
        <span>件数</span>
        <span>{d.payload.item_count} 件</span>
      </div>
    </div>
  );
}

interface PieTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string } }>;
}
function KuanPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="custom-tooltip">
      <div className="tooltip-label">{d.payload.name}</div>
      <div className="tooltip-row">
        <span>予算</span>
        <span style={{ fontWeight: 700 }}>{formatBudgetFull(d.value)}</span>
      </div>
    </div>
  );
}

// -------- メインコンポーネント --------
interface DashboardProps {
  years: number[];
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
}

export default function Dashboard({
  years,
  selectedYear,
  onYearChange,
}: DashboardProps) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [categories, setCategories] = useState<CategoriesResponse | null>(null);
  const [projects, setProjects] = useState<ProjectsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumData, catData, projData] = await Promise.all([
        api.getSummary(selectedYear ?? undefined),
        api.getCategories(selectedYear ?? undefined),
        api.getProjects(selectedYear ?? undefined, 20),
      ]);
      setSummary(sumData);
      setCategories(catData);
      setProjects(projData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const hasData = summary && summary.municipalities.some((m) => m.total_budget > 0);
  const maxMuniBudget = summary
    ? Math.max(...summary.municipalities.map((m) => m.total_budget), 1)
    : 1;

  // 款別チャートデータ（名前フィールドを "name" に統一）
  const kuanData = (categories?.kuan ?? []).map((k, i) => ({
    name: k.kuan,
    total_budget: k.total_budget,
    item_count: k.item_count,
    fill: getCatColor(i),
  }));

  // 事業名別チャートデータ
  const projectData = (projects?.projects ?? []).map((p, i) => ({
    name: p.work_type,
    total_budget: p.total_budget,
    item_count: p.item_count,
    fill: getCatColor(i),
  }));

  return (
    <div>
      {/* ヘッダー */}
      <div className="page-header">
        <h2>📊 ダッシュボード</h2>
        <div className="year-selector">
          <button
            className={`year-chip ${selectedYear === null ? "active" : ""}`}
            onClick={() => onYearChange(null)}
          >
            全年度
          </button>
          {years.map((y) => (
            <button
              key={y}
              className={`year-chip ${selectedYear === y ? "active" : ""}`}
              onClick={() => onYearChange(y)}
            >
              {y}年度
            </button>
          ))}
        </div>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>データを読み込み中...</span>
          </div>
        ) : !hasData ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📂</div>
              <h3>データがありません</h3>
              <p>「データ取込」から工事箇所表PDFをアップロードしてください</p>
            </div>
          </div>
        ) : (
          <>
            {/* ===== サマリー統計 ===== */}
            <div className="grid-4 section">
              <div className="stat-card">
                <div className="stat-label">総予算</div>
                <div className="stat-value" style={{ color: "var(--color-primary)" }}>
                  {formatBudget(summary!.grand_total)}
                </div>
                <div className="stat-sub">{formatBudgetFull(summary!.grand_total)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">工事箇所数</div>
                <div className="stat-value">
                  {summary!.municipalities
                    .reduce((s, m) => s + m.item_count, 0)
                    .toLocaleString()}
                </div>
                <div className="stat-sub">件</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">事業種類数</div>
                <div className="stat-value">{projectData.length}</div>
                <div className="stat-sub">事業</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">
                  {selectedYear ? `${selectedYear}年度` : "登録年度数"}
                </div>
                <div className="stat-value">{selectedYear ?? years.length}</div>
                <div className="stat-sub">{selectedYear ? "" : "年度"}</div>
              </div>
            </div>

            {/* ===== 款別予算（メインセクション） ===== */}
            {kuanData.length > 0 && (
              <div
                className="section"
                style={{
                  display: "grid",
                  gridTemplateColumns: "3fr 2fr",
                  gap: 16,
                }}
              >
                {/* 横棒グラフ */}
                <div className="card">
                  <div className="card-title">🏛️ 款別予算</div>
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(160, kuanData.length * 48)}
                  >
                    <BarChart
                      layout="vertical"
                      data={kuanData}
                      margin={{ top: 4, right: 90, left: 8, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#f0f0f0"
                      />
                      <XAxis
                        type="number"
                        tickFormatter={(v) => formatBudget(v)}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={110}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<HBarTooltip />} />
                      <Bar
                        dataKey="total_budget"
                        radius={[0, 4, 4, 0]}
                        label={{
                          position: "right",
                          formatter: (v: number) => formatBudget(v),
                          fontSize: 11,
                        }}
                      >
                        {kuanData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* 円グラフ */}
                <div className="card">
                  <div className="card-title">🥧 款別割合</div>
                  <ResponsiveContainer
                    width="100%"
                    height={Math.max(160, kuanData.length * 48)}
                  >
                    <PieChart>
                      <Pie
                        data={kuanData}
                        dataKey="total_budget"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="60%"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine
                      >
                        {kuanData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<KuanPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ===== 事業名別予算 TOP N ===== */}
            {projectData.length > 0 && (
              <div className="card section">
                <div className="card-title">
                  📋 事業名別予算　上位 {projectData.length} 件
                </div>
                <ResponsiveContainer
                  width="100%"
                  height={Math.max(200, projectData.length * 34)}
                >
                  <BarChart
                    layout="vertical"
                    data={projectData}
                    margin={{ top: 4, right: 100, left: 8, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      type="number"
                      tickFormatter={(v) => formatBudget(v)}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={175}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip content={<HBarTooltip />} />
                    <Bar
                      dataKey="total_budget"
                      radius={[0, 4, 4, 0]}
                      label={{
                        position: "right",
                        formatter: (v: number) => formatBudget(v),
                        fontSize: 11,
                      }}
                    >
                      {projectData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ===== 市町別予算（コンパクト） ===== */}
            <div className="card section">
              <div className="card-title">🏘️ 市町別予算</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 10,
                }}
              >
                {summary!.municipalities
                  .filter((m) => m.total_budget > 0)
                  .map((m) => (
                    <div key={m.municipality}>
                      <div
                        className="flex items-center justify-between"
                        style={{ marginBottom: 4 }}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: getMuniColor(m.municipality),
                              display: "inline-block",
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: 13, fontWeight: 600 }}>
                            {m.municipality}
                          </span>
                          <span className="text-muted text-sm">
                            {m.item_count} 件
                          </span>
                        </div>
                        <span
                          className="budget-amount"
                          style={{ color: getMuniColor(m.municipality) }}
                        >
                          {formatBudget(m.total_budget)}
                        </span>
                      </div>
                      <div className="budget-bar">
                        <div
                          className="budget-bar-fill"
                          style={{
                            width: `${(m.total_budget / maxMuniBudget) * 100}%`,
                            background: getMuniColor(m.municipality),
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

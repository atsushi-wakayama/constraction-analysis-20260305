import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { api, ComparisonResponse } from "../api/client";
import { getMuniColor, formatBudget, formatBudgetFull } from "../components/MunicipalityColors";

export default function Comparison() {
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartType, setChartType] = useState<"line" | "bar">("line");

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.getComparison();
        setData(res);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const hasMultipleYears = (data?.years.length ?? 0) >= 2;

  // Recharts用データ変換: 年度を行、市町を列
  const chartData = data?.years.map((year) => {
    const row: Record<string, number | string> = { year: `${year}年度` };
    for (const muni of data.data) {
      row[muni.municipality] = muni.budgets[year] ?? 0;
    }
    return row;
  });

  return (
    <div>
      <div className="page-header">
        <h2>📈 年度比較</h2>
        {hasMultipleYears && (
          <div className="flex gap-2">
            <button
              className={`btn ${chartType === "line" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setChartType("line")}
            >
              折れ線グラフ
            </button>
            <button
              className={`btn ${chartType === "bar" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setChartType("bar")}
            >
              棒グラフ
            </button>
          </div>
        )}
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <span>データを読み込み中...</span>
          </div>
        ) : !data || data.years.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">📅</div>
              <h3>データがありません</h3>
              <p>「データ取込」から工事箇所表PDFをアップロードしてください</p>
            </div>
          </div>
        ) : !hasMultipleYears ? (
          <div className="alert alert-warning">
            📌 年度比較には2年度以上のデータが必要です。現在は {data.years[0]}年度のデータのみ登録されています。
          </div>
        ) : null}

        {!loading && data && data.years.length > 0 && (
          <>
            {/* Chart */}
            <div className="card section">
              <div className="card-title">
                {chartType === "line" ? "📈" : "📊"} 年度別・市町別予算推移
              </div>
              <ResponsiveContainer width="100%" height={380}>
                {chartType === "line" ? (
                  <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(v) => formatBudget(v)}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatBudgetFull(value)}
                    />
                    <Legend />
                    {data.data.map((muni) => (
                      <Line
                        key={muni.municipality}
                        type="monotone"
                        dataKey={muni.municipality}
                        stroke={getMuniColor(muni.municipality)}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                    <YAxis
                      tickFormatter={(v) => formatBudget(v)}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatBudgetFull(value)}
                    />
                    <Legend />
                    {data.data.map((muni) => (
                      <Bar
                        key={muni.municipality}
                        dataKey={muni.municipality}
                        fill={getMuniColor(muni.municipality)}
                        radius={[3, 3, 0, 0]}
                      />
                    ))}
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* Comparison table */}
            <div className="card">
              <div className="card-title">📋 市町別・年度別予算一覧（千円）</div>
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>市町</th>
                      {data.years.map((y) => (
                        <th key={y} style={{ textAlign: "right" }}>{y}年度</th>
                      ))}
                      {data.years.length >= 2 && (
                        <th style={{ textAlign: "right" }}>増減率</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.data.map((muni) => {
                      const firstYear = data.years[0];
                      const lastYear = data.years[data.years.length - 1];
                      const firstBudget = muni.budgets[firstYear] ?? 0;
                      const lastBudget = muni.budgets[lastYear] ?? 0;
                      const changeRate =
                        firstBudget > 0
                          ? ((lastBudget - firstBudget) / firstBudget) * 100
                          : null;
                      return (
                        <tr key={muni.municipality}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: getMuniColor(muni.municipality),
                                  display: "inline-block",
                                }}
                              />
                              <span style={{ fontWeight: 600 }}>{muni.municipality}</span>
                            </div>
                          </td>
                          {data.years.map((y) => (
                            <td key={y} style={{ textAlign: "right" }}>
                              {muni.budgets[y]
                                ? muni.budgets[y].toLocaleString()
                                : "—"}
                            </td>
                          ))}
                          {data.years.length >= 2 && (
                            <td
                              style={{
                                textAlign: "right",
                                fontWeight: 600,
                                color:
                                  changeRate === null
                                    ? "var(--color-text-muted)"
                                    : changeRate > 0
                                    ? "var(--color-secondary)"
                                    : changeRate < 0
                                    ? "var(--color-danger)"
                                    : "var(--color-text-muted)",
                              }}
                            >
                              {changeRate === null
                                ? "—"
                                : `${changeRate > 0 ? "+" : ""}${changeRate.toFixed(1)}%`}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {data.years.length >= 2 && (
                <p className="text-sm text-muted mt-2">
                  ※ 増減率は {data.years[0]}年度→{data.years[data.years.length - 1]}年度の変化
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

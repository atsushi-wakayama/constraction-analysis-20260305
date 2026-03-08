import { useEffect, useState, useCallback } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Comparison from "./pages/Comparison";
import ItemList from "./pages/ItemList";
import { api } from "./api/client";

const NAV_ITEMS = [
  { path: "/", label: "ダッシュボード", icon: "📊" },
  { path: "/comparison", label: "年度比較", icon: "📈" },
  { path: "/items", label: "工事箇所一覧", icon: "📋" },
];

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const loadYears = useCallback(async () => {
    try {
      const res = await api.getYears();
      setYears(res.years);
      // 最新年度をデフォルト選択
      if (res.years.length > 0 && selectedYear === null) {
        setSelectedYear(res.years[0]);
      }
    } catch {
      // ignore
    }
  }, [selectedYear]);

  useEffect(() => {
    loadYears();
  }, [loadYears]);

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h1>工事箇所表<br />分析プラットフォーム</h1>
          <div className="subtitle">日高郡・御坊市</div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.path}
              className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
              onClick={() => navigate(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
            由良町・日高町・美浜町<br />
            日高川町・印南町・みなべ町<br />
            御坊市
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              <Dashboard
                years={years}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            }
          />
          <Route path="/comparison" element={<Comparison />} />
          <Route
            path="/items"
            element={
              <ItemList
                years={years}
                selectedYear={selectedYear}
                onYearChange={setSelectedYear}
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

import { useState } from "react";
import { api } from "../api/client";

interface DataManageProps {
  years: number[];
  onDataChange: () => void;
}

export default function DataManage({ years, onDataChange }: DataManageProps) {
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Manual entry form
  const [form, setForm] = useState({
    fiscal_year: new Date().getFullYear(),
    municipality: "御坊市",
    route_name: "",
    location: "",
    work_type: "",
    budget: "",
    department: "",
  });
  const [saving, setSaving] = useState(false);

  const handleDelete = async (year: number) => {
    if (!confirm(`${year}年度のデータをすべて削除しますか？この操作は取り消せません。`)) return;
    setDeleting(year);
    setError(null);
    try {
      const res = await api.deleteYear(year);
      setSuccess(`${year}年度のデータを ${res.deleted_count}件 削除しました`);
      onDataChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(null);
    }
  };

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const budget = parseFloat(form.budget);
    if (isNaN(budget) || budget <= 0) {
      setError("予算額を正しく入力してください");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createItemManual({
        ...form,
        budget,
      });
      setSuccess("データを手動登録しました");
      setForm((f) => ({ ...f, route_name: "", location: "", work_type: "", budget: "" }));
      onDataChange();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const MUNICIPALITIES = ["御坊市", "由良町", "日高町", "美浜町", "日高川町", "印南町", "みなべ町"];

  return (
    <div>
      <div className="page-header">
        <h2>⚙️ データ管理</h2>
      </div>

      <div className="page-body">
        {error && <div className="alert alert-error section">❌ {error}</div>}
        {success && <div className="alert alert-success section">✅ {success}</div>}

        {/* Year management */}
        <div className="card section">
          <div className="card-title">📅 年度別データ管理</div>
          {years.length === 0 ? (
            <p className="text-muted">登録されている年度データはありません</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>年度</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {years.map((y) => (
                  <tr key={y}>
                    <td style={{ fontWeight: 600 }}>{y}年度</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(y)}
                        disabled={deleting === y}
                      >
                        {deleting === y ? "削除中..." : "🗑️ 削除"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Manual entry form */}
        <div className="card" style={{ maxWidth: 600 }}>
          <div className="card-title">✏️ 手動データ登録</div>
          <p className="text-muted text-sm" style={{ marginBottom: 16 }}>
            PDF解析が難しい場合、手動でデータを入力できます
          </p>
          <form onSubmit={handleManualSave} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="grid-2">
              <div>
                <label className="input-label">年度 *</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.fiscal_year}
                  onChange={(e) => setForm((f) => ({ ...f, fiscal_year: Number(e.target.value) }))}
                  min={1990}
                  max={2100}
                  required
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label className="input-label">市町 *</label>
                <select
                  className="input-field"
                  value={form.municipality}
                  onChange={(e) => setForm((f) => ({ ...f, municipality: e.target.value }))}
                  style={{ width: "100%" }}
                >
                  {MUNICIPALITIES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="input-label">路線名</label>
              <input
                type="text"
                className="input-field"
                value={form.route_name}
                onChange={(e) => setForm((f) => ({ ...f, route_name: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label className="input-label">箇所名</label>
              <input
                type="text"
                className="input-field"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
            <div className="grid-2">
              <div>
                <label className="input-label">工事種別</label>
                <input
                  type="text"
                  className="input-field"
                  value={form.work_type}
                  onChange={(e) => setForm((f) => ({ ...f, work_type: e.target.value }))}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label className="input-label">予算額（千円）*</label>
                <input
                  type="number"
                  className="input-field"
                  value={form.budget}
                  onChange={(e) => setForm((f) => ({ ...f, budget: e.target.value }))}
                  min={1}
                  step={1}
                  required
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <div>
              <label className="input-label">担当課</label>
              <input
                type="text"
                className="input-field"
                value={form.department}
                onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "登録中..." : "💾 登録する"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

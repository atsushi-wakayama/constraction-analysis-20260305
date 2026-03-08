import { useState, useCallback } from "react";
import Upload from "./Upload";
import DataManage from "./DataManage";

const ADMIN_PASSWORD = "hidaka2024";

type Tab = "upload" | "manage";

interface AdminProps {
  years: number[];
  onDataChange: () => void;
}

function AdminContent({ years, onDataChange }: AdminProps) {
  const [tab, setTab] = useState<Tab>("upload");

  const handleUploadSuccess = useCallback(() => {
    onDataChange();
  }, [onDataChange]);

  return (
    <div>
      <div className="page-header" style={{ borderBottom: "2px solid #f59e0b" }}>
        <h2>🔐 管理者ページ</h2>
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 4 }}>
          このページはURLを知っている管理者のみ利用できます
        </div>
      </div>

      <div style={{ padding: "16px 24px 0" }}>
        <div style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--color-border)", marginBottom: 0 }}>
          <button
            onClick={() => setTab("upload")}
            style={{
              padding: "8px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === "upload" ? 700 : 400,
              color: tab === "upload" ? "var(--color-primary)" : "var(--color-text-muted)",
              borderBottom: tab === "upload" ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: -1,
              fontSize: 14,
            }}
          >
            📤 データ取込
          </button>
          <button
            onClick={() => setTab("manage")}
            style={{
              padding: "8px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontWeight: tab === "manage" ? 700 : 400,
              color: tab === "manage" ? "var(--color-primary)" : "var(--color-text-muted)",
              borderBottom: tab === "manage" ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: -1,
              fontSize: 14,
            }}
          >
            ⚙️ データ管理
          </button>
        </div>
      </div>

      {tab === "upload" && <Upload onUploadSuccess={handleUploadSuccess} />}
      {tab === "manage" && <DataManage years={years} onDataChange={onDataChange} />}
    </div>
  );
}

export default function Admin({ years, onDataChange }: AdminProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setError(false);
    } else {
      setError(true);
      setPassword("");
    }
  };

  if (!authenticated) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <div className="card" style={{ width: 320, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔐</div>
          <div className="card-title" style={{ marginBottom: 8 }}>管理者ログイン</div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", marginBottom: 20 }}>
            パスワードを入力してください
          </p>
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password"
              className="input-field"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              style={{ width: "100%", textAlign: "center" }}
            />
            {error && (
              <div style={{ color: "#ef4444", fontSize: 13 }}>
                パスワードが正しくありません
              </div>
            )}
            <button type="submit" className="btn btn-primary">
              ログイン
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminContent years={years} onDataChange={onDataChange} />;
}

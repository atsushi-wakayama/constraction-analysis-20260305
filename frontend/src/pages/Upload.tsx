import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api, UploadResponse } from "../api/client";
import { getMuniColor, formatBudgetFull } from "../components/MunicipalityColors";

interface UploadProps {
  onUploadSuccess: () => void;
}

export default function Upload({ onUploadSuccess }: UploadProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualYear, setManualYear] = useState<string>("");

  const handleFile = useCallback(
    async (file: File) => {
      setUploading(true);
      setResult(null);
      setError(null);
      try {
        const yearNum = manualYear ? parseInt(manualYear, 10) : undefined;
        const res = await api.uploadPdf(file, yearNum);
        setResult(res);
        onUploadSuccess();
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setUploading(false);
      }
    },
    [manualYear, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) handleFile(acceptedFiles[0]);
    },
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div>
      <div className="page-header">
        <h2>📤 データ取込</h2>
      </div>

      <div className="page-body">
        <div className="card section" style={{ maxWidth: 640 }}>
          <div className="card-title">工事箇所表PDFのアップロード</div>

          {/* Manual year input */}
          <div style={{ marginBottom: 16 }}>
            <label className="input-label">
              年度（PDFから自動検出できない場合のみ入力）
            </label>
            <input
              type="number"
              className="input-field"
              placeholder="例: 2024"
              value={manualYear}
              onChange={(e) => setManualYear(e.target.value)}
              min={1990}
              max={2100}
              style={{ width: 160 }}
            />
          </div>

          {/* Drop zone */}
          <div
            {...getRootProps()}
            className={`upload-zone ${isDragActive ? "drag-active" : ""}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <>
                <div className="spinner" style={{ margin: "0 auto 12px" }} />
                <div className="upload-text">解析中...</div>
                <div className="upload-hint">PDFを読み込んでいます。しばらくお待ちください</div>
              </>
            ) : (
              <>
                <div className="upload-icon">📄</div>
                <div className="upload-text">
                  {isDragActive
                    ? "ここにドロップしてください"
                    : "PDFをドラッグ＆ドロップ"}
                </div>
                <div className="upload-hint">
                  またはクリックしてファイルを選択
                </div>
                <div className="upload-hint" style={{ marginTop: 8, color: "#9ca3af" }}>
                  対応形式: PDF (.pdf)
                </div>
              </>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="alert alert-error section" style={{ maxWidth: 640 }}>
            <span>❌</span>
            <div>
              <strong>アップロードに失敗しました</strong>
              <p style={{ marginTop: 4 }}>{error}</p>
              <p style={{ marginTop: 8, fontSize: 12 }}>
                自動検出に失敗した場合は「年度」を手動で入力してから再試行してください。
                また、PDFの形式によっては手動でデータ入力が必要な場合があります。
              </p>
            </div>
          </div>
        )}

        {/* Success result */}
        {result && (
          <div style={{ maxWidth: 640 }}>
            <div className="alert alert-success section">
              ✅ <strong>{result.fiscal_year}年度</strong> のデータを取り込みました（{result.total_items}件）
            </div>

            {result.warnings.length > 0 && (
              <div className="alert alert-warning section">
                ⚠️ 警告: {result.warnings.join(" / ")}
              </div>
            )}

            <div className="card">
              <div className="card-title">取込結果：市町別予算合計</div>
              {Object.entries(result.municipality_totals)
                .sort(([, a], [, b]) => b - a)
                .map(([muni, budget]) => (
                  <div key={muni} style={{ marginBottom: 12 }}>
                    <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: getMuniColor(muni),
                            display: "inline-block",
                          }}
                        />
                        <span style={{ fontWeight: 600, fontSize: 13 }}>{muni}</span>
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          color: getMuniColor(muni),
                          fontSize: 13,
                        }}
                      >
                        {formatBudgetFull(budget)}
                      </span>
                    </div>
                    <div className="budget-bar">
                      <div
                        className="budget-bar-fill"
                        style={{
                          width: `${(budget / result.total_budget) * 100}%`,
                          background: getMuniColor(muni),
                        }}
                      />
                    </div>
                  </div>
                ))}
              <div
                style={{
                  borderTop: "1px solid var(--color-border)",
                  marginTop: 12,
                  paddingTop: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  fontWeight: 700,
                }}
              >
                <span>合計</span>
                <span>{formatBudgetFull(result.total_budget)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Manual entry hint */}
        <div className="card" style={{ maxWidth: 640, marginTop: 16 }}>
          <div className="card-title">💡 PDFが正しく読み込めない場合</div>
          <p style={{ fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.7 }}>
            工事箇所表のPDFは様々な形式があるため、自動解析が難しい場合があります。
            その場合は「データ管理」ページから手動でデータを入力するか、
            Excelデータがある場合はCSVに変換してお知らせください。
            PDF解析の精度向上のため、実際のPDFサンプルを共有いただくと
            パーサーを最適化することができます。
          </p>
        </div>
      </div>
    </div>
  );
}

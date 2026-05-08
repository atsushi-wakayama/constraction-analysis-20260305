"use client";

import { useState, useTransition } from "react";

type SyncReceiptsAction = () => Promise<{
  added: number;
  skipped: number;
  errors: { name: string; error: string }[];
}>;
type BackupAction = () => Promise<{
  uploaded: { name: string; size: number }[];
  error?: string;
}>;
type XlsxScanAction = () => Promise<{
  message: string;
  files?: string[];
}>;

export function GoogleSyncPanel({
  syncReceipts,
  backup,
  scanXlsx,
}: {
  syncReceipts: SyncReceiptsAction;
  backup: BackupAction;
  scanXlsx: XlsxScanAction;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const run = (label: string, fn: () => Promise<unknown>) => {
    setMsg(`${label}: 処理中...`);
    start(async () => {
      try {
        const r = (await fn()) as Record<string, unknown>;
        setMsg(`${label} ✓ ${JSON.stringify(r, null, 2)}`);
      } catch (err) {
        setMsg(`${label} ✗ ${String(err)}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => run("領収書同期", syncReceipts)}
          className="app-card p-4 text-left hover:border-[--color-brand] transition disabled:opacity-50"
        >
          <div className="font-bold mb-1">📥 領収書を同期</div>
          <p className="text-xs text-[--color-muted]">
            Drive上のPDF/画像を全て取り込み（既に取り込み済みのものはスキップ）
          </p>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("xlsx スキャン", scanXlsx)}
          className="app-card p-4 text-left hover:border-[--color-brand] transition disabled:opacity-50"
        >
          <div className="font-bold mb-1">📊 xlsxを検出</div>
          <p className="text-xs text-[--color-muted]">
            会計帳簿・自動車使用簿のxlsxを発見（Phase 2でパース対応）
          </p>
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => run("JSONバックアップ", backup)}
          className="app-card p-4 text-left hover:border-[--color-brand] transition disabled:opacity-50"
        >
          <div className="font-bold mb-1">💾 JSONバックアップ</div>
          <p className="text-xs text-[--color-muted]">
            data/*.json をDriveに `admin-backup-{`}timestamp{`}` フォルダで保存
          </p>
        </button>
      </div>
      {msg && (
        <pre className="app-card p-4 text-xs whitespace-pre-wrap font-mono leading-relaxed">
          {msg}
        </pre>
      )}
    </div>
  );
}

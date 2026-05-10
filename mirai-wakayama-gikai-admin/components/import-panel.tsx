"use client";

import { useState, useTransition } from "react";

interface ImportResult {
  filename: string;
  ok: boolean;
  type: string;
  message: string;
}

type Action = (form: FormData) => Promise<ImportResult[]>;

export function ImportPanel({ action }: { action: Action }) {
  const [pending, start] = useTransition();
  const [results, setResults] = useState<ImportResult[] | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);

  function onDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.toLowerCase().endsWith(".xlsx") || f.name.toLowerCase().endsWith(".docx"),
    );
    setFiles((prev) => [...prev, ...dropped]);
  }

  function submit() {
    if (files.length === 0) return;
    const fd = new FormData();
    for (const f of files) fd.append("files", f);
    setResults(null);
    start(async () => {
      const r = await action(fd);
      setResults(r);
      setFiles([]);
    });
  }

  return (
    <div className="space-y-4">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={`block border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
          dragOver
            ? "border-[--color-brand] bg-[--color-brand-soft]"
            : "border-[--color-border-strong] bg-[--color-surface-2] hover:bg-[--color-surface-3]"
        }`}
      >
        <input
          type="file"
          accept=".xlsx,.docx"
          multiple
          className="hidden"
          onChange={(e) => {
            const picked = Array.from(e.target.files ?? []);
            setFiles((prev) => [...prev, ...picked]);
            e.target.value = "";
          }}
        />
        <div className="text-3xl mb-2">📂</div>
        <div className="font-bold mb-1">ここに .xlsx / .docx をドラッグ＆ドロップ</div>
        <div className="text-xs text-[--color-faint]">
          またはクリックしてファイル選択（複数まとめて可）
        </div>
      </label>

      {files.length > 0 && (
        <div className="app-card p-4">
          <div className="section-title mb-2">
            <span>選択されたファイル</span>
            <small>{files.length}件</small>
          </div>
          <ul className="space-y-1.5 mb-3">
            {files.map((f, i) => (
              <li
                key={i}
                className="flex items-center justify-between text-sm py-1.5 px-2 rounded hover:bg-[--color-surface-2]"
              >
                <span className="truncate">
                  <span className="text-[--color-faint] mr-2">
                    {f.name.toLowerCase().endsWith(".xlsx") ? "📊" : "📝"}
                  </span>
                  <span className="font-medium">{f.name}</span>
                  <span className="text-xs text-[--color-faint] ml-2">
                    {(f.size / 1024).toFixed(0)} KB
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="text-[--color-mirai-red] text-xs hover:underline ml-2"
                >
                  削除
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="btn btn-mint disabled:opacity-50"
            >
              {pending ? "取り込み中..." : `${files.length}件をまとめて取り込み`}
            </button>
            <button
              type="button"
              onClick={() => setFiles([])}
              className="btn btn-ghost btn-sm"
            >
              クリア
            </button>
          </div>
        </div>
      )}

      {results && (
        <div className="app-card p-4">
          <div className="section-title mb-2">
            <span>取り込み結果</span>
            <small>
              成功 {results.filter((r) => r.ok).length} / 失敗{" "}
              {results.filter((r) => !r.ok).length}
            </small>
          </div>
          <ul className="space-y-1.5">
            {results.map((r, i) => (
              <li
                key={i}
                className={`text-sm rounded-lg p-3 border ${
                  r.ok
                    ? "bg-[--color-mirai-green-soft] border-[--color-mirai-green-deep]/20"
                    : "bg-[--color-mirai-red-soft] border-[--color-mirai-red]/20"
                }`}
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span>{r.ok ? "✓" : "✗"}</span>
                  <span className="font-bold">{r.filename}</span>
                  <span className="text-xs text-[--color-faint]">[{r.type}]</span>
                </div>
                <div className="text-xs text-[--color-muted] mt-0.5">{r.message}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

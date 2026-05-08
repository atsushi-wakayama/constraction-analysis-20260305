"use client";

export function PrintButton({ label = "印刷" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-3 py-2 bg-black text-white text-sm rounded"
    >
      {label}
    </button>
  );
}

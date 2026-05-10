"use client";

import Link from "next/link";
import { useState } from "react";
import type { ActivityRecord, PaymentCertificate } from "@/lib/types";
import { Pill } from "./ui";

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

export function CertOutOfPrefGroup({
  certs,
  activities,
}: {
  certs: PaymentCertificate[];
  activities: ActivityRecord[];
}) {
  const [open, setOpen] = useState(true);
  const actsById = new Map(activities.map((a) => [a.id, a]));
  const total = certs.reduce(
    (s, c) => s + c.entries.reduce((sub, e) => sub + (e.allocatedYen || 0), 0),
    0,
  );

  if (certs.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[--color-mirai-orange]/30 bg-[--color-mirai-orange-soft]/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-[--color-mirai-orange-soft]/70 transition text-left"
      >
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <Pill tone="orange">✈ 県外調査</Pill>
          <span className="text-sm font-bold">{certs.length}件</span>
          <span className="text-xs text-[--color-faint] font-normal">
            充当合計{" "}
            <span className="font-display tabular-nums text-[--color-foreground]">
              {yen(total)}
            </span>
          </span>
        </div>
        <span className="text-[--color-faint] text-sm shrink-0">
          {open ? "▲ 折りたたむ" : "▼ 展開する"}
        </span>
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-[10px] text-[--color-muted] mb-3 leading-relaxed">
            活動記録簿（県外調査）から1視察ごとに作成された支払証明書。それぞれ独立した1ファイルです。
          </p>
          <ul className="space-y-1.5">
            {certs.map((c) => {
              const act = actsById.get(c.linkedActivityId ?? "");
              const sum = c.entries.reduce((s, e) => s + (e.allocatedYen || 0), 0);
              return (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 bg-white/70 rounded-lg px-3 py-2"
                >
                  <Link
                    href={`/forms/payment-certificate/${c.id}`}
                    className="min-w-0 flex-1 hover:text-[--color-brand] group"
                  >
                    <div className="text-sm font-bold flex items-center gap-2 flex-wrap">
                      <span>{c.category}</span>
                      {act && (
                        <span className="text-xs text-[--color-faint] font-normal">
                          → {act.implementationDate} · {act.location.slice(0, 40)}
                          {act.location.length > 40 ? "…" : ""}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[--color-faint]">
                      {c.entries.length}件 · 充当{" "}
                      <span className="font-display tabular-nums text-[--color-foreground]">
                        {yen(sum)}
                      </span>
                    </div>
                  </Link>
                  <Link
                    href={`/forms/payment-certificate/${c.id}`}
                    className="btn btn-ghost btn-sm"
                  >
                    編集 →
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

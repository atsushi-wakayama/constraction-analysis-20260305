"use client";

import { useState } from "react";

export function ExpandableList({
  initial,
  more,
  initialCount = 8,
}: {
  initial: React.ReactNode[];
  more: React.ReactNode[];
  initialCount?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <ul className="divide-y divide-[--color-border]">
      {initial}
      {open && more}
      {more.length > 0 && (
        <li className="py-2 text-center">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="btn btn-ghost btn-sm"
          >
            {open ? "▲ 折りたたむ" : `▼ 他 ${more.length}件を表示`}
          </button>
        </li>
      )}
    </ul>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import cloud from "d3-cloud";

type Tag = { label: string; weight: number };

type Placed = {
  text: string;
  size: number;
  x: number;
  y: number;
  rotate: number;
  color: string;
};

const PALETTE = [
  "#E85B1A", // wakayama-orange
  "#0F6FA8", // wakayama-blue-dark
  "#0A7C66", // teal
  "#B4531B", // burnt orange
  "#1F5AA6", // deep blue
  "#047857", // emerald
  "#B91C1C", // red
  "#7C3AED", // violet
  "#0EA5E9", // sky
  "#A16207", // amber
  "#BE185D", // pink
  "#065F46", // dark emerald
];

// 決定論的な疑似乱数（議員ごとに安定した配置）
function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function hashString(str: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function WordCloud({
  tags,
  seed,
  height = 320,
}: {
  tags: Tag[];
  seed: string;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [placed, setPlaced] = useState<Placed[]>([]);

  // Observe container width
  useEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setWidth(Math.max(320, Math.floor(e.contentRect.width)));
      }
    });
    ro.observe(el);
    setWidth(Math.max(320, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  // Run d3-cloud layout
  useEffect(() => {
    if (!tags.length) {
      setPlaced([]);
      return;
    }
    const seedNum = hashString(seed);
    const rand = seededRand(seedNum);

    const maxW = Math.max(...tags.map((t) => t.weight));
    const minW = Math.min(...tags.map((t) => t.weight));
    const span = Math.max(1, maxW - minW);

    // ウエイトを 14〜56px にマッピング
    const sizeFor = (w: number) => 14 + ((w - minW) / span) * 42;

    // ウエイト順で色を付ける（大きいほど濃い系）
    const sorted = [...tags].sort((a, b) => b.weight - a.weight);
    const colorMap = new Map<string, string>();
    sorted.forEach((t, i) => {
      colorMap.set(t.label, PALETTE[i % PALETTE.length]);
    });

    const words = tags.map((t) => ({
      text: t.label,
      size: sizeFor(t.weight),
      color: colorMap.get(t.label) ?? PALETTE[0],
    }));

    let cancelled = false;
    const layout = cloud<(typeof words)[number]>()
      .size([width, height])
      .words(words)
      .padding(3)
      .rotate(() => (rand() < 0.82 ? 0 : 90)) // 大半は水平、一部だけ縦
      .font("'Noto Sans JP', sans-serif")
      .fontSize((d) => d.size ?? 14)
      .spiral("archimedean")
      .random(rand)
      .on("end", (out) => {
        if (cancelled) return;
        setPlaced(
          out.map((o) => {
            const oo = o as unknown as {
              text?: string;
              size?: number;
              x?: number;
              y?: number;
              rotate?: number;
              color: string;
            };
            return {
              text: oo.text ?? "",
              size: oo.size ?? 14,
              x: oo.x ?? 0,
              y: oo.y ?? 0,
              rotate: oo.rotate ?? 0,
              color: oo.color,
            };
          }),
        );
      });
    layout.start();
    return () => {
      cancelled = true;
    };
  }, [tags, seed, width, height]);

  return (
    <div ref={containerRef} className="w-full">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block"
      >
        <g transform={`translate(${width / 2}, ${height / 2})`}>
          {placed.map((p) => (
            <text
              key={p.text}
              textAnchor="middle"
              transform={`translate(${p.x}, ${p.y}) rotate(${p.rotate})`}
              style={{
                fontSize: `${p.size}px`,
                fontFamily: "'Noto Sans JP', sans-serif",
                fontWeight: p.size > 36 ? 900 : p.size > 24 ? 800 : 600,
                fill: p.color,
              }}
            >
              {p.text}
            </text>
          ))}
        </g>
      </svg>
    </div>
  );
}

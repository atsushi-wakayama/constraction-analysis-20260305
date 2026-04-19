"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

type Props = { data: { axis: string; value: number }[] };

export function TopicRadarChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="#e2e8f0" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 11, fill: "#334155" }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            stroke="#cbd5e1"
          />
          <Radar
            name="発言傾向"
            dataKey="value"
            stroke="#e8873a"
            fill="#e8873a"
            fillOpacity={0.4}
            strokeWidth={2}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
            formatter={(v) => [`${Number(v ?? 0)}`, "強度"]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

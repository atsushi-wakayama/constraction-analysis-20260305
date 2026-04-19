"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";

type Props = { data: { policy: string; amount: number }[] };

export function PriorityBarChart({ data }: Props) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 40, left: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
          />
          <YAxis
            type="category"
            dataKey="policy"
            width={90}
            tick={{ fontSize: 12, fill: "#334155" }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 12,
            }}
            formatter={(v) => [`${Number(v ?? 0)}億円`, "予算額"]}
            cursor={{ fill: "rgba(232, 135, 58, 0.08)" }}
          />
          <Bar dataKey="amount" fill="#e8873a" radius={[0, 6, 6, 0]} barSize={22}>
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(v) => `${Number(v ?? 0)}億円`}
              style={{ fill: "#b7611e", fontSize: 11, fontWeight: 600 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

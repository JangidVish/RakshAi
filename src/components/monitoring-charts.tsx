"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const TIER_COLORS: Record<string, string> = {
  LOW: "#16a34a",
  MEDIUM: "#d97706",
  HIGH: "#dc2626",
  CRITICAL: "#7c3aed",
};

export function RiskOverTimeChart({
  data,
}: {
  data: { month: string; score: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" fontSize={12} stroke="#94a3b8" />
        <YAxis domain={[0, 100]} fontSize={12} stroke="#94a3b8" />
        <Tooltip />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={{ r: 3 }}
          name="Avg risk score"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TierPieChart({
  data,
}: {
  data: { tier: string; count: number }[];
}) {
  const nonZero = data.filter((d) => d.count > 0);
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={nonZero}
          dataKey="count"
          nameKey="tier"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={((entry: any) => `${entry.tier}: ${entry.count}`) as any}
        >
          {nonZero.map((entry) => (
            <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Legend />
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

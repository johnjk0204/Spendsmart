"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { motion } from "framer-motion";

interface MonthlyData {
  month: string;
  food: number;
  travel: number;
  shopping: number;
  utilities: number;
  entertainment: number;
  other: number;
}

interface Props {
  data: MonthlyData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-lg text-sm min-w-32">
        <p className="font-medium mb-2">{label}</p>
        {payload.map((p) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="text-muted-foreground capitalize">{p.name}</span>
            <span className="font-medium" style={{ color: p.color }}>₹{p.value.toLocaleString("en-IN")}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const COLORS = {
  food: "#f97316",
  travel: "#3b82f6",
  shopping: "#ec4899",
  utilities: "#6b7280",
  entertainment: "#8b5cf6",
  other: "#a78bfa",
};

export function MonthlyBarChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-72 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-4" />
        <div className="h-52 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <div className="mb-4">
        <h3 className="font-semibold">Monthly Spending Comparison</h3>
        <p className="text-xs text-muted-foreground">Last 6 months by category</p>
      </div>

      {data.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-10">No monthly data yet</div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
            />
            {Object.entries(COLORS).map(([key, color]) => (
              <Bar key={key} dataKey={key} stackId="a" fill={color} radius={key === "other" ? [4, 4, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}

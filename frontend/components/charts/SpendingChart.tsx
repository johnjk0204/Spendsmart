"use client";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

interface SpendingChartProps {
  data: { date: string; amount: number }[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-lg text-sm">
        <p className="text-muted-foreground">{label}</p>
        <p className="font-bold text-violet-400">₹{payload[0].value.toLocaleString("en-IN")}</p>
      </div>
    );
  }
  return null;
};

export function SpendingChart({ data, loading }: SpendingChartProps) {
  const formatted = data.map((d) => ({
    date: (() => {
      try { return format(parseISO(d.date), "dd MMM"); } catch { return d.date; }
    })(),
    amount: d.amount,
  }));

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-72 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-4" />
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold">Spending Trend</h3>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full bg-violet-500 inline-block" />
          Daily spend
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={formatted} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#spendGrad)"
            dot={false}
            activeDot={{ r: 4, fill: "#8b5cf6" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

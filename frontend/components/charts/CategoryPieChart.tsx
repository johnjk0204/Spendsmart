"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { motion } from "framer-motion";
import { CATEGORY_ICONS } from "@/lib/utils";

interface CategoryData {
  category: string;
  amount: number;
  percentage: number;
  color: string;
}

interface Props {
  data: CategoryData[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { payload: CategoryData }[] }) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-xl px-4 py-2 shadow-lg text-sm">
        <p className="font-medium">{d.category}</p>
        <p className="text-muted-foreground">₹{d.amount.toLocaleString("en-IN")}</p>
        <p className="text-violet-400">{d.percentage}%</p>
      </div>
    );
  }
  return null;
};

export function CategoryPieChart({ data, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 h-72 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-4" />
        <div className="h-48 bg-muted rounded-full mx-auto w-48" />
      </div>
    );
  }

  const top6 = data.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-border bg-card p-5"
    >
      <h3 className="font-semibold mb-1">By Category</h3>
      <p className="text-xs text-muted-foreground mb-4">This month's breakdown</p>

      {data.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-10">No expenses yet</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={top6} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="amount">
                {top6.map((entry, i) => (
                  <Cell key={i} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-2.5 mt-3">
            {top6.map((d) => (
              <div key={d.category} className="flex items-center gap-2 text-sm">
                <span className="text-base shrink-0">{CATEGORY_ICONS[d.category] ?? "📦"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-muted-foreground truncate">{d.category}</span>
                    <span className="font-semibold ml-2 shrink-0">
                      ₹{d.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${d.percentage}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
                <span className="text-xs text-muted-foreground w-9 text-right shrink-0">
                  {d.percentage}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}

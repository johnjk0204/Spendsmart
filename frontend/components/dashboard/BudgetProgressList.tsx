"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, AlertCircle } from "lucide-react";
import { formatCurrency, CATEGORY_ICONS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  spent_amount: number;
  percentage_used: number;
  remaining: number;
  color: string;
}

interface Props {
  budgets: Budget[];
  loading?: boolean;
}

export function BudgetProgressList({ budgets, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 mb-4">
            <div className="h-3 w-32 bg-muted rounded" />
            <div className="h-2 bg-muted rounded-full" />
          </div>
        ))}
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
          <h3 className="font-semibold">Budget Tracker</h3>
          <p className="text-xs text-muted-foreground">{budgets.length} budgets active</p>
        </div>
        <Link href="/budgets" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
          Manage <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-8">
          <p>No budgets set. <Link href="/budgets" className="text-violet-400">Create one →</Link></p>
        </div>
      ) : (
        <div className="space-y-4">
          {budgets.map((budget) => {
            const pct = Math.min(budget.percentage_used, 100);
            const isOver = budget.percentage_used > 100;
            const isWarning = budget.percentage_used >= 80;
            return (
              <div key={budget.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{CATEGORY_ICONS[budget.category] ?? "📦"}</span>
                    <span className="text-sm font-medium">{budget.category}</span>
                    {isOver && <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                  </div>
                  <div className="text-xs text-right">
                    <span className={cn("font-semibold", isOver ? "text-rose-500" : isWarning ? "text-amber-500" : "text-foreground")}>
                      {formatCurrency(budget.spent_amount)}
                    </span>
                    <span className="text-muted-foreground"> / {formatCurrency(budget.limit_amount)}</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full rounded-full transition-all"
                    style={{
                      backgroundColor: isOver ? "#ef4444" : isWarning ? "#f59e0b" : budget.color,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {isOver
                    ? `Over budget by ${formatCurrency(budget.spent_amount - budget.limit_amount)}`
                    : `${formatCurrency(budget.remaining)} remaining`}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

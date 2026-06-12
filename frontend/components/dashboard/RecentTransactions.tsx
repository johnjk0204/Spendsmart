"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { transactionsApi } from "@/lib/api";
import { formatCurrency, formatRelativeDate, CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  transaction_type: string;
  date: string;
  is_impulse: boolean;
  is_recurring: boolean;
}

export function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionsApi.list({ limit: 8 })
      .then(({ data }) => setTransactions(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-36 bg-muted rounded mb-4" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-border last:border-0">
            <div className="w-9 h-9 rounded-xl bg-muted" />
            <div className="flex-1 space-y-1">
              <div className="h-3.5 w-32 bg-muted rounded" />
              <div className="h-3 w-20 bg-muted rounded" />
            </div>
            <div className="h-4 w-16 bg-muted rounded" />
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
          <h3 className="font-semibold">Recent Transactions</h3>
          <p className="text-xs text-muted-foreground">Latest activity</p>
        </div>
        <Link href="/transactions" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
          View all <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {transactions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
      ) : (
        <div className="space-y-1">
          {transactions.map((txn) => {
            const isCredit = txn.transaction_type === "credit";
            const color = CATEGORY_COLORS[txn.category] ?? "#94a3b8";
            return (
              <div key={txn.id} className="flex items-center gap-3 py-2.5 hover:bg-accent rounded-lg px-2 transition-colors group">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: color + "20" }}
                >
                  {CATEGORY_ICONS[txn.category] ?? "📦"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{txn.merchant}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{formatRelativeDate(txn.date)}</p>
                    {txn.is_impulse && (
                      <span className="text-xs bg-amber-500/10 text-amber-500 px-1.5 rounded-md">impulse</span>
                    )}
                    {txn.is_recurring && (
                      <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 rounded-md">recurring</span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "text-sm font-semibold",
                  isCredit ? "text-emerald-500" : "text-foreground"
                )}>
                  {isCredit ? "+" : "-"}{formatCurrency(txn.amount)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

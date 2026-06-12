"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { budgetsApi } from "@/lib/api";
import { formatCurrency, CATEGORY_ICONS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Trash2, AlertCircle, CheckCircle2, Loader2, Target } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Food", "Travel", "Shopping", "EMI", "Utilities", "Entertainment",
  "Medical", "Fuel", "Investments", "Subscriptions", "Miscellaneous",
];

const COLORS = [
  "#6366f1", "#f97316", "#3b82f6", "#ec4899", "#ef4444",
  "#10b981", "#f59e0b", "#8b5cf6", "#06b6d4", "#22c55e",
];

interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  spent_amount: number;
  percentage_used: number;
  remaining: number;
  color: string;
  is_active: boolean;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ category: "Food", limit_amount: "", color: COLORS[0] });
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      const { data } = await budgetsApi.list();
      setBudgets(data);
    } catch {
      toast.error("Failed to load budgets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBudgets(); }, []);

  const createBudget = async () => {
    if (!form.limit_amount) return;
    setCreating(true);
    try {
      await budgetsApi.create({
        ...form,
        limit_amount: parseFloat(form.limit_amount),
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
      toast.success("Budget created!");
      setShowForm(false);
      setForm({ category: "Food", limit_amount: "", color: COLORS[0] });
      fetchBudgets();
    } catch {
      toast.error("Failed to create budget");
    } finally {
      setCreating(false);
    }
  };

  const deleteBudget = async (id: string) => {
    setDeleting(id);
    try {
      await budgetsApi.delete(id);
      setBudgets((p) => p.filter((b) => b.id !== id));
      toast.success("Budget deleted");
    } catch {
      toast.error("Failed to delete budget");
    } finally {
      setDeleting(null);
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.limit_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent_amount, 0);
  const overBudget = budgets.filter((b) => b.percentage_used > 100);

  return (
    <div>
      <Header title="Budget Tracker" subtitle="Set and monitor spending limits" />
      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Budget", value: formatCurrency(totalBudget), color: "violet" },
            { label: "Total Spent", value: formatCurrency(totalSpent), color: "rose" },
            { label: "Over Budget", value: `${overBudget.length} categories`, color: "amber" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>

        {/* Add button */}
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Budget
          </button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="font-semibold mb-4">Create Budget</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Monthly Limit (₹)</label>
                  <input
                    type="number"
                    value={form.limit_amount}
                    onChange={(e) => setForm((f) => ({ ...f, limit_amount: e.target.value }))}
                    placeholder="5000"
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1.5">Color</label>
                  <div className="flex gap-2 flex-wrap pt-1">
                    {COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setForm((f) => ({ ...f, color }))}
                        className={cn(
                          "w-6 h-6 rounded-full transition-all",
                          form.color === color && "ring-2 ring-offset-2 ring-offset-card ring-white scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createBudget}
                  disabled={creating || !form.limit_amount}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Budget
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Budget cards */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : budgets.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-medium mb-1">No budgets yet</p>
            <p className="text-sm text-muted-foreground">Create your first budget to track spending by category</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {budgets.map((budget) => {
              const pct = Math.min(budget.percentage_used, 100);
              const isOver = budget.percentage_used > 100;
              const isWarning = budget.percentage_used >= 80;
              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl border border-border bg-card p-5 card-hover"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{CATEGORY_ICONS[budget.category] ?? "📦"}</span>
                      <div>
                        <p className="font-semibold">{budget.category}</p>
                        <p className="text-xs text-muted-foreground">Monthly limit</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOver ? (
                        <AlertCircle className="w-4 h-4 text-rose-500" />
                      ) : isWarning ? (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        disabled={deleting === budget.id}
                        className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                      >
                        {deleting === budget.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-2">
                      <span className={cn(
                        "font-bold text-lg",
                        isOver ? "text-rose-500" : isWarning ? "text-amber-500" : "text-foreground"
                      )}>
                        {formatCurrency(budget.spent_amount)}
                      </span>
                      <span className="text-muted-foreground">{formatCurrency(budget.limit_amount)}</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: isOver ? "#ef4444" : isWarning ? "#f59e0b" : budget.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {isOver
                        ? `Over by ${formatCurrency(budget.spent_amount - budget.limit_amount)}`
                        : `${formatCurrency(budget.remaining)} left`}
                    </span>
                    <span className={cn(
                      "font-semibold",
                      isOver ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500"
                    )}>
                      {budget.percentage_used.toFixed(0)}%
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

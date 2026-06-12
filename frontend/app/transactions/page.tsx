"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { transactionsApi } from "@/lib/api";
import { formatCurrency, formatDate, CATEGORY_ICONS, CATEGORY_COLORS } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Plus, Search, Filter, Trash2, Edit2, Loader2, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { AddTransactionModal } from "@/components/transactions/AddTransactionModal";

const CATEGORIES = [
  "All", "Food", "Travel", "Shopping", "EMI", "Utilities",
  "Entertainment", "Medical", "Fuel", "Investments", "Subscriptions", "Miscellaneous",
];

interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  transaction_type: string;
  date: string;
  is_impulse: boolean;
  is_recurring: boolean;
  description?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | undefined> = {};
      if (search) params.search = search;
      if (selectedCategory !== "All") params.category = selectedCategory;
      const { data } = await transactionsApi.list({ ...params, limit: 100 });
      setTransactions(data);
    } catch {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTransactions(); }, [search, selectedCategory]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    setDeleting(id);
    try {
      await transactionsApi.delete(id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      toast.success("Transaction deleted");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <Header title="Transactions" subtitle={`${transactions.length} transactions`} />
      <div className="p-6">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search merchant..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all shrink-0",
                selectedCategory === cat
                  ? "bg-violet-600 text-white"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {cat !== "All" ? `${CATEGORY_ICONS[cat] ?? ""} ` : ""}{cat}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-16">
              <p className="text-lg font-medium mb-2">No transactions found</p>
              <p className="text-sm">Try changing the filter or adding a transaction</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left px-4 py-3 font-medium">Merchant</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((txn, i) => {
                  const color = CATEGORY_COLORS[txn.category] ?? "#94a3b8";
                  const isCredit = txn.transaction_type === "credit";
                  return (
                    <motion.tr
                      key={txn.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className="border-b border-border/50 hover:bg-accent/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                            style={{ backgroundColor: color + "20" }}
                          >
                            {CATEGORY_ICONS[txn.category] ?? "📦"}
                          </div>
                          <div>
                            <p className="font-medium">{txn.merchant}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {txn.is_impulse && (
                                <span className="text-xs bg-amber-500/10 text-amber-500 px-1.5 rounded-md">impulse</span>
                              )}
                              {txn.is_recurring && (
                                <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 rounded-md">recurring</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="px-2.5 py-1 rounded-lg text-xs" style={{ backgroundColor: color + "20", color }}>
                          {txn.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden lg:table-cell">
                        {formatDate(txn.date)}
                      </td>
                      <td className={cn(
                        "px-4 py-3 text-right font-semibold",
                        isCredit ? "text-emerald-500" : "text-foreground"
                      )}>
                        {isCredit ? "+" : "-"}{formatCurrency(txn.amount)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(txn.id)}
                          disabled={deleting === txn.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        >
                          {deleting === txn.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <AddTransactionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => { setShowAddModal(false); fetchTransactions(); }}
      />
    </div>
  );
}

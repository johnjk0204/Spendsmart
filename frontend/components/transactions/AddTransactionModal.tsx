"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { transactionsApi } from "@/lib/api";
import { toast } from "sonner";

const CATEGORIES = [
  "Food", "Travel", "Shopping", "EMI", "Utilities", "Entertainment",
  "Medical", "Fuel", "Investments", "Subscriptions", "Miscellaneous",
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddTransactionModal({ open, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    merchant: "",
    amount: "",
    category: "Food",
    transaction_type: "debit",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.merchant || !form.amount) return;
    setLoading(true);
    try {
      await transactionsApi.create({
        ...form,
        amount: parseFloat(form.amount),
        date: new Date(form.date).toISOString(),
      });
      toast.success("Transaction added!");
      onSuccess();
    } catch {
      toast.error("Failed to add transaction");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-xl z-10"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Add Transaction</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { key: "merchant", label: "Merchant / Description", type: "text", placeholder: "Swiggy, Netflix..." },
                { key: "amount", label: "Amount (₹)", type: "number", placeholder: "500" },
                { key: "date", label: "Date", type: "date", placeholder: "" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-1.5">{label}</label>
                  <input
                    type={type}
                    value={form[key as keyof typeof form]}
                    onChange={update(key)}
                    placeholder={placeholder}
                    required={key !== "notes"}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select
                    value={form.category}
                    onChange={update("category")}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Type</label>
                  <select
                    value={form.transaction_type}
                    onChange={update("transaction_type")}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="debit">Expense</option>
                    <option value="credit">Income</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

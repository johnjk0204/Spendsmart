"use client";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Lightbulb, Trophy, Info, X } from "lucide-react";
import { insightsApi } from "@/lib/api";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelativeDate } from "@/lib/utils";

interface Insight {
  id: string;
  type: string;
  title: string;
  body: string;
  priority: string;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
}

const typeConfig = {
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  suggestion: { icon: Lightbulb, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  achievement: { icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
  info: { icon: Info, color: "text-violet-500", bg: "bg-violet-500/10", border: "border-violet-500/20" },
};

export function InsightCards({ insights: initial, loading }: { insights: Insight[]; loading?: boolean }) {
  const [items, setItems] = useState(initial);

  const dismiss = async (id: string) => {
    try {
      await insightsApi.dismiss(id);
      setItems((p) => p.filter((i) => i.id !== id));
    } catch {
      toast.error("Could not dismiss insight");
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3 animate-pulse">
        <div className="h-4 w-28 bg-muted rounded mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-xl" />
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
          <h3 className="font-semibold">AI Insights</h3>
          <p className="text-xs text-muted-foreground">{items.length} active insights</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-8">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>No insights yet. Upload a bank statement to get started.</p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-3">
            {items.map((insight) => {
              const config = typeConfig[insight.type as keyof typeof typeConfig] ?? typeConfig.info;
              const Icon = config.icon;
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10, height: 0 }}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border transition-all",
                    config.bg, config.border,
                    !insight.is_read && "ring-1 ring-violet-500/20"
                  )}
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{insight.body}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{formatRelativeDate(insight.created_at)}</p>
                  </div>
                  <button
                    onClick={() => dismiss(insight.id)}
                    className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

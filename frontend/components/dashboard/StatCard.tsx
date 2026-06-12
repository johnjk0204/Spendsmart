"use client";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
  color: "rose" | "emerald" | "blue" | "violet" | "amber";
  loading?: boolean;
}

const colorMap = {
  rose: { bg: "bg-rose-500/10", icon: "text-rose-500", border: "border-rose-500/20" },
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-500", border: "border-emerald-500/20" },
  blue: { bg: "bg-blue-500/10", icon: "text-blue-500", border: "border-blue-500/20" },
  violet: { bg: "bg-violet-500/10", icon: "text-violet-500", border: "border-violet-500/20" },
  amber: { bg: "bg-amber-500/10", icon: "text-amber-500", border: "border-amber-500/20" },
};

export function StatCard({ title, value, subtitle, icon, trend, color, loading }: StatCardProps) {
  const colors = colorMap[color];

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-4" />
        <div className="h-8 w-32 bg-muted rounded mb-2" />
        <div className="h-3 w-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border bg-card p-5 card-hover",
        colors.border
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{title}</span>
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", colors.bg)}>
          <span className={colors.icon}>{icon}</span>
        </div>
      </div>
      <div className="text-2xl font-bold tracking-tight">{value}</div>
      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2 mt-1.5">
          {trend !== undefined && (
            <span className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              trend >= 0 ? "text-emerald-500" : "text-rose-500"
            )}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
          {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}

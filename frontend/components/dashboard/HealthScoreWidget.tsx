"use client";
import { motion } from "framer-motion";
import { getHealthGradeColor } from "@/lib/utils";

interface Props {
  score: { score: number; grade: string; summary: string; improvements: string[] } | null;
  loading?: boolean;
}

export function HealthScoreWidget({ score, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-6" />
        <div className="w-32 h-32 rounded-full bg-muted mx-auto mb-4" />
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded" />
          <div className="h-3 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  const s = score?.score ?? 50;
  const grade = score?.grade ?? "C";
  const strokeDasharray = `${(s / 100) * 220} 220`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center"
    >
      <h3 className="font-semibold w-full mb-1">Financial Health</h3>
      <p className="text-xs text-muted-foreground w-full mb-4">AI-computed score</p>

      {/* Radial gauge */}
      <div className="relative w-36 h-36">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="35" fill="none"
            stroke={s >= 80 ? "#22c55e" : s >= 65 ? "#3b82f6" : s >= 50 ? "#f59e0b" : "#ef4444"}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${getHealthGradeColor(s)}`}>{s.toFixed(0)}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      <div className={`text-2xl font-bold mt-2 ${getHealthGradeColor(s)}`}>Grade {grade}</div>
      <p className="text-xs text-center text-muted-foreground mt-2 mb-4">{score?.summary}</p>

      <div className="w-full space-y-2">
        {score?.improvements?.slice(0, 2).map((imp, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
            <span className="text-violet-400 mt-0.5">→</span>
            <span>{imp}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

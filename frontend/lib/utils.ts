import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return formatDate(date);
}

export function getHealthGradeColor(score: number): string {
  if (score >= 80) return "text-green-500";
  if (score >= 65) return "text-blue-500";
  if (score >= 50) return "text-yellow-500";
  return "text-red-500";
}

export function getHealthGradeBg(score: number): string {
  if (score >= 80) return "bg-green-500";
  if (score >= 65) return "bg-blue-500";
  if (score >= 50) return "bg-yellow-500";
  return "bg-red-500";
}

export function getRiskColor(level: string): string {
  switch (level) {
    case "low": return "text-green-500";
    case "medium": return "text-yellow-500";
    case "high": return "text-red-500";
    default: return "text-gray-500";
  }
}

export const CATEGORY_COLORS: Record<string, string> = {
  Food: "#f97316",
  Travel: "#3b82f6",
  Shopping: "#ec4899",
  EMI: "#ef4444",
  Utilities: "#6b7280",
  Entertainment: "#8b5cf6",
  Medical: "#10b981",
  Fuel: "#f59e0b",
  Investments: "#22c55e",
  Subscriptions: "#06b6d4",
  Salary: "#4ade80",
  Transfer: "#94a3b8",
  Miscellaneous: "#a78bfa",
};

export const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍽️",
  Travel: "✈️",
  Shopping: "🛍️",
  EMI: "🏦",
  Utilities: "💡",
  Entertainment: "🎭",
  Medical: "🏥",
  Fuel: "⛽",
  Investments: "📈",
  Subscriptions: "📺",
  Salary: "💰",
  Transfer: "↔️",
  Miscellaneous: "📦",
};

export function truncate(str: string, n: number): string {
  return str.length > n ? str.substring(0, n - 1) + "…" : str;
}

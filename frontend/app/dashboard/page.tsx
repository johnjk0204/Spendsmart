"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/dashboard/StatCard";
import { SpendingChart } from "@/components/charts/SpendingChart";
import { CategoryPieChart } from "@/components/charts/CategoryPieChart";
import { HealthScoreWidget } from "@/components/dashboard/HealthScoreWidget";
import { InsightCards } from "@/components/dashboard/InsightCards";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { BudgetProgressList } from "@/components/dashboard/BudgetProgressList";
import { transactionsApi, insightsApi, budgetsApi } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";
import {
  TrendingUp, TrendingDown, DollarSign, Zap,
  Wallet, Target, AlertTriangle, Award,
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<{
    total_spent: number;
    total_income: number;
    net_savings: number;
    transaction_count: number;
    avg_transaction: number;
    top_category: string;
    impulse_count: number;
    recurring_total: number;
  } | null>(null);
  const [categories, setCategories] = useState<{ category: string; amount: number; percentage: number; color: string }[]>([]);
  const [trends, setTrends] = useState<{ date: string; amount: number }[]>([]);
  const [insights, setInsights] = useState<{ id: string; type: string; title: string; body: string; priority: string; is_read: boolean; is_dismissed: boolean; created_at: string }[]>([]);
  const [healthScore, setHealthScore] = useState<{ score: number; grade: string; summary: string; improvements: string[] } | null>(null);
  const [budgets, setBudgets] = useState<{ id: string; category: string; limit_amount: number; spent_amount: number; percentage_used: number; remaining: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, catsRes, trendsRes, insightsRes, healthRes, budgetsRes] = await Promise.all([
          transactionsApi.stats({ month: now.getMonth() + 1, year: now.getFullYear() }),
          transactionsApi.categories({ month: now.getMonth() + 1, year: now.getFullYear() }),
          transactionsApi.trends(30),
          insightsApi.list(),
          insightsApi.healthScore(),
          budgetsApi.list(),
        ]);
        setStats(statsRes.data);
        setCategories(catsRes.data);
        setTrends(trendsRes.data);
        setInsights(insightsRes.data.slice(0, 4));
        setHealthScore(healthRes.data);
        setBudgets(budgetsRes.data);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savingsRate = stats && stats.total_income > 0
    ? ((stats.net_savings / stats.total_income) * 100).toFixed(1)
    : "0";

  return (
    <div>
      <Header
        title={`Good ${now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening"}, ${user?.full_name?.split(" ")[0] ?? "there"} 👋`}
        subtitle="Here's your financial overview for this month"
      />

      <div className="p-6 space-y-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Spent"
            value={formatCurrency(stats?.total_spent ?? 0)}
            icon={<TrendingDown className="w-5 h-5" />}
            trend={-8.2}
            color="rose"
            loading={loading}
          />
          <StatCard
            title="Total Income"
            value={formatCurrency(stats?.total_income ?? 0)}
            icon={<TrendingUp className="w-5 h-5" />}
            trend={+5.1}
            color="emerald"
            loading={loading}
          />
          <StatCard
            title="Net Savings"
            value={formatCurrency(stats?.net_savings ?? 0)}
            subtitle={`${savingsRate}% savings rate`}
            icon={<Wallet className="w-5 h-5" />}
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Transactions"
            value={String(stats?.transaction_count ?? 0)}
            subtitle={`${stats?.impulse_count ?? 0} impulse buys`}
            icon={<DollarSign className="w-5 h-5" />}
            color="violet"
            loading={loading}
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <SpendingChart data={trends} loading={loading} />
          </div>
          <CategoryPieChart data={categories} loading={loading} />
        </div>

        {/* Middle Row: Health + Insights */}
        <div className="grid lg:grid-cols-3 gap-4">
          <HealthScoreWidget score={healthScore} loading={loading} />
          <div className="lg:col-span-2">
            <InsightCards insights={insights} loading={loading} />
          </div>
        </div>

        {/* Bottom Row: Recent txns + Budgets */}
        <div className="grid lg:grid-cols-2 gap-4">
          <RecentTransactions />
          <BudgetProgressList budgets={budgets} loading={loading} />
        </div>
      </div>
    </div>
  );
}

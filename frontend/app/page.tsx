"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, Shield, Zap, Brain, Upload, BarChart3,
  ArrowRight, CheckCircle, Star, Sparkles
} from "lucide-react";

const features = [
  { icon: Brain, title: "AI Categorization", desc: "Automatically classify 13+ expense categories with 95% accuracy", color: "from-violet-500 to-purple-600" },
  { icon: TrendingUp, title: "Predictive Analytics", desc: "Forecast end-of-month balance & spending trends", color: "from-blue-500 to-cyan-600" },
  { icon: Upload, title: "Multi-Source Import", desc: "Upload PDFs, CSVs, screenshots — AI extracts transactions instantly", color: "from-emerald-500 to-green-600" },
  { icon: BarChart3, title: "Smart Insights", desc: "Weekly summaries, impulse detection & savings opportunities", color: "from-orange-500 to-amber-600" },
  { icon: Zap, title: "Real-time Chat", desc: "Ask FinBot anything about your finances conversationally", color: "from-pink-500 to-rose-600" },
  { icon: Shield, title: "Financial Health Score", desc: "AI-computed score out of 100 with actionable improvements", color: "from-indigo-500 to-blue-600" },
];

const stats = [
  { label: "Transactions Analyzed", value: "2M+" },
  { label: "Average Savings Found", value: "₹8,400" },
  { label: "Accuracy Rate", value: "95%" },
  { label: "Happy Users", value: "50K+" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 text-white overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 glass-dark border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold">SpendSmart <span className="gradient-text">AI</span></span>
          </motion.div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-slate-300 hover:text-white transition-colors">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm mb-8">
              <Sparkles className="w-4 h-4" />
              Powered by LangGraph Multi-Agent AI
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Your Money,{" "}
              <span className="gradient-text">Understood</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload your bank statement and let AI categorize, analyze, predict, and optimize
              your spending in seconds — with personalized savings recommendations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold text-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-500/25"
              >
                Start Analyzing Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/auth/login"
                className="px-8 py-4 rounded-xl border border-white/20 hover:bg-white/10 font-semibold text-lg transition-all duration-200"
              >
                Sign In
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="glass rounded-2xl p-6 text-center">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-slate-400 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to <span className="gradient-text">master your money</span>
            </h2>
            <p className="text-slate-400 text-lg">
              Powered by 6 specialized AI agents working in harmony
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass rounded-2xl p-6 card-hover group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass rounded-3xl p-12 border border-violet-500/20"
        >
          <div className="text-5xl mb-6">🚀</div>
          <h2 className="text-4xl font-bold mb-4">Ready to transform your finances?</h2>
          <p className="text-slate-300 mb-8">
            Join thousands of users who save an average of ₹8,400/month with SpendSmart AI
          </p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 font-semibold text-lg transition-all shadow-lg shadow-violet-500/25"
          >
            Get Started — It&apos;s Free
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 text-center text-slate-500 text-sm">
        <p>© 2026 SpendSmart AI — Built with Next.js, FastAPI & LangGraph</p>
      </footer>
    </div>
  );
}

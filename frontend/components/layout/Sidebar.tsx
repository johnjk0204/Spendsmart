"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, Lightbulb, PiggyBank,
  MessageCircle, Upload, Settings, LogOut, Sparkles, Trophy,
  ChevronLeft, ChevronRight, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore, useUIStore } from "@/lib/store";
import { toast } from "sonner";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { href: "/insights", icon: Lightbulb, label: "AI Insights" },
  { href: "/budgets", icon: PiggyBank, label: "Budgets" },
  { href: "/chat", icon: MessageCircle, label: "FinBot Chat" },
  { href: "/upload", icon: Upload, label: "Upload" },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  const handleLogout = () => {
    logout();
    toast.info("Signed out successfully");
    router.push("/auth/login");
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarOpen ? 240 : 72 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="relative flex flex-col h-screen bg-card border-r border-border z-40 overflow-hidden shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <p className="font-bold text-sm leading-none">SpendSmart</p>
              <p className="text-xs text-muted-foreground mt-0.5">AI Finance</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-14 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-accent transition-colors z-50"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group cursor-pointer",
                  active
                    ? "bg-violet-500/15 text-violet-400 border border-violet-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", active && "text-violet-400")} />
                <AnimatePresence>
                  {sidebarOpen && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-sm font-medium truncate"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {active && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute right-3 w-1.5 h-4 rounded-full bg-violet-500"
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border p-3 space-y-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all text-sm"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Sign Out
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {sidebarOpen && user && (
          <div className="flex items-center gap-3 px-3 py-2 mt-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.full_name.charAt(0)}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}

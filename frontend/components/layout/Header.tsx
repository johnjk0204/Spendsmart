"use client";
import { Moon, Sun, Bell, Search } from "lucide-react";
import { useTheme } from "next-themes";
import { useAuthStore } from "@/lib/store";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { user } = useAuthStore();

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="text-xl font-bold">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl bg-muted text-sm text-muted-foreground">
          <Search className="w-4 h-4" />
          <span>Search...</span>
          <kbd className="hidden lg:inline-flex text-xs bg-background px-1.5 rounded border border-border">⌘K</kbd>
        </div>

        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-xl hover:bg-accent flex items-center justify-center transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-500 rounded-full"></span>
        </button>

        {/* Dark mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-9 h-9 rounded-xl hover:bg-accent flex items-center justify-center transition-colors"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
        </button>

        {/* Avatar */}
        {user && (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-sm font-bold cursor-pointer">
            {user.full_name.charAt(0)}
          </div>
        )}
      </div>
    </header>
  );
}

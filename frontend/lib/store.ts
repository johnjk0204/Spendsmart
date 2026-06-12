import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  full_name: string;
  currency: string;
  monthly_income?: number;
  savings_goal?: number;
  health_score: number;
  savings_streak: number;
  xp_points: number;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => {
        localStorage.setItem("access_token", token);
        set({ user, token });
      },
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        set({ user: null, token: null });
      },
      updateUser: (updates) =>
        set((state) => ({ user: state.user ? { ...state.user, ...updates } : null })),
    }),
    { name: "auth-storage", partialize: (state) => ({ user: state.user, token: state.token }) }
  )
);

interface UIStore {
  sidebarOpen: boolean;
  darkMode: boolean;
  toggleSidebar: () => void;
  toggleDark: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  darkMode: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  toggleDark: () => set((s) => ({ darkMode: !s.darkMode })),
}));

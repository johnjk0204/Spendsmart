import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; full_name: string; password: string; monthly_income?: number }) =>
    api.post("/api/auth/register", data),
  login: (email: string, password: string) =>
    api.post("/api/auth/login", { email, password }),
  me: () => api.get("/api/auth/me"),
  update: (data: object) => api.put("/api/auth/me", data),
};

// ── Transactions ──────────────────────────────────────
export const transactionsApi = {
  list: (params?: object) => api.get("/api/transactions", { params }),
  create: (data: object) => api.post("/api/transactions", data),
  update: (id: string, data: object) => api.put(`/api/transactions/${id}`, data),
  delete: (id: string) => api.delete(`/api/transactions/${id}`),
  stats: (params?: object) => api.get("/api/transactions/stats", { params }),
  categories: (params?: object) => api.get("/api/transactions/categories", { params }),
  trends: (days: number = 30) => api.get("/api/transactions/trends", { params: { days } }),
  monthlyComparison: (months: number = 6) =>
    api.get("/api/transactions/monthly-comparison", { params: { months } }),
};

// ── Budgets ───────────────────────────────────────────
export const budgetsApi = {
  list: () => api.get("/api/budgets"),
  create: (data: object) => api.post("/api/budgets", data),
  update: (id: string, data: object) => api.put(`/api/budgets/${id}`, data),
  delete: (id: string) => api.delete(`/api/budgets/${id}`),
};

// ── Insights ──────────────────────────────────────────
export const insightsApi = {
  list: (unreadOnly?: boolean) =>
    api.get("/api/insights", { params: { unread_only: unreadOnly } }),
  markRead: (id: string) => api.post(`/api/insights/${id}/read`),
  dismiss: (id: string) => api.post(`/api/insights/${id}/dismiss`),
  healthScore: (params?: object) => api.get("/api/insights/health-score", { params }),
  generate: () => api.post("/api/insights/generate"),
  badges: () => api.get("/api/insights/badges"),
};

// ── Upload ────────────────────────────────────────────
export const uploadApi = {
  file: (formData: FormData) =>
    api.post("/api/upload/file", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  analyzeText: (text: string) => api.post("/api/upload/analyze-text", { text }),
};

// ── Upload History ────────────────────────────────────
export const uploadsHistoryApi = {
  list: () => api.get("/api/uploads"),
  delete: (id: string) => api.delete(`/api/uploads/${id}`),
};

// ── Chat ──────────────────────────────────────────────
export const chatApi = {
  send: (message: string, history: object[]) =>
    api.post("/api/chat", { message, history }),
  quickInsights: () => api.post("/api/chat/quick-insights"),
};

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    monthly_income: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authApi.register({
        ...form,
        monthly_income: form.monthly_income ? parseFloat(form.monthly_income) : undefined,
      });
      setAuth(data.user, data.access_token);
      toast.success(`Welcome to SpendSmart AI, ${data.user.full_name}!`);
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || "Registration failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const update = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-violet-950 to-slate-950 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create your account</h1>
          <p className="text-slate-400 mt-2">Start your journey to financial freedom</p>
        </div>

        <div className="glass rounded-2xl p-8 border border-white/10">
          <form onSubmit={handleSubmit} className="space-y-5">
            {[
              { key: "full_name", label: "Full Name", type: "text", placeholder: "John Doe" },
              { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              { key: "password", label: "Password", type: "password", placeholder: "Min 8 characters" },
              { key: "monthly_income", label: "Monthly Income (₹)", type: "number", placeholder: "50000 (optional)" },
            ].map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-slate-300 mb-2">{field.label}</label>
                <input
                  type={field.type}
                  value={form[field.key as keyof typeof form]}
                  onChange={update(field.key)}
                  placeholder={field.placeholder}
                  required={field.key !== "monthly_income"}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-violet-400 hover:text-violet-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

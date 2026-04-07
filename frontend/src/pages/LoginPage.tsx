/**
 * Login page — handles both login and register in one form.
 * Toggling between modes avoids a separate /register route and keeps the flow simple.
 */

import { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "register") {
        await apiClient.post("/auth/register", { email, password });
      }

      const { data } = await apiClient.post("/auth/login", { email, password });
      login(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      const axiosErr = err as AxiosError<{ error: string }>;
      setError(axiosErr.response?.data?.error ?? "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary px-4" style={{
      backgroundImage: "radial-gradient(circle at 50% 0%, rgba(34,211,238,0.04) 0%, transparent 60%)",
    }}>
      <div className="w-full max-w-md">

        {/* Branding */}
        <div className="text-center mb-8">
          {/* Shield icon */}
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/50 border border-cyan-900/50 flex items-center justify-center">
              <svg className="w-6 h-6 text-accent-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Log<span className="text-accent-cyan">Sentinel</span>
          </h1>
          <p className="text-text-muted mt-1.5 text-sm">ZScaler Web Proxy Log Analysis</p>
        </div>

        {/* Card */}
        <div className="bg-bg-surface border border-slate-700/80 rounded-2xl p-8 shadow-xl shadow-black/30">
          <h2 className="text-sm font-medium text-text-muted mb-6 uppercase tracking-wider">
            {mode === "login" ? "Sign in" : "Create account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@company.com"
                className="w-full bg-bg-primary border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-slate-600 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1.5 font-medium">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-bg-primary border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-text-primary placeholder-slate-600 focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20 transition-all"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 text-accent-red text-sm bg-red-950/30 border border-red-900/40 rounded-lg px-3 py-2.5">
                <span className="mt-0.5 shrink-0">✕</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent-cyan text-bg-primary font-semibold text-sm rounded-lg py-2.5 hover:bg-cyan-300 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-700/60 text-center">
            <p className="text-sm text-text-muted">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }}
                className="text-accent-cyan hover:text-cyan-300 transition-colors font-medium"
              >
                {mode === "login" ? "Register" : "Sign in"}
              </button>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

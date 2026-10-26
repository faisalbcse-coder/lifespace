"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Registration failed");
      }

      // Smooth liquid success transition
      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 600);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Liquid Card Container */}
      <div className="w-full max-w-[420px] p-6 sm:p-10 rounded-2xl sm:rounded-[30px] bg-white/[0.08] dark:bg-white/[0.07] border border-white/20 backdrop-blur-[25px] shadow-[0_30px_80px_rgba(0,0,0,0.45),inset_0_0_30px_rgba(255,255,255,0.04)] relative overflow-hidden transition-all duration-500">
        {/* Soft Ambient Light Glow in top-right */}
        <div className="absolute -top-24 -right-20 w-48 h-48 rounded-full bg-[#00eaff]/20 blur-[75px] pointer-events-none" />

        {!isSuccess ? (
          <div>
            {/* Floating Logo */}
            <div className="flex justify-center mb-4">
              <BrandLogo size="lg" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-900 dark:text-white tracking-tight">
              Create Account
            </h2>
            <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
              Start your productivity journey with Lifespace
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 dark:text-rose-400 font-medium text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 pl-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Faisal Islam"
                  className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/[0.06] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-[#00eaff] focus:ring-2 focus:ring-[#00eaff]/30 transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 pl-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/[0.06] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-[#00eaff] focus:ring-2 focus:ring-[#00eaff]/30 transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5 pl-1">
                  Password (min 8 characters) *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 px-4 rounded-xl border border-slate-300 dark:border-white/20 bg-white/50 dark:bg-white/[0.06] text-slate-900 dark:text-white text-sm focus:outline-hidden focus:border-[#00eaff] focus:ring-2 focus:ring-[#00eaff]/30 transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-xs"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl liquid-btn tracking-wider font-semibold text-sm active:scale-98 transition disabled:opacity-50 mt-2"
              >
                <span>{loading ? "CREATING..." : "CREATE ACCOUNT"}</span>
              </button>
            </form>

            <div className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#00eaff] hover:underline font-semibold"
              >
                Login
              </Link>
            </div>
          </div>
        ) : (
          /* Animated Liquid Success Screen */
          <div className="success-screen py-4">
            <div className="success-icon mb-4">
              <div className="check" />
            </div>
            <h2 className="text-2xl font-bold text-[#00ffaa] tracking-tight">
              Account Created!
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xs">
              Welcome to Lifespace! Preparing your workspace...
            </p>
            <div className="loading-dots">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

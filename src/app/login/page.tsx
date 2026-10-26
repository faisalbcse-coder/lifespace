"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { LiquidDroplets } from "@/components/ui/LiquidDroplets";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  // Liquid Slosh state
  const [isSloshing, setIsSloshing] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const triggerLiquidSlosh = (e?: React.MouseEvent<HTMLButtonElement>) => {
    setIsSloshing(false);
    requestAnimationFrame(() => {
      setIsSloshing(true);
    });
    setTimeout(() => {
      setIsSloshing(false);
    }, 850);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerLiquidSlosh();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Login failed");
      }

      setIsSuccess(true);
      setTimeout(() => {
        window.location.href = "/dashboard";
      }, 600);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Invalid email or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden neumorph-canvas">
      {/* ───────────── Slow-Flowing Soft Neumorphic Water Droplets ───────────── */}
      <LiquidDroplets targetRef={cardRef} count={6} variant="neumorph" />

      {/* ───────────── Main Circular Embossed Neumorphic Card ───────────── */}
      <div className="relative w-full max-w-[480px] flex items-center justify-center z-20">
        <div
          ref={cardRef}
          className="aspect-square w-full rounded-full neumorph-card flex flex-col items-center justify-center p-6 sm:p-12 relative select-none"
        >
          {!isSuccess ? (
            <div className="w-full max-w-[320px] flex flex-col items-center">
              {/* Soft Embossed Logo Pod */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-3 shadow-[6px_6px_14px_#6b7d97,-6px_-6px_14px_#ffffff,2px_2px_5px_#52637b,-2px_-2px_5px_#ffffff] bg-gradient-to-br from-[#e8edf5] to-[#d8dfe9] p-1.5 transition-transform hover:scale-105 duration-200">
                <BrandLogo size="md" />
              </div>

              {/* Title exactly inspired by reference image */}
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-[#334155] uppercase text-center mb-1">
                SIGN IN
              </h1>
              <p className="text-xs text-[#94a3b8] text-center mb-6 font-medium">
                (Use your email & password to sign in)
              </p>

              {errorMsg && (
                <div className="w-full mb-4 p-2.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium text-center shadow-inner">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full space-y-4">
                {/* Concave Inset Username/Email Field */}
                <div>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Username / Email"
                    className="neumorph-input"
                  />
                </div>

                {/* Concave Inset Password Field */}
                <div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="neumorph-input"
                  />
                </div>

                {/* Auxiliary row: Remember me & Forgot Password */}
                <div className="flex items-center justify-between text-xs text-[#64748b] px-3 font-medium">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded accent-[#2563eb] cursor-pointer"
                    />
                    <span>Remember me</span>
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-[#2563eb] hover:underline font-semibold"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Convex Raised Neumorphic Button with Water Slosh */}
                <div className="pt-2">
                  <button
                    ref={buttonRef}
                    type="submit"
                    disabled={loading}
                    onMouseDown={(e) => triggerLiquidSlosh(e)}
                    className={`neumorph-btn flex items-center justify-center ${
                      isSloshing ? "is-sloshing" : ""
                    }`}
                  >
                    <span>{loading ? "Logging in..." : "Login"}</span>
                  </button>
                </div>
              </form>

              {/* Create Account Link */}
              <div className="text-center text-xs text-[#64748b] mt-4 font-medium">
                Don&apos;t have an account?{" "}
                <Link
                  href="/register"
                  className="text-[#2563eb] hover:underline font-bold"
                >
                  Create Account
                </Link>
              </div>
            </div>
          ) : (
            /* Neumorphic Success Pod */
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-[inset_5px_5px_10px_#6b7d97,inset_-5px_-5px_10px_#ffffff,inset_2px_2px_4px_#52637b,-2px_-2px_4px_#ffffff] text-emerald-500 font-bold text-2xl">
                ✓
              </div>
              <h2 className="text-2xl font-bold text-[#334155] tracking-tight">
                Login Successful!
              </h2>
              <p className="text-xs text-[#64748b] mt-2 max-w-xs">
                Welcome back! Loading your workspace...
              </p>
              <div className="loading-dots mt-4 flex justify-center gap-1.5">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ───────────── Bottom Soft Version Badge ───────────── */}
      <div className="mt-8 z-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-br from-[#e8edf5] to-[#d8dfe9] shadow-[5px_5px_14px_#6b7d97,-5px_-5px_14px_#ffffff,2px_2px_5px_#52637b,-2px_-2px_5px_#ffffff] text-[11px] font-bold text-[#64748b] tracking-wider select-none transition-transform hover:scale-105">
          <span className="w-2 h-2 rounded-full bg-[#2563eb]" />
          <span>Lifespace</span>
          <span className="text-[#94a3b8]">• v1.0.0.2</span>
        </div>
      </div>
    </div>
  );
}

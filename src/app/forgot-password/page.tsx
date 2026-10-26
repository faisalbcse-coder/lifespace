"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process request");
      }

      setIsSubmitted(true);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 relative overflow-hidden">
      {/* Ambient Canvas Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-gradient-to-tr from-sky-400/20 via-indigo-400/20 to-purple-400/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[350px] bg-sky-300/15 rounded-full blur-[100px]" />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-[440px] p-6 sm:p-10 rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-slate-900/10 relative z-10 transition-all">
        {/* Floating Brand Logo */}
        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white shadow-md shadow-slate-900/5 border border-slate-100 p-2">
            <BrandLogo size="md" animate={true} />
          </div>
        </div>

        {!isSubmitted ? (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
                Forgot Password
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Enter your registered email address and we&apos;ll send you a secure link to reset your password.
              </p>
            </div>

            {errorMsg && (
              <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs sm:text-sm text-slate-900 transition"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-400 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Sending link...</span>
                    </>
                  ) : (
                    <span>Send Reset Link</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">
              Check Your Inbox
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
              If an account exists for <strong className="text-slate-900 font-semibold">{email}</strong>, we have sent an email with instructions to reset your password.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 text-left space-y-1 mb-6">
              <p className="font-semibold text-slate-700">Didn&apos;t receive the email?</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Check your Spam or Junk folder</li>
                <li>Wait 1-2 minutes for the delivery</li>
                <li>Verify you entered the correct email address</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSubmitted(false);
                setErrorMsg("");
              }}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
            >
              Try another email address
            </button>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Database, ArrowRight } from "lucide-react";
import { LandingHeader, Lang } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function PrivacyPage() {
  const [lang, setLang] = useState<Lang>("en");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.remove("dark");
      const savedLang = localStorage.getItem("lifespace_lang") as Lang | null;
      if (savedLang === "bn" || savedLang === "en") {
        setLang(savedLang);
      }
      fetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && data?.data?.user) {
            setIsAuthenticated(true);
          }
        })
        .catch(() => {});
    }
  }, []);

  const toggleLanguage = () => {
    const next = lang === "en" ? "bn" : "en";
    setLang(next);
    if (typeof window !== "undefined") {
      localStorage.setItem("lifespace_lang", next);
    }
  };

  const isBn = lang === "bn";
  const headingFont = isBn ? "font-heading-bn" : "font-sans-en";
  const bodyFont = isBn ? "font-body-bn" : "font-sans-en";

  return (
    <div className="min-h-screen text-slate-900 bg-slate-50 selection:bg-indigo-500 selection:text-white antialiased relative overflow-x-hidden pt-20">
      {/* ──────────────── Vibrant Ambient Canvas ──────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-sky-400/25 via-indigo-400/20 to-purple-400/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-20 w-[500px] h-[450px] bg-sky-300/15 rounded-full blur-[130px]" />
        <div className="absolute top-2/3 -right-20 w-[550px] h-[500px] bg-indigo-300/20 rounded-full blur-[140px]" />
      </div>

      <LandingHeader
        currentPath="/"
        lang={lang}
        onToggleLang={toggleLanguage}
        isAuthenticated={isAuthenticated}
      />

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-emerald-200/90 text-emerald-950 text-xs font-semibold mb-3 shadow-xs backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className={headingFont}>{isBn ? "প্রাইভেসি ও ডাটা পলিসি" : "Privacy Policy"}</span>
          </div>
          <h1 className={`text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 ${headingFont}`}>
            {isBn ? (
              <>
                <span>আপনার তথ্যের পূর্ণ নিরাপত্তা ও</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  গোপনীয়তা
                </span>
              </>
            ) : (
              <>
                <span>Privacy &</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  Data Sovereignty
                </span>
              </>
            )}
          </h1>
          <p className={`text-xs sm:text-sm text-slate-600 ${bodyFont}`}>
            {isBn
              ? "লাইফস্পেস আপনার ব্যক্তিগত জীবনের লক্ষ্য এবং কাজের গোপনীয়তাকে সর্বোচ্চ অগ্রাধিকার দেয়।"
              : "LifeSpace is built on verified, privacy-first principles to keep your personal goals safe."}
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className={`text-base font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "১. কোনো থার্ড-পার্টি বিজ্ঞাপন বা ট্র্যাকিং নেই" : "1. Zero Third-Party Advertising or Tracking"}
              </h2>
            </div>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "লাইফস্পেস কোনো বাণিজ্যিক বিজ্ঞাপন নেটওয়ার্ক, ট্র্যাকিং পিক্সেল বা ব্যবহারকারীর আচরণ নজরদারি করার স্ক্রিপ্ট চালায় না। আপনার ব্রাউজিং ডেটা এবং ব্যক্তিগত লক্ষ্য কারো কাছে বিক্রি বা শেয়ার করা হয় না।"
                : "LifeSpace operates without commercial advertising networks, tracking pixels, or invasive behavioral cookies. Your goals and personal tasks are never sold, monetized, or shared with third parties."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Database className="w-5 h-5" />
              </div>
              <h2 className={`text-base font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "২. সম্পূর্ণ ডাটা মালিকানা ও ১-ক্লিক ব্যাকআপ" : "2. Complete Data Ownership & 1-Click Backup"}
              </h2>
            </div>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "আপনার সমস্ত সেকশন, গোল, টার্গেট এবং টাস্কের ডাটা আপনি যেকোনো সময় ১-ক্লিকে সম্পূর্ণ SQLite ডাটাবেজ ব্যাকআপ ফাইল হিসেবে ডাউনলোড করে সংরক্ষণ করতে পারেন।"
                : "You retain full ownership of your workspace. At any time, you can export a complete, atomic SQLite backup file and restore your workspace whenever needed."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className={`text-base font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "৩. নিরাপদ অ্যাকাউন্ট ও সল্টেড পাসওয়ার্ড সুরক্ষা" : "3. Salted Password Security & Session Safety"}
              </h2>
            </div>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "আপনার পাসওয়ার্ড আধুনিক সল্টেড bcrypt হ্যাশিং দ্বারা সুরক্ষিত থাকে। সেশন ট্র্যাকিং নিরাপদ HTTP-only কুকির মাধ্যমে পরিচালিত হয়।"
                : "Authentication credentials are guarded using salted bcrypt hashing (12 rounds) and secure HTTP-only session tokens to prevent unauthorized access."}
            </p>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-sky-700 hover:text-slate-950 transition ${headingFont}`}
          >
            <span>{isBn ? "হোম পেজে ফিরে যান" : "Return to Homepage"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}

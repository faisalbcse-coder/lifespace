"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  ShieldCheck,
  Zap,
  Smartphone,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  Compass,
  Lock,
} from "lucide-react";
import { LandingHeader, Lang } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function WhyLifeSpacePage() {
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
        currentPath="/why-lifespace"
        lang={lang}
        onToggleLang={toggleLanguage}
        isAuthenticated={isAuthenticated}
      />

      <main className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 py-10 sm:py-20">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-indigo-200/90 text-indigo-950 text-xs font-semibold mb-4 shadow-xs backdrop-blur-md">
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span className={headingFont}>{isBn ? "লাইফস্পেস দর্শন" : "LifeSpace Philosophy"}</span>
          </div>

          <h1 className={`text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 ${headingFont}`}>
            {isBn ? (
              <>
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  কেন তৈরি করা হলো
                </span>{" "}
                <span>লাইফস্পেস?</span>
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  Why We Built
                </span>{" "}
                <span>LifeSpace</span>
              </>
            )}
          </h1>

          <p className={`text-xs sm:text-base text-slate-600 leading-relaxed ${bodyFont}`}>
            {isBn
              ? "সাধারণ টু-ডু অ্যাপগুলো কাজের পাহাড় জমায় কিন্তু বড় উদ্দেশ্যের সাথে সেগুলোকে মেলাতে পারে না। লাইফস্পেস জীবনের প্রধান ক্ষেত্রগুলো থেকে শুরু করে প্রতিদিনের সময়সূচি পর্যন্ত একটি সুস্পষ্ট সংযোগ তৈরি করে।"
              : "Most productivity apps collect endless detached tasks. LifeSpace enforces a strict single-direction cascade from high-level life vision to daily calendar execution."}
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 mb-12 sm:mb-16">
          {/* Pillar 1: Indigo */}
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-indigo-200/80 hover:border-indigo-400 shadow-xs hover:shadow-md transition space-y-3 sm:space-y-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-indigo-50 border border-indigo-200/60 text-indigo-600 flex items-center justify-center font-bold">
              <Layers className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h2 className={`text-base sm:text-xl font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "১. সুনির্দিষ্ট প্রবাহ ও হায়ারার্কি" : "1. Strict Cascade Hierarchy"}
            </h2>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "সেকশন → গোল → টার্গেট → টাস্ক → দৈনিক শিডিউল। প্রতিটি কাজ কোন বড় লক্ষ্যের অংশ তা সবসময় স্পষ্ট থাকে। কোনো বিক্ষিপ্ত কাজ আপনার সময় নষ্ট করতে পারে না।"
                : "Sections → Goals → Targets → Tasks → Daily Schedule. Every single daily task links upward to a concrete life ambition."}
            </p>
          </div>

          {/* Pillar 2: Sky */}
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-sky-200/80 hover:border-sky-400 shadow-xs hover:shadow-md transition space-y-3 sm:space-y-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-sky-50 border border-sky-200/60 text-sky-600 flex items-center justify-center font-bold">
              <Smartphone className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h2 className={`text-base sm:text-xl font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "২. মোবাইল ও ডেস্কটপ অ্যাপ (আসন্ন)" : "2. Native Mobile & Desktop Apps"}
            </h2>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "কোনো ব্রাউজারের ট্যাব বা বাড়তি ঝামেলা ছাড়া সরাসরি মোবাইল ও ডেস্কটপে ফুলস্ক্রিন অ্যাপ্লিকেশনের উন্নয়ন চলছে।"
                : "Dedicated native apps for Android and Desktop (Windows & macOS) are currently in active development for pure fullscreen focus."}
            </p>
          </div>

          {/* Pillar 3: Purple */}
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-purple-200/80 hover:border-purple-400 shadow-xs hover:shadow-md transition space-y-3 sm:space-y-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h2 className={`text-base sm:text-xl font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "৩. শতভাগ তথ্য মালিকানা ও নিরাপত্তা" : "3. 100% Data Privacy & Control"}
            </h2>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "কোনো বিজ্ঞাপন নেই, আপনার ডাটা কারো কাছে বিক্রি করা হয় না। ১-ক্লিকে যেকোনো সময় আপনার পূর্ণাঙ্গ ডাটাবেজ ব্যাকআপ ও রিস্টোর করার সুবিধা রয়েছে।"
                : "Zero tracking, zero ad cookies. Full local database export and 1-click restore whenever you need."}
            </p>
          </div>

          {/* Pillar 4: Emerald */}
          <div className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border border-emerald-200/80 hover:border-emerald-400 shadow-xs hover:shadow-md transition space-y-3 sm:space-y-4">
            <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-2xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-5 sm:w-6 h-5 sm:h-6" />
            </div>
            <h2 className={`text-base sm:text-xl font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "৪. জটিলতামুক্ত শান্ত পরিবেশ" : "4. Distraction-Free Calm"}
            </h2>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "কোনো অপ্রয়োজনীয় পপ-আপ, নোটিফিকেশনের বন্যা বা সামাজিক ফিড নেই। শান্ত রঙের আধুনিক ইন্টারফেসে কেবল নিজের লক্ষ্য অর্জনই আসল কথা।"
                : "No endless notification spam or noisy feeds. A clean, calm design engineered for sustained deep work."}
            </p>
          </div>
        </div>

        {/* Comparison Table: Traditional To-Do vs LifeSpace */}
        <div className="rounded-2xl sm:rounded-3xl p-4 sm:p-10 bg-white border border-slate-200/90 shadow-sm mb-12 sm:mb-16 overflow-hidden">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className={`text-lg sm:text-2xl font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "সাধারণ টু-ডু অ্যাপ বনাম লাইফস্পেস" : "Traditional To-Do Apps vs. LifeSpace"}
            </h3>
          </div>

          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full min-w-[520px] text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  <th className="pb-3 px-3">বিষয় (Criteria)</th>
                  <th className="pb-3 px-3 text-slate-400">সাধারণ টু-ডু অ্যাপ</th>
                  <th className="pb-3 px-3 text-indigo-700 font-bold">LifeSpace</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 text-slate-700 ${bodyFont}`}>
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">কাজের কাঠামো (Structure)</td>
                  <td className="py-3 px-3 text-slate-500">বিক্ষিপ্ত কাজের তালিকা (Disjointed lists)</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>৫-স্তরের সুনির্দিষ্ট হায়ারার্কি</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">বড় স্বপ্নের সাথে সংযোগ</td>
                  <td className="py-3 px-3 text-slate-500">নেই বললেই চলে (None)</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>সেকশন ও গোলের সাথে স্বয়ংক্রিয় লিঙ্ক</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">দৈনিক সময়সূচি (Daily Schedule)</td>
                  <td className="py-3 px-3 text-slate-500">ম্যানুয়ালি কপি-পেস্ট করতে হয়</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>নির্ধারিত তারিখ অনুযায়ী অটোমেটিক একত্র হয়</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">মোবাইল ও ডেস্কটপ অ্যাপ</td>
                  <td className="py-3 px-3 text-slate-500">ভারী অ্যাপ বা ব্রাউজারের ভেতর আটকে থাকে</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>নেটিভ অ্যাপ (উন্নয়ন চলমান)</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 font-semibold text-slate-900">বিজ্ঞাপন ও বিভ্রান্তি</td>
                  <td className="py-3 px-3 text-slate-500">বিজ্ঞাপন ও ট্র্যাকারযুক্ত</td>
                  <td className="py-3 px-3 font-semibold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>১০০% শান্ত ও বিজ্ঞাপনহীন</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Box */}
        <div className="rounded-3xl p-8 sm:p-12 bg-white border border-indigo-100/90 text-center space-y-4 shadow-xl shadow-indigo-950/5 ring-1 ring-slate-100">
          <h3 className={`text-2xl sm:text-3xl font-bold text-slate-900 ${headingFont}`}>
            {isBn ? "আজই আপনার জীবন সুশৃঙ্খল করুন" : "Bring Calm & Focus to Your Life Today"}
          </h3>
          <p className={`text-xs sm:text-sm text-slate-600 max-w-lg mx-auto ${bodyFont}`}>
            {isBn
              ? "কোনো ক্রেডিট কার্ড ছাড়াই সম্পূর্ণ বিনামূল্যে আজই আপনার অ্যাকাউন্ট খুলুন।"
              : "No credit card required. Start organizing your life completely free today."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-400 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition active:scale-95 cursor-pointer ring-1 ring-white/20 ${headingFont}`}
            >
              <span>{isAuthenticated ? (isBn ? "ড্যাশবোর্ডে প্রবেশ করুন" : "Open Workspace") : (isBn ? "বিনামূল্যে শুরু করুন" : "Get Started Free")}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
            <Link
              href="/download"
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 text-slate-900 font-bold text-sm shadow-xs transition ${headingFont}`}
            >
              <span>{isBn ? "অ্যাপস (শীঘ্রই আসছে)" : "Apps (Coming Soon)"}</span>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}

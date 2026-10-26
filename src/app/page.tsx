"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Download,
  Target,
  Sparkles,
  Calendar,
  CheckCircle2,
  Circle,
  GripVertical,
  Layers,
} from "lucide-react";
import { LandingHeader, Lang } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function LifeSpaceHomePage() {
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

      {/* ──────────────── Fixed Edge-to-Edge Header ──────────────── */}
      <LandingHeader
        currentPath="/"
        lang={lang}
        onToggleLang={toggleLanguage}
        isAuthenticated={isAuthenticated}
      />

      <main className="relative z-10">
        {/* ──────────────── 1. Essential Hero Section ──────────────── */}
        <section className="pt-10 sm:pt-16 pb-12 sm:pb-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            {/* Top Category Badge */}
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-indigo-200/90 text-indigo-950 text-xs font-semibold shadow-xs backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className={headingFont}>
                  {isBn ? "সুশৃঙ্খল লক্ষ্য ও দৈনিক কাজের প্ল্যাটফর্ম" : "Structured Goal & Task Operating System"}
                </span>
              </span>
            </div>

            {/* Clear Product Headline with Vibrant Gradient */}
            <h1 className={`text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.2] sm:leading-[1.15] ${headingFont}`}>
              {isBn ? (
                <>
                  <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                    আপনার লক্ষ্যগুলোকে
                  </span>{" "}
                  <span className="text-slate-950">রূপ দিন প্রতিদিনের কাজে।</span>
                </>
              ) : (
                <>
                  <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                    Turn Your Goals
                  </span>{" "}
                  <span className="text-slate-950">Into Daily Action.</span>
                </>
              )}
            </h1>

            {/* Supporting Quote by User */}
            <p className={`text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto italic ${bodyFont}`}>
              {isBn
                ? "“হিমালয় ছোঁয়ার স্বপ্নও শুরু হয় প্রতিদিনের একটি করে ছোট পদক্ষেপের মাধ্যমে।”"
                : "“Even the dream of touching the Himalayas begins with a single small step every day.”"}
            </p>

            {/* Two Primary Action Buttons: Get Started Free & Explore Features */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-400 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-sm sm:text-base shadow-xl shadow-indigo-600/25 hover:shadow-indigo-600/35 transition active:scale-95 cursor-pointer ring-1 ring-white/20 ${headingFont}`}
              >
                <span>
                  {isAuthenticated
                    ? isBn
                      ? "ড্যাশবোর্ডে প্রবেশ করুন"
                      : "Open Workspace"
                    : isBn
                    ? "বিনামূল্যে শুরু করুন"
                    : "Get Started Free"}
                </span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>

              <Link
                href="/how-it-works"
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-2xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 text-slate-900 font-bold text-sm sm:text-base shadow-xs transition active:scale-95 ${headingFont}`}
              >
                <span>{isBn ? "ফিচারসমূহ দেখুন" : "Explore Features"}</span>
              </Link>
            </div>

            {/* ──────────────── 2. Compact Product Preview ──────────────── */}
            <div className="pt-6 sm:pt-8 max-w-3xl mx-auto">
              <div className="rounded-3xl bg-white border border-slate-200/90 shadow-2xl shadow-indigo-950/10 overflow-hidden backdrop-blur-xl text-left ring-1 ring-slate-100">
                {/* Window Chrome Header */}
                <div className="px-4 py-3 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                      <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    </div>
                    <span className={`text-xs text-slate-300 font-medium ml-2 hidden sm:inline ${bodyFont}`}>
                      {isBn
                        ? "লাইফস্পেস ওয়ার্কস্পেস • সেকশন → গোল → টার্গেট → টাস্ক"
                        : "LifeSpace Workspace • Section → Goal → Target → Task"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{isBn ? "সক্রিয় ওয়ার্কস্পেস" : "Active Workspace"}</span>
                    </span>
                  </div>
                </div>

                {/* Dashboard Interior: Section → Goal → Target → Task */}
                <div className="p-4 sm:p-5 bg-slate-50/80 space-y-3.5">
                  {/* Tier 1: Section Card (Indigo Brand Identity) */}
                  <div className="rounded-2xl bg-white border border-indigo-200/90 border-l-4 border-l-indigo-600 shadow-xs p-3.5 sm:p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md text-indigo-400 bg-indigo-50">
                          <GripVertical className="w-3.5 h-3.5" />
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shadow-[0_0_8px_#6366f1]" />
                        <h3 className={`text-xs sm:text-sm font-bold text-slate-900 ${headingFont}`}>
                          {isBn ? "০১ • স্বাস্থ্য ও ফিটনেস" : "01 • Health & Fitness"}
                        </h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          {isBn ? "সেকশন" : "Section"}
                        </span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {isBn ? "১টি লক্ষ্য" : "1 Goal"}
                      </span>
                    </div>

                    {/* Tier 2: Goal Card (Sky/Cyan Identity) */}
                    <div className="rounded-xl bg-sky-50/40 border border-sky-200/90 border-l-4 border-l-sky-500 p-3 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-sky-600 shrink-0" />
                          <span className={`text-xs sm:text-sm font-bold text-slate-900 ${headingFont}`}>
                            {isBn ? "হাফ ম্যারাথন সম্পন্ন করা" : "Run a Half Marathon (21.1 km)"}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                            {isBn ? "গোল" : "Goal"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={bodyFont}>{isBn ? "১ অক্টো – ৩১ ডিসে" : "Oct 01 – Dec 31"}</span>
                          <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 font-bold text-[10px]">
                            {isBn ? "৬৫% সম্পন্ন" : "65% Progress"}
                          </span>
                        </div>
                      </div>

                      {/* Goal Progress Bar */}
                      <div className="w-full bg-sky-100 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 h-1.5 rounded-full w-[65%]" />
                      </div>

                      {/* Tier 3: Target Card (Amber/Gold Identity) */}
                      <div className="mt-2 rounded-lg bg-white border border-amber-200/90 border-l-4 border-l-amber-500 p-2.5 sm:p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              {isBn ? "টার্গেট" : "Target"}
                            </span>
                            <span className={`text-xs font-bold text-slate-900 ${headingFont}`}>
                              {isBn ? "সাপ্তাহিক ১৫ কিমি রানিং রুটিন তৈরি" : "Build Consistent 15km Weekly Routine"}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">
                            {isBn ? "৪টি কাজ" : "4 Tasks"}
                          </span>
                        </div>

                        {/* Tier 4: Action Tasks (Emerald Green Identity) */}
                        <div className="space-y-1.5 pt-0.5">
                          {/* Task 1: Completed */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/80 border border-emerald-200/80 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className={`font-medium text-slate-800 line-through truncate text-[11px] sm:text-xs ${bodyFont}`}>
                                {isBn ? "আজকের ৫ কিমি সকালের দৌড়" : "Morning 5km Aerobic Pace Run"}
                              </span>
                            </div>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-800 font-bold text-[10px] shrink-0">
                              {isBn ? "টাস্ক সম্পন্ন" : "Task Done"}
                            </span>
                          </div>

                          {/* Task 2: Scheduled */}
                          <div className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 hover:border-emerald-200 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <Circle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className={`font-medium text-slate-800 truncate text-[11px] sm:text-xs ${bodyFont}`}>
                                {isBn ? "কোর মোবিলিটি ও স্ট্রেচিং সেশন" : "Core Mobility & Dynamic Stretching"}
                              </span>
                            </div>
                            <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] shrink-0">
                              {isBn ? "নির্ধারিত টাস্ক" : "Scheduled Task"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Discreet Link to Dedicated Exploration Pages */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500">
              <Link href="/why-lifespace" className="hover:text-slate-900 transition flex items-center gap-1">
                <span>{isBn ? "কেন লাইফস্পেস?" : "Why LifeSpace?"}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </Link>
              <span>•</span>
              <Link href="/pricing" className="hover:text-slate-900 transition flex items-center gap-1">
                <span>{isBn ? "প্রাইসিং পলিসি" : "Pricing Policy"}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </Link>
              <span>•</span>
              <Link href="/download" className="hover:text-slate-900 transition flex items-center gap-1">
                <span>{isBn ? "অ্যাপস (শীঘ্রই আসছে)" : "Apps (Coming Soon)"}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ──────────────── Minimal Shared Footer ──────────────── */}
      <LandingFooter lang={lang} />
    </div>
  );
}

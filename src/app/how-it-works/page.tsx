"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  Target,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  ChevronRight,
  Smartphone,
} from "lucide-react";
import { LandingHeader, Lang } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HowItWorksPage() {
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

  const steps = [
    {
      num: "০১",
      numEn: "01",
      titleBn: "জীবনের ক্ষেত্র (Sections)",
      titleEn: "Step 01: Life Areas (Sections)",
      subBn: "জীবনের মূল ক্ষেত্রগুলো সাজান",
      subEn: "Define Areas of Life",
      descBn: "প্রথমেই আপনার জীবনের বিভিন্ন ক্ষেত্র যেমন—ক্যারিয়ার, স্বাস্থ্য, পরিবার, কিংবা আত্মউন্নয়নকে আলাদা সেকশনে সাজিয়ে নিন।",
      descEn: "Organize the broad pillars of your life (e.g. Career, Health, Family, Personal Growth) into distinct workspaces.",
      badgeBn: "ভিত্তি",
      badgeEn: "Foundation",
      border: "border-indigo-200/90 hover:border-indigo-400",
      numBg: "bg-indigo-600 text-white shadow-indigo-600/20",
      badgeColor: "bg-indigo-50 text-indigo-700 border border-indigo-200",
      subColor: "text-indigo-600",
    },
    {
      num: "০২",
      numEn: "02",
      titleBn: "স্বপ্নছোঁয়া লক্ষ্য (Goals)",
      titleEn: "Step 02: Dream Goals",
      subBn: "অর্থবহ ও সুস্পষ্ট বড় লক্ষ্য",
      subEn: "Set Meaningful Ambitions",
      descBn: "প্রতিটি সেকশনের অধীনে নির্দিষ্ট ও উচ্চাকাঙ্ক্ষী লক্ষ্য ঠিক করুন। লক্ষ্যগুলো আপনাকে জানাবে ঠিক কোথায় পৌঁছাতে চান।",
      descEn: "Under each section, specify long-term outcomes and meaningful ambitions that define where you want to go.",
      badgeBn: "লক্ষ্য",
      badgeEn: "Vision",
      border: "border-sky-200/90 hover:border-sky-400",
      numBg: "bg-sky-500 text-white shadow-sky-500/20",
      badgeColor: "bg-sky-50 text-sky-700 border border-sky-200",
      subColor: "text-sky-600",
    },
    {
      num: "০৩",
      numEn: "03",
      titleBn: "লক্ষ্যমাত্রা (Targets)",
      titleEn: "Step 03: Targets",
      subBn: "পরিমাপযোগ্য মাইলফলক",
      subEn: "Break Into Milestones",
      descBn: "বড় লক্ষ্যকে সরাসরি বাস্তবায়ন করা কঠিন। তাই প্রতিটি লক্ষ্যকে ছোট ছোট পরিমাপযোগ্য টার্গেট বা মাইলফলকে ভাগ করুন।",
      descEn: "Deconstruct intimidating goals into concrete, measurable target milestones with clear target dates.",
      badgeBn: "মাইলফলক",
      badgeEn: "Milestones",
      border: "border-amber-200/90 hover:border-amber-400",
      numBg: "bg-amber-500 text-white shadow-amber-500/20",
      badgeColor: "bg-amber-50 text-amber-800 border border-amber-200",
      subColor: "text-amber-600",
    },
    {
      num: "০৪",
      numEn: "04",
      titleBn: "ছোট ছোট কাজ / দৈনিক কাজ (Tasks)",
      titleEn: "Step 04: Daily Action Tasks",
      subBn: "বাস্তবায়নযোগ্য পদক্ষেপ",
      subEn: "Actionable Daily Steps",
      descBn: "লক্ষ্যমাত্রার অধীনে প্রতিদিনের করণীয় সুনির্দিষ্ট ছোট ছোট কাজগুলো যোগ করুন এবং সময় ও তারিখ নির্ধারণ করে দিন।",
      descEn: "Add clear, executable steps under each target. Assign execution dates and priority levels.",
      badgeBn: "পদক্ষেপ",
      badgeEn: "Action",
      border: "border-emerald-200/90 hover:border-emerald-400",
      numBg: "bg-emerald-600 text-white shadow-emerald-600/20",
      badgeColor: "bg-emerald-50 text-emerald-800 border border-emerald-200",
      subColor: "text-emerald-600",
    },
    {
      num: "০৫",
      numEn: "05",
      titleBn: "সফলতা (Daily Execution & Success)",
      titleEn: "Step 05: Success & Fulfillment",
      subBn: "দৈনিক কাজের সমন্বয়ে সফলতা",
      subEn: "Daily Execution Leads to Success",
      descBn: "যে কাজটির তারিখ আজ, তা স্বয়ংক্রিয়ভাবে আজকের টাইমলাইনে প্রস্তুত থাকে। প্রতিদিনের এই ধারাবাহিক পদক্ষেপে অর্জিত হয় চূড়ান্ত সফলতা।",
      descEn: "Tasks roll directly into your central timeline. Daily disciplined completion guarantees real success.",
      badgeBn: "সফলতা",
      badgeEn: "Success",
      border: "border-indigo-300 hover:border-indigo-500",
      numBg: "bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 text-white shadow-indigo-600/25",
      badgeColor: "bg-indigo-50 text-indigo-800 border border-indigo-200",
      subColor: "text-indigo-600",
    },
  ];

  return (
    <div className="min-h-screen text-slate-900 bg-slate-50 selection:bg-indigo-500 selection:text-white antialiased relative overflow-x-hidden pt-20">
      {/* ──────────────── Vibrant Ambient Canvas ──────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-gradient-to-tr from-sky-400/25 via-indigo-400/20 to-purple-400/20 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 -left-20 w-[500px] h-[450px] bg-sky-300/15 rounded-full blur-[130px]" />
        <div className="absolute top-2/3 -right-20 w-[550px] h-[500px] bg-indigo-300/20 rounded-full blur-[140px]" />
      </div>

      <LandingHeader
        currentPath="/how-it-works"
        lang={lang}
        onToggleLang={toggleLanguage}
        isAuthenticated={isAuthenticated}
      />

      <main className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 py-10 sm:py-20">
        {/* Page Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-indigo-200/90 text-indigo-950 text-xs font-semibold mb-4 shadow-xs backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span className={headingFont}>{isBn ? "সহজ ৫ স্তরের সফলতার রূপরেখা" : "5-Tier Simple Cascade"}</span>
          </div>

          <h1 className={`text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 ${headingFont}`}>
            {isBn ? (
              <>
                <span>লাইফস্পেস</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  কীভাবে কাজ করে?
                </span>
              </>
            ) : (
              <>
                <span>How</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  LifeSpace Works
                </span>
              </>
            )}
          </h1>

          <p className={`text-xs sm:text-base text-slate-600 leading-relaxed ${bodyFont}`}>
            {isBn
              ? "স্বপ্ন থেকে প্রতিদিনের বাস্তব কাজ—একটি পরিষ্কার ও সরল ধারায় সবকিছু পরিচালিত হয়। কোনো অপ্রয়োজনীয় জটিলতা নেই।"
              : "A simple, powerful framework linking high-level purpose directly into today's timeline."}
          </p>
        </div>

        {/* Steps Stack */}
        <div className="space-y-4 sm:space-y-6 mb-12 sm:mb-16">
          {steps.map((step, idx) => (
            <div
              key={step.num}
              className={`p-5 sm:p-8 rounded-2xl sm:rounded-3xl bg-white border ${step.border} shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6`}
            >
              <div className="flex items-start gap-3.5 sm:gap-6">
                <span className={`w-10 sm:w-12 h-10 sm:h-12 rounded-xl sm:rounded-2xl ${step.numBg} font-extrabold text-sm sm:text-base flex items-center justify-center shrink-0 shadow-md`}>
                  {isBn ? step.num : step.numEn}
                </span>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h2 className={`text-lg sm:text-xl font-bold text-slate-900 ${headingFont}`}>
                      {isBn ? step.titleBn : step.titleEn}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${step.badgeColor}`}>
                      {isBn ? step.badgeBn : step.badgeEn}
                    </span>
                  </div>

                  <p className={`text-xs font-bold ${step.subColor} ${headingFont}`}>
                    {isBn ? step.subBn : step.subEn}
                  </p>

                  <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl ${bodyFont}`}>
                    {isBn ? step.descBn : step.descEn}
                  </p>
                </div>
              </div>

              {idx < steps.length - 1 && (
                <div className="hidden md:flex items-center text-slate-300">
                  <ChevronRight className="w-6 h-6" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Real Example Walkthrough Card */}
        <div className="rounded-3xl p-6 sm:p-10 bg-slate-950 text-white shadow-2xl shadow-indigo-950/20 mb-16 border border-slate-800">
          <div className="max-w-2xl mx-auto text-center mb-8">
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/30">
              {isBn ? "বাস্তব উদাহরণ" : "Real-World Example"}
            </span>
            <h3 className={`text-xl sm:text-2xl font-bold mt-3 ${headingFont}`}>
              {isBn ? "কীভাবে একটি বড় লক্ষ্য আজকের কাজে পরিণত হয়?" : "How a Big Vision Becomes Today's Task"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-white/5 border border-indigo-500/30 space-y-1">
              <span className="text-[10px] font-bold text-indigo-400 block">SECTIONS</span>
              <p className="font-bold text-white">ক্যারিয়ার (Career)</p>
              <p className="text-slate-400 text-[11px]">পেশাগত উন্নয়ন</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-sky-500/30 space-y-1">
              <span className="text-[10px] font-bold text-sky-400 block">GOAL</span>
              <p className="font-bold text-white">নতুন প্রজেক্ট লঞ্চ</p>
              <p className="text-slate-400 text-[11px]">Q2 মাইলফলক</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-amber-500/30 space-y-1">
              <span className="text-[10px] font-bold text-amber-400 block">TARGET</span>
              <p className="font-bold text-white">ফ্রন্টএন্ড সম্পন্ন করা</p>
              <p className="text-slate-400 text-[11px]">৩০ এপ্রিলের মধ্যে</p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-emerald-500/30 space-y-1">
              <span className="text-[10px] font-bold text-emerald-400 block">TASK</span>
              <p className="font-bold text-white">ল্যান্ডিং পেজ কোডিং</p>
              <p className="text-slate-400 text-[11px]">আজকের জন্য নির্ধারিত</p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 space-y-1">
              <span className="text-[10px] font-bold text-emerald-300 block">DAILY SCHEDULE</span>
              <p className="font-bold text-white">বেলা ২:০০ টা</p>
              <p className="text-emerald-200 text-[11px]">আজকের টাইমলাইনে প্রস্তুত</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-3xl p-8 sm:p-12 bg-white border border-indigo-100/90 text-center space-y-4 shadow-xl shadow-indigo-950/5 ring-1 ring-slate-100">
          <h3 className={`text-2xl sm:text-3xl font-bold text-slate-900 ${headingFont}`}>
            {isBn ? "নিজের চোখে অভিজ্ঞতা নিন" : "Experience the Flow Yourself"}
          </h3>
          <p className={`text-xs sm:text-sm text-slate-600 max-w-lg mx-auto ${bodyFont}`}>
            {isBn
              ? "কোনো ক্রেডিট কার্ডের প্রয়োজন নেই, সম্পূর্ণ বিনামূল্যে আজই অ্যাকাউন্ট তৈরি করুন।"
              : "No credit card required. Get started free in less than 60 seconds."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-400 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition active:scale-95 cursor-pointer ring-1 ring-white/20 ${headingFont}`}
            >
              <span>{isAuthenticated ? (isBn ? "ড্যাশবোর্ডে যান" : "Open Workspace") : (isBn ? "ফ্রি অ্যাকাউন্ট খুলুন" : "Create Free Account")}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
            <Link
              href="/pricing"
              className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-slate-200/90 hover:border-indigo-300 bg-white hover:bg-indigo-50/50 text-slate-900 font-bold text-sm shadow-xs transition ${headingFont}`}
            >
              <span>{isBn ? "প্রাইসিং দেখুন" : "View Pricing"}</span>
            </Link>
          </div>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}

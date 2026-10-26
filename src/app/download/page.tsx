"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Smartphone,
  Monitor,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  HardDrive,
  Clock,
  Laptop,
} from "lucide-react";
import { LandingHeader, Lang } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function DownloadPage() {
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
        currentPath="/download"
        lang={lang}
        onToggleLang={toggleLanguage}
        isAuthenticated={isAuthenticated}
      />

      {/* ──────────────── Main Apps Content ──────────────── */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-20">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-indigo-200/90 text-indigo-950 text-xs font-semibold mb-4 shadow-xs backdrop-blur-md">
            <Clock className="w-3.5 h-3.5 text-indigo-600" />
            <span className={headingFont}>
              {isBn
                ? "নেটিভ অ্যাপ্লিকেশন • শীঘ্রই আসছে"
                : "Native Applications • Coming Soon"}
            </span>
          </div>

          <h1 className={`text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 ${headingFont}`}>
            {isBn ? (
              <>
                <span>লাইফস্পেস</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  মোবাইল ও ডেস্কটপ অ্যাপ
                </span>
              </>
            ) : (
              <>
                <span>LifeSpace</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  Mobile & Desktop Apps
                </span>
              </>
            )}
          </h1>

          <p className={`text-xs sm:text-base text-slate-600 leading-relaxed ${bodyFont}`}>
            {isBn
              ? "অ্যান্ড্রয়েড এবং ডেস্কটপ (Windows & macOS) অ্যাপ্লিকেশনের উন্নয়ন বর্তমানে চলমান রয়েছে। খুব শীঘ্রই অফিসিয়াল ডাউনলোড লিংক উন্মুক্ত করা হবে।"
              : "Dedicated native apps for Android and Desktop (Windows & macOS) are currently in active development. Official downloads will be available soon."}
          </p>
        </div>

        {/* 2 Coming Soon App Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch mb-14">
          {/* Card 1: Android Mobile App (APK) - Coming Soon */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 hover:border-sky-300 shadow-xl shadow-slate-900/5 relative flex flex-col justify-between transition ring-1 ring-slate-100">
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold shadow-xs flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>{isBn ? "শীঘ্রই আসছে" : "Coming Soon"}</span>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200/70 text-sky-600 flex items-center justify-center font-bold">
                <Smartphone className="w-6 h-6" />
              </div>

              <div>
                <h2 className={`text-xl font-bold text-slate-900 ${headingFont}`}>
                  {isBn ? "অ্যান্ড্রয়েড মোবাইল অ্যাপ (APK)" : "Android Mobile App (APK)"}
                </h2>
                <p className={`text-xs text-sky-700 font-semibold mt-0.5 ${bodyFont}`}>
                  {isBn ? "স্ট্যান্ডঅ্যালোন প্যাকেজ" : "Standalone Package"}
                </p>
              </div>

              <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "কোনো ব্রাউজার বা অ্যাড্রেস বারের ঝামেলা ছাড়া সম্পূর্ণ ফুলস্ক্রিনে সরাসরি মোবাইল থেকে লাইফস্পেস পরিচালনার অভিজ্ঞতা।"
                  : "Pure fullscreen mobile experience with zero browser address bar clutter, designed for deep focus on the go."}
              </p>

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>{isBn ? "অ্যান্ড্রয়েড ৮.০ বা তদূর্ধ্ব" : "Android 8.0 & Above"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>{isBn ? "১০০% বিজ্ঞাপনহীন ও ব্যক্তিগত" : "100% Ad-free & Privacy-first"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>{isBn ? "অটোমেটিক অফলাইন ক্যাশিং" : "Instant Local Data Caching"}</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div
                className={`w-full py-3.5 px-4 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 cursor-not-allowed select-none ${headingFont}`}
              >
                <Clock className="w-4 h-4 text-amber-500" />
                <span>{isBn ? "উন্নয়ন চলমান • শীঘ্রই আসছে" : "In Development • Coming Soon"}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Desktop Application (Windows & macOS) - Coming Soon */}
          <div className="rounded-3xl p-6 sm:p-8 bg-white border border-slate-200/90 hover:border-indigo-300 shadow-xl shadow-slate-900/5 relative flex flex-col justify-between transition ring-1 ring-slate-100">
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[11px] font-bold shadow-xs flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-indigo-600" />
              <span>{isBn ? "শীঘ্রই আসছে" : "Coming Soon"}</span>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200/70 text-indigo-600 flex items-center justify-center font-bold">
                <Laptop className="w-6 h-6" />
              </div>

              <div>
                <h2 className={`text-xl font-bold text-slate-900 ${headingFont}`}>
                  {isBn ? "ডেস্কটপ অ্যাপ (Windows / Mac)" : "Desktop App (Windows / Mac)"}
                </h2>
                <p className={`text-xs text-indigo-700 font-semibold mt-0.5 ${bodyFont}`}>
                  {isBn ? "উইন্ডোজ ও ম্যাক সফটওয়্যার" : "Windows & macOS Native"}
                </p>
              </div>

              <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "পিসি ও ল্যাপটপে গভীর মনসংযোগের সাথে কাজ করার জন্য নেটিভ সফটওয়্যার। অফলাইন কাজ ও দ্রুত শর্টকাট ব্যবহারের সুবিধা সহ।"
                  : "Native desktop performance engineered for distraction-free deep work on PC and Mac with local offline support."}
              </p>

              <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{isBn ? "Windows 10/11 & macOS 64-bit" : "Windows 10/11 & macOS 64-bit"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{isBn ? "গ্লোবাল কীবোর্ড শর্টকাট" : "Global Keyboard Shortcuts"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <span>{isBn ? "সম্পূর্ণ অফলাইন মোড" : "Full Offline Mode Support"}</span>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <div
                className={`w-full py-3.5 px-4 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs sm:text-sm text-center flex items-center justify-center gap-2 cursor-not-allowed select-none ${headingFont}`}
              >
                <Clock className="w-4 h-4 text-indigo-500" />
                <span>{isBn ? "উন্নয়ন চলমান • শীঘ্রই আসছে" : "In Development • Coming Soon"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Web Workspace Fallback Card */}
        <div className="rounded-3xl p-6 sm:p-10 bg-white border border-indigo-100 text-center space-y-4 shadow-xl shadow-indigo-950/5 ring-1 ring-slate-100 mb-14">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isBn ? "ওয়েব সংস্করণ সক্রিয় ও লাইভ" : "Web Workspace is Live Now"}</span>
          </div>
          <h3 className={`text-xl sm:text-2xl font-bold text-slate-900 ${headingFont}`}>
            {isBn
              ? "নেটিভ অ্যাপ আসার পূর্ব পর্যন্ত ওয়েব সংস্করণ ব্যবহার করুন"
              : "Use the Fully Responsive Web Workspace Today"}
          </h3>
          <p className={`text-xs sm:text-sm text-slate-600 max-w-lg mx-auto ${bodyFont}`}>
            {isBn
              ? "লাইফস্পেস ওয়েব সংস্করণটি মোবাইল, ট্যাবলেট ও পিসি—যেকোনো ডিভাইসের ব্রাউজারে অত্যন্ত দ্রুত ও সম্পূর্ণ বিনামূল্যে চলে।"
              : "LifeSpace works seamlessly in any modern browser on mobile and desktop without requiring any download."}
          </p>
          <div className="pt-2">
            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className={`inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-400 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition active:scale-95 cursor-pointer ring-1 ring-white/20 ${headingFont}`}
            >
              <span>{isAuthenticated ? (isBn ? "ড্যাশবোর্ডে প্রবেশ করুন" : "Open Workspace") : (isBn ? "বিনামূল্যে শুরু করুন" : "Get Started Free")}</span>
              <ArrowRight className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="mb-14">
          <div className="text-center mb-8">
            <h3 className={`text-xl sm:text-2xl font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "নেটিভ অ্যাপ্লিকেশনের মূল সুবিধাসমূহ" : "Key Benefits of Native Apps"}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-emerald-200/80 hover:border-emerald-400 shadow-2xs space-y-2 transition">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-600 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className={`text-sm font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "ফুলস্ক্রিন অভিজ্ঞতা" : "Pure Fullscreen"}
              </h4>
              <p className={`text-xs text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "ব্রাউজারের কোনো অ্যাড্রেস বার বা বাড়তি ট্যাব থাকবে না, ফলে পুরো স্ক্রিনটাই আপনার কাজের জন্য।"
                  : "Zero browser address bars or URL tabs cluttering your daily schedule."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-sky-200/80 hover:border-sky-400 shadow-2xs space-y-2 transition">
              <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-200/60 text-sky-600 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <h4 className={`text-sm font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "১০০% ডাটা প্রাইভেসি" : "100% Data Privacy"}
              </h4>
              <p className={`text-xs text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "আপনার সমস্ত গোল, টার্গেট ও ব্যক্তিগত শিডিউল আপনার ডিভাইসেই নিরাপদে সংরক্ষিত থাকে।"
                  : "Your goals, targets, and notes remain strictly private under your control."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-amber-200/80 hover:border-amber-400 shadow-2xs space-y-2 transition">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/60 text-amber-600 flex items-center justify-center">
                <Monitor className="w-4 h-4" />
              </div>
              <h4 className={`text-sm font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "ডেস্কটপ ও মোবাইল" : "Desktop & Mobile"}
              </h4>
              <p className={`text-xs text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "ফোনে কিংবা কম্পিউটারে—সবখানেই একই সুশৃঙ্খল কাঠামোর নিরবচ্ছিন্ন ধারাবাহিকতা।"
                  : "Seamless continuity across your smartphone and personal computer."}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-purple-200/80 hover:border-purple-400 shadow-2xs space-y-2 transition">
              <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200/60 text-purple-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className={`text-sm font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "বিজ্ঞাপনহীন ও শান্ত" : "Zero Distractions"}
              </h4>
              <p className={`text-xs text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "কোনো বিরক্তিকর পপ-আপ বা থার্ড-পার্টি বিজ্ঞাপন নেই। কেবল আপনার লক্ষ্য ও কাজ।"
                  : "No ads, no popups, no trackers. Built strictly for your peace of mind."}
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="rounded-2xl p-6 bg-white border border-slate-200/80 text-xs text-slate-600 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold text-slate-700">
              {isBn
                ? "অ্যাপ রিলিজ সংক্রান্ত যেকোনো আপডেটের জন্য আমাদের প্ল্যাটফর্ম অনুসরণ করুন।"
                : "Stay tuned for upcoming native app releases on Android, Windows, and macOS."}
            </span>
          </div>
          <Link
            href="/"
            className={`inline-flex items-center gap-1.5 font-bold text-indigo-600 hover:text-indigo-800 ${headingFont}`}
          >
            <span>{isBn ? "হোমপেজে ফিরে যান" : "Back to Home"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}


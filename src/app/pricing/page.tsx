"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Tag,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Calendar,
  Smartphone,
  Menu,
  X,
  HelpCircle,
} from "lucide-react";
import { LandingHeader, Lang } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function PricingPage() {
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
        currentPath="/pricing"
        lang={lang}
        onToggleLang={toggleLanguage}
        isAuthenticated={isAuthenticated}
      />

      {/* ──────────────── Main Pricing Content ──────────────── */}
      <main className="relative z-10 max-w-5xl mx-auto px-3.5 sm:px-6 py-10 sm:py-20">
        {/* Pricing Hero */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-indigo-200/90 text-indigo-950 text-xs font-semibold mb-4 shadow-xs backdrop-blur-md">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span className={headingFont}>
              {isBn
                ? "পাবলিক রিলিজ • সম্পূর্ণ বিনামূল্যে উন্মুক্ত"
                : "Public Release • Free to Use"}
            </span>
          </div>

          <h1 className={`text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight mb-4 ${headingFont}`}>
            {isBn ? (
              <>
                <span>সহজ ও স্বচ্ছ</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  মূল্য তালিকা
                </span>
              </>
            ) : (
              <>
                <span>Simple &</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  Transparent Pricing
                </span>
              </>
            )}
          </h1>

          <p className={`text-xs sm:text-base text-slate-600 leading-relaxed ${bodyFont}`}>
            {isBn
              ? "LifeSpace এর সমস্ত মূল ফিচার সম্পূর্ণ বিনামূল্যে সবার জন্য উন্মুক্ত। কোনো লুকানো ফি বা সাবস্ক্রিপশন চার্জ নেই।"
              : "LifeSpace is 100% free with full access to all core features. No subscriptions or hidden fees required."}
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch mb-12 sm:mb-16">
          {/* Card 1: Free Tier */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-indigo-500 shadow-2xl shadow-indigo-600/10 relative flex flex-col justify-between ring-1 ring-indigo-100">
            <div className="absolute -top-3.5 right-6 px-4 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[11px] font-bold shadow-md shadow-emerald-500/20">
              {isBn ? "সম্পূর্ণ ফ্রি এক্সেস" : "100% Free Access"}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <h2 className={`text-xl font-bold text-slate-900 ${headingFont}`}>
                  {isBn ? "কমিউনিটি ফ্রি এক্সেস" : "Community Free Access"}
                </h2>
              </div>

              <p className={`text-xs text-slate-500 mb-5 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "সমস্ত বর্তমান কোর ফিচার ব্যক্তিগত ব্যবহারের জন্য সম্পূর্ণ বিনামূল্যে উন্মুক্ত।"
                  : "All current core features are 100% free with unlimited personal use."}
              </p>

              <div className="mb-6 flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-slate-900">
                  {isBn ? "৳০" : "$0"}
                </span>
                <span className={`text-xs text-slate-500 font-medium ${bodyFont}`}>
                  {isBn ? "/ সম্পূর্ণ ফ্রি এক্সেস" : "/ completely free access"}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-5 mb-8">
                <h4 className={`text-xs font-bold uppercase tracking-wider text-slate-800 mb-3 ${headingFont}`}>
                  {isBn ? "অন্তর্ভুক্ত সমস্ত সুবিধাসমূহ:" : "What's Included:"}
                </h4>

                <ul className={`space-y-3 text-xs text-slate-700 ${bodyFont}`}>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isBn ? "সীমাহীন লাইফ সেকশন ও ক্যাটাগরি তৈরি" : "Unlimited Life Sections & Categories"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isBn ? "গোলস, টার্গেটস ও সাব-টাস্ক হায়ারার্কি" : "Full Cascade: Goals, Targets & Tasks"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isBn ? "স্বয়ংক্রিয় দৈনিক শিডিউল ও ক্যালেন্ডার ভিউ" : "Automated Daily Schedule & Calendar"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isBn ? "ব্যক্তিগত সিকিউর অ্যাকাউন্ট ও পাসওয়ার্ড এনক্রিপশন" : "Secure Personal Account & Bcrypt Encryption"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isBn ? "১-ক্লিকে ফুল ডাটাবেজ ব্যাকআপ ও রিস্টোর" : "1-Click Full Database Backup & Restore"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{isBn ? "মোবাইল ও ডেস্কটপ অ্যাপসে আর্লি এক্সেস (আসন্ন)" : "Mobile & Desktop Apps Early Access (Coming Soon)"}</span>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              href={isAuthenticated ? "/dashboard" : "/register"}
              className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-indigo-600 to-indigo-700 hover:from-sky-400 hover:via-indigo-500 hover:to-indigo-600 text-white font-bold text-sm text-center shadow-xl shadow-indigo-600/25 ring-1 ring-white/20 transition active:scale-95 cursor-pointer ${headingFont}`}
            >
              {isAuthenticated
                ? isBn
                  ? "ড্যাশবোর্ডে প্রবেশ করুন"
                  : "Open Workspace"
                : isBn
                ? "এখনই বিনামূল্যে শুরু করুন"
                : "Get Started Free"}
            </Link>
          </div>

          {/* Card 2: Upcoming Feature Roadmap */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-slate-200/90 hover:border-indigo-200 shadow-sm relative flex flex-col justify-between">
            <div className="absolute -top-3.5 right-6 px-3.5 py-1 rounded-full bg-slate-900 text-indigo-300 text-[11px] font-bold shadow-xs border border-slate-800">
              {isBn ? "ভবিষ্যৎ রোডম্যাপ" : "Future Roadmap"}
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                <h2 className={`text-xl font-bold text-slate-900 ${headingFont}`}>
                  {isBn ? "ভবিষ্যৎ ফিচারসমূহ" : "Upcoming Features"}
                </h2>
              </div>

              <p className={`text-xs text-slate-500 mb-5 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "লাইফস্পেসের ক্রমাগত উন্নয়নে আসন্ন ফিচারগুলোর রূপরেখা। আপনার উৎপাদনশীলতাকে আরও শক্তিশালী করতে এসব ফিচার যুক্ত করা হবে।"
                  : "Planned roadmap enhancements engineered to expand LifeSpace into an even more powerful productivity ecosystem."}
              </p>

              <div className="mb-6 flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-bold text-slate-500 ${headingFont}`}>
                  {isBn ? "শীঘ্রই আসছে" : "In Development"}
                </span>
                <span className={`text-xs text-slate-400 ${bodyFont}`}>
                  {isBn ? "(রোডম্যাপ)" : "(Roadmap)"}
                </span>
              </div>

              <div className="border-t border-slate-100 pt-5 mb-8">
                <h4 className={`text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 ${headingFont}`}>
                  {isBn ? "আসন্ন সুবিধাসমূহ:" : "Roadmap Highlights:"}
                </h4>

                <ul className={`space-y-3 text-xs text-slate-600 ${bodyFont}`}>
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{isBn ? "স্বয়ংক্রিয় ক্লাউড সিঙ্ক ও রিয়েল-টাইম মাল্টি-ডিভাইস ব্যাকআপ" : "Automated Real-time Cloud Sync"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{isBn ? "এআই-চালিত দৈনিক টাস্ক প্রায়োরিটাইজার ও পরামর্শ" : "AI Daily Planner Suggestions"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{isBn ? "পারিবারিক ও শেয়ার্ড গোল কোলাবোরেশন" : "Family & Shared Goal Collaboration"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{isBn ? "উন্নত প্রোডাক্টিভিটি অ্যানালিটিক্স ও প্রগ্রেস রিপোর্ট" : "Advanced Life Analytics & Insights"}</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{isBn ? "প্রায়োরিটি সাপোর্ট ও নতুন ফিচারের আর্লি এক্সেস" : "Priority Support & Early Feature Access"}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div
              className={`w-full py-3.5 rounded-xl bg-slate-100 text-slate-500 font-bold text-xs sm:text-sm text-center cursor-not-allowed select-none ${headingFont}`}
            >
              {isBn ? "রোডম্যাপ উন্নয়ন চলমান" : "Roadmap In Progress"}
            </div>
          </div>
        </div>

        {/* Pricing FAQ Section */}
        <div className="rounded-3xl p-6 sm:p-10 bg-white border border-slate-200 shadow-sm mb-12">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <h3 className={`text-lg sm:text-xl font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "প্রাইসিং সম্পর্কিত সাধারণ প্রশ্নোত্তর (FAQ)" : "Frequently Asked Questions"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className={`font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "কেন ভার্সন ২.০.০.০ পর্যন্ত সম্পূর্ণ ফ্রি?" : "Why is it free until Version 2.0.0.0?"}
              </h4>
              <p className={`text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "আমাদের লক্ষ্য প্রতিটি মানুষকে লক্ষ্য অর্জনে সুশৃঙ্খল করা। তাই প্রাথমিক কমিউনিটি পর্যায়ে কোনো খরচ ছাড়াই সবাই পুরো সিস্টেম ব্যবহার করতে পারবেন।"
                  : "We want every user to build lifelong focus and clarity without financial barriers while we scale the platform."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className={`font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "ভার্সন ২.০.০.০ আসলে কি আমার ডাটা হারিয়ে যাবে?" : "Will my data be safe when v2.0 launches?"}
              </h4>
              <p className={`text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "একদমই না! আপনার সমস্ত পূর্বের ডাটা, সেকশন, গোল এবং ব্যাকআপ সম্পূর্ণ অক্ষত ও নিরাপদ থাকবে।"
                  : "No, all your local data, sections, and exported database backups remain 100% safe and accessible."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className={`font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "ফ্রি ভার্সনে কি কোনো বিজ্ঞাপন থাকবে?" : "Are there any advertisements?"}
              </h4>
              <p className={`text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "না। LifeSpace পুরোপুরি বিজ্ঞাপনহীন। কাজের মনসংযোগে বাধা সৃষ্টি করে এমন কোনো থার্ড-পার্টি কোড বা বিজ্ঞাপন নেই।"
                  : "Never. LifeSpace is 100% ad-free and respects your focus."}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className={`font-bold text-slate-900 ${headingFont}`}>
                {isBn ? "বিনামূল্যে ব্যবহারের জন্য কি কার্ডের তথ্য দিতে হবে?" : "Do I need a credit card?"}
              </h4>
              <p className={`text-slate-600 leading-relaxed ${bodyFont}`}>
                {isBn
                  ? "কোনো ক্রেডিট কার্ডের তথ্য লাগবে না। শুধুমাত্র একটি সাধারণ অ্যাকাউন্ট খুলেই অবিলম্বে ব্যবহার শুরু করতে পারবেন।"
                  : "No credit card or payment information is required to register and use LifeSpace."}
              </p>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter lang={lang} />
    </div>
  );
}

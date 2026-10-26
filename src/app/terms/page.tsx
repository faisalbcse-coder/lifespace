"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, FileText, ArrowRight } from "lucide-react";
import { LandingHeader, Lang } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function TermsPage() {
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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/95 border border-indigo-200/90 text-indigo-950 text-xs font-semibold mb-3 shadow-xs backdrop-blur-md">
            <FileText className="w-3.5 h-3.5 text-indigo-600" />
            <span className={headingFont}>{isBn ? "ব্যবহারের শর্তাবলী" : "Terms of Service"}</span>
          </div>
          <h1 className={`text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 ${headingFont}`}>
            {isBn ? (
              <>
                <span>লাইফস্পেস ব্যবহারের</span>{" "}
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  নিয়ম ও শর্তাবলী
                </span>
              </>
            ) : (
              <>
                <span className="bg-gradient-to-r from-sky-600 via-indigo-600 to-indigo-800 bg-clip-text text-transparent">
                  Terms of Service
                </span>
              </>
            )}
          </h1>
          <p className={`text-xs sm:text-sm text-slate-600 ${bodyFont}`}>
            {isBn
              ? "একটি সুশৃঙ্খল ও নিরাপদ প্ল্যাটফর্ম বজায় রাখতে নিচের সাধারণ শর্তাবলী প্রযোজ্য।"
              : "Standard terms and conditions governing the use of the LifeSpace platform."}
          </p>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
            <h2 className={`text-base font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "১. ব্যবহারের পরিধি" : "1. Purpose of Service"}
            </h2>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "লাইফস্পেস একটি ব্যক্তিগত উৎপাদনশীলতা ও লক্ষ্য ব্যবস্থাপনা সফটওয়্যার। এটি ব্যক্তিগত লক্ষ্য, মাইলফলক এবং দৈনন্দিন কাজের ট্র্যাকিংয়ের জন্য উন্মুক্ত।"
                : "LifeSpace is provided as a personal goal and daily execution management tool designed for personal productivity and focus."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
            <h2 className={`text-base font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "২. ব্যবহারকারীর দায়িত্ব" : "2. User Responsibility"}
            </h2>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "ব্যবহারকারী তার অ্যাকাউন্টের পাসওয়ার্ড ও তথ্যের গোপনীয়তার জন্য দায়িত্বশীল থাকবেন। নিয়মিত ব্যাকআপ ডাউনলোড করে সংরক্ষণ করার পরামর্শ দেওয়া হচ্ছে।"
                : "Users are responsible for maintaining the confidentiality of their credentials and are encouraged to utilize the database backup export feature regularly."}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-2.5">
            <h2 className={`text-base font-bold text-slate-900 ${headingFont}`}>
              {isBn ? "৩. সফটওয়্যার আপডেট" : "3. Platform Availability"}
            </h2>
            <p className={`text-xs sm:text-sm text-slate-600 leading-relaxed ${bodyFont}`}>
              {isBn
                ? "লাইফস্পেস ক্রমাগত উন্নয়নের মাধ্যমে ব্যবহারকারীদের উন্নততর অভিজ্ঞতা প্রদানে সচেষ্ট থাকবে।"
                : "LifeSpace is provided as a public release with ongoing improvements to ensure performance and reliability."}
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

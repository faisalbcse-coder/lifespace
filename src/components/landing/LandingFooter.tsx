"use client";

import React from "react";
import Link from "next/link";
import { Lang } from "./LandingHeader";

interface LandingFooterProps {
  lang: Lang;
}

export function LandingFooter({ lang }: LandingFooterProps) {
  const isBn = lang === "bn";
  const bodyFont = isBn ? "font-body-bn" : "font-sans-en";

  return (
    <footer className="relative z-10 border-t border-slate-200/80 bg-white/80 backdrop-blur-md py-5 sm:py-6 px-4 sm:px-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-3 sm:gap-4">
        {/* Left: Copyright */}
        <div className={`text-center md:text-left text-slate-500 font-medium ${bodyFont}`}>
          <span>© 2026 LifeSpace · SW-IT</span>
        </div>

        {/* Center: Version with small status indicator */}
        <div className="flex items-center justify-center gap-2">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className={`text-slate-600 font-medium tracking-tight ${bodyFont}`}>
            LifeSpace v1.0.0.2
          </span>
        </div>

        {/* Right: Legal Links */}
        <div className={`flex items-center justify-center md:justify-end gap-3 sm:gap-4 text-slate-500 ${bodyFont}`}>
          <Link
            href="/privacy"
            className="hover:text-slate-900 transition-colors"
          >
            {isBn ? "প্রাইভেসি পলিসি" : "Privacy Policy"}
          </Link>
          <span className="text-slate-300 select-none">·</span>
          <Link
            href="/terms"
            className="hover:text-slate-900 transition-colors"
          >
            {isBn ? "ব্যবহারের শর্তাবলী" : "Terms of Service"}
          </Link>
        </div>
      </div>
    </footer>
  );
}


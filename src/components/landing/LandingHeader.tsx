"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export type Lang = "en" | "bn";

interface LandingHeaderProps {
  currentPath: "/" | "/why-lifespace" | "/how-it-works" | "/pricing" | "/download";
  lang: Lang;
  onToggleLang: () => void;
  isAuthenticated: boolean;
}

export function LandingHeader({
  currentPath,
  lang,
  onToggleLang,
  isAuthenticated,
}: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isBn = lang === "bn";
  const menuFont = isBn ? "font-menu-bn" : "font-sans-en";

  const navLinks = [
    { href: "/", labelBn: "হোম", labelEn: "Home", path: "/" },
    { href: "/why-lifespace", labelBn: "কেন লাইফস্পেস", labelEn: "Why LifeSpace", path: "/why-lifespace" },
    { href: "/how-it-works", labelBn: "কীভাবে কাজ করে", labelEn: "How It Works", path: "/how-it-works" },
    { href: "/pricing", labelBn: "প্রাইসিং", labelEn: "Pricing", path: "/pricing", badge: "Free" },
    { href: "/download", labelBn: "অ্যাপস", labelEn: "Apps", path: "/download", badge: "Soon" },
  ];

  return (
    <header className="fixed top-2 left-2 right-2 sm:left-4 sm:right-4 md:left-5 md:right-5 z-50 transition-all">
      <div className="w-full rounded-2xl backdrop-blur-2xl bg-white/90 border border-slate-200/85 hover:border-sky-300/60 shadow-[0_4px_24px_-4px_rgba(15,23,42,0.04),0_1px_3px_rgba(15,23,42,0.02),inset_0_1px_1px_rgba(255,255,255,0.95)] ring-1 ring-slate-900/[0.03] transition-all">
        <div className="w-full px-2.5 sm:px-6 md:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3">
          {/* Brand Logo & Name */}
          <Link href="/" className="flex items-center gap-2 group cursor-pointer shrink-0">
            <BrandLogo size="sm" animate={true} />
            <div className="flex items-center gap-1.5">
              <span className={`text-base sm:text-lg font-bold tracking-tight text-slate-900 group-hover:text-sky-600 transition ${menuFont}`}>
                LifeSpace
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            </div>
          </Link>

          {/* Desktop Menu Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs sm:text-sm">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl transition font-medium backdrop-blur-sm flex items-center gap-1.5 ${
                    isActive
                      ? "text-sky-700 bg-sky-50 border border-sky-200/80 font-bold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  } ${menuFont}`}
                >
                  <span>{isBn ? link.labelBn : link.labelEn}</span>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-900 text-white border border-slate-800">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Controls: EN/BN Toggle & Distinctive Login Button */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* EN/BN Clean Segmented Toggle Button */}
            <button
              type="button"
              onClick={onToggleLang}
              aria-label="Toggle language between EN and BN"
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border border-sky-200/80 bg-white/90 hover:bg-sky-50/40 text-[11px] sm:text-xs font-bold shadow-2xs transition active:scale-95 cursor-pointer select-none"
              title="Toggle EN / BN"
            >
              <span className={isBn ? "text-sky-600 font-extrabold" : "text-slate-400 font-medium"}>BN</span>
              <span className="text-slate-300 text-[10px]">/</span>
              <span className={!isBn ? "text-slate-900 font-extrabold" : "text-slate-400 font-medium"}>EN</span>
            </button>

            {/* Subtle Divider Line Separating Login (Alada kore) */}
            <div className="h-4 w-[1px] bg-slate-300/80 hidden sm:block mx-0.5" />

            {/* Header Primary Actions: Authenticated Workspace or Sign In + Get Started */}
            {isAuthenticated ? (
              <Link
                href="/dashboard"
                className={`relative group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/10 hover:shadow-sky-500/20 transition-all duration-200 active:scale-95 cursor-pointer ring-1 ring-slate-800 hover:ring-sky-400 ${menuFont}`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                <span>{isBn ? "ড্যাশবোর্ড" : "Workspace"}</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  href="/login"
                  className={`hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition ${menuFont}`}
                >
                  {isBn ? "লগইন" : "Sign In"}
                </Link>
                <Link
                  href="/register"
                  className={`relative group inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/10 hover:shadow-sky-500/20 transition-all duration-200 active:scale-95 cursor-pointer ring-1 ring-slate-800 hover:ring-sky-400 ${menuFont}`}
                >
                  <span>{isBn ? "শুরু করুন" : "Get Started"}</span>
                  <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 rounded-xl border border-slate-200/90 text-slate-700 hover:bg-slate-100 cursor-pointer active:scale-95"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden max-h-[75vh] overflow-y-auto px-4 pb-4 border-t border-slate-200/70 bg-white/95 flex flex-col gap-2 pt-3 animate-in fade-in rounded-b-2xl">
            {navLinks.map((link) => {
              const isActive = currentPath === link.path;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-between ${
                    isActive
                      ? "bg-sky-50 text-sky-800 font-bold border border-sky-200"
                      : "text-slate-800 hover:bg-slate-100"
                  } ${menuFont}`}
                >
                  <span>{isBn ? link.labelBn : link.labelEn}</span>
                  {link.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-white">
                      {isBn ? "সম্পূর্ণ ফ্রি" : link.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md ${menuFont}`}
                >
                  <span>{isBn ? "ড্যাশবোর্ড" : "Workspace"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-sm shadow-md ${menuFont}`}
                  >
                    <span>{isBn ? "বিনামূল্যে শুরু করুন" : "Get Started Free"}</span>
                    <ArrowRight className="w-4 h-4 text-sky-400" />
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`w-full min-h-[40px] flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs ${menuFont}`}
                  >
                    <span>{isBn ? "লগইন" : "Sign In"}</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

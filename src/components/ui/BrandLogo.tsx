"use client";

import React, { useState } from "react";

interface BrandLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  shape?: "rounded" | "circle";
  animate?: boolean;
}

export function BrandLogo({
  size = "md",
  className = "",
  shape = "rounded",
  animate = true,
}: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    sm: "w-7 h-7 sm:w-8 sm:h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16",
    xl: "w-20 h-20",
  }[size];

  const roundedClasses = {
    rounded: size === "sm" ? "rounded-xl" : "rounded-2xl",
    circle: "rounded-full",
  }[shape];

  const fontSizes = {
    sm: "text-xs",
    md: "text-base",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  // Fallback to stylized Liquid "L" if image fails or is missing
  if (imgError) {
    return (
      <div
        className={`${sizeClasses} ${roundedClasses} liquid-logo text-white font-bold transition-transform group-hover:scale-105 duration-200 shadow-[0_0_12px_#00eaff] flex items-center justify-center shrink-0 ${fontSizes} ${className}`}
      >
        L
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClasses} ${roundedClasses} overflow-hidden flex items-center justify-center shrink-0 bg-white shadow-[0_0_15px_rgba(0,234,255,0.4)] ring-1 ring-white/30 dark:ring-white/20 transition-transform duration-300 group-hover:scale-105 ${
        animate ? "animate-[logoFloat_5s_infinite_ease-in-out]" : ""
      } p-0.5 ${className}`}
    >
      <img
        src="/logo.png"
        alt="Lifespace Logo"
        onError={() => setImgError(true)}
        className="w-full h-full object-contain select-none pointer-events-none"
      />
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  User as UserIcon,
  Shield,
  KeyRound,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  Heart,
  Save,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sun,
  Moon,
  LogOut,
  Layers,
  ListTodo,
  Sparkles,
  Info,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { useToast } from "@/components/ui/Toast";
import { User } from "@/types";
import { cn } from "@/lib/utils";

interface ProfileStats {
  totalSections: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "workspace">("profile");

  // User Profile State
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    totalSections: 0,
    totalTasks: 0,
    completedTasks: 0,
    completionRate: 0,
  });

  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  // Profile Form State
  const [formData, setFormData] = useState({
    name: "",
    fatherName: "",
    motherName: "",
    phone: "",
    address: "",
    permanentAddress: "",
    dateOfBirth: "",
    gender: "",
    bloodGroup: "",
    occupation: "",
    bio: "",
    emergencyContact: "",
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  // Password Form State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Apply & Toggle Theme
  const applyTheme = useCallback((newTheme: "light" | "dark") => {
    setTheme(newTheme);
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, []);

  const handleToggleTheme = async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      await fetch("/api/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: nextTheme }),
      });
    } catch {
      // non-critical
    }
  };

  // Load Profile Data
  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/profile");
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      const data = await res.json();
      if (!data.success || !data.data?.user) {
        router.replace("/login");
        return;
      }

      const u = data.data.user;
      setUser(u);
      setFormData({
        name: u.name || "",
        fatherName: u.fatherName || "",
        motherName: u.motherName || "",
        phone: u.phone || "",
        address: u.address || "",
        permanentAddress: u.permanentAddress || "",
        dateOfBirth: u.dateOfBirth || "",
        gender: u.gender || "",
        bloodGroup: u.bloodGroup || "",
        occupation: u.occupation || "",
        bio: u.bio || "",
        emergencyContact: u.emergencyContact || "",
      });

      if (data.data.stats) {
        setStats(data.data.stats);
      }

      // Check system/user theme
      const isDark = document.documentElement.classList.contains("dark");
      setTheme(isDark ? "dark" : "light");
    } catch (err) {
      console.error("Failed to load profile:", err);
      toastError("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  }, [router, toastError]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg("");

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toastError(data.error || "Failed to update profile");
        return;
      }

      setUser(data.data.user);
      setProfileSuccessMsg("Profile information saved successfully!");
      success("Profile updated successfully!");
      setTimeout(() => setProfileSuccessMsg(""), 4000);
    } catch {
      toastError("Network error while saving profile");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Change
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (passwordData.newPassword.length < 8) {
      setPasswordMsg({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMsg({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setPasswordMsg({ type: "error", text: data.error || "Failed to change password." });
        return;
      }

      setPasswordMsg({ type: "success", text: "Password changed successfully!" });
      success("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordMsg(null), 5000);
    } catch {
      setPasswordMsg({ type: "error", text: "Network error while changing password." });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600 dark:text-slate-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#00c6ff] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Loading Profile...</p>
        </div>
      </div>
    );
  }

  const initial = user?.name ? user.name[0] : (user?.email ? user.email[0] : "U");

  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100 pb-16">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 w-full px-3 sm:px-6 pt-3 pb-2 transition-all">
        <div className="max-w-5xl mx-auto rounded-2xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/70 border border-white/60 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.06)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)] px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.05] hover:bg-white/90 dark:hover:bg-white/10 text-xs font-semibold text-slate-700 dark:text-slate-200 shadow-2xs hover:shadow-xs transition active:scale-95 cursor-pointer"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-indigo-500" />
              <span>Back to Dashboard</span>
            </Link>

            <div className="hidden sm:flex items-center gap-2 border-l border-slate-200 dark:border-white/10 pl-3">
              <BrandLogo size="sm" />
              <span className="font-bold text-sm tracking-tight">Lifespace</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#00eaff] shadow-[0_0_8px_#00eaff]" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              type="button"
              onClick={handleToggleTheme}
              className="p-2 rounded-full border border-slate-200/70 dark:border-white/15 bg-white/60 dark:bg-white/[0.05] text-slate-700 dark:text-slate-200 hover:text-[#00eaff] transition cursor-pointer"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-200/70 dark:border-rose-500/20 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-xs font-semibold transition active:scale-95 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 pt-4 sm:pt-6 space-y-6">
        {/* Hero Profile Overview Card */}
        <section className="relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/65 border border-white/80 dark:border-white/10 shadow-xl p-5 sm:p-8 transition-all">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-cyan-500/10 to-violet-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
            {/* Glowing Avatar */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-[#00c6ff] via-[#0072ff] to-[#8a2be2] text-white flex items-center justify-center text-4xl sm:text-5xl font-black uppercase shadow-2xl shadow-indigo-500/30 ring-4 ring-white/60 dark:ring-white/10">
                {initial}
              </div>
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white ring-2 ring-white dark:ring-slate-900 shadow-sm" title="Active">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {user?.name || "Personal Workspace User"}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center md:justify-start gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{user?.email}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center md:justify-end gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 shadow-2xs">
                    <Shield className="w-3.5 h-3.5" />
                    Personal Workspace Owner
                  </span>
                  {user?.bloodGroup && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/60">
                      <Heart className="w-3 h-3" />
                      Blood: {user.bloodGroup}
                    </span>
                  )}
                </div>
              </div>

              {formData.bio && (
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl pt-1 italic">
                  &ldquo;{formData.bio}&rdquo;
                </p>
              )}

              {/* Quick Summary Badges */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 shadow-2xs">
                  <div className="flex items-center justify-center gap-1.5 text-indigo-500 mb-0.5">
                    <Layers className="w-4 h-4" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Sections</span>
                  </div>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{stats.totalSections}</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 shadow-2xs">
                  <div className="flex items-center justify-center gap-1.5 text-amber-500 mb-0.5">
                    <ListTodo className="w-4 h-4" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tasks</span>
                  </div>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{stats.totalTasks}</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 shadow-2xs">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-500 mb-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed</span>
                  </div>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{stats.completedTasks}</span>
                </div>

                <div className="p-3 rounded-2xl bg-white/60 dark:bg-white/[0.04] border border-slate-200/60 dark:border-white/5 shadow-2xs">
                  <div className="flex items-center justify-center gap-1.5 text-cyan-500 mb-0.5">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Progress</span>
                  </div>
                  <span className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{stats.completionRate}%</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60 backdrop-blur-xl border border-slate-300/60 dark:border-white/10 max-w-md mx-auto sm:mx-0">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "profile"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <UserIcon className="w-4 h-4 text-indigo-500" />
            <span>Full Profile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "security"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <KeyRound className="w-4 h-4 text-amber-500" />
            <span>Password & Security</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workspace")}
            className={cn(
              "hidden sm:inline-flex flex-1 items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer",
              activeTab === "workspace"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Layers className="w-4 h-4 text-emerald-500" />
            <span>Workspace</span>
          </button>
        </div>

        {/* Tab 1: Full Profile Form */}
        {activeTab === "profile" && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {profileSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            {/* Card 1: Basic Information */}
            <div className="rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/10 shadow-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                <UserIcon className="w-4 h-4 text-indigo-500" />
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Basic Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Md Faisal Islam"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Email Address</span>
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Verified</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={user?.email || ""}
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100 dark:bg-white/[0.02] text-slate-500 dark:text-slate-400 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Phone / Mobile Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +880 1XXXXXXXXX"
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Occupation */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Occupation / Profession
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                      placeholder="e.g. Software Engineer, Student"
                      className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Family Information (Requested: Father's Name, Mother's Name) */}
            <div className="rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/10 shadow-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                <Users className="w-4 h-4 text-emerald-500" />
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Family & Emergency Information
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Father's Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Enter father's full name"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

                {/* Mother's Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Mother&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={formData.motherName}
                    onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                    placeholder="Enter mother's full name"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

                {/* Emergency Contact */}
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Emergency Contact (Name & Phone)
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                    placeholder="e.g. Brother: +880 17XXXXXXXX"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>
              </div>
            </div>

            {/* Card 3: Address Information */}
            <div className="rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/10 shadow-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                <MapPin className="w-4 h-4 text-cyan-500" />
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Address Details
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Present Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Present Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="House, Road, Area, City, Postcode"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
                  />
                </div>

                {/* Permanent Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Permanent Address
                  </label>
                  <textarea
                    rows={2}
                    value={formData.permanentAddress}
                    onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })}
                    placeholder="Village/Road, Thana, District"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Card 4: Demographics & Bio */}
            <div className="rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/10 shadow-lg p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-white/10">
                <Calendar className="w-4 h-4 text-violet-500" />
                <h2 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100">
                  Personal Details & About Me
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Date of Birth */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                {/* Blood Group */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Blood Group
                  </label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>

                {/* Bio / About */}
                <div className="sm:col-span-3 space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    About Me / Bio
                  </label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="A brief note about your goals, passions, or motto..."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/dashboard"
                className="px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs sm:text-sm font-semibold transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl liquid-btn text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSavingProfile ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Security & Change Password */}
        {activeTab === "security" && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/10 shadow-lg p-5 sm:p-7 space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-200/60 dark:border-white/10">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    Change Account Password
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Ensure your account stays secure by choosing a strong password.
                  </p>
                </div>
              </div>

              {passwordMsg && (
                <div
                  className={cn(
                    "p-3.5 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm animate-in fade-in",
                    passwordMsg.type === "success"
                      ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"
                  )}
                >
                  {passwordMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  )}
                  <span>{passwordMsg.text}</span>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Current Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full pr-10 pl-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      minLength={8}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="At least 8 characters"
                      className="w-full pr-10 pl-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirm New Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder="Re-enter new password"
                      className="w-full pr-10 pl-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-white/15 bg-white/80 dark:bg-white/[0.04] focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                      aria-label="Toggle password visibility"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Security tips box */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <p className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-indigo-400" />
                    Password requirements:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1">
                    <li className={passwordData.newPassword.length >= 8 ? "text-emerald-500 font-semibold" : ""}>
                      Minimum 8 characters
                    </li>
                    <li
                      className={
                        passwordData.newPassword && passwordData.newPassword === passwordData.confirmPassword
                          ? "text-emerald-500 font-semibold"
                          : ""
                      }
                    >
                      New password and confirmation must match
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="w-full py-2.5 rounded-xl liquid-btn text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 active:scale-98 transition cursor-pointer disabled:opacity-50"
                  >
                    {isChangingPassword ? "Updating Password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Workspace Statistics Breakdown */}
        {activeTab === "workspace" && (
          <div className="space-y-6">
            <div className="rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-slate-900/60 border border-white/80 dark:border-white/10 shadow-lg p-6 space-y-6">
              <div>
                <h2 className="font-bold text-lg text-slate-900 dark:text-slate-100">Workspace Health & Progress</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Overview of your personal management efficiency and goal milestones.
                </p>
              </div>

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600 dark:text-slate-300">Overall Task Completion</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{stats.completionRate}%</span>
                </div>
                <div className="h-3 w-full bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 rounded-full transition-all duration-700"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                  <Layers className="w-6 h-6 text-indigo-500 mb-2" />
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalSections}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Active Workspace Sections</p>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                  <ListTodo className="w-6 h-6 text-amber-500 mb-2" />
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.totalTasks}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Created Tasks & Items</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500 mb-2" />
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.completedTasks}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Tasks Completed Successfully</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/60 dark:border-white/10 flex flex-wrap gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Go to Daily Tasks & Goals
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

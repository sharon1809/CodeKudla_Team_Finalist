"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  ArrowRight,
  Zap,
  FileSearch,
  Pill,
  Users,
  Globe,
  BookOpen,
  Shield,
  Activity,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const APP_ROUTES = [
  {
    title: "OPD AI Copilot",
    href: "/opd",
    icon: Stethoscope,
    desc: "Voice dictation to instant differential diagnoses.",
    glow: "rgba(16, 185, 129, 0.4)", // Emerald
    border: "group-hover:border-emerald-500/50",
    text: "group-hover:text-emerald-400",
  },
  {
    title: "X-Ray Analyzer",
    href: "/xray",
    icon: Zap,
    desc: "Real-time automated pathology detection.",
    glow: "rgba(14, 165, 233, 0.4)", // Sky
    border: "group-hover:border-sky-500/50",
    text: "group-hover:text-sky-400",
  },
  {
    title: "Drug Safety",
    href: "/drug-safety",
    icon: Pill,
    desc: "Instant interaction checks & generic equivalents.",
    glow: "rgba(139, 92, 246, 0.4)", // Violet
    border: "group-hover:border-violet-500/50",
    text: "group-hover:text-violet-400",
  },
  {
    title: "Patient Directory",
    href: "/patients",
    icon: Users,
    desc: "Longitudinal record of clinical encounters.",
    glow: "rgba(245, 158, 11, 0.4)", // Amber
    border: "group-hover:border-amber-500/50",
    text: "group-hover:text-amber-400",
  },
  {
    title: "Library AI Chat",
    href: "/documents",
    icon: FileSearch,
    desc: "Semantic RAG queries on your uploaded PDFs.",
    glow: "rgba(239, 68, 68, 0.4)", // Red
    border: "group-hover:border-red-500/50",
    text: "group-hover:text-red-400",
  },
  {
    title: "Document Manager",
    href: "/library",
    icon: BookOpen,
    desc: "Manage, view, and organize medical textbooks.",
    glow: "rgba(99, 102, 241, 0.4)", // Indigo
    border: "group-hover:border-indigo-500/50",
    text: "group-hover:text-indigo-400",
  },
];

export default function LandingPage() {
  const { isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch for auth buttons
  if (!mounted) return <div className="min-h-screen bg-[#030303]" />;

  return (
    <div className="min-h-screen bg-[#030303] text-gray-200 font-sans selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-900/20 blur-[150px] pointer-events-none z-0" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[150px] pointer-events-none z-0" />

      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#030303]/60 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Stethoscope className="w-6 h-6 text-black" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              MedSynexa
            </span>
          </div>

          <div className="flex items-center gap-6">
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-gray-400 hover:text-white transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-gray-200 hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap className="w-4 h-4" /> The #1 Clinical AI Copilot
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tighter leading-[1.1] mb-6 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Intelligence. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              Zero Friction.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            The unified operating system for high-volume Indian clinics. From
            voice-dictated diagnostics to instant X-Ray analyses—all in sub-3 seconds.
          </p>

          {!isAuthenticated && (
            <div className="animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 text-lg font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 text-black px-8 py-4 rounded-full hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-105 transition-all"
              >
                Deploy AI in Your Clinic <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
        </div>

        {/* Application Suite Grid */}
        <div className="mt-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              The Clinical Suite
            </h2>
            <p className="text-gray-400 text-lg">
              Fully integrated modules to power your practice.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {APP_ROUTES.map((route) => (
              <Link href={route.href} key={route.href} className="group block h-full">
                <div
                  className={`relative h-full bg-white/[0.02] border border-white/5 rounded-3xl p-8 transition-all duration-300 ${route.border} hover:bg-white/[0.04] overflow-hidden`}
                >
                  {/* Hover Glow Effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none blur-3xl"
                    style={{ background: `radial-gradient(circle at center, ${route.glow} 0%, transparent 70%)` }}
                  />

                  <div className="relative z-10 flex flex-col h-full">
                    <div className={`w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-colors duration-300 ${route.text}`}>
                      <route.icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                      {route.title}
                    </h3>
                    
                    <p className="text-gray-400 mb-8 flex-1 leading-relaxed group-hover:text-gray-300 transition-colors">
                      {route.desc}
                    </p>

                    <div className={`inline-flex items-center gap-2 font-bold text-sm ${route.text} text-gray-500 transition-colors`}>
                      Launch Module <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/50 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
            <Stethoscope className="w-5 h-5" />
            <span className="font-bold tracking-tight">MedSynexa AI</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <span>© {new Date().getFullYear()} MedSynexa.</span>
            <span className="flex items-center gap-1"><Globe className="w-4 h-4"/> Indian Protocols</span>
            <span className="flex items-center gap-1"><Shield className="w-4 h-4"/> 100% Secure</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

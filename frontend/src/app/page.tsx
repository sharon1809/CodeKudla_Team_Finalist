'use client';

import React from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  ArrowRight,
  Activity,
  ShieldAlert,
  Zap,
  FileSearch,
  Pill,
  Sparkles,
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Building2,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg relative flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] -z-10" />

      {/* Header / Navbar */}
      <header className="border-b border-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white">
              MedSynexa <span className="text-teal-400 text-xs px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 ml-1">AI</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2"
          >
            Doctor Login
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white bg-teal-600 hover:bg-teal-500 border border-teal-400/25 px-5 py-2 rounded-xl transition-all shadow-md shadow-teal-600/20 active:scale-[0.98]"
          >
            Launch Copilot
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-6 py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col text-left space-y-6">
            {/* Tagline pill */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs font-semibold text-teal-300">
              <Zap className="h-3.5 w-3.5 text-teal-400" />
              <span>Sub-10-Second Real-Time Clinical Reasoning Layer</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-none">
              Ultra-Fast Clinical AI <br />
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Built for Indian OPDs.
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              Indian doctors spend under 2 minutes per patient consultation. MedSynexa provides instant differential diagnoses, ICMR/NHP aligned treatment options, Indian generic/brand dosages, and real-time safety guardrails.
            </p>

            <div className="flex flex-wrap gap-4 pt-3">
              <Link
                href="/register"
                className="px-6 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-teal-600/25 flex items-center gap-2 transition-all group border border-teal-400/30 active:scale-[0.98]"
              >
                Start Free Consultation Copilot
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-800 transition-all active:scale-[0.98]"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-900 max-w-md">
              <div>
                <div className="text-2xl font-extrabold text-teal-400">&lt; 3.0s</div>
                <div className="text-xs text-slate-500 font-medium">Average OPD Latency</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">ICMR / NHP</div>
                <div className="text-xs text-slate-500 font-medium">Localized Guidelines</div>
              </div>
              <div>
                <div className="text-2xl font-extrabold text-white">pgvector</div>
                <div className="text-xs text-slate-500 font-medium">Free Hybrid RAG</div>
              </div>
            </div>
          </div>

          {/* Feature Showcase Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="glass-panel p-5 rounded-3xl border-teal-500/20 flex flex-col justify-between h-52 hover:-translate-y-1 transition-all group">
              <div className="h-10 w-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-hover:scale-110 transition-transform">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Differential Diagnosis</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Ranked by likelihood with ICD-10 codes from messy unstructured patient notes.
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl border-teal-500/20 flex flex-col justify-between h-52 hover:-translate-y-1 transition-all group mt-6">
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Indian Brand / Generic Rx</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Generics + Indian brand names (Crocin, Augmentin, Azithral) with local dosages.
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl border-teal-500/20 flex flex-col justify-between h-52 hover:-translate-y-1 transition-all group">
              <div className="h-10 w-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Safety & Drug Checker</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time alerts for drug interactions, allergies, renal & hepatic dosage tweaks.
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-3xl border-teal-500/20 flex flex-col justify-between h-52 hover:-translate-y-1 transition-all group mt-6">
              <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <FileSearch className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">OCR Lab Report RAG</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Upload scanned lab report PDFs → OCR extraction + pgvector RAG insights.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Workflow Banner */}
        <div className="mt-16 glass-panel-glow p-8 rounded-3xl border-teal-500/20">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            How MedSynexa Accelerates High-Volume OPD Consultations
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                1
              </div>
              <h4 className="text-sm font-bold text-white">Micro-Note Input</h4>
              <p className="text-xs text-slate-400">Doctor inputs 2-3 lines of symptoms, vitals, age via keyboard or voice.</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                2
              </div>
              <h4 className="text-sm font-bold text-white">NLP & Vector Retrieval</h4>
              <p className="text-xs text-slate-400">LangChain parses entities & retrieves ICMR guidelines from pgvector.</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                3
              </div>
              <h4 className="text-sm font-bold text-white">Clinical Reasoning</h4>
              <p className="text-xs text-slate-400">Gemini 2.5 Flash outputs ranked DD, next steps, and Indian formulations.</p>
            </div>

            <div className="flex flex-col items-center text-center space-y-2">
              <div className="h-10 w-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-md">
                4
              </div>
              <h4 className="text-sm font-bold text-white">Safe Prescription</h4>
              <p className="text-xs text-slate-400">Safety flags check contraindications in real-time before completion.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 text-center text-xs text-slate-500 max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          &copy; {new Date().getFullYear()} MedSynexa AI. Built for Indian Healthcare. Powered by LangChain JS, Gemini & pgvector.
        </div>
        <div className="flex gap-6">
          <Link href="/login" className="hover:text-slate-300 transition-colors">
            Doctor Login
          </Link>
          <Link href="/register" className="hover:text-slate-300 transition-colors">
            Register Account
          </Link>
        </div>
      </footer>
    </div>
  );
}

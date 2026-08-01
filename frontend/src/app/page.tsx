'use client';

import React from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  ArrowRight,
  Activity,
  ShieldCheck,
  Zap,
  FileSearch,
  Pill,
  ChevronRight,
  Heart,
  Brain,
  Microscope,
  ClipboardList,
  Users,
  Globe,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Activity,
    color: 'icon-blue',
    title: 'Differential Diagnosis',
    desc: 'Ranked likelihood list with ICD-10 codes parsed from raw clinical notes — in under 3 seconds.',
  },
  {
    icon: Pill,
    color: 'icon-indigo',
    title: 'Indian Brand & Generic Rx',
    desc: 'Generics + Indian brand names (Crocin, Augmentin, Azithral) with local dosages and routes.',
  },
  {
    icon: ShieldCheck,
    color: 'icon-amber',
    title: 'Safety & Drug Checker',
    desc: 'Real-time alerts for drug interactions, allergies, renal & hepatic dose adjustments.',
  },
  {
    icon: FileSearch,
    color: 'icon-emerald',
    title: 'OCR Lab Report RAG',
    desc: 'Upload scanned lab PDFs → intelligent OCR + pgvector semantic insights instantly.',
  },
];

const WORKFLOW = [
  { step: '01', title: 'Micro-Note Input', desc: 'Quickly type 2-3 lines of symptoms, vitals, and age.', icon: ClipboardList },
  { step: '02', title: 'NLP + RAG Retrieval', desc: 'LangChain parses entities & retrieves ICMR/NHP guidelines from pgvector.', icon: Brain },
  { step: '03', title: 'Clinical Reasoning', desc: 'Gemini outputs ranked differentials, treatments, Indian formulations.', icon: Microscope },
  { step: '04', title: 'Safe Prescription', desc: 'Safety flags verify contraindications before you finalize the plan.', icon: ShieldCheck },
];

const STATS = [
  { value: '< 3s', label: 'Avg. OPD Latency', sub: 'real-time reasoning' },
  { value: 'ICMR', label: 'NHP Aligned', sub: 'localized guidelines' },
  { value: 'pgvector', label: 'Hybrid RAG', sub: 'semantic + keyword' },
  { value: '100%', label: 'HIPAA-grade', sub: 'data isolation' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white relative flex flex-col overflow-x-hidden text-[#111111]">
      {/* Fixed soft ambient orbs */}
      <div className="fixed top-[-200px] left-[-100px] w-[700px] h-[700px] bg-blue-600/3 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-100px] w-[600px] h-[600px] bg-blue-600/2 rounded-full blur-[120px] pointer-events-none" />

      {/* ─── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10">
              <Stethoscope className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-[#111111] tracking-tight text-base">MedSynexa</span>
              <span className="text-blue-600 text-[10px] font-bold ml-2 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100">AI</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-500 font-semibold">
            <a href="#features" className="hover:text-gray-900 transition-colors">Features</a>
            <a href="#workflow" className="hover:text-gray-900 transition-colors">Workflow</a>
            <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2 group"
            >
              Get Started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-6 pt-20 pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left — Copy */}
          <div className="lg:col-span-7 flex flex-col space-y-8 fade-in-up">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full bg-blue-50 border border-blue-100/50 text-xs font-semibold text-blue-700">
              <Zap className="h-3.5 w-3.5 text-blue-600" />
              Sub-10-Second Real-Time Clinical AI — Built for Indian OPDs
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#111111] tracking-tight leading-[1.1]">
                Clinical Intelligence
                <br />
                <span className="text-blue-600">At the Speed of Care.</span>
              </h1>
              <p className="text-base text-gray-500 leading-relaxed max-w-xl">
                Indian doctors spend under 2 minutes per OPD patient. MedSynexa delivers instant differential diagnoses, ICMR-aligned treatments, Indian generic dosages, and real-time safety guardrails — all grounded in your medical library.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="btn-primary px-7 py-3.5 text-sm flex items-center gap-2.5 group"
              >
                Launch Free Copilot
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="btn-ghost px-7 py-3.5 text-sm flex items-center gap-2.5"
              >
                Sign In to Dashboard
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
              {STATS.map((s) => (
                <div key={s.value} className="space-y-0.5">
                  <div className="text-2xl font-black text-blue-600">{s.value}</div>
                  <div className="text-xs font-bold text-[#111111]">{s.label}</div>
                  <div className="text-[10px] text-gray-400">{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Feature Cards */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`bg-white rounded-2xl border border-gray-200/80 p-5 shadow-sm transition-all hover:shadow-md hover:border-gray-300 flex flex-col gap-4 ${i % 2 === 1 ? 'mt-6' : ''}`}
                >
                  <div className={`icon-container ${f.color} h-10 w-10`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-[#111111] mb-1.5">{f.title}</h3>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Workflow ─────────────────────────────────────────── */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-16 w-full relative z-10">
        <div className="text-center mb-12">
          <div className="badge badge-blue mx-auto mb-3">Clinical Workflow</div>
          <h2 className="text-2xl font-bold text-[#111111] tracking-tight mb-2">
            From Notes to Plan in Seconds
          </h2>
          <p className="text-gray-500 text-xs max-w-sm mx-auto">
            A 4-step pipeline that turns messy OPD notes into structured, evidence-based clinical decisions.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200/80 p-8 md:p-12 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {WORKFLOW.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={w.step} className="flex flex-col items-center text-center space-y-4 relative">
                  {/* connector line */}
                  {i < WORKFLOW.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[60%] w-full h-px bg-gradient-to-r from-blue-500/10 to-transparent" />
                  )}
                  <div className="relative z-10 h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/10 border border-blue-400/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-[10px] font-bold text-blue-600 tracking-widest">{w.step}</div>
                  <div>
                    <h4 className="text-xs font-bold text-[#111111] mb-1.5">{w.title}</h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Trust Section ────────────────────────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-16 w-full relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, color: 'icon-blue', title: 'Data Isolated per Doctor', desc: 'Your uploaded textbooks and patient data are namespaced entirely to your account. No cross-contamination between users.' },
            { icon: Globe, color: 'icon-indigo', title: 'ICMR & NHP Aligned', desc: 'Clinical outputs reflect Indian National Health Programme guidelines, ensuring region-specific accuracy.' },
            { icon: Users, color: 'icon-emerald', title: 'Built for Indian OPDs', desc: 'Designed for 80+ patient/day workloads — not Western EHR complexity. Fast, simple, and local.' },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-sm hover:border-gray-300 transition-colors flex flex-col gap-4">
                <div className={`icon-container ${t.color} h-10 w-10`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#111111] mb-2">{t.title}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20 w-full relative z-10">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-10 md:p-14 text-center relative overflow-hidden shadow-xl shadow-blue-500/10">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <Heart className="h-6 w-6 text-white heart-pulse" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-2">
                Start Diagnosing Smarter Today
              </h2>
              <p className="text-blue-100/90 text-sm max-w-md mx-auto">
                Join MedSynexa — the AI copilot that works as fast as you think.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/register" className="bg-white text-blue-600 border border-white hover:bg-blue-50 px-6 py-3 rounded-xl font-bold text-xs shadow-sm transition-all hover:scale-[1.01]">
                Create Free Account
              </Link>
              <Link href="/login" className="bg-transparent text-white hover:bg-white/10 border border-white/20 px-6 py-3 rounded-xl font-bold text-xs transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-8 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <Stethoscope className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-xs font-bold text-gray-800">MedSynexa AI</span>
          </div>
          <div className="text-[10px] text-gray-400 font-semibold">
            © {new Date().getFullYear()} MedSynexa. Built for Indian Healthcare. Powered by LangChain, Gemini & pgvector.
          </div>
          <div className="flex gap-6 text-[10px] text-gray-400 font-bold">
            <Link href="/login" className="hover:text-gray-800 transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-gray-800 transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

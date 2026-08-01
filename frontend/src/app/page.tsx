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
  BookOpenCheck,
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
    color: 'icon-teal',
    title: 'Differential Diagnosis',
    desc: 'Ranked likelihood list with ICD-10 codes from raw patient notes — in under 3 seconds.',
  },
  {
    icon: Pill,
    color: 'icon-cyan',
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
    <div className="min-h-screen gradient-bg relative flex flex-col overflow-x-hidden">
      {/* Fixed ambient orbs */}
      <div className="fixed top-[-200px] left-[-100px] w-[700px] h-[700px] bg-teal-600/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-[-200px] right-[-100px] w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* ─── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/5 backdrop-blur-xl bg-[#03080f]/80">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/20">
              <Stethoscope className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-base">MedSynexa</span>
              <span className="text-teal-400 text-[10px] font-bold ml-2 px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20">AI</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-[#8fa3bb]">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#8fa3bb] hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link
              href="/register"
              className="btn-primary text-sm px-5 py-2.5 flex items-center gap-2 group"
            >
              Get Started
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </header>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-6 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

          {/* Left — Copy */}
          <div className="lg:col-span-7 flex flex-col space-y-8 fade-in-up">
            {/* Trust badge */}
            <div className="inline-flex items-center gap-2 self-start px-4 py-2 rounded-full glass border border-teal-500/20 text-xs font-semibold text-teal-300">
              <Zap className="h-3.5 w-3.5 text-teal-400" />
              Sub-10-Second Real-Time Clinical AI — Built for Indian OPDs
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.05]">
                Clinical Intelligence
                <br />
                <span className="gradient-text">At the Speed of Care.</span>
              </h1>
              <p className="text-lg text-[#8fa3bb] leading-relaxed max-w-2xl">
                Indian doctors spend under 2 minutes per OPD patient. MedSynexa delivers instant differential diagnoses, ICMR-aligned treatments, Indian generic dosages, and real-time safety guardrails — all grounded in your textbooks.
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/5">
              {STATS.map((s) => (
                <div key={s.value} className="space-y-0.5">
                  <div className="text-xl font-extrabold text-teal-400">{s.value}</div>
                  <div className="text-xs font-semibold text-white">{s.label}</div>
                  <div className="text-[10px] text-[#4a637a]">{s.sub}</div>
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
                  className={`card-clinical p-5 rounded-2xl flex flex-col gap-4 ${i % 2 === 1 ? 'mt-6' : ''}`}
                >
                  <div className={`icon-container ${f.color} h-10 w-10`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                    <p className="text-xs text-[#8fa3bb] leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Workflow ─────────────────────────────────────────── */}
      <section id="workflow" className="max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="text-center mb-12">
          <div className="badge badge-teal mx-auto mb-4">Clinical Workflow</div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">
            From Notes to Plan in Seconds
          </h2>
          <p className="text-[#8fa3bb] text-sm max-w-xl mx-auto">
            A 4-step pipeline that turns messy OPD notes into structured, evidence-based clinical decisions.
          </p>
        </div>

        <div className="glass-elevated rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {WORKFLOW.map((w, i) => {
              const Icon = w.icon;
              return (
                <div key={w.step} className="flex flex-col items-center text-center space-y-4 relative">
                  {/* connector line */}
                  {i < WORKFLOW.length - 1 && (
                    <div className="hidden md:block absolute top-6 left-[60%] w-full h-px bg-gradient-to-r from-teal-500/30 to-transparent" />
                  )}
                  <div className="relative z-10 h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/20">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-[10px] font-bold text-teal-500 tracking-widest">{w.step}</div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1.5">{w.title}</h4>
                    <p className="text-xs text-[#8fa3bb] leading-relaxed">{w.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Trust Section ────────────────────────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: ShieldCheck, color: 'icon-teal', title: 'Data Isolated per Doctor', desc: 'Your uploaded textbooks and patient data are namespaced entirely to your account. No cross-contamination between users.' },
            { icon: Globe, color: 'icon-cyan', title: 'ICMR & NHP Aligned', desc: 'Clinical outputs reflect Indian National Health Programme guidelines, ensuring region-specific accuracy.' },
            { icon: Users, color: 'icon-emerald', title: 'Built for Indian OPDs', desc: 'Designed for 80+ patient/day workflows — not Western EHR complexity. Fast, simple, and local.' },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.title} className="card-clinical p-6 rounded-2xl flex flex-col gap-4">
                <div className={`icon-container ${t.color} h-10 w-10`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white mb-2">{t.title}</h3>
                  <p className="text-xs text-[#8fa3bb] leading-relaxed">{t.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── CTA Banner ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 pb-20 w-full">
        <div className="glass-elevated rounded-3xl p-10 md:p-16 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5" />
          <div className="relative z-10 flex flex-col items-center gap-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-xl shadow-teal-500/25 border border-teal-400/20">
              <Heart className="h-8 w-8 text-white heart-pulse" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">
                Start Diagnosing Smarter Today
              </h2>
              <p className="text-[#8fa3bb] text-base max-w-xl mx-auto">
                Join MedSynexa — the AI copilot that works as fast as you think.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/register" className="btn-primary px-8 py-3.5 text-sm flex items-center gap-2 group">
                Create Free Account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link href="/login" className="btn-ghost px-8 py-3.5 text-sm">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center">
              <Stethoscope className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">MedSynexa AI</span>
          </div>
          <div className="text-xs text-[#4a637a]">
            © {new Date().getFullYear()} MedSynexa. Built for Indian Healthcare. Powered by LangChain, Gemini & pgvector.
          </div>
          <div className="flex gap-6 text-xs text-[#4a637a]">
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Stethoscope,
  ArrowRight,
  Zap,
  FileSearch,
  Pill,
  Users,
  BookOpen,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Lock,
  FileText,
  Sparkles,
  Server,
  ChevronRight,
  Database,
  Search,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SanitizedMedicalContent } from "../components/SanitizedMedicalContent";

const FEATURES = [
  {
    id: "opd",
    title: "OPD Voice Dictation & AI Copilot",
    href: "/opd",
    icon: Stethoscope,
    category: "Consultation Suite",
    desc: "Transforms ambient clinical dictation into structured SOAP notes, differential diagnoses, and ICMR treatment protocols in sub-10 seconds.",
    metrics: "98% Faster Dictation",
    previewData: {
      patient: "Rajesh Kumar, 45M",
      dictation: "Patient presents with persistent dry cough, low grade fever for 4 days, mild breathlessness on exertion.",
      diagnosis: "Acute Bronchitis (ICD-10 J40) - Rule out atypical pneumonia",
      plan: "Azithromycin 500mg OD x 5 days, Steam inhalation, Monitor SpO2 twice daily.",
    },
  },
  {
    id: "xray",
    title: "X-Ray Pathology Radiology Portal",
    href: "/xray",
    icon: Zap,
    category: "Diagnostic Imaging",
    desc: "Automated deep-learning multi-class lesion detection for chest X-rays. Rapidly screens for consolidation, cardiomegaly, and pleural effusion.",
    metrics: "<3s Radiologist Draft",
    previewData: {
      study: "Chest Radiogram (PA View)",
      impression: "Left lower lobe opacity consistent with focal consolidation.",
      status: "Stable - Verified against Radiologist Guidelines",
    },
  },
  {
    id: "drug-safety",
    title: "Drug Safety & Interaction Engine",
    href: "/drug-safety",
    icon: Pill,
    category: "Medication Risk",
    desc: "Instant multi-drug interaction screening, organ dosage adjustments, contraindication warnings, and cost-effective generic alternatives.",
    metrics: "100% Contraindication Flagging",
    previewData: {
      prescription: "Warfarin + Fluconazole",
      warning: "CRITICAL: Fluconazole inhibits CYP2C9, significantly increasing Warfarin concentration & bleeding risk.",
      recommendation: "Consider alternative antifungal agent or monitor INR daily.",
    },
  },
  {
    id: "documents",
    title: "Lab Report OCR & PDF Parser",
    href: "/documents",
    icon: FileSearch,
    category: "Document Intelligence",
    desc: "Extracts unstructured PDF lab test reports, converts unstructured tables into normalized EHR metrics, and highlights abnormal values.",
    metrics: "Structured Extraction",
    previewData: {
      file: "CBC_Lipid_Panel_082026.pdf",
      extracted: [
        { test: "Hemoglobin", result: "11.2 g/dL", status: "Mild Anemia" },
        { test: "Total Cholesterol", result: "245 mg/dL", status: "Elevated" },
      ],
    },
  },
  {
    id: "patients",
    title: "Patient Directory & EHR Records",
    href: "/patients",
    icon: Users,
    category: "Longitudinal EHR",
    desc: "Complete patient history timeline, past prescription logs, chronic disease tracking, and instant EHR record summaries.",
    metrics: "360° Patient Context",
    previewData: {
      recordsCount: "12 Encounters",
      primaryRisk: "Hypertension Stage II, Type 2 Diabetes",
      lastVisit: "August 1, 2026 - OPD Follow-up",
    },
  },
  {
    id: "library",
    title: "Medical Knowledge RAG Search",
    href: "/library",
    icon: BookOpen,
    category: "Knowledge Base",
    desc: "Semantic vector search across clinical guidelines, ICMR standard treatment workflows, and hospital knowledge bases.",
    metrics: "Sub-Second Vector Search",
    previewData: {
      query: "First-line therapy for adult uncomplicated UTI in India",
      answer: "Nitrofurantoin 100mg BD x 5 days as per ICMR 2025 guidelines.",
    },
  },
];

export default function HighConvertingLandingPage() {
  const [activeFeature, setActiveFeature] = useState(FEATURES[0]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] selection:bg-teal-200 selection:text-teal-900 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-200/80 bg-gradient-to-b from-teal-50/40 via-white to-[#F8FAFC]">
        {/* Decorative background ambient dots */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f766e08_1px,transparent_1px),linear-gradient(to_bottom,#0f766e08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-teal-100/80 text-teal-800 border border-teal-200 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Next-Gen Clinical AI Decision Support Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Intelligent Healthcare Workflows,{" "}
              <span className="text-teal-700 underline decoration-teal-300 decoration-wavy underline-offset-8">
                Accelerated by AI
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 font-medium leading-relaxed">
              Sub-second clinical reasoning, automated PDF lab extraction, ambient voice OPD dictation, and X-ray radiology insights—built specifically for modern clinical practice.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link href="/opd" className="btn-teal text-sm py-3 px-7 w-full sm:w-auto shadow-lg shadow-teal-700/20">
                <span>Launch Clinical Copilot Demo</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="btn-secondary text-sm py-3 px-7 w-full sm:w-auto">
                <span>Explore Clinical Features</span>
              </a>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-8 border-t border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-500 text-xs font-semibold">
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/70 border border-slate-200/70 shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/70 border border-slate-200/70 shadow-sm">
                <Lock className="w-4 h-4 text-teal-600" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/70 border border-slate-200/70 shadow-sm">
                <Server className="w-4 h-4 text-emerald-600" />
                <span>SOC2 Type II Certified</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/70 border border-slate-200/70 shadow-sm">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>99.9% Uptime SLA</span>
              </div>
            </div>
          </div>

          {/* Interactive Live UI Preview Showcase */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-xs text-slate-400 font-mono ml-2">medsynexa.ai / clinical-copilot</span>
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800">
                Live Interactive Preview
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/50">
              <div className="lg:col-span-4 space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Select Feature Suite</span>
                {FEATURES.map((feat) => {
                  const Icon = feat.icon;
                  const isSelected = activeFeature.id === feat.id;
                  return (
                    <button
                      key={feat.id}
                      onClick={() => setActiveFeature(feat)}
                      className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${
                        isSelected
                          ? "bg-teal-50 border-teal-300 text-teal-900 font-semibold shadow-sm"
                          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isSelected ? "text-teal-700" : "text-slate-400"}`} />
                        <span>{feat.title}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-teal-700" : "text-slate-300"}`} />
                    </button>
                  );
                })}
              </div>

              <div className="lg:col-span-8 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div>
                      <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {activeFeature.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{activeFeature.title}</h3>
                    </div>
                    <Link href={activeFeature.href} className="btn-teal text-xs py-1.5 px-3">
                      Open Module
                    </Link>
                  </div>

                  <p className="text-xs text-slate-600 mb-4">{activeFeature.desc}</p>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                    <SanitizedMedicalContent content={activeFeature.previewData} badgeLabel={activeFeature.metrics} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Output Sanitized & EHR Formatted
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">{activeFeature.metrics}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Matrix / Grid Section */}
      <section id="features" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Comprehensive Platform Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Modern Clinical Workflow
            </h2>
            <p className="text-sm text-slate-600">
              Every tool is optimized for clinical precision, sub-second latency, and zero AI clutter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="p-6 rounded-2xl border border-slate-200 bg-white hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
                      {feat.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                      {feat.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed mb-4">{feat.desc}</p>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {feat.metrics}
                    </span>
                    <Link
                      href={feat.href}
                      className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      <span>View Feature</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Workflow Sequence */}
      <section className="py-20 bg-[#F8FAFC] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Seamless Implementation
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              3 Steps to Clinical Automation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center mb-4">
                1
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Upload Data or Dictate Voice</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Seamlessly upload lab PDFs, DICOM X-rays, or speak directly into the OPD Ambient Copilot.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center mb-4">
                2
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Sanitized AI Reasoning Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                MedSynexa parses unstructured text, strips robotic clutter, checks ICMR guidelines, and flags drug interactions.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm relative">
              <div className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold text-sm flex items-center justify-center mb-4">
                3
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-2">Verified EHR-Ready Export</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Review structured clinical summaries, edit differential diagnoses, and export to hospital EHR systems with 1 click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance Banner */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enterprise Clinical Data Protection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Zero Data Retention & Uncompromising Security
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Patient privacy is paramount. MedSynexa employs BAA-backed zero-data-retention AI pipelines, end-to-end AES-256 encryption at rest and in transit, and complete audit trail logging.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                <Lock className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">HIPAA & DISHA Aligned</h4>
                  <p className="text-[11px] text-slate-400">Strict patient health information protection</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                <Server className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Provider-in-the-Loop</h4>
                  <p className="text-[11px] text-slate-400">All AI recommendations require physician review</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 text-slate-400 text-xs py-10 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-teal-400" />
              <span className="text-base font-bold text-white tracking-tight">MedSynexa Clinical AI</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/opd" className="hover:text-white transition-colors">OPD Copilot</Link>
              <Link href="/xray" className="hover:text-white transition-colors">X-Ray Radiology</Link>
              <Link href="/drug-safety" className="hover:text-white transition-colors">Drug Safety</Link>
              <Link href="/documents" className="hover:text-white transition-colors">Lab PDFs</Link>
              <Link href="/patients" className="hover:text-white transition-colors">Patients</Link>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <p>© {new Date().getFullYear()} MedSynexa Health Inc. All rights reserved.</p>
            <p className="max-w-xl text-center md:text-right">
              <strong className="text-slate-400">Clinical Disclaimer:</strong> MedSynexa is an AI clinical decision support tool designed for licensed healthcare professionals. It does not replace medical judgment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

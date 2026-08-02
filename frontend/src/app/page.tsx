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
  ChevronDown,
  Mic,
  Brain,
  HelpCircle,
  Eye,
  KeyRound,
  Database,
} from "lucide-react";
import { Navbar } from "../components/Navbar";
import { SanitizedMedicalContent } from "../components/SanitizedMedicalContent";

// Core Platform Capabilities matching exact marketing pillars
const MARKETING_PILLARS = [
  {
    icon: Mic,
    title: "Real-Time Conversation Capture",
    desc: "Captures doctor–patient conversations in real time using Speech-to-Text dictation.",
    badge: "Speech-to-Text",
    color: "teal",
  },
  {
    icon: FileText,
    title: "Automated Structured Documentation",
    desc: "Automatically generates structured SOAP notes, eliminating tedious manual physician charting.",
    badge: "SOAP Automation",
    color: "emerald",
  },
  {
    icon: BookOpen,
    title: "Evidence-Based Medical RAG",
    desc: "Retrieves trusted medical knowledge through a Medical RAG pipeline for evidence-based clinical support.",
    badge: "Medical RAG",
    color: "cyan",
  },
  {
    icon: Brain,
    title: "Contextual Differential Diagnoses",
    desc: "Suggests differential diagnoses based on patient symptoms, vitals, and clinical context.",
    badge: "Clinical Reasoning",
    color: "indigo",
  },
  {
    icon: Users,
    title: "Unified Patient EHR History",
    desc: "Maintains a unified longitudinal history with consultations, prescriptions, reports, and diagnoses.",
    badge: "Longitudinal EHR",
    color: "teal",
  },
  {
    icon: Eye,
    title: "Vision AI Chest X-Ray Analysis",
    desc: "Analyzes chest X-rays using Vision AI to assist clinicians in detecting common thoracic diseases.",
    badge: "Vision AI",
    color: "emerald",
  },
  {
    icon: KeyRound,
    title: "Privacy-First Data Architecture",
    desc: "Secures patient data with end-to-end encryption, role-based access, and zero data retention.",
    badge: "HIPAA Compliant",
    color: "cyan",
  },
];

const FEATURES = [
  {
    id: "opd",
    title: "OPD Voice Dictation & AI Copilot",
    href: "/opd",
    icon: Stethoscope,
    category: "Consultation Suite",
    desc: "Real-time speech-to-text dictation converting clinical conversations into structured SOAP notes and differential diagnosis suggestions.",
    metrics: "SOAP Note Automation",
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
    desc: "Assists radiographers and doctors by analyzing chest X-rays using Vision AI for common thoracic disease indicators.",
    metrics: "Vision AI Decision Support",
    previewData: {
      study: "Chest Radiogram (PA View)",
      impression: "Left lower lobe opacity consistent with focal consolidation.",
      status: "Stable - Radiologist Review Required",
    },
  },
  {
    id: "drug-safety",
    title: "Drug Safety & Interaction Engine",
    href: "/drug-safety",
    icon: Pill,
    category: "Medication Risk",
    desc: "Multi-drug interaction screening, patient allergy conflict alerts, and contraindication flags prior to prescribing.",
    metrics: "Safety Guardrails",
    previewData: {
      prescription: "Warfarin + Fluconazole",
      warning: "CAUTION: Fluconazole inhibits CYP2C9, increasing Warfarin concentration & bleeding risk.",
      recommendation: "Consider alternative antifungal agent or monitor INR.",
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
    desc: "Unified patient history consolidating past consultations, prescriptions, radiology reports, and medical allergy logs.",
    metrics: "360° EHR Record Vault",
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
    desc: "Semantic vector RAG retrieval across trusted medical guidelines and standard clinical workflows for evidence-based decision support.",
    metrics: "Evidence-Based RAG",
    previewData: {
      query: "First-line therapy for adult uncomplicated UTI",
      answer: "Nitrofurantoin 100mg BD x 5 days as per standard clinical guidelines.",
    },
  },
];

const FAQS = [
  {
    q: "What is MedSynexa?",
    a: "MedSynexa is an AI-Powered Clinical Intelligence Platform built using a Medical RAG Pipeline. It assists clinicians by capturing voice dictation, generating structured SOAP notes, suggesting differential diagnoses, analyzing chest X-rays with Vision AI, and maintaining unified patient health records.",
  },
  {
    q: "How does Medical RAG support evidence-based clinical decisions?",
    a: "Our RAG pipeline performs high-dimensional vector search across trusted medical reference literature and guidelines, allowing clinicians to review evidence-grounded recommendations without manual searching.",
  },
  {
    q: "How is patient data secured on MedSynexa?",
    a: "Patient privacy is protected through end-to-end encryption (AES-256), role-based access control (RBAC), and a zero-data-retention architecture. Data is never shared or used to train public LLM models.",
  },
  {
    q: "Does MedSynexa replace physician judgment?",
    a: "No. MedSynexa is designed strictly as a clinical decision support tool for licensed healthcare professionals. All AI-generated notes, diagnostic suggestions, and treatment drafts require final physician verification.",
  },
];

export default function HighConvertingLandingPage() {
  const [activeFeature, setActiveFeature] = useState(FEATURES[0]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-[#F4F7F6] text-[#0F172A] selection:bg-teal-200 selection:text-teal-900 flex flex-col font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32 border-b border-slate-200/80">
        {/* Animated Background Mesh Glows */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-teal-400/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-teal-100/90 text-teal-800 border border-teal-300 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-spin" style={{ animationDuration: '6s' }} />
              <span>AI-Powered Clinical Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Presenting{" "}
              <span className="gradient-text-teal underline decoration-teal-300 decoration-wavy underline-offset-8">
                MedSynexa
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-700 font-bold leading-relaxed max-w-2xl mx-auto">
              An AI-Powered Clinical Intelligence Platform built using a Medical RAG Pipeline for evidence-based clinical support and documentation automation.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/opd" className="btn-teal text-sm py-3.5 px-8 w-full sm:w-auto shadow-xl shadow-teal-700/25">
                <span>Launch Clinical Copilot</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#features" className="btn-secondary text-sm py-3.5 px-8 w-full sm:w-auto">
                <span>Explore Capabilities</span>
              </a>
            </div>

            {/* Trust Badges Strip */}
            <div className="pt-10 border-t border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 text-xs font-bold">
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-sm">
                <Lock className="w-4 h-4 text-teal-600 shrink-0" />
                <span>End-to-End Encrypted</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-sm">
                <Server className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Role-Based Access</span>
              </div>
              <div className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-white/80 border border-slate-200/80 shadow-2xs backdrop-blur-sm">
                <Activity className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Zero Data Retention</span>
              </div>
            </div>
          </div>

          {/* Interactive Live UI Preview Showcase Card */}
          <div className="mt-14 max-w-5xl mx-auto relative">
            {/* Floating Left Live Widget */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl absolute -left-12 top-1/3 z-20 animate-float-slow">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                <Mic className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Speech-to-Text</span>
                <span className="text-xs font-extrabold text-slate-800">Real-Time Dictation</span>
              </div>
            </div>

            {/* Floating Right Live Widget */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl absolute -right-12 bottom-1/4 z-20 animate-float-slow" style={{ animationDelay: '2s' }}>
              <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Medical RAG</span>
                <span className="text-xs font-extrabold text-teal-800">Evidence Retrieval</span>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden hover:shadow-teal-900/10 transition-shadow">
              <div className="bg-slate-900 px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2 hidden sm:inline">medsynexa.ai / clinical-platform</span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 bg-teal-950/90 px-3 py-1 rounded-full border border-teal-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  Interactive Feature Showcase
                </span>
              </div>

              <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50/60">
                <div className="lg:col-span-4 space-y-2.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Select Feature Module
                  </span>
                  {FEATURES.map((feat) => {
                    const Icon = feat.icon;
                    const isSelected = activeFeature.id === feat.id;
                    return (
                      <button
                        key={feat.id}
                        onClick={() => setActiveFeature(feat)}
                        className={`w-full text-left p-3.5 rounded-2xl border text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-50 border-teal-300 text-teal-900 font-extrabold shadow-sm translate-x-1"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span>{feat.title}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? "text-teal-700" : "text-slate-300"}`} />
                      </button>
                    );
                  })}
                </div>

                <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                      <div>
                        <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                          {activeFeature.category}
                        </span>
                        <h3 className="text-lg font-extrabold text-slate-900 mt-1">{activeFeature.title}</h3>
                      </div>
                      <Link href={activeFeature.href} className="btn-teal text-xs py-2 px-4 shadow-sm">
                        Open Module
                      </Link>
                    </div>

                    <p className="text-xs text-slate-600 mb-4 leading-relaxed font-medium">{activeFeature.desc}</p>

                    <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <SanitizedMedicalContent content={activeFeature.previewData} badgeLabel={activeFeature.metrics} />
                    </div>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Decision Support Output
                    </span>
                    <span className="font-mono font-bold text-xs text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">{activeFeature.metrics}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Platform Capabilities (Marketing Pillars Grid) */}
      <section id="features" className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-3.5 py-1 rounded-full border border-teal-200">
              What MedSynexa Does
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              AI-Powered Clinical Intelligence
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Streamlining clinical workflows, evidence-based reasoning, and patient records.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MARKETING_PILLARS.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200/90 bg-white hover:border-teal-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group overflow-hidden hover:-translate-y-1"
                >
                  <div className="h-1.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

                  <div className="p-6">
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
                      {pillar.badge}
                    </span>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-2 group-hover:text-teal-700 transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium mb-4">{pillar.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3-Step Implementation Sequence */}
      <section className="py-20 bg-[#F4F7F6] border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
              Seamless Workflow Integration
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              3 Steps to Clinical Automation
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-md shadow-teal-700/20">
                1
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Real-Time Speech & Document Capture</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Capture ambient doctor-patient conversations via Speech-to-Text or upload lab PDFs and chest X-rays.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-md shadow-teal-700/20">
                2
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Medical RAG & Vision AI Pipeline</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Retrieves evidence-based medical knowledge, suggests differential diagnoses, and checks drug safety.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm relative hover:shadow-md transition-shadow">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-teal-700 to-emerald-800 text-white font-extrabold text-base flex items-center justify-center mb-5 shadow-md shadow-teal-700/20">
                3
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mb-2">Physician Review & Unified EHR</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Review structured SOAP notes, edit differential diagnoses, and update longitudinal patient health records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical FAQ Accordion Section */}
      <section className="py-20 bg-white border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-14 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200 flex items-center justify-center gap-1.5 w-fit mx-auto">
              <HelpCircle className="w-3.5 h-3.5 text-teal-600" /> Frequently Asked Questions
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Platform & Clinical Decision Support FAQs
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between font-bold text-slate-900 text-sm hover:text-teal-700 transition-colors"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-teal-600' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 pt-0 text-xs text-slate-600 leading-relaxed font-medium border-t border-slate-200/60 pt-3 bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & Compliance Banner */}
      <section className="py-16 bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Enterprise Clinical Data Protection</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Privacy-First Data Protection & Encryption
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium max-w-2xl">
                Patient privacy is paramount. MedSynexa employs end-to-end encryption (AES-256), role-based access control (RBAC), and zero-data-retention AI pipelines to safeguard sensitive medical records.
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3">
              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                <Lock className="w-5 h-5 text-teal-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Role-Based Access Control</h4>
                  <p className="text-[11px] text-slate-400 font-medium">RBAC & granular permission controls</p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center gap-3">
                <Server className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Provider-in-the-Loop</h4>
                  <p className="text-[11px] text-slate-400 font-medium">All AI outputs require physician review</p>
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
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">MedSynexa Clinical AI</span>
            </div>
            <div className="flex items-center gap-6 font-semibold">
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
              <strong className="text-slate-400">Clinical Disclaimer:</strong> MedSynexa is an AI clinical decision support tool built to assist healthcare professionals. It does not replace medical judgment or provide diagnostic certainty.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, BrainCircuit, Database, ShieldCheck, Zap, CloudLightning, FileText, ChevronRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen gradient-bg relative flex flex-col justify-between overflow-x-hidden">
      {/* Background ambient glowing spheres */}
      <div className="absolute top-10 left-10 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[100px] -z-10" />

      {/* Header / Navbar */}
      <header className="border-b border-slate-900/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 border border-indigo-400/30">
            <Sparkles className="h-4.5 w-4.5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">NovaDocs <span className="text-indigo-400">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors px-4 py-2">
            Sign In
          </Link>
          <Link
            href="/register"
            className="text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/25 px-5 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 flex flex-col text-left space-y-6">
            {/* Tagline pill */}
            <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-semibold text-indigo-300">
              <Zap className="h-3.5 w-3.5" />
              <span>Next-Gen Document Intelligence</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-none">
              Analyze Documents. <br />
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                Retrieve Deep Insights.
              </span>
            </h1>

            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              NovaDocs AI uses advanced Retrieval-Augmented Generation (RAG) to scan PDFs and Word documents, index their context dynamically in Pinecone, and provide conversational answers with verifiable citations and references.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/register"
                className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all group border border-indigo-400/20 active:scale-[0.98]"
              >
                Start Free Analysis
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="px-6 py-3.5 bg-slate-900/80 hover:bg-slate-800 text-slate-300 font-semibold rounded-2xl border border-slate-800 transition-all active:scale-[0.98]"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Micro Stats */}
            <div className="grid grid-cols-3 gap-6 pt-10 border-t border-slate-900/60 max-w-md">
              <div>
                <div className="text-2xl font-bold text-white">99.9%</div>
                <div className="text-xs text-slate-500 font-medium">Uptime Guarantee</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">&lt; 1.5s</div>
                <div className="text-xs text-slate-500 font-medium">RAG Query Latency</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">Multi-LLM</div>
                <div className="text-xs text-slate-500 font-medium">OpenAI & Gemini</div>
              </div>
            </div>
          </div>

          {/* Interactive Feature Mockup Grid */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="glass-panel p-6 rounded-3xl border-slate-800/60 flex flex-col justify-between h-48 hover:-translate-y-1 transition-all group">
              <BrainCircuit className="h-8 w-8 text-indigo-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-md font-bold text-white mb-1">Intelligent RAG</h3>
                <p className="text-xs text-slate-400">Contextual vector chunks matching semantic intent.</p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-slate-800/60 flex flex-col justify-between h-48 hover:-translate-y-1 transition-all group mt-6">
              <Database className="h-8 w-8 text-fuchsia-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-md font-bold text-white mb-1">Pinecone Indexing</h3>
                <p className="text-xs text-slate-400">Millisecond retrieval with isolated namespace security.</p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-slate-800/60 flex flex-col justify-between h-48 hover:-translate-y-1 transition-all group">
              <ShieldCheck className="h-8 w-8 text-emerald-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-md font-bold text-white mb-1">JWT Security</h3>
                <p className="text-xs text-slate-400">Role-isolated token rotations secure document endpoints.</p>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border-slate-800/60 flex flex-col justify-between h-48 hover:-translate-y-1 transition-all group mt-6">
              <CloudLightning className="h-8 w-8 text-sky-400 group-hover:scale-110 transition-transform" />
              <div>
                <h3 className="text-md font-bold text-white mb-1">Cloudinary Storage</h3>
                <p className="text-xs text-slate-400">Enterprise file storage bypasses local DB locks.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900/60 py-8 px-6 text-center text-xs text-slate-500 max-w-7xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div>&copy; {new Date().getFullYear()} NovaDocs AI. All rights reserved. Built with Next.js 15, Pinecone, and Gemini.</div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-slate-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-400 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-400 transition-colors">API Docs</a>
        </div>
      </footer>
    </div>
  );
}

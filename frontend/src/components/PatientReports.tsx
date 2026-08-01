'use client';

import React, { useState } from 'react';
import {
  FileText,
  Loader2,
  UserPlus,
  HeartPulse,
  Activity,
  BookOpen,
  AlertCircle,
  ShieldAlert,
  Zap,
  Stethoscope,
  ChevronRight,
} from 'lucide-react';
import { api } from '../lib/api';

interface DocumentItem {
  _id: string;
  filename: string;
}

interface PatientReportsProps {
  documents: DocumentItem[];
}

export const PatientReports: React.FC<PatientReportsProps> = ({ documents }) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [condition, setCondition] = useState('');
  const [documentId, setDocumentId] = useState<string>(documents.length > 0 ? documents[0]._id : '');

  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Only show general (non lab_report) documents as textbooks
  const textbooks = documents;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !condition || !documentId) {
      setError('Please fill in all fields and select a textbook.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setReport(null);

    try {
      const patientRes = await api.post('/opd/patients', {
        name,
        age: Number(age),
        gender,
        contactNumber: '',
        medicalHistory: '',
      });
      const patientId = patientRes.data.patient._id;

      const reportRes = await api.post('/opd/reports/generate', {
        patientId,
        documentId,
        condition,
      });

      setReport(reportRes.data.report);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectedBook = textbooks.find(d => d._id === documentId);

  return (
    <div className="h-full flex flex-col overflow-hidden gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E2E8F0] px-5 py-3.5 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-indigo h-10 w-10">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">Textbook Query</h2>
              <span className="badge badge-indigo text-[10px]">RAG Grounded</span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Ground clinical decisions in specific uploaded textbooks and journals
            </p>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">

        {/* ── Left: Form ── */}
        <div className="w-72 flex flex-col shrink-0 gap-4 overflow-y-auto">

          {/* Patient Details */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-xs font-bold text-[#0F172A] mb-4 flex items-center gap-2 uppercase tracking-wider">
              <UserPlus className="h-3.5 w-3.5 text-indigo-600" />
              Patient Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field px-3 py-2.5 text-sm"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="input-field px-3 py-2 text-sm"
                    placeholder="e.g. 45"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="input-field px-3 py-2 text-sm"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Clinical Reasoning */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
            <h3 className="text-xs font-bold text-[#0F172A] mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="h-3.5 w-3.5 text-rose-500" />
              Clinical Query
            </h3>
            <div className="space-y-3">
              
              {/* Textbook Selector */}
              <div>
                <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Reference Textbook</label>
                {textbooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-50 border border-amber-200 text-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-500" />
                    <p className="text-xs text-amber-700 font-medium">No textbooks uploaded yet</p>
                    <p className="text-[10px] text-amber-600">Upload a textbook PDF via Quick Upload in the sidebar</p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={documentId}
                      onChange={e => setDocumentId(e.target.value)}
                      className="input-field pl-9 pr-3 py-2.5 text-sm appearance-none"
                    >
                      <option value="" disabled>Select textbook…</option>
                      <option value="all">Global Library (All Textbooks)</option>
                      {textbooks.map(doc => (
                        <option key={doc._id} value={doc._id}>{doc.filename}</option>
                      ))}
                    </select>
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                  </div>
                )}
              </div>

              {/* Selected textbook pill */}
              {(selectedBook || documentId === 'all') && (
                <div className="flex items-center gap-1.5 p-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <FileText className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span className="text-[11px] text-indigo-700 font-medium truncate">
                    {documentId === 'all' ? 'Global Library (All Textbooks)' : selectedBook?.filename}
                  </span>
                </div>
              )}

              {/* Target Condition */}
              <div>
                <label className="block text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Target Condition</label>
                <input
                  type="text"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="input-field px-3 py-2.5 text-sm"
                  placeholder="e.g. Hypertension, Diabetes"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || textbooks.length === 0}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 rounded-xl mt-1"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Synthesizing from Textbook…
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 fill-white" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="flex-1 overflow-y-auto">

          {!report && !isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white rounded-2xl border border-dashed border-[#CBD5E1] p-10 gap-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Stethoscope className="h-8 w-8 text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">Select a textbook and enter a condition</p>
                <p className="text-xs text-[#94A3B8] mt-1">AI will extract verified causes, treatments, and lifestyle guidance from your uploaded textbook.</p>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center gap-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-400/20 blur-xl rounded-full" />
                <div className="h-14 w-14 bg-white border border-indigo-200 rounded-2xl flex items-center justify-center relative shadow-md">
                  <Activity className="h-7 w-7 text-indigo-500 animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-[#0F172A]">Running Textbook RAG…</h3>
                <p className="text-xs text-[#64748B] mt-1">Scanning vector embeddings for clinical reasoning.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 fade-in pb-4">

              {/* Simple Summary Card */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <HeartPulse className="h-24 w-24 text-indigo-500" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Simple Summary
                    </h3>
                    <span className="badge badge-slate text-[10px]">For Patient: <span className="font-bold text-[#0F172A]">{name}</span></span>
                  </div>
                  <p className="text-[#475569] text-sm leading-relaxed">{report.simpleSummary}</p>
                </div>
              </div>

              {/* Causes & Cures Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                  <h3 className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Causes & Etiology
                  </h3>
                  <p className="text-[#475569] text-sm leading-relaxed whitespace-pre-wrap">{report.causes}</p>
                </div>
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Cures & Management
                  </h3>
                  <p className="text-[#475569] text-sm leading-relaxed whitespace-pre-wrap">{report.cures}</p>
                </div>
              </div>

              {/* Diet & Lifestyle */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5">
                <h3 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Diet & Lifestyle Guidance
                </h3>
                <p className="text-[#475569] text-sm leading-relaxed whitespace-pre-wrap">{report.dietAndLifestyle}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

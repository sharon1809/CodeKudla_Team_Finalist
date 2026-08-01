'use client';

import React, { useState } from 'react';
import {
  FileText,
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
  const [weight, setWeight] = useState<string>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [condition, setCondition] = useState('');
  const [documentId, setDocumentId] = useState<string>(documents.length > 0 ? documents[0]._id : '');

  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const textbooks = documents;

  const handleGenerate = async () => {
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
        weight: weight ? Number(weight) : undefined,
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
    <div className="h-full flex flex-col overflow-hidden gap-4 p-5 bg-[#FAFAFA]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200/80 px-5 py-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-indigo h-10 w-10">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#111111] tracking-tight">Clinical Library Search</h2>
              <span className="badge badge-indigo text-[10px]">Guideline Grounded</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
              Cross-reference clinical decisions with medical textbooks and reference guidelines
            </p>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">

        {/* ── Left: Form ── */}
        <div className="w-72 flex flex-col shrink-0 gap-4 overflow-y-auto">

          {/* Patient Details */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
            <h3 className="text-[10px] font-bold text-[#111111] mb-4 flex items-center gap-2 uppercase tracking-wider">
              <UserPlus className="h-4 w-4 text-blue-600" />
              Patient Details
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="input-field px-3 py-2 text-xs"
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="input-field px-3 py-2 text-xs"
                    placeholder="e.g. 45"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="input-field px-2.5 py-2 text-xs"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Weight (kg)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  className="input-field px-3 py-2 text-xs"
                  placeholder="e.g. 68"
                />
              </div>
            </div>
          </div>

          {/* Clinical Query */}
          <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
            <h3 className="text-[10px] font-bold text-[#111111] mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="h-4 w-4 text-rose-500" />
              Clinical Query
            </h3>
            <div className="space-y-3">
              
              {/* Textbook Selector */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Reference Source</label>
                {textbooks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-amber-50 border border-amber-200 text-center gap-2">
                    <BookOpen className="h-5 w-5 text-amber-500" />
                    <p className="text-[10px] text-amber-700 font-bold">No references uploaded yet</p>
                    <p className="text-[9px] text-amber-600 leading-normal">Upload a medical guide PDF via Quick Upload in the sidebar</p>
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={documentId}
                      onChange={e => setDocumentId(e.target.value)}
                      className="input-field pl-9 pr-3 py-2.5 text-xs appearance-none"
                    >
                      <option value="" disabled>Select reference…</option>
                      <option value="all">All Reference Books</option>
                      {textbooks.map(doc => (
                        <option key={doc._id} value={doc._id}>{doc.filename}</option>
                      ))}
                    </select>
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Selected textbook pill */}
              {(selectedBook || documentId === 'all') && (
                <div className="flex items-center gap-1.5 p-2 bg-blue-50 border border-blue-100 rounded-lg">
                  <FileText className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="text-[10px] text-blue-700 font-semibold truncate">
                    {documentId === 'all' ? 'All Reference Books' : selectedBook?.filename}
                  </span>
                </div>
              )}

              {/* Target Condition */}
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Target Condition</label>
                <input
                  type="text"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="input-field px-3 py-2.5 text-xs"
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
                className="btn-primary w-full py-2.5 text-xs flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Searching Clinical Library...
                  </>
                ) : (
                  <>
                    <Zap className="h-3.5 w-3.5 fill-white" />
                    Search Reference
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div className="flex-1 overflow-y-auto">

          {!report && !isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-center bg-white rounded-xl border border-dashed border-gray-200 p-10 gap-3.5 shadow-sm">
              <div className="h-12 w-12 rounded-xl bg-blue-50/50 border border-blue-100/50 flex items-center justify-center text-blue-400">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#111111]">Select a reference guide & enter condition</p>
                <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-normal">AI will extract verified causes, treatments, and lifestyle guidelines from clinical texts.</p>
              </div>
            </div>
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 bg-white rounded-xl border border-gray-200/80 shadow-sm p-10 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <div>
                <h3 className="text-xs font-bold text-[#111111]">Searching Guidelines Database</h3>
                <p className="text-[10px] text-gray-400 mt-1">Scanning textbook references for clinical facts.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 fade-in pb-4">

              {/* Simple Summary Card */}
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <HeartPulse className="h-20 w-20 text-blue-500" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[10px] font-bold text-blue-700 uppercase tracking-widest flex items-center gap-1.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      Simple Summary
                    </h3>
                    <span className="badge badge-slate text-[10px]">Patient: <span className="font-bold text-[#111111]">{name}</span></span>
                  </div>
                  <p className="text-gray-600 text-xs leading-relaxed">{report.simpleSummary}</p>
                </div>
              </div>

              {/* Causes & Cures Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
                  <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <ShieldAlert className="h-3.5 w-3.5" />
                    Causes & Etiology
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{report.causes}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
                  <h3 className="text-[10px] font-bold text-green-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5" />
                    Cures & Management
                  </h3>
                  <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{report.cures}</p>
                </div>
              </div>

              {/* Diet & Lifestyle */}
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5">
                <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <HeartPulse className="h-3.5 w-3.5" />
                  Diet & Lifestyle Guidance
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed whitespace-pre-wrap">{report.dietAndLifestyle}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

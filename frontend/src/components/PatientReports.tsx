'use client';

import React, { useState } from 'react';
import { FileText, Loader2, UserPlus, HeartPulse, Activity, BookOpen, AlertCircle, ShieldAlert, Zap, Stethoscope } from 'lucide-react';
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
      // 1. Create Patient
      const patientRes = await api.post('/opd/patients', {
        name,
        age: Number(age),
        gender,
        contactNumber: '',
        medicalHistory: ''
      });
      const patientId = patientRes.data.patient._id;

      // 2. Generate Report
      const reportRes = await api.post('/opd/reports/generate', {
        patientId,
        documentId,
        condition
      });
      
      setReport(reportRes.data.report);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate report.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Textbook Patient Reports</h2>
          </div>
          <p className="text-sm text-slate-400 mt-1">Ground clinical decisions directly in specific medical literature.</p>
        </div>
      </header>

      <div className="flex gap-6 flex-1 min-h-0">
        
        {/* Left Column: Input Form */}
        <div className="w-80 flex flex-col shrink-0 gap-4 overflow-y-auto pr-1">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 backdrop-blur-md">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <UserPlus className="h-4 w-4 text-emerald-400" />
              Patient Details
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                    placeholder="e.g. 45"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 shadow-lg shadow-black/20 backdrop-blur-md">
            <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2 uppercase tracking-wider">
              <Activity className="h-4 w-4 text-rose-400" />
              Clinical Reasoning
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Reference Textbook</label>
                <div className="relative">
                  <select
                    value={documentId}
                    onChange={e => setDocumentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none"
                  >
                    <option value="" disabled>Select textbook...</option>
                    {documents.map(doc => (
                      <option key={doc._id} value={doc._id}>{doc.filename}</option>
                    ))}
                  </select>
                  <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Target Condition</label>
                <input
                  type="text"
                  value={condition}
                  onChange={e => setCondition(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                  placeholder="e.g. Hypertension, Diabetes"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full mt-2 relative overflow-hidden group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl py-3 text-sm font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <div className="relative flex items-center justify-center gap-2">
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Synthesizing Report...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Generate Report
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Results Display */}
        <div className="flex-1 overflow-y-auto pr-2 pb-6">
          {!report && !isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/30 border border-slate-800/50 rounded-3xl border-dashed">
              <Stethoscope className="h-16 w-16 text-slate-800 mb-4" />
              <p className="text-sm font-medium">Select a textbook and condition to generate a report.</p>
              <p className="text-xs text-slate-600 mt-1">AI will extract verified causes, cures, and lifestyle data.</p>
            </div>
          ) : isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center space-y-6 bg-slate-900/30 border border-slate-800/50 rounded-3xl">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full animate-pulse" />
                <div className="h-16 w-16 bg-slate-900 border border-blue-500/50 rounded-2xl flex items-center justify-center relative shadow-lg shadow-blue-500/20">
                  <Activity className="h-8 w-8 text-blue-400 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-white tracking-wide animate-pulse">Running Langchain RAG...</h3>
                <p className="text-xs text-slate-400">Scanning textbook vector embeddings for clinical reasoning.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Summary Card */}
              <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <HeartPulse className="h-24 w-24 text-blue-500" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Simple Summary
                    </h3>
                    <span className="text-xs font-medium text-slate-500 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800">
                      For Patient: <span className="text-white">{name}</span>
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed font-medium">
                    {report.simpleSummary}
                  </p>
                </div>
              </div>

              {/* Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Causes */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:bg-slate-900 transition-colors">
                  <h3 className="text-sm font-bold text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4" />
                    Causes & Etiology
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 h-[calc(100%-2rem)] overflow-y-auto">
                    {report.causes}
                  </div>
                </div>

                {/* Cures */}
                <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:bg-slate-900 transition-colors">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Cures & Management
                  </h3>
                  <div className="text-slate-300 text-sm leading-relaxed bg-slate-950/50 rounded-xl p-4 border border-slate-800/50 h-[calc(100%-2rem)] overflow-y-auto">
                    {report.cures}
                  </div>
                </div>

              </div>

              {/* Diet */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 hover:bg-slate-900 transition-colors">
                <h3 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <HeartPulse className="h-4 w-4" />
                  Diet & Lifestyle
                </h3>
                <div className="text-slate-300 text-sm leading-relaxed bg-slate-950/50 rounded-xl p-4 border border-slate-800/50">
                  {report.dietAndLifestyle}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

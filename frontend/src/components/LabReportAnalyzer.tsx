'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  FileSearch,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Eye,
  RefreshCw,
} from 'lucide-react';

interface LabFinding {
  parameter: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal_high' | 'abnormal_low' | 'critical';
}

interface ReportAnalysis {
  _id: string;
  documentId: string;
  findings: LabFinding[];
  interpretation: string;
  clinicalImplications: string[];
  suggestedFollowUp: string[];
  urgencyLevel: 'routine' | 'urgent' | 'critical';
  createdAt: string;
}

interface DocumentItem {
  _id: string;
  filename: string;
  fileSize: number;
  documentType: string;
  uploadDate: string;
}

export const LabReportAnalyzer: React.FC = () => {
  const [labDocuments, setLabDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all lab report documents on mount
  useEffect(() => {
    fetchLabDocuments();
  }, []);

  const fetchLabDocuments = async () => {
    try {
      const res = await api.get('/documents?type=lab_report');
      setLabDocuments(res.data.documents || []);
    } catch (err: any) {
      console.error('Failed to load lab documents:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', 'lab_report');

    setIsUploading(true);
    setError(null);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newDoc = res.data.document;
      setLabDocuments([newDoc, ...labDocuments]);
      setSelectedDoc(newDoc);
      runAnalysis(newDoc._id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lab report upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const runAnalysis = async (docId: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await api.post(`/reports/analyze/${docId}`);
      setAnalysis(res.data.analysis);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to perform OCR & RAG analysis on lab report.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectDoc = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    runAnalysis(doc._id);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-teal-500/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <FileSearch className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">MedSynexa OCR Lab Report Analyzer</h2>
              <span className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                Gemini Vision OCR + pgvector RAG
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Extract blood test parameters, highlight abnormal values, and generate evidence-based clinical insights
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <label className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 border border-teal-400/20 cursor-pointer flex items-center gap-2 transition-all active:scale-[0.98]">
          <UploadCloud className="h-4 w-4" />
          <span>Upload Lab Report (PDF/Image)</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* Main Grid: Document List / Selector (Left) & Analysis Output (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        
        {/* Left Column: Lab Document Selector */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-3xl border-slate-800/80 overflow-y-auto flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-teal-400" />
              Uploaded Lab Reports ({labDocuments.length})
            </span>
          </div>

          {isUploading && (
            <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-500/30 text-teal-200 text-xs flex items-center gap-3 animate-pulse">
              <div className="h-4 w-4 border-2 border-teal-400 border-t-transparent animate-spin rounded-full shrink-0" />
              <span>Indexing lab report via Gemini Vision OCR...</span>
            </div>
          )}

          {labDocuments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
              <UploadCloud className="h-10 w-10 text-slate-600 animate-bounce" />
              <p className="text-xs">No lab reports uploaded yet. Click above to upload a blood test, LFT, KFT, or CBC report.</p>
            </div>
          ) : (
            <div className="space-y-2 flex-1 overflow-y-auto">
              {labDocuments.map((doc) => {
                const isSelected = selectedDoc?._id === doc._id;
                return (
                  <button
                    key={doc._id}
                    onClick={() => handleSelectDoc(doc)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between group ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-500/40 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <FileText className={`h-4 w-4 shrink-0 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`} />
                      <div className="truncate text-xs">
                        <p className="font-semibold truncate">{doc.filename}</p>
                        <p className="text-[10px] text-slate-500">
                          Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-teal-400 shrink-0 transition-transform group-hover:translate-x-1" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Structured Findings & Clinical Interpretation */}
        <div className="lg:col-span-8 flex flex-col space-y-4 overflow-y-auto">
          
          {!selectedDoc && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 glass-panel rounded-3xl border-slate-800/80 space-y-4">
              <FileSearch className="h-16 w-16 text-slate-700 animate-pulse" />
              <div>
                <h3 className="text-base font-bold text-white">Select or Upload a Lab Report</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Upload a CBC, LFT, Lipid Panel, or Renal Function lab report to view automated parameter extractions and clinical interpretations.
                </p>
              </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center p-8 glass-panel rounded-3xl border-slate-800/80 space-y-4">
              <div className="h-12 w-12 border-3 border-teal-500 border-t-transparent animate-spin rounded-full" />
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-white">Analyzing Lab Report via pgvector RAG</h4>
                <p className="text-xs text-slate-400">Extracting parameters, checking reference ranges & clinical implications...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {selectedDoc && analysis && !isAnalyzing && (
            <>
              {/* Header Bar */}
              <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
                <div>
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <span>{selectedDoc.filename}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        analysis.urgencyLevel === 'critical'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                          : analysis.urgencyLevel === 'urgent'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      }`}
                    >
                      {analysis.urgencyLevel} Urgency
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {analysis.findings.length} Extracted Parameters • RAG Analysis Complete
                  </p>
                </div>

                <a
                  href={`http://localhost:3000/api/documents/${selectedDoc._id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5 text-teal-400" />
                  View Original Document
                </a>
              </div>

              {/* 1. Clinical Interpretation Summary */}
              <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-teal-400" />
                  Clinical Pathology Narrative & Interpretation
                </h4>
                <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  {analysis.interpretation}
                </p>
              </div>

              {/* 2. Extracted Lab Parameters Table */}
              <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileSearch className="h-4 w-4 text-cyan-400" />
                  Extracted Lab Parameters & Reference Ranges
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase font-semibold">
                        <th className="py-2.5 px-3">Parameter</th>
                        <th className="py-2.5 px-3">Value</th>
                        <th className="py-2.5 px-3">Unit</th>
                        <th className="py-2.5 px-3">Ref. Range</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {analysis.findings.map((f, i) => {
                        const isHigh = f.status === 'abnormal_high';
                        const isLow = f.status === 'abnormal_low';
                        const isCritical = f.status === 'critical';
                        const isNormal = f.status === 'normal';

                        return (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="py-2.5 px-3 font-semibold text-white">{f.parameter}</td>
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-200">{f.value}</td>
                            <td className="py-2.5 px-3 text-slate-400">{f.unit || '-'}</td>
                            <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">{f.referenceRange || '-'}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                  isCritical
                                    ? 'bg-red-950 text-red-400 border border-red-500/40'
                                    : isHigh
                                    ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                                    : isLow
                                    ? 'bg-cyan-950 text-cyan-400 border border-cyan-500/40'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                                }`}
                              >
                                {isHigh && <TrendingUp className="h-3 w-3" />}
                                {isLow && <TrendingDown className="h-3 w-3" />}
                                {isCritical && <AlertTriangle className="h-3 w-3" />}
                                {isNormal && <CheckCircle className="h-3 w-3" />}
                                {f.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 3. Clinical Implications & Suggested Follow-up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Clinical Implications
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {analysis.clinicalImplications.map((imp, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-teal-400">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Suggested Follow-Up Investigations
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300">
                    {analysis.suggestedFollowUp.map((step, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-teal-400">•</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

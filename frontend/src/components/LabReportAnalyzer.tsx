'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  FlaskConical,
  UploadCloud,
  FileText,
  AlertTriangle,
  CheckCircle,
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

const STATUS_CONFIG = {
  normal: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'badge-green', icon: CheckCircle, label: 'Normal' },
  abnormal_high: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'badge-amber', icon: TrendingUp, label: 'High' },
  abnormal_low: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700', badge: 'badge-cyan', icon: TrendingDown, label: 'Low' },
  critical: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'badge-red', icon: AlertTriangle, label: 'Critical' },
};

const URGENCY_CONFIG = {
  routine: { badge: 'badge-green', label: 'Routine Urgency' },
  urgent: { badge: 'badge-amber', label: 'Urgent' },
  critical: { badge: 'badge-red', label: 'Critical Urgency' },
};

export const LabReportAnalyzer: React.FC = () => {
  const [labDocuments, setLabDocuments] = useState<DocumentItem[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [analysis, setAnalysis] = useState<ReportAnalysis | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="h-full flex flex-col overflow-hidden gap-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E2E8F0] px-5 py-3.5 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-cyan h-10 w-10">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">Lab Report Analyzer</h2>
              <span className="badge badge-cyan text-[10px]">Gemini Vision OCR + pgvector</span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Extract blood test parameters, highlight abnormal values, and generate clinical insights
            </p>
          </div>
        </div>

        <label className="btn-primary px-4 py-2 text-xs cursor-pointer flex items-center gap-2 rounded-xl">
          <UploadCloud className="h-4 w-4" />
          <span>Upload Lab Report</span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {/* ── Main Grid ── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">

        {/* ── Left: Document Selector ── */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-y-auto flex flex-col">

          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#F1F5F9] shrink-0">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#475569]">
              <FileText className="h-3.5 w-3.5 text-cyan-600" />
              Lab Reports ({labDocuments.length})
            </span>
            <button
              onClick={fetchLabDocuments}
              className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#94A3B8] hover:text-[#475569] transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto">
            {isUploading && (
              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs flex items-center gap-3 mb-3">
                <div className="h-4 w-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Indexing via Gemini Vision OCR…</span>
              </div>
            )}

            {labDocuments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <div className="h-12 w-12 rounded-xl bg-cyan-50 border border-cyan-100 flex items-center justify-center">
                  <UploadCloud className="h-6 w-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">No lab reports yet</p>
                  <p className="text-xs text-[#94A3B8] mt-1">Upload a CBC, LFT, KFT, or Lipid Panel PDF/image above.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {labDocuments.map((doc) => {
                  const isSelected = selectedDoc?._id === doc._id;
                  return (
                    <button
                      key={doc._id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${isSelected
                          ? 'bg-cyan-50 border-cyan-200 shadow-sm'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-white'
                        }`}
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-cyan-100' : 'bg-white border border-[#E2E8F0]'}`}>
                          <FileText className={`h-4 w-4 ${isSelected ? 'text-cyan-600' : 'text-[#94A3B8]'}`} />
                        </div>
                        <div className="truncate min-w-0">
                          <p className={`text-xs font-semibold truncate ${isSelected ? 'text-cyan-800' : 'text-[#0F172A]'}`}>{doc.filename}</p>
                          <p className="text-[10px] text-[#94A3B8] mt-0.5">{formatDate(doc.uploadDate)} · {formatFileSize(doc.fileSize)}</p>
                        </div>
                      </div>
                      <ArrowRight className={`h-3.5 w-3.5 shrink-0 ml-2 transition-transform ${isSelected ? 'text-cyan-500' : 'text-[#CBD5E1] group-hover:text-[#94A3B8] group-hover:translate-x-0.5'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Analysis Output ── */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto">

          {!selectedDoc && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
              <div className="h-16 w-16 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-400 mb-4">
                <FlaskConical className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-2">Select or Upload a Lab Report</h3>
              <p className="text-sm text-[#64748B] max-w-sm leading-relaxed">
                Upload a CBC, LFT, Lipid Panel, or Renal Function lab report to view automated parameter extractions and clinical interpretations.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center p-10 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm gap-4">
              <div className="h-12 w-12 border-[3px] border-cyan-500 border-t-transparent animate-spin rounded-full" />
              <div className="text-center">
                <h4 className="text-sm font-bold text-[#0F172A]">Analyzing Lab Report</h4>
                <p className="text-xs text-[#64748B] mt-1">Extracting parameters, checking reference ranges & clinical implications…</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {selectedDoc && analysis && !isAnalyzing && (
            <>
              {/* Analysis header */}
              <div className="flex items-center justify-between bg-white rounded-xl border border-[#E2E8F0] px-4 py-3 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                    <span>{selectedDoc.filename}</span>
                    <span className={`badge ${URGENCY_CONFIG[analysis.urgencyLevel].badge} text-[10px]`}>
                      {URGENCY_CONFIG[analysis.urgencyLevel].label}
                    </span>
                  </h3>
                  <p className="text-[10px] text-[#94A3B8] mt-0.5">
                    {analysis.findings.length} Extracted Parameters · RAG Analysis Complete
                  </p>
                </div>
                <a
                  href={`http://localhost:3000/api/documents/${selectedDoc._id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Original
                </a>
              </div>

              {/* Clinical Interpretation */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-teal-600" />
                  Clinical Pathology Interpretation
                </h4>
                <p className="text-sm text-[#475569] leading-relaxed bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                  {analysis.interpretation}
                </p>
              </div>

              {/* Parameters Table */}
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 space-y-3">
                <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-cyan-600" />
                  Extracted Lab Parameters & Reference Ranges
                </h4>

                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                  <table className="table-clean">
                    <thead>
                      <tr>
                        <th className="text-left">Parameter</th>
                        <th className="text-left">Value</th>
                        <th className="text-left">Unit</th>
                        <th className="text-left">Ref. Range</th>
                        <th className="text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.findings.map((f, i) => {
                        const cfg = STATUS_CONFIG[f.status] || STATUS_CONFIG.normal;
                        const Icon = cfg.icon;
                        const isAbnormal = f.status !== 'normal';
                        return (
                          <tr key={i} className={isAbnormal ? cfg.bg : ''}>
                            <td className="font-semibold text-[#0F172A]">{f.parameter}</td>
                            <td className={`font-mono font-bold ${isAbnormal ? cfg.text : 'text-[#0F172A]'}`}>{f.value}</td>
                            <td className="text-[#94A3B8]">{f.unit || '—'}</td>
                            <td className="text-[#94A3B8] font-mono text-xs">{f.referenceRange || '—'}</td>
                            <td className="text-right">
                              <span className={`badge ${cfg.badge} text-[10px] inline-flex items-center gap-1`}>
                                <Icon className="h-3 w-3" />
                                {cfg.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Clinical Implications & Follow-up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Clinical Implications</h4>
                  <ul className="space-y-2">
                    {analysis.clinicalImplications.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                        <span className="text-teal-500 mt-0.5 shrink-0">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-4 space-y-3">
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider">Suggested Follow-Up</h4>
                  <ul className="space-y-2">
                    {analysis.suggestedFollowUp.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[#475569]">
                        <span className="text-cyan-500 mt-0.5 shrink-0">•</span>
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

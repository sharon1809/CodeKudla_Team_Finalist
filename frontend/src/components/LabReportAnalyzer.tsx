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
  normal: { bg: 'bg-green-50/50', border: 'border-green-200/50', text: 'text-green-700', badge: 'badge-green', icon: CheckCircle, label: 'Normal' },
  abnormal_high: { bg: 'bg-amber-50/50', border: 'border-amber-200/50', text: 'text-amber-700', badge: 'badge-amber', icon: TrendingUp, label: 'High' },
  abnormal_low: { bg: 'bg-cyan-50/50', border: 'border-cyan-200/50', text: 'text-cyan-700', badge: 'badge-cyan', icon: TrendingDown, label: 'Low' },
  critical: { bg: 'bg-red-50/50', border: 'border-red-200/50', text: 'text-red-700', badge: 'badge-red', icon: AlertTriangle, label: 'Critical' },
};

const URGENCY_CONFIG = {
  routine: { badge: 'badge-green', label: 'Routine' },
  urgent: { badge: 'badge-amber', label: 'Urgent' },
  critical: { badge: 'badge-red', label: 'Critical' },
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

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  return (
    <div className="h-full flex flex-col overflow-hidden gap-4 p-5 bg-[#FAFAFA]">

      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200/80 px-5 py-3 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-blue h-10 w-10">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[#111111] tracking-tight">Lab Report Scanner</h2>
              <span className="badge badge-blue text-[10px]">Report Scan</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
              Extract blood test parameters, highlight abnormal values, and view pathology summaries
            </p>
          </div>
        </div>

        <label className="btn-primary px-4 py-2 text-xs cursor-pointer flex items-center gap-2">
          <UploadCloud className="h-4 w-4" />
          <span>Upload Lab Sheet</span>
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
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden min-h-0">

        {/* ── Left: Document Selector ── */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col min-h-0">

          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Lab Reports ({labDocuments.length})
            </span>
            <button
              onClick={fetchLabDocuments}
              className="p-1 hover:bg-gray-50 rounded text-gray-400 hover:text-gray-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-3 w-3" />
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-1.5 min-h-0">
            {isUploading && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold flex items-center gap-2.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
                <span>Scanning report values...</span>
              </div>
            )}

            {labDocuments.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="h-10 w-10 rounded-xl bg-blue-50/50 border border-blue-100/50 flex items-center justify-center text-blue-400">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">No lab sheets yet</p>
                  <p className="text-[10px] text-gray-400 mt-1">Upload a PDF or image scan above to start.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                {labDocuments.map((doc) => {
                  const isSelected = selectedDoc?._id === doc._id;
                  return (
                    <button
                      key={doc._id}
                      onClick={() => handleSelectDoc(doc)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between group ${isSelected
                          ? 'bg-blue-50/50 border-blue-200/50 shadow-sm'
                          : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50/30'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 truncate min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isSelected ? 'bg-blue-100/60 border border-blue-200/20' : 'bg-gray-50 border border-gray-100'}`}>
                          <FileText className={`h-4 w-4 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="truncate min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-800' : 'text-gray-800'}`}>{doc.filename}</p>
                          <p className="text-[9px] text-gray-400 font-semibold mt-0.5">{formatDate(doc.uploadDate)} · {formatFileSize(doc.fileSize)}</p>
                        </div>
                      </div>
                      <ArrowRight className={`h-3.5 w-3.5 shrink-0 ml-2 transition-transform ${isSelected ? 'text-blue-500' : 'text-gray-300 group-hover:text-gray-500 group-hover:translate-x-0.5'}`} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Analysis Output ── */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-y-auto min-h-0">

          {!selectedDoc && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-white rounded-xl border border-gray-200/80 shadow-sm">
              <div className="h-14 w-14 rounded-xl bg-blue-50/50 border border-blue-100/50 flex items-center justify-center text-blue-400 mb-4">
                <FlaskConical className="h-6 w-6" />
              </div>
              <h3 className="text-xs font-bold text-gray-800 mb-1.5">Select or Upload a Lab Report</h3>
              <p className="text-[11px] text-gray-400 max-w-xs leading-relaxed">
                Choose a clinical lab file from the list or upload a new scan to view structured parameter findings.
              </p>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-gray-200/80 shadow-sm gap-4 text-center">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
              <div>
                <h4 className="text-xs font-bold text-gray-800">Analyzing Pathology Parameters</h4>
                <p className="text-[10px] text-gray-400 mt-1 max-w-xs leading-relaxed">Extracting data and cross-referencing reference thresholds...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {selectedDoc && analysis && !isAnalyzing && (
            <>
              {/* Analysis header */}
              <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200/80 px-4 py-3 shadow-sm">
                <div>
                  <h3 className="text-xs font-bold text-[#111111] flex items-center gap-2">
                    <span className="truncate max-w-xs">{selectedDoc.filename}</span>
                    <span className={`badge ${URGENCY_CONFIG[analysis.urgencyLevel].badge} text-[10px]`}>
                      {URGENCY_CONFIG[analysis.urgencyLevel].label}
                    </span>
                  </h3>
                  <p className="text-[9px] text-gray-400 mt-0.5 font-semibold">
                    {analysis.findings.length} Parameters Identified · Scan Complete
                  </p>
                </div>
                <a
                  href={`${apiBaseUrl}/documents/${selectedDoc._id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost px-3 py-1.5 text-xs flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100"
                >
                  <Eye className="h-3.5 w-3.5" />
                  View Scan
                </a>
              </div>

              {/* Clinical Interpretation */}
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-3">
                <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-blue-600" />
                  Pathology Narrative
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed bg-[#FAFAFA] p-4 rounded-xl border border-gray-100">
                  {analysis.interpretation}
                </p>
              </div>

              {/* Parameters Table */}
              <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-3">
                <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  Extracted Lab Findings
                </h4>

                <div className="overflow-hidden rounded-lg border border-gray-200/80">
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
                            <td className="font-bold text-xs text-gray-800">{f.parameter}</td>
                            <td className={`font-mono text-xs font-bold ${isAbnormal ? cfg.text : 'text-gray-700'}`}>{f.value}</td>
                            <td className="text-gray-400 text-xs">{f.unit || '—'}</td>
                            <td className="text-gray-400 font-mono text-[11px]">{f.referenceRange || '—'}</td>
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

              {/* Implications and follow up */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">Clinical Implications</h4>
                  <ul className="space-y-2">
                    {analysis.clinicalImplications.map((imp, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600 font-semibold">
                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                        <span>{imp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-5 space-y-3">
                  <h4 className="text-[10px] font-bold text-[#111111] uppercase tracking-wider">Suggested Diagnostics</h4>
                  <ul className="space-y-2">
                    {analysis.suggestedFollowUp.map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-gray-600 font-semibold">
                        <span className="text-indigo-500 mt-0.5 shrink-0">•</span>
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

// Add Loader component mapping locally to avoid TS compiler errors in case of react-lucide imports
const Loader2 = ({ className }: { className?: string }) => (
  <svg className={`${className} animate-spin`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

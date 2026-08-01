'use client';

import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  FileText,
  Search,
  Trash2,
  Edit2,
  Eye,
  UploadCloud,
  Check,
  X,
  FileSearch,
  BookOpen,
  MessageSquare,
  FlaskConical,
  Layers,
  HardDrive,
  Calendar,
  Hash,
} from 'lucide-react';

interface DocumentItem {
  _id: string;
  filename: string;
  fileSize: number;
  chunkCount: number;
  documentType: 'general' | 'lab_report';
  mimeType: string;
  uploadDate: string;
}

interface DocumentsListProps {
  onStartChatWithDoc?: (doc: DocumentItem) => void;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ onStartChatWithDoc }) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const [isUploadingGeneral, setIsUploadingGeneral] = useState(false);
  const [isUploadingLab, setIsUploadingLab] = useState(false);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (err: any) {
      setError('Failed to fetch uploaded documents.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, docType: 'general' | 'lab_report') => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', docType);

    if (docType === 'general') setIsUploadingGeneral(true);
    else setIsUploadingLab(true);
    setError(null);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments([res.data.document, ...documents]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      if (docType === 'general') setIsUploadingGeneral(false);
      else setIsUploadingLab(false);
    }
    e.target.value = '';
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document and its vector embeddings?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(documents.filter((d) => d._id !== docId));
    } catch {
      alert('Failed to delete document.');
    }
  };

  const handleSaveRename = async (docId: string) => {
    if (!editingName.trim()) return;
    try {
      await api.put(`/documents/${docId}/rename`, { filename: editingName.trim() });
      setDocuments(documents.map((d) => (d._id === docId ? { ...d, filename: editingName.trim() } : d)));
      setEditingId(null);
    } catch {
      alert('Failed to rename document.');
    }
  };

  const handleStartChat = async (doc: DocumentItem) => {
    try {
      await api.post('/chats', { documentId: doc._id });
      if (onStartChatWithDoc) onStartChatWithDoc(doc);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start chat session.');
    }
  };

  const handleViewFile = async (docId: string, mimeType: string) => {
    try {
      const res = await api.get(`/documents/${docId}/file`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: mimeType || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
    } catch {
      alert('Failed to view document.');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  // Split documents by type
  const generalDocs = documents.filter(
    (d) => d.documentType === 'general' && d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const labDocs = documents.filter(
    (d) => d.documentType === 'lab_report' && d.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Document card component
  const DocCard = ({ doc }: { doc: DocumentItem }) => {
    const isLab = doc.documentType === 'lab_report';
    return (
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex flex-col gap-3 hover:border-[#CBD5E1] hover:shadow-md transition-all group">
        <div className="flex items-start justify-between gap-2">
          <div className={`icon-container ${isLab ? 'icon-cyan' : 'icon-teal'} h-9 w-9 shrink-0`}>
            {isLab ? <FlaskConical className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>
          <span className={`badge ${isLab ? 'badge-cyan' : 'badge-teal'} text-[10px] shrink-0`}>
            {isLab ? 'Lab Report' : 'Textbook'}
          </span>
        </div>

        {editingId === doc._id ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              className="input-field flex-1 px-2 py-1.5 text-xs"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSaveRename(doc._id)}
            />
            <button onClick={() => handleSaveRename(doc._id)} className="text-teal-600 p-1 hover:bg-teal-50 rounded-lg">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setEditingId(null)} className="text-[#94A3B8] p-1 hover:bg-[#F1F5F9] rounded-lg">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <h4 className="text-xs font-bold text-[#0F172A] truncate leading-relaxed" title={doc.filename}>
            {doc.filename}
          </h4>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div className="flex items-center gap-1 text-[#94A3B8]">
            <Hash className="h-3 w-3" />
            <span><span className="font-bold text-teal-600">{doc.chunkCount}</span> chunks</span>
          </div>
          <div className="flex items-center gap-1 text-[#94A3B8]">
            <HardDrive className="h-3 w-3" />
            <span>{formatFileSize(doc.fileSize)}</span>
          </div>
          <div className="flex items-center gap-1 text-[#94A3B8] col-span-2">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(doc.uploadDate)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
          <button
            onClick={() => handleViewFile(doc._id, doc.mimeType)}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 transition-colors"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStartChat(doc)}
              className="p-1.5 text-[#94A3B8] hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
              title="Start Q&A Chat"
            >
              <MessageSquare className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => { setEditingId(doc._id); setEditingName(doc.filename); }}
              className="p-1.5 text-[#94A3B8] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F5F9] transition-colors"
              title="Rename"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleDelete(doc._id)}
              className="p-1.5 text-[#94A3B8] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Section component
  const DocSection = ({
    title,
    subtitle,
    icon: Icon,
    iconClass,
    docs,
    uploadType,
    isUploading,
    emptyMsg,
    accentClass,
  }: {
    title: string;
    subtitle: string;
    icon: React.ElementType;
    iconClass: string;
    docs: DocumentItem[];
    uploadType: 'general' | 'lab_report';
    isUploading: boolean;
    emptyMsg: string;
    accentClass: string;
  }) => (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden">
      {/* Section Header */}
      <div className={`flex items-center justify-between px-5 py-4 border-b border-[#F1F5F9] ${accentClass}`}>
        <div className="flex items-center gap-3">
          <div className={`icon-container ${iconClass} h-9 w-9`}>
            <Icon className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A]">{title}</h3>
            <p className="text-[10px] text-[#94A3B8]">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-slate text-[10px]">{docs.length} files</span>
          <label className="btn-ghost px-3 py-2 text-xs cursor-pointer flex items-center gap-1.5">
            {isUploading ? (
              <div className="h-3.5 w-3.5 border-2 border-teal-500 border-t-transparent rounded-full spin" />
            ) : (
              <UploadCloud className="h-3.5 w-3.5" />
            )}
            <span>{isUploading ? 'Uploading…' : 'Upload'}</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={(e) => handleFileUpload(e, uploadType)}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="p-5">
        {isUploading && (
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 text-xs flex items-center gap-3 mb-4">
            <div className="h-4 w-4 border-2 border-teal-500 border-t-transparent rounded-full spin shrink-0" />
            <span>Extracting text · Generating embeddings · Indexing in pgvector…</span>
          </div>
        )}

        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-8 px-4 gap-3">
            <div className={`icon-container ${iconClass} h-12 w-12`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-sm text-[#94A3B8]">{emptyMsg}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {docs.map((doc) => (
              <DocCard key={doc._id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E2E8F0] px-5 py-3.5 shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-emerald h-10 w-10">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">Document Library</h2>
            <p className="text-xs text-[#64748B] mt-0.5">All uploaded PDFs — textbooks & lab reports — indexed in pgvector</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="h-4 w-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents…"
            className="input-field pl-9 pr-4 py-2 text-sm"
          />
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs shrink-0">
          {error}
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full spin" />
          </div>
        ) : (
          <>
            {/* ── Section 1: Textbooks & Guidelines ── */}
            <DocSection
              title="Textbooks & Guidelines"
              subtitle="Clinical manuals, ICMR guidelines, research journals"
              icon={BookOpen}
              iconClass="icon-teal"
              docs={generalDocs}
              uploadType="general"
              isUploading={isUploadingGeneral}
              emptyMsg="No textbooks uploaded yet. Upload clinical manuals, ICMR guidelines, or research papers."
              accentClass="bg-teal-50/50"
            />

            {/* ── Section 2: Lab Reports ── */}
            <DocSection
              title="Lab Reports"
              subtitle="Blood tests, CBC, LFT, KFT, Lipid panels, pathology reports"
              icon={FlaskConical}
              iconClass="icon-cyan"
              docs={labDocs}
              uploadType="lab_report"
              isUploading={isUploadingLab}
              emptyMsg="No lab reports uploaded yet. Upload CBC, LFT, KFT, or Lipid Panel PDFs/scans."
              accentClass="bg-cyan-50/50"
            />
          </>
        )}
      </div>
    </div>
  );
};

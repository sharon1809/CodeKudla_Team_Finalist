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
  Filter,
  HardDrive,
  MessageSquare,
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
  const [filterType, setFilterType] = useState<'all' | 'general' | 'lab_report'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Renaming state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Upload modal state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'general' | 'lab_report'>('general');

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', uploadType);

    setIsUploading(true);
    setError(null);

    try {
      const res = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setDocuments([res.data.document, ...documents]);
    } catch (err: any) {
      setError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document and its vector embeddings?')) return;
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(documents.filter((d) => d._id !== docId));
    } catch (err: any) {
      alert('Failed to delete document.');
    }
  };

  const handleSaveRename = async (docId: string) => {
    if (!editingName.trim()) return;
    try {
      await api.put(`/documents/${docId}/rename`, { filename: editingName.trim() });
      setDocuments(
        documents.map((d) => (d._id === docId ? { ...d, filename: editingName.trim() } : d))
      );
      setEditingId(null);
    } catch (err: any) {
      alert('Failed to rename document.');
    }
  };

  const handleStartChat = async (doc: DocumentItem) => {
    try {
      await api.post('/chats', { documentId: doc._id });
      if (onStartChatWithDoc) {
        onStartChatWithDoc(doc);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start chat session.');
    }
  };

  // Filtered documents
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.filename.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || doc.documentType === filterType;
    return matchesSearch && matchesType;
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="h-full flex flex-col space-y-4 overflow-hidden">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-teal-500/20 gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">MedSynexa Document & Vector Library</h2>
            <p className="text-xs text-slate-400">
              Manage clinical guidelines, pharmaceutical reference manuals & OCR lab reports stored in pgvector
            </p>
          </div>
        </div>

        {/* Upload Controls */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={uploadType}
            onChange={(e: any) => setUploadType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="general">Clinical Guideline / Manual</option>
            <option value="lab_report">Lab Report Scan</option>
          </select>

          <label className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-teal-600/20 border border-teal-400/20 cursor-pointer flex items-center gap-2 transition-all shrink-0 active:scale-[0.98]">
            <UploadCloud className="h-4 w-4" />
            <span>Upload Document</span>
            <input
              type="file"
              className="hidden"
              accept=".pdf,.docx,.png,.jpg,.jpeg"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
          </label>
        </div>
      </div>

      {isUploading && (
        <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-500/30 text-teal-200 text-xs flex items-center gap-3 animate-pulse shrink-0">
          <div className="h-4 w-4 border-2 border-teal-400 border-t-transparent animate-spin rounded-full shrink-0" />
          <span>Ingesting document, extracting text with OCR, generating 768-dim embeddings for pgvector...</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-2xl border border-slate-800 shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-500 uppercase font-bold mr-1">Filter:</span>
          {(['all', 'general', 'lab_report'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                filterType === type
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'bg-slate-950 text-slate-400 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {type === 'all' ? 'All Files' : type === 'general' ? 'Guidelines' : 'Lab Reports'}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table / Grid */}
      <div className="flex-1 glass-panel p-5 rounded-3xl border-slate-800/80 overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center p-8">
            <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent animate-spin rounded-full" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 text-slate-500">
            <FileText className="h-12 w-12 text-slate-700" />
            <h4 className="text-sm font-bold text-slate-300">No Documents Found</h4>
            <p className="text-xs max-w-sm">
              Upload clinical manuals, ICMR guidelines, or lab report PDFs to store them in your isolated vector namespace.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const isLab = doc.documentType === 'lab_report';
              return (
                <div
                  key={doc._id}
                  className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800/80 hover:border-teal-500/40 transition-all flex flex-col justify-between space-y-3 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="h-9 w-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0">
                        {isLab ? <FileSearch className="h-4.5 w-4.5 text-cyan-400" /> : <FileText className="h-4.5 w-4.5 text-teal-400" />}
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          isLab
                            ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
                            : 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                        }`}
                      >
                        {isLab ? 'Lab Report' : 'Clinical Guideline'}
                      </span>
                    </div>

                    {/* Renaming Input or Filename */}
                    {editingId === doc._id ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                        />
                        <button onClick={() => handleSaveRename(doc._id)} className="text-emerald-400">
                          <Check className="h-4 w-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-slate-400">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <h4 className="text-xs font-bold text-white truncate" title={doc.filename}>
                        {doc.filename}
                      </h4>
                    )}
                  </div>

                  {/* Metadata Stats */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-900">
                    <div>
                      <span className="text-slate-500 block">Vector Chunks</span>
                      <span className="font-mono font-bold text-teal-300">{doc.chunkCount} chunks</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">File Size</span>
                      <span className="font-mono text-slate-300">{formatFileSize(doc.fileSize)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                    <a
                      href={`http://localhost:3000/api/documents/${doc._id}/file`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-teal-400 hover:underline font-semibold flex items-center gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View File
                    </a>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartChat(doc)}
                        className="p-1.5 text-slate-400 hover:text-teal-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Start Q&A Chat"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(doc._id);
                          setEditingName(doc.filename);
                        }}
                        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                        title="Rename Document"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Delete Document & Vector Chunks"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

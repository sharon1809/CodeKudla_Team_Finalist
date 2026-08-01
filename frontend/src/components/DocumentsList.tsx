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

  const handleViewFile = async (docId: string, mimeType: string) => {
    try {
      const res = await api.get(`/documents/${docId}/file`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: mimeType || 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 10000); // cleanup
    } catch (err: any) {
      alert('Failed to view document. Ensure you have access.');
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
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between glass p-4 rounded-2xl gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="icon-container icon-teal h-10 w-10">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Document & Vector Library</h2>
            <p className="text-xs text-[#8fa3bb]">Clinical guidelines, reference manuals & OCR lab reports</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={uploadType}
            onChange={(e: any) => setUploadType(e.target.value)}
            className="bg-[#030912] border border-white/8 text-xs text-[#8fa3bb] rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="general">Clinical Guideline / Manual</option>
            <option value="lab_report">Lab Report Scan</option>
          </select>

          <label className="btn-primary text-xs px-4 py-2 cursor-pointer flex items-center gap-2 shrink-0">
            <UploadCloud className="h-4 w-4" />
            <span>Upload Document</span>
            <input type="file" className="hidden" accept=".pdf,.docx,.png,.jpg,.jpeg" onChange={handleFileUpload} disabled={isUploading} />
          </label>
        </div>
      </div>

      {isUploading && (
        <div className="p-3.5 rounded-2xl bg-teal-950/30 border border-teal-500/20 text-teal-300 text-xs flex items-center gap-3 shrink-0">
          <div className="h-4 w-4 border-2 border-teal-400 border-t-transparent rounded-full spin shrink-0" />
          <span>Extracting text · Generating embeddings · Indexing in pgvector · Uploading to Supabase...</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex items-center justify-between gap-4 glass p-3 rounded-2xl shrink-0">
        <div className="relative flex-1 max-w-md">
          <Search className="h-4 w-4 text-[#4a637a] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename..."
            className="input-field pl-10 pr-4 py-2 text-xs"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="section-label mr-1">Filter:</span>
          {(['all', 'general', 'lab_report'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                filterType === type
                  ? 'badge badge-teal'
                  : 'text-[#4a637a] hover:text-white border border-white/8 hover:border-white/15'
              }`}
            >
              {type === 'all' ? 'All Files' : type === 'general' ? 'Guidelines' : 'Lab Reports'}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="flex-1 glass p-5 rounded-3xl overflow-y-auto">
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <div className="h-8 w-8 border-2 border-teal-500 border-t-transparent rounded-full spin" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
            <div className="icon-container icon-teal h-14 w-14">
              <FileText className="h-7 w-7" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">No Documents Found</h4>
              <p className="text-xs text-[#8fa3bb] max-w-sm">Upload clinical manuals, ICMR guidelines, or lab report PDFs to your isolated vector namespace.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => {
              const isLab = doc.documentType === 'lab_report';
              return (
                <div key={doc._id} className="card-clinical p-5 rounded-2xl flex flex-col gap-4 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className={`icon-container ${isLab ? 'icon-cyan' : 'icon-teal'} h-9 w-9`}>
                      {isLab ? <FileSearch className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </div>
                    <span className={`badge ${isLab ? 'badge-cyan' : 'badge-teal'}`}>
                      {isLab ? 'Lab Report' : 'Guideline'}
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
                      />
                      <button onClick={() => handleSaveRename(doc._id)} className="text-teal-400 p-1">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="text-[#4a637a] p-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <h4 className="text-xs font-bold text-white truncate" title={doc.filename}>
                      {doc.filename}
                    </h4>
                  )}

                  <div className="grid grid-cols-2 gap-2 bg-white/3 rounded-xl p-2.5">
                    <div>
                      <p className="text-[10px] text-[#4a637a] mb-0.5">Vector Chunks</p>
                      <p className="text-xs font-bold text-teal-400 font-mono">{doc.chunkCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#4a637a] mb-0.5">File Size</p>
                      <p className="text-xs font-mono text-[#8fa3bb]">{formatFileSize(doc.fileSize)}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    <button
                      onClick={() => handleViewFile(doc._id, doc.mimeType)}
                      className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View File
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => handleStartChat(doc)} className="p-1.5 text-[#4a637a] hover:text-teal-400 rounded-lg hover:bg-teal-500/8 transition-colors" title="Start Q&A Chat">
                        <MessageSquare className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => { setEditingId(doc._id); setEditingName(doc.filename); }} className="p-1.5 text-[#4a637a] hover:text-white rounded-lg hover:bg-white/5 transition-colors" title="Rename">
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={() => handleDelete(doc._id)} className="p-1.5 text-[#4a637a] hover:text-red-400 rounded-lg hover:bg-red-500/8 transition-colors" title="Delete">
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

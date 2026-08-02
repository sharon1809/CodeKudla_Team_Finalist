"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  UploadCloud,
  FileText,
  BookOpen,
  Trash2,
  Calendar,
  Download,
  Eye,
  Search,
  CheckCircle2,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";

export default function LibraryManagerPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      toast.error("Failed to load library documents");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      return toast.error("Only PDF files are supported currently.");
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", "guideline");

    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded & processed for RAG vector search!");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Delete this document from your clinical library?")) return;
    try {
      await api.delete(`/documents/${docId}`);
      toast.success("Document removed.");
      fetchDocuments();
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  const handleDownload = async (docId: string, filename: string) => {
    try {
      const res = await api.get(`/documents/${docId}/file`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error("Failed to download document");
    }
  };

  const handleView = async (docId: string) => {
    try {
      const res = await api.get(`/documents/${docId}/file`, {
        responseType: 'blob',
      });
      const fileURL = URL.createObjectURL(res.data);
      window.open(fileURL, '_blank');
    } catch (err) {
      toast.error("Failed to open document");
    }
  };

  const filteredDocs = documents.filter(d =>
    d.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200/80 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-teal-700" />
              Medical RAG Knowledge Base & Library
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Manage clinical textbooks, ICMR guidelines, and hospital protocols indexed for semantic AI search
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search library..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 outline-none w-full sm:w-48"
            />

            <label className="btn-teal text-xs py-2 px-4 shrink-0 cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" /> Upload PDF Guideline
                </>
              )}
              <input
                type="file"
                className="hidden"
                accept=".pdf"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        </div>

        {/* Content Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading medical knowledge base...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-700 mb-1">No Medical Documents Found</h3>
                <p>Upload a PDF guideline or clinical textbook to begin semantic vector search.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="badge-clinical badge-teal">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Vector Indexed
                      </span>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2 group-hover:text-teal-700 transition-colors" title={doc.filename}>
                      {doc.filename}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-medium block mb-4">
                      Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                    <button
                      onClick={() => handleView(doc._id)}
                      className="flex-1 btn-secondary text-xs py-1.5 px-3"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleDownload(doc._id, doc.filename)}
                      className="flex-1 btn-secondary text-xs py-1.5 px-3"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

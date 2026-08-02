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
} from "lucide-react";

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
      toast.success("Document uploaded successfully!");
      fetchDocuments();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Delete this document from your library?")) return;
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
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center gap-3">
              <BookOpen className="w-10 h-10 text-blue-600" />
              Document Library
            </h1>
            <p className="text-gray-500 mt-2 font-medium">
              Manage your uploaded textbooks, journals, and clinical guidelines.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all w-64 shadow-sm"
              />
            </div>
            
            <label className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all font-semibold transform hover:scale-105 active:scale-95 cursor-pointer">
              {uploading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-5 h-5" /> Upload PDF
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

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500 font-medium">Loading your medical library...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-700">
            {filteredDocs.length === 0 ? (
              <div className="col-span-full text-center py-20 text-gray-500 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-700 mb-2">No Documents Found</h3>
                <p>Upload a PDF textbook or guideline to get started.</p>
              </div>
            ) : (
              filteredDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-200 transition-all flex flex-col relative overflow-hidden"
                >
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors z-0" />
                  
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <button
                        onClick={() => handleDelete(doc._id)}
                        className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors"
                        title="Delete Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2" title={doc.filename}>
                      {doc.filename}
                    </h3>

                    <div className="mt-auto pt-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(doc.uploadDate).toLocaleDateString()}
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded-md capitalize">
                          {doc.documentType || "Document"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-gray-50">
                        <button
                          onClick={() => handleView(doc._id)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl text-sm font-bold transition-colors border border-gray-100 hover:border-blue-200"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                        <button
                          onClick={() => handleDownload(doc._id, doc.filename)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-xl text-sm font-bold transition-colors border border-gray-100 hover:border-blue-200"
                        >
                          <Download className="w-4 h-4" /> Download
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

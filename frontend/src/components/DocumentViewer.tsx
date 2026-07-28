'use client';

import React from 'react';
import { FileText, Calendar, HardDrive, Cpu, ExternalLink, Sparkles } from 'lucide-react';

interface Document {
  _id: string;
  filename: string;
  cloudinaryUrl: string;
  fileSize: number;
  chunkCount: number;
  uploadDate: string;
}

interface DocumentViewerProps {
  document: Document | null;
  onStartChat: (docId: string) => void;
  isCreatingChat: boolean;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  document,
  onStartChat,
  isCreatingChat,
}) => {
  if (!document) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-8 glass-panel rounded-3xl border-slate-900">
        <FileText className="h-16 w-16 mb-4 text-slate-700 animate-pulse" />
        <h3 className="text-lg font-semibold text-slate-300">No Document Selected</h3>
        <p className="text-sm mt-1 text-slate-500 text-center max-w-xs">
          Select a document from the sidebar to view details, metadata, and start a RAG chat session.
        </p>
      </div>
    );
  }

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const isPdf = document.filename.toLowerCase().endsWith('.pdf');

  return (
    <div className="h-full flex flex-col glass-panel rounded-3xl border-slate-800/80 overflow-hidden">
      {/* Viewer Header */}
      <div className="p-6 border-b border-slate-900 bg-slate-950/40 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white max-w-md truncate" title={document.filename}>
              {document.filename}
            </h2>
            <p className="text-xs text-slate-400">Metadata & Viewer</p>
          </div>
        </div>

        <button
          onClick={() => onStartChat(document._id)}
          disabled={isCreatingChat}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center gap-1.5 border border-indigo-400/20 active:scale-[0.98]"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {isCreatingChat ? 'Starting chat...' : 'Start Chat'}
        </button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="space-y-6 lg:col-span-1">
          <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-900 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Document Specs
            </h3>

            {/* Size */}
            <div className="flex items-center gap-3 text-slate-300">
              <HardDrive className="h-5 w-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">File Size</p>
                <p className="text-sm font-semibold">{formatBytes(document.fileSize)}</p>
              </div>
            </div>

            {/* Upload Date */}
            <div className="flex items-center gap-3 text-slate-300">
              <Calendar className="h-5 w-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Uploaded On</p>
                <p className="text-sm font-semibold">
                  {new Date(document.uploadDate).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Chunk count */}
            <div className="flex items-center gap-3 text-slate-300">
              <Cpu className="h-5 w-5 text-slate-500 shrink-0" />
              <div>
                <p className="text-xs text-slate-500">RAG Chunk Count</p>
                <p className="text-sm font-semibold text-indigo-400">{document.chunkCount} vector segments</p>
              </div>
            </div>
          </div>

          <a
            href={document.cloudinaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-800 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Open Original Resource
          </a>
        </div>

        {/* Preview Column */}
        <div className="lg:col-span-2 flex flex-col h-[500px] lg:h-auto rounded-2xl border border-slate-900 bg-slate-950/40 overflow-hidden">
          <div className="px-4 py-3 bg-slate-950/80 border-b border-slate-900 flex justify-between items-center">
            <span className="text-xs font-semibold text-slate-400">Interactive Preview</span>
            <span className="text-[10px] uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {isPdf ? 'PDF' : 'DOCX'}
            </span>
          </div>

          <div className="flex-1 bg-slate-950 flex items-center justify-center p-4">
            {isPdf ? (
              <iframe
                src={`${document.cloudinaryUrl}#toolbar=0`}
                className="w-full h-full border-0 rounded-lg bg-slate-900"
                title="Document Preview"
              />
            ) : (
              <div className="text-center p-6 space-y-3">
                <FileText className="h-12 w-12 text-slate-700 mx-auto" />
                <h4 className="text-slate-400 text-sm font-semibold">Pre-rendering not available</h4>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                  Word documents (.docx) cannot be rendered interactively in-browser. Please use the button on the left to download/open the original document.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

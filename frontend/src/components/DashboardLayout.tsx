'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Stethoscope,
  FileText,
  MessageSquare,
  LogOut,
  UploadCloud,
  Trash2,
  Edit2,
  X,
  Check,
  Plus,
  Settings,
  BookOpen,
  FileSearch,
  Activity,
  Key,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface Document {
  _id: string;
  filename: string;
  fileSize: number;
  chunkCount: number;
  documentType: 'general' | 'lab_report';
  uploadDate: string;
}

export interface Chat {
  _id: string;
  title: string;
  document: { _id: string; filename: string };
  messages?: any[];
}

interface DashboardLayoutProps {
  documents: Document[];
  chats: Chat[];
  onUploadSuccess: () => void;
  onDeleteDocument: (docId: string) => void;
  onRenameDocument: (docId: string, newName: string) => void;
  onSelectDocument: (doc: Document) => void;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chatId: string) => void;
  onRenameChat: (chatId: string, newTitle: string) => void;
  activeTab: 'copilot' | 'reports' | 'patient_reports' | 'documents' | 'chat';
  setActiveTab: (tab: 'copilot' | 'reports' | 'patient_reports' | 'documents' | 'chat') => void;
  activeChat: Chat | null;
  onNewChatCreated?: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    id: 'copilot' as const,
    label: 'OPD Clinical Copilot',
    sub: 'Sub-10s DD & Treatment',
    icon: Activity,
    accent: 'text-teal-400',
    activeClass: 'bg-teal-500/10 text-teal-300 border-teal-500/25',
  },
  {
    id: 'patient_reports' as const,
    label: 'Textbook Patient Reports',
    sub: 'RAG literature grounded',
    icon: FileText,
    accent: 'text-blue-400',
    activeClass: 'bg-blue-500/10 text-blue-300 border-blue-500/25',
  },
  {
    id: 'reports' as const,
    label: 'OCR Lab Report Analyzer',
    sub: 'Blood tests & pathology',
    icon: FileSearch,
    accent: 'text-cyan-400',
    activeClass: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
  },
  {
    id: 'documents' as const,
    label: 'Document & Vector Library',
    sub: '',
    icon: BookOpen,
    accent: 'text-emerald-400',
    activeClass: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25',
  },
];

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  documents,
  chats,
  onUploadSuccess,
  onDeleteDocument,
  onRenameDocument,
  onSelectDocument,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  activeTab,
  setActiveTab,
  activeChat,
  onNewChatCreated,
  children,
}) => {
  const { user, logout, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'general' | 'lab_report'>('general');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileFirst, setProfileFirst] = useState(user?.firstName || '');
  const [profileLast, setProfileLast] = useState(user?.lastName || '');
  const [profilePass, setProfilePass] = useState('');
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', uploadType);

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    // Animate progress
    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 8, 90));
    }, 400);

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadProgress(100);
      setTimeout(() => { setUploadProgress(0); }, 1000);
      onUploadSuccess();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'Upload failed.');
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
    // Reset input
    e.target.value = '';
  };

  const handleStartGlobalChat = async () => {
    try {
      const res = await api.post('/chats', { title: 'Global Medical Library Chat' });
      if (onNewChatCreated) onNewChatCreated();
      onSelectChat(res.data.chat);
      setActiveTab('chat');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start global library chat.');
    }
  };

  const handleSaveChatRename = (chatId: string) => {
    if (editingChatTitle.trim()) onRenameChat(chatId, editingChatTitle.trim());
    setEditingChatId(null);
  };

  const handleUpdateProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    setProfileSubmitting(true);
    try {
      await updateUser(profileFirst, profileLast, profilePass || undefined);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      setProfilePass('');
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Profile update failed.' });
    } finally {
      setProfileSubmitting(false);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-[#03080f] text-[#f0f6ff]">

      {/* ─── SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-72 flex flex-col sidebar shrink-0 overflow-hidden">

        {/* Brand Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-md shadow-teal-500/20 border border-teal-400/20">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-tight">MedSynexa</p>
                <p className="text-[9px] text-teal-400 font-bold uppercase tracking-widest">Clinical AI</p>
              </div>
            </div>
            <button
              onClick={() => {
                setProfileFirst(user?.firstName || '');
                setProfileLast(user?.lastName || '');
                setProfileMsg(null);
                setIsProfileOpen(true);
              }}
              className="p-2 text-[#4a637a] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              title="Profile Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Widget */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="section-label">Quick Upload</span>
              <select
                value={uploadType}
                onChange={(e: any) => setUploadType(e.target.value)}
                className="bg-transparent border border-white/8 text-[10px] text-teal-400 font-semibold rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value="general">Guideline</option>
                <option value="lab_report">Lab Report</option>
              </select>
            </div>

            <label className="upload-zone flex flex-col items-center justify-center p-4 text-center group">
              <UploadCloud className="h-5 w-5 text-[#4a637a] group-hover:text-teal-400 mb-1.5 transition-colors" />
              <span className="text-xs font-semibold text-[#8fa3bb] group-hover:text-white transition-colors">
                {isUploading ? 'Uploading & Indexing...' : `Upload ${uploadType === 'lab_report' ? 'Lab Report' : 'Clinical Guideline'}`}
              </span>
              <span className="text-[10px] text-[#4a637a] mt-0.5">PDF, DOCX, PNG, JPG (Max 20MB)</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-1.5">
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-teal-400 text-center font-medium">
                  Compressing → Embedding → Indexing in pgvector...
                </p>
              </div>
            )}

            {uploadError && (
              <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-300 text-[10px] flex items-center justify-between">
                <span>{uploadError}</span>
                <button onClick={() => setUploadError(null)} className="text-red-400 ml-1 hover:text-red-300">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">

          {/* Clinical Features */}
          <div className="space-y-1">
            <span className="section-label px-2 block mb-2">Clinical Workflows</span>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-item w-full ${isActive ? `active ${item.activeClass}` : ''}`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? item.accent : 'text-[#4a637a]'}`} />
                  <div className="text-left truncate min-w-0">
                    <p className="truncate text-xs font-semibold">{item.label}</p>
                    {item.sub && (
                      <p className="text-[10px] text-[#4a637a] font-normal truncate">
                        {item.id === 'documents' ? `${documents.length} files in pgvector` : item.sub}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat History */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between px-2">
              <span className="section-label">Medical Q&A History</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleStartGlobalChat}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold text-teal-400 hover:text-teal-300 border border-teal-500/20 hover:border-teal-500/40 hover:bg-teal-500/5 transition-all"
                  title="Chat with entire medical library"
                >
                  <Plus className="h-3 w-3" />
                  Library
                </button>
                <span className="text-[10px] text-[#4a637a] font-mono">{chats.length}</span>
              </div>
            </div>

            {chats.length === 0 ? (
              <p className="px-2 py-3 text-xs text-[#4a637a] text-center">No active Q&A sessions yet.</p>
            ) : (
              <div className="space-y-0.5">
                {chats.map((ch) => {
                  const isActive = activeChat?._id === ch._id && activeTab === 'chat';
                  return (
                    <div
                      key={ch._id}
                      className={`group flex items-center justify-between px-2.5 py-2.5 rounded-xl transition-all ${
                        isActive
                          ? 'bg-teal-500/8 text-white border border-teal-500/20'
                          : 'hover:bg-white/4 text-[#8fa3bb]'
                      }`}
                    >
                      {editingChatId === ch._id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={editingChatTitle}
                            onChange={(e) => setEditingChatTitle(e.target.value)}
                            className="input-field flex-1 px-2 py-1 text-xs"
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveChatRename(ch._id); }}
                            autoFocus
                          />
                          <button onClick={() => handleSaveChatRename(ch._id)} className="text-teal-400 shrink-0 p-1">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingChatId(null)} className="text-[#4a637a] shrink-0 p-1">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { onSelectChat(ch); setActiveTab('chat'); }}
                            className="flex items-center gap-2.5 truncate text-left flex-1 min-w-0"
                          >
                            <div className={`h-6 w-6 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-teal-500/15' : 'bg-white/5'}`}>
                              <MessageSquare className={`h-3 w-3 ${isActive ? 'text-teal-400' : 'text-[#4a637a]'}`} />
                            </div>
                            <div className="truncate min-w-0">
                              <p className="truncate text-xs font-semibold text-white">{ch.title}</p>
                              <p className="text-[10px] text-[#4a637a] truncate">
                                {ch.document?.filename || 'Global Library'}
                              </p>
                            </div>
                          </button>

                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 ml-1 transition-opacity">
                            <button
                              onClick={() => { setEditingChatId(ch._id); setEditingChatTitle(ch.title); }}
                              className="p-1.5 hover:bg-white/8 rounded-lg text-[#4a637a] hover:text-white transition-colors"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onDeleteChat(ch._id)}
                              className="p-1.5 hover:bg-red-500/10 rounded-lg text-[#4a637a] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Doctor Profile Footer */}
        <div className="p-4 border-t border-white/5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-teal-600/30 to-teal-800/30 border border-teal-500/20 flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-teal-400">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="truncate min-w-0">
                <p className="text-xs font-bold text-white truncate">Dr. {user?.firstName} {user?.lastName}</p>
                <p className="text-[10px] text-[#4a637a] truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 text-[#4a637a] hover:text-red-400 rounded-lg hover:bg-red-500/8 transition-colors shrink-0"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#030912]">
        {/* Subtle top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-teal-500/20 to-transparent shrink-0" />
        <div className="flex-1 overflow-hidden p-5">
          {children}
        </div>
      </main>

      {/* ─── PROFILE MODAL ───────────────────────────────────── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-elevated w-full max-w-md rounded-3xl p-7 relative fade-in-up">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 text-[#4a637a] hover:text-white p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-7">
              <div className="icon-container icon-teal h-9 w-9">
                <Settings className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Doctor Profile Settings</h3>
                <p className="text-[11px] text-[#4a637a]">Update your account information</p>
              </div>
            </div>

            {profileMsg && (
              <div className={`p-3 rounded-xl text-xs mb-5 border ${
                profileMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/20 text-red-300'
              }`}>
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block section-label mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileFirst}
                    onChange={(e) => setProfileFirst(e.target.value)}
                    className="input-field px-3 py-2.5 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block section-label mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileLast}
                    onChange={(e) => setProfileLast(e.target.value)}
                    className="input-field px-3 py-2.5 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block section-label mb-2">New Password (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4a637a]">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={profilePass}
                    onChange={(e) => setProfilePass(e.target.value)}
                    className="input-field pl-10 pr-4 py-2.5 text-sm"
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="btn-primary w-full py-3 text-sm flex items-center justify-center gap-2 mt-2"
              >
                {profileSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full spin" />
                ) : 'Save Profile Settings'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

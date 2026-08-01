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
  ChevronDown,
  FlaskConical,
  Layers,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
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
    label: 'OPD Copilot',
    sub: 'AI clinical decision support',
    icon: Activity,
    iconBg: 'icon-teal',
    activeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    activeDot: 'bg-teal-500',
  },
  {
    id: 'patient_reports' as const,
    label: 'Textbook Query',
    sub: 'RAG-grounded literature',
    icon: BookOpen,
    iconBg: 'icon-indigo',
    activeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    activeDot: 'bg-indigo-500',
  },
  {
    id: 'reports' as const,
    label: 'Lab Report Analyzer',
    sub: 'OCR + clinical insights',
    icon: FlaskConical,
    iconBg: 'icon-cyan',
    activeClass: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    activeDot: 'bg-cyan-500',
  },
  {
    id: 'documents' as const,
    label: 'Document Library',
    sub: 'Textbooks & lab reports',
    icon: Layers,
    iconBg: 'icon-emerald',
    activeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    activeDot: 'bg-emerald-500',
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

  const [isChatExpanded, setIsChatExpanded] = useState(true);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', uploadType);

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

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
    e.target.value = '';
  };

  const handleStartGlobalChat = async () => {
    try {
      const res = await api.post('/chats', { title: 'Medical Library Chat' });
      if (onNewChatCreated) onNewChatCreated();
      onSelectChat(res.data.chat);
      setActiveTab('chat');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start chat.');
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

  const generalDocs = documents.filter(d => d.documentType === 'general');
  const labDocs = documents.filter(d => d.documentType === 'lab_report');

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-[#F1F5F9] text-[#0F172A] relative font-sans">
      
      {/* ─── FLOATING GLASSMORPHIC TOP NAVIGATION ────────────────────── */}
      <div className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        <header className="w-full bg-white/85 backdrop-blur-xl border border-white shadow-[0_4px_24px_-8px_rgba(0,0,0,0.08)] rounded-2xl flex items-center justify-between px-5 py-2.5 pointer-events-auto transition-all">
          
          {/* Brand */}
          <div className="flex items-center gap-3 w-56 shrink-0">
            <div className="h-10 w-10 rounded-[14px] bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/30">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[16px] font-black text-[#0F172A] tracking-tight leading-none mb-0.5">MedSynexa</p>
              <p className="text-[9px] text-teal-600 font-bold uppercase tracking-[0.2em]">Clinical AI</p>
            </div>
          </div>

          {/* Center: Premium Pill Navigation */}
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1.5 bg-[#F8FAFC]/80 backdrop-blur-md p-1.5 rounded-xl border border-[#E2E8F0] shadow-inner">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all duration-300 ease-out ${
                      isActive
                        ? 'bg-white text-teal-700 shadow-sm border border-[#E2E8F0]/80 scale-100'
                        : 'text-[#64748B] hover:text-[#0F172A] hover:bg-white/50 border border-transparent scale-95 hover:scale-100'
                    }`}
                  >
                    <Icon className={`h-4 w-4 transition-colors ${isActive ? 'text-teal-500' : 'text-[#94A3B8]'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Profile & Upload Utilities */}
          <div className="flex items-center justify-end gap-3 w-56 shrink-0">
            
            {/* Quick Upload Button */}
            <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-50 to-teal-100/50 text-teal-700 hover:bg-teal-100 transition-all cursor-pointer border border-teal-200/50 hover:shadow-sm" title="Quick Upload Textbook">
              <UploadCloud className={`h-4 w-4 ${isUploading ? 'animate-bounce' : ''}`} />
              <span className="text-xs font-bold">{isUploading ? 'Uploading...' : 'Upload'}</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={(e) => {
                  setUploadType('general');
                  handleFileUpload(e);
                }}
                disabled={isUploading}
              />
            </label>

            <div className="h-8 w-px bg-[#E2E8F0] mx-1"></div>

            {/* Profile Dropdown Trigger */}
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#F1F5F9] transition-all border border-transparent hover:border-[#E2E8F0]">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 border border-indigo-200 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="text-[11px] font-bold text-indigo-700">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <ChevronDown className="h-3 w-3 text-[#94A3B8] mr-1" />
              </button>
              
              {/* Profile Menu */}
              <div className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-white opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform origin-top-right scale-95 group-hover:scale-100">
                <div className="p-4 border-b border-[#F1F5F9] bg-gradient-to-b from-[#F8FAFC] to-white rounded-t-2xl">
                  <p className="text-sm font-bold text-[#0F172A] truncate">Dr. {user?.firstName} {user?.lastName}</p>
                  <p className="text-[11px] font-medium text-[#94A3B8] truncate mt-0.5">{user?.email}</p>
                </div>
                <div className="p-2.5 space-y-1">
                  <button
                    onClick={() => {
                      setProfileFirst(user?.firstName || '');
                      setProfileLast(user?.lastName || '');
                      setProfileMsg(null);
                      setIsProfileOpen(true);
                    }}
                    className="w-full text-left px-3 py-2.5 text-xs font-semibold text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-xl flex items-center gap-2.5 transition-colors"
                  >
                    <Settings className="h-4 w-4 text-[#94A3B8]" /> Profile Settings
                  </button>
                  <button
                    onClick={logout}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-xl flex items-center gap-2.5 mt-1 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>
      </div>

      {/* ─── MAIN LAYOUT AREA ────────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden pt-24 pb-4 px-4 gap-4 z-10">
        
        {/* CENTER: Main Workspace Canvas */}
        <main className="flex-1 rounded-[24px] bg-white shadow-sm border border-[#E2E8F0] overflow-hidden relative flex flex-col">
          {/* Subtle accent gradient inside canvas */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-teal-400/30 to-transparent z-0 pointer-events-none" />
          
          {uploadError && (
            <div className="mx-6 mt-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center justify-between shrink-0 relative z-10 shadow-sm">
              <span>{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded-md transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden relative z-10">
            {children}
          </div>
        </main>

        {/* RIGHT SIDEBAR: History & Context */}
        <aside className="w-80 rounded-[24px] bg-white shadow-sm border border-[#E2E8F0] overflow-hidden flex flex-col shrink-0">
          <div className="p-5 border-b border-[#F1F5F9] bg-gradient-to-b from-[#F8FAFC] to-white">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-600" />
              Clinical Context
            </h3>
            <p className="text-[10px] text-[#94A3B8] font-medium mt-1 uppercase tracking-wider">Your Library & History</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            
            {/* Storage Widget */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Cloud Storage</span>
                <span className="text-[10px] font-mono font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">{documents.length} Docs</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] hover:border-teal-200 transition-colors cursor-default">
                  <FileText className="h-4 w-4 text-teal-500 mb-2" />
                  <p className="text-xl font-black text-[#0F172A] leading-none mb-1">{generalDocs.length}</p>
                  <p className="text-[10px] text-[#64748B] font-medium">Textbooks</p>
                </div>
                <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0] hover:border-cyan-200 transition-colors cursor-default">
                  <FlaskConical className="h-4 w-4 text-cyan-500 mb-2" />
                  <p className="text-xl font-black text-[#0F172A] leading-none mb-1">{labDocs.length}</p>
                  <p className="text-[10px] text-[#64748B] font-medium">Lab Reports</p>
                </div>
              </div>
            </div>

            <div className="h-px bg-[#F1F5F9] w-full" />

            {/* Q&A History List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">Recent Sessions</span>
                <button
                  onClick={handleStartGlobalChat}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-indigo-600 hover:text-white border border-indigo-200 hover:bg-indigo-500 hover:border-indigo-500 transition-all shadow-sm"
                >
                  <Plus className="h-3 w-3" /> New
                </button>
              </div>

              <div className="space-y-1.5">
                {chats.length === 0 ? (
                  <div className="text-center p-6 bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
                    <MessageSquare className="h-6 w-6 text-[#94A3B8] mx-auto mb-2 opacity-50" />
                    <p className="text-xs font-medium text-[#64748B]">No recent sessions</p>
                    <p className="text-[10px] text-[#94A3B8] mt-1">Start a new chat to keep history</p>
                  </div>
                ) : (
                  chats.map((ch) => {
                    const isActive = activeChat?._id === ch._id && activeTab === 'chat';
                    return (
                      <div
                        key={ch._id}
                        className={`group flex items-center justify-between p-2.5 rounded-xl transition-all border ${
                          isActive
                            ? 'bg-teal-50 border-teal-200 shadow-sm'
                            : 'bg-white border-transparent hover:border-[#E2E8F0] hover:shadow-sm'
                        }`}
                      >
                        {editingChatId === ch._id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={editingChatTitle}
                              onChange={(e) => setEditingChatTitle(e.target.value)}
                              className="input-field flex-1 px-2.5 py-1.5 text-xs font-medium"
                              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveChatRename(ch._id); }}
                              autoFocus
                            />
                            <button onClick={() => handleSaveChatRename(ch._id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-md transition-colors">
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => setEditingChatId(null)} className="text-[#94A3B8] hover:bg-[#F1F5F9] p-1.5 rounded-md transition-colors">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => { onSelectChat(ch); setActiveTab('chat'); }}
                              className="flex items-center gap-3 truncate text-left flex-1 min-w-0"
                            >
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isActive ? 'bg-teal-100' : 'bg-[#F1F5F9] group-hover:bg-white border border-[#E2E8F0]'}`}>
                                <MessageSquare className={`h-3.5 w-3.5 ${isActive ? 'text-teal-600' : 'text-[#64748B]'}`} />
                              </div>
                              <div className="truncate min-w-0 flex-1">
                                <p className={`truncate text-xs font-bold ${isActive ? 'text-teal-800' : 'text-[#0F172A]'}`}>{ch.title}</p>
                                <p className="text-[10px] text-[#64748B] font-medium truncate mt-0.5 flex items-center gap-1">
                                  <FileText className="h-2.5 w-2.5 opacity-70" />
                                  {ch.document?.filename || 'Library'}
                                </p>
                              </div>
                            </button>

                            <div className="opacity-0 group-hover:opacity-100 flex flex-col gap-1 shrink-0 ml-2 transition-opacity">
                              <button
                                onClick={() => { setEditingChatId(ch._id); setEditingChatTitle(ch.title); }}
                                className="p-1 hover:bg-[#F1F5F9] rounded text-[#94A3B8] hover:text-[#0F172A] transition-colors"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => onDeleteChat(ch._id)}
                                className="p-1 hover:bg-red-50 rounded text-[#94A3B8] hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* ─── PROFILE MODAL ───────────────────────────────────── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/40 backdrop-blur-sm p-4 fade-in">
          <div className="w-full max-w-md rounded-[24px] p-7 relative bg-white shadow-2xl border border-white/20 transform transition-all scale-100">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-5 right-5 text-[#94A3B8] hover:text-[#0F172A] p-2 hover:bg-[#F1F5F9] rounded-xl transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 mb-8">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#0F172A] tracking-tight">Profile Settings</h3>
                <p className="text-xs font-medium text-[#64748B] mt-0.5">Manage your clinical account</p>
              </div>
            </div>

            {profileMsg && (
              <div className={`p-4 rounded-xl text-sm font-medium mb-6 border flex items-center gap-3 ${
                profileMsg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileFirst}
                    onChange={(e) => setProfileFirst(e.target.value)}
                    className="input-field px-4 py-3 text-sm font-medium shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileLast}
                    onChange={(e) => setProfileLast(e.target.value)}
                    className="input-field px-4 py-3 text-sm font-medium shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-2">New Password (optional)</label>
                <div className="relative shadow-sm rounded-xl overflow-hidden">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#94A3B8]">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={profilePass}
                    onChange={(e) => setProfilePass(e.target.value)}
                    className="input-field pl-11 pr-4 py-3 text-sm font-medium focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="w-full py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
                >
                  {profileSubmitting ? (
                    <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

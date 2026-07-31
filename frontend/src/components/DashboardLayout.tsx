'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Stethoscope,
  FileText,
  MessageSquare,
  User as UserIcon,
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
  document: {
    _id: string;
    filename: string;
  };
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
  activeTab: 'copilot' | 'reports' | 'documents' | 'chat';
  setActiveTab: (tab: 'copilot' | 'reports' | 'documents' | 'chat') => void;
  activeChat: Chat | null;
  onNewChatCreated?: () => void;
  children: React.ReactNode;
}

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

  // States for renaming
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');

  // Profile modal
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

    try {
      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploadSuccess();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleStartGlobalChat = async () => {
    try {
      const res = await api.post('/chats', { title: 'Global Medical Library Chat' });
      if (onNewChatCreated) {
        onNewChatCreated();
      }
      onSelectChat(res.data.chat);
      setActiveTab('chat');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to start global library chat.');
    }
  };

  const handleSaveChatRename = (chatId: string) => {
    if (editingChatTitle.trim()) {
      onRenameChat(chatId, editingChatTitle.trim());
    }
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
    <div className="h-screen flex overflow-hidden bg-slate-950 text-slate-100">
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col justify-between overflow-hidden shrink-0">
        
        {/* App Header & Brand */}
        <div className="p-5 border-b border-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 border border-teal-400/30">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-white tracking-tight text-sm block">MedSynexa</span>
                <span className="text-[10px] text-teal-400 font-semibold uppercase">Clinical AI Copilot</span>
              </div>
            </div>
            <button
              onClick={() => {
                setProfileFirst(user?.firstName || '');
                setProfileLast(user?.lastName || '');
                setProfileMsg(null);
                setIsProfileOpen(true);
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
              title="Doctor Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Widget */}
          <div className="relative space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
              <span>Quick Upload</span>
              <select
                value={uploadType}
                onChange={(e: any) => setUploadType(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-[10px] text-teal-400 font-semibold rounded px-1.5 py-0.5"
              >
                <option value="general">Guideline</option>
                <option value="lab_report">Lab Report</option>
              </select>
            </div>

            <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-teal-500/50 bg-slate-900/40 hover:bg-slate-900/80 transition-all rounded-xl p-3 cursor-pointer text-center group">
              <UploadCloud className="h-5 w-5 text-slate-500 group-hover:text-teal-400 mb-1 transition-colors" />
              <span className="text-xs font-semibold text-slate-300">
                Upload {uploadType === 'lab_report' ? 'Lab Report Scan' : 'Clinical Guideline'}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5">PDF, DOCX, PNG, JPG (Max 20MB)</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>

            {isUploading && (
              <div className="absolute inset-0 bg-slate-950/90 rounded-xl flex flex-col items-center justify-center gap-2 z-10">
                <div className="h-5 w-5 border-2 border-teal-500 border-t-transparent animate-spin rounded-full" />
                <span className="text-[10px] font-semibold text-teal-300">Indexing in pgvector...</span>
              </div>
            )}

            {uploadError && (
              <div className="p-2 rounded-lg bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] flex items-center justify-between">
                <span>{uploadError}</span>
                <button onClick={() => setUploadError(null)} className="text-red-400 ml-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          
          {/* Main Clinical Features */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
              Clinical Workflows
            </span>

            {/* Feature 1: Clinical Copilot */}
            <button
              onClick={() => setActiveTab('copilot')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'copilot'
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <Activity className={`h-4 w-4 shrink-0 ${activeTab === 'copilot' ? 'text-teal-400' : 'text-slate-400'}`} />
              <div className="text-left truncate">
                <p className="truncate font-bold">OPD Clinical Copilot</p>
                <p className="text-[10px] text-slate-500 font-normal">Sub-10s DD & Treatment</p>
              </div>
            </button>

            {/* Feature 2: Lab Report Analyzer */}
            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'reports'
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <FileSearch className={`h-4 w-4 shrink-0 ${activeTab === 'reports' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <div className="text-left truncate">
                <p className="truncate font-bold">OCR Lab Report Analyzer</p>
                <p className="text-[10px] text-slate-500 font-normal">Blood tests & pathology</p>
              </div>
            </button>

            {/* Feature 3: Dedicated Document Library */}
            <button
              onClick={() => setActiveTab('documents')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'documents'
                  ? 'bg-teal-600/20 text-teal-300 border border-teal-500/40 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <BookOpen className={`h-4 w-4 shrink-0 ${activeTab === 'documents' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <div className="text-left truncate">
                <p className="truncate font-bold">Document & Vector Library</p>
                <p className="text-[10px] text-slate-500 font-normal">{documents.length} files in pgvector</p>
              </div>
            </button>
          </div>

          {/* Conversations / Medical Chat History */}
          <div className="space-y-2 pt-2 border-t border-slate-900">
            <h3 className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
              <span>Medical Q&A History</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleStartGlobalChat}
                  className="px-2 py-0.5 hover:bg-slate-900 rounded text-teal-400 hover:text-teal-300 border border-teal-500/25 hover:border-teal-500/40 transition-all flex items-center gap-0.5 normal-case font-bold text-[9px]"
                  title="Chat with entire medical library"
                >
                  <Plus className="h-3 w-3" />
                  <span>Library</span>
                </button>
                <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 text-[9px]">{chats.length}</span>
              </div>
            </h3>

            {chats.length === 0 ? (
              <p className="px-2 py-3 text-xs text-slate-600 text-center">No active Q&A sessions.</p>
            ) : (
              <div className="space-y-1">
                {chats.map((ch) => {
                  const isActive = activeChat?._id === ch._id && activeTab === 'chat';
                  return (
                    <div
                      key={ch._id}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
                        isActive ? 'bg-teal-600/10 text-white border border-teal-500/30' : 'hover:bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      {editingChatId === ch._id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={editingChatTitle}
                            onChange={(e) => setEditingChatTitle(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                          <button onClick={() => handleSaveChatRename(ch._id)} className="text-emerald-400 shrink-0">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingChatId(null)} className="text-slate-400 shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              onSelectChat(ch);
                              setActiveTab('chat');
                            }}
                            className="flex items-center gap-2 truncate text-left flex-1"
                          >
                            <MessageSquare className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-teal-400" />
                            <div className="truncate text-xs font-medium">
                              <p className="truncate font-bold">{ch.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">
                                Source: {ch.document?.filename || 'All Documents (Global Library)'}
                              </p>
                            </div>
                          </button>

                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 ml-1">
                            <button
                              onClick={() => {
                                setEditingChatId(ch._id);
                                setEditingChatTitle(ch.title);
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                              title="Rename Session"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onDeleteChat(ch._id)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400"
                              title="Delete Session"
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

        {/* Footer Doctor Profile */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-teal-400">
              <UserIcon className="h-4.5 w-4.5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                Dr. {user?.firstName} {user?.lastName}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-900 transition-colors shrink-0"
            title="Log Out"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950 p-5">
        {children}
      </main>

      {/* DOCTOR PROFILE SETTINGS MODAL */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel-glow w-full max-w-md rounded-3xl overflow-hidden p-6 relative">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 text-teal-400">
                <Settings className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-white">Doctor Profile Settings</h3>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-xl text-xs mb-4 border ${
                  profileMsg.type === 'success'
                    ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-200'
                    : 'bg-red-950/40 border-red-500/20 text-red-200'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profileFirst}
                    onChange={(e) => setProfileFirst(e.target.value)}
                    className="block w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profileLast}
                    onChange={(e) => setProfileLast(e.target.value)}
                    className="block w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Update Password (optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={profilePass}
                    onChange={(e) => setProfilePass(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-teal-400/20 transition-all shadow-md"
              >
                {profileSubmitting ? 'Updating...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

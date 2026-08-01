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
  Activity,
  Key,
  ChevronDown,
  FlaskConical,
  Layers,
  CheckCircle,
  AlertTriangle,
  Users,
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
  activeTab: 'copilot' | 'drug_safety' | 'reports' | 'patient_reports' | 'documents' | 'chat' | 'xray_tech' | 'xray_doctor' | 'manage_patients';
  setActiveTab: (tab: 'copilot' | 'drug_safety' | 'reports' | 'patient_reports' | 'documents' | 'chat' | 'xray_tech' | 'xray_doctor' | 'manage_patients') => void;
  activeChat: Chat | null;
  onNewChatCreated?: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  {
    id: 'copilot' as const,
    label: 'Consultation Scribe',
    sub: 'OPD decision support',
    icon: Activity,
  },
  {
    id: 'drug_safety' as const,
    label: 'Drug Safety Copilot',
    sub: 'Evaluate polypharmacy',
    icon: AlertTriangle,
  },
  {
    id: 'patient_reports' as const,
    label: 'Clinical Library',
    sub: 'Search medical guidelines',
    icon: BookOpen,
  },
  {
    id: 'reports' as const,
    label: 'Lab Report Scanner',
    sub: 'Extract pathology data',
    icon: FlaskConical,
  },
  {
    id: 'documents' as const,
    label: 'Reference Library',
    sub: 'Manage clinical documents',
    icon: Layers,
  },
  {
    id: 'manage_patients' as const,
    label: 'Manage Patients',
    sub: 'Patient Directory',
    icon: Users,
  },
  {
    id: 'xray_tech' as const,
    label: 'X-Ray Tech',
    sub: 'Upload and AI Analysis',
    icon: UploadCloud,
    iconBg: 'icon-blue',
    activeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    activeDot: 'bg-blue-500',
  },
  {
    id: 'xray_doctor' as const,
    label: 'X-Ray Doctor',
    sub: 'Review & Approve',
    icon: CheckCircle,
    iconBg: 'icon-green',
    activeClass: 'bg-green-50 text-green-800 border-green-200',
    activeDot: 'bg-green-500',
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
      const res = await api.post('/chats', { title: 'Clinical Library Inquiry' });
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
    <div className="h-screen w-full flex overflow-hidden bg-[#FAFAFA] text-[#111111] font-sans">
      
      {/* ─── SIDEBAR ────────────────────────────────────────── */}
      <aside className="w-64 bg-white border-r border-gray-200/80 flex flex-col shrink-0 h-full relative z-30">
        
        {/* Sidebar Header: Branding */}
        <div className="p-5 border-b border-gray-100 flex items-center gap-3 shrink-0">
          <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/10">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-[#111111] tracking-tight leading-none mb-0.5">MedSynexa</p>
            <p className="text-[9px] text-blue-600 font-bold uppercase tracking-[0.15em]">Clinical AI</p>
          </div>
        </div>

        {/* Scrollable Sidebar Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          
          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="block px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Workspace</span>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`nav-item w-full flex items-center justify-between ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="h-px bg-gray-100 w-full" />

          {/* Recent Q&A Sessions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Library Consultations</span>
              <button
                onClick={handleStartGlobalChat}
                className="flex items-center gap-0.5 text-[9px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/50 transition-colors shadow-sm"
              >
                <Plus className="h-2.5 w-2.5" /> New
              </button>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto">
              {chats.length === 0 ? (
                <div className="text-center p-4 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                  <p className="text-[10px] font-medium text-gray-400">No consultations yet</p>
                </div>
              ) : (
                chats.map((ch) => {
                  const isActive = activeChat?._id === ch._id && activeTab === 'chat';
                  return (
                    <div
                      key={ch._id}
                      className={`group flex items-center justify-between p-2 rounded-lg border text-left transition-all ${
                        isActive
                          ? 'bg-blue-50/50 border-blue-200/60 shadow-sm'
                          : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50/30'
                      }`}
                    >
                      {editingChatId === ch._id ? (
                        <div className="flex items-center gap-1 w-full">
                          <input
                            type="text"
                            value={editingChatTitle}
                            onChange={(e) => setEditingChatTitle(e.target.value)}
                            className="input-field flex-1 px-2 py-1 text-[11px] font-medium"
                            onKeyDown={(e) => { if (e.key === 'Enter' && editingChatTitle.trim()) handleSaveChatRename(ch._id); }}
                            autoFocus
                          />
                          <button onClick={() => handleSaveChatRename(ch._id)} className="text-green-600 p-1 hover:bg-green-50 rounded">
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => { onSelectChat(ch); setActiveTab('chat'); }}
                            className="flex-1 min-w-0 flex items-center gap-2 text-left"
                          >
                            <MessageSquare className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div className="truncate min-w-0">
                              <p className={`truncate text-xs font-semibold ${isActive ? 'text-blue-800' : 'text-gray-700'}`}>{ch.title}</p>
                              <p className="text-[9px] text-gray-400 truncate mt-0.5">{ch.document?.filename || 'Library'}</p>
                            </div>
                          </button>

                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-1 shrink-0 transition-opacity">
                            <button
                              onClick={() => { setEditingChatId(ch._id); setEditingChatTitle(ch.title); }}
                              className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-800"
                            >
                              <Edit2 className="h-2.5 w-2.5" />
                            </button>
                            <button
                              onClick={() => onDeleteChat(ch._id)}
                              className="p-0.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="h-2.5 w-2.5" />
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

          <div className="h-px bg-gray-100 w-full" />

          {/* Database metrics */}
          <div className="space-y-2">
            <span className="block px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Reference Databases</span>
            <div className="space-y-1.5 px-2">
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><FileText className="h-3 w-3 text-blue-500" /> Guidelines</span>
                <span className="font-semibold text-gray-700">{generalDocs.length}</span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                <span className="flex items-center gap-1.5"><FlaskConical className="h-3 w-3 text-cyan-500" /> Lab Reports</span>
                <span className="font-semibold text-gray-700">{labDocs.length}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Footer: Quick Upload & Profile */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 space-y-3.5 shrink-0">
          {/* Quick upload control */}
          <label className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100/80 transition-all cursor-pointer border border-blue-200/30 text-xs font-bold shadow-sm" title="Upload textbook to namespace">
            <UploadCloud className={`h-4 w-4 shrink-0 ${isUploading ? 'animate-bounce' : ''}`} />
            <span>{isUploading ? 'Uploading...' : 'Quick Upload'}</span>
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

          {/* Profile Menu Trigger */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-full flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
            >
              <div className="flex items-center gap-2.5 truncate min-w-0">
                <div className="h-8 w-8 rounded-lg bg-blue-100 border border-blue-200/50 flex items-center justify-center shrink-0 shadow-inner">
                  <span className="text-xs font-bold text-blue-700">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
                <div className="truncate text-left min-w-0">
                  <p className="text-xs font-bold text-[#111111] truncate">Dr. {user?.firstName}</p>
                  <p className="text-[10px] text-gray-400 font-medium truncate">{user?.email}</p>
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
            </button>

            {/* Profile Dropdown Menu */}
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)}></div>
                <div className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1.5 fade-in">
                  <button
                    onClick={() => {
                      setProfileFirst(user?.firstName || '');
                      setProfileLast(user?.lastName || '');
                      setProfileMsg(null);
                      setIsProfileOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-600 hover:text-[#111111] hover:bg-gray-50 flex items-center gap-2 transition-colors"
                  >
                    <Settings className="h-3.5 w-3.5 text-gray-400" /> Account Settings
                  </button>
                  <button
                    onClick={() => { logout(); setIsMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-gray-100 mt-1"
                  >
                    <LogOut className="h-3.5 w-3.5" /> Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

      </aside>

      {/* ─── MAIN WORKSPACE AREA ─────────────────────────────────── */}
      <main className="flex-1 h-full overflow-hidden flex flex-col p-5 bg-[#FAFAFA]">
        <div className="flex-1 rounded-[16px] bg-white border border-gray-200/80 shadow-sm overflow-hidden flex flex-col relative">
          
          {uploadError && (
            <div className="mx-6 mt-6 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center justify-between shrink-0 relative z-10 shadow-sm">
              <span>{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-100 rounded-md transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="flex-1 overflow-hidden relative z-10">
            {children}
          </div>
        </div>
      </main>

      {/* ─── PROFILE MODAL ─────────────────────────────────────── */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111111]/30 backdrop-blur-sm p-4 fade-in">
          <div className="w-full max-w-md rounded-2xl p-7 relative bg-white shadow-xl border border-gray-200/80 transform transition-all scale-100">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-[#111111] p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-4.5 w-4.5" />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner border border-blue-100/50">
                <Settings className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111111] tracking-tight">Account Settings</h3>
                <p className="text-xs text-gray-400 mt-0.5">Manage your clinical profile details</p>
              </div>
            </div>

            {profileMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold mb-5 border flex items-center gap-2.5 ${
                profileMsg.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">First Name</label>
                  <input
                    type="text"
                    value={profileFirst}
                    onChange={(e) => setProfileFirst(e.target.value)}
                    className="input-field px-3.5 py-2.5 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Last Name</label>
                  <input
                    type="text"
                    value={profileLast}
                    onChange={(e) => setProfileLast(e.target.value)}
                    className="input-field px-3.5 py-2.5 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">New Password (optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={profilePass}
                    onChange={(e) => setProfilePass(e.target.value)}
                    className="input-field pl-10 pr-4 py-3 text-xs font-semibold"
                    placeholder="Leave blank to keep current"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="w-full py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  {profileSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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

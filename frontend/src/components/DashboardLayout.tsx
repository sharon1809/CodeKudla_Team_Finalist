'use client';

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import {
  Sparkles,
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
  HardDrive,
  Eye,
  Key,
} from 'lucide-react';

interface Document {
  _id: string;
  filename: string;
  cloudinaryUrl: string;
  fileSize: number;
  chunkCount: number;
  uploadDate: string;
}

interface Chat {
  _id: string;
  title: string;
  document: {
    _id: string;
    filename: string;
  };
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
  onStartNewChat: (docId: string) => void;
  activeDoc: Document | null;
  activeChat: Chat | null;
  activeTab: 'chat' | 'preview' | 'profile';
  setActiveTab: (tab: 'chat' | 'preview' | 'profile') => void;
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
  onStartNewChat,
  activeDoc,
  activeChat,
  activeTab,
  setActiveTab,
  children,
}) => {
  const { user, logout, updateUser } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // States for renaming
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingDocName, setEditingDocName] = useState('');
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatTitle, setEditingChatTitle] = useState('');

  // States for Profile Update Modal
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

    setIsUploading(true);
    setUploadError(null);

    try {
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onUploadSuccess();
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'File upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveDocRename = (docId: string) => {
    if (editingDocName.trim()) {
      onRenameDocument(docId, editingDocName.trim());
    }
    setEditingDocId(null);
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
    <div className="flex-1 flex overflow-hidden relative">
      {/* SIDEBAR */}
      <aside className="w-80 border-r border-slate-900 bg-slate-950 flex flex-col justify-between overflow-hidden shrink-0">
        
        {/* App Logo & Upload */}
        <div className="p-5 border-b border-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center border border-indigo-400/20 shadow-md">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white tracking-tight text-md">NovaDocs AI</span>
            </div>
            <button
              onClick={() => {
                setProfileFirst(user?.firstName || '');
                setProfileLast(user?.lastName || '');
                setProfileMsg(null);
                setIsProfileOpen(true);
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
              title="Profile Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {/* Upload Box */}
          <div className="relative">
            <label className="flex flex-col items-center justify-center border border-dashed border-slate-800 hover:border-indigo-500/50 bg-slate-900/40 hover:bg-slate-900/60 transition-all rounded-xl p-4 cursor-pointer text-center group">
              <UploadCloud className="h-6 w-6 text-slate-500 group-hover:text-indigo-400 mb-1.5 transition-colors" />
              <span className="text-xs font-semibold text-slate-300">Upload PDF / Word</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Limit 10MB</span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </label>

            {isUploading && (
              <div className="absolute inset-0 bg-slate-950/80 rounded-xl flex flex-col items-center justify-center gap-2">
                <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent animate-spin rounded-full" />
                <span className="text-[10px] font-semibold text-slate-300">Extracting & Indexing...</span>
              </div>
            )}
          </div>

          {uploadError && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-200 text-[10px] flex items-center justify-between">
              <span>{uploadError}</span>
              <button onClick={() => setUploadError(null)} className="text-red-400 hover:text-red-200 ml-1">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          
          {/* Documents Section */}
          <div className="space-y-2">
            <h3 className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
              <span>My Documents</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">{documents.length}</span>
            </h3>

            {documents.length === 0 ? (
              <p className="px-2 py-4 text-xs text-slate-600 text-center">No documents uploaded yet.</p>
            ) : (
              <div className="space-y-1">
                {documents.map((doc) => {
                  const isActive = activeDoc?._id === doc._id && activeTab === 'preview';
                  return (
                    <div
                      key={doc._id}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
                        isActive ? 'bg-indigo-600/10 text-white border border-indigo-500/30' : 'hover:bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      {editingDocId === doc._id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editingDocName}
                            onChange={(e) => setEditingDocName(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                          <button onClick={() => handleSaveDocRename(doc._id)} className="text-emerald-400 hover:text-emerald-200 shrink-0">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingDocId(null)} className="text-slate-400 hover:text-white shrink-0">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              onSelectDocument(doc);
                              setActiveTab('preview');
                            }}
                            className="flex items-center gap-2 truncate text-left flex-1"
                          >
                            <FileText className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-indigo-400" />
                            <div className="truncate text-xs font-medium">
                              <p className="truncate">{doc.filename}</p>
                              <p className="text-[10px] text-slate-500">{doc.chunkCount} chunks</p>
                            </div>
                          </button>

                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0 ml-1">
                            <button
                              onClick={() => {
                                setEditingDocId(doc._id);
                                setEditingDocName(doc.filename);
                              }}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                              title="Rename"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onDeleteDocument(doc._id)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400"
                              title="Delete"
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

          {/* Conversations Section */}
          <div className="space-y-2">
            <h3 className="px-2 text-[10px] uppercase font-bold tracking-wider text-slate-500 flex items-center justify-between">
              <span>Chat History</span>
              <span className="bg-slate-900 px-1.5 py-0.5 rounded text-slate-400">{chats.length}</span>
            </h3>

            {chats.length === 0 ? (
              <p className="px-2 py-4 text-xs text-slate-600 text-center">No active conversations.</p>
            ) : (
              <div className="space-y-1">
                {chats.map((ch) => {
                  const isActive = activeChat?._id === ch._id && activeTab === 'chat';
                  return (
                    <div
                      key={ch._id}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-xl transition-all ${
                        isActive ? 'bg-indigo-600/10 text-white border border-indigo-500/30' : 'hover:bg-slate-900/50 text-slate-300'
                      }`}
                    >
                      {editingChatId === ch._id ? (
                        <div className="flex items-center gap-1.5 w-full">
                          <input
                            type="text"
                            value={editingChatTitle}
                            onChange={(e) => setEditingChatTitle(e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                          <button onClick={() => handleSaveChatRename(ch._id)} className="text-emerald-400 hover:text-emerald-200 shrink-0">
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setEditingChatId(null)} className="text-slate-400 hover:text-white shrink-0">
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
                            <MessageSquare className="h-4 w-4 text-slate-400 shrink-0 group-hover:text-indigo-400" />
                            <div className="truncate text-xs font-medium">
                              <p className="truncate">{ch.title}</p>
                              <p className="text-[10px] text-slate-500 truncate">
                                Source: {ch.document?.filename || 'Document'}
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
                              title="Rename"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => onDeleteChat(ch._id)}
                              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-red-400"
                              title="Delete"
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

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-900 bg-slate-950 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-9 w-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
              <UserIcon className="h-4.5 w-4.5 text-slate-400" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                {user?.firstName} {user?.lastName}
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
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-900/20 p-6">
        {children}
      </main>

      {/* PROFILE SETTINGS OVERLAY */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel-glow w-full max-w-md rounded-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setIsProfileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 text-indigo-400">
                <Settings className="h-4 w-4" />
              </div>
              <h3 className="text-lg font-bold text-white">Profile Settings</h3>
            </div>

            {profileMsg && (
              <div
                className={`p-3 rounded-lg text-xs mb-4 border ${
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
                    className="block w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    className="block w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                    className="block w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-indigo-500/20 transition-all"
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

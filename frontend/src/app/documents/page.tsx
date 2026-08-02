"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Plus,
  UploadCloud,
  FileText,
  BookOpen,
  Trash2,
  Calendar,
  MessageSquare,
  X,
} from "lucide-react";
import { ChatInterface } from "../../components/ChatInterface";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [chats, setChats] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [activeChat, setActiveChat] = useState<any>(null);
  
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [docsRes, chatsRes] = await Promise.all([
        api.get("/documents"),
        api.get("/chats"),
      ]);
      setDocuments(docsRes.data.documents || []);
      setChats(chatsRes.data.chats || []);
    } catch (err) {
      toast.error("Failed to load clinical library data");
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
      toast.success("Document uploaded & processed successfully!");
      const docsRes = await api.get("/documents");
      setDocuments(docsRes.data.documents || []);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upload document");
    } finally {
      setUploading(false);
      if (e.target) e.target.value = "";
    }
  };

  const startNewChat = async (documentId?: string, filename?: string) => {
    setIsCreatingChat(true);
    try {
      const payload: any = {};
      if (documentId) {
        payload.documentId = documentId;
        payload.title = `Querying: ${filename}`;
      } else {
        payload.title = "Global Medical Library Chat";
      }

      const res = await api.post("/chats", payload);
      
      const chatRes = await api.get(`/chats/${res.data.chat._id}`);
      setActiveChat(chatRes.data.chat);
      setIsNewChatModalOpen(false);

      // Refresh chats list
      const updatedChatsRes = await api.get("/chats");
      setChats(updatedChatsRes.data.chats || []);
    } catch (err) {
      toast.error("Failed to initiate query session");
    } finally {
      setIsCreatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!window.confirm("Delete this chat session?")) return;
    try {
      await api.delete(`/chats/${chatId}`);
      toast.success("Chat removed.");
      if (activeChat?._id === chatId) {
        setActiveChat(null);
      }
      const updatedChatsRes = await api.get("/chats");
      setChats(updatedChatsRes.data.chats || []);
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  const refreshChat = async (chatId: string) => {
    try {
      const chatRes = await api.get(`/chats/${chatId}`);
      setActiveChat(chatRes.data.chat);
    } catch (err) {
      console.error("Failed to refresh chat", err);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      <Toaster position="top-right" />

      {/* New Chat Modal */}
      {isNewChatModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800">
                <MessageSquare className="w-5 h-5 text-blue-600" /> Start New Chat
              </h3>
              <button onClick={() => setIsNewChatModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <button 
                disabled={isCreatingChat}
                onClick={() => startNewChat()}
                className="w-full text-left p-4 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors flex flex-col"
              >
                <span className="font-bold text-blue-900 flex items-center gap-2"><BookOpen className="w-4 h-4"/> Global Library Search</span>
                <span className="text-xs text-blue-700 mt-1">Chat and search across ALL uploaded documents simultaneously.</span>
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500 font-medium">Or select a specific document</span></div>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {documents.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">No documents uploaded yet.</p>
                ) : (
                  documents.map(doc => (
                    <button
                      key={doc._id}
                      disabled={isCreatingChat}
                      onClick={() => startNewChat(doc._id, doc.filename)}
                      className="w-full text-left p-3 rounded-xl border border-gray-100 hover:border-blue-300 hover:bg-gray-50 transition-colors flex items-center gap-3"
                    >
                      <FileText className="w-5 h-5 text-gray-400 shrink-0" />
                      <div className="truncate">
                        <p className="font-semibold text-gray-800 text-sm truncate">{doc.filename}</p>
                        <p className="text-[10px] text-gray-500">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar - Chat History */}
      <div className="w-1/3 max-w-sm bg-white border-r border-gray-100 flex flex-col h-full shrink-0 shadow-sm z-10 relative">
        <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Library Chats
            </h1>
            <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-lg cursor-pointer transition-colors" title="Upload new document">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              <input type="file" className="hidden" accept=".pdf" onChange={handleFileUpload} disabled={uploading} />
            </label>
          </div>

          <button 
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-xl font-bold transition-all shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" /> New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#FAFAFA]">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-10 text-gray-400 font-medium text-sm">
              No chats found. Create a new chat to begin querying documents.
            </div>
          ) : (
            chats.map((chat) => {
              const isActive = activeChat?._id === chat._id;
              const docName = chat.document?.filename || "Global Library";
              
              return (
                <div
                  key={chat._id}
                  className={`group relative p-3.5 rounded-2xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
                    isActive
                      ? "bg-blue-50 border-blue-200 shadow-sm"
                      : "bg-white border-transparent hover:border-gray-200 hover:shadow-sm"
                  }`}
                  onClick={() => !isActive && refreshChat(chat._id)}
                >
                  <div className="flex justify-between items-start mb-1.5 relative z-10">
                    <div className={`flex items-center gap-2 font-bold truncate pr-8 ${isActive ? 'text-blue-700' : 'text-gray-800'}`}>
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="truncate text-sm">{chat.title}</span>
                    </div>
                  </div>

                  <div className="text-[11px] font-medium text-gray-500 flex items-center justify-between relative z-10">
                    <span className="flex items-center gap-1 truncate max-w-[60%]">
                      <FileText className="w-3 h-3" /> {docName}
                    </span>
                    <span className="shrink-0">{new Date(chat.updatedAt || chat.createdAt).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteChat(chat._id);
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-gray-100 text-gray-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500 z-20"
                    title="Delete Chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Content Area - Chat Interface */}
      <div className="flex-1 bg-white flex flex-col relative h-full min-w-0">
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-50/30">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 border border-blue-100 shadow-inner">
              <MessageSquare className="w-8 h-8 text-blue-500 opacity-80" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-800 mb-2">
              Select or Create a Chat
            </h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto font-medium leading-relaxed">
              Click on an existing chat history on the left, or start a new chat to interrogate your clinical guidelines.
            </p>
            <button 
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-6 flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50 text-gray-700 hover:text-blue-700 py-2.5 px-6 rounded-xl font-bold transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Start New Chat
            </button>
          </div>
        ) : (
          <ChatInterface chat={activeChat} onRefreshChat={refreshChat} />
        )}
      </div>
    </div>
  );
}

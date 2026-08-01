'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { DashboardLayout, Chat as ChatItem } from '../../components/DashboardLayout';
import { ClinicalCopilot } from '../../components/ClinicalCopilot';
import { LabReportAnalyzer } from '../../components/LabReportAnalyzer';
import { DocumentsList } from '../../components/DocumentsList';
import { ChatInterface } from '../../components/ChatInterface';
import { PatientReports } from '../../components/PatientReports';
import XrayTechDashboard from '../../components/XrayTech';
import XrayDoctorDashboard from '../../components/XrayDoctor';
import { DrugSafety } from '../../components/DrugSafety';
import ManagePatients from '../../components/ManagePatients';
import { Stethoscope } from 'lucide-react';

interface DocumentItem {
  _id: string;
  filename: string;
  fileSize: number;
  chunkCount: number;
  documentType: 'general' | 'lab_report';
  uploadDate: string;
}

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeTab, setActiveTab] = useState<'copilot' | 'drug_safety' | 'reports' | 'patient_reports' | 'documents' | 'chat' | 'xray_tech' | 'xray_doctor' | 'manage_patients'>('copilot');

  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDocuments();
      fetchChats();
    }
  }, [isAuthenticated]);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data.chats || []);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    }
  };

  const handleRefreshChat = async (chatId: string) => {
    try {
      const res = await api.get(`/chats/${chatId}`);
      const updatedChat = res.data.chat;
      setActiveChat(updatedChat);
      setChats(chats.map((c) => (c._id === chatId ? updatedChat : c)));
    } catch (err) {
      console.error('Failed to refresh chat:', err);
    }
  };

  const handleSelectDocument = (doc: DocumentItem) => {
    setActiveDoc(doc);
  };

  const handleSelectChat = (chat: ChatItem) => {
    setActiveChat(chat);
    setActiveTab('chat');
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await api.delete(`/documents/${docId}`);
      setDocuments(documents.filter((d) => d._id !== docId));
      setChats(chats.filter((c) => c.document?._id !== docId));
      if (activeDoc?._id === docId) setActiveDoc(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const handleRenameDocument = async (docId: string, newName: string) => {
    try {
      await api.put(`/documents/${docId}/rename`, { filename: newName });
      setDocuments(documents.map((d) => (d._id === docId ? { ...d, filename: newName } : d)));
    } catch (err) {
      console.error('Failed to rename document:', err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await api.delete(`/chats/${chatId}`);
      setChats(chats.filter((c) => c._id !== chatId));
      if (activeChat?._id === chatId) setActiveChat(null);
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    try {
      await api.put(`/chats/${chatId}/rename`, { title: newTitle });
      setChats(chats.map((c) => (c._id === chatId ? { ...c, title: newTitle } : c)));
      if (activeChat?._id === chatId) {
        setActiveChat({ ...activeChat, title: newTitle });
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
    }
  };

  // Loading state — white, clean
  if (authLoading) {
    return (
      <div className="h-screen w-screen bg-white flex flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center shadow-lg shadow-teal-500/25">
          <Stethoscope className="h-6 w-6 text-white" />
        </div>
        <div className="text-center">
          <div className="h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-[#0F172A]">Loading MedSynexa</p>
          <p className="text-xs text-[#94A3B8] mt-0.5">Clinical AI · Powered by Gemini & pgvector</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Only pass general documents to PatientReports (textbooks only)
  const generalDocuments = documents.filter(d => d.documentType === 'general');

  return (
    <DashboardLayout
      documents={documents}
      chats={chats}
      onUploadSuccess={fetchDocuments}
      onDeleteDocument={handleDeleteDocument}
      onRenameDocument={handleRenameDocument}
      onSelectDocument={handleSelectDocument}
      onSelectChat={handleSelectChat}
      onDeleteChat={handleDeleteChat}
      onRenameChat={handleRenameChat}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeChat={activeChat}
      onNewChatCreated={fetchChats}
    >
      {activeTab === 'copilot' && <ClinicalCopilot />}
      {activeTab === 'drug_safety' && <DrugSafety />}
      {activeTab === 'reports' && <LabReportAnalyzer />}
      {activeTab === 'patient_reports' && <PatientReports documents={generalDocuments} />}
      {activeTab === 'documents' && (
        <DocumentsList
          onStartChatWithDoc={async (doc) => {
            await fetchChats();
            setActiveTab('chat');
          }}
        />
      )}
      {activeTab === 'chat' && <ChatInterface chat={activeChat} onRefreshChat={handleRefreshChat} />}
      {activeTab === 'xray_tech' && <XrayTechDashboard />}
      {activeTab === 'xray_doctor' && <XrayDoctorDashboard />}
      {activeTab === 'manage_patients' && <ManagePatients />}
    </DashboardLayout>
  );
}

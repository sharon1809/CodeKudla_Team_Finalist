"use client";

import React, { useState } from 'react';
import { UploadCloud, CheckCircle, RefreshCcw, FileText, Send, User } from 'lucide-react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

export default function XrayTechDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState('');
  const [studyType, setStudyType] = useState('Chest X-ray');
  const [view, setView] = useState('PA');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editedReport, setEditedReport] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !patientId) {
      toast.error('Please provide a file and Patient ID');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientId', patientId);
    formData.append('studyType', studyType);
    formData.append('view', view);

    try {
      const res = await api.post('/xray/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
      setEditedReport(res.data.draftText);
      toast.success('X-ray analyzed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload and analyze');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToDoctor = async () => {
    if (!result?.studyId) return;
    setLoading(true);
    try {
      await api.put(`/xray/studies/${result.studyId}/tech-submit`, {
        editedReport
      });
      toast.success('Submitted to Doctor successfully!');
      setResult(null); // Reset
      setFile(null);
    } catch (err: any) {
      toast.error('Failed to submit to doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Toaster />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">X-Ray Technician Dashboard</h1>
          <p className="text-gray-500">Upload and process radiology images</p>
        </div>
      </div>

      {!result ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleUpload} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input 
                  type="text" 
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter Patient ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Study Type</label>
                <select 
                  value={studyType}
                  onChange={(e) => setStudyType(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="Chest X-ray">Chest X-ray</option>
                  <option value="Knee X-ray">Knee X-ray</option>
                  <option value="Hand X-ray">Hand X-ray</option>
                  <option value="Pelvis X-ray">Pelvis X-ray</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">View</label>
                <select 
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                  className="w-full rounded-lg border-gray-300 border px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="PA">PA</option>
                  <option value="AP">AP</option>
                  <option value="Lateral">Lateral</option>
                </select>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors">
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="hidden" 
                id="xray-upload"
              />
              <label htmlFor="xray-upload" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="h-12 w-12 text-gray-400 mb-3" />
                <span className="text-sm font-medium text-gray-900">
                  {file ? file.name : 'Click to upload X-ray Image'}
                </span>
                <span className="text-xs text-gray-500 mt-1">JPEG, PNG, DICOM (converted) up to 10MB</span>
              </label>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? <RefreshCcw className="animate-spin h-5 w-5 mr-2" /> : <UploadCloud className="h-5 w-5 mr-2" />}
              {loading ? 'Analyzing with AI...' : 'Upload & Analyze'}
            </button>
          </form>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-semibold flex items-center mb-4"><CheckCircle className="h-5 w-5 mr-2 text-green-500"/> AI Analysis Complete</h2>
            
            <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-blue-900">AI Confidence Score</span>
                <span className="text-sm font-bold text-blue-700">{(result.aiResult.confidence * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${result.aiResult.confidence * 100}%` }}></div>
              </div>
            </div>

            <div className="flex-grow space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Findings</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-1">
                  {result.aiResult.findings.map((f: string, i: number) => <li key={i}>{f}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Impression</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1 mt-1">
                  {result.aiResult.impression.map((imp: string, i: number) => <li key={i}>{imp}</li>)}
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <h2 className="text-lg font-semibold flex items-center mb-4"><FileText className="h-5 w-5 mr-2 text-gray-500"/> Draft Report</h2>
            <textarea
              value={editedReport}
              onChange={(e) => setEditedReport(e.target.value)}
              className="flex-grow w-full rounded-lg border-gray-300 border p-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none h-64 lg:h-auto"
            />
            <div className="mt-4 flex gap-4">
              <button 
                onClick={() => setResult(null)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Cancel
              </button>
              <button 
                onClick={handleSubmitToDoctor}
                disabled={loading}
                className="flex-1 flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
              >
                {loading ? <RefreshCcw className="animate-spin h-5 w-5 mr-2" /> : <Send className="h-5 w-5 mr-2" />}
                Submit to Doctor
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

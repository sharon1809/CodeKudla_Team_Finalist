"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Activity, Search, RefreshCcw } from 'lucide-react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';

export default function XrayDoctorDashboard() {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [finalReportText, setFinalReportText] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/xray/studies?status=tech_submitted');
      setStudies(res.data);
    } catch (err) {
      toast.error('Failed to fetch studies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, []);

  const handleSelectStudy = async (studyId: string) => {
    try {
      const res = await api.get(`/xray/studies/${studyId}`);
      setSelectedStudy(res.data);
      setFinalReportText(res.data.aiReport?.generatedReport || '');

      // Fetch image as blob since it requires auth token
      try {
        const imageRes = await api.get(`/xray/studies/${studyId}/image`, {
          responseType: 'blob'
        });
        const url = URL.createObjectURL(imageRes.data);
        setImageUrl(url);
      } catch (imgErr) {
        console.error('Failed to load image', imgErr);
        setImageUrl('');
      }
    } catch (err) {
      toast.error('Failed to fetch study details');
    }
  };

  const handleApprove = async () => {
    if (!selectedStudy) return;
    setActionLoading(true);
    try {
      await api.put(`/xray/studies/${selectedStudy.study._id}/doctor-approve`, {
        finalReportText
      });
      toast.success('Report Approved! PDF generated and SMS sent.');
      setSelectedStudy(null);
      fetchStudies();
    } catch (err) {
      toast.error('Failed to approve report');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <Toaster />
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">X-Ray Doctor Review</h1>
          <p className="text-gray-500">Review technician-submitted reports</p>
        </div>
        <button onClick={fetchStudies} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg">
          <RefreshCcw className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of pending studies */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-[calc(100vh-200px)] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4">Pending Review ({studies.length})</h2>
          
          {loading ? (
            <div className="flex justify-center p-8"><RefreshCcw className="animate-spin h-6 w-6 text-blue-500" /></div>
          ) : studies.length === 0 ? (
            <p className="text-gray-500 text-sm text-center p-8">No studies pending review.</p>
          ) : (
            <div className="space-y-3">
              {studies.map(study => (
                <div 
                  key={study._id} 
                  onClick={() => handleSelectStudy(study._id)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedStudy?.study?._id === study._id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900">{study.patientId?.name || 'Unknown Patient'}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Review</span>
                  </div>
                  <div className="text-sm text-gray-600">{study.studyType}</div>
                  <div className="text-xs text-gray-400 mt-2">
                    {new Date(study.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Review Details */}
        <div className="lg:col-span-2">
          {selectedStudy ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-[calc(100vh-200px)]">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold">{selectedStudy.study.patientId?.name} - {selectedStudy.study.studyType}</h2>
                  <p className="text-sm text-gray-500">Tech: {selectedStudy.study.technicianId?.firstName} {selectedStudy.study.technicianId?.lastName}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-blue-700">AI Confidence: {(selectedStudy.aiReport?.confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="flex-grow flex flex-col md:flex-row gap-6 mb-6">
                <div className="md:w-1/3 bg-black rounded-lg flex items-center justify-center border border-gray-200 p-2 overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Patient X-Ray" 
                      className="max-w-full max-h-[400px] object-contain"
                    />
                  ) : (
                    <span className="text-gray-500 text-sm">Loading image...</span>
                  )}
                </div>
                
                <div className="md:w-2/3 flex flex-col">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center"><FileText className="h-4 w-4 mr-1"/> Report Editor</label>
                  <textarea
                    value={finalReportText}
                    onChange={(e) => setFinalReportText(e.target.value)}
                    className="flex-grow w-full rounded-lg border-gray-300 border p-4 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 border-t pt-4">
                <button 
                  onClick={() => setSelectedStudy(null)}
                  className="py-2 px-6 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center py-2 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCcw className="animate-spin h-4 w-4 mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Approve & Generate PDF
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center justify-center h-[calc(100vh-200px)] text-gray-400">
              <Search className="h-16 w-16 mb-4 text-gray-300" />
              <p>Select a study from the list to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

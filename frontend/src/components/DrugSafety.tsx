"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';
import { ShieldAlert, Search, AlertTriangle, CheckCircle, XCircle, Info, RefreshCcw } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

export const DrugSafety = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [drugName, setDrugName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        if (Array.isArray(res.data)) {
          setPatients(res.data);
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
      }
    };
    fetchPatients();
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !drugName) {
      toast.error('Please select a patient and enter a drug name.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await api.post('/safety/check', {
        patientId: selectedPatientId,
        drugName,
        includeReport: true
      });
      setResult(response.data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to check safety');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'SAFE') return 'bg-green-50 border-green-200 text-green-700';
    if (status === 'WARNING') return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    if (status === 'BLOCKED') return 'bg-red-50 border-red-200 text-red-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'SAFE') return <CheckCircle className="h-8 w-8 text-green-500 mb-2" />;
    if (status === 'WARNING') return <AlertTriangle className="h-8 w-8 text-yellow-500 mb-2" />;
    if (status === 'BLOCKED') return <XCircle className="h-8 w-8 text-red-500 mb-2" />;
    return <Info className="h-8 w-8 text-gray-500 mb-2" />;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <Toaster />
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drug Safety Copilot</h1>
          <p className="text-gray-500">Evaluate polypharmacy interactions and patient allergies</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
      >
        <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-6 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full rounded-lg border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="">Choose a patient...</option>
              {patients.map(p => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.age}y {p.gender})
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Proposed Medication</label>
            <input
              type="text"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              placeholder="e.g. Ibuprofen, Warfarin"
              className="w-full rounded-lg border-gray-300 border px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-6 py-2.5 transition-colors flex items-center justify-center disabled:opacity-70"
          >
            {loading ? (
              <><RefreshCcw className="animate-spin h-5 w-5 mr-2" /> Analyzing...</>
            ) : (
              <><Search className="h-5 w-5 mr-2" /> Check Safety</>
            )}
          </button>
        </form>
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Summary Column */}
            <div className="lg:col-span-1 space-y-6">
              <div className={`p-6 rounded-xl border ${getStatusColor(result.safetyCheck.status)} shadow-sm flex flex-col items-center text-center`}>
                {getStatusIcon(result.safetyCheck.status)}
                <div className="text-xs font-bold uppercase tracking-wider mb-1 opacity-70">Final Verdict</div>
                <div className="text-2xl font-extrabold mb-3">{result.safetyCheck.status}</div>
                <p className="font-medium text-sm opacity-90">{result.safetyCheck.message}</p>
              </div>
              
              {result.safetyCheck.allergyCheck && (
                <div className="p-5 bg-white border border-red-100 rounded-xl shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                  <h3 className="text-red-700 font-bold mb-2 flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" /> Allergy Alert
                  </h3>
                  <p className="text-gray-600 text-sm">{result.safetyCheck.allergyCheck}</p>
                </div>
              )}
              
              <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm">
                <h3 className="font-bold text-gray-800 mb-3 text-sm">Recommendations</h3>
                <ul className="space-y-2">
                  {result.safetyCheck.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-600">
                      <span className="text-indigo-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Report Column */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-6 h-full">
                <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-4">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  Clinical Safety Report
                </h2>
                <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-indigo-600 prose-strong:text-gray-700">
                  {result.report ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.report}</ReactMarkdown>
                  ) : (
                    <div className="text-gray-400 italic">No detailed report generated.</div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

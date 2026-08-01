'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export const DrugSafety = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [drugName, setDrugName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/patients')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPatients(data);
        }
      })
      .catch(err => console.error('Error fetching patients:', err));
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !drugName) {
      setError('Please select a patient and enter a drug name.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('http://localhost:3000/api/safety/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: selectedPatientId,
          drugName,
          includeReport: true
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to check safety');
      }
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'SAFE') return 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
    if (status === 'WARNING') return 'bg-amber-500/10 text-amber-600 border-amber-200';
    if (status === 'BLOCKED') return 'bg-rose-500/10 text-rose-600 border-rose-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans']">
      <div className="max-w-5xl mx-auto space-y-12 pb-20">
        <div className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600"
          >
            AI Drug Safety Copilot
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-slate-500 max-w-2xl mx-auto"
          >
            Instantly evaluate polypharmacy interactions, FDA warnings, and patient allergies using real-time clinical reasoning.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8"
        >
          <form onSubmit={handleCheck} className="flex flex-col md:flex-row gap-6 items-end">
            <div className="flex-1 w-full space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Patient Profile</label>
              <select
                value={selectedPatientId}
                onChange={(e) => setSelectedPatientId(e.target.value)}
                className="w-full bg-white/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              >
                <option value="">Select a patient...</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.age}y {p.gender}{p.weight ? ` • ${p.weight}kg` : ''})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex-1 w-full space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Proposed Medication</label>
              <input
                type="text"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
                placeholder="e.g. Ibuprofen, Warfarin"
                className="w-full bg-white/50 border border-slate-200 rounded-2xl px-4 py-3.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm placeholder:text-slate-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white font-semibold rounded-2xl px-8 py-3.5 transition-all shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Analyzing...
                </div>
              ) : 'Run Safety Check'}
            </button>
          </form>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-medium flex items-center gap-2"
              >
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Summary */}
              <div className="lg:col-span-1 space-y-6">
                <div className={`p-8 rounded-3xl border backdrop-blur-xl ${getStatusColor(result.safetyCheck.status)} shadow-sm`}>
                  <div className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Final Verdict</div>
                  <div className="text-3xl font-extrabold mb-4">{result.safetyCheck.status}</div>
                  <p className="font-medium text-lg leading-relaxed opacity-90">{result.safetyCheck.message}</p>
                </div>
                
                {result.safetyCheck.allergyCheck && (
                  <div className="p-6 bg-white/60 backdrop-blur-xl border border-rose-100 rounded-3xl shadow-sm">
                    <h3 className="text-rose-600 font-bold mb-2 flex items-center gap-2">
                      <span className="text-xl">⚠️</span> Allergy Alert
                    </h3>
                    <p className="text-slate-700 text-sm leading-relaxed">{result.safetyCheck.allergyCheck}</p>
                  </div>
                )}
                
                <div className="p-6 bg-white/60 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-3">AI Recommendations</h3>
                  <ul className="space-y-3">
                    {result.safetyCheck.recommendations?.map((rec: string, i: number) => (
                      <li key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Column: Detailed Report */}
              <div className="lg:col-span-2">
                <div className="h-full bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl p-8 overflow-hidden">
                  <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Comprehensive Clinical Report
                  </h2>
                  <div className="prose prose-slate prose-indigo max-w-none prose-h2:text-lg prose-h2:font-semibold prose-h2:text-slate-800 prose-h3:text-md prose-h3:font-semibold prose-h3:text-slate-700 prose-p:text-slate-600 prose-li:text-slate-600 prose-a:text-indigo-600 prose-strong:text-slate-700 prose-hr:border-slate-200">
                    {result.report ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.report}</ReactMarkdown>
                    ) : (
                      <div className="text-slate-500 italic">No detailed report generated.</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

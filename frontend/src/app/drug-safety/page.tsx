"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2,
  Plus,
  X,
  Pill,
  Send,
  Calendar,
  Activity,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  User,
  Info,
} from "lucide-react";

export default function DrugSafetyPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);

  // Form State
  const [patientId, setPatientId] = useState("");
  const [drugName, setDrugName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [reportsRes, patientsRes] = await Promise.all([
        api.get("/safety/reports"),
        api.get("/patients"),
      ]);
      setReports(reportsRes.data || []);
      setPatients(patientsRes.data || []);
    } catch (err) {
      toast.error("Failed to load drug safety data");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !drugName.trim()) {
      return toast.error("Please select a patient and enter a drug name.");
    }

    setActionLoading(true);
    try {
      const res = await api.post("/safety/check", {
        patientId,
        drugName: drugName.trim(),
        includeReport: true,
      });
      
      toast.success("Drug Safety Check Complete!");
      setIsCreating(false);
      setDrugName("");
      
      // Select the newly generated report. The API returns it inside the response.
      // But we can also refetch the reports and just set the newly generated data to selectedReport.
      const newReportData = {
        ...res.data,
        createdAt: new Date().toISOString(),
        status: res.data.safetyCheck?.status || "UNKNOWN",
        patientName: res.data.patient?.name,
        drugName: res.data.drug?.name,
      };
      
      setSelectedReport(newReportData);
      
      // Refresh list to show the new card in history
      const updatedReports = await api.get("/safety/reports");
      setReports(updatedReports.data || []);

    } catch (err: any) {
      toast.error(err.response?.data?.error || "Safety check failed");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "SAFE":
        return {
          icon: <ShieldCheck className="w-5 h-5" />,
          colorClass: "bg-emerald-50 border-emerald-100 text-emerald-700",
          textColor: "text-emerald-700",
        };
      case "WARNING":
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          colorClass: "bg-amber-50 border-amber-100 text-amber-700",
          textColor: "text-amber-700",
        };
      case "BLOCKED":
        return {
          icon: <ShieldAlert className="w-5 h-5" />,
          colorClass: "bg-red-50 border-red-100 text-red-700",
          textColor: "text-red-700",
        };
      default:
        return {
          icon: <Info className="w-5 h-5" />,
          colorClass: "bg-gray-50 border-gray-100 text-gray-700",
          textColor: "text-gray-700",
        };
    }
  };

  const filteredReports = reports.filter(
    (r) =>
      r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.drugName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-indigo-600">
              Drug Safety Guard
            </h1>
            <p className="text-gray-500 mt-1">
              AI-Powered Adverse Drug Reaction & Interaction Checks
            </p>
          </div>

          {!isCreating && !selectedReport && (
            <button
              onClick={() => {
                setDrugName("");
                setPatientId("");
                setIsCreating(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-purple-500/30 transition-all font-semibold transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New Safety Check
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && !isCreating && !selectedReport ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
            <p className="text-gray-500 font-medium">Loading safety history...</p>
          </div>
        ) : (
          <>
            {/* Create Check View */}
            {isCreating && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Pill className="text-purple-500" /> New Drug Safety Check
                  </h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Select Patient *
                      </label>
                      <select
                        required
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-lg"
                      >
                        <option value="">-- Choose a patient --</option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} (Age: {p.age}, {p.gender})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Proposed Drug Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g., Aspirin, Ibuprofen"
                        value={drugName}
                        onChange={(e) => setDrugName(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-lg"
                      />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={actionLoading || !patientId || !drugName.trim()}
                      className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-70 disabled:hover:shadow-none flex justify-center items-center gap-3"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" /> Cross-Referencing Guidelines...
                        </>
                      ) : (
                        <>
                          <Send className="w-6 h-6" /> Run Safety Check
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Display Report View */}
            {selectedReport && !isCreating && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <button
                  onClick={() => setSelectedReport(null)}
                  className="mb-6 flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors font-medium"
                >
                  <ArrowLeft className="w-5 h-5" /> Back to Safety History
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 md:p-8 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-purple-600" /> Drug Safety Report
                      </h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 font-medium">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" /> {selectedReport.patientName || selectedReport.patient?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Pill className="w-4 h-4 text-indigo-500" /> {selectedReport.drugName || selectedReport.drug?.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />{" "}
                          {new Date(selectedReport.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold shadow-sm ${
                        getStatusConfig(selectedReport.status || selectedReport.safetyCheck?.status).colorClass
                      }`}
                    >
                      {getStatusConfig(selectedReport.status || selectedReport.safetyCheck?.status).icon}
                      {selectedReport.status || selectedReport.safetyCheck?.status}
                    </div>
                  </div>

                  <div className="p-6 md:p-8 space-y-8">
                    {/* Render Markdown AI Report if available */}
                    {selectedReport.report && (
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                        <article className="prose prose-sm md:prose-base prose-purple max-w-none prose-headings:font-bold prose-headings:text-gray-800 prose-p:text-gray-600">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {selectedReport.report}
                          </ReactMarkdown>
                        </article>
                      </div>
                    )}

                    {/* Otherwise display raw fields */}
                    {!selectedReport.report && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                            Safety Message
                          </h3>
                          <p className="text-gray-800 font-medium leading-relaxed">
                            {selectedReport.message || selectedReport.safetyCheck?.message}
                          </p>
                        </div>
                        
                        {(selectedReport.warnings?.length > 0 || selectedReport.contraindications?.length > 0) && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {selectedReport.warnings?.length > 0 && (
                                <div className="p-5 rounded-2xl border bg-amber-50 border-amber-200">
                                  <h4 className="font-bold text-amber-900 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4"/> Warnings</h4>
                                  <ul className="list-disc pl-5 space-y-1 text-sm text-amber-800">
                                    {selectedReport.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                  </ul>
                                </div>
                              )}
                              {selectedReport.contraindications?.length > 0 && (
                                <div className="p-5 rounded-2xl border bg-red-50 border-red-200">
                                  <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2"><ShieldAlert className="w-4 h-4"/> Contraindications</h4>
                                  <ul className="list-disc pl-5 space-y-1 text-sm text-red-800">
                                    {selectedReport.contraindications.map((c: string, i: number) => <li key={i}>{c}</li>)}
                                  </ul>
                                </div>
                              )}
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Past Reports Grid */}
            {!isCreating && !selectedReport && (
              <div className="space-y-6 animate-in fade-in duration-700">
                <div className="flex flex-col md:flex-row justify-end items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-full lg:w-1/3 ml-auto">
                  <input
                    type="text"
                    placeholder="Search by patient or drug..."
                    className="w-full bg-transparent px-4 py-2 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReports.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-500">
                      No safety records found. Run a new check to get started!
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <div
                        key={report._id}
                        onClick={() => setSelectedReport(report)}
                        className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-purple-200 transition-all cursor-pointer flex flex-col relative overflow-hidden"
                      >
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-purple-50 rounded-full blur-2xl group-hover:bg-purple-100 transition-colors z-0" />
                        
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
                              <Pill className="w-6 h-6" />
                            </div>
                            <div
                              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1 ${
                                getStatusConfig(report.status).colorClass
                              }`}
                            >
                              {getStatusConfig(report.status).icon}
                              {report.status}
                            </div>
                          </div>

                          <div className="space-y-1 mb-4">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                              {report.patientName}
                            </p>
                            <p className="text-xl font-bold text-gray-800">
                              {report.drugName}
                            </p>
                          </div>

                          <p className="text-sm text-gray-600 mb-6 line-clamp-2 leading-relaxed">
                            {report.message}
                          </p>

                          <div className="mt-auto flex items-center justify-between text-xs text-gray-400 font-semibold border-t border-gray-50 pt-4">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              View Detailed Report &rarr;
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

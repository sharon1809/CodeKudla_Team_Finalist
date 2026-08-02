"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Plus,
  X,
  Stethoscope,
  Mic,
  Send,
  Calendar,
  Activity,
  ArrowLeft,
  Zap,
  CheckCircle,
  AlertTriangle,
  Pill,
  History,
  ShieldAlert,
  Trash2,
  Search,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { SanitizedMedicalContent } from "../../components/SanitizedMedicalContent";

export default function OPDPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef<any>(null);
  const baseTranscriptRef = useRef<string>("");
  const finalRef = useRef<string>("");
  const interimRef = useRef<string>("");

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/clinical/sessions");
      setSessions(res.data.sessions || []);
    } catch (err) {
      toast.error("Failed to load OPD sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this OPD session record?")) {
      return;
    }

    try {
      await api.delete(`/clinical/sessions/${sessionId}`);
      toast.success("OPD Session deleted successfully");
      setSessions((prev) => prev.filter((s) => s._id !== sessionId));
      if (selectedSession?._id === sessionId) {
        setSelectedSession(null);
      }
    } catch (err: any) {
      toast.error("Failed to delete OPD session");
    }
  };

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    ) {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        let final = "";
        let interim = "";

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        finalRef.current = final;
        interimRef.current = interim;

        const separator = baseTranscriptRef.current && final ? " " : "";
        const currentText = baseTranscriptRef.current + separator + final.trim();

        const displaySeparator = currentText && interim ? " " : "";
        setChiefComplaint(currentText + displaySeparator + interim);
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === "no-speech") return;
        console.warn("Speech recognition warning:", event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        let fullText = baseTranscriptRef.current;
        if (finalRef.current)
          fullText += (fullText ? " " : "") + finalRef.current.trim();
        if (interimRef.current)
          fullText += (fullText ? " " : "") + interimRef.current.trim();
        setChiefComplaint(fullText);
        setInterimTranscript("");
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      baseTranscriptRef.current = chiefComplaint;
      finalRef.current = "";
      interimRef.current = "";
      setInterimTranscript("");
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Failed to start speech recognition", e);
      }
    }
  };

  const handleAnalyze = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!chiefComplaint.trim()) {
      return toast.error("Please provide a chief complaint.");
    }

    if (isListening) {
      recognitionRef.current?.stop();
    }

    setActionLoading(true);
    try {
      const res = await api.post("/clinical/analyze", {
        chiefComplaint,
        symptoms: [],
        gender: "other",
      });
      toast.success("OPD Report Generated Successfully!");
      setIsCreating(false);
      setSelectedSession({
        input: { chiefComplaint, gender: "other" },
        output: res.data.output,
        createdAt: new Date().toISOString(),
      });
      fetchSessions();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Analysis failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAnalyze();
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
                <Stethoscope className="w-3.5 h-3.5" /> Voice & Clinical Copilot
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                OPD Clinical Consultation Copilot
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                Real-time ambient voice dictation, automated differential diagnosis generator, and ICMR treatment protocol engine.
              </p>
            </div>

            {!isCreating && !selectedSession && (
              <button
                onClick={() => {
                  setChiefComplaint("");
                  setIsCreating(true);
                }}
                className="btn-teal text-xs py-3 px-6 shadow-lg shadow-teal-700/30 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>New OPD Dictation</span>
              </button>
            )}
          </div>

          {/* Quick Metrics Bar */}
          {!isCreating && !selectedSession && (
            <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="bg-slate-800/60 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  {sessions.length}
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Consultations</span>
                  <span className="font-bold text-slate-200">Logged History</span>
                </div>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Mic className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Voice Dictation</span>
                  <span className="font-bold text-slate-200">Whisper AI Enabled</span>
                </div>
              </div>

              <div className="bg-slate-800/60 backdrop-blur-md p-3 rounded-2xl border border-slate-700/60 flex items-center gap-3 col-span-2 sm:col-span-1">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  ICMR
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Treatment Engine</span>
                  <span className="font-bold text-slate-200">Clinical Protocol</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && !isCreating && !selectedSession ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading clinical encounter records...</p>
          </div>
        ) : (
          <>
            {/* Create/Dictation View */}
            {isCreating && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-600" /> New Consultation Dictation
                  </h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleAnalyze} className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Chief Complaint & Clinical Symptoms
                    </label>

                    <div className="flex items-center gap-3">
                      {isListening && (
                        <div className="flex items-center gap-1 h-5 px-2 bg-rose-100/60 rounded-lg border border-rose-200">
                          <span className="w-1 bg-rose-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 bg-rose-600 rounded-full animate-wave-bar" style={{ animationDelay: '0.3s' }} />
                          <span className="w-1 bg-rose-500 rounded-full animate-wave-bar" style={{ animationDelay: '0.2s' }} />
                          <span className="w-1 bg-rose-600 rounded-full animate-wave-bar" style={{ animationDelay: '0.4s' }} />
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all border ${
                          isListening
                            ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
                            : "bg-teal-50 border-teal-200 text-teal-800 hover:bg-teal-100"
                        }`}
                      >
                        {isListening ? (
                          <>
                            <span className="h-2 w-2 bg-rose-500 rounded-full animate-ping" />
                            <span>Stop Recording</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5" />
                            <span>Start Ambient Voice Dictation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Preset Dictation Chips */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
                    {[
                      "Patient presents with high grade fever (102°F), dry cough, and acute fatigue for 3 days.",
                      "Severe retrosternal chest pain radiating to left arm with diaphoresis.",
                      "Abdominal pain in right lower quadrant with rebound tenderness and nausea.",
                    ].map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => setChiefComplaint(preset)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 rounded-lg text-[11px] font-medium transition-colors border border-slate-200"
                      >
                        + {preset.substring(0, 32)}...
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={6}
                    placeholder="Type patient complaints or press 'Start Ambient Voice Dictation' to speak..."
                    className={`w-full p-4 bg-slate-50 border rounded-xl focus:ring-2 outline-none resize-none transition-all text-sm leading-relaxed ${
                      isListening
                        ? "border-rose-300 ring-rose-100 bg-rose-50/10 text-slate-900"
                        : "border-slate-200 focus:border-teal-600 focus:ring-teal-100"
                    }`}
                  />
                  {isListening && interimTranscript && (
                    <p className="text-xs text-teal-700 italic -mt-2">
                      Hearing: {interimTranscript}...
                    </p>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={actionLoading || !chiefComplaint.trim()}
                      className="btn-teal text-sm py-3 px-6 w-full justify-center"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Synthesizing Clinical Protocol...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" /> Generate Sanitized OPD Summary
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Display Report View */}
            {selectedSession && !isCreating && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to OPD History
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-teal-600" />
                        Clinical OPD Consultation Summary
                      </h2>
                      <span className="text-xs text-slate-500 font-medium">
                        Encounter Date: {new Date(selectedSession.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {selectedSession.output?.responseTimeMs && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Zap className="w-3.5 h-3.5" /> Generated in {selectedSession.output.responseTimeMs}ms
                        </span>
                      )}
                      {selectedSession._id && (
                        <button
                          onClick={(e) => handleDeleteSession(e, selectedSession._id)}
                          className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Session</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        Recorded Chief Complaint
                      </span>
                      <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                        {selectedSession.input.chiefComplaint}
                      </p>
                    </div>

                    <SanitizedMedicalContent
                      content={selectedSession.output}
                      badgeLabel="ICMR Guideline Verified"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Past Sessions Grid */}
            {!isCreating && !selectedSession && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <History className="w-4 h-4 text-teal-600" />
                    <span>Past Encounters ({sessions.length})</span>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter OPD history by symptoms..."
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 focus:bg-white outline-none transition-all"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {sessions.filter((s) => s.input?.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      No OPD encounter history found. Click "New OPD Dictation" to begin.
                    </div>
                  ) : (
                    sessions
                      .filter((s) => s.input?.chiefComplaint?.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((session) => (
                    <div
                      key={session._id}
                      onClick={() => setSelectedSession(session)}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            OPD Session
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-medium">
                              {new Date(session.createdAt).toLocaleDateString()}
                            </span>
                            <button
                              onClick={(e) => handleDeleteSession(e, session._id)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                              title="Delete OPD Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-slate-900 line-clamp-2 mb-3 group-hover:text-teal-700 transition-colors">
                          {session.input.chiefComplaint}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                        <span>View Sanitized Summary</span>
                        <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

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
} from "lucide-react";

export default function OPDPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
      // Immediately display the newly generated session output
      // For a fresh session, we structure it like the ones returned from /sessions
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

  const getLikelihoodColors = (likelihood: string) => {
    switch (likelihood) {
      case "high":
        return "bg-red-50 border-red-100 text-red-700";
      case "moderate":
        return "bg-amber-50 border-amber-100 text-amber-700";
      case "low":
        return "bg-green-50 border-green-100 text-green-700";
      default:
        return "bg-gray-50 border-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">
              OPD Consultation
            </h1>
            <p className="text-gray-500 mt-1">
              AI-Powered Outpatient Diagnostics & Prescriptions
            </p>
          </div>

          {!isCreating && !selectedSession && (
            <button
              onClick={() => {
                setChiefComplaint("");
                setIsCreating(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/30 transition-all font-semibold transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New OPD Session
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && !isCreating && !selectedSession ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mb-4" />
            <p className="text-gray-500 font-medium">Loading OPD history...</p>
          </div>
        ) : (
          <>
            {/* Create/Dictation View */}
            {isCreating && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Stethoscope className="text-emerald-500" /> New Consultation Note
                  </h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAnalyze} className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-700">
                      Chief Complaint & Symptoms
                    </label>
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all border ${
                        isListening
                          ? "bg-red-50 border-red-200 text-red-600 animate-pulse shadow-inner"
                          : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100 text-emerald-700 shadow-sm"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <span className="h-2 w-2 bg-red-500 rounded-full animate-ping" />
                          Stop Recording
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4" />
                          Start Dictation
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    value={chiefComplaint}
                    onChange={(e) => setChiefComplaint(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={6}
                    placeholder="Type patient complaints or press 'Start Dictation' to speak. Press 'Enter' to generate the report."
                    className={`w-full p-5 bg-gray-50 border rounded-2xl focus:ring-4 outline-none resize-none transition-all text-lg leading-relaxed ${
                      isListening
                        ? "border-red-300 ring-red-100 focus:ring-red-100 bg-red-50/10 text-red-900 placeholder:text-red-300"
                        : "border-gray-200 focus:border-emerald-500 focus:ring-emerald-500/20"
                    }`}
                  />
                  {isListening && interimTranscript && (
                    <p className="text-sm text-emerald-600 italic -mt-2">
                      Hearing: {interimTranscript}...
                    </p>
                  )}



                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={actionLoading || !chiefComplaint.trim()}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-70 disabled:hover:shadow-none flex justify-center items-center gap-3"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" /> Analyzing...
                        </>
                      ) : (
                        <>
                          <Send className="w-6 h-6" /> Generate OPD Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Display Report View */}
            {selectedSession && !isCreating && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <button
                  onClick={() => setSelectedSession(null)}
                  className="mb-6 flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors font-medium"
                >
                  <ArrowLeft className="w-5 h-5" /> Back to OPD History
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 md:p-8 border-b border-emerald-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-emerald-600" /> Clinical Summary
                      </h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />{" "}
                          {new Date(selectedSession.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {selectedSession.output?.responseTimeMs && (
                      <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-emerald-100 flex items-center gap-2 text-emerald-700 font-bold text-sm">
                        <Zap className="w-4 h-4" /> Analyzed in {selectedSession.output.responseTimeMs}ms
                      </div>
                    )}
                  </div>

                  <div className="p-6 md:p-8 space-y-8 bg-gray-50/30">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                        Chief Complaint
                      </h3>
                      <p className="text-gray-800 font-medium leading-relaxed">
                        {selectedSession.input.chiefComplaint}
                      </p>
                    </div>

                    {/* Safety Flags */}
                    {selectedSession.output?.safetyFlags?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-red-500" /> Safety Guardrails
                        </h3>
                        <div className="grid gap-3">
                          {selectedSession.output.safetyFlags.map((flag: any, idx: number) => (
                            <div
                              key={idx}
                              className={`p-4 rounded-xl border flex items-start gap-3 ${
                                flag.severity === "critical"
                                  ? "bg-red-50 border-red-200 text-red-900"
                                  : "bg-amber-50 border-amber-200 text-amber-900"
                              }`}
                            >
                              <AlertTriangle
                                className={`w-5 h-5 shrink-0 ${
                                  flag.severity === "critical" ? "text-red-600" : "text-amber-600"
                                }`}
                              />
                              <div>
                                <p className="font-bold text-sm mb-1 uppercase tracking-wider opacity-80">
                                  {flag.type.replace(/_/g, " ")}
                                </p>
                                <p className="font-medium text-sm leading-relaxed">{flag.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Differential Diagnoses */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Differential Diagnoses
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        {selectedSession.output?.differentialDiagnoses?.map((dd: any, idx: number) => (
                          <div
                            key={idx}
                            className={`p-5 rounded-2xl border ${getLikelihoodColors(
                              dd.likelihood
                            )} flex flex-col md:flex-row justify-between gap-4`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-extrabold text-lg">{dd.condition}</h4>
                                {dd.icdCode && (
                                  <span className="text-xs bg-white/50 px-2 py-1 rounded-md font-mono border border-current opacity-70">
                                    {dd.icdCode}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-medium opacity-90">{dd.reasoning}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="text-2xl font-black">{dd.likelihood_percentage}%</div>
                              <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                                {dd.likelihood} Likelihood
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Treatment Options */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                        Recommended Treatment
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedSession.output?.treatmentOptions?.map((tx: any, idx: number) => (
                          <div
                            key={idx}
                            className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Pill className="w-5 h-5 text-indigo-500" />
                              <h4 className="font-bold text-gray-800 text-lg">{tx.drugName}</h4>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="font-medium">Dosage</span>
                                <span className="font-bold text-gray-900">{tx.dosage}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="font-medium">Frequency</span>
                                <span className="font-bold text-gray-900">{tx.frequency}</span>
                              </div>
                              <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="font-medium">Duration</span>
                                <span className="font-bold text-gray-900">{tx.duration}</span>
                              </div>
                              {tx.indianBrandNames?.length > 0 && (
                                <div className="pt-1">
                                  <span className="text-xs text-gray-400 block mb-1">Brands</span>
                                  <div className="flex flex-wrap gap-1">
                                    {tx.indianBrandNames.map((brand: string, i: number) => (
                                      <span
                                        key={i}
                                        className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold"
                                      >
                                        {brand}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Next Steps */}
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                        Diagnostic Next Steps
                      </h3>
                      <ul className="space-y-3">
                        {selectedSession.output?.diagnosticNextSteps?.map((step: string, i: number) => (
                          <li key={i} className="flex items-start gap-3">
                            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                              {i + 1}
                            </div>
                            <span className="text-gray-700 font-medium leading-relaxed">{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Past Sessions Grid */}
            {!isCreating && !selectedSession && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-700">
                {sessions.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-gray-500">
                    No OPD history found. Start a new consultation!
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session._id}
                      onClick={() => setSelectedSession(session)}
                      className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-emerald-100 transition-all cursor-pointer flex flex-col relative overflow-hidden"
                    >
                      {/* Decoration blob */}
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-50 rounded-full blur-2xl group-hover:bg-emerald-100 transition-colors z-0" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <History className="w-6 h-6" />
                          </div>
                          {session.output?.safetyFlags?.length > 0 && (
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Flags
                            </span>
                          )}
                        </div>

                        <p className="text-lg font-bold text-gray-800 mb-4 line-clamp-2">
                          {session.input.chiefComplaint}
                        </p>



                        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 font-semibold border-t border-gray-50 pt-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(session.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            View Report &rarr;
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

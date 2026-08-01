'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  Stethoscope,
  Activity,
  Pill,
  ShieldAlert,
  Zap,
  CheckCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Plus,
  X,
  ChevronRight,
  HeartPulse,
  Wand2,
  Mic,
  MicOff,
  Download,
  MessageSquareQuote,
  History,
  Clock,
} from 'lucide-react';

interface DifferentialDiagnosis {
  condition: string;
  likelihood: 'high' | 'moderate' | 'low';
  likelihood_percentage: number;
  icdCode?: string;
  reasoning: string;
}

interface TreatmentOption {
  drugName: string;
  indianBrandNames: string[];
  dosage: string;
  frequency: string;
  duration: string;
  route: string;
  contraindications: string[];
  sideEffects: string[];
  notes?: string;
}

interface SafetyFlag {
  type: string;
  severity: 'critical' | 'moderate' | 'informational';
  message: string;
  drugs?: string[];
}

interface ClinicalOutput {
  differentialDiagnoses: DifferentialDiagnosis[];
  diagnosticNextSteps: string[];
  treatmentOptions: TreatmentOption[];
  safetyFlags: SafetyFlag[];
  clinicalPearl?: string;
  referralRecommended?: boolean;
  referralSpeciality?: string;
  responseTimeMs?: number;
}

const LIKELIHOOD_CONFIG = {
  high:     { bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700',    dot: 'bg-red-500'    },
  moderate: { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  dot: 'bg-amber-500'  },
  low:      { bg: 'bg-slate-50',  border: 'border-slate-200',  text: 'text-slate-600',  dot: 'bg-slate-400'  },
};

const MOCK_OUTPUT: ClinicalOutput = {
  differentialDiagnoses: [
    {
      condition: "Dengue Fever",
      likelihood: "high",
      likelihood_percentage: 85,
      icdCode: "A97.9",
      reasoning: "High grade fever, severe retro-orbital headache, and severe myalgia (break-bone fever) strongly suggest Dengue, especially in endemic Indian regions."
    },
    {
      condition: "Viral Influenza",
      likelihood: "moderate",
      likelihood_percentage: 45,
      icdCode: "J11.1",
      reasoning: "Common cause of fever and myalgia, though retro-orbital pain is less prominent."
    }
  ],
  treatmentOptions: [
    {
      drugName: "Paracetamol",
      indianBrandNames: ["Dolo 650", "Calpol", "Crocin Advance"],
      dosage: "650mg",
      frequency: "TDS or SOS (max 4g/day)",
      duration: "3-5 days",
      route: "Oral",
      contraindications: ["Severe hepatic impairment"],
      sideEffects: ["Nausea", "Hepatotoxicity in overdose"]
    },
    {
      drugName: "Oral Rehydration Salts (ORS)",
      indianBrandNames: ["Electral", "Enerzal"],
      dosage: "1 Sachet in 1L water",
      frequency: "Ad libitum",
      duration: "3-5 days",
      route: "Oral",
      contraindications: ["Severe renal impairment"],
      sideEffects: ["None significant if taken appropriately"]
    }
  ],
  diagnosticNextSteps: [
    "Dengue NS1 Antigen & IgM/IgG Serology",
    "Complete Blood Count (CBC) to check for thrombocytopenia & hematocrit levels",
    "Monitor signs of plasma leakage or bleeding"
  ],
  safetyFlags: [
    {
      type: "CONTRAINDICATION_WARNING",
      severity: "critical",
      message: "STRICTLY AVOID NSAIDs (Ibuprofen, Diclofenac, Aspirin) due to risk of severe bleeding in suspected Dengue."
    }
  ],
  responseTimeMs: 845
};

export const ClinicalCopilot: React.FC = () => {
  // ── Manual Input States ──
  const [age, setAge] = useState<number | ''>('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [chiefComplaint, setChiefComplaint] = useState(''); 
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [ambientTranscript, setAmbientTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  
  const baseTranscriptRef = useRef<string>('');
  const finalRef = useRef<string>('');
  const interimRef = useRef<string>('');

  const [output, setOutput] = useState<ClinicalOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // History States
  const [sessions, setSessions] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/clinical/sessions');
      setSessions(res.data.sessions || []);
    } catch (err) {
      console.error('Failed to load sessions', err);
    }
  };

  const loadSession = (session: any) => {
    setAge(session.input.age);
    setGender(session.input.gender);
    setChiefComplaint(session.input.chiefComplaint);
    setSymptoms(session.input.symptoms || []);
    setAmbientTranscript('');
    setOutput(session.output);
    setShowHistory(false);
  };

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onstart = () => {
        setIsListening(true);
      };
      
      recognitionRef.current.onresult = (event: any) => {
        let final = '';
        let interim = '';

        for (let i = 0; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        finalRef.current = final;
        interimRef.current = interim;

        const separator = baseTranscriptRef.current && final ? ' ' : '';
        setAmbientTranscript(baseTranscriptRef.current + separator + final.trim());
        setInterimTranscript(interim);
      };

      recognitionRef.current.onerror = (event: any) => {
        if (event.error === 'no-speech') return;
        console.warn('Speech recognition warning:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        let fullText = baseTranscriptRef.current;
        if (finalRef.current) fullText += (fullText ? ' ' : '') + finalRef.current.trim();
        if (interimRef.current) fullText += (fullText ? ' ' : '') + interimRef.current.trim();
        setAmbientTranscript(fullText);
        setInterimTranscript('');
      };
    }
  }, []);

  // Whisper Processing State
  const [isWhisperProcessing, setIsWhisperProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      recognitionRef.current?.start(); // For visual feedback only
    } catch (err) {
      console.error("Microphone access denied:", err);
      setError("Please allow microphone access to use voice dictation.");
      setIsListening(false);
    }
  };

  const stopRecordingAndTranscribe = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!mediaRecorderRef.current) {
        resolve('');
        return;
      }

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        
        // Release the microphone
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
        
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.webm');

        try {
          const response = await api.post('/speech/transcribe', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          resolve(response.data.text);
        } catch (err) {
          console.error("Whisper error:", err);
          reject(err);
        }
      };

      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
    });
  };

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      setIsWhisperProcessing(true);
      
      try {
        const whisperText = await stopRecordingAndTranscribe();
        const separator = baseTranscriptRef.current && whisperText ? ' ' : '';
        const fullText = baseTranscriptRef.current + separator + whisperText.trim();
        
        setAmbientTranscript(fullText);
        setInterimTranscript('');
        
        await handleAnalyze(fullText); 
      } catch (err) {
        // Fallback to the browser's buggy text if Whisper API fails
        let fullText = baseTranscriptRef.current;
        if (finalRef.current) fullText += (fullText ? ' ' : '') + finalRef.current.trim();
        if (interimRef.current) fullText += (fullText ? ' ' : '') + interimRef.current.trim();
        
        setAmbientTranscript(fullText);
        setInterimTranscript('');
        await handleAnalyze(fullText);
      } finally {
        setIsWhisperProcessing(false);
      }
    } else {
      baseTranscriptRef.current = '';
      finalRef.current = '';
      interimRef.current = '';
      setInterimTranscript('');
      setAmbientTranscript('');
      setOutput(null);
      setIsListening(true);
      await startRecording();
    }
  };

  const handleDownloadTranscript = () => {
    if (!ambientTranscript) return;
    const blob = new Blob([ambientTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Patient_Transcript_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleAnalyze();
    }
  };

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };
  const removeSymptom = (i: number) => setSymptoms(symptoms.filter((_, idx) => idx !== i));

  const handleAnalyze = async (transcriptOverride?: string) => {
    // If using manual form
    const finalComplaint = transcriptOverride || ambientTranscript || chiefComplaint;
    if (!finalComplaint.trim()) { 
      setError('Please provide a Chief Complaint or use Voice Dictation.'); 
      return; 
    }
    
    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/clinical/analyze', {
        chiefComplaint: finalComplaint,
        symptoms,
        age: Number(age) || undefined,
        gender,
      });
      setOutput(res.data.output);
      fetchSessions(); // refresh history
    } catch (err: any) {
      setError(err.response?.data?.message || 'Real API failed. Try using Mock Analysis for demo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockAnalyze = () => {
    setError(null);
    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      setOutput(MOCK_OUTPUT);
      setIsLoading(false);
    }, 1500);
  };

  const loadDemoData = () => {
    setAge(32);
    setGender('male');
    setChiefComplaint('High grade fever for 3 days with severe headache and joint pains.');
    setSymptoms(['Fever', 'Headache', 'Joint pain', 'Nausea']);
    setAmbientTranscript('');
    setOutput(null);
    setError(null);
    
    // Auto-run analysis for demo
    handleMockAnalyze();
  };

  const handleClear = () => {
    setChiefComplaint(''); setSymptoms([]); setAge('');
    setAmbientTranscript('');
    setOutput(null); setError(null);
    if (isListening) recognitionRef.current?.stop();
  };

  const [isExporting, setIsExporting] = useState(false);
  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      // html2canvas fails on modern css colors (lab). 
      // Using native window print is 100% reliable.
      window.print();
    } catch (err) {
      console.error('Print failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyPrescription = () => {
    if (!output) return;
    let text = `MEDSYNEXA CLINICAL DECISION SUMMARY\n`;
    text += `Patient: ${age || 'N/A'}yo ${gender.toUpperCase()} | CC: ${chiefComplaint || 'See transcript'}\n\n`;
    text += `TOP DIFFERENTIAL DIAGNOSES:\n`;
    output.differentialDiagnoses.forEach((dd, i) => {
      text += `${i + 1}. ${dd.condition} (${dd.likelihood_percentage}%) [${dd.icdCode || 'N/A'}]\n`;
    });
    text += `\nRECOMMENDED TREATMENT (INDIAN FORMULATIONS):\n`;
    output.treatmentOptions.forEach((tx, i) => {
      text += `${i + 1}. ${tx.drugName} (${tx.indianBrandNames.join(', ')}) - ${tx.dosage} ${tx.frequency} for ${tx.duration}\n`;
    });
    text += `\nDIAGNOSTIC NEXT STEPS:\n` + output.diagnosticNextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex relative overflow-hidden bg-[#F8FAFC]">
      {/* HISTORY SIDEBAR */}
      {showHistory && (
        <div className="w-80 bg-white border-r border-[#E2E8F0] shadow-xl z-30 flex flex-col h-full absolute left-0 top-0">
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-teal-50">
            <h3 className="font-bold text-teal-800 flex items-center gap-2">
              <History className="h-4 w-4" /> Past Sessions
            </h3>
            <button onClick={() => setShowHistory(false)} className="text-teal-600 hover:bg-teal-100 p-1.5 rounded-lg transition">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sessions.length === 0 ? (
              <p className="text-sm text-center text-[#94A3B8] mt-10">No past sessions found.</p>
            ) : (
              sessions.map((sess) => (
                <button
                  key={sess._id}
                  onClick={() => loadSession(sess)}
                  className="w-full text-left p-3 rounded-xl hover:bg-[#F1F5F9] transition-colors border border-transparent hover:border-[#E2E8F0]"
                >
                  <p className="font-semibold text-[#0F172A] text-sm truncate">{sess.input.chiefComplaint}</p>
                  <div className="flex items-center justify-between mt-1 text-[11px] font-medium text-[#64748B]">
                    <span>{sess.input.age}yo {sess.input.gender}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(sess.createdAt).toLocaleDateString()}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="flex-1 w-full max-w-5xl mx-auto flex flex-col overflow-y-auto relative">

        {/* History Toggle Button */}
        {!showHistory && (
          <button 
            onClick={() => setShowHistory(true)}
            className="absolute top-4 left-4 z-20 bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-2.5 text-[#64748B] hover:text-teal-600 hover:border-teal-200 transition-colors"
            title="View Past Sessions"
          >
            <History className="h-5 w-5" />
          </button>
        )}

        {/* ─── LIVE TRANSCRIPT / LISTENING STATE ─── */}
        {(isListening || ambientTranscript) && !output && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center p-10">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-8 w-full max-w-2xl text-center space-y-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-teal-50/50 to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="h-20 w-20 rounded-full bg-teal-50 border-8 border-white shadow-sm flex items-center justify-center text-teal-500 mb-6 relative">
                  <div className="absolute inset-0 rounded-full bg-teal-400 opacity-20 animate-ping"></div>
                  <Mic className="h-8 w-8 relative z-10" />
                </div>
                <h3 className="text-xl font-bold text-[#0F172A] mb-2">Listening to Consultation...</h3>
                <p className="text-sm text-[#64748B] mb-8">Speak naturally. The AI will extract symptoms when you're done.</p>
                
                <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-6 min-h-[120px] text-left text-base text-[#334155] leading-relaxed relative">
                  {ambientTranscript || interimTranscript ? (
                    <>
                      <span>{ambientTranscript}</span>
                      <span className="text-teal-600/60 italic ml-1">{interimTranscript}</span>
                    </>
                  ) : (
                    <span className="text-[#94A3B8] italic">Waiting for speech...</span>
                  )}
                  {isListening && <span className="inline-block w-2 h-5 bg-teal-500 ml-1 animate-pulse align-middle"></span>}
                </div>

                <div className="mt-8 flex items-center gap-4">
                  <button
                    onClick={toggleListening}
                    disabled={isWhisperProcessing}
                    className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2 ${
                      isWhisperProcessing
                      ? 'bg-teal-50 text-teal-600 border border-teal-200 cursor-wait'
                      : 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 hover:shadow-lg'
                    }`}
                  >
                    {isWhisperProcessing ? (
                      <>
                        <div className="h-4 w-4 border-2 border-teal-500/30 border-t-teal-500 rounded-full animate-spin" /> 
                        Transcribing...
                      </>
                    ) : (
                      <><MicOff className="h-5 w-5" /> Stop & Generate Matrix</>
                    )}
                  </button>
                  <button onClick={handleClear} className="px-6 py-3.5 rounded-xl text-[#64748B] font-bold text-sm hover:bg-[#F1F5F9] transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── EMPTY STATE (FULL SCREEN) ─── */}
        {!output && !isLoading && !isListening && !ambientTranscript && (
          <div className="h-full flex flex-col items-center justify-center text-center p-10">
            <div className="max-w-xl flex flex-col items-center relative z-10 fade-in-up">
              <div className="h-24 w-24 rounded-full bg-teal-50 border-8 border-white shadow-xl flex items-center justify-center text-teal-500 mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-teal-400 opacity-20 animate-pulse"></div>
                <Mic className="h-10 w-10 relative z-10" />
              </div>
              
              <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight mb-4">
                Ambient Clinical Scribe
              </h2>
              <p className="text-base text-[#64748B] leading-relaxed mb-10 max-w-md">
                Experience frictionless documentation. Our AI listens to your patient consultation in real-time and instantly generates a comprehensive clinical reasoning matrix.
              </p>

              <div className="flex items-center justify-center gap-4 w-full px-4">
                <button
                  onClick={toggleListening}
                  className="flex-1 py-4 px-6 rounded-2xl bg-teal-600 text-white font-bold text-base shadow-xl shadow-teal-600/20 hover:bg-teal-700 hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <Mic className="h-5 w-5" />
                  Start Listening
                </button>
                <button
                  onClick={loadDemoData}
                  className="flex-1 py-4 px-6 rounded-2xl bg-white text-[#0F172A] border-2 border-[#E2E8F0] font-bold text-base shadow-sm hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                >
                  <Wand2 className="h-5 w-5 text-indigo-500" />
                  Load Demo Matrix
                </button>
              </div>
            </div>
            
            {/* Background decorations */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-50/50 via-[#F8FAFC] to-[#F8FAFC] pointer-events-none z-0" />
          </div>
        )}

        {/* ─── LOADING STATE ─── */}
        {isLoading && (
          <div className="h-full flex flex-col items-center justify-center p-10 fade-in-up">
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-10 flex flex-col items-center justify-center max-w-md w-full">
              <div className="h-16 w-16 border-[4px] border-teal-500 border-t-transparent animate-spin rounded-full mb-6" />
              <h4 className="text-lg font-bold text-[#0F172A]">Synthesizing Consultation</h4>
              <p className="text-sm text-[#64748B] mt-2 text-center">Extracting clinical markers & checking ICMR guidelines...</p>
            </div>
          </div>
        )}

        {/* ─── MATRIX OUTPUT ─── */}
        {output && !isLoading && (
          <div className="space-y-6 pb-20 fade-in-up" id="clinical-matrix-pdf">
            
            {/* Output Header Controls */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-[#E2E8F0] px-5 py-4 shadow-sm sticky top-0 z-20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Clinical Decision Matrix</h3>
                  {output.responseTimeMs && (
                    <p className="text-xs text-green-600 font-semibold flex items-center gap-1 mt-0.5">
                      <Zap className="h-3 w-3" /> Generated in {output.responseTimeMs} ms
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Transcript Dropdown / Trigger could go here if needed, but omitted for cleanliness */}
                <button
                  onClick={handleClear}
                  className="btn-ghost px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-xl"
                >
                  <RefreshCw className="h-4 w-4" /> Reset Scribe
                </button>
                <button
                  onClick={handleExportPdf}
                  disabled={isExporting}
                  className="px-5 py-2 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-xl shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <div className="h-4 w-4 border-2 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin" /> 
                  ) : <Download className="h-4 w-4" />}
                  <span>{isExporting ? 'Exporting...' : 'Export PDF'}</span>
                </button>
                <button
                  onClick={handleCopyPrescription}
                  className="px-5 py-2 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm flex items-center gap-2 transition-colors"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* If there was a transcript, show a collapsed summary of it */}
            {ambientTranscript && (
               <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-5 space-y-3">
                 <div className="flex items-center justify-between">
                   <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-1.5">
                     <MessageSquareQuote className="h-4 w-4 text-indigo-500" />
                     Consultation Transcript
                   </h4>
                   <button 
                     onClick={handleDownloadTranscript}
                     className="text-[10px] font-bold text-teal-600 hover:text-teal-800 transition-colors flex items-center gap-1"
                   >
                     <Download className="h-3 w-3" /> Download .txt
                   </button>
                 </div>
                 <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 text-sm text-[#475569] leading-relaxed">
                   {ambientTranscript}
                 </div>
               </div>
            )}

            {/* Safety Flags */}
            {output.safetyFlags && output.safetyFlags.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
                <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-500" />
                  Safety Alerts & Warnings
                </h4>
                <div className="grid gap-3">
                  {output.safetyFlags.map((flag, idx) => {
                    const isCritical = flag.severity === 'critical';
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl text-sm flex items-start gap-3 border ${
                          isCritical
                            ? 'bg-red-50 border-red-200 text-red-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        <AlertTriangle className={`h-5 w-5 shrink-0 mt-0.5 ${isCritical ? 'text-red-500' : 'text-amber-500'}`} />
                        <div>
                          <span className="font-bold uppercase tracking-wider text-[11px] block opacity-70 mb-1">
                            [{flag.type.replace(/_/g, ' ')}] — {flag.severity}
                          </span>
                          <p className="font-medium leading-relaxed">{flag.message}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Differential Diagnoses */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-600" />
                Ranked Differential Diagnoses
              </h4>
              <div className="grid gap-3">
                {output.differentialDiagnoses.map((dd, idx) => {
                  const cfg = LIKELIHOOD_CONFIG[dd.likelihood] || LIKELIHOOD_CONFIG.low;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      key={idx} className={`p-5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className={`h-7 w-7 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.text} text-xs font-bold flex items-center justify-center`}>
                            {idx + 1}
                          </span>
                          <span className={`font-bold text-lg ${cfg.text}`}>{dd.condition}</span>
                          {dd.icdCode && (
                            <span className="badge badge-slate text-[10px] font-mono px-2 py-0.5">ICD: {dd.icdCode}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-semibold uppercase ${cfg.text}`}>{dd.likelihood}</span>
                          <span className={`font-mono text-sm font-bold px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.text} bg-white`}>
                            {dd.likelihood_percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-[#475569] leading-relaxed pl-10">{dd.reasoning}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Treatment Options */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Pill className="h-5 w-5 text-indigo-600" />
                Treatment Options — Indian Generic & Brands
              </h4>
              <div className="grid gap-4">
                {output.treatmentOptions.map((tx, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 0.4, delay: (output.differentialDiagnoses.length * 0.1) + (idx * 0.1) }}
                    key={idx} className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg text-[#0F172A]">{tx.drugName}</span>
                        <span className="text-xs text-[#94A3B8] font-mono bg-white px-2 py-0.5 rounded-md border border-[#E2E8F0]">Route: {tx.route}</span>
                      </div>
                      <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1.5 rounded-lg text-xs font-bold font-mono shadow-sm">
                        {tx.dosage} · {tx.frequency} · {tx.duration}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#475569]">
                      <span className="text-xs font-bold text-[#94A3B8] uppercase">Indian Brands:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {tx.indianBrandNames.map((b, bIdx) => (
                          <span key={bIdx} className="bg-white border border-[#CBD5E1] text-[#475569] px-2 py-0.5 rounded-md text-xs font-medium shadow-sm">{b}</span>
                        ))}
                      </div>
                    </div>
                    {tx.contraindications.length > 0 && (
                      <div className="text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200 mt-2">
                        <strong className="text-amber-900 uppercase text-[10px] mr-1 block mb-0.5">Contraindications</strong> 
                        {tx.contraindications.join(', ')}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Diagnostic Next Steps */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 space-y-4">
              <h4 className="text-sm font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Diagnostic Next Steps
              </h4>
              <ul className="space-y-3 bg-[#F8FAFC] border border-[#E2E8F0] p-5 rounded-xl">
                {output.diagnosticNextSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-base text-[#334155] font-medium">
                    <ChevronRight className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

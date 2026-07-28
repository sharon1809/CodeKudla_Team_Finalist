'use client';

import React, { useState } from 'react';
import { api } from '../lib/api';
import {
  Stethoscope,
  Activity,
  Pill,
  ShieldAlert,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  RefreshCw,
  Plus,
  X,
  ChevronRight,
  UserCheck,
  HeartPulse,
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

export const ClinicalCopilot: React.FC = () => {
  // Input States
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>(['Fever', 'Cough']);
  const [symptomInput, setSymptomInput] = useState('');
  const [age, setAge] = useState<number | ''>(42);
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [duration, setDuration] = useState('3 days');
  const [history, setHistory] = useState('Type 2 Diabetes (on Metformin)');
  
  // Vitals
  const [bp, setBp] = useState('130/85');
  const [pulse, setPulse] = useState<number | ''>(88);
  const [temp, setTemp] = useState<number | ''>(101.2);
  const [spo2, setSpo2] = useState<number | ''>(97);
  const [rbs, setRbs] = useState<number | ''>(165);

  // Allergies & Meds
  const [allergies, setAllergies] = useState<string[]>(['Penicillin']);
  const [allergyInput, setAllergyInput] = useState('');
  const [currentMeds, setCurrentMeds] = useState<string[]>(['Metformin 500mg BD']);
  const [medInput, setMedInput] = useState('');

  // Output & UI States
  const [output, setOutput] = useState<ClinicalOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Keyboard shortcut listener for OPD speed
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

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  const addAllergy = () => {
    if (allergyInput.trim() && !allergies.includes(allergyInput.trim())) {
      setAllergies([...allergies, allergyInput.trim()]);
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setAllergies(allergies.filter((_, i) => i !== index));
  };

  const addMed = () => {
    if (medInput.trim() && !currentMeds.includes(medInput.trim())) {
      setCurrentMeds([...currentMeds, medInput.trim()]);
      setMedInput('');
    }
  };

  const removeMed = (index: number) => {
    setCurrentMeds(currentMeds.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (!chiefComplaint.trim()) {
      setError('Chief Complaint is required.');
      return;
    }
    if (!age) {
      setError('Patient age is required.');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.post('/clinical/analyze', {
        chiefComplaint,
        symptoms,
        age: Number(age),
        gender,
        duration,
        history,
        allergies,
        currentMedications: currentMeds,
        vitals: {
          bloodPressure: bp || undefined,
          heartRate: pulse ? Number(pulse) : undefined,
          temperature: temp ? Number(temp) : undefined,
          spo2: spo2 ? Number(spo2) : undefined,
          rbs: rbs ? Number(rbs) : undefined,
        },
      });

      setOutput(res.data.output);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Clinical reasoning failed. Please check backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setChiefComplaint('');
    setSymptoms([]);
    setHistory('');
    setAge('');
    setBp('');
    setPulse('');
    setTemp('');
    setSpo2('');
    setRbs('');
    setAllergies([]);
    setCurrentMeds([]);
    setOutput(null);
    setError(null);
  };

  const handleCopyPrescription = () => {
    if (!output) return;
    let text = `MEDSYNEXA CLINICAL DECISION SUMMARY\n`;
    text += `Patient: ${age}yo ${gender.toUpperCase()} | CC: ${chiefComplaint}\n\n`;
    text += `TOP DIFFERENTIAL DIAGNOSES:\n`;
    output.differentialDiagnoses.forEach((dd, i) => {
      text += `${i + 1}. ${dd.condition} (${dd.likelihood_percentage}%) [${dd.icdCode || 'N/A'}]\n`;
    });
    text += `\nRECOMMENDED TREATMENT (INDIAN FORMULATIONS):\n`;
    output.treatmentOptions.forEach((tx, i) => {
      text += `${i + 1}. ${tx.drugName} (Brands: ${tx.indianBrandNames.join(', ')}) - ${tx.dosage} ${tx.frequency} for ${tx.duration}\n`;
    });
    text += `\nDIAGNOSTIC NEXT STEPS:\n` + output.diagnosticNextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden space-y-4">
      {/* Top Banner */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-teal-500/20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-tight">MedSynexa OPD Clinical Copilot</h2>
              <span className="bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[10px] px-2 py-0.5 rounded-full font-semibold">
                ICMR / NHP Aligned
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sub-10s OPD real-time decision support & drug interaction checker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {output?.responseTimeMs && (
            <div className="flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-300 text-xs font-semibold">
              <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              <span>{output.responseTimeMs} ms</span>
            </div>
          )}

          <button
            onClick={handleClear}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset Patient
          </button>
        </div>
      </div>

      {/* Main Grid: Input Form (Left) & Output Cards (Right) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-hidden">
        
        {/* Left Column: OPD Note & Vitals Input Form */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-3xl border-slate-800/80 overflow-y-auto space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <HeartPulse className="h-4 w-4 text-teal-400" />
              Patient Encounter Input
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Press Ctrl+Enter to analyze</span>
          </div>

          {/* Demographics & CC */}
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="42"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e: any) => setGender(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">Duration</label>
                <input
                  type="text"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                  placeholder="3 days"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Chief Complaint (Unstructured Note) *
              </label>
              <textarea
                rows={3}
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40 transition-all resize-none"
                placeholder="High grade fever with productive cough, mild breathlessness on exertion for 3 days..."
                required
              />
            </div>
          </div>

          {/* Vitals Grid */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              OPD Vitals
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              <div>
                <span className="text-[9px] text-slate-500 block">BP</span>
                <input
                  type="text"
                  value={bp}
                  onChange={(e) => setBp(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-teal-300 text-center"
                  placeholder="120/80"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">HR (bpm)</span>
                <input
                  type="number"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-teal-300 text-center"
                  placeholder="80"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">Temp (°F)</span>
                <input
                  type="number"
                  step="0.1"
                  value={temp}
                  onChange={(e) => setTemp(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-teal-300 text-center"
                  placeholder="98.6"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">SpO2 (%)</span>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-teal-300 text-center"
                  placeholder="98"
                />
              </div>
              <div>
                <span className="text-[9px] text-slate-500 block">RBS (mg/dL)</span>
                <input
                  type="number"
                  value={rbs}
                  onChange={(e) => setRbs(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-teal-300 text-center"
                  placeholder="140"
                />
              </div>
            </div>
          </div>

          {/* Symptoms Tags */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Key Symptoms
            </label>
            <div className="flex gap-1.5 mb-2">
              <input
                type="text"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-600"
                placeholder="Add symptom & enter..."
              />
              <button
                type="button"
                onClick={addSymptom}
                className="px-3 bg-slate-800 hover:bg-slate-700 text-teal-400 rounded-xl text-xs font-semibold"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {symptoms.map((s, i) => (
                <span
                  key={i}
                  className="bg-teal-500/10 border border-teal-500/20 text-teal-300 text-xs px-2.5 py-0.5 rounded-lg flex items-center gap-1"
                >
                  {s}
                  <button onClick={() => removeSymptom(i)} className="text-teal-500 hover:text-teal-200">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Allergies & Medications */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Known Allergies
              </label>
              <div className="flex gap-1 mb-1.5">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white"
                  placeholder="e.g. Penicillin"
                />
                <button type="button" onClick={addAllergy} className="px-2 bg-slate-800 text-amber-400 rounded-lg text-xs">
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {allergies.map((a, i) => (
                  <span key={i} className="bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                    {a}
                    <button onClick={() => removeAllergy(i)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Current Medications
              </label>
              <div className="flex gap-1 mb-1.5">
                <input
                  type="text"
                  value={medInput}
                  onChange={(e) => setMedInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMed())}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-white"
                  placeholder="e.g. Metformin"
                />
                <button type="button" onClick={addMed} className="px-2 bg-slate-800 text-cyan-400 rounded-lg text-xs">
                  +
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {currentMeds.map((m, i) => (
                  <span key={i} className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[10px] px-2 py-0.5 rounded flex items-center gap-1">
                    {m}
                    <button onClick={() => removeMed(i)}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* History */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
              Relevant Medical History
            </label>
            <input
              type="text"
              value={history}
              onChange={(e) => setHistory(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
              placeholder="e.g. T2DM 5 yrs, Hypertension, Smoker"
            />
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/20 text-red-200 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="w-full py-3.5 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-2xl font-bold text-xs shadow-lg shadow-teal-600/20 border border-teal-400/30 transition-all flex items-center justify-center gap-2 mt-auto"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                <span>Synthesizing Clinical Decision (&lt; 10s)...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 fill-white" />
                <span>Run Instant OPD Reasoning</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Output Decision Matrix */}
        <div className="lg:col-span-7 flex flex-col space-y-4 overflow-y-auto">
          
          {!output && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 glass-panel rounded-3xl border-slate-800/80 space-y-4">
              <div className="h-16 w-16 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 animate-pulse">
                <Stethoscope className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">OPD Clinical Reasoning Matrix</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 leading-relaxed">
                  Enter patient chief complaint & vitals on the left, then click <strong>Run Instant OPD Reasoning</strong> to get differential diagnoses, ICMR/NHP Indian formulations, and safety flags.
                </p>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center p-8 glass-panel rounded-3xl border-slate-800/80 space-y-4">
              <div className="h-12 w-12 border-3 border-teal-500 border-t-transparent animate-spin rounded-full" />
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold text-white">MedSynexa Reasoning Engine Active</h4>
                <p className="text-xs text-slate-400">Filtering ICMR/NHP guidelines & checking drug-drug interactions...</p>
              </div>
            </div>
          )}

          {output && !isLoading && (
            <>
              {/* Output Header Controls */}
              <div className="flex items-center justify-between bg-slate-900/40 p-3 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-teal-400" />
                  <span className="text-xs font-bold text-white">Clinical Decision Matrix</span>
                </div>
                <button
                  onClick={handleCopyPrescription}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied to Clipboard' : 'Copy Prescription'}</span>
                </button>
              </div>

              {/* 1. Safety & Drug Interaction Flags (Top priority display) */}
              {output.safetyFlags && output.safetyFlags.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-amber-400" />
                    Safety Alerts & Drug Interaction Checker
                  </h4>
                  <div className="space-y-1.5">
                    {output.safetyFlags.map((flag, idx) => {
                      const isCritical = flag.severity === 'critical';
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl text-xs flex items-start gap-2.5 border ${
                            isCritical
                              ? 'bg-red-950/40 border-red-500/30 text-red-200'
                              : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                          }`}
                        >
                          <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${isCritical ? 'text-red-400' : 'text-amber-400'}`} />
                          <div className="flex-1">
                            <span className="font-bold uppercase tracking-wider text-[10px] block opacity-80">
                              [{flag.type.replace(/_/g, ' ')}] - {flag.severity}
                            </span>
                            <p className="mt-0.5">{flag.message}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Differential Diagnoses */}
              <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-teal-400" />
                  Ranked Differential Diagnoses
                </h4>

                <div className="space-y-2">
                  {output.differentialDiagnoses.map((dd, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 p-3 rounded-xl border border-slate-800/80 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-5 w-5 rounded-full bg-teal-500/10 text-teal-300 text-[10px] font-bold flex items-center justify-center border border-teal-500/30">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-xs text-white">{dd.condition}</span>
                          {dd.icdCode && (
                            <span className="bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded font-mono">
                              ICD: {dd.icdCode}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            {dd.likelihood} Likelihood
                          </span>
                          <span className="bg-teal-500/20 text-teal-300 font-mono text-xs font-bold px-2 py-0.5 rounded-md border border-teal-500/30">
                            {dd.likelihood_percentage}%
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed pl-7">{dd.reasoning}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Recommended Treatment Options (Indian Formulations) */}
              <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Pill className="h-4 w-4 text-cyan-400" />
                  Localized Treatment Options (Indian Generic & Brands)
                </h4>

                <div className="space-y-2.5">
                  {output.treatmentOptions.map((tx, idx) => (
                    <div
                      key={idx}
                      className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-teal-300">{tx.drugName}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({tx.route})</span>
                        </div>
                        <span className="bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs px-2 py-0.5 rounded-md font-semibold">
                          {tx.dosage} • {tx.frequency} • {tx.duration}
                        </span>
                      </div>

                      {/* Indian Brand Names */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Indian Brands:</span>
                        <div className="flex flex-wrap gap-1">
                          {tx.indianBrandNames.map((b, bIdx) => (
                            <span key={bIdx} className="bg-slate-800 text-slate-200 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              {b}
                            </span>
                          ))}
                        </div>
                      </div>

                      {tx.contraindications.length > 0 && (
                        <div className="text-[11px] text-amber-300/80 bg-amber-950/20 px-2.5 py-1 rounded border border-amber-500/10">
                          <strong>Contraindications:</strong> {tx.contraindications.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Recommended Diagnostic Next Steps */}
              <div className="glass-panel p-4 rounded-2xl border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-emerald-400" />
                  Recommended Diagnostic Next Steps
                </h4>

                <ul className="space-y-1.5">
                  {output.diagnosticNextSteps.map((step, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <ChevronRight className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

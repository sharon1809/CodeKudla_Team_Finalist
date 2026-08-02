"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Plus,
  Edit2,
  X,
  User,
  Users,
  Activity,
  Save,
  Trash2,
  Phone,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Pill,
  FileImage,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { SanitizedMedicalContent } from "../../components/SanitizedMedicalContent";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Patient Timeline State
  const [selectedTimelinePatient, setSelectedTimelinePatient] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [activeTab, setActiveTab] = useState<"safety" | "xray" | "reports">("safety");

  const initialFormState = {
    _id: "",
    name: "",
    age: "",
    weight: "",
    gender: "male",
    contactNumber: "",
    medicalHistory: "",
    allergies: "",
  };

  const [formData, setFormData] = useState(initialFormState);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const res = await api.get("/patients");
      setPatients(res.data || []);
    } catch (err) {
      toast.error("Failed to load patients directory");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTimeline = async (patient: any) => {
    setSelectedTimelinePatient(patient);
    setLoadingTimeline(true);
    try {
      const res = await api.get(`/patients/${patient._id}/timeline`);
      setTimelineData(res.data);
    } catch (err) {
      toast.error("Failed to fetch patient EHR timeline");
    } finally {
      setLoadingTimeline(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age) {
      return toast.error("Please provide patient name and age");
    }

    setActionLoading(true);
    try {
      const payload = {
        name: formData.name,
        age: Number(formData.age),
        weight: formData.weight ? Number(formData.weight) : undefined,
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        medicalHistory: formData.medicalHistory
          ? formData.medicalHistory.split(",").map((h) => h.trim())
          : [],
        allergies: formData.allergies
          ? formData.allergies.split(",").map((a) => a.trim())
          : [],
      };

      if (isEditing && formData._id) {
        await api.put(`/patients/${formData._id}`, payload);
        toast.success("Patient record updated successfully");
      } else {
        await api.post("/patients", payload);
        toast.success("Patient registered successfully");
      }

      setIsCreating(false);
      setIsEditing(false);
      setFormData(initialFormState);
      fetchPatients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePatient = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this patient record?")) return;

    try {
      await api.delete(`/patients/${id}`);
      toast.success("Patient record deleted");
      fetchPatients();
    } catch (error) {
      toast.error("Failed to delete patient");
    }
  };

  const handleEditClick = (patient: any) => {
    setFormData({
      _id: patient._id,
      name: patient.name,
      age: patient.age.toString(),
      weight: patient.weight ? patient.weight.toString() : "",
      gender: patient.gender || "male",
      contactNumber: patient.contactNumber || "",
      medicalHistory: Array.isArray(patient.medicalHistory)
        ? patient.medicalHistory.join(", ")
        : patient.medicalHistory || "",
      allergies: Array.isArray(patient.allergies)
        ? patient.allergies.join(", ")
        : patient.allergies || "",
    });
    setIsEditing(true);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200/80 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="w-7 h-7 text-teal-700" />
              Patient EHR Directory
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Longitudinal clinical encounters, patient histories, and medical allergy records
            </p>
          </div>

          {!isCreating && !isEditing && !selectedTimelinePatient && (
            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsCreating(true);
              }}
              className="btn-teal text-xs py-2.5 px-5"
            >
              <Plus className="w-4 h-4" />
              <span>Register Patient</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && !isCreating && !isEditing && !selectedTimelinePatient ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading patient directory...</p>
          </div>
        ) : (
          <>
            {/* Create/Edit Form */}
            {(isCreating || isEditing) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-teal-600" />
                    {isEditing ? "Edit Patient EHR Details" : "Register New Patient Record"}
                  </h2>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setFormData(initialFormState);
                    }}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdate} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Full Name *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Contact Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Age (Years) *
                      </label>
                      <input
                        required
                        type="number"
                        placeholder="45"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Weight (kg)
                      </label>
                      <input
                        type="number"
                        placeholder="68"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Gender *
                      </label>
                      <select
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Medical History (comma-separated)
                    </label>
                    <textarea
                      placeholder="Hypertension, Type 2 Diabetes, Asthma"
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none resize-none"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Allergies & Sensitivities
                    </label>
                    <textarea
                      placeholder="Penicillin, Sulfa drugs"
                      rows={2}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none resize-none"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                      }}
                      className="btn-secondary text-xs py-2 px-4"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="btn-teal text-xs py-2 px-5"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{isEditing ? "Save Changes" : "Register Patient"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Patient EHR Timeline View */}
            {selectedTimelinePatient && !isCreating && !isEditing && (
              <div className="space-y-6">
                <button
                  onClick={() => {
                    setSelectedTimelinePatient(null);
                    setTimelineData(null);
                  }}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Patient Directory
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  {/* Patient Profile Header */}
                  <div className="bg-slate-50 p-6 border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg border border-teal-200">
                            {selectedTimelinePatient.name?.[0] || "P"}
                          </div>
                          <div>
                            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                              {selectedTimelinePatient.name}
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                                {selectedTimelinePatient.age} yrs • {selectedTimelinePatient.gender}
                              </span>
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Patient ID: <code className="font-mono text-slate-700">{selectedTimelinePatient._id}</code>
                            </p>
                          </div>
                        </div>
                      </div>

                      {selectedTimelinePatient.contactNumber && (
                        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3 py-1.5 rounded-xl border border-slate-200">
                          <Phone className="w-3.5 h-3.5 text-teal-600" />
                          <span>{selectedTimelinePatient.contactNumber}</span>
                        </div>
                      )}
                    </div>

                    {/* Allergies & Medical History Badges */}
                    <div className="mt-4 pt-4 border-t border-slate-200/80 flex flex-wrap gap-4 text-xs">
                      {selectedTimelinePatient.allergies?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-rose-900 bg-rose-50 px-3 py-1 rounded-xl border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span className="font-bold uppercase text-[10px]">Allergies:</span>
                          <span>{Array.isArray(selectedTimelinePatient.allergies) ? selectedTimelinePatient.allergies.join(", ") : selectedTimelinePatient.allergies}</span>
                        </div>
                      )}

                      {selectedTimelinePatient.medicalHistory?.length > 0 && (
                        <div className="flex items-center gap-1.5 text-slate-700 bg-white px-3 py-1 rounded-xl border border-slate-200">
                          <Activity className="w-3.5 h-3.5 text-teal-600" />
                          <span className="font-bold uppercase text-[10px]">History:</span>
                          <span>{Array.isArray(selectedTimelinePatient.medicalHistory) ? selectedTimelinePatient.medicalHistory.join(", ") : selectedTimelinePatient.medicalHistory}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Timeline Tabs */}
                  <div className="border-b border-slate-200 bg-white px-6 flex gap-6">
                    <button
                      onClick={() => setActiveTab("safety")}
                      className={`py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === "safety"
                          ? "border-teal-600 text-teal-700"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <Pill className="w-4 h-4" />
                      <span>Drug Safety Checks ({timelineData?.safetyReports?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("xray")}
                      className={`py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === "xray"
                          ? "border-teal-600 text-teal-700"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <FileImage className="w-4 h-4" />
                      <span>Radiology X-Rays ({timelineData?.xrayStudies?.length || 0})</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("reports")}
                      className={`py-3.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors ${
                        activeTab === "reports"
                          ? "border-teal-600 text-teal-700"
                          : "border-transparent text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Clinical Condition Reports ({timelineData?.patientReports?.length || 0})</span>
                    </button>
                  </div>

                  {/* Tab Body */}
                  <div className="p-6">
                    {loadingTimeline ? (
                      <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-teal-600 mb-2" />
                        <span className="text-xs text-slate-500 font-semibold">Querying MongoDB EHR records...</span>
                      </div>
                    ) : (
                      <>
                        {/* Tab 1: Drug Safety Checks */}
                        {activeTab === "safety" && (
                          <div className="space-y-4">
                            {!timelineData?.safetyReports || timelineData.safetyReports.length === 0 ? (
                              <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                                No medication safety screenings recorded for this patient.
                              </div>
                            ) : (
                              timelineData.safetyReports.map((report: any) => (
                                <div key={report._id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Pill className="w-4 h-4 text-teal-600" />
                                      <span className="text-sm font-bold text-slate-900">{report.drugName}</span>
                                    </div>
                                    <span className="text-xs text-slate-400 font-medium">
                                      {new Date(report.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <SanitizedMedicalContent content={report.report || report.message} badgeLabel="FDA/ICMR Screened" />
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Tab 2: Radiology X-Rays */}
                        {activeTab === "xray" && (
                          <div className="space-y-4">
                            {!timelineData?.xrayStudies || timelineData.xrayStudies.length === 0 ? (
                              <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                                No radiology X-ray scans logged for this patient.
                              </div>
                            ) : (
                              timelineData.xrayStudies.map((item: any) => (
                                <div key={item.study?._id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-4">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-sm font-bold text-slate-900">{item.study?.studyType} ({item.study?.modality})</span>
                                      <span className="text-xs text-slate-500 block">{new Date(item.study?.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className="badge-clinical badge-teal">Status: {item.study?.status}</span>
                                  </div>
                                  <SanitizedMedicalContent content={item.aiReport?.generatedReport} badgeLabel="Radiology AI Report" />
                                </div>
                              ))
                            )}
                          </div>
                        )}

                        {/* Tab 3: Clinical Condition Reports */}
                        {activeTab === "reports" && (
                          <div className="space-y-4">
                            {!timelineData?.patientReports || timelineData.patientReports.length === 0 ? (
                              <div className="text-center py-12 text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
                                No condition summary reports generated for this patient.
                              </div>
                            ) : (
                              timelineData.patientReports.map((rep: any) => (
                                <div key={rep._id} className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-900">Condition: {rep.condition}</span>
                                    <span className="text-xs text-slate-400 font-medium">
                                      {new Date(rep.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  {rep.simpleSummary && (
                                    <p className="text-xs text-slate-700 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                                      {rep.simpleSummary}
                                    </p>
                                  )}
                                  <SanitizedMedicalContent content={rep.cures || rep.dietAndLifestyle} badgeLabel="Treatment Guidance" />
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Patients Grid */}
            {!isCreating && !isEditing && !selectedTimelinePatient && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <input
                    type="text"
                    placeholder="Search patients by name or ID..."
                    className="w-full sm:w-64 px-3.5 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-900 placeholder-slate-400 focus:border-teal-600 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPatients.length === 0 ? (
                    <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                      No patient records found. Click "Register Patient" to add a new record.
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient._id}
                        className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="badge-clinical badge-teal">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Stable Record
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(patient);
                                }}
                                className="p-1 text-slate-400 hover:text-teal-700 transition-colors"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeletePatient(patient._id, e)}
                                className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">
                            {patient.name}
                          </h3>
                          <div className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-2">
                            <span>{patient.age} yrs</span>
                            <span>•</span>
                            <span className="capitalize">{patient.gender}</span>
                            {patient.weight && <span>• {patient.weight} kg</span>}
                          </div>

                          {patient.contactNumber && (
                            <div className="text-xs text-slate-600 flex items-center gap-1.5 mb-3">
                              <Phone className="w-3.5 h-3.5 text-teal-600" />
                              <span>{patient.contactNumber}</span>
                            </div>
                          )}

                          {patient.allergies?.length > 0 && (
                            <div className="mb-3 p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 text-xs">
                              <span className="font-bold block mb-0.5 text-[10px] uppercase">Allergies</span>
                              <span>{patient.allergies.join(", ")}</span>
                            </div>
                          )}
                        </div>

                        <div
                          onClick={() => handleOpenTimeline(patient)}
                          className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700 cursor-pointer hover:text-teal-900"
                        >
                          <span>View Detailed EHR History</span>
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

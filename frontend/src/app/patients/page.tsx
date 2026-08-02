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
  ArrowLeft,
  Trash2,
  Phone,
  FileText,
  AlertTriangle,
} from "lucide-react";

export default function PatientsPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

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
      setPatients(res.data);
    } catch (err) {
      toast.error("Failed to load patients directory");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age) {
      return toast.error("Please provide name and age");
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
        toast.success("Patient updated successfully");
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
    if (!window.confirm("Are you sure you want to delete this patient?")) return;

    try {
      await api.delete(`/patients/${id}`);
      toast.success("Patient deleted");
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
        : (patient.medicalHistory || ""),
      allergies: Array.isArray(patient.allergies) 
        ? patient.allergies.join(", ") 
        : (patient.allergies || ""),
    });
    setIsEditing(true);
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              Patient Directory
            </h1>
            <p className="text-gray-500 mt-1">
              Manage patient demographics and clinical records
            </p>
          </div>

          {!isCreating && !isEditing && (
            <button
              onClick={() => {
                setFormData(initialFormState);
                setIsCreating(true);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all font-semibold transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              Register Patient
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && !isCreating && !isEditing ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500 font-medium">Loading directory...</p>
          </div>
        ) : (
          <>
            {/* Create/Edit Form */}
            {(isCreating || isEditing) && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <User className="text-blue-500" />{" "}
                    {isEditing ? "Edit Patient Details" : "Register New Patient"}
                  </h2>
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                      setFormData(initialFormState);
                    }}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleCreateOrUpdate} className="space-y-6 max-w-3xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Full Name *</label>
                      <input
                        required
                        type="text"
                        placeholder="John Doe"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Contact Number</label>
                      <input
                        type="tel"
                        placeholder="+1 234 567 890"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        value={formData.contactNumber}
                        onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Age *</label>
                      <input
                        required
                        type="number"
                        placeholder="35"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        value={formData.age}
                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Weight (kg)</label>
                      <input
                        type="number"
                        placeholder="70"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Gender *</label>
                      <select
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Medical History (comma-separated)</label>
                    <textarea
                      placeholder="Hypertension, Diabetes Type 2"
                      rows={2}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                      value={formData.medicalHistory}
                      onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">Allergies (comma-separated)</label>
                    <textarea
                      placeholder="Penicillin, Peanuts"
                      rows={2}
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-4 border-t border-gray-100 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                      }}
                      className="px-6 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-70 flex items-center gap-3"
                    >
                      {actionLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isEditing ? "Save Changes" : "Register Patient"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Patients Grid */}
            {!isCreating && !isEditing && (
              <div className="space-y-6 animate-in fade-in duration-700">
                {/* Search & Filter Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-full lg:w-1/3 ml-auto">
                  <input
                    type="text"
                    placeholder="Search patients by name or ID..."
                    className="w-full bg-transparent px-4 py-2 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPatients.length === 0 ? (
                    <div className="col-span-full text-center py-20 text-gray-500">
                      No patients found. Register one to get started!
                    </div>
                  ) : (
                    filteredPatients.map((patient) => (
                      <div
                        key={patient._id}
                        className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all flex flex-col relative overflow-hidden"
                      >
                        {/* Decoration blob */}
                        <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors z-0" />
                        
                        <div className="relative z-10 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center justify-center w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
                              <User className="w-6 h-6" />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(patient);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Edit Patient"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleDeletePatient(patient._id, e)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Patient"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                            {patient.name}
                          </h3>
                          <div className="text-sm text-gray-500 font-medium mb-4 flex items-center gap-2 flex-wrap">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-600">ID: {patient._id.slice(-6).toUpperCase()}</span>
                            <span>{patient.age} yrs</span>
                            <span className="capitalize">{patient.gender}</span>
                            {patient.weight && <span>• {patient.weight}kg</span>}
                          </div>

                          <div className="space-y-3 mb-6">
                            {patient.contactNumber && (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone className="w-4 h-4 text-blue-400" />
                                {patient.contactNumber}
                              </div>
                            )}

                            {(patient.medicalHistory?.length > 0 || patient.allergies?.length > 0) && (
                              <div className="pt-3 border-t border-gray-50 space-y-2">
                                {patient.allergies?.length > 0 && (
                                  <div className="flex items-start gap-2 text-sm">
                                    <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                                    <div className="flex flex-wrap gap-1">
                                      {patient.allergies.map((a: string, i: number) => (
                                        <span key={i} className="text-xs font-semibold text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100">
                                          {a}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {patient.medicalHistory?.length > 0 && (
                                  <div className="flex items-start gap-2 text-sm text-gray-600">
                                    <FileText className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                                    <span className="truncate">{patient.medicalHistory.join(", ")}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="mt-auto flex justify-end">
                            <span className="text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer">
                              Edit Details <Edit2 className="w-3 h-3" />
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

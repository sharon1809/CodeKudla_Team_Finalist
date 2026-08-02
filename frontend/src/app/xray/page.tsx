"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import {
  Loader2,
  Plus,
  Edit2,
  X,
  FileImage,
  User,
  Calendar,
  Activity,
  Save,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { Navbar } from "../../components/Navbar";
import { SanitizedMedicalContent } from "../../components/SanitizedMedicalContent";

export default function XrayPage() {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<any>(null);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    studyType: "Chest PA",
    modality: "Digital X-Ray",
    view: "PA View",
    file: null as File | null,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    fetchStudies();
    fetchPatients();
  }, []);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const res = await api.get("/xray/studies");
      setStudies(res.data || []);
    } catch (err) {
      toast.error("Failed to load X-ray reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.patientId)
      return toast.error("Please select patient and X-ray image file");
    setUploadLoading(true);
    try {
      const form = new FormData();
      form.append("patientId", formData.patientId);
      form.append("studyType", formData.studyType);
      form.append("modality", formData.modality);
      form.append("view", formData.view);
      form.append("image", formData.file);

      const res = await api.post("/xray/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("X-ray analyzed and findings generated");
      setIsCreating(false);
      setFormData({ ...formData, file: null });
      fetchStudies();
      if (res.data?.studyId) {
        handleSelectStudy(res.data.studyId);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSelectStudy = async (studyId: string) => {
    try {
      setLoading(true);
      setIsCreating(false);
      setImageUrl("");
      const res = await api.get(`/xray/studies/${studyId}`);
      setSelectedStudy(res.data);
      setEditContent(res.data.aiReport?.generatedReport || "");
      setIsEditing(false);

      try {
        const imageRes = await api.get(`/xray/studies/${studyId}/image`, {
          responseType: "blob",
        });
        const url = URL.createObjectURL(imageRes.data);
        setImageUrl(url);
      } catch (imgErr) {
        console.error("Failed to load image", imgErr);
      }
    } catch (err) {
      toast.error("Failed to fetch study details");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedStudy) return;
    setSaveLoading(true);
    try {
      await api.put(`/xray/studies/${selectedStudy.study._id}/tech-submit`, {
        editedReport: editContent,
      });
      toast.success("Radiologist report updated");
      setIsEditing(false);
      setSelectedStudy({
        ...selectedStudy,
        aiReport: {
          ...selectedStudy.aiReport,
          generatedReport: editContent,
        },
      });
      fetchStudies();
    } catch (err) {
      toast.error("Failed to save report changes");
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      <Toaster position="top-right" />
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200/80 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <FileImage className="w-7 h-7 text-teal-700" />
              X-Ray Radiology Diagnostic Portal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Automated multi-class lesion detection and radiologist decision support
            </p>
          </div>

          {!isCreating && !selectedStudy && (
            <button
              onClick={() => setIsCreating(true)}
              className="btn-teal text-xs py-2.5 px-5"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New X-Ray</span>
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && !selectedStudy && !isCreating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-3" />
            <p className="text-xs text-slate-500 font-semibold">Loading radiology records...</p>
          </div>
        ) : (
          <>
            {/* Create Form */}
            {isCreating && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-teal-600" /> Upload X-Ray Scan for Pathology Analysis
                  </h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Patient Record
                      </label>
                      <select
                        required
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none"
                        value={formData.patientId}
                        onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      >
                        <option value="">Select a patient...</option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} (Age: {p.age})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Study Description
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:ring-2 focus:border-teal-600 focus:ring-teal-100 outline-none"
                        value={formData.studyType}
                        onChange={(e) => setFormData({ ...formData, studyType: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Select X-Ray File (DICOM / Image)
                    </label>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative overflow-hidden">
                      <input
                        required
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            file: e.target.files?.[0] || null,
                          })
                        }
                      />
                      <UploadCloud className="w-10 h-10 mx-auto text-teal-600 mb-2 opacity-80" />
                      <p className="text-xs font-semibold text-slate-700">
                        {formData.file ? formData.file.name : "Drag & drop or click to choose X-ray image"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={uploadLoading}
                      className="btn-teal text-sm py-3 px-6 w-full justify-center"
                    >
                      {uploadLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Processing X-Ray Radiology AI...
                        </>
                      ) : (
                        "Generate Radiologist Report"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Study Detail View */}
            {selectedStudy && !isCreating && (
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedStudy(null)}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-teal-700 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Radiology Records
                </button>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <User className="w-5 h-5 text-teal-700" />
                        {selectedStudy.study?.patientId?.name || "Patient Record"}
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{selectedStudy.study?.studyType} ({selectedStudy.study?.modality})</span>
                        <span>•</span>
                        <span>{new Date(selectedStudy.study?.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        Verified Against Radiologist Guidelines
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image Column */}
                    <div className="p-5 bg-slate-900 border-r border-slate-800 flex flex-col min-h-[400px]">
                      <span className="text-xs font-semibold text-slate-400 mb-3 block">Digital Radiogram View</span>
                      <div className="flex-1 bg-black rounded-xl overflow-hidden flex items-center justify-center p-2">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="X-Ray Scan"
                            className="max-h-[500px] w-full object-contain rounded-lg"
                          />
                        ) : (
                          <span className="text-xs text-slate-500">Loading digital scan...</span>
                        )}
                      </div>
                    </div>

                    {/* Report Column */}
                    <div className="p-6 flex flex-col justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <h3 className="text-sm font-bold text-slate-900">Radiology Diagnostic Impression</h3>
                          {!isEditing ? (
                            <button
                              onClick={() => setIsEditing(true)}
                              className="btn-secondary text-xs py-1.5 px-3"
                            >
                              <Edit2 className="w-3.5 h-3.5" /> Edit Report
                            </button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => setIsEditing(false)}
                                className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                disabled={saveLoading}
                                className="btn-teal text-xs py-1.5 px-3"
                              >
                                <Save className="w-3.5 h-3.5" /> Save
                              </button>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <textarea
                            className="w-full h-80 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono leading-relaxed outline-none focus:border-teal-600"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                        ) : (
                          <SanitizedMedicalContent
                            content={selectedStudy.aiReport?.generatedReport}
                            badgeLabel="Radiology Protocol Formatted"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Studies Grid */}
            {!isCreating && !selectedStudy && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {studies.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    No X-ray studies logged. Click "Upload New X-Ray" to upload a scan.
                  </div>
                ) : (
                  studies.map((study) => (
                    <div
                      key={study._id}
                      onClick={() => handleSelectStudy(study._id)}
                      className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-teal-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            {study.studyType}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(study.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900 mb-1 group-hover:text-teal-700 transition-colors">
                          {study.patientId?.name || "Patient Scan"}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">{study.modality} • {study.view || "PA View"}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-teal-700">
                        <span>View Radiology Findings</span>
                        <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

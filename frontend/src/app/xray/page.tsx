"use client";

import React, { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { toast, Toaster } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Loader2,
  Plus,
  Edit2,
  Check,
  X,
  FileImage,
  User,
  Calendar,
  Activity,
  Save,
  ArrowLeft,
  UploadCloud,
} from "lucide-react";

export default function XrayPage() {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStudy, setSelectedStudy] = useState<any>(null);

  const [uploadLoading, setUploadLoading] = useState(false);
  const [formData, setFormData] = useState({
    patientId: "",
    studyType: "Chest",
    modality: "X-Ray",
    view: "PA",
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
      setStudies(res.data);
    } catch (err) {
      toast.error("Failed to load X-ray reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchPatients = async () => {
    try {
      const res = await api.get("/patients");
      setPatients(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file || !formData.patientId)
      return toast.error("Please select patient and image");
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
      toast.success("X-ray analyzed successfully");
      setIsCreating(false);
      setFormData({ ...formData, file: null });
      fetchStudies();
      // Optionally open the newly created study immediately
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
      setImageUrl(""); // Reset image
      const res = await api.get(`/xray/studies/${studyId}`);
      setSelectedStudy(res.data);
      setEditContent(res.data.aiReport?.generatedReport || "");
      setIsEditing(false);

      // Load Image
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
      toast.success("Changes saved successfully");
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
      toast.error("Failed to save changes");
    } finally {
      setSaveLoading(false);
    }
  };

  // Main UI
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600">
              Radiology Hub
            </h1>
            <p className="text-gray-500 mt-1">
              AI-Powered X-Ray Analysis & Reporting
            </p>
          </div>

          {!isCreating && !selectedStudy && (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white px-6 py-3 rounded-xl shadow-lg shadow-teal-500/30 transition-all font-semibold transform hover:scale-105 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              New X-Ray Report
            </button>
          )}
        </div>

        {/* Loading State */}
        {loading && !selectedStudy && !isCreating ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-teal-500 mb-4" />
            <p className="text-gray-500 font-medium">Loading records...</p>
          </div>
        ) : (
          <>
            {/* Create Form */}
            {isCreating && (
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <FileImage className="text-teal-500" /> Upload New X-Ray
                  </h2>
                  <button
                    onClick={() => setIsCreating(false)}
                    className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6 max-w-2xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Patient
                      </label>
                      <select
                        required
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                        value={formData.patientId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            patientId: e.target.value,
                          })
                        }
                      >
                        <option value="">Select a patient...</option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} (Age: {p.age})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">
                        Study Type
                      </label>
                      <input
                        required
                        type="text"
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all outline-none"
                        value={formData.studyType}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            studyType: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700">
                      Upload Image (JPG/PNG)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:bg-gray-50 transition-colors group relative overflow-hidden">
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
                      <UploadCloud className="w-12 h-12 mx-auto text-gray-400 group-hover:text-teal-500 transition-colors mb-3" />
                      <p className="text-gray-600 font-medium">
                        {formData.file
                          ? formData.file.name
                          : "Drag & drop or click to select image"}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={uploadLoading}
                      className="w-full py-4 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:opacity-90 transition-all disabled:opacity-70 flex justify-center items-center gap-3"
                    >
                      {uploadLoading ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />{" "}
                          Analyzing AI...
                        </>
                      ) : (
                        "Generate AI Report"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Study Detail View */}
            {selectedStudy && !isCreating && (
              <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                <button
                  onClick={() => setSelectedStudy(null)}
                  className="mb-6 flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors font-medium"
                >
                  <ArrowLeft className="w-5 h-5" /> Back to Records
                </button>

                <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-white p-6 md:p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <User className="text-teal-500" />{" "}
                        {selectedStudy.study?.patientId?.name || "Unknown Patient"}
                      </h2>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />{" "}
                          {selectedStudy.study?.studyType} (
                          {selectedStudy.study?.modality})
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />{" "}
                          {new Date(
                            selectedStudy.study?.createdAt
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        AI Confidence
                      </div>
                      <div className="text-xl font-black text-teal-600">
                        {selectedStudy.aiReport?.confidence
                          ? (selectedStudy.aiReport.confidence * 100).toFixed(0) +
                            "%"
                          : "N/A"}
                      </div>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image Column */}
                    <div className="p-6 md:p-8 bg-black/5 border-r border-gray-100 flex flex-col">
                      <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                        <FileImage className="w-5 h-5" /> Original Scan
                      </h3>
                      <div className="flex-1 bg-black rounded-2xl overflow-hidden flex items-center justify-center min-h-[400px]">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt="X-Ray"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-gray-500">Loading image...</span>
                        )}
                      </div>
                    </div>

                    {/* Report Column */}
                    <div className="p-6 md:p-8 flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-700">
                          Diagnostic Report
                        </h3>
                        {!isEditing ? (
                          <button
                            onClick={() => setIsEditing(true)}
                            className="flex items-center gap-2 text-sm bg-teal-50 text-teal-700 hover:bg-teal-100 px-4 py-2 rounded-lg font-semibold transition-colors"
                          >
                            <Edit2 className="w-4 h-4" /> Edit Report
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setIsEditing(false);
                                setEditContent(
                                  selectedStudy.aiReport?.generatedReport || ""
                                );
                              }}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={saveLoading}
                              className="flex items-center gap-2 text-sm bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-70"
                            >
                              {saveLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              Save Changes
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {isEditing ? (
                          <textarea
                            className="w-full h-full min-h-[400px] p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none resize-none font-mono text-sm leading-relaxed"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                          />
                        ) : (
                          <div className="prose prose-teal prose-headings:font-bold prose-h2:text-xl prose-p:text-gray-600 prose-li:text-gray-600 max-w-none bg-white rounded-xl">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {selectedStudy.aiReport?.generatedReport ||
                                "No report content available."}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Studies Grid */}
            {!isCreating && !selectedStudy && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-700">
                {studies.length === 0 ? (
                  <div className="col-span-full text-center py-20 text-gray-500">
                    No X-ray reports found. Create one to get started!
                  </div>
                ) : (
                  studies.map((study) => (
                    <div
                      key={study._id}
                      onClick={() => handleSelectStudy(study._id)}
                      className="group bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-teal-100 transition-all cursor-pointer flex flex-col relative overflow-hidden"
                    >
                      {/* Decoration blob */}
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-teal-50 rounded-full blur-2xl group-hover:bg-teal-100 transition-colors z-0" />
                      
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl group-hover:scale-110 transition-transform">
                            <Activity className="w-6 h-6" />
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                              study.status === "approved"
                                ? "bg-green-100 text-green-700"
                                : study.status === "tech_submitted"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {study.status.replace("_", " ")}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-gray-800 mb-1 truncate">
                          {study.patientId?.name || "Unknown Patient"}
                        </h3>
                        <p className="text-sm text-gray-500 mb-6 font-medium">
                          {study.studyType} • {study.modality}
                        </p>

                        <div className="mt-auto flex items-center justify-between text-xs text-gray-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(study.createdAt).toLocaleDateString()}
                          </span>
                          <span className="text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            View Details &rarr;
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

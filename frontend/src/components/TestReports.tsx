'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import {
  Upload,
  FileImage,
  FlaskConical,
  Clock,
  ChevronRight,
  ChevronLeft,
  Users,
  CheckCircle,
  AlertTriangle,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';

interface Patient { _id: string; name: string; age: number; gender: string; }
interface Study {
  _id: string;
  studyType: string;
  modality: string;
  status: string;
  createdAt: string;
  patientId?: { name?: string } | string;
}
interface AIReport { studyId: string; generatedReport: string; confidence: number; model: string; }
interface LabFinding { parameter: string; value: string; unit?: string; referenceRange?: string; status: 'normal' | 'abnormal_high' | 'abnormal_low' | 'critical'; }
interface LabAnalysis {
  findings?: LabFinding[];
  interpretation?: string;
  clinicalImplications?: string[];
  suggestedFollowUp?: string[];
  urgencyLevel?: string;
}

type Tab = 'imaging' | 'lab';

const MODALITIES = ['X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Blood Report', 'Other'];
const STATUS_MAP: Record<string, { label: string; color: "default" | "warning" | "info" | "success" }> = {
  draft: { label: 'Draft', color: 'default' },
  tech_submitted: { label: 'AI Analyzed', color: 'warning' },
  doc_reviewed: { label: 'Reviewed', color: 'info' },
  approved: { label: 'Approved', color: 'success' },
};

const FINDING_STATUS: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  normal: { icon: CheckCircle, color: '#10B981', label: 'Normal' },
  abnormal_high: { icon: TrendingUp, color: '#EF4444', label: 'High' },
  abnormal_low: { icon: TrendingDown, color: '#3B82F6', label: 'Low' },
  critical: { icon: AlertTriangle, color: '#DC2626', label: 'Critical' },
};

export default function TestReports() {
  const [tab, setTab] = useState<Tab>('imaging');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [showHistory, setShowHistory] = useState(true);

  // Imaging upload state
  const [imgPatientId, setImgPatientId] = useState('');
  const [imgStudyType, setImgStudyType] = useState('Chest PA View');
  const [imgModality, setImgModality] = useState('X-Ray');
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [imgPreview, setImgPreview] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);
  const [imgResult, setImgResult] = useState<{ study: any; aiReport: AIReport } | null>(null);
  const [imgError, setImgError] = useState('');

  // Lab upload state
  const [labFile, setLabFile] = useState<File | null>(null);
  const [labLoading, setLabLoading] = useState(false);
  const [labResult, setLabResult] = useState<LabAnalysis | null>(null);
  const [labError, setLabError] = useState('');

  useEffect(() => {
    loadPatients();
    loadStudies();
  }, []);

  const loadPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(Array.isArray(res.data) ? res.data : res.data.patients || []);
    } catch (err) { console.error(err); }
  };

  const loadStudies = async () => {
    try {
      const res = await api.get('/xray/studies');
      setStudies(res.data.studies || []);
    } catch (err) { console.error(err); }
  };

  // ─── IMAGING UPLOAD ──────────────────────────────────────────────
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgFile(file);
    const reader = new FileReader();
    reader.onload = ev => setImgPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleImagingUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgPatientId || !imgFile) { setImgError('Please select a patient and upload an image.'); return; }
    setImgLoading(true); setImgError(''); setImgResult(null);
    try {
      const formData = new FormData();
      formData.append('image', imgFile);
      formData.append('patientId', imgPatientId);
      formData.append('studyType', imgStudyType);
      formData.append('modality', imgModality);
      const res = await api.post('/xray/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setImgResult(res.data);
      await loadStudies();
    } catch (err: any) {
      setImgError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setImgLoading(false);
    }
  };

  const handleTechSubmit = async (studyId: string) => {
    try {
      await api.put(`/xray/studies/${studyId}/tech-submit`);
      await loadStudies();
      if (imgResult?.study?._id === studyId) setImgResult(prev => prev ? { ...prev, study: { ...prev.study, status: 'tech_submitted' } } : null);
    } catch (err) { console.error(err); }
  };

  const handleDoctorApprove = async (studyId: string) => {
    try {
      await api.put(`/xray/studies/${studyId}/doctor-approve`);
      await loadStudies();
      if (imgResult?.study?._id === studyId) setImgResult(prev => prev ? { ...prev, study: { ...prev.study, status: 'approved' } } : null);
    } catch (err) { console.error(err); }
  };

  // ─── LAB UPLOAD ──────────────────────────────────────────────────
  const handleLabUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!labFile) { setLabError('Please select a lab report file.'); return; }
    setLabLoading(true); setLabError(''); setLabResult(null);
    try {
      const formData = new FormData();
      formData.append('file', labFile);
      formData.append('documentType', 'lab_report');
      const uploadRes = await api.post('/documents/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const docId = uploadRes.data.document?._id;
      if (docId) {
        try {
          const analysisRes = await api.post('/documents/analyze', { documentId: docId });
          setLabResult(analysisRes.data.analysis);
        } catch {
          setLabResult({ interpretation: 'Document uploaded and processed. Analysis results are being generated. Please check the Documents section.' });
        }
      }
    } catch (err: any) {
      setLabError(err.response?.data?.message || err.message || 'Upload failed');
    } finally {
      setLabLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', bgcolor: 'background.default' }}>

      {/* ─── HISTORY SIDEBAR ──────────────────────────────────────── */}
      <AnimatePresence>
        {showHistory && (
          <Box
            component={motion.div}
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              borderRight: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Past Reports</Typography>
              <Typography variant="caption" color="text.secondary">{studies.length} imaging studies</Typography>
            </Box>

            <List sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
              {studies.length === 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3, textAlign: 'center', opacity: 0.6 }}>
                  <FileImage className="w-8 h-8 mb-2" />
                  <Typography variant="subtitle2">No reports yet.</Typography>
                  <Typography variant="caption">Upload your first study.</Typography>
                </Box>
              ) : (
                studies.map(s => {
                  const st = STATUS_MAP[s.status] || STATUS_MAP.draft;
                  const patientName = typeof s.patientId === 'object' ? s.patientId?.name : undefined;
                  return (
                    <ListItemButton
                      key={s._id}
                      sx={{ borderRadius: 2, mb: 0.5, p: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}
                    >
                      <FileImage className="w-4 h-4 text-primary-main mt-0.5 shrink-0" />
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography noWrap variant="body2" sx={{ fontWeight: 600 }}>{s.modality} — {s.studyType}</Typography>
                        {patientName && <Typography noWrap variant="caption" color="text.secondary" sx={{ display: 'block' }}>{patientName}</Typography>}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          <Chip label={st.label} size="small" color={st.color} sx={{ height: 20, fontSize: '0.65rem' }} />
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Clock className="w-3 h-3" />
                            {new Date(s.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </Typography>
                        </Box>
                      </Box>
                    </ListItemButton>
                  );
                })
              )}
            </List>
          </Box>
        )}
      </AnimatePresence>

      {/* ─── MAIN AREA ─────────────────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', zIndex: 10 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => setShowHistory(!showHistory)} size="small">
              {showHistory ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </IconButton>
            <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileImage className="w-5 h-5 text-primary-light" />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Test Reports</Typography>
              <Typography variant="caption" color="text.secondary">AI-powered imaging & lab report analysis</Typography>
            </Box>
          </Box>

          <ToggleButtonGroup
            value={tab}
            exclusive
            onChange={(_, v) => v && setTab(v)}
            size="small"
            sx={{ bgcolor: 'background.default' }}
          >
            <ToggleButton value="imaging" sx={{ px: 2, textTransform: 'none', fontWeight: 600, gap: 1 }}>
              <FileImage className="w-4 h-4" /> X-Ray / Imaging
            </ToggleButton>
            <ToggleButton value="lab" sx={{ px: 2, textTransform: 'none', fontWeight: 600, gap: 1 }}>
              <FlaskConical className="w-4 h-4" /> Lab Reports
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Content */}
        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, display: 'flex', justifyContent: 'center' }}>
          <Box sx={{ width: '100%', maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 4 }}>

            {/* ─── IMAGING TAB ─── */}
            {tab === 'imaging' && (
              <>
                <Card sx={{ p: 4, boxShadow: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Upload Imaging Study</Typography>
                  <form onSubmit={handleImagingUpload}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                      <FormControl fullWidth>
                        <InputLabel>Patient</InputLabel>
                        <Select
                          value={imgPatientId}
                          label="Patient"
                          onChange={e => setImgPatientId(e.target.value)}
                        >
                          {patients.map(p => <MenuItem key={p._id} value={p._id}>{p.name} ({p.age}y)</MenuItem>)}
                        </Select>
                      </FormControl>

                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                        <FormControl fullWidth>
                          <InputLabel>Modality</InputLabel>
                          <Select
                            value={imgModality}
                            label="Modality"
                            onChange={e => setImgModality(e.target.value)}
                          >
                            {MODALITIES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Study Type / View"
                          value={imgStudyType}
                          onChange={e => setImgStudyType(e.target.value)}
                          placeholder="e.g. Chest PA View"
                          fullWidth
                        />
                      </Box>

                      {/* Image upload drop area */}
                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Image File</Typography>
                        <Button
                          component="label"
                          sx={{
                            width: '100%',
                            height: 200,
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.default',
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)', borderColor: 'primary.main' }
                          }}
                        >
                          {imgPreview ? (
                            <Box sx={{ textAlign: 'center' }}>
                              <img src={imgPreview} alt="Preview" style={{ maxHeight: 120, borderRadius: 8, objectFit: 'contain' }} />
                              <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{imgFile?.name}</Typography>
                            </Box>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mb-2 text-primary-main" />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Click to upload or drag & drop</Typography>
                              <Typography variant="caption">PNG, JPG, JPEG, DICOM</Typography>
                            </>
                          )}
                          <input type="file" hidden accept="image/*" onChange={handleImageFileChange} />
                        </Button>
                      </Box>

                      {imgError && <Alert severity="error" sx={{ borderRadius: 2 }}>{imgError}</Alert>}

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={imgLoading || !imgFile}
                        startIcon={imgLoading ? <CircularProgress size={16} color="inherit" /> : <Upload className="w-4 h-4" />}
                        sx={{ py: 1.5, borderRadius: 8 }}
                      >
                        {imgLoading ? 'Analyzing with AI...' : 'Upload & Analyze'}
                      </Button>
                    </Box>
                  </form>
                </Card>

                {/* AI Result */}
                <AnimatePresence>
                  {imgResult && (
                    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', justifyItems: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {imgResult.study.modality} — {imgResult.study.studyType}
                          </Typography>
                          <Chip label={STATUS_MAP[imgResult.study.status]?.label || 'Draft'} color={STATUS_MAP[imgResult.study.status]?.color} size="small" sx={{ mt: 1, fontWeight: 600 }} />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2 }}>
                          {imgResult.study.status === 'draft' && (
                            <Button variant="outlined" onClick={() => handleTechSubmit(imgResult.study._id)} startIcon={<CheckCircle className="w-4 h-4" />}>
                              Submit for Review
                            </Button>
                          )}
                          {imgResult.study.status === 'tech_submitted' && (
                            <Button variant="contained" color="primary" onClick={() => handleDoctorApprove(imgResult.study._id)} startIcon={<CheckCircle className="w-4 h-4" />}>
                              Approve Report
                            </Button>
                          )}
                          {imgResult.study.status === 'approved' && (
                            <Chip icon={<CheckCircle className="w-4 h-4" />} label="Report Approved & Finalized" color="success" variant="outlined" />
                          )}
                        </Box>
                      </Card>

                      {imgResult.aiReport && (
                        <Card sx={{ p: 3, borderColor: 'primary.dark', borderWidth: 1, borderStyle: 'solid' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                            <Typography variant="subtitle1" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 600 }}>
                              <Eye className="w-5 h-5" /> AI Analysis Report
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">Confidence:</Typography>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: imgResult.aiReport.confidence > 0.7 ? 'success.main' : 'warning.main' }}>
                                {Math.round(imgResult.aiReport.confidence * 100)}%
                              </Typography>
                            </Box>
                          </Box>

                          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: imgResult.aiReport.generatedReport.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                          </Paper>

                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'right' }}>
                            Analyzed by {imgResult.aiReport.model}
                          </Typography>
                        </Card>
                      )}
                    </Box>
                  )}
                </AnimatePresence>
              </>
            )}

            {/* ─── LAB REPORTS TAB ─── */}
            {tab === 'lab' && (
              <>
                <Card sx={{ p: 4, boxShadow: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>Upload Lab Report</Typography>
                  <form onSubmit={handleLabUpload}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                      <Box>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>Lab Report PDF / Image</Typography>
                        <Button
                          component="label"
                          sx={{
                            width: '100%',
                            height: 200,
                            border: '2px dashed',
                            borderColor: 'divider',
                            borderRadius: 3,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'background.default',
                            color: 'text.secondary',
                            textTransform: 'none',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.02)', borderColor: 'primary.main' }
                          }}
                        >
                          {labFile ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <FileText className="w-8 h-8 text-primary-main" />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{labFile.name}</Typography>
                            </Box>
                          ) : (
                            <>
                              <FlaskConical className="w-8 h-8 mb-2 text-primary-main" />
                              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Upload Blood Work, CBC, LFT, or any lab PDF</Typography>
                              <Typography variant="caption">PDF, PNG, JPG supported</Typography>
                            </>
                          )}
                          <input type="file" hidden accept=".pdf,.png,.jpg,.jpeg" onChange={e => setLabFile(e.target.files?.[0] || null)} />
                        </Button>
                      </Box>

                      {labError && <Alert severity="error" sx={{ borderRadius: 2 }}>{labError}</Alert>}

                      <Button
                        type="submit"
                        variant="contained"
                        disabled={labLoading || !labFile}
                        startIcon={labLoading ? <CircularProgress size={16} color="inherit" /> : <FlaskConical className="w-4 h-4" />}
                        sx={{ py: 1.5, borderRadius: 8 }}
                      >
                        {labLoading ? 'Analyzing Lab Report...' : 'Analyze Lab Report'}
                      </Button>
                    </Box>
                  </form>
                </Card>

                {/* Lab Result */}
                <AnimatePresence>
                  {labResult && (
                    <Box component={motion.div} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                      {labResult.findings?.length ? (
                        <Card sx={{ p: 3 }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main', fontWeight: 600, textTransform: 'uppercase' }}>
                            <FlaskConical className="w-4 h-4" /> Lab Findings
                          </Typography>

                          <TableContainer component={Paper} elevation={0} sx={{ bgcolor: 'transparent', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                            <Table size="small">
                              <TableHead sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600 }}>Parameter</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Value</TableCell>
                                  <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                                  <TableCell sx={{ fontWeight: 600, textAlign: 'right' }}>Status</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {labResult.findings.map((f, i) => {
                                  const fs = FINDING_STATUS[f.status] || FINDING_STATUS.normal;
                                  const Icon = fs.icon;
                                  return (
                                    <TableRow key={i} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                      <TableCell sx={{ fontWeight: 500 }}>{f.parameter}</TableCell>
                                      <TableCell sx={{ fontWeight: 700, color: fs.color }}>{f.value} {f.unit || ''}</TableCell>
                                      <TableCell sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>{f.referenceRange || '—'}</TableCell>
                                      <TableCell align="right">
                                        <Chip
                                          icon={<Icon className="w-3 h-3" />}
                                          label={fs.label}
                                          size="small"
                                          variant="outlined"
                                          sx={{ color: fs.color, borderColor: fs.color, '& .MuiChip-icon': { color: fs.color } }}
                                        />
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Card>
                      ) : null}

                      {labResult.interpretation && (
                        <Card sx={{ p: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Clinical Interpretation</Typography>
                          <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>{labResult.interpretation}</Typography>
                          </Paper>
                        </Card>
                      )}

                      {labResult.clinicalImplications?.length ? (
                        <Card sx={{ p: 3 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Clinical Implications</Typography>
                          <List dense disablePadding>
                            {labResult.clinicalImplications.map((c, i) => (
                              <ListItem key={i} sx={{ display: 'flex', alignItems: 'flex-start', px: 0, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary-main" />
                                </ListItemIcon>
                                <ListItemText primary={c} slotProps={{ primary: { variant: 'body2' } }} />
                              </ListItem>
                            ))}
                          </List>
                        </Card>
                      ) : null}

                      {labResult.suggestedFollowUp?.length ? (
                        <Card sx={{ p: 3 }}>
                          <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, mb: 2, color: 'success.main' }}>
                            <CheckCircle className="w-4 h-4" /> Suggested Follow-Up
                          </Typography>
                          <List dense disablePadding>
                            {labResult.suggestedFollowUp.map((s, i) => (
                              <ListItem key={i} sx={{ display: 'flex', alignItems: 'flex-start', px: 0, py: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-success-main" />
                                </ListItemIcon>
                                <ListItemText primary={s} slotProps={{ primary: { variant: 'body2' } }} />
                              </ListItem>
                            ))}
                          </List>

                          {labResult.urgencyLevel && (
                            <Chip
                              icon={<AlertTriangle className="w-4 h-4" />}
                              label={`Urgency: ${labResult.urgencyLevel.charAt(0).toUpperCase() + labResult.urgencyLevel.slice(1)}`}
                              color={labResult.urgencyLevel === 'critical' ? 'error' : labResult.urgencyLevel === 'urgent' ? 'warning' : 'success'}
                              sx={{ mt: 2 }}
                            />
                          )}
                        </Card>
                      ) : null}

                    </Box>
                  )}
                </AnimatePresence>
              </>
            )}

          </Box>
        </Box>
      </Box>
    </Box>
  );
}

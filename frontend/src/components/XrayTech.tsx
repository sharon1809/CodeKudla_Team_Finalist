"use client";

import React, { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, RefreshCcw, FileText, Send, User } from 'lucide-react';
import { api } from '../lib/api';
import { motion } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';

export default function XrayTechDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [modality, setModality] = useState('X-Ray');
  const [studyType, setStudyType] = useState('Chest X-ray');
  const [view, setView] = useState('PA');

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await api.get('/patients');
        setPatients(res.data);
        if (res.data.length > 0) setPatientId(res.data[0]._id);
      } catch (err) {
        toast.error('Failed to load patients');
      }
    };
    fetchPatients();
  }, []);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [editedReport, setEditedReport] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !patientId) {
      toast.error('Please provide a file and Patient ID');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('patientId', patientId);
    formData.append('modality', modality);
    formData.append('studyType', studyType);
    formData.append('view', view);

    try {
      const res = await api.post('/xray/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(res.data);
      setEditedReport(res.data.draftText);
      toast.success('X-ray analyzed successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to upload and analyze');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitToDoctor = async () => {
    if (!result?.studyId) return;
    setLoading(true);
    try {
      await api.put(`/xray/studies/${result.studyId}/tech-submit`, {
        editedReport
      });
      toast.success('Submitted to Doctor successfully!');
      setResult(null); // Reset
      setFile(null);
    } catch (err: any) {
      toast.error('Failed to submit to doctor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, height: '100%', overflowY: 'auto', bgcolor: 'background.default' }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <Toaster />
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>X-Ray Technician Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Upload and process radiology images</Typography>
        </Box>

        {!result ? (
          <Card component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} sx={{ p: 4, borderRadius: 3, boxShadow: 2 }}>
            <form onSubmit={handleUpload}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Patient</InputLabel>
                    <Select
                      value={patientId}
                      label="Patient"
                      onChange={(e) => setPatientId(e.target.value)}
                      required
                    >
                      {patients.length === 0 && <MenuItem value="" disabled>No patients found...</MenuItem>}
                      {patients.map(p => (
                        <MenuItem key={p._id} value={p._id}>
                          {p.name} (ID: {p._id.slice(-6)})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <FormControl fullWidth>
                    <InputLabel>Modality</InputLabel>
                    <Select
                      value={modality}
                      label="Modality"
                      onChange={(e) => setModality(e.target.value)}
                    >
                      <MenuItem value="X-Ray">X-Ray</MenuItem>
                      <MenuItem value="MRI">MRI</MenuItem>
                      <MenuItem value="Blood Report">Blood Report</MenuItem>
                      <MenuItem value="CT Scan">CT Scan</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>Study Type</InputLabel>
                    <Select
                      value={studyType}
                      label="Study Type"
                      onChange={(e) => setStudyType(e.target.value)}
                    >
                      <MenuItem value="Chest X-ray">Chest X-ray</MenuItem>
                      <MenuItem value="Knee X-ray">Knee X-ray</MenuItem>
                      <MenuItem value="Hand X-ray">Hand X-ray</MenuItem>
                      <MenuItem value="Pelvis X-ray">Pelvis X-ray</MenuItem>
                      <MenuItem value="Brain MRI">Brain MRI</MenuItem>
                      <MenuItem value="Complete Blood Count">Complete Blood Count</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth>
                    <InputLabel>View</InputLabel>
                    <Select
                      value={view}
                      label="View"
                      onChange={(e) => setView(e.target.value)}
                    >
                      <MenuItem value="PA">PA</MenuItem>
                      <MenuItem value="AP">AP</MenuItem>
                      <MenuItem value="Lateral">Lateral</MenuItem>
                    </Select>
                  </FormControl>
                </Box>

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
                  <UploadCloud className="w-12 h-12 mb-3 text-primary-main" />
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {file ? file.name : 'Click to upload X-ray Image'}
                  </Typography>
                  <Typography variant="caption" sx={{ mt: 1 }}>JPEG, PNG, DICOM (converted) up to 10MB</Typography>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    hidden 
                  />
                </Button>

                <Button 
                  type="submit" 
                  disabled={loading}
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <UploadCloud className="w-5 h-5" />}
                  sx={{ py: 1.5, borderRadius: 8, fontSize: '1rem', fontWeight: 600 }}
                >
                  {loading ? 'Analyzing with AI...' : 'Upload & Analyze'}
                </Button>
              </Box>
            </form>
          </Card>
        ) : (
          <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 4 }}>
            
            {/* AI Analysis Complete */}
            <Card sx={{ p: 4, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, color: 'success.main', fontWeight: 700 }}>
                <CheckCircle className="w-6 h-6" /> AI Analysis Complete
              </Typography>
              
              <Paper elevation={0} sx={{ p: 2, mb: 4, bgcolor: 'rgba(14, 165, 233, 0.08)', borderRadius: 2, border: '1px solid rgba(14, 165, 233, 0.2)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#0284c7' }}>AI Confidence Score</Typography>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0369a1' }}>
                    {(result.aiResult.confidence * 100).toFixed(0)}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={result.aiResult.confidence * 100} 
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(14, 165, 233, 0.2)', '& .MuiLinearProgress-bar': { bgcolor: '#0284c7' } }} 
                />
              </Paper>

              <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>Findings</Typography>
                  <List dense disablePadding>
                    {result.aiResult.findings.map((f: string, i: number) => (
                      <ListItem key={i} sx={{ px: 0, py: 0.5, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 20, mt: 0.5 }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-main" />
                        </ListItemIcon>
                        <ListItemText primary={f} slotProps={{ primary: { variant: 'body2', color: 'text.secondary' } }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>Impression</Typography>
                  <List dense disablePadding>
                    {result.aiResult.impression.map((imp: string, i: number) => (
                      <ListItem key={i} sx={{ px: 0, py: 0.5, alignItems: 'flex-start' }}>
                        <ListItemIcon sx={{ minWidth: 20, mt: 0.5 }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-main" />
                        </ListItemIcon>
                        <ListItemText primary={imp} slotProps={{ primary: { variant: 'body2', color: 'text.secondary' } }} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            </Card>

            {/* Draft Report */}
            <Card sx={{ p: 4, borderRadius: 3, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3, color: 'text.primary', fontWeight: 700 }}>
                <FileText className="w-6 h-6 text-primary-main" /> Draft Report
              </Typography>
              
              <TextField
                multiline
                fullWidth
                sx={{ flex: 1, minHeight: 250, '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start', overflowY: 'auto' } }}
                slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6, bgcolor: 'background.default' } } }}
                value={editedReport}
                onChange={(e) => setEditedReport(e.target.value)}
              />
              
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button 
                  onClick={() => setResult(null)}
                  variant="outlined"
                  color="inherit"
                  sx={{ flex: 1, py: 1.5, borderRadius: 8 }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmitToDoctor}
                  disabled={loading}
                  variant="contained"
                  color="success"
                  startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <Send className="w-5 h-5" />}
                  sx={{ flex: 1, py: 1.5, borderRadius: 8, fontWeight: 600 }}
                >
                  Submit to Doctor
                </Button>
              </Box>
            </Card>
          </Box>
        )}
      </Box>
    </Box>
  );
}

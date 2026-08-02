"use client";

import React, { useState, useEffect } from 'react';
import { CheckCircle, FileText, Search, RefreshCcw, Activity } from 'lucide-react';
import { api } from '../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import {
  Box,
  Typography,
  Card,
  List,
  ListItemButton,
  ListItemText,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Paper,
  Divider,
} from '@mui/material';

export default function XrayDoctorDashboard() {
  const [studies, setStudies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudy, setSelectedStudy] = useState<any>(null);
  const [finalReportText, setFinalReportText] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchStudies = async () => {
    try {
      setLoading(true);
      const res = await api.get('/xray/studies?status=tech_submitted');
      setStudies(res.data);
    } catch (err) {
      toast.error('Failed to fetch studies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, []);

  const handleSelectStudy = async (studyId: string) => {
    try {
      const res = await api.get(`/xray/studies/${studyId}`);
      setSelectedStudy(res.data);
      setFinalReportText(res.data.aiReport?.generatedReport || '');
      setImageUrl('');

      try {
        const imageRes = await api.get(`/xray/studies/${studyId}/image`, {
          responseType: 'blob'
        });
        const url = URL.createObjectURL(imageRes.data);
        setImageUrl(url);
      } catch (imgErr) {
        console.error('Failed to load image', imgErr);
        setImageUrl('');
      }
    } catch (err) {
      toast.error('Failed to fetch study details');
    }
  };

  const handleApprove = async () => {
    if (!selectedStudy) return;
    setActionLoading(true);
    try {
      await api.put(`/xray/studies/${selectedStudy.study._id}/doctor-approve`, {
        finalReportText
      });
      toast.success('Report Approved! PDF generated and SMS sent.');
      setSelectedStudy(null);
      fetchStudies();
    } catch (err) {
      toast.error('Failed to approve report');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <Toaster />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>X-Ray Doctor Review</Typography>
          <Typography variant="body2" color="text.secondary">Review technician-submitted reports</Typography>
        </Box>
        <Button
          onClick={fetchStudies}
          startIcon={<RefreshCcw className="w-4 h-4" />}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 8, textTransform: 'none' }}
        >
          Refresh
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flex: 1, minHeight: 0 }}>
        
        {/* Left Column: List of pending studies */}
        <Paper sx={{ width: 340, display: 'flex', flexDirection: 'column', borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', flexShrink: 0 }}>
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Pending Review ({studies.length})</Typography>
          </Box>
          
          <List sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : studies.length === 0 ? (
              <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
                <Typography variant="body2">No studies pending review.</Typography>
              </Box>
            ) : (
              studies.map(study => {
                const isSelected = selectedStudy?.study?._id === study._id;
                return (
                  <ListItemButton
                    key={study._id}
                    onClick={() => handleSelectStudy(study._id)}
                    sx={{
                      borderRadius: 2,
                      mb: 1,
                      border: '1px solid',
                      borderColor: isSelected ? 'primary.main' : 'divider',
                      bgcolor: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'transparent',
                      '&:hover': { bgcolor: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255,255,255,0.05)' },
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 0.5,
                      p: 2,
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isSelected ? 'primary.main' : 'text.primary' }}>
                        {study.patientId?.name || 'Unknown Patient'}
                      </Typography>
                      <Chip label="Review" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }} />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {study.modality || 'X-Ray'} - {study.studyType}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {new Date(study.createdAt).toLocaleDateString()}
                    </Typography>
                  </ListItemButton>
                );
              })
            )}
          </List>
        </Paper>

        {/* Right Column: Review Details */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <AnimatePresence mode="wait">
            {selectedStudy ? (
              <Box component={motion.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Card sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 0, overflow: 'hidden' }}>
                  
                  <Box sx={{ p: 3, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'rgba(255,255,255,0.02)' }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        {selectedStudy.study.patientId?.name} - {selectedStudy.study.modality || 'X-Ray'} ({selectedStudy.study.studyType})
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Tech: {selectedStudy.study.technicianId?.firstName} {selectedStudy.study.technicianId?.lastName}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>AI Confidence</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: selectedStudy.aiReport?.confidence > 0.7 ? 'success.main' : 'warning.main' }}>
                        {(selectedStudy.aiReport?.confidence * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, minHeight: 0 }}>
                    <Box sx={{ width: { xs: '100%', md: '45%' }, p: 3, display: 'flex', flexDirection: 'column', borderRight: { md: '1px solid' }, borderColor: { md: 'divider' }, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                        <Activity className="w-4 h-4" /> Diagnostic Scan
                      </Typography>
                      <Box sx={{ flex: 1, bgcolor: '#000', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                        {imageUrl ? (
                          <img src={imageUrl} alt="Patient Diagnostic Scan" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        ) : (
                          <Typography variant="body2" color="text.secondary">Loading image...</Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ width: { xs: '100%', md: '55%' }, p: 3, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                      <Typography variant="subtitle2" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', flexShrink: 0 }}>
                        <FileText className="w-4 h-4" /> Report Editor
                      </Typography>
                      <TextField
                        multiline
                        fullWidth
                        sx={{ 
                          flex: 1, 
                          minHeight: 0,
                          '& .MuiInputBase-root': { height: '100%', alignItems: 'flex-start', overflowY: 'auto' } 
                        }}
                        slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.6 } } }}
                        value={finalReportText}
                        onChange={(e) => setFinalReportText(e.target.value)}
                      />
                    </Box>
                  </Box>

                  <Box sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'background.paper' }}>
                    <Button onClick={() => setSelectedStudy(null)} variant="outlined" color="inherit" sx={{ borderRadius: 8 }}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleApprove}
                      disabled={actionLoading}
                      variant="contained"
                      color="success"
                      startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <CheckCircle className="w-4 h-4" />}
                      sx={{ borderRadius: 8, px: 4 }}
                    >
                      Approve & Generate PDF
                    </Button>
                  </Box>
                </Card>
              </Box>
            ) : (
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4, textAlign: 'center', boxShadow: 'none' }}>
                <Search className="w-16 h-16 mb-4 text-primary-dark opacity-50" />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1, color: 'text.secondary' }}>Select a study</Typography>
                <Typography variant="body2" color="text.disabled">Choose a study from the list to review the AI analysis and generate a report.</Typography>
              </Card>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </Box>
  );
}

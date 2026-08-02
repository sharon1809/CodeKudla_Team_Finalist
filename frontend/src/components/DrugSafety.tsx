'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
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
  Alert,
  AlertTitle,
} from '@mui/material';
import { ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const DrugSafety = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [drugName, setDrugName] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    api.get('/patients')
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) setPatients(data);
        else if (data.patients) setPatients(data.patients);
      })
      .catch(err => console.error('Error fetching patients:', err));
  }, []);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !drugName) {
      setError('Please select a patient and enter a drug name.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.post('/safety/check', {
        patientId: selectedPatientId,
        drugName,
        includeReport: true
      });

      setResult(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to check safety');
    } finally {
      setLoading(false);
    }
  };

  const getStatusProps = (status: string) => {
    if (status === 'SAFE') return { color: 'success' as const, icon: <CheckCircle className="w-8 h-8" /> };
    if (status === 'WARNING') return { color: 'warning' as const, icon: <AlertTriangle className="w-8 h-8" /> };
    if (status === 'BLOCKED') return { color: 'error' as const, icon: <ShieldAlert className="w-8 h-8" /> };
    return { color: 'info' as const, icon: <Info className="w-8 h-8" /> };
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.default', overflowY: 'auto', p: 4, pt: 8 }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 6 }}>
        
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, background: 'linear-gradient(to right, #10B981, #14B8A6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Drug Safety Copilot
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
            Instantly evaluate polypharmacy interactions, FDA warnings, and patient allergies using real-time clinical reasoning.
          </Typography>
        </Box>

        {/* Input Form */}
        <Card sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 4 }}>
          <form onSubmit={handleCheck}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, alignItems: 'flex-start' }}>
              <FormControl fullWidth sx={{ flex: 1 }}>
                <InputLabel id="patient-select-label">Patient Profile</InputLabel>
                <Select
                  labelId="patient-select-label"
                  id="patient-select"
                  value={selectedPatientId}
                  label="Patient Profile"
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                >
                  <MenuItem value="" disabled>Select a patient...</MenuItem>
                  {patients.map(p => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.name} ({p.age}y {p.gender})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                sx={{ flex: 1 }}
                label="Proposed Medication"
                placeholder="e.g. Ibuprofen, Warfarin"
                value={drugName}
                onChange={(e) => setDrugName(e.target.value)}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{
                  py: 1.8,
                  px: 4,
                  minWidth: { xs: '100%', md: 'auto' },
                  borderRadius: 2,
                  bgcolor: 'primary.main',
                  '&:hover': { bgcolor: 'primary.dark' },
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Run Safety Check'}
              </Button>
            </Box>
          </form>

          <AnimatePresence>
            {error && (
              <Box component={motion.div} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} sx={{ mt: 3 }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
              </Box>
            )}
          </AnimatePresence>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {result && (
            <Box component={motion.div} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 2fr' }, gap: 4, pb: 8 }}>
              
              {/* Left Column: Summary */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(() => {
                  const props = getStatusProps(result.safetyCheck.status);
                  return (
                    <Alert
                      icon={props.icon}
                      severity={props.color}
                      sx={{ p: 3, borderRadius: 4, '& .MuiAlert-message': { width: '100%' } }}
                    >
                      <AlertTitle sx={{ fontWeight: 800, fontSize: '1.25rem', mb: 1 }}>{result.safetyCheck.status}</AlertTitle>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>{result.safetyCheck.message}</Typography>
                    </Alert>
                  );
                })()}

                {result.safetyCheck.allergyCheck && (
                  <Alert severity="error" icon={<AlertTriangle />} sx={{ p: 3, borderRadius: 4 }}>
                    <AlertTitle sx={{ fontWeight: 700 }}>Allergy Alert</AlertTitle>
                    {result.safetyCheck.allergyCheck}
                  </Alert>
                )}

                <Card sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>AI Recommendations</Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {result.safetyCheck.recommendations?.map((rec: string, i: number) => (
                      <Typography component="li" variant="body2" key={i} sx={{ color: 'text.secondary' }}>
                        {rec}
                      </Typography>
                    ))}
                  </Box>
                </Card>
              </Box>

              {/* Right Column: Detailed Report */}
              <Card sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, display: 'flex', alignItems: 'center', gap: 1.5, color: 'primary.main' }}>
                  <ShieldAlert className="w-5 h-5" /> Comprehensive Clinical Report
                </Typography>
                
                <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.02)', p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                  {result.report ? (
                    <Typography variant="body2" sx={{ lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: result.report.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                      No detailed report generated.
                    </Typography>
                  )}
                </Box>
              </Card>

            </Box>
          )}
        </AnimatePresence>

      </Box>
    </Box>
  );
};

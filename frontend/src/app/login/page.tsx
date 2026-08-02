'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      // AuthContext should handle redirection, but if not we can route to /dashboard
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', bgcolor: 'background.default', overflow: 'hidden' }}>
      
      {/* Ambient soft background blur */}
      <Box sx={{ position: 'absolute', top: '10%', left: '15%', width: 500, height: 500, bgcolor: 'primary.main', opacity: 0.1, borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '10%', right: '15%', width: 400, height: 400, bgcolor: 'secondary.main', opacity: 0.08, borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <Box sx={{ width: '100%', maxWidth: 420, p: 3, position: 'relative', zIndex: 10 }}>
        
        {/* Logo Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box component={Link} href="/" sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 2, textDecoration: 'none' }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)' }}>
              <Stethoscope className="w-8 h-8 text-white" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
              MedSynexa <Box component="span" sx={{ color: 'primary.main' }}>AI</Box>
            </Typography>
          </Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 2 }}>Clinical Sign In</Typography>
          <Typography variant="caption" color="text.secondary">Access your patient decision-support workspace</Typography>
        </Box>

        {/* Card */}
        <Card sx={{ p: 4, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              
              <TextField
                label="Medical Email"
                type="email"
                placeholder="dr.sharma@hospital.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Mail className="w-5 h-5 text-gray-400" />
                      </InputAdornment>
                    ),
                  }
                }}
              />

              <TextField
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock className="w-5 h-5 text-gray-400" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                          {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                endIcon={isSubmitting ? undefined : <ArrowRight className="w-4 h-4" />}
                sx={{
                  py: 1.5,
                  mt: 1,
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'none',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                }}
              >
                {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In to Copilot'}
              </Button>
            </Box>
          </form>

          {/* Security details */}
          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.disabled' }}>
            <ShieldCheck className="w-4 h-4 text-primary-main" />
            <Typography variant="caption" sx={{ fontWeight: 500 }}>HIPAA-compliant data isolation • Encrypted transit</Typography>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              First time using MedSynexa?{' '}
              <Link href="/register" style={{ color: '#10B981', fontWeight: 600, textDecoration: 'none' }}>
                Create an Account
              </Link>
            </Typography>
          </Box>
        </Card>

        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Link href="/" style={{ color: '#94A3B8', fontSize: '0.875rem', textDecoration: 'none' }}>
            ← Back to Home
          </Link>
        </Box>

      </Box>
    </Box>
  );
}

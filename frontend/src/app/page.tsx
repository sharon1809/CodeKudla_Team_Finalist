'use client';

import React from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  ArrowRight,
  Activity,
  ShieldCheck,
  Zap,
  FileSearch,
  Pill,
  Heart,
  Brain,
  Microscope,
  ClipboardList,
  Users,
  Globe,
} from 'lucide-react';
import {
  Box,
  Typography,
  Button,
  Container,
  Card,
  Grid,
  Chip,
  AppBar,
  Toolbar,
  useTheme,
} from '@mui/material';

const FEATURES = [
  {
    icon: Activity,
    color: '#0ea5e9',
    bgcolor: 'rgba(14, 165, 233, 0.1)',
    title: 'Differential Diagnosis',
    desc: 'Ranked likelihood list with ICD-10 codes parsed from raw clinical notes — in under 3 seconds.',
  },
  {
    icon: Pill,
    color: '#8b5cf6',
    bgcolor: 'rgba(139, 92, 246, 0.1)',
    title: 'Indian Brand & Generic Rx',
    desc: 'Generics + Indian brand names (Crocin, Augmentin, Azithral) with local dosages and routes.',
  },
  {
    icon: ShieldCheck,
    color: '#f59e0b',
    bgcolor: 'rgba(245, 158, 11, 0.1)',
    title: 'Safety & Drug Checker',
    desc: 'Real-time alerts for drug interactions, allergies, renal & hepatic dose adjustments.',
  },
  {
    icon: FileSearch,
    color: '#10b981',
    bgcolor: 'rgba(16, 185, 129, 0.1)',
    title: 'OCR Lab Report RAG',
    desc: 'Upload scanned lab PDFs → intelligent OCR + pgvector semantic insights instantly.',
  },
];

const WORKFLOW = [
  { step: '01', title: 'Micro-Note Input', desc: 'Quickly type 2-3 lines of symptoms, vitals, and age.', icon: ClipboardList },
  { step: '02', title: 'NLP + RAG Retrieval', desc: 'LangChain parses entities & retrieves ICMR/NHP guidelines from pgvector.', icon: Brain },
  { step: '03', title: 'Clinical Reasoning', desc: 'Gemini outputs ranked differentials, treatments, Indian formulations.', icon: Microscope },
  { step: '04', title: 'Safe Prescription', desc: 'Safety flags verify contraindications before you finalize the plan.', icon: ShieldCheck },
];

const STATS = [
  { value: '< 3s', label: 'Avg. OPD Latency', sub: 'real-time reasoning' },
  { value: 'ICMR', label: 'NHP Aligned', sub: 'localized guidelines' },
  { value: 'pgvector', label: 'Hybrid RAG', sub: 'semantic + keyword' },
  { value: '100%', label: 'HIPAA-grade', sub: 'data isolation' },
];

export default function LandingPage() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative', overflowX: 'hidden' }}>
      
      {/* Ambient backgrounds */}
      <Box sx={{ position: 'absolute', top: -200, left: -100, width: 700, height: 700, bgcolor: 'primary.main', opacity: 0.05, borderRadius: '50%', filter: 'blur(140px)', pointerEvents: 'none', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: -200, right: -100, width: 600, height: 600, bgcolor: 'secondary.main', opacity: 0.05, borderRadius: '50%', filter: 'blur(120px)', pointerEvents: 'none', zIndex: 0 }} />

      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'rgba(248,250,253,0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid', borderColor: 'divider', zIndex: 50 }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: '72px !important' }}>
            
            {/* Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                <Stethoscope className="w-5 h-5 text-white" />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', letterSpacing: '-0.02em' }}>
                MedSynexa <Chip label="AI" size="small" sx={{ ml: 1, bgcolor: 'primary.light', color: 'primary.dark', fontWeight: 800, fontSize: '0.7rem', height: 20 }} />
              </Typography>
            </Box>

            {/* Nav links (hidden on mobile) */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 4 }}>
              <Typography component="a" href="#features" variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>Features</Typography>
              <Typography component="a" href="#workflow" variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>Workflow</Typography>
              <Typography component="a" href="#about" variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>About</Typography>
            </Box>

            {/* CTA */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button component={Link} href="/login" variant="text" sx={{ display: { xs: 'none', sm: 'inline-flex' }, fontWeight: 600, color: 'text.secondary', '&:hover': { color: 'text.primary', bgcolor: 'transparent' } }}>
                Sign In
              </Button>
              <Button component={Link} href="/register" variant="contained" endIcon={<ArrowRight className="w-4 h-4" />} sx={{ borderRadius: 8, fontWeight: 700, px: 3 }}>
                Get Started
              </Button>
            </Box>

          </Toolbar>
        </Container>
      </AppBar>

      <Box sx={{ position: 'relative', zIndex: 10 }}>
        
        {/* Hero Section */}
        <Container maxWidth="lg" sx={{ pt: { xs: 8, md: 12 }, pb: { xs: 8, md: 12 } }}>
          <Grid container spacing={8} sx={{ alignItems: 'center' }}>
            
            {/* Left Copy */}
            <Grid size={{ xs: 12, lg: 7 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Chip
                  icon={<Zap className="w-4 h-4" style={{ color: theme.palette.warning.main }} />}
                  label="Sub-10-Second Real-Time Clinical AI — Built for Indian OPDs"
                  sx={{ alignSelf: 'flex-start', bgcolor: 'rgba(245, 158, 11, 0.1)', color: 'warning.main', fontWeight: 700, borderRadius: 2, px: 1 }}
                />
                
                <Box>
                  <Typography variant="h2" sx={{ fontWeight: 900, color: 'text.primary', letterSpacing: '-0.02em', lineHeight: 1.1, mb: 3, fontSize: { xs: '3rem', md: '4rem' } }}>
                    Clinical Intelligence<br />
                    <Box component="span" sx={{ background: 'linear-gradient(to right, #10B981, #14B8A6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      At the Speed of Care.
                    </Box>
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem', maxWidth: 600, lineHeight: 1.7 }}>
                    Indian doctors spend under 2 minutes per OPD patient. MedSynexa delivers instant differential diagnoses, ICMR-aligned treatments, Indian generic dosages, and real-time safety guardrails — all grounded in your medical library.
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button component={Link} href="/register" variant="contained" size="large" endIcon={<ArrowRight className="w-4 h-4" />} sx={{ borderRadius: 8, fontWeight: 700, px: 4, py: 1.5, boxShadow: '0 8px 20px rgba(16,185,129,0.3)' }}>
                    Launch Free Copilot
                  </Button>
                  <Button component={Link} href="/login" variant="outlined" size="large" sx={{ borderRadius: 8, fontWeight: 700, px: 4, py: 1.5, borderColor: 'divider', color: 'text.primary', '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(16,185,129,0.05)' } }}>
                    Sign In to Dashboard
                  </Button>
                </Box>

                {/* Stats Row */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, pt: 4, mt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  {STATS.map(s => (
                    <Box key={s.value}>
                      <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main' }}>{s.value}</Typography>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', mt: 0.5 }}>{s.label}</Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>{s.sub}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>

            {/* Right Feature Cards */}
            <Grid size={{ xs: 12, lg: 5 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                {FEATURES.map((f, i) => (
                  <Card key={f.title} sx={{ p: 3, borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 2, mt: i % 2 === 1 ? 4 : 0, transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-5px)', borderColor: 'primary.main' } }}>
                    <Box sx={{ w: 48, h: 48, borderRadius: 3, bgcolor: f.bgcolor, color: f.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, width: 48 }}>
                      <f.icon className="w-6 h-6" />
                    </Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{f.desc}</Typography>
                  </Card>
                ))}
              </Box>
            </Grid>

          </Grid>
        </Container>

        {/* Workflow Section */}
        <Box id="workflow" sx={{ bgcolor: 'rgba(255,255,255,0.02)', py: { xs: 8, md: 12 }, borderTop: '1px solid', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Container maxWidth="lg">
            
            <Box sx={{ textAlign: 'center', mb: 8 }}>
              <Chip label="Clinical Workflow" size="small" color="primary" sx={{ mb: 2, fontWeight: 700 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>From Notes to Plan in Seconds</Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto' }}>
                A 4-step pipeline that turns messy OPD notes into structured, evidence-based clinical decisions.
              </Typography>
            </Box>

            <Card sx={{ p: { xs: 4, md: 6 }, borderRadius: 6, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 3 }}>
              <Grid container spacing={4}>
                {WORKFLOW.map((w, i) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={w.step}>
                    <Box sx={{ position: 'relative', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {i < WORKFLOW.length - 1 && (
                        <Box sx={{ display: { xs: 'none', md: 'block' }, position: 'absolute', top: 28, left: '60%', width: '100%', height: '2px', background: 'linear-gradient(90deg, rgba(16,185,129,0.3) 0%, transparent 100%)', zIndex: 0 }} />
                      )}
                      
                      <Box sx={{ position: 'relative', zIndex: 10, width: 56, height: 56, borderRadius: 4, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2, boxShadow: '0 8px 24px rgba(16,185,129,0.4)' }}>
                        <w.icon className="w-6 h-6 text-white" />
                      </Box>
                      
                      <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', letterSpacing: '0.1em', mb: 1 }}>{w.step}</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>{w.title}</Typography>
                      <Typography variant="body2" color="text.secondary">{w.desc}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>

          </Container>
        </Box>

        {/* Trust Section */}
        <Container id="about" maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Grid container spacing={4}>
            {[
              { icon: ShieldCheck, color: '#0ea5e9', bgcolor: 'rgba(14, 165, 233, 0.1)', title: 'Data Isolated per Doctor', desc: 'Your uploaded textbooks and patient data are namespaced entirely to your account. No cross-contamination between users.' },
              { icon: Globe, color: '#8b5cf6', bgcolor: 'rgba(139, 92, 246, 0.1)', title: 'ICMR & NHP Aligned', desc: 'Clinical outputs reflect Indian National Health Programme guidelines, ensuring region-specific accuracy.' },
              { icon: Users, color: '#10b981', bgcolor: 'rgba(16, 185, 129, 0.1)', title: 'Built for Indian OPDs', desc: 'Designed for 80+ patient/day workloads — not Western EHR complexity. Fast, simple, and local.' },
            ].map(t => (
              <Grid size={{ xs: 12, md: 4 }} key={t.title}>
                <Card sx={{ p: 4, height: '100%', borderRadius: 4, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: 1, '&:hover': { borderColor: 'text.secondary' } }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 3, bgcolor: t.bgcolor, color: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                    <t.icon className="w-6 h-6" />
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>{t.title}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>{t.desc}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* CTA Banner */}
        <Container maxWidth="lg" sx={{ pb: { xs: 8, md: 12 } }}>
          <Box sx={{ position: 'relative', borderRadius: 6, overflow: 'hidden', bgcolor: 'primary.main', p: { xs: 6, md: 10 }, textAlign: 'center', boxShadow: '0 24px 48px rgba(16,185,129,0.2)' }}>
            
            <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)', pointerEvents: 'none' }} />
            
            <Box sx={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Box sx={{ width: 64, height: 64, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart className="w-8 h-8 text-white" />
              </Box>
              
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, color: 'white', mb: 2, letterSpacing: '-0.02em' }}>
                  Start Diagnosing Smarter Today
                </Typography>
                <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 500, mx: 'auto' }}>
                  Join MedSynexa — the AI copilot that works as fast as you think.
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button component={Link} href="/register" variant="contained" size="large" sx={{ bgcolor: 'white', color: 'primary.dark', borderRadius: 8, fontWeight: 800, px: 4, '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' } }}>
                  Create Free Account
                </Button>
                <Button component={Link} href="/login" variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white', borderRadius: 8, fontWeight: 700, px: 4, '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  Sign In
                </Button>
              </Box>
            </Box>

          </Box>
        </Container>

        {/* Footer */}
        <Box sx={{ borderTop: '1px solid', borderColor: 'divider', py: 4, bgcolor: 'background.paper' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', gap: 2 }}>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: 1.5, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope className="w-4 h-4 text-white" />
                </Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>MedSynexa AI</Typography>
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                © {new Date().getFullYear()} MedSynexa. Built for Indian Healthcare. Powered by LangChain, Gemini & pgvector.
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 3 }}>
                <Typography component={Link} href="/login" variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>Sign In</Typography>
                <Typography component={Link} href="/register" variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'text.primary' } }}>Register</Typography>
              </Box>

            </Box>
          </Container>
        </Box>

      </Box>
    </Box>
  );
}

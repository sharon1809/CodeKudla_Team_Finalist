'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Lock, Mail, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6 relative">
      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/4 w-[500px] h-[500px] bg-teal-600/6 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-3 mb-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-xl shadow-teal-500/25 border border-teal-400/20 glow-teal">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              MedSynexa <span className="gradient-text">AI</span>
            </span>
          </Link>
          <h1 className="text-lg font-bold text-white mt-3">Doctor Sign In</h1>
          <p className="text-sm text-[#8fa3bb] mt-1">Access your clinical AI workspace</p>
        </div>

        {/* Card */}
        <div className="glass-elevated p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block section-label mb-2">Medical Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4a637a]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10 pr-4 py-3"
                  placeholder="dr.sharma@hospital.in"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block section-label mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#4a637a]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10 pr-10 py-3"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#4a637a] hover:text-[#8fa3bb] transition-colors"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full spin" />
              ) : (
                <>
                  Sign In to Copilot
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Trust line */}
          <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-[#4a637a]">
            <ShieldCheck className="h-3 w-3 text-teal-600" />
            <span>HIPAA-grade isolation · Data encrypted at rest</span>
          </div>

          <div className="mt-4 text-center text-xs text-[#8fa3bb]">
            No account yet?{' '}
            <Link href="/register" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
              Register as a Doctor
            </Link>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-xs text-[#4a637a] hover:text-[#8fa3bb] transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

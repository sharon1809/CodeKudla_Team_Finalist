'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { Stethoscope, Lock, Mail, User, ArrowRight, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email, password, firstName, lastName);
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-6 relative">
      <div className="fixed top-1/4 right-1/4 w-[500px] h-[500px] bg-teal-600/6 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 fade-in-up">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-xl shadow-teal-500/25 border border-teal-400/20 glow-teal">
              <Stethoscope className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-white">
              MedSynexa <span className="gradient-text">AI</span>
            </span>
          </Link>
          <h1 className="text-lg font-bold text-white mt-4">Create Doctor Account</h1>
          <p className="text-sm text-[#8fa3bb] mt-1">Join for instant Indian OPD decision support</p>
        </div>

        <div className="glass-elevated p-8 rounded-3xl">
          {error && (
            <div className="mb-6 p-3.5 rounded-xl bg-red-950/40 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block section-label mb-2">First Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#4a637a]">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-field pl-9 pr-3 py-2.5"
                    placeholder="Rajesh"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block section-label mb-2">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field px-3 py-2.5"
                  placeholder="Sharma"
                  required
                />
              </div>
            </div>

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
                  placeholder="Min. 8 characters"
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
              id="register-submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-3.5 text-sm flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full spin" />
              ) : (
                <>
                  Create Doctor Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-white/5 flex items-center justify-center gap-1.5 text-[10px] text-[#4a637a]">
            <ShieldCheck className="h-3 w-3 text-teal-600" />
            <span>HIPAA-grade isolation · Data encrypted at rest</span>
          </div>

          <div className="mt-4 text-center text-xs text-[#8fa3bb]">
            Already registered?{' '}
            <Link href="/login" className="text-teal-400 hover:text-teal-300 font-semibold transition-colors">
              Sign In
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

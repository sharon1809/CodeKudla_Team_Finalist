"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Stethoscope,
  Activity,
  Zap,
  Pill,
  FileSearch,
  Users,
  BookOpen,
  LogOut,
  User,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { name: 'OPD Copilot', href: '/opd', icon: Stethoscope },
  { name: 'X-Ray Radiology', href: '/xray', icon: Zap },
  { name: 'Drug Safety', href: '/drug-safety', icon: Pill },
  { name: 'Lab PDFs & Reports', href: '/documents', icon: FileSearch },
  { name: 'Patient Directory', href: '/patients', icon: Users },
  { name: 'Medical RAG Library', href: '/library', icon: BookOpen },
];

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-xl shadow-xs transition-all">
      {/* Top Gradient Border Line */}
      <div className="h-0.5 w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800 text-white flex items-center justify-center shadow-md shadow-teal-700/25 border border-teal-500/40 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              MedSynexa
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200/80 shadow-2xs">
                CLINICAL AI
              </span>
            </span>
          </div>
        </Link>

        {/* Primary Route Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/80">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                  isActive
                    ? 'bg-white text-teal-800 border border-teal-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: User & Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800">
                <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center text-[10px] font-extrabold">
                  {user?.firstName?.[0] || 'D'}
                </div>
                <span className="hidden sm:inline">
                  {user?.firstName ? `Dr. ${user.firstName}` : 'Dr. Practitioner'}
                </span>
              </div>

              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200 shadow-2xs"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-teal text-xs py-2 px-4 shadow-sm">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Sub-Header Navigation */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50/80">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                isActive
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
};

export default Navbar;

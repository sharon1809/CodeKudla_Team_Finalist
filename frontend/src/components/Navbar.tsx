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
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-md shadow-teal-700/20">
            <Activity className="w-5 h-5 text-teal-200" />
          </div>
          <div>
            <span className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
              MedSynexa
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-teal-100 text-teal-800 border border-teal-200">
                Clinical AI
              </span>
            </span>
          </div>
        </Link>

        {/* Primary Route Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-pill ${isActive ? 'active' : ''}`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-teal-700' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: User & Auth */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-700 hidden sm:inline">
                {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Dr. Practitioner'}
              </span>
              <button
                onClick={logout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-slate-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link href="/login" className="btn-teal text-xs py-1.5 px-3">
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Sub-Header Navigation */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-slate-100 bg-slate-50/50">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isActive
                  ? 'bg-teal-700 text-white font-semibold'
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

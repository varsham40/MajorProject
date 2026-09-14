import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
  LayoutDashboard, Activity, FileText, FolderOpen, Key, User,
  Users, UserPlus, Stethoscope, Share2, ShieldCheck, History,
  Building2, Cpu, Database, Award, BarChart3, Lock, Calendar
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const role = user?.role || 'PATIENT';

  const patientNav = [
    { name: 'Dashboard', path: '/patient/dashboard', icon: LayoutDashboard },
    { name: 'Appointments', path: '/patient/appointments', icon: Calendar },
    { name: 'My Health', path: '/patient/health', icon: Activity },
    { name: 'My Records', path: '/patient/records', icon: FileText },
    { name: 'Medical Reports', path: '/patient/reports', icon: FolderOpen },
    { name: 'Access & Sharing', path: '/patient/access-sharing', icon: Key },
    { name: 'Profile', path: '/patient/profile', icon: User },
  ];

  const doctorNav = [
    { name: 'Overview', path: '/doctor/overview', icon: LayoutDashboard },
    { name: 'Appointments', path: '/doctor/appointments', icon: Calendar },
    { name: 'Patients', path: '/doctor/patients', icon: Users },
    { name: 'New Analysis', path: '/doctor/new-analysis', icon: Stethoscope },
    { name: 'Redeem Patient Token', path: '/doctor/token-redeemer', icon: Key },
    { name: 'Records', path: '/doctor/records', icon: FileText },
    { name: 'Profile', path: '/doctor/profile', icon: User },
  ];

  const hospitalNav = [
    { name: 'Dashboard', path: '/hospital/dashboard', icon: LayoutDashboard },
    { name: 'Records Management', path: '/hospital/records-management', icon: FolderOpen },
    { name: 'Doctor Management', path: '/hospital/doctors', icon: Users },
    { name: 'Organization Profile', path: '/hospital/profile', icon: Building2 },
  ];

  const adminNav = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'User Management', path: '/admin/users', icon: Users },
    { name: 'AI Model Registry', path: '/admin/model-registry', icon: Cpu },
    { name: 'Model Training', path: '/admin/model-training', icon: Database },
    { name: 'Model Analysis', path: '/admin/model-analysis', icon: BarChart3 },
    { name: 'Blockchain Ledger', path: '/admin/blockchain', icon: Lock },
    { name: 'Verification Logs', path: '/admin/verification-logs', icon: History },
  ];

  let navItems = patientNav;
  if (role === 'DOCTOR') navItems = doctorNav;
  if (role === 'HOSPITAL') navItems = hospitalNav;
  if (role === 'ADMIN') navItems = adminNav;

  return (
    <aside className="w-64 bg-dark-800/80 backdrop-blur-md border-r border-slate-800 flex flex-col min-h-screen">
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-dark-900 font-bold shadow-lg shadow-cyan-500/20">
          AI
        </div>
        <div>
          <h1 className="font-bold text-lg text-white leading-tight">HealthSecure</h1>
          <p className="text-xs text-cyan-400 font-medium">Explainable AI & Chain</p>
        </div>
      </div>

      <div className="px-4 py-3 bg-dark-900/50 mx-4 my-4 rounded-lg border border-slate-800/60 flex items-center justify-between">
        <span className="text-xs text-slate-400">Current Role:</span>
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
          role === 'ADMIN' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
          role === 'DOCTOR' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
          role === 'HOSPITAL' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
          'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
        }`}>
          {role}
        </span>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-emerald-500/10 text-cyan-400 border border-cyan-500/30 shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/80 text-xs text-slate-500 text-center">
        Predict → Explain → Record → Secure → Share → Verify
      </div>
    </aside>
  );
};

import { HealthSyncLogo } from './HealthSyncLogo';
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
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col min-h-screen">
                  <div className="p-4 flex items-center gap-3.5 border-b border-slate-100 dark:border-slate-800">
        <HealthSyncLogo containerClass="w-13 h-13 min-w-[3.25rem] h-13 rounded-2xl bg-[#c5f5e8] flex items-center justify-center shadow-md p-1.5 border border-emerald-300/50 shrink-0" iconSize="w-10 h-10" />
        <div className="flex flex-col">
          <h1 className="font-extrabold text-2xl text-slate-900 dark:text-white leading-none tracking-tight">HealthSync</h1>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold leading-snug mt-1">
            Smarter Checkups.<br />Healthier tomorrows
          </p>
        </div>
      </div>

      <div className="px-4 py-2.5 bg-slate-50 mx-4 my-3 rounded-xl border border-slate-200/60 flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">Current Role:</span>
        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-extrabold uppercase ${
          role === 'ADMIN' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
          role === 'DOCTOR' ? 'bg-sky-50 text-sky-600 border border-sky-200' :
          role === 'HOSPITAL' ? 'bg-purple-50 text-purple-600 border border-purple-200' :
          'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-900 font-bold shadow-md shadow-emerald-200'
                    : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      

      
          <div className="p-4 border-t border-slate-100 dark-border-subtle text-[11px] text-slate-500 flex items-center gap-2 mt-auto">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="font-semibold text-slate-400">Node Sync: Block #198242</span>
      </div>
    </aside>
  );
};

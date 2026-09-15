import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Users, Stethoscope, FileText, Share2, ArrowRight, Activity, Calendar, Inbox } from 'lucide-react';

export const DoctorOverview: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/doctors/overview')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-emerald-600 text-center font-semibold">Loading Doctor Overview...</div>;

  const kpis = data?.kpis || {};
  const diseaseChart = data?.disease_chart || [];

  const COLORS = ['#10b981', '#0284c7', '#f43f5e', '#a855f7', '#f59e0b'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Doctor Operational Overview</h1>
          <p className="text-xs text-slate-500 font-medium">Clinical predictions, disease distribution, and patient records</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/new-analysis')}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-800 font-extrabold text-xs shadow-md shadow-emerald-200 flex items-center gap-1.5 transition-all"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Start New Analysis</span>
          </button>
        </div>
      </div>

      {/* 4 Doctor-Specific Relevant Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-100">My Patients</span>
            <p className="text-3xl font-extrabold text-white">{kpis.total_patients || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Assigned Patients</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-100">Analyses Performed</span>
            <p className="text-3xl font-extrabold text-white">{kpis.total_analyses || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">AI Diagnostics</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-sky-100">Medical Reports</span>
            <p className="text-3xl font-extrabold text-white">{kpis.records_created || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Reports Created</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-purple-100">Shared Access Records</span>
            <p className="text-3xl font-extrabold text-white">{kpis.records_received || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Shares Received</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <Share2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Disease Distribution Chart */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <BarChart3Icon className="w-4 h-4 text-emerald-600" />
          <span>Disease-Wise Prediction Distribution (Treatments / Analyses Performed)</span>
        </h2>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={diseaseChart}>
              <XAxis dataKey="disease" stroke="#64748b" tick={{ fontSize: 12 }} />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#1e293b', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {diseaseChart.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const BarChart3Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

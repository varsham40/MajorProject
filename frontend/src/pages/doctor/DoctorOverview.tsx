import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Users, Stethoscope, FileText, Share2, ArrowRight, Activity } from 'lucide-react';

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

  if (loading) return <div className="p-8 text-cyan-400 text-center font-semibold">Loading Doctor Overview...</div>;

  const kpis = data?.kpis || {};
  const diseaseChart = data?.disease_chart || [];

  const COLORS = ['#22d3ee', '#10b981', '#f43f5e', '#a855f7', '#fbbf24'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Doctor Operational Overview</h1>
          <p className="text-xs text-slate-400">Clinical predictions, disease distribution, and patient records</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/doctor/new-analysis')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-1.5"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Start New Analysis</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-400">Total Patients</span>
          <p className="text-2xl font-extrabold text-white">{kpis.total_patients || 0}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-400">Total Analyses</span>
          <p className="text-2xl font-extrabold text-cyan-400">{kpis.total_analyses || 0}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-400">Records Created</span>
          <p className="text-2xl font-extrabold text-emerald-400">{kpis.records_created || 0}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-400">Records Received</span>
          <p className="text-2xl font-extrabold text-purple-400">{kpis.records_received || 0}</p>
        </div>
      </div>

      {/* Disease Distribution Chart */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <BarChart3Icon className="w-4 h-4 text-cyan-400" />
          <span>Disease-Wise Prediction Distribution (Treatments / Analyses Performed)</span>
        </h2>

        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={diseaseChart}>
              <XAxis dataKey="disease" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
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

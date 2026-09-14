import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Activity, FileText, FolderOpen, Key, Share2, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/patients/me/dashboard')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="p-8 text-cyan-400 font-semibold text-center">Loading Patient Dashboard...</div>;
  }

  const kpis = data?.kpis || {};
  const checkups = data?.recent_checkups || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Patient Healthcare Overview</h1>
          <p className="text-xs text-slate-400">Track checkups, doctor diagnoses, and active sharing consents</p>
        </div>
        <button
          onClick={() => navigate('/patient/access-sharing')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <Key className="w-4 h-4" />
          <span>Generate Share Token</span>
        </button>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-cyan-400">
            <span className="text-xs font-medium text-slate-400">Total Checkups</span>
            <Activity className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{kpis.total_checkups || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-medium text-slate-400">Total Records</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{kpis.total_records || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-medium text-slate-400">Uploaded Reports</span>
            <FolderOpen className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{kpis.uploaded_reports || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-medium text-slate-400">Shared Records</span>
            <Share2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{kpis.shared_records || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-medium text-slate-400">Active Tokens</span>
            <Key className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-white">{kpis.active_tokens || 0}</p>
        </div>
      </div>

      {/* Recent Checkups */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Recent Medical Checkups & AI Predictions</span>
          </h2>
          <button
            onClick={() => navigate('/patient/records')}
            className="text-xs text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {checkups.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No checkups recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {checkups.map((c: any) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-dark-800/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-white">{c.disease}</span>
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      c.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      c.risk_level === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {c.risk_level} Risk
                    </span>
                    <span className="text-xs text-cyan-400 font-bold">{c.confidence}% Confidence</span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {c.doctor_name} | {c.hospital_name} | {c.date}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/patient/records`)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 self-start md:self-auto border border-slate-700/60"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

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
    return <div className="p-8 text-emerald-600 font-semibold text-center">Loading Patient Dashboard...</div>;
  }

  const kpis = data?.kpis || {};
  const checkups = data?.recent_checkups || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Patient Healthcare Overview</h1>
          <p className="text-xs text-slate-500">Track checkups, doctor diagnoses, and active sharing consents</p>
        </div>
        <button
          onClick={() => navigate('/patient/access-sharing')}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-800 font-extrabold text-xs shadow-md shadow-emerald-200 flex items-center gap-2 transition-all"
        >
          <Key className="w-4 h-4" />
          <span>Generate Share Token</span>
        </button>
      </div>

      {/* Patient-Specific Relevant Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-rose-100">Total Checkups</span>
            <p className="text-3xl font-extrabold text-white">{kpis.total_checkups || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Completed</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-emerald-100">Total Records</span>
            <p className="text-3xl font-extrabold text-white">{kpis.total_records || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">On File</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-sky-100">Uploaded Reports</span>
            <p className="text-3xl font-extrabold text-white">{kpis.uploaded_reports || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Uploaded</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <FolderOpen className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-purple-100">Shared Records</span>
            <p className="text-3xl font-extrabold text-white">{kpis.shared_records || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Granted Shares</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-amber-100">Active Tokens</span>
            <p className="text-3xl font-extrabold text-white">{kpis.active_tokens || 0}</p>
            <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full font-bold">Active Consents</span>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center border border-white/30 text-white">
            <Key className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recent Checkups Table Card */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Recent Medical Checkups & AI Predictions</span>
          </h2>
          <button
            onClick={() => navigate('/patient/records')}
            className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-bold"
          >
            <span>View All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {checkups.length === 0 ? (
          <p className="text-xs text-slate-500 py-6 text-center font-medium">No checkups recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {checkups.map((c: any) => (
              <div
                key={c.id}
                className="p-4 rounded-xl bg-white border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-emerald-300 transition-all shadow-sm"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-800">{c.disease}</span>
                    <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      c.risk_level === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                      c.risk_level === 'Moderate' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {c.risk_level} Risk
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">{c.confidence}% Confidence</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {c.doctor_name} | {c.hospital_name} | {c.date}
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/patient/records`)}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-700 flex items-center gap-1.5 self-start md:self-auto border border-emerald-200 transition-colors"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

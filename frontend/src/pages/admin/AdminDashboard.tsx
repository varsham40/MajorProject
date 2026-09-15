import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { Users, Stethoscope, Building2, FileText, Cpu, Lock, ShieldCheck, Activity } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-emerald-600 text-center font-semibold">Loading Admin System Dashboard...</div>;

  const kpis = data?.kpis || {};
  const modelChart = data?.model_metrics_chart || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-bold">System Administrator Control Center</h1>
        <p className="text-xs text-slate-500">Global analytics, user roles, AI model performance, and Hardhat blockchain ledger audit</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs text-slate-500 font-medium">Patients</span>
            <Users className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-bold">{kpis.total_patients || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs text-slate-500 font-medium">Doctors</span>
            <Stethoscope className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-bold">{kpis.total_doctors || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs text-slate-500 font-medium">Hospitals</span>
            <Building2 className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-bold">{kpis.total_hospitals || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs text-slate-500 font-medium">Medical Records</span>
            <FileText className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-bold">{kpis.total_records || 0}</p>
        </div>

        <div className="glass-panel p-4 rounded-xl space-y-1">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs text-slate-500 font-medium">Blockchain Hash Reg</span>
            <Lock className="w-4 h-4" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 font-bold">{kpis.blockchain_registered || 0}</p>
        </div>
      </div>

      {/* Model Performance Comparison Chart */}
      <div className="glass-panel p-6 rounded-2xl space-y-4">
        <h2 className="text-base font-bold text-slate-900 font-bold flex items-center gap-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          <span>Disease ML Models Metric Comparison (%) — Dynamic Database Metrics</span>
        </h2>

        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelChart}>
              <XAxis dataKey="disease" stroke="#94a3b8" tick={{ fontSize: 12 }} />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Bar dataKey="accuracy" name="Accuracy (%)" fill="#22d3ee" radius={[4, 4, 0, 0]} />
              <Bar dataKey="f1_score" name="F1 Score (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="roc_auc" name="ROC-AUC (%)" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

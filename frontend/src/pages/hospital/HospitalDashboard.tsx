import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, ShieldCheck, FolderOpen, Lock, History, ArrowRight, 
  Users, Key, Activity, HeartPulse, Stethoscope, RefreshCw, Award, CheckCircle2, AlertTriangle, ExternalLink
} from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = () => {
    setLoading(true);
    api.get('/hospitals/overview')
      .then(res => setData(res.data))
      .catch(err => console.error("Error loading hospital overview:", err))
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4 text-emerald-600">
        <RefreshCw className="w-10 h-10 animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Loading Hospital Executive Overview...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const diseaseDist = data?.disease_distribution || {};
  const aptMetrics = data?.appointment_metrics || {};
  const riskDist = data?.risk_distribution || {};
  const topDoctors = data?.top_doctors || [];
  const recentActivities = data?.recent_activities || [];

  const totalDiseasesCount = (Object.values(diseaseDist) as number[]).reduce((a, b) => a + b, 0) || 1;

  // Disease Color Palette
  const diseaseColors: Record<string, string> = {
    'Heart Disease': 'from-rose-500 to-red-600 text-rose-400 bg-rose-500',
    'Diabetes': 'from-cyan-500 to-blue-600 text-emerald-600 bg-cyan-500',
    'Kidney Disease': 'from-amber-500 to-yellow-600 text-amber-400 bg-amber-500',
    'Breast Cancer': 'from-fuchsia-500 to-pink-600 text-fuchsia-400 bg-fuchsia-500',
    'Parkinsons': 'from-emerald-500 to-teal-600 text-emerald-400 bg-emerald-500',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Hero Header Banner */}
      <div className="relative overflow-hidden bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl text-emerald-600">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl lg:text-3xl font-black text-slate-900 font-bold tracking-tight">
                    {data?.hospital_name || 'Healthcare Organization'}
                  </h1>
                  <span className="px-2.5 py-0.5 text-xs font-mono font-bold bg-cyan-500/10 text-emerald-600 border border-cyan-500/20 rounded-full">
                    {data?.code || 'HOSP-MAIN'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>License: <strong className="text-slate-700 font-mono">{data?.license_number || 'LIC-VERIFIED'}</strong></span>
                  <span>Facility: <strong className="text-slate-700">{data?.address || 'Main Campus'}</strong></span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => navigate('/hospital/records-management')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <FolderOpen className="w-4 h-4 text-emerald-600" />
              <span>Records Hub</span>
            </button>

            <button
              onClick={() => navigate('/hospital/doctors')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-700 border border-slate-200 text-xs font-bold transition flex items-center gap-2 shadow-sm"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Doctor Staff</span>
            </button>

            <button
              onClick={() => navigate('/hospital/records-management?tab=verifier')}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Lock className="w-4 h-4" />
              <span>Zero-Trust SHA-256 Verifier</span>
            </button>
          </div>
        </div>
      </div>

      {/* Executive KPI Suite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Medical Staff */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-3 hover:border-cyan-500/30 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Affiliated Doctors</span>
            <div className="p-2 bg-cyan-500/10 text-emerald-600 rounded-xl border border-cyan-500/20">
              <Stethoscope className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 font-bold">{kpis.total_doctors || 0}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Physician Staff Active</p>
          </div>
        </div>

        {/* Card 2: Facility Diagnostic Records */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-3 hover:border-emerald-500/30 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital Records</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 font-bold">{kpis.total_records || 0}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Generated at Facility</p>
          </div>
        </div>

        {/* Card 3: Consented Patient Tokens */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-3 hover:border-cyan-500/30 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Consented Access</span>
            <div className="p-2 bg-cyan-500/10 text-emerald-600 rounded-xl border border-cyan-500/20">
              <Key className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 font-bold">{kpis.authorized_records || 0}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Patient Access Tokens</p>
          </div>
        </div>

        {/* Card 4: Outward Patient Grants */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-3 hover:border-purple-500/30 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outward Grants</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <ExternalLink className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 font-bold">{kpis.shared_records || 0}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Patient Shared External</p>
          </div>
        </div>

        {/* Card 5: Blockchain SHA-256 Verifier Score */}
        <div className="bg-white border border-slate-200/80 p-5 rounded-2xl space-y-3 hover:border-emerald-500/30 transition shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Blockchain Audit</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl font-black text-emerald-400">{kpis.verification_score || '100% Verified'}</p>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">SHA-256 Smart Contract</p>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disease Diagnostic Distribution Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-bold flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-rose-400" />
                Disease Diagnostic Distribution
              </h2>
              <p className="text-xs text-slate-500">Breakdown of AI predictions generated across disease categories at your facility.</p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
              Total: {totalDiseasesCount} Analyses
            </span>
          </div>

          {Object.keys(diseaseDist).length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs bg-white rounded-2xl border border-slate-200/80/60">
              No diagnostic data recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(diseaseDist).map(([disease, count]) => {
                const numCount = count as number;
                const percent = Math.round((numCount / totalDiseasesCount) * 100);
                const colorConfig = diseaseColors[disease] || 'from-cyan-500 to-blue-600 text-emerald-600 bg-cyan-500';

                return (
                  <div key={disease} className="space-y-1.5 bg-[#f4f7f6]/60 p-3.5 rounded-2xl border border-slate-200/80">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700">{disease}</span>
                      <span className="text-slate-500 font-mono">
                        <strong className="text-slate-900 font-bold">{numCount}</strong> records ({percent}%)
                      </span>
                    </div>
                    
                    {/* Visual Bar Meter */}
                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full bg-gradient-to-r ${colorConfig.split(' ')[0]} ${colorConfig.split(' ')[1]} transition-all duration-500`}
                        style={{ width: `${Math.max(percent, 8)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Appointment Lifecycle & Risk Distribution */}
        <div className="space-y-6">
          {/* Appointment Lifecycle Status */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 font-bold flex items-center gap-2 border-b border-slate-200/80 pb-3">
              <Activity className="w-4 h-4 text-emerald-600" />
              Appointment Lifecycle Status
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#f4f7f6]/60 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium">Scheduled (Pending)</span>
                <p className="text-xl font-bold text-amber-400">{aptMetrics.scheduled || 0}</p>
              </div>

              <div className="bg-[#f4f7f6]/60 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium">Accepted</span>
                <p className="text-xl font-bold text-emerald-600">{aptMetrics.accepted || 0}</p>
              </div>

              <div className="bg-[#f4f7f6]/60 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium">Completed (Treated)</span>
                <p className="text-xl font-bold text-emerald-400">{aptMetrics.completed || 0}</p>
              </div>

              <div className="bg-[#f4f7f6]/60 p-3 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-slate-500 font-medium">Rejected</span>
                <p className="text-xl font-bold text-rose-400">{aptMetrics.rejected || 0}</p>
              </div>
            </div>
          </div>

          {/* Diagnostic Risk Severity Meter */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-slate-900 font-bold flex items-center gap-2 border-b border-slate-200/80 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Diagnostic Risk Severity Tier
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-rose-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> High Risk
                </span>
                <span className="font-mono text-slate-800 font-bold">{riskDist.high_risk || 0}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-amber-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium Risk
                </span>
                <span className="font-mono text-slate-800 font-bold">{riskDist.medium_risk || 0}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low / Normal
                </span>
                <span className="font-mono text-slate-800 font-bold">{riskDist.low_risk || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Leaderboard & Recent Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Physician Staff Leaderboard */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex justify-between items-center border-b border-slate-200/80 pb-3">
            <h2 className="text-base font-bold text-slate-900 font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Hospital Physician Staff Leaderboard
            </h2>
            <button
              onClick={() => navigate('/hospital/doctors')}
              className="text-xs text-emerald-600 hover:text-cyan-300 font-bold flex items-center gap-1"
            >
              View All Doctors <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topDoctors.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No doctor staff accounts registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-white uppercase text-[10px] text-slate-500 border-b border-slate-200/80">
                  <tr>
                    <th className="py-3 px-4">Doctor Name</th>
                    <th className="py-3 px-4">Specialization</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-right">Analyses Run</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {topDoctors.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-100/40 transition">
                      <td className="py-3 px-4 font-bold text-slate-900 font-bold">{doc.name}</td>
                      <td className="py-3 px-4 text-emerald-600 font-medium">{doc.specialization}</td>
                      <td className="py-3 px-4 text-slate-500">{doc.department}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{doc.records_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Facility Activity Stream */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xl">
          <h2 className="text-base font-bold text-slate-900 font-bold flex items-center gap-2 border-b border-slate-200/80 pb-3">
            <History className="w-5 h-5 text-emerald-600" />
            Recent Diagnostic Activity Stream
          </h2>

          {recentActivities.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No recent facility activities recorded.</div>
          ) : (
            <div className="space-y-3">
              {recentActivities.map((act: any) => (
                <div key={act.id} className="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-emerald-600 font-mono">{act.title}</span>
                    <span className="text-[10px] text-slate-500">{act.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Analysis: <strong className="text-slate-900 font-bold">{act.disease}</strong> ({act.result})
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalDashboard;

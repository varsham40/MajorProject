import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { User, Activity, Heart, ShieldAlert, FileText } from 'lucide-react';

export const MyHealthPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/patients/me/health')
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-cyan-400 text-center">Loading Health Profile...</div>;

  const p = data?.patient || {};
  const hp = data?.health_profile || {};

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white">My Health Profile</h1>
        <p className="text-xs text-slate-400">Personal health baselines, Vitals, Allergies, and Medical History</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details */}
        <div className="glass-panel p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <User className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white">Personal Information</h2>
          </div>
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-slate-500">Patient Name:</span>
              <p className="font-bold text-white text-sm">{p.name}</p>
            </div>
            <div>
              <span className="text-slate-500">Patient ID Code:</span>
              <p className="font-mono text-cyan-400 font-bold">{p.patient_code}</p>
            </div>
            <div>
              <span className="text-slate-500">Date of Birth:</span>
              <p className="text-slate-200">{p.dob}</p>
            </div>
            <div>
              <span className="text-slate-500">Gender:</span>
              <p className="text-slate-200">{p.gender}</p>
            </div>
            <div>
              <span className="text-slate-500">Contact:</span>
              <p className="text-slate-200">{p.phone || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
            <Heart className="w-5 h-5 text-rose-400" />
            <h2 className="font-bold text-white">Clinical Vitals Baseline</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-dark-800/80 border border-slate-800">
              <span className="text-xs text-slate-400">Height</span>
              <p className="text-lg font-extrabold text-white">{hp.height || 170} <span className="text-xs font-normal text-slate-400">cm</span></p>
            </div>
            <div className="p-3.5 rounded-xl bg-dark-800/80 border border-slate-800">
              <span className="text-xs text-slate-400">Weight</span>
              <p className="text-lg font-extrabold text-white">{hp.weight || 68} <span className="text-xs font-normal text-slate-400">kg</span></p>
            </div>
            <div className="p-3.5 rounded-xl bg-dark-800/80 border border-slate-800">
              <span className="text-xs text-slate-400">BMI</span>
              <p className="text-lg font-extrabold text-cyan-400">{hp.bmi || 25.0}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-dark-800/80 border border-slate-800">
              <span className="text-xs text-slate-400">Blood Pressure</span>
              <p className="text-lg font-extrabold text-emerald-400">{hp.blood_pressure || '120/80'}</p>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-cyan-400" /> Medical History
              </span>
              <p className="text-xs text-slate-200 bg-dark-800/50 p-3 rounded-xl border border-slate-800">{hp.medical_history || 'No prior severe medical history.'}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" /> Known Allergies
              </span>
              <p className="text-xs text-amber-300/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">{hp.allergies || 'None'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

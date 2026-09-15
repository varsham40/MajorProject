import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, ShieldCheck, Lock } from 'lucide-react';

export const ReceivedRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/hospitals/received-records')
      .then(res => setRecords(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-emerald-600 text-center font-semibold">Loading Received Records...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-bold">Received Medical Records</h1>
        <p className="text-xs text-slate-500">Records transferred from external hospitals via patient consent access tokens</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/80">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-200/80 text-slate-500 bg-white/50">
              <th className="py-3 px-4">Record Code</th>
              <th className="py-3 px-4">Patient</th>
              <th className="py-3 px-4">Disease / Diagnosis</th>
              <th className="py-3 px-4">Traceability Source</th>
              <th className="py-3 px-4">Received Date</th>
              <th className="py-3 px-4 text-right">Integrity Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {records.map((r) => (
              <tr key={r.share_id} className="hover:bg-slate-100/30">
                <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{r.record_code}</td>
                <td className="py-3.5 px-4 font-bold text-slate-900 font-bold">{r.patient_name} ({r.patient_code})</td>
                <td className="py-3.5 px-4 text-slate-700">{r.disease}</td>
                <td className="py-3.5 px-4">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                    {r.source_info}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-500">{r.received_at}</td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => navigate(`/hospital/verify-record?id=${r.record_id}`)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-dark-900 font-bold transition-all text-[11px] inline-flex items-center gap-1 border border-emerald-500/30"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Verify Integrity</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

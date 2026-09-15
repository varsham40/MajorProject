import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { History, ShieldCheck, AlertTriangle, CheckCircle2, Trash2 } from 'lucide-react';

export const VerificationHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = () => {
    setLoading(true);
    api.get('/verification/history')
      .then(res => setHistory(res.data || []))
      .catch(err => console.error("Error fetching verification history:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear the verification audit history log? This cannot be undone.")) return;
    try {
      await api.delete('/verification/history');
      setHistory([]);
    } catch (err) {
      console.error("Failed to clear verification history:", err);
      alert("Failed to clear verification history.");
    }
  };

  const validCount = history.filter(h => h.result === 'MATCH' || h.result === 'VALID').length;
  const alertCount = history.filter(h => h.result === 'MISMATCH' || h.result === 'TAMPERED').length;

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-emerald-600 font-semibold text-sm">Loading Verification Audit Logs...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-bold flex items-center gap-2">
            <History className="w-6 h-6 text-emerald-600" />
            Integrity Verification Logs & History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all SHA-256 vs Hardhat blockchain cryptographic verification checks
          </p>
        </div>
        <div className="flex items-center gap-2 self-start">
          <button 
            onClick={fetchHistory}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-700 text-xs font-bold text-slate-700 rounded-xl transition border border-slate-200"
          >
            Refresh Logs
          </button>
          {history.length > 0 && (
            <button 
              onClick={handleClearHistory}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Logs
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Verification Checks</span>
            <History className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 font-bold mt-2">{history.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Audit logs recorded across sessions</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Passed Verifications</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{validCount}</p>
          <p className="text-[11px] text-emerald-500/80 mt-1">100% Cryptographic Match</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-200/80 bg-white">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Tamper Alerts Detected</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl font-black text-rose-400 mt-2">{alertCount}</p>
          <p className="text-[11px] text-rose-500/80 mt-1">Off-chain data discrepancies</p>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200/80 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-500 bg-white/90 border border-slate-200/80">
                <th className="py-3.5 px-4 font-bold">Record Code</th>
                <th className="py-3.5 px-4 font-bold">Verified By</th>
                <th className="py-3.5 px-4 font-bold">Verdict</th>
                <th className="py-3.5 px-4 font-bold">SHA-256 Fingerprint</th>
                <th className="py-3.5 px-4 font-bold text-right">Verification Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No verification audit logs recorded yet.
                  </td>
                </tr>
              ) : (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-slate-100/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">{h.record_code}</td>
                    <td className="py-3.5 px-4 text-slate-700 font-sans text-xs">{h.verified_by}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        h.result === 'MATCH' || h.result === 'VALID' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {h.result}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 truncate max-w-xs" title={h.current_hash}>
                      {h.current_hash}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500 font-sans text-[11px]">{h.verified_at}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

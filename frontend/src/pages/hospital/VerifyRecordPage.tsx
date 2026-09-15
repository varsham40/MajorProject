import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useSearchParams } from 'react-router-dom';
import { Lock, ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const VerifyRecordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const paramRecordId = searchParams.get('id') || '';

  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState(paramRecordId);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get('/hospitals/received-records').then(res => {
      setRecords(res.data);
      if (!selectedRecordId && res.data.length > 0) {
        setSelectedRecordId(res.data[0].record_id);
      }
    }).catch(err => console.error(err));
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordId) return;
    setVerifying(true);
    setResult(null);

    try {
      const res = await api.post('/verification/verify', {
        record_id: selectedRecordId
      });
      setResult(res.data);
    } catch (err: any) {
      setResult({
        result: 'ERROR',
        message: err.response?.data?.detail || 'Verification error'
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-bold">Record Tamper Integrity Verification Engine</h1>
        <p className="text-xs text-slate-500">Recalculates canonical SHA-256 fingerprint from PostgreSQL and validates against Hardhat blockchain ledger</p>
      </div>

      <div className="glass-panel p-8 rounded-2xl border border-slate-200/80 space-y-6">
        <h2 className="text-base font-bold text-slate-900 font-bold flex items-center gap-2 border-b border-slate-200/80 pb-3">
          <Lock className="w-5 h-5 text-emerald-600" />
          <span>Execute Cryptographic Integrity Check</span>
        </h2>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Select Received Record to Verify</label>
            <select
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold font-mono"
            >
              {records.map(r => (
                <option key={r.record_id} value={r.record_id}>{r.record_code} — {r.disease} ({r.patient_name})</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} />
            <span>{verifying ? 'Calculating SHA-256 & Querying Hardhat Node...' : 'Verify Record Integrity'}</span>
          </button>
        </form>

        {result && (
          <div className={`p-6 rounded-2xl border space-y-4 ${
            result.result === 'MATCH' ? 'bg-emerald-500/10 border-emerald-500/40' : 'bg-rose-500/10 border-rose-500/40'
          }`}>
            <div className="flex items-center gap-3">
              {result.result === 'MATCH' ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-rose-400" />
              )}
              <div>
                <h3 className={`text-lg font-extrabold ${result.result === 'MATCH' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {result.result === 'MATCH' ? 'Record Integrity Verified' : 'Possible Modification Detected'}
                </h3>
                <p className="text-xs text-slate-600">{result.message}</p>
              </div>
            </div>

            {result.current_hash && (
              <div className="space-y-1 text-xs font-mono pt-3 border-t border-slate-200/80 text-slate-600">
                <p>Current Off-Chain Hash: <span className="text-emerald-600">{result.current_hash}</span></p>
                <p>Blockchain Registered Hash: <span className="text-emerald-400">{result.blockchain_hash}</span></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

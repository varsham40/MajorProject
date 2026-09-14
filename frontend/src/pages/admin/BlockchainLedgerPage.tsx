import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Lock, ShieldCheck, CheckCircle2, Cpu, Database } from 'lucide-react';

export const BlockchainLedgerPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = () => {
    setLoading(true);
    api.get('/admin/blockchain')
      .then(res => setRecords(res.data || []))
      .catch(err => console.error("Error fetching blockchain ledger:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const formatDate = (dtStr: string) => {
    if (!dtStr) return 'N/A';
    try {
      const d = new Date(dtStr);
      if (isNaN(d.getTime())) return dtStr;
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }) + ' IST';
    } catch {
      return dtStr;
    }
  };

  if (loading) return (
    <div className="p-8 flex flex-col items-center justify-center space-y-3">
      <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-cyan-400 font-semibold text-sm">Synchronizing Hardhat Blockchain Ledger...</p>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-cyan-400" />
            Blockchain Record Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Cryptographic SHA-256 record fingerprints registered on Hardhat Ethereum Smart Contract Registry
          </p>
        </div>
        <button 
          onClick={fetchRecords}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition border border-slate-700 flex items-center gap-2 self-start"
        >
          Refresh Ledger
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total On-Chain Records</span>
            <Database className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-2xl font-black text-white mt-2">{records.length}</p>
          <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> 100% Immutable Fingerprints
          </p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Consensus Engine</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl font-extrabold text-slate-200 mt-2">Ethereum Hardhat</p>
          <p className="text-[11px] text-purple-400 mt-1">Local Testnet (Chain ID 31337)</p>
        </div>

        <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Security Standard</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl font-extrabold text-emerald-400 mt-2">SHA-256 Digest</p>
          <p className="text-[11px] text-slate-400 mt-1">Zero-Knowledge Integrity Guard</p>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-dark-800/80">
                <th className="py-3.5 px-4 font-bold">Record ID</th>
                <th className="py-3.5 px-4 font-bold">SHA-256 Digest</th>
                <th className="py-3.5 px-4 font-bold">Transaction Hash</th>
                <th className="py-3.5 px-4 font-bold text-center">Block #</th>
                <th className="py-3.5 px-4 font-bold">Contract Address</th>
                <th className="py-3.5 px-4 font-bold text-right">Registration Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No blockchain records registered on-chain yet.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id || r.record_id} className="hover:bg-cyan-950/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-cyan-400">
                      {r.record_id ? `${r.record_id.substring(0, 8)}...` : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-emerald-400 truncate max-w-[180px]" title={r.sha256_hash}>
                      {r.sha256_hash}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 truncate max-w-[160px]" title={r.tx_hash}>
                      {r.tx_hash}
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-purple-400">
                      #{r.block_number}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-[160px]" title={r.contract_address}>
                      {r.contract_address}
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400 font-sans text-[11px]">
                      {formatDate(r.registered_at)}
                    </td>
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

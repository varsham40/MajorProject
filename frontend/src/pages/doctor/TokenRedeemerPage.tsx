import { ClinicalSummaryTable } from '../../components/ClinicalSummaryTable';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { SHAPChart } from '../../components/SHAPChart';
import { Key, ShieldCheck, Search, AlertCircle, Download, FileText, CheckCircle2, User, Building2, Calendar, Lock } from 'lucide-react';

const formatTimestamp = (dateStr?: string | Date) => {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }) + ' IST';
  } catch {
    return String(dateStr);
  }
};

export const TokenRedeemerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token');

  const [tokenCode, setTokenCode] = useState(tokenFromUrl || '');

  useEffect(() => {
    if (tokenFromUrl) {
      setTokenCode(tokenFromUrl.toUpperCase());
    }
  }, [tokenFromUrl]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [record, setRecord] = useState<any | null>(null);

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenCode.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setRecord(null);

    try {
      const res = await api.post('/doctors/tokens/redeem', { token_code: tokenCode.trim() });
      setRecord(res.data);
      setSuccessMsg(`Token Authorized! Analysis report '${res.data.record_code || ''}' has been unlocked and permanently saved under your 'Shared & Token-Accessed Records' database roster.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid or expired Patient Access Token code.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintDownload = () => {
    window.print();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-bold">Patient Access Token Redeemer</h1>
        <p className="text-xs text-slate-500">Enter a Patient Access Token code (e.g. PAT-8F4K-92MX) to access the patient's authorized analysis report</p>
      </div>

      {/* Token Input Form */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-4 max-w-2xl">
        <h2 className="text-base font-bold text-slate-900 font-bold flex items-center gap-2">
          <Key className="w-5 h-5 text-emerald-600" />
          <span>Redeem Patient Access Token</span>
        </h2>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Report Accessed & Saved to Doctor Database</span>
            </div>
            <p className="leading-relaxed font-medium">{successMsg}</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-extrabold text-sm">
              <Lock className="w-4 h-4 text-rose-400" />
              <span>Cryptographic Access Policy Enforcement</span>
            </div>
            <p className="leading-relaxed font-medium">{error}</p>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-1 border-t border-rose-500/20">
              <ShieldCheck className="w-3.5 h-3.5 text-rose-400" />
              <span>Token authorization policy verified & enforced on Web3 Hardhat Smart Contract</span>
            </div>
          </div>
        )}

        <form onSubmit={handleRedeem} className="flex gap-3">
          <input
            type="text"
            required
            value={tokenCode}
            onChange={(e) => setTokenCode(e.target.value.toUpperCase())}
            placeholder="PAT-XXXX-YYYY"
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-emerald-600 tracking-wider focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Validating Token...' : 'Access Report'}
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Authorized Analysis Report View */}
      {record && (
        <div className="glass-panel rounded-3xl p-6 space-y-6 border border-slate-200 shadow-2xl print:bg-white print:text-black print:p-0 print:border-none">
          
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4 print:hidden">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>TOKEN AUTHORIZED</span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-600">{record.record_code}</span>
            </div>

            <button
              onClick={handlePrintDownload}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold text-xs shadow-lg flex items-center gap-2 hover:opacity-90 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Analysis Report (PDF)</span>
            </button>
          </div>

          {/* Printable Report Header */}
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 font-bold print:text-black">HealthSync — Patient Authorized Report</h2>
                <p className="text-xs text-slate-500 print:text-slate-600">Explainable Diagnostic Risk Assessment & Blockchain Fingerprint</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-600 print:text-slate-800">Record ID: {record.record_code}</span>
                <p className="text-xs text-slate-500 print:text-slate-600">Generated: {formatTimestamp(record.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/90 border border-slate-200/80 border border-slate-200/80 text-xs print:bg-gray-100 print:text-black print:border-gray-300">
            <div>
              <span className="text-slate-500 print:text-gray-600 block">Patient Name</span>
              <span className="font-bold text-slate-900 font-bold print:text-black">{record.patient_name}</span>
            </div>
            <div>
              <span className="text-slate-500 print:text-gray-600 block">Patient Code</span>
              <span className="font-mono font-bold text-emerald-600 print:text-black">{record.patient_code}</span>
            </div>
            <div>
              <span className="text-slate-500 print:text-gray-600 block">Origin Doctor</span>
              <span className="font-bold text-slate-900 font-bold print:text-black">{record.doctor_name}</span>
            </div>
            <div>
              <span className="text-slate-500 print:text-gray-600 block">Hospital</span>
              <span className="font-bold text-slate-900 font-bold print:text-black">{record.hospital_name}</span>
            </div>
          </div>

                    {/* Diagnostic Prediction Result */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Target Condition</span>
              <p className="text-xl font-extrabold text-slate-900">{record.disease}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">Diagnostic Result & Risk</span>
              <p className={`text-xl font-extrabold ${
                record.risk_level === 'High' ? 'text-rose-600' :
                record.risk_level === 'Moderate' ? 'text-amber-600' : 'text-emerald-700'
              }`}>
                {record.result} ({record.risk_level} Risk)
              </p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-700 block mb-1">AI Confidence Score</span>
              <p className="text-2xl font-extrabold text-emerald-700">{record.confidence}%</p>
            </div>
          </div>

          {/* Clinical Inputs Vitals */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700 print:text-black">Clinical Vitals & Input Parameters</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(record.clinical_inputs || {}).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-xl bg-white border border-slate-200/80 print:bg-gray-50 print:border-gray-200">
                  <span className="text-slate-500 print:text-gray-600 block truncate">{k}</span>
                  <span className="font-mono font-bold text-slate-900 font-bold print:text-black">{String(v)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Explainable AI Text */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700 print:text-black">Summary</h3>
            <div className="p-4 rounded-xl bg-white/90 border border-slate-200/80 text-xs text-slate-700 whitespace-pre-line leading-relaxed print:bg-gray-50 print:text-black print:border-gray-200">
              {record.ai_analysis_text}
            </div>
          </div>

          {/* SHAP Chart & Table */}
          {record.shap_features && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700 print:text-black">SHAP Feature Contributions</h3>
              
              <div className="print:hidden p-4 rounded-2xl bg-white/60 border border-slate-200/80">
                <SHAPChart features={record.shap_features} baseValue={record.shap_base_value} />
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-500 print:border-gray-300 print:text-black">
                    <th className="py-2 px-3">Feature Name</th>
                    <th className="py-2 px-3">Patient Value</th>
                    <th className="py-2 px-3">SHAP Impact Value</th>
                    <th className="py-2 px-3">Clinical Effect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 print:divide-gray-200">
                  {record.shap_features.map((f: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-100/30 print:text-black">
                      <td className="py-2 px-3 font-medium text-slate-900 font-bold print:text-black">{f.feature_name}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 print:text-black">{f.patient_value}</td>
                      <td className="py-2 px-3 font-mono font-bold print:text-black">{f.shap_value > 0 ? `+${f.shap_value}` : f.shap_value}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          f.effect === 'Increased Risk' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                        } print:text-black`}>
                          {f.effect}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Blockchain Fingerprint */}
          {record.blockchain_details && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs print:bg-gray-50 print:border-gray-200 print:text-black">
              <div className="flex items-center gap-2 text-emerald-400 font-bold print:text-black">
                <ShieldCheck className="w-4 h-4" />
                <span>Blockchain Verified Fingerprint (Hardhat Ledger)</span>
              </div>
              <div className="font-mono text-[11px] text-slate-600 space-y-0.5 print:text-black">
                <p>SHA-256 Hash: <span className="text-emerald-600 print:text-black">{record.blockchain_details.sha256_hash}</span></p>
                <p>Tx Hash: {record.blockchain_details.tx_hash}</p>
                <p>Block #{record.blockchain_details.block_number} | Contract: {record.blockchain_details.contract_address}</p>
              </div>
            </div>
          )}

          {/* Doctor Signature Block for Print */}
          <div className="hidden print:block pt-8 text-xs text-black border-t border-gray-300 mt-8">
            <div className="flex justify-between items-end">
              <div>
                <p className="font-bold">Attending Physician: {record.doctor_name}</p>
                <p>Specialization: {record.doctor_specialization}</p>
                <p>Hospital: {record.hospital_name}</p>
              </div>
              <div className="text-right">
                <div className="w-40 border-b border-black mb-1"></div>
                <p className="font-bold">Doctor's Digital Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

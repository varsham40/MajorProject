import { ClinicalSummaryTable } from '../../components/ClinicalSummaryTable';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { SHAPChart } from '../../components/SHAPChart';
import { FileText, ShieldCheck, X, Activity, User, Building2, Calendar, Cpu, Lock } from 'lucide-react';

export const MyRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [searchParams] = useSearchParams();
  const targetRecordId = searchParams.get('record_id');

  useEffect(() => {
    api.get('/patients/me/records')
      .then(res => {
        setRecords(res.data || []);
        if (targetRecordId) {
          openFullRecord(targetRecordId);
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [targetRecordId]);

  const openFullRecord = async (recordId: string) => {
    try {
      const res = await api.get(`/patients/me/records/${recordId}`);
      setSelectedRecord(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-emerald-600 text-center">Loading Medical Records...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">My Medical Records</h1>
        <p className="text-xs text-slate-500">Doctor-generated checkup records, Explainable AI insights, and Blockchain integrity fingerprints</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {records.map((r) => (
          <div
            key={r.record_id}
            className="glass-panel p-5 rounded-2xl space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-emerald-600">{r.record_code}</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  r.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  r.risk_level === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {r.risk_level} Risk
                </span>
              </div>

              {/* Disease Name Prominent */}
              <h3 className="text-lg font-extrabold text-slate-800">{r.disease}</h3>

              <p className="text-xs text-emerald-600 font-bold">{r.confidence}% Model Confidence</p>

              <div className="text-xs text-slate-500 space-y-0.5 pt-2 border-t border-slate-200/80">
                <p>👨‍⚕️ {r.doctor_name}</p>
                <p>🏥 {r.hospital_name}</p>
                <p>📅 {r.date}</p>
              </div>
            </div>

            <button
              onClick={() => openFullRecord(r.record_id)}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-cyan-500 hover:text-dark-900 text-xs font-bold text-slate-700 transition-all border border-slate-200/60 mt-3"
            >
              Open Full Medical Record
            </button>
          </div>
        ))}
      </div>

      {/* Full Record Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-[#f4f7f6]/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 space-y-6 relative border border-slate-200 shadow-2xl">
            <button
              onClick={() => setSelectedRecord(null)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-500 hover:text-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-emerald-600 font-mono text-xs font-bold">
                  {selectedRecord.record_code}
                </span>
                <span className="text-xs text-slate-500">{selectedRecord.source_info}</span>
              </div>
              <h2 className="text-2xl font-extrabold text-slate-800">Medical Diagnosis: {selectedRecord.disease}</h2>
            </div>

            {/* Section: Prediction Result */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">Target Condition</span>
                <p className="text-xl font-extrabold text-slate-900">{selectedRecord.disease}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">Diagnostic Result & Risk</span>
                <p className={`text-xl font-extrabold ${
                  selectedRecord.risk_level === 'High' ? 'text-rose-600' :
                  selectedRecord.risk_level === 'Moderate' ? 'text-amber-600' : 'text-emerald-700'
                }`}>
                  {selectedRecord.result} ({selectedRecord.risk_level} Risk)
                </p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-1">AI Confidence Score</span>
                <p className="text-2xl font-extrabold text-emerald-700">{selectedRecord.confidence}%</p>
              </div>
            </div>

            {/* Section: Clinical Data Used */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700">Exact Clinical Input Values Used</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {Object.entries(selectedRecord.clinical_inputs || {}).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                    <span className="text-slate-500 block truncate">{k}</span>
                    <span className="font-mono font-bold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: AI Analysis */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-700">Summary</h3>
              <ClinicalSummaryTable summaryText={selectedRecord.ai_analysis_text} shapList={selectedRecord.shap_features} />
            </div>

            {/* Section: SHAP Chart & Table */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-700">SHAP Feature Contribution Visualization</h3>
              <div className="p-4 rounded-2xl bg-white/60 border border-slate-200/80">
                <SHAPChart features={selectedRecord.shap_features} baseValue={selectedRecord.shap_base_value} />
              </div>

              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-500">
                    <th className="py-2 px-3">Feature Name</th>
                    <th className="py-2 px-3">Patient Value</th>
                    <th className="py-2 px-3">SHAP Value</th>
                    <th className="py-2 px-3">Effect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {selectedRecord.shap_features.map((f: any, idx: number) => {
                    const isIncreased = f.effect === 'Increased Risk' || f.shap_value > 0.0005;
                    const isDecreased = f.effect === 'Decreased Risk' || f.shap_value < -0.0005;

                    return (
                      <tr key={idx} className="hover:bg-slate-100/30">
                        <td className="py-2 px-3 font-medium text-slate-800">{f.feature_name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{f.patient_value}</td>
                        <td className="py-2 px-3 font-mono font-bold">{f.shap_value > 0 ? `+${f.shap_value}` : f.shap_value}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isIncreased
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isDecreased
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {isIncreased ? 'Increased Risk' : isDecreased ? 'Decreased Risk' : 'Neutral'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Doctor & Hospital Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-200/80">
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold">Attending Doctor</span>
                <p className="text-slate-800 font-bold">{selectedRecord.doctor_name} ({selectedRecord.doctor_specialization})</p>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500 font-semibold">Healthcare Organization</span>
                <p className="text-slate-800 font-bold">{selectedRecord.hospital_name}</p>
                <p className="text-slate-500">{selectedRecord.hospital_address}</p>
              </div>
            </div>

            {/* Blockchain Security Details */}
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Blockchain Registered Fingerprint (Hardhat Network)</span>
              </div>
              {selectedRecord.blockchain_details && (
                <div className="space-y-1 font-mono text-[11px] text-slate-600">
                  <p>SHA-256 Hash: <span className="text-emerald-600">{selectedRecord.blockchain_details.sha256_hash}</span></p>
                  <p>Tx Hash: {selectedRecord.blockchain_details.tx_hash}</p>
                  <p>Block #{selectedRecord.blockchain_details.block_number} | Contract: {selectedRecord.blockchain_details.contract_address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

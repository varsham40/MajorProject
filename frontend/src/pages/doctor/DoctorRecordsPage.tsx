import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { SHAPChart } from '../../components/SHAPChart';
import { FileText, Search, ShieldCheck, X, Activity, User, Building2, Calendar, Download, Printer, CheckCircle2, Key, Stethoscope, Share2, AlertCircle } from 'lucide-react';

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

export const DoctorRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const [treatedRecords, setTreatedRecords] = useState<any[]>([]);
  const [sharedRecords, setSharedRecords] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState<'treated' | 'shared'>('treated');

  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Consent Token Access Input State inside Shared Records Section
  const [tokenInput, setTokenInput] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Card specific inline token unlock state
  const [cardTokenInputs, setCardTokenInputs] = useState<Record<string, string>>({});
  const [cardUnlockLoading, setCardUnlockLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = () => {
    setLoading(true);
    api.get('/doctors/records')
      .then(res => {
        const data = res.data || {};
        const treated = Array.isArray(data.treated_records) ? data.treated_records : (Array.isArray(data) ? data : []);
        const shared = Array.isArray(data.shared_records) ? data.shared_records : [];
        setTreatedRecords(treated);
        setSharedRecords(shared);
      })
      .catch(err => {
        console.error(err);
        setTreatedRecords([]);
        setSharedRecords([]);
      })
      .finally(() => setLoading(false));
  };

  const openRecordModal = async (recordId: string) => {
    setLoadingDetail(true);
    try {
      const res = await api.get(`/doctors/records/${recordId}`);
      setSelectedRecord(res.data);
    } catch (err) {
      console.error('Failed to load record details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleRedeemToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInput.trim()) return;
    setTokenLoading(true);
    setTokenStatus(null);

    try {
      const res = await api.post('/doctors/tokens/redeem', { token_code: tokenInput.trim() });
      setTokenStatus({ type: 'success', text: `Token Access Granted! Analysis report '${res.data.record_code || ''}' unlocked and saved to Shared & Token-Accessed Records.` });
      setSelectedRecord(res.data);
      setTokenInput('');
      setActiveSection('shared');
      fetchRecords();
    } catch (err: any) {
      setTokenStatus({ type: 'error', text: err.response?.data?.detail || 'Token access validation failed.' });
    } finally {
      setTokenLoading(false);
    }
  };

  const handleUnlockCardToken = async (recordId: string, defaultCode?: string) => {
    const code = (cardTokenInputs[recordId] || defaultCode || '').trim();
    if (!code) return;
    setCardUnlockLoading(recordId);

    try {
      const res = await api.post('/doctors/tokens/redeem', { token_code: code });
      setSelectedRecord(res.data);
      fetchRecords();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Invalid Patient Access Token code.');
    } finally {
      setCardUnlockLoading(null);
    }
  };

  const handlePrintDownload = () => {
    window.print();
  };

  const currentRecords = activeSection === 'treated' ? treatedRecords : sharedRecords;
  const filtered = currentRecords.filter(r =>
    (r.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.record_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.disease || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-cyan-400 text-center font-semibold">Loading Medical Records Repository...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Doctor Medical Records Roster</h1>
          <p className="text-xs text-slate-400">Separate sections for treated patients & cross-hospital shared records accessed via patient consent tokens</p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, patient, disease..."
            className="bg-dark-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Two Section Sub-Navigation Tabs Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-1.5 rounded-2xl bg-dark-800/80 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveSection('treated')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeSection === 'treated'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Treated Patients Records</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSection === 'treated' ? 'bg-dark-900/30 text-dark-900' : 'bg-slate-700 text-slate-300'
            }`}>
              {treatedRecords.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSection('shared')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
              activeSection === 'shared'
                ? 'bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Shared & Token-Accessed Records</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeSection === 'shared' ? 'bg-dark-900/30 text-dark-900' : 'bg-slate-700 text-slate-300'
            }`}>
              {sharedRecords.length}
            </span>
          </button>
        </div>

        <div className="px-3 text-[11px] text-slate-400 font-medium">
          {activeSection === 'treated' ? 'Displaying records for patients examined at your clinic' : 'Displaying records accessed from other hospitals via consent tokens'}
        </div>
      </div>



      {/* Grid of Medical Records Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r) => {
          if (r.is_locked) {
            return (
              <div
                key={r.record_id}
                className="relative overflow-hidden glass-panel p-5 rounded-2xl border border-purple-500/40 bg-gradient-to-br from-dark-900 via-slate-900 to-purple-950/30 shadow-xl flex flex-col justify-between"
              >
                {/* Blurred Content Background */}
                <div className="space-y-3 filter blur-[5px] opacity-40 select-none pointer-events-none">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-purple-400">{r.record_code}</span>
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase bg-purple-500/20 text-purple-400 border border-purple-500/30">
                      Token Locked
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-white">{r.disease}</h3>
                    <p className="text-xs font-bold text-slate-300">Patient: {r.patient_name} ({r.patient_code})</p>
                    <p className="text-[11px] text-slate-400 mt-1">Source: {r.source}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                    <span className="text-purple-400 font-bold">Encrypted Confidence Score</span>
                    <span className="text-slate-400">{r.date}</span>
                  </div>
                </div>

                {/* Central Overlay for Token Entry */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-dark-900/85 backdrop-blur-md text-center space-y-3">
                  <div className="w-9 h-9 rounded-2xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/40">
                    <Key className="w-5 h-5 text-purple-300 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Token Protected Report</h4>
                    <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                      Patient: <span className="text-cyan-400 font-bold">{r.patient_name}</span> ({r.patient_code})
                    </p>
                    <p className="text-[10px] text-purple-300 mt-1">Copy token code from your notifications bell & click below to redeem</p>
                  </div>

                  <button
                    onClick={() => navigate('/doctor/token-redeemer')}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Unlock Shared Report</span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div
              key={r.record_id}
              onClick={() => openRecordModal(r.record_id)}
              className="glass-panel p-5 rounded-2xl space-y-3 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">{r.record_code}</span>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    r.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    r.risk_level === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {r.risk_level} Risk
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white">{r.disease}</h3>
                  <p className="text-xs font-bold text-slate-300">Patient: {r.patient_name} ({r.patient_code})</p>
                  <p className="text-[11px] text-slate-400 mt-1">Source: <span className="text-cyan-400 font-semibold">{r.source}</span></p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80">
                <span className="text-cyan-400 font-bold">{r.confidence}% Confidence</span>
                <span className="text-slate-400">{r.date}</span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 text-xs glass-panel rounded-2xl border border-slate-800">
            {activeSection === 'treated'
              ? 'No treated patient records found matching active search query.'
              : 'No cross-hospital shared records accessed yet. Use the token entry box above to redeem a patient consent token.'}
          </div>
        )}
      </div>

      {/* Full Record Modal with Download/Print Feature */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 space-y-6 relative border border-slate-700 shadow-2xl print:bg-white print:text-black print:p-0 print:border-none">
            
            {/* Action Bar (Close & Download Buttons) */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs font-bold">
                  {selectedRecord.record_code}
                </span>
                <span className="text-xs text-slate-400">Date: {formatTimestamp(selectedRecord.created_at)}</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrintDownload}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 font-extrabold text-xs shadow-lg flex items-center gap-2 hover:opacity-90 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Analysis Report (PDF)</span>
                </button>

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Report Header */}
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-extrabold text-white print:text-black">AI HealthSecure — Clinical Analysis Report</h2>
                  <p className="text-xs text-slate-400 print:text-slate-600">Explainable Diagnostic Risk Assessment & Blockchain Fingerprint</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold text-cyan-400 print:text-slate-800">Record ID: {selectedRecord.record_code}</span>
                  <p className="text-xs text-slate-400 print:text-slate-600">Generated: {formatTimestamp(selectedRecord.created_at)}</p>
                </div>
              </div>
            </div>

            {/* Patient & Doctor Information */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-dark-800/80 border border-slate-800 text-xs print:bg-gray-100 print:text-black print:border-gray-300">
              <div>
                <span className="text-slate-500 print:text-gray-600 block">Patient Name</span>
                <span className="font-bold text-white print:text-black">{selectedRecord.patient_name}</span>
              </div>
              <div>
                <span className="text-slate-500 print:text-gray-600 block">Patient Code</span>
                <span className="font-mono font-bold text-cyan-400 print:text-black">{selectedRecord.patient_code}</span>
              </div>
              <div>
                <span className="text-slate-500 print:text-gray-600 block">Attending Doctor</span>
                <span className="font-bold text-white print:text-black">{selectedRecord.doctor_name}</span>
              </div>
              <div>
                <span className="text-slate-500 print:text-gray-600 block">Hospital</span>
                <span className="font-bold text-white print:text-black">{selectedRecord.hospital_name}</span>
              </div>
            </div>

            {/* Prediction Output & Risk Badge */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-dark-800 to-slate-900 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 print:bg-none print:border-gray-300">
              <div>
                <span className="text-xs text-slate-400 print:text-gray-600">Target Condition</span>
                <p className="text-lg font-extrabold text-white print:text-black">{selectedRecord.disease}</p>
              </div>
              <div>
                <span className="text-xs text-slate-400 print:text-gray-600">Diagnostic Result & Risk</span>
                <p className={`text-lg font-extrabold ${
                  selectedRecord.risk_level === 'High' ? 'text-rose-400' :
                  selectedRecord.risk_level === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
                } print:text-black`}>
                  {selectedRecord.result} ({selectedRecord.risk_level} Risk)
                </p>
              </div>
              <div>
                <span className="text-xs text-slate-400 print:text-gray-600">AI Confidence Score</span>
                <p className="text-lg font-extrabold text-cyan-400 print:text-black">{selectedRecord.confidence}%</p>
              </div>
            </div>

            {/* Section: Clinical Inputs Provided */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-200 print:text-black">Clinical Vitals & Input Parameters</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {selectedRecord.clinical_inputs && Object.entries(selectedRecord.clinical_inputs || {}).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-xl bg-dark-800 border border-slate-800 print:bg-gray-50 print:border-gray-200">
                    <span className="text-slate-500 print:text-gray-600 block truncate">{k}</span>
                    <span className="font-mono font-bold text-white print:text-black">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section: Explainable AI Clinical Analysis */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-200 print:text-black">Explainable AI Analysis Summary</h3>
              <div className="p-4 rounded-xl bg-dark-800/90 border border-slate-800 text-xs text-slate-200 whitespace-pre-line leading-relaxed print:bg-gray-50 print:text-black print:border-gray-200">
                {selectedRecord.ai_analysis_text}
              </div>
            </div>

            {/* Section: SHAP Feature Contributions */}
            {selectedRecord.shap_features && Array.isArray(selectedRecord.shap_features) && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 print:text-black">SHAP Feature Contributions</h3>
                
                <div className="print:hidden p-4 rounded-2xl bg-dark-800/60 border border-slate-800">
                  <SHAPChart features={selectedRecord.shap_features} baseValue={selectedRecord.shap_base_value} />
                </div>

                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 print:border-gray-300 print:text-black">
                      <th className="py-2 px-3">Feature Name</th>
                      <th className="py-2 px-3">Patient Value</th>
                      <th className="py-2 px-3">SHAP Impact Value</th>
                      <th className="py-2 px-3">Clinical Effect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 print:divide-gray-200">
                    {selectedRecord.shap_features.map((f: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/30 print:text-black">
                        <td className="py-2 px-3 font-medium text-white print:text-black">{f.feature_name}</td>
                        <td className="py-2 px-3 font-mono text-slate-300 print:text-black">{f.patient_value}</td>
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

            {/* Uploaded Reports Section if Available */}
            {selectedRecord.reports_used && Array.isArray(selectedRecord.reports_used) && selectedRecord.reports_used.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-200 print:text-black">Attached Medical Lab Reports</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedRecord.reports_used.map((rep: any) => (
                    <div key={rep.id} className="p-3 rounded-xl bg-dark-800 border border-slate-800 flex items-center justify-between print:bg-gray-50 print:border-gray-200">
                      <div>
                        <p className="font-bold text-white print:text-black">{rep.file_name}</p>
                        <p className="text-[10px] text-slate-400 print:text-gray-500">Uploaded Date: {rep.report_date}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] font-mono">PDF/Image</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blockchain Ledger Fingerprint */}
            {selectedRecord.blockchain_details && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1.5 text-xs print:bg-gray-50 print:border-gray-200 print:text-black">
                <div className="flex items-center gap-2 text-emerald-400 font-bold print:text-black">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Blockchain Tamper-Proof Fingerprint (Hardhat Ledger)</span>
                </div>
                <div className="font-mono text-[11px] text-slate-300 space-y-0.5 print:text-black">
                  <p>SHA-256 Hash: <span className="text-cyan-400 print:text-black">{selectedRecord.blockchain_details.sha256_hash}</span></p>
                  <p>Tx Hash: {selectedRecord.blockchain_details.tx_hash}</p>
                  <p>Block #{selectedRecord.blockchain_details.block_number} | Contract: {selectedRecord.blockchain_details.contract_address}</p>
                </div>
              </div>
            )}

            {/* Doctor Signature Block for Print */}
            <div className="hidden print:block pt-8 text-xs text-black border-t border-gray-300 mt-8">
              <div className="flex justify-between items-end">
                <div>
                  <p className="font-bold">Attending Physician: {selectedRecord.doctor_name}</p>
                  <p>Specialization: {selectedRecord.doctor_specialization}</p>
                  <p>Hospital: {selectedRecord.hospital_name}</p>
                </div>
                <div className="text-right">
                  <div className="w-40 border-b border-black mb-1"></div>
                  <p className="font-bold">Doctor's Digital Signature</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

import { ClinicalSummaryTable } from '../../components/ClinicalSummaryTable';
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Search, Stethoscope, Eye, X, Activity, FileText, Heart, ShieldCheck, User, Lock, Key, CheckCircle2, AlertCircle } from 'lucide-react';
import { SHAPChart } from '../../components/SHAPChart';

export const DoctorPatients: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected Patient Detail Modal State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientDetail, setPatientDetail] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Selected Record View inside Patient Modal
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  // Token Verification Modal State
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [targetUnlockRecord, setTargetUnlockRecord] = useState<any | null>(null);
  const [tokenInputCode, setTokenInputCode] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = () => {
    setLoading(true);
    api.get('/doctors/patients')
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : (Array.isArray(res.data?.patients) ? res.data.patients : []);
        setPatients(data);
      })
      .catch(err => {
        console.error(err);
        setPatients([]);
      })
      .finally(() => setLoading(false));
  };

  const openPatientModal = async (patientId: string) => {
    setSelectedPatientId(patientId);
    setLoadingDetail(true);
    setPatientDetail(null);
    try {
      const res = await api.get(`/doctors/patients/${patientId}`);
      setPatientDetail(res.data);
    } catch (err) {
      console.error('Failed to load patient details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const openRecordDetailModal = async (recordId: string) => {
    setLoadingRecord(true);
    try {
      const res = await api.get(`/doctors/records/${recordId}`);
      setSelectedRecord(res.data);
    } catch (err) {
      console.error('Failed to load record details:', err);
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleRedeemTokenForPatientRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenInputCode.trim()) return;
    setUnlockLoading(true);
    setUnlockError(null);

    try {
      const res = await api.post('/doctors/tokens/redeem', { token_code: tokenInputCode.trim() });
      setUnlockModalOpen(false);
      setTokenInputCode('');
      setTargetUnlockRecord(null);
      
      // Refresh patient details to update unlocked status
      if (selectedPatientId) {
        await openPatientModal(selectedPatientId);
      }
      
      // Also open the unlocked record modal
      if (res.data && res.data.record_id) {
        openRecordDetailModal(res.data.record_id);
      }
    } catch (err: any) {
      setUnlockError(err.response?.data?.detail || 'Token redemption failed. Verify token code.');
    } finally {
      setUnlockLoading(false);
    }
  };

  const triggerUnlockModal = (rec: any) => {
    setTargetUnlockRecord(rec);
    setTokenInputCode(rec.token_code || '');
    setUnlockError(null);
    setUnlockModalOpen(true);
  };

  const patientList = Array.isArray(patients) ? patients : [];
  const filtered = patientList.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.patient_code || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-cyan-400 text-center font-semibold">Loading Patient Registry...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Patient Registry & Clinical Profiles</h1>
          <p className="text-xs text-slate-400">View treated patients, physical vitals, medical history, and diagnostic records</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="bg-dark-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>


        </div>
      </div>

      {/* Patient Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-dark-800/50">
              <th className="py-3 px-4">Patient Code</th>
              <th className="py-3 px-4">Full Name</th>
              <th className="py-3 px-4">Age / Gender</th>
              <th className="py-3 px-4">Contact Information</th>
              <th className="py-3 px-4">Relationship Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-800/30 transition-all">
                <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{p.patient_code}</td>
                <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold text-[11px]">
                    {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                  <span>{p.name}</span>
                </td>
                <td className="py-3.5 px-4 text-slate-300">{p.dob} | {p.gender}</td>
                <td className="py-3.5 px-4 text-slate-400">{p.email || p.phone || 'N/A'}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    p.source === 'Treated by me' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    p.source === 'Accepted' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    p.source === 'Scheduled' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    (p.source === 'Rejected by me' || p.source === 'Rejected') ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {p.source === 'Scheduled' ? 'Scheduled (Pending)' :
                     p.source === 'Accepted' ? 'Accepted (Awaiting Analysis)' :
                     (p.source === 'Rejected by me' || p.source === 'Rejected') ? 'Rejected' :
                     p.source === 'Treated by me' ? 'Treated' : p.source}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openPatientModal(p.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all text-[11px] flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>View Details</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No patients found matching search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PATIENT DETAIL MODAL OVERLAY */}
      {selectedPatientId && (
        <div className="fixed inset-0 z-50 bg-dark-900/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 space-y-6 relative border border-slate-700 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-extrabold text-base">
                  {patientDetail?.patient?.name ? patientDetail.patient.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>{patientDetail?.patient?.name || 'Loading Patient...'}</span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
                      {patientDetail?.patient?.patient_code}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Comprehensive Clinical Profile & Diagnostic History</p>
                </div>
              </div>

              <button
                onClick={() => { setSelectedPatientId(null); setPatientDetail(null); }}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingDetail ? (
              <div className="py-16 text-center text-cyan-400 font-bold text-xs">Loading Patient Details from Database...</div>
            ) : patientDetail ? (
              <div className="space-y-6 text-xs">
                
                {/* Demographic & Contact Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-dark-800 border border-slate-800 space-y-1">
                    <span className="text-slate-500 block">Age / Gender</span>
                    <span className="font-bold text-white text-sm">{patientDetail.patient.dob} | {patientDetail.patient.gender}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-dark-800 border border-slate-800 space-y-1">
                    <span className="text-slate-500 block">Contact Phone</span>
                    <span className="font-bold text-white text-sm">{patientDetail.patient.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-dark-800 border border-slate-800 space-y-1">
                    <span className="text-slate-500 block">Email Address</span>
                    <span className="font-bold text-cyan-400 text-sm truncate block">{patientDetail.patient.email || 'N/A'}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-dark-800 border border-slate-800 space-y-1">
                    <span className="text-slate-500 block">Registered Date</span>
                    <span className="font-bold text-white text-sm">{patientDetail.patient.created_at}</span>
                  </div>
                </div>

                {/* Vitals & Health Attributes */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Physical Attributes & Clinical Vitals</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-dark-800/80 border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Height</span>
                      <span className="font-mono font-bold text-white text-sm">{patientDetail.health_profile?.height || 170} cm</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Weight</span>
                      <span className="font-mono font-bold text-white text-sm">{patientDetail.health_profile?.weight || 70} kg</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">BMI Index</span>
                      <span className="font-mono font-bold text-cyan-400 text-sm">
                        {patientDetail.health_profile?.bmi || 24.2} kg/m²
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Blood Pressure</span>
                      <span className="font-mono font-bold text-emerald-400 text-sm">
                        {patientDetail.health_profile?.blood_pressure || '120/80'} mmHg
                      </span>
                    </div>
                  </div>
                </div>

                {/* Medical History & Conditions */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Clinical Background & Medical History</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-dark-800 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-bold block">Medical History</span>
                      <p className="text-slate-200 leading-relaxed">{patientDetail.health_profile?.medical_history || 'None recorded'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-bold block">Known Allergies</span>
                      <p className="text-amber-400 leading-relaxed">{patientDetail.health_profile?.allergies || 'None recorded'}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-dark-800 border border-slate-800 space-y-1">
                      <span className="text-slate-400 font-bold block">Existing Conditions</span>
                      <p className="text-rose-400 leading-relaxed">{patientDetail.health_profile?.existing_conditions || 'None recorded'}</p>
                    </div>
                  </div>
                </div>

                {/* Diagnostic Records Table */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Patient Diagnostic History ({patientDetail.records?.length || 0} Reports)
                    </h3>
                  </div>

                  <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-dark-800/50">
                          <th className="py-2.5 px-3">Record Code</th>
                          <th className="py-2.5 px-3">Disease Model</th>
                          <th className="py-2.5 px-3">Relation</th>
                          <th className="py-2.5 px-3">Result & Risk</th>
                          <th className="py-2.5 px-3">Confidence</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {(patientDetail.records || []).map((r: any) => (
                          <tr key={r.record_id} className={`transition-all ${r.is_locked ? 'bg-purple-950/20 hover:bg-purple-950/30 border-l-2 border-purple-500' : 'hover:bg-slate-800/30'}`}>
                            <td className="py-2.5 px-3 font-mono font-bold text-cyan-400 flex items-center gap-1.5">
                              {r.is_locked && <Lock className="w-3.5 h-3.5 text-purple-400" />}
                              <span>{r.record_code}</span>
                            </td>
                            <td className="py-2.5 px-3 font-bold text-white">
                              {r.disease}
                              {r.is_locked && <span className="ml-2 text-[10px] text-purple-400 font-semibold">(Token Protected)</span>}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                r.relation === 'Treated' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              }`}>
                                {r.relation || (r.is_locked ? 'Shared' : 'Treated')}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              {r.is_locked ? (
                                <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 blur-[2px] select-none">
                                  🔒 Encrypted Results
                                </span>
                              ) : (
                                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  r.risk_level === 'High' ? 'bg-rose-500/20 text-rose-400' :
                                  r.risk_level === 'Moderate' ? 'bg-amber-500/20 text-amber-400' :
                                  'bg-emerald-500/20 text-emerald-400'
                                }`}>
                                  {r.result} ({r.risk_level} Risk)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-cyan-400">
                              {r.is_locked ? <span className="blur-[2px] select-none text-slate-500">99.9%</span> : `${r.confidence}%`}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">{r.date}</td>
                            <td className="py-2.5 px-3 text-right">
                              {r.is_locked ? (
                                <button
                                  onClick={() => {
                                    setSelectedPatientId(null);
                                    navigate('/doctor/token-redeemer');
                                  }}
                                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold transition-all text-[10px] flex items-center gap-1 ml-auto shadow-md shadow-purple-500/20"
                                >
                                  <Key className="w-3 h-3 text-purple-200" />
                                  <span>Unlock Report</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => openRecordDetailModal(r.record_id)}
                                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-dark-900 text-slate-200 font-bold transition-all text-[10px]"
                                >
                                  View Report
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {(patientDetail.records || []).length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500">
                              No diagnostic analysis records generated for this patient yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

      {/* RECORD DETAIL MODAL INSIDE PATIENT MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-dark-900/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass-panel w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 space-y-6 relative border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold">
                {selectedRecord.record_code}
              </span>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-extrabold text-white">AI HealthSecure — Clinical Analysis Report</h2>
                  <p className="text-slate-400">Target Condition: {selectedRecord.disease}</p>
                </div>
                <span className="text-cyan-400 font-bold text-sm">{selectedRecord.confidence}% Confidence</span>
              </div>

              <ClinicalSummaryTable summaryText={selectedRecord.ai_analysis_text} shapList={selectedRecord.shap_features} />

              {selectedRecord.shap_features && (
                <div className="space-y-2 pt-2">
                  <h3 className="font-bold text-white text-sm">SHAP Feature Contributions</h3>
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                    <SHAPChart features={selectedRecord.shap_features} baseValue={selectedRecord.shap_base_value} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TOKEN UNLOCK MODAL */}
      {unlockModalOpen && targetUnlockRecord && (
        <div className="fixed inset-0 z-50 bg-dark-900/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 space-y-5 border border-purple-500/40 shadow-2xl bg-gradient-to-b from-dark-800 via-slate-900 to-dark-900">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>Unlock Patient Access Token</span>
              </div>
              <button
                onClick={() => setUnlockModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-200 space-y-1">
                <span className="font-bold text-white block">Protected Report: {targetUnlockRecord.record_code}</span>
                <p className="text-[11px] text-slate-300">
                  Target Disease: <strong className="text-cyan-400">{targetUnlockRecord.disease}</strong>
                </p>
                <p className="text-[10px] text-purple-300">
                  Enter the token code shared by the patient to decrypt and unlock this analysis report.
                </p>
              </div>

              {unlockError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{unlockError}</span>
                </div>
              )}

              <form onSubmit={handleRedeemTokenForPatientRecord} className="space-y-4 pt-1">
                <div>
                  <label className="block text-slate-400 text-[11px] font-semibold mb-1.5">
                    Patient Sharing Token Code
                  </label>
                  <input
                    type="text"
                    required
                    value={tokenInputCode}
                    onChange={(e) => setTokenInputCode(e.target.value.toUpperCase())}
                    placeholder="PAT-XXXX-YYYY"
                    className="w-full bg-dark-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setUnlockModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={unlockLoading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-extrabold text-xs shadow-lg shadow-purple-500/20 flex items-center justify-center gap-1.5"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{unlockLoading ? 'Verifying Code...' : 'Redeem & Unlock'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

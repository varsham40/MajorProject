import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Share2, Key, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export const RecordSharingPage: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);

  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const [tokenCode, setTokenCode] = useState('');
  const [toHospitalId, setToHospitalId] = useState('');
  const [toDoctorId, setToDoctorId] = useState('');

  const [sharing, setSharing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Fetch patients, hospitals, doctors, records
    api.get('/doctors/patients').then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setPatients(data);
      if (data.length > 0) setSelectedPatientId(data[0].id);
    }).catch(err => {
      console.error(err);
      setPatients([]);
    });

    api.get('/admin/directory/hospitals-doctors').then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setHospitals(data);
      if (data.length > 0) {
        setToHospitalId(data[0].id);
        const docs = data[0].doctors || [];
        setDoctors(docs);
        if (docs.length > 0) setToDoctorId(docs[0].id);
      }
    }).catch(err => {
      console.error(err);
      setHospitals([]);
      setDoctors([]);
    });

    api.get('/doctors/records').then(res => {
      const data = Array.isArray(res.data) ? res.data : [];
      setRecords(data);
      if (data.length > 0) setSelectedRecordId(data[0].record_id);
    }).catch(err => {
      console.error(err);
      setRecords([]);
    });
  }, []);

  const handleShareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSharing(true);
    setMessage(null);

    try {
      const res = await api.post('/doctors/sharing/send', {
        patient_id: selectedPatientId,
        record_id: selectedRecordId,
        token_code: tokenCode,
        to_hospital_id: toHospitalId,
        to_doctor_id: toDoctorId
      });
      setMessage({ type: 'success', text: res.data.message });
      setTokenCode('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Sharing failed.' });
    } finally {
      setSharing(false);
    }
  };

  const patientList = Array.isArray(patients) ? patients : [];
  const recordList = Array.isArray(records) ? records : [];
  const hospitalList = Array.isArray(hospitals) ? hospitals : [];
  const doctorList = Array.isArray(doctors) ? doctors : [];

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Doctor-to-Doctor Record Sharing</h1>
        <p className="text-xs text-slate-400">Transfer medical records across healthcare organizations using patient-authorized access tokens</p>
      </div>

      <form onSubmit={handleShareSubmit} className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-6">
        <h2 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
          <Share2 className="w-5 h-5 text-cyan-400" />
          <span>Patient Consent Token Validation & Transfer</span>
        </h2>

        {message && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}>
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Step 1 — Receiving Hospital</label>
            <select
              value={toHospitalId}
              onChange={(e) => {
                const hId = e.target.value;
                setToHospitalId(hId);
                const selectedHosp = hospitalList.find((h: any) => h.id === hId);
                const docs = selectedHosp?.doctors || [];
                setDoctors(docs);
                if (docs.length > 0) setToDoctorId(docs[0].id);
                else setToDoctorId('');
              }}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              {hospitalList.map((h: any) => (
                <option key={h.id} value={h.id}>{h.name} ({h.email})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Step 2 — Receiving Doctor</label>
            <select
              value={toDoctorId}
              onChange={(e) => setToDoctorId(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              {doctorList.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name} — {d.specialization || 'Physician'} ({d.email})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Step 3 — Enter Patient Access Token</label>
          <div className="relative">
            <Key className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={tokenCode}
              onChange={(e) => setTokenCode(e.target.value)}
              placeholder="PAT-8F4K-92MX"
              className="w-full bg-dark-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono font-bold text-cyan-400 uppercase"
            />
          </div>
          <p className="text-[10px] text-slate-500">Token must be generated by the patient for your doctor and hospital credentials.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Step 4 — Select Patient</label>
            <select
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white"
            >
              {patientList.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.patient_code})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Step 5 — Select Medical Record to Transfer</label>
            <select
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
              className="w-full bg-dark-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono"
            >
              {recordList.map(r => (
                <option key={r.record_id} value={r.record_id}>{r.record_code} — {r.disease} ({r.patient_name})</option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={sharing}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4" />
          <span>{sharing ? 'Validating 6-AND Token & Transferring...' : 'Validate Token & Share Record'}</span>
        </button>
      </form>
    </div>
  );
};

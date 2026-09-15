import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Key, ShieldCheck, Copy, Check, Clock, Hospital, UserCheck, Plus, FileText, Trash2 } from 'lucide-react';

const formatTimestamp = (dateStr?: string | Date) => {
  if (!dateStr) return 'N/A';
  try {
    let s = String(dateStr);
    if (!s.endsWith('Z') && !s.includes('+') && !s.includes('IST')) {
      s += 'Z';
    }
    const d = new Date(s);
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

export const AccessSharingPage: React.FC = () => {
  const [tokens, setTokens] = useState<any[]>([]);
  const [myRecords, setMyRecords] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  
  const [selectedRecord, setSelectedRecord] = useState('ALL');
  const [selectedHospital, setSelectedHospital] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [expiryHours, setExpiryHours] = useState(24);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchInitialData = async () => {
    try {
      const [tokRes, recRes, hospRes] = await Promise.all([
        api.get('/patients/me/tokens'),
        api.get('/patients/me/records'),
        api.get('/hospitals/public')
      ]);
      setTokens(tokRes.data || []);
      setMyRecords(recRes.data || []);
      setHospitals(hospRes.data || []);

      if (hospRes.data && hospRes.data.length > 0) {
        const firstHospId = hospRes.data[0].id;
        setSelectedHospital(firstHospId);
        fetchDoctorsForHospital(firstHospId);
      } else {
        // Fallback fetch all doctors if no hospital list returned
        const allDocsRes = await api.get('/doctors');
        setDoctors(allDocsRes.data || []);
        if (allDocsRes.data && allDocsRes.data.length > 0) {
          setSelectedDoctor(allDocsRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching access sharing initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsForHospital = async (hospId: string) => {
    if (!hospId) {
      const allDocsRes = await api.get('/doctors');
      setDoctors(allDocsRes.data || []);
      if (allDocsRes.data && allDocsRes.data.length > 0) {
        setSelectedDoctor(allDocsRes.data[0].id);
      }
      return;
    }
    try {
      const docRes = await api.get(`/hospitals/${hospId}/doctors`);
      const docList = docRes.data || [];
      if (docList.length > 0) {
        setDoctors(docList);
        setSelectedDoctor(docList[0].id);
      } else {
        const fallbackDocs = await api.get('/doctors');
        setDoctors(fallbackDocs.data || []);
        if (fallbackDocs.data && fallbackDocs.data.length > 0) {
          setSelectedDoctor(fallbackDocs.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load doctors for hospital', err);
      try {
        const fallbackDocs = await api.get('/doctors');
        setDoctors(fallbackDocs.data || []);
        if (fallbackDocs.data && fallbackDocs.data.length > 0) {
          setSelectedDoctor(fallbackDocs.data[0].id);
        }
      } catch (fallbackErr) {
        console.error('Failed fallback doctor load:', fallbackErr);
      }
    }
  };

  const handleHospitalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const hospId = e.target.value;
    setSelectedHospital(hospId);
    fetchDoctorsForHospital(hospId);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleGenerateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);

    try {
      const res = await api.post('/patients/me/tokens/generate', {
        hospital_id: selectedHospital,
        doctor_id: selectedDoctor,
        record_id: selectedRecord === 'ALL' ? null : selectedRecord,
        expiry_hours: Number(expiryHours)
      });
      setGeneratedToken(res.data.token_code);
      fetchInitialData();
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyRowTokenToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(code);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDeleteToken = async (tokenId: string, tokenCode: string) => {
    if (!window.confirm(`Are you sure you want to revoke access token '${tokenCode}'? Doctors will no longer be able to access your report using this token.`)) {
      return;
    }
    setDeletingId(tokenId);
    try {
      await api.delete(`/patients/me/tokens/${tokenId}`);
      await fetchInitialData();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to revoke token.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="p-8 text-emerald-600 text-center font-semibold">Loading Access & Consent Sharing...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Patient Record Sovereignty & Access Sharing</h1>
        <p className="text-xs text-slate-500">Generate time-limited, report-specific access tokens to grant doctors access to your diagnostic reports</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Token Generation Form */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-cyan-500/30">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Key className="w-5 h-5 text-emerald-600" />
            <span>Authorize Patient Access Token</span>
          </h2>

          <form onSubmit={handleGenerateToken} className="space-y-4">
            {/* Select Specific Analysis Report */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Select Specific Medical Analysis Report</label>
              <select
                value={selectedRecord}
                onChange={(e) => setSelectedRecord(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Analysis Reports</option>
                {myRecords.map(r => (
                  <option key={r.record_id} value={r.record_id}>
                    [{r.record_code}] {r.disease} Report ({r.date})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Authorized Healthcare Organization (Hospital)</label>
              <select
                required
                value={selectedHospital}
                onChange={handleHospitalChange}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name} ({h.code})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Authorized Attending Physician (Doctor)</label>
              <select
                required
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                {doctors.length === 0 && <option value="">No doctors available at this hospital</option>}
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Token Duration (Hours)</label>
              <select
                value={expiryHours}
                onChange={(e) => setExpiryHours(Number(e.target.value))}
                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-cyan-500"
              >
                <option value={6}>6 Hours</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours (1 Day)</option>
                <option value={48}>48 Hours (2 Days)</option>
                <option value={168}>7 Days</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>{generating ? 'Authorizing Token...' : 'Generate Specific Access Token'}</span>
            </button>
          </form>

          {/* Generated Token Result Banner */}
          {generatedToken && (
            <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/40 space-y-2 text-center">
              <span className="text-xs text-slate-500 font-semibold">Authorized Access Token Code</span>
              <div className="flex items-center justify-center gap-2">
                <span className="text-xl font-mono font-extrabold text-emerald-600 tracking-wider">{generatedToken}</span>
                <button
                  onClick={() => copyToClipboard(generatedToken)}
                  className="p-1.5 rounded-lg bg-white hover:bg-slate-700 text-slate-600"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500">Share this token code with your doctor to authorize viewing of your report.</p>
            </div>
          )}
        </div>

        {/* Active Tokens Table */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-2 border border-slate-200/80">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Active Authorized Sharing Tokens</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-500">
                  <th className="py-2.5 px-3">Token Code</th>
                  <th className="py-2.5 px-3">Authorized Report</th>
                  <th className="py-2.5 px-3">Authorized Doctor & Hospital</th>
                  <th className="py-2.5 px-3">Expiration</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {tokens.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500 italic text-xs">
                      No active sharing tokens generated yet.
                    </td>
                  </tr>
                )}
                {tokens.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-100/30">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-emerald-600 text-xs tracking-wider">{t.token_code}</span>
                        <button
                          onClick={() => copyRowTokenToClipboard(t.token_code)}
                          title="Copy token code"
                          className="p-1 rounded-lg bg-white hover:bg-slate-700 text-slate-500 hover:text-cyan-300 transition-all border border-slate-200/60"
                        >
                          {copiedToken === t.token_code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {t.record_code ? `[${t.record_code}] ${t.disease_name}` : 'All Analysis Reports'}
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      <span className="font-semibold text-slate-800">{t.doctor_name || 'Dr. Rahul Sharma'}</span>
                      <br/>
                      <span className="text-[10px] text-slate-500">{t.hospital_name || 'Metro General Hospital'}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px]">{formatTimestamp(t.expires_at)}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        t.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDeleteToken(t.id, t.token_code)}
                        disabled={deletingId === t.id}
                        title="Revoke and delete this access token"
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-slate-800 border border-rose-500/30 text-[11px] font-bold transition-all flex items-center gap-1.5 ml-auto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{deletingId === t.id ? 'Revoking...' : 'Revoke'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

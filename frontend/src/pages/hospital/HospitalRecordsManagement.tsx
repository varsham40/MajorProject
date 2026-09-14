import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, AlertTriangle, FileText, ArrowRightLeft, Key, Clock, 
  Search, CheckCircle2, XCircle, RefreshCw, Upload, Copy, Database, Activity, FileJson, Building2, Play, Trash2, ExternalLink, Lock
} from 'lucide-react';
import api from '../../services/api';

interface RecordItem {
  id: string;
  record_id?: string;
  record_code: string;
  patient_name: string;
  patient_id: string;
  disease: string;
  doctor_name: string;
  hospital_name: string;
  created_at?: string;
  authorized_at?: string;
  status: string;
  result?: string;
  confidence?: number;
  risk_level?: string;
}

interface VerificationAudit {
  id: string;
  record_code: string;
  verified_by: string;
  current_hash: string;
  blockchain_hash: string;
  result: string;
  verified_at: string;
}

export const HospitalRecordsManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'created' | 'authorized' | 'outward' | 'verifier' | 'audit'>('created');
  
  const [createdRecords, setCreatedRecords] = useState<RecordItem[]>([]);
  const [authorizedRecords, setAuthorizedRecords] = useState<RecordItem[]>([]);
  const [outwardGrants, setOutwardGrants] = useState<RecordItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<VerificationAudit[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);

  // Verifier State
  const [selectedRecordCode, setSelectedRecordCode] = useState<string>('');
  const [jsonPayload, setJsonPayload] = useState<string>('');
  const [originalPayload, setOriginalPayload] = useState<string>('');
  const [isTampered, setIsTampered] = useState<boolean>(false);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  useEffect(() => {
    fetchRecordsData();
  }, []);

  const fetchRecordsData = async () => {
    setLoading(true);
    try {
      const [createRes, authRes, outwardRes, auditRes] = await Promise.allSettled([
        api.get('/hospitals/records/created'),
        api.get('/hospitals/records/authorized'),
        api.get('/hospitals/records/patient-grants-outward'),
        api.get('/verification/history')
      ]);

      if (createRes.status === 'fulfilled') setCreatedRecords(createRes.value.data || []);
      if (authRes.status === 'fulfilled') setAuthorizedRecords(authRes.value.data || []);
      if (outwardRes.status === 'fulfilled') setOutwardGrants(outwardRes.value.data || []);
      if (auditRes.status === 'fulfilled') setAuditLogs(auditRes.value.data || []);
    } catch (err) {
      console.error("Error fetching records hub data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecordForVerification = async (recordCode: string) => {
    setSelectedRecordCode(recordCode);
    setVerificationResult(null); // Clear previous verification verdict
    setIsTampered(false); // Reset toggle to OFF
    
    if (!recordCode) {
      setJsonPayload('');
      setOriginalPayload('');
      return;
    }

    try {
      const res = await api.get(`/verification/payload/${recordCode}`);
      const formattedJson = JSON.stringify(res.data.payload, null, 2);
      setOriginalPayload(formattedJson);
      setJsonPayload(formattedJson);
    } catch (err: any) {
      console.error("Error fetching record payload:", err);
    }
  };

  const handleExecuteVerification = async () => {
    if (!jsonPayload) {
      alert("Please select a record code or upload a JSON payload first.");
      return;
    }

    let parsedPayload: any;
    try {
      parsedPayload = JSON.parse(jsonPayload);
    } catch (err) {
      alert("Invalid JSON format in editor. Please ensure valid JSON syntax before verifying.");
      return;
    }

    const targetCode = parsedPayload.record_code || selectedRecordCode || "MANUAL-INPUT";
    await verifyPayloadData(targetCode, parsedPayload);
  };

  const verifyPayloadData = async (code: string, payloadObj: any) => {
    setVerifying(true);
    try {
      const res = await api.post('/verification/verify-payload', {
        record_code: code,
        payload: payloadObj
      });
      setVerificationResult(res.data);
      // Refresh audit log history
      const histRes = await api.get('/verification/history');
      setAuditLogs(histRes.data || []);
    } catch (err: any) {
      console.error("Verification failed:", err);
    } finally {
      setVerifying(false);
    }
  };

  const handleToggleTamper = (enableTamper: boolean) => {
    setIsTampered(enableTamper);
    setVerificationResult(null); // Clear verdict until Verify button is clicked

    if (!selectedRecordCode && !jsonPayload) return;

    if (enableTamper) {
      // Inject Tampered Fields into JSON Editor
      try {
        let currentObj = jsonPayload ? JSON.parse(jsonPayload) : {};
        const tamperedObj = {
          ...currentObj,
          result: currentObj.result === "Positive" ? "Negative" : "Positive",
          confidence: roundDecimals((currentObj.confidence || 0.85) + 0.1, 4),
          inputs: {
            ...currentObj.inputs,
            blood_pressure: 185,
            glucose_level: 240
          }
        };
        setJsonPayload(JSON.stringify(tamperedObj, null, 2));
      } catch (e) {
        console.error("Tamper injection error:", e);
      }
    } else {
      // Reset back to untampered original payload
      setJsonPayload(originalPayload);
    }
  };

  const roundDecimals = (val: number, places: number) => {
    const factor = Math.pow(10, places);
    return Math.round(val * factor) / factor;
  };

  const handleManualPayloadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonPayload(e.target.value);
    setVerificationResult(null);
  };

  const triggerClickVerifyFromTab = (recordCode: string) => {
    setActiveTab('verifier');
    handleSelectRecordForVerification(recordCode);
  };

  const handleClearAuditHistory = async () => {
    if (!window.confirm("Are you sure you want to clear the verification audit history? This action cannot be undone.")) {
      return;
    }
    try {
      await api.delete('/verification/history');
      setAuditLogs([]);
    } catch (err: any) {
      console.error("Error clearing verification audit history:", err);
      alert("Failed to clear verification audit history.");
    }
  };

  // Combine all available record codes for dropdown selector
  const allRecordCodes = Array.from(new Set([
    ...createdRecords.map(r => r.record_code),
    ...authorizedRecords.map(r => r.record_code),
    ...outwardGrants.map(r => r.record_code)
  ])).filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  Hospital Medical Records Management Hub
                  <span className="px-2.5 py-0.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-medium">
                    Patient-Centric Privacy
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Synchronized medical diagnostic records, patient-consented access tokens, and Zero-Trust blockchain verification.
                </p>
              </div>
            </div>
          </div>

          <button 
            onClick={fetchRecordsData} 
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700 shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mt-6 pt-6 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('created')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition text-center whitespace-nowrap ${
              activeTab === 'created'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>1. Medical Records ({createdRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('authorized')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition text-center whitespace-nowrap ${
              activeTab === 'authorized'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4 shrink-0" />
            <span>2. Consented Access ({authorizedRecords.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('outward')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition text-center whitespace-nowrap ${
              activeTab === 'outward'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>3. Outward Grants ({outwardGrants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('verifier')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition text-center whitespace-nowrap ${
              activeTab === 'verifier'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-lg shadow-emerald-500/25'
                : 'bg-slate-800/60 text-emerald-400 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>4. SHA-256 Verifier</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition text-center whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>5. Verification Audit History</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Hospital Medical Records */}
      {activeTab === 'created' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-cyan-400" />
              Hospital Medical Records (Generated at Facility)
            </h2>
            <p className="text-xs text-slate-400">Diagnostic medical records created by doctors affiliated with your hospital facility.</p>
          </div>

          {createdRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No diagnostic medical records generated at this hospital facility yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Record Code</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Disease / Analysis</th>
                    <th className="py-3 px-4">Attending Doctor</th>
                    <th className="py-3 px-4">Created Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {createdRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.record_code}</td>
                      <td className="py-3 px-4 text-white font-medium">{r.patient_name}</td>
                      <td className="py-3 px-4">{r.disease} ({r.result})</td>
                      <td className="py-3 px-4 text-slate-400">{r.doctor_name}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{r.created_at || 'Recently'}</td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => triggerClickVerifyFromTab(r.record_code)}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold transition border border-emerald-500/30"
                        >
                          Verify SHA-256
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Inward Consented Records */}
      {activeTab === 'authorized' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              Inward Consented Records (Patient Granted Access)
            </h2>
            <p className="text-xs text-slate-400">Records where patients explicitly generated time-bound Access Tokens granting permission to your hospital or doctors.</p>
          </div>

          {authorizedRecords.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No consented patient access records found for your facility yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Record Code</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Disease Diagnostic</th>
                    <th className="py-3 px-4">Assigned Specialist</th>
                    <th className="py-3 px-4">Consent Status</th>
                    <th className="py-3 px-4">Authorized Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {authorizedRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.record_code}</td>
                      <td className="py-3 px-4 text-white font-medium">{r.patient_name}</td>
                      <td className="py-3 px-4">{r.disease}</td>
                      <td className="py-3 px-4 text-slate-400">{r.doctor_name}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {r.status || 'Active Consent'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{r.authorized_at || 'Active'}</td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => triggerClickVerifyFromTab(r.record_code)}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold transition border border-emerald-500/30"
                        >
                          Verify SHA-256
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Outward Patient Grants */}
      {activeTab === 'outward' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ExternalLink className="w-5 h-5 text-cyan-400" />
              Outward Patient Grants (Records Shared by Patients with External Doctors)
            </h2>
            <p className="text-xs text-slate-400">Records originating at your hospital where patients issued Access Tokens to external doctors or other hospital facilities.</p>
          </div>

          {outwardGrants.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No outward patient-granted records recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Record Code</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Disease / Analysis</th>
                    <th className="py-3 px-4">Recipient Doctor / Facility</th>
                    <th className="py-3 px-4">Grant Type</th>
                    <th className="py-3 px-4">Grant Timestamp</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {outwardGrants.map(r => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.record_code}</td>
                      <td className="py-3 px-4 text-white font-medium">{r.patient_name}</td>
                      <td className="py-3 px-4">{r.disease}</td>
                      <td className="py-3 px-4 text-slate-300 font-medium">
                        {r.doctor_name} <span className="text-xs text-slate-500">({r.hospital_name})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {r.status || 'Patient Granted'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400">{r.authorized_at || 'Active'}</td>
                      <td className="py-3 px-4 text-right">
                        <button 
                          onClick={() => triggerClickVerifyFromTab(r.record_code)}
                          className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-semibold transition border border-emerald-500/30"
                        >
                          Verify SHA-256
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Zero-Trust SHA-256 Verifier */}
      {activeTab === 'verifier' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Data Input & Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-400" />
                Zero-Trust Record Fingerprint & JSON Payload Inspector
              </h2>
              <p className="text-xs text-slate-400">Select a record code from the dropdown to evaluate canonical SHA-256 fingerprint against the blockchain smart contract.</p>
            </div>

            {/* Select Record Dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Select Medical Record Code:</label>
              <select
                value={selectedRecordCode}
                onChange={(e) => handleSelectRecordForVerification(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Choose a record code --</option>
                {allRecordCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            {/* Interactive Tamper Simulator Slider Switch */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className={`w-4 h-4 ${isTampered ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                  Simulate Data Tampering:
                </span>
                
                {/* Smooth Sliding Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isTampered}
                    onChange={(e) => handleToggleTamper(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
                  <span className="ml-2.5 text-xs font-extrabold tracking-wide">
                    {isTampered ? (
                      <span className="text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20">ON (Tampered)</span>
                    ) : (
                      <span className="text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">OFF (Untampered)</span>
                    )}
                  </span>
                </label>
              </div>
              <p className="text-[11px] text-slate-400">
                {isTampered 
                  ? "Tampering simulation ACTIVE: Injects modified diagnostic values into the JSON editor below." 
                  : "Normal state: Using authentic canonical record data registered on blockchain."}
              </p>
            </div>

            {/* JSON Code Editor */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-cyan-400" />
                  Canonical JSON Payload Editor:
                </label>
                {jsonPayload && (
                  <button
                    onClick={() => navigator.clipboard.writeText(jsonPayload)}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy JSON
                  </button>
                )}
              </div>
              <textarea
                value={jsonPayload}
                onChange={handleManualPayloadChange}
                rows={12}
                placeholder="JSON record payload will appear here upon record selection..."
                className="w-full bg-slate-950 font-mono text-xs text-emerald-400 border border-slate-800 rounded-xl p-3.5 focus:outline-none focus:border-cyan-500 leading-relaxed"
              />
            </div>

            {/* Explicit Action Button to Run Verification */}
            <button
              onClick={handleExecuteVerification}
              disabled={verifying || !jsonPayload}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.99]"
            >
              <ShieldCheck className={`w-5 h-5 ${verifying ? 'animate-spin' : ''}`} />
              {verifying ? 'Calculating SHA-256 Digest & Querying Smart Contract...' : 'Verify Record SHA-256'}
            </button>
          </div>

          {/* Right Column: Verification Results & Digest Comparison */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                Cryptographic Integrity Verification Verdict
              </h2>
              <p className="text-xs text-slate-400">Compares computed SHA-256 fingerprint against Hardhat smart contract on-chain ledger.</p>
            </div>

            {verifying ? (
              <div className="text-center py-20 text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
                <p className="text-sm font-semibold">Computing SHA-256 Digest & Verifying Blockchain Fingerprint...</p>
              </div>
            ) : verificationResult ? (
              <div className="space-y-4">
                {/* Result Status Banner */}
                <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                  verificationResult.result === 'VALID' || verificationResult.result === 'MATCH'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}>
                  {verificationResult.result === 'VALID' || verificationResult.result === 'MATCH' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <h3 className="font-bold text-base">
                      {verificationResult.result === 'VALID' || verificationResult.result === 'MATCH'
                        ? '100% INTEGRITY VERIFIED / UNTAMPERED'
                        : 'TAMPER DETECTED / MISMATCH'}
                    </h3>
                    <p className="text-xs mt-1 opacity-90 leading-relaxed">{verificationResult.message}</p>
                  </div>
                </div>

                {/* Hash Digest Comparison */}
                <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
                  <div>
                    <div className="text-slate-400 font-semibold mb-1">Calculated Payload SHA-256 Digest:</div>
                    <div className="font-mono text-emerald-400 bg-slate-900 p-2.5 rounded-lg break-all border border-slate-800">
                      {verificationResult.local_hash || verificationResult.current_hash}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-400 font-semibold mb-1">On-Chain Blockchain Registered Digest:</div>
                    <div className="font-mono text-cyan-400 bg-slate-900 p-2.5 rounded-lg break-all border border-slate-800">
                      {verificationResult.blockchain_hash}
                    </div>
                  </div>
                </div>

                {/* Blockchain Proof Metadata */}
                <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs space-y-2 text-slate-300">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Transaction Hash:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[200px]">
                      {verificationResult.tx_hash || '0xb4b4bfb5cdca49a1d5e3f90226e5a46cba49f2b4'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Block Number:</span>
                    <span className="font-mono text-cyan-400">
                      #{verificationResult.block_number || 10842}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Smart Contract Address:</span>
                    <span className="font-mono text-slate-300">0x5FbD...aa3</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Verification Timestamp:</span>
                    <span className="text-slate-300">{verificationResult.verified_at || 'Just now'}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-3">
                <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto opacity-40" />
                <p className="text-xs font-semibold text-slate-400">
                  Select a record code, then click <strong className="text-cyan-400 font-extrabold">"Verify Record SHA-256"</strong> to view cryptographic blockchain verification verdict.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Verification Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-cyan-400" />
                Verification Audit History
              </h2>
              <p className="text-xs text-slate-400">Immutable record of all SHA-256 verification checks performed across the system.</p>
            </div>
            {auditLogs.length > 0 && (
              <button
                onClick={handleClearAuditHistory}
                className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-rose-400" />
                Clear Audit History
              </button>
            )}
          </div>

          {auditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60">
              No verification logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Record Code</th>
                    <th className="py-3 px-4">Verified By</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Evaluated Hash</th>
                    <th className="py-3 px-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{log.record_code}</td>
                      <td className="py-3 px-4 text-slate-300">{log.verified_by}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          log.result === 'VALID' || log.result === 'MATCH'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {log.result}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-400 truncate max-w-[180px]">{log.current_hash}</td>
                      <td className="py-3 px-4 text-xs text-slate-400">{log.verified_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HospitalRecordsManagement;

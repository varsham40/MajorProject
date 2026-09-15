import { ClinicalSummaryTable } from '../../components/ClinicalSummaryTable';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { SHAPChart } from '../../components/SHAPChart';
import { 
  Stethoscope, 
  Cpu, 
  Activity, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  FileText, 
  UserCheck, 
  AlertCircle, 
  Calendar, 
  Key, 
  Search, 
  FolderOpen,
  User,
  Heart,
  Save,
  Check
} from 'lucide-react';

export const NewAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const [appointmentCode, setAppointmentCode] = useState('');
  const [appointmentDetail, setAppointmentDetail] = useState<any>(null);
  const [loadingApt, setLoadingApt] = useState(false);
  const [aptError, setAptError] = useState<string | null>(null);

  const [diseaseKey, setDiseaseKey] = useState('diabetes');
  const [formSpec, setFormSpec] = useState<any>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [loadingSpec, setLoadingSpec] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const location = useLocation();

  // Listen to URL location search changes so when doctor clicks "Start AI Clinical Analysis" card, it dynamically loads patient details immediately!
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const urlAptCode = searchParams.get('appointment_code');
    if (urlAptCode) {
      setAppointmentCode(urlAptCode);
      fetchAppointmentDetail(urlAptCode);
    }
  }, [location.search]);

  const fetchAppointmentDetail = async (code: string) => {
    if (!code.trim()) return;
    setLoadingApt(true);
    setAptError(null);
    setAppointmentDetail(null);
    setSavedSuccess(false);

    try {
      const res = await api.get(`/appointments/detail/${code.trim()}`);
      const data = res.data || {};
      setAppointmentDetail(data);

      // Auto-set disease model based on appointment target disease
      const targetDis = (data.appointment?.reason || data.appointment?.target_disease || '').toLowerCase();
      if (targetDis.includes('heart')) setDiseaseKey('heart_disease');
      else if (targetDis.includes('kidney') || targetDis.includes('ckd')) setDiseaseKey('kidney_disease');
      else if (targetDis.includes('liver')) setDiseaseKey('liver_disease');
      else if (targetDis.includes('parkinson')) setDiseaseKey('parkinsons');
      else if (targetDis.includes('thyroid')) setDiseaseKey('thyroid_disease');
      else setDiseaseKey('diabetes');

    } catch (err: any) {
      console.error(err);
      setAptError(err.response?.data?.detail || `Appointment '${code}' not found.`);
    } finally {
      setLoadingApt(false);
    }
  };

  const handleAptLookup = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAppointmentDetail(appointmentCode);
  };

  // Fetch dynamic feature specification whenever disease selection changes
  useEffect(() => {
    if (!diseaseKey) return;
    setLoadingSpec(true);
    setPredictionResult(null);

    api.get(`/doctors/analysis/form-spec/${diseaseKey}`)
      .then(res => {
        const spec = res.data || {};
        const feats = Array.isArray(spec.features) ? spec.features : [];
        setFormSpec({ ...spec, features: feats });
        
        // Prepopulate default form values from patient health profile
        const hp = appointmentDetail?.health_profile || {};
        const defaults: Record<string, any> = {};
        feats.forEach((f: any) => {
          const fname = (f.name || '').toLowerCase();
          if (fname.includes('pregnancies') || fname.includes('pregnancy')) {
            // Set 0 by default for both Male and Female (Female can edit during analysis)
            defaults[f.name] = 0;
          } else if (fname.includes('bmi') && hp.bmi) {
            defaults[f.name] = hp.bmi;
          } else if ((fname.includes('height') || fname === 'height') && hp.height) {
            defaults[f.name] = hp.height;
          } else if ((fname.includes('weight') || fname === 'weight') && hp.weight) {
            defaults[f.name] = hp.weight;
          } else if (f && f.options && Array.isArray(f.options) && f.options.length > 0) {
            defaults[f.name] = f.options[0];
          } else if (f && f.name) {
            defaults[f.name] = f.min !== undefined ? (f.min + (f.max || 100)) / 2 : 0;
          }
        });
        setFormValues(defaults);
      })
      .catch(err => {
        console.error(err);
        setFormSpec({ features: [] });
      })
      .finally(() => setLoadingSpec(false));
  }, [diseaseKey, appointmentDetail]);

  const handleInputChange = (name: string, value: any) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  };

    const renderSummaryContent = (text: string, shapList: any[] = []) => {
    if (!text) return null;
    const lines = text.split('\n');
    const metaLines = lines.filter(l => !l.includes('|'));
    const tableLines = lines.filter(l => l.includes('|') && !l.includes('---'));

    if (tableLines.length === 0) {
      return (
        <div className="p-4 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 whitespace-pre-line leading-relaxed">
          {text}
        </div>
      );
    }

    const headers = tableLines[0].split('|').map(s => s.trim()).filter(Boolean);
    const rows = tableLines.slice(1).map(l => l.split('|').map(s => s.trim()).filter(Boolean));

    const checkIsRisk = (row: string[]) => {
      const pName = (row[0] || '').toLowerCase();
      const vText = (row[1] || '').toLowerCase();
      const aText = (row[2] || '').toLowerCase();

      if (Array.isArray(shapList) && shapList.length > 0) {
        const match = shapList.find((f: any) => {
          const fn = (f.feature_name || '').toLowerCase();
          const rn = (f.raw_name || '').toLowerCase();
          return pName.includes(fn) || pName.includes(rn) || fn.includes(pName) || rn.includes(pName);
        });
        if (match) {
          if (match.effect === 'Increased Risk' || match.shap_value > 0.005) return true;
          if (match.effect === 'Decreased Risk' || match.shap_value < -0.005) return false;
        }
      }

      const riskKws = [
        'hypertension', 'elevated', 'abnormal', 'impaired', 'severely', 'stage 2', 'stage 1',
        'incompetence', 'ischemia', 'blockage', 'blocked', 'defect', 'positive indicator',
        'proteinuria', 'anemia', 'hyperbilirubinemia', 'hyperglycemia', 'obesity', 'subnormal',
        'flat', 'downsloping', 'hypertrophy', 'high positive', 'increased risk', 'disease', 'pathology'
      ];
      const combined = `${pName} ${vText} ${aText}`;
      return riskKws.some(kw => combined.includes(kw));
    };

    return (
      <div className="space-y-4">
        {/* Top Header Metadata Badges */}
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-[#f4f7f6] border border-slate-200/80 text-xs">
          {metaLines.map((ml, idx) => {
            if (!ml.trim()) return null;
            const parts = ml.split(':');
            const k = parts[0];
            const v = parts.slice(1).join(':');
            return (
              <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200/80">
                <span className="text-slate-500 font-semibold">{k?.trim()}:</span>
                <span className="text-emerald-600 font-bold">{v?.trim()}</span>
              </div>
            );
          })}
        </div>

        {/* Dynamic Compact Clinical Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-white border-b border-slate-200/80 text-emerald-600 font-extrabold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3.5 w-[24%] border-r border-slate-200/80/60">{headers[0]}</th>
                <th className="py-2.5 px-3.5 w-[26%] border-r border-slate-200/80/60">{headers[1]}</th>
                <th className="py-2.5 px-3.5 w-[50%]">{headers[2]}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-700">
              {rows.map((row, rIdx) => {
                const isRisk = checkIsRisk(row);

                return (
                  <tr
                    key={rIdx}
                    className={`transition-colors border-l-4 ${
                      isRisk
                        ? 'bg-rose-950/25 hover:bg-rose-950/45 border-l-rose-500'
                        : 'bg-white hover:bg-white border-l-emerald-500/50'
                    }`}
                  >
                    {/* Field / Parameter */}
                    <td className="py-2.5 px-3.5 font-bold border-r border-slate-200/80/40 w-[24%]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={isRisk ? 'text-rose-200 font-bold' : 'text-slate-700 font-semibold'}>{row[0]}</span>
                        {isRisk && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm flex-shrink-0">
                            Risk Factor
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Patient Value */}
                    <td className="py-2.5 px-3.5 border-r border-slate-200/80/40 w-[26%]">
                      <span className={`inline-block font-mono font-bold text-[11px] px-2.5 py-1 rounded-md border ${
                        isRisk
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-500/10'
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      }`}>
                        {row[1]}
                      </span>
                    </td>

                    {/* Medical Significance & Risk Analysis */}
                    <td className={`py-2.5 px-3.5 leading-snug w-[50%] text-xs ${
                      isRisk ? 'text-rose-100/90 font-medium' : 'text-slate-600'
                    }`}>
                      {row[2]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleRunPrediction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentDetail?.patient?.id) {
      setErrorMsg('Please enter and validate an Appointment Code before running diagnostic analysis.');
      return;
    }
    setErrorMsg(null);
    setPredicting(true);

    try {
      const formattedInputs: Record<string, any> = {};
      Object.keys(formValues).forEach(k => {
        const v = formValues[k];
        if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) {
          formattedInputs[k] = parseFloat(v);
        } else {
          formattedInputs[k] = v;
        }
      });

      const res = await api.post('/doctors/analysis/predict', {
        patient_id: appointmentDetail.patient.id,
        disease_key: diseaseKey,
        inputs: formattedInputs,
        appointment_code: appointmentDetail.appointment?.appointment_code || appointmentCode
      });
      setPredictionResult(res.data);
      setSavedSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to run prediction analysis.');
    } finally {
      setPredicting(false);
    }
  };

  const featureList = formSpec && Array.isArray(formSpec.features) ? formSpec.features : [];
  const shapFeatureList = predictionResult?.shap_explanation?.features && Array.isArray(predictionResult.shap_explanation.features)
    ? predictionResult.shap_explanation.features
    : [];

  const pat = appointmentDetail?.patient;
  const hp = appointmentDetail?.health_profile;
  const apt = appointmentDetail?.appointment;
  const reports = appointmentDetail?.reports || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 font-bold">Clinical Patient Diagnostic Engine</h1>
        <p className="text-xs text-slate-500 mt-1">
          Perform Explainable AI disease inference, register SHA-256 blockchain fingerprint, and complete patient consultations.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Appointment Token / Code Search Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 space-y-3 shadow-xl">
        <h2 className="text-sm font-extrabold text-slate-900 font-bold flex items-center gap-2">
          <Key className="w-4 h-4 text-emerald-600" />
          <span>Enter Patient Appointment Token / Session Code (e.g. APT-82914)</span>
        </h2>

        <form onSubmit={handleAptLookup} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            required
            value={appointmentCode}
            onChange={(e) => setAppointmentCode(e.target.value.toUpperCase())}
            placeholder="APT-XXXXX"
            className="flex-1 bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-emerald-600 tracking-wider focus:outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            disabled={loadingApt}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>{loadingApt ? 'Validating Token...' : 'Load Patient Session'}</span>
          </button>
        </form>

        {aptError && (
          <p className="text-xs text-rose-400 font-medium">{aptError}</p>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Patient Meta Details & Clinical Inputs */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* PROMINENT PATIENT META DETAILS CARD ABOVE MODEL SELECTION */}
          {pat ? (
            <div className="bg-white border border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-xl relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-emerald-600 font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{pat.name}</h3>
                    <p className="text-xs text-emerald-600 font-mono font-semibold">Code: {pat.patient_code}</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                  Verified Patient
                </span>
              </div>

              {/* Comprehensive Vitals & Background Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#f4f7f6]/60 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 text-[10px] block">Gender & DOB</span>
                  <span className="text-slate-700 font-bold mt-0.5 block">{pat.gender} | {pat.dob}</span>
                </div>
                <div className="bg-[#f4f7f6]/60 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-slate-500 text-[10px] block">Appointment Slot</span>
                  <span className="text-emerald-400 font-bold mt-0.5 block">{apt?.appointment_time || '10:00 AM'}</span>
                </div>
                {hp && (
                  <>
                    <div className="bg-[#f4f7f6]/60 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 text-[10px] block">BMI / Blood Pressure</span>
                      <span className="text-slate-700 font-semibold mt-0.5 block">{hp.bmi || '24.0'} | {hp.blood_pressure || '120/80'}</span>
                    </div>
                    <div className="bg-[#f4f7f6]/60 p-2.5 rounded-xl border border-slate-200/80">
                      <span className="text-slate-500 text-[10px] block">Existing Conditions</span>
                      <span className="text-slate-700 truncate block mt-0.5">{hp.existing_conditions || 'None'}</span>
                    </div>
                  </>
                )}
              </div>

              {apt?.reason && (
                <div className="bg-[#f4f7f6]/50 p-2.5 rounded-xl border border-slate-200/80 text-xs">
                  <span className="text-slate-500 font-medium text-[10px] block">Consultation Reason:</span>
                  <span className="text-slate-700 font-medium">{apt.reason}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 text-xs text-slate-500 text-center space-y-2">
              <UserCheck className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
              <p className="font-semibold text-slate-600">No Patient Selected Yet</p>
              <p className="text-[11px] text-slate-500">
                Enter an appointment code above or click "Start Analysis" from your appointment list.
              </p>
            </div>
          )}

          {/* Model Selection & Inputs */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 font-bold flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-emerald-600" />
              <span>Diagnostic AI Model Selection</span>
            </h2>

            {/* Target Model Selection Dropdown */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1.5 uppercase tracking-wider">Select AI Model *</label>
              <select
                value={diseaseKey}
                onChange={(e) => setDiseaseKey(e.target.value)}
                className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-4 py-2.5 text-xs text-emerald-600 font-bold focus:outline-none focus:border-cyan-500"
              >
                <option value="diabetes">Diabetes Diagnostic Model</option>
                <option value="heart_disease">Heart Disease Risk Model</option>
                <option value="kidney_disease">Kidney Disease (CKD) Model</option>
                <option value="liver_disease">Liver Disease Model</option>
                <option value="thyroid_disease">Thyroid Disease Model</option>
              </select>
            </div>

            {/* Dynamic Form Inputs */}
            {loadingSpec ? (
              <div className="py-6 text-xs text-emerald-600 text-center">Loading clinical feature schema...</div>
            ) : (
              <form onSubmit={handleRunPrediction} className="space-y-4 pt-3 border-t border-slate-200/80">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fill Clinical Parameters</h3>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                  {featureList.map((f: any) => {
                    const fname = (f.name || '').toLowerCase();
                    const isPreg = fname.includes('pregnancies') || fname.includes('pregnancy');
                    const isMale = (pat?.gender || '').toUpperCase() === 'MALE' || (pat?.gender || '').toUpperCase() === 'M';
                    const isDisabled = isPreg && isMale;

                    return (
                      <div key={f.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <label className="font-semibold text-slate-600">
                            {f.label}
                            {isPreg && isMale && (
                              <span className="ml-1.5 text-[10px] text-slate-500 font-normal">
                                (Default 0 for Male - Locked)
                              </span>
                            )}
                          </label>
                          {f.unit && <span className="text-slate-500 text-[10px]">{f.unit}</span>}
                        </div>

                        {f.options && Array.isArray(f.options) ? (
                          <select
                            value={formValues[f.name] ?? f.options[0]}
                            onChange={(e) => handleInputChange(f.name, e.target.value)}
                            disabled={isDisabled}
                            className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {f.options.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            inputMode="decimal"
                            value={isDisabled ? '0' : (formValues[f.name] !== undefined && formValues[f.name] !== null ? formValues[f.name] : '')}
                            onChange={(e) => handleInputChange(f.name, e.target.value)}
                            onClick={(e) => (e.target as HTMLInputElement).select()}
                            disabled={isDisabled}
                            placeholder={`Enter value (min ${f.min ?? 0})`}
                            className="w-full bg-[#f4f7f6] border border-slate-200/80 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold font-mono disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500/50 cursor-text selection:bg-cyan-500/30"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={predicting || !pat}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-slate-950 font-bold text-xs shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all hover:opacity-90"
                >
                  <Save className="w-4 h-4" />
                  <span>{predicting ? 'Executing Analysis & Saving Report...' : 'Run AI Prediction & Save Analysis Report'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Prediction Results, SHAP Contributions & Completion Controls */}
        <div className="bg-white p-6 rounded-2xl lg:col-span-2 border border-slate-200/80 space-y-6">
          {!predictionResult ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-slate-500 space-y-3">
              <Stethoscope className="w-16 h-16 stroke-1 text-slate-600 opacity-60" />
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-slate-600">Ready for Clinical Evaluation</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Validate patient appointment details, enter lab vitals, and click "Run AI Prediction & Save Analysis Report".
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Completion Banner */}
              {savedSuccess && (
                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Appointment COMPLETED & Clinical Report Saved</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-600 text-slate-900 font-bold text-[10px] uppercase">
                      Status: Closed
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed font-medium">
                    The appointment session <span className="font-bold text-slate-900 font-bold">{apt?.appointment_code || appointmentCode}</span> has been closed and marked as <span className="font-bold text-emerald-400">COMPLETED</span>. The diagnostic report is saved for both Dr. and Patient <span className="font-bold text-slate-900 font-bold">{pat?.name}</span>.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => navigate('/doctor/records')}
                      className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center gap-1.5"
                    >
                      <FileText className="w-4 h-4" /> View All Saved Records
                    </button>
                    <button
                      onClick={() => navigate('/doctor/appointments')}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Calendar className="w-4 h-4" /> Return to Appointments
                    </button>
                  </div>
                </div>
              )}

                            {/* Diagnostic Result Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs text-slate-700 dark:text-slate-400 font-extrabold block">Diagnostic Output</span>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{predictionResult.result}</h2>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono font-bold">Record Code: {predictionResult.record_code}</p>
                </div>

                <div className="text-right space-y-1">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    predictionResult.risk_level === 'High' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-400 border border-rose-300 dark:border-rose-800/80' :
                    predictionResult.risk_level === 'Moderate' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-400 border border-amber-300 dark:border-amber-800/80' :
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800/80'
                  }`}>
                    {predictionResult.risk_level} Risk
                  </span>
                  <p className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{predictionResult.confidence}% Confidence</p>
                </div>
              </div>

              {/* AI Analysis Summary */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-700">Summary</h3>
                <ClinicalSummaryTable summaryText={predictionResult.ai_analysis_text} shapList={shapFeatureList} />
              </div>

              {/* SHAP Contributions */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-700">SHAP Risk Contribution Breakdown</h3>
                <div className="p-4 rounded-2xl bg-[#f4f7f6]/60 border border-slate-200/80">
                  <SHAPChart
                    features={shapFeatureList}
                    baseValue={predictionResult.shap_explanation?.base_value || 0}
                  />
                </div>

                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-500">
                      <th className="py-2 px-3">Clinical Feature</th>
                      <th className="py-2 px-3">Value</th>
                      <th className="py-2 px-3">SHAP Value</th>
                      <th className="py-2 px-3">Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {shapFeatureList.map((f: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-100/30">
                        <td className="py-2 px-3 font-medium text-slate-900 font-bold">{f.feature_name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{f.patient_value}</td>
                        <td className="py-2 px-3 font-mono font-bold">{f.shap_value > 0 ? `+${f.shap_value}` : f.shap_value}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            f.effect === 'Increased Risk' ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {f.effect}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Blockchain Fingerprint Confirmation */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1 text-xs">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>SHA-256 Fingerprint Registered on Hardhat Blockchain Contract</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono">
                  Record ID: {predictionResult.record_id} | Record Code: {predictionResult.record_code}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

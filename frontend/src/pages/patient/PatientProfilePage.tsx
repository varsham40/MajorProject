import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { User, Stethoscope, Building2, FileText, Calendar, Edit3, Save, X, CheckCircle2, AlertCircle, Activity, Heart } from 'lucide-react';

export const PatientProfilePage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Edit form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [bloodPressure, setBloodPressure] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [allergies, setAllergies] = useState('');
  const [existingConditions, setExistingConditions] = useState('');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    setLoading(true);
    api.get('/patients/me/health')
      .then(res => {
        const d = res.data || {};
        setData(d);
        const p = d.patient || {};
        const hp = d.health_profile || {};

        setName(p.name || '');
        setEmail(p.email || '');
        setPhone(p.phone || '');
        setGender(p.gender || 'Male');
        setDob(p.dob || '');
        setAddress(p.address || '');

        setHeight(hp.height || '');
        setWeight(hp.weight || '');
        setBloodPressure(hp.blood_pressure || '');
        setMedicalHistory(hp.medical_history || '');
        setAllergies(hp.allergies || '');
        setExistingConditions(hp.existing_conditions || '');
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    setErrorMsg(null);

    try {
      await api.put('/patients/me/profile', {
        name,
        email,
        phone,
        gender,
        dob,
        address,
        height: height === '' ? null : Number(height),
        weight: weight === '' ? null : Number(weight),
        blood_pressure: bloodPressure,
        medical_history: medicalHistory,
        allergies,
        existing_conditions: existingConditions
      });
      setMsg('Profile & health metrics updated successfully!');
      setIsEditModalOpen(false);
      fetchProfile();
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setErrorMsg(err.response?.data?.detail || 'Failed to update patient profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-cyan-400 text-center font-semibold animate-pulse">Loading Patient Profile...</div>;

  const p = data?.patient || {};
  const hp = data?.health_profile || {};

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Patient Profile & Health File</h1>
          <p className="text-xs text-slate-400">Personal information, clinical health metrics, and medical history</p>
        </div>

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 cursor-pointer w-fit"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile & Health Details</span>
        </button>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Identity */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 text-center border border-slate-800">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 mx-auto flex items-center justify-center text-dark-900 font-extrabold text-3xl shadow-xl shadow-cyan-500/20">
            {p.name ? p.name[0] : 'P'}
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">{p.name || 'Patient'}</h2>
            <span className="inline-block mt-1 text-[11px] font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              {p.patient_code || 'PAT-0000'}
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-2 pt-4 border-t border-slate-800 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Email:</span>
              <span className="font-semibold text-white">{p.email || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Phone:</span>
              <span className="font-semibold text-white">{p.phone || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Gender:</span>
              <span className="font-semibold text-white">{p.gender || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Date of Birth:</span>
              <span className="font-semibold text-white">{p.dob || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Address:</span>
              <span className="font-semibold text-white">{p.address || 'Central City'}</span>
            </div>
          </div>
        </div>

        {/* Right Section: Clinical Metrics & Health Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* Health Metrics Grid */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-800">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Biometric & Clinical Vitals</span>
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Height</span>
                <span className="text-base font-extrabold text-white">{hp?.height ? `${hp.height} cm` : 'N/A'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Weight</span>
                <span className="text-base font-extrabold text-white">{hp?.weight ? `${hp.weight} kg` : 'N/A'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">BMI</span>
                <span className="text-base font-extrabold text-cyan-400">{hp?.bmi ? hp.bmi : 'N/A'}</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Blood Pressure</span>
                <span className="text-base font-extrabold text-emerald-400">{hp?.blood_pressure || '120/80'}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Medical History:</span>
                <p className="text-slate-200">{hp?.medical_history || 'No recorded major medical history.'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Allergies & Drug Reactions:</span>
                <p className="text-amber-300 font-medium">{hp?.allergies || 'No known drug allergies.'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-slate-400 font-semibold block mb-1">Chronic Conditions:</span>
                <p className="text-slate-200">{hp?.existing_conditions || 'None reported.'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-5 my-8 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-cyan-400" />
                <span>Edit Patient Profile & Health File</span>
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={bloodPressure}
                    onChange={(e) => setBloodPressure(e.target.value)}
                    placeholder="e.g. 120/80"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 175"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? Number(e.target.value) : '')}
                    placeholder="e.g. 70"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Residential Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Medical History</label>
                <textarea
                  rows={2}
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  placeholder="Previous surgeries, hospitalizations, major illnesses..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Allergies & Reactions</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Peanuts, Pollen"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Chronic Conditions</label>
                <input
                  type="text"
                  value={existingConditions}
                  onChange={(e) => setExistingConditions(e.target.value)}
                  placeholder="e.g. Type 2 Diabetes, Hypertension"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-cyan-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-extrabold shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfilePage;

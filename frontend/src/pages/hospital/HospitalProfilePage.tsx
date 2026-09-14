import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { Building2, ShieldCheck, Mail, Phone, MapPin, Edit3, Save, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export const HospitalProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [changingPw, setChangingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = () => {
    setLoading(true);
    api.get('/hospitals/me')
      .then(res => {
        const d = res.data || {};
        setProfile(d);
        setName(d.name || '');
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setAddress(d.address || '');
        setLicenseNumber(d.license_number || '');
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
      await api.put('/hospitals/profile/me', {
        name,
        email,
        phone,
        address,
        license_number: licenseNumber
      });
      setMsg('Organization profile updated successfully!');
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to update hospital profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw.trim()) {
      setPwError('Current password is required.');
      return;
    }
    if (newPw.length < 6) {
      setPwError('New password must be at least 6 characters long.');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('New passwords do not match.');
      return;
    }

    setPwError(null);
    setPwMsg(null);
    setChangingPw(true);

    try {
      await api.post('/auth/change-password', {
        current_password: currentPw.trim(),
        new_password: newPw.trim(),
      });
      setPwMsg('Security password updated successfully!');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err: any) {
      console.error(err);
      setPwError(err.response?.data?.detail || 'Failed to update password.');
    } finally {
      setChangingPw(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-cyan-400 text-center font-semibold animate-pulse">Loading Hospital Profile...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Healthcare Organization Profile</h1>
        <p className="text-xs text-slate-400">Institutional credentials, facility contact details, and node security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Hospital Identity Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 text-center flex flex-col items-center justify-between border border-slate-800">
          <div className="space-y-4 w-full">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-500 to-cyan-400 mx-auto flex items-center justify-center text-dark-900 font-extrabold text-4xl shadow-xl shadow-purple-500/20">
              <Building2 className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-xl font-extrabold text-white">{profile?.name || 'Main Hospital'}</h2>
              <p className="text-xs text-purple-400 font-bold mt-0.5">Verified Medical Organization</p>
              <span className="inline-block mt-2 text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                {profile?.id ? `HOSP-${profile.id.substring(0, 5).upper()}` : 'HOSP-1001'}
              </span>
            </div>

            <div className="w-full text-xs text-left space-y-2 pt-4 border-t border-slate-800 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Contact Email:</span>
                <span className="font-semibold text-white">{profile?.email || user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facility Phone:</span>
                <span className="font-semibold text-white">{profile?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">License Number:</span>
                <span className="font-mono text-purple-300 font-bold">{profile?.license_number || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-slate-800 text-left">
            <span className="text-[11px] text-slate-500 block mb-1">Ledger Node Status:</span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
              <ShieldCheck className="w-3 h-3" />
              <span>Zero-Trust SHA-256 Node Active</span>
            </span>
          </div>
        </div>

        {/* Right Column: Edit Profile & Password */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit Hospital Details */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-purple-400" />
              <span>Edit Organization Details</span>
            </h2>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {msg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{msg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Facility Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 800-555-0199"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">License / Accreditation</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. REG-HOSP-2026"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Facility Street Address</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Complete hospital physical location address..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all hover:opacity-90 flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save Organization Profile'}</span>
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span>Organization Password Management</span>
            </h2>

            {pwError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{pwError}</span>
              </div>
            )}

            {pwMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{pwMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:border-purple-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPw}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>{changingPw ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalProfilePage;

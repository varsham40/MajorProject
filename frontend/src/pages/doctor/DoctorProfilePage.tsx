import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  Stethoscope, Building2, Mail, ShieldCheck, User, Phone, Award, 
  Save, Lock, AlertCircle, CheckCircle2 
} from 'lucide-react';

export const DoctorProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form state
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

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
    api.get('/doctors/profile/me')
      .then(res => {
        const d = res.data || {};
        setProfile(d);
        setName(d.name || '');
        setSpecialization(d.specialization || '');
        setDepartment(d.department || '');
        setPhone(d.phone || '');
        setLicenseNumber(d.license_number || '');
        setBio(d.bio || '');
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMsg(null);
    setProfileError(null);

    try {
      await api.put('/doctors/profile/me', {
        name,
        specialization,
        department,
        phone,
        license_number: licenseNumber,
        bio,
      });
      setProfileMsg('Profile details updated successfully!');
      fetchProfile();
    } catch (err: any) {
      console.error(err);
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
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
      setPwMsg('Password updated successfully!');
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
    return <div className="p-8 text-emerald-600 text-center font-semibold">Loading doctor profile...</div>;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-bold">Doctor Professional Profile</h1>
        <p className="text-xs text-slate-500">Practitioner credentials, specialization details, and account security</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Overview Card */}
        <div className="glass-panel p-6 rounded-2xl space-y-5 text-center flex flex-col items-center justify-between">
          <div className="space-y-4 w-full">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-600 mx-auto flex items-center justify-center text-dark-900 font-extrabold text-4xl shadow-xl shadow-cyan-500/20">
              <Stethoscope className="w-12 h-12" />
            </div>

            <div>
              <h2 className="text-lg font-extrabold text-slate-900 font-bold">{profile?.name || 'Doctor'}</h2>
              <p className="text-xs text-emerald-600 font-bold mt-0.5">{profile?.specialization || 'General Physician'}</p>
              <span className="inline-block mt-2 text-[10px] font-mono px-3 py-1 rounded-full bg-slate-100 text-slate-600">
                {profile?.doctor_code || 'DOC-0000'}
              </span>
            </div>

            <div className="w-full text-xs text-left space-y-2 pt-4 border-t border-slate-200/80 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <span className="font-semibold text-slate-900 font-bold">{profile?.department || 'General Medicine'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">License No:</span>
                <span className="font-mono text-emerald-600 font-bold">{profile?.license_number || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Affiliated Hospital:</span>
                <span className="font-semibold text-slate-900 font-bold">{profile?.hospital_name}</span>
              </div>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-slate-200/80 text-left">
            <span className="text-[11px] text-slate-500 block mb-1">Account Security Status:</span>
            {profile?.must_change_password ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                <Lock className="w-3 h-3" />
                <span>Pending Password Change</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                <ShieldCheck className="w-3 h-3" />
                <span>Verified Account</span>
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Edit Profile & Change Password Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form 1: Edit Profile Details */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-extrabold text-slate-900 font-bold flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>Edit Professional Credentials</span>
            </h2>

            {profileError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{profileMsg}</span>
              </div>
            )}

            <form onSubmit={handleProfileSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Email Address</label>
                  <input
                    type="text"
                    value={profile?.email || ''}
                    disabled
                    className="w-full bg-[#f4f7f6]/60 border border-slate-200/80 rounded-xl px-3 py-2 text-slate-500 cursor-not-allowed font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">License Number</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0199"
                  className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Professional Bio</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Summary of clinical experience, medical qualifications, and areas of focus..."
                  className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl p-3 text-slate-900 font-bold focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all hover:opacity-90 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Changes...' : 'Save Profile Details'}</span>
              </button>
            </form>
          </div>

          {/* Form 2: Change Password */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-extrabold text-slate-900 font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Security & Password Management</span>
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
                <label className="block text-slate-600 font-semibold mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={changingPw}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center gap-2"
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

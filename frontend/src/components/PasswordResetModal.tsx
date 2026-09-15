import React, { useState } from 'react';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { Lock, CheckCircle2, AlertCircle } from 'lucide-react';

export const PasswordResetModal: React.FC = () => {
  const { user, setMustChangePassword, logout } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!user || !user.must_change_password) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setErrorMsg('Please enter your current initial password.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('New passwords do not match.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword.trim(),
        new_password: newPassword.trim(),
      });

      setSuccessMsg('Password reset successfully! Updating session...');
      setTimeout(() => {
        setMustChangePassword(false);
      }, 1200);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to change password. Please verify current initial password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#f4f7f6] border border-cyan-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center gap-3 border-b border-slate-200/80 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-emerald-600 border border-cyan-500/30 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 font-bold">First-Time Password Reset Required</h2>
            <p className="text-xs text-emerald-600 font-medium">Initial Onboarding Security Protocol</p>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-900 font-bold">Welcome to HealthSync!</p>
          <p className="text-slate-500">
            Your account was created by your Hospital Administrator with an initial temporary password. Please set a secure personal password to activate your dashboard.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Current Initial Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter temporary password"
              className="w-full bg-dark-950 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              New Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full bg-dark-950 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Confirm New Password <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full bg-dark-950 border border-slate-200/80 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:border-cyan-500 transition-colors"
              required
            />
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-500 text-xs font-bold transition-all"
            >
              Sign Out
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all hover:opacity-90"
            >
              {loading ? 'Updating Password...' : 'Save & Activate Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

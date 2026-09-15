import { HealthSyncLogo } from '../components/HealthSyncLogo';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { ShieldCheck, Lock, Mail, ArrowRight, Activity, Cpu } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data;
      setAuth(
        { id: data.user_id, email: data.email, role: data.role, entity_id: data.entity_id },
        data.access_token
      );

      if (data.role === 'PATIENT') navigate('/patient/dashboard');
      else if (data.role === 'DOCTOR') navigate('/doctor/overview');
      else if (data.role === 'HOSPITAL') navigate('/hospital/dashboard');
      else if (data.role === 'ADMIN') navigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    if (demoRole === 'ADMIN') setPassword('Admin@123');
    else if (demoRole === 'DOCTOR') setPassword('Doc@123');
    else if (demoRole === 'HOSPITAL') setPassword('Hosp@123');
    else setPassword('Patient@123');
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-600 mx-auto flex items-center justify-center text-dark-900 font-extrabold text-2xl shadow-xl shadow-cyan-500/20">
            AI
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-bold tracking-tight">HealthSync</h1>
          <p className="text-xs text-slate-500">Explainable AI & Blockchain Medical Platform</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-200/80 space-y-6">
          <h2 className="text-xl font-bold text-slate-900 font-bold text-center">Account Login</h2>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="doctor@healthsecure.com"
                  className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-cyan-400 hover:to-emerald-400 text-dark-900 font-extrabold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Login Preset Buttons */}
          <div className="pt-4 border-t border-slate-200/80 space-y-2">
            <p className="text-xs text-slate-500 text-center font-semibold mb-2">Quick Demo One-Click Fill</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => quickLogin('riya.patel@healthsecure.com', 'PATIENT')}
                className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 transition-colors text-left"
              >
                👤 Patient (Riya)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('dr.rahul@healthsecure.com', 'DOCTOR')}
                className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-emerald-600 transition-colors text-left"
              >
                🩺 Doctor (Dr. Rahul)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('hospital.a@healthsecure.com', 'HOSPITAL')}
                className="p-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 transition-colors text-left"
              >
                🏥 Hospital (City Gen)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('admin@healthsecure.com', 'ADMIN')}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 transition-colors text-left"
              >
                ⚡ Admin
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-600 font-semibold hover:underline">
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

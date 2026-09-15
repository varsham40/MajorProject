import { HealthSyncLogo } from '../components/HealthSyncLogo';
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { Mail, Lock, User, UserCheck, ArrowRight } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [role, setRole] = useState<'PATIENT' | 'DOCTOR' | 'HOSPITAL'>('PATIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [specialization, setSpecialization] = useState('Cardiologist & Internal Medicine');
  const [hospitalId, setHospitalId] = useState('');
  const [hospitalsList, setHospitalsList] = useState<any[]>([]);
  const [dob, setDob] = useState('1992-06-15');
  const [gender, setGender] = useState('Female');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchHospitals = async () => {
      try {
        const res = await api.get('/hospitals/public');
        setHospitalsList(res.data);
        if (res.data.length > 0) {
          setHospitalId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load hospitals', err);
      }
    };
    fetchHospitals();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/register', {
        role,
        name,
        email,
        password,
        specialization,
        hospital_id: role === 'DOCTOR' ? hospitalId : undefined,
        dob,
        gender
      });

      const data = res.data;
      setAuth(
        { id: data.user_id, email: data.email, role: data.role, entity_id: data.entity_id },
        data.access_token
      );

      if (data.role === 'PATIENT') navigate('/patient/dashboard');
      else if (data.role === 'DOCTOR') navigate('/doctor/overview');
      else if (data.role === 'HOSPITAL') navigate('/hospital/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="w-full max-w-md space-y-6 relative z-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 font-bold tracking-tight">Create Account</h1>
          <p className="text-xs text-slate-500">Join HealthSync Healthcare Platform</p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-200/80 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Role selector buttons */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Select Role</label>
            <div className="grid grid-cols-3 gap-2">
              {(['PATIENT', 'DOCTOR', 'HOSPITAL'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                    role === r
                      ? 'bg-cyan-500/20 text-emerald-600 border-cyan-500/40 shadow-md'
                      : 'bg-white text-slate-500 border-slate-200/60 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Full Name / Org Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === 'DOCTOR' ? 'Dr. Sarah Connor' : role === 'HOSPITAL' ? 'City Health Center' : 'Riya Patel'}
                  className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@healthsecure.com"
                  className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-cyan-500"
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
                  className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {role === 'DOCTOR' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Associated Hospital</label>
                  <select
                    required
                    value={hospitalId}
                    onChange={(e) => setHospitalId(e.target.value)}
                    className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-cyan-500"
                  >
                    {hospitalsList.length === 0 && <option value="">Loading Hospitals...</option>}
                    {hospitalsList.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} ({h.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Specialization</label>
                  <input
                    type="text"
                    required
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="Cardiologist & Internal Medicine"
                    className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {role === 'PATIENT' && (
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600">Gender</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-white/90 border border-slate-200/80 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2"
            >
              {loading ? 'Creating...' : 'Register Account'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-600 font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

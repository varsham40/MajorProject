import { DoctorDetailsManagement } from './DoctorDetailsManagement';
import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { 
  Users, UserPlus, Search, Stethoscope, Building2, Phone, Award, 
  Key, ShieldCheck, AlertCircle, CheckCircle2, X, Lock, RefreshCw 
} from 'lucide-react';

export const DoctorManagementPage: React.FC = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [specialization, setSpecialization] = useState('General Physician');
  const [department, setDepartment] = useState('General Medicine');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [initialPassword, setInitialPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = () => {
    setLoading(true);
    api.get('/hospitals/doctors')
      .then(res => setDoctors(res.data || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !initialPassword.trim()) {
      setErrorMsg('Doctor Name, Email, and Initial Password are required.');
      return;
    }
    if (initialPassword.length < 6) {
      setErrorMsg('Initial Password must be at least 6 characters long.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const res = await api.post('/hospitals/doctors/onboard', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        specialization: specialization.trim() || 'General Physician',
        department: department.trim() || 'General Medicine',
        license_number: licenseNumber.trim() || null,
        phone: phone.trim() || null,
        initial_password: initialPassword.trim(),
      });

      setSuccessMsg(`Doctor ${name} onboarded successfully! Initial credentials set.`);
      fetchDoctors();
      
      // Reset form
      setName('');
      setEmail('');
      setLicenseNumber('');
      setPhone('');
      setInitialPassword('');

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg(null);
      }, 1800);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Failed to onboard doctor.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDoctors = doctors.filter(d => 
    (d.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
    (d.doctor_code || '').toLowerCase().includes(search.toLowerCase())
  );

    if (selectedDoctorId) {
    return <DoctorDetailsManagement doctorId={selectedDoctorId} onBack={() => setSelectedDoctorId(null)} />;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-bold">Hospital Doctor Management</h1>
          <p className="text-xs text-slate-500">Onboard hospital physicians, create accounts, and view active medical staff</p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2 hover:opacity-90 transition-all self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Onboard New Doctor</span>
        </button>
      </div>

      {/* Stats & Search Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-500">Total Hospital Doctors</span>
          <p className="text-2xl font-extrabold text-slate-900 font-bold">{doctors.length}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-500">Pending First Password Reset</span>
          <p className="text-2xl font-extrabold text-amber-400">
            {doctors.filter(d => d.must_change_password).length}
          </p>
        </div>
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <span className="text-xs font-medium text-slate-500">Fully Activated Accounts</span>
          <p className="text-2xl font-extrabold text-emerald-400">
            {doctors.filter(d => !d.must_change_password).length}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctor by name, email, specialization, or doctor code..."
          className="w-full bg-white border border-slate-200/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold placeholder-slate-500 focus:border-cyan-500 transition-colors"
        />
      </div>

      {/* Doctor Directory Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-200/80 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 font-bold flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span>Onboarded Physicians Directory ({filteredDoctors.length})</span>
          </h2>
          <button onClick={fetchDoctors} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-emerald-600">Loading doctor staff directory...</div>
        ) : filteredDoctors.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No doctors found. Click <strong>"+ Onboard New Doctor"</strong> to create a new physician account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-white text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200/80">
                <tr>
                  <th className="py-3 px-4">Doctor Name</th>
                  <th className="py-3 px-4">Doctor Code</th>
                  <th className="py-3 px-4">Specialization</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">License No</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Onboarded Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredDoctors.map((doc) => (
                  <tr key={doc.id} onClick={() => setSelectedDoctorId(doc.id)} className="hover:bg-slate-50 transition-colors cursor-pointer" title="Click to view dedicated doctor hub & manage slot availability">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-bold">{doc.name}</div>
                      <div className="text-[11px] text-emerald-600">{doc.email}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-emerald-600 font-bold">{doc.doctor_code}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{doc.specialization}</td>
                    <td className="py-3.5 px-4 text-slate-500">{doc.department || 'General Medicine'}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{doc.license_number || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      {doc.must_change_password ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                          <Lock className="w-3 h-3" />
                          <span>Pending Password Reset</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Activated</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{doc.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Onboard New Doctor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-dark-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#f4f7f6] border border-slate-200/80 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
              <h2 className="text-base font-extrabold text-slate-900 font-bold flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-600" />
                <span>Onboard New Hospital Doctor</span>
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-900 p-1 rounded-lg">
                <X className="w-4 h-4" />
              </button>
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

            <form onSubmit={handleOnboardSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Doctor Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Connor"
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold placeholder-slate-500 focus:border-cyan-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">
                    Email Address (Login) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. sarah@aihealthsecure.local"
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold placeholder-slate-500 focus:border-cyan-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Specialization</label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    placeholder="e.g. Cardiologist"
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold placeholder-slate-500 focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Department</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Cardiology"
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold placeholder-slate-500 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Medical License / Reg No</label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MED-REG-9908"
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold placeholder-slate-500 focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +1 555-0192"
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold placeholder-slate-500 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="block text-slate-600 font-semibold mb-1">
                  Initial Temporary Password <span className="text-rose-400">*</span>
                </label>
                <input
                  type="password"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                  placeholder="Set initial password (min 6 chars)"
                  className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-3 py-2 text-slate-900 font-bold placeholder-slate-500 focus:border-cyan-500"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Share this initial password securely with the doctor. They will be prompted to reset it upon first login.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-700 text-slate-600 font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-extrabold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all hover:opacity-90"
                >
                  {submitting ? 'Creating Account...' : 'Complete Onboarding'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

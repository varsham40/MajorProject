import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, UserCheck, UserX, Search, Wand2, Building2, User, X, Sparkles, Stethoscope, ShieldCheck } from 'lucide-react';

export const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Directory Modal state
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'patients' | 'hospitals'>('patients');
  const [patientsDirectory, setPatientsDirectory] = useState<any[]>([]);
  const [hospitalsDoctors, setHospitalsDoctors] = useState<any[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  const fetchUsers = () => {
    api.get('/admin/users')
      .then(res => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        console.error(err);
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchDirectoryData = async () => {
    setDirectoryLoading(true);
    try {
      const [patRes, hospDocRes] = await Promise.all([
        api.get('/admin/directory/patients'),
        api.get('/admin/directory/hospitals-doctors')
      ]);
      setPatientsDirectory(Array.isArray(patRes.data) ? patRes.data : []);
      setHospitalsDoctors(Array.isArray(hospDocRes.data) ? hospDocRes.data : []);
    } catch (err) {
      console.error('Failed to load healthcare directory', err);
      setPatientsDirectory([]);
      setHospitalsDoctors([]);
    } finally {
      setDirectoryLoading(false);
    }
  };

  const openDirectoryModal = () => {
    setShowDirectoryModal(true);
    fetchDirectoryData();
  };

  const handleToggle = async (userId: string) => {
    try {
      await api.post(`/admin/users/${userId}/toggle-active`);
      fetchUsers();
      if (showDirectoryModal) fetchDirectoryData();
    } catch (err) {
      console.error(err);
    }
  };

  const userList = Array.isArray(users) ? users : [];
  const patientDirList = Array.isArray(patientsDirectory) ? patientsDirectory : [];
  const hospDocList = Array.isArray(hospitalsDoctors) ? hospitalsDoctors : [];

  const filteredUsers = userList.filter(u =>
    (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredPatients = patientDirList.filter(p =>
    (p.name || '').toLowerCase().includes(directorySearch.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(directorySearch.toLowerCase()) ||
    (p.patient_code || '').toLowerCase().includes(directorySearch.toLowerCase())
  );

  if (loading) return <div className="p-8 text-cyan-400 text-center font-semibold">Loading System Users...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span>System User Management</span>
          </h1>
          <p className="text-xs text-slate-400">View registered system accounts, assign role permissions, and explore healthcare entity structures</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Magic Stick Wand Button */}
          <button
            onClick={openDirectoryModal}
            className="group px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-emerald-500/20 border border-cyan-500/40 text-cyan-300 hover:text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
            title="Open Interactive Healthcare Directory"
          >
            <Wand2 className="w-4 h-4 text-cyan-400 group-hover:rotate-12 transition-transform duration-300" />
            <span>Healthcare Directory Explorer</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          </button>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search email or role..."
              className="bg-dark-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 bg-dark-800/50">
              <th className="py-3 px-4">User ID</th>
              <th className="py-3 px-4">Email Address</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Created Date</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredUsers.map((u) => (
              <tr key={u.id} className="hover:bg-slate-800/30">
                <td className="py-3.5 px-4 font-mono text-cyan-400 font-bold">{u.id?.substring(0, 8)}...</td>
                <td className="py-3.5 px-4 font-bold text-white">{u.email}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    u.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-400' :
                    u.role === 'DOCTOR' ? 'bg-cyan-500/20 text-cyan-400' :
                    u.role === 'HOSPITAL' ? 'bg-purple-500/20 text-purple-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-slate-400">{u.created_at}</td>
                <td className="py-3.5 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {u.is_active ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleToggle(u.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                      u.is_active ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-dark-900'
                    }`}
                  >
                    {u.is_active ? 'Disable Account' : 'Activate Account'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Magic Stick Healthcare Directory Modal */}
      {showDirectoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-dark-900 border border-cyan-500/40 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-500/20 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-dark-800/60">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                  <Wand2 className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                    <span>Healthcare Entity Directory Explorer</span>
                    <Sparkles className="w-4 h-4 text-amber-400" />
                  </h2>
                  <p className="text-xs text-slate-400">Categorized system breakdown of all Patients and Hospital-wise Attending Doctors</p>
                </div>
              </div>

              <button
                onClick={() => setShowDirectoryModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/40 border border-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs & Search */}
            <div className="p-4 bg-dark-800/40 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setActiveTab('patients')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all ${
                    activeTab === 'patients'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-md'
                      : 'bg-dark-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <span>Registered Patients Directory ({patientDirList.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('hospitals')}
                  className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 border transition-all ${
                    activeTab === 'hospitals'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-md'
                      : 'bg-dark-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Hospital-Wise Doctors ({hospDocList.reduce((acc, h) => acc + (h.total_doctors || 0), 0)})</span>
                </button>
              </div>

              {activeTab === 'patients' && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    placeholder="Filter patients..."
                    className="w-full bg-dark-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Modal Body / Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {directoryLoading ? (
                <div className="p-12 text-center text-cyan-400 font-semibold space-y-2">
                  <Wand2 className="w-8 h-8 mx-auto animate-spin" />
                  <p>Exploring Healthcare Directory Data...</p>
                </div>
              ) : activeTab === 'patients' ? (
                /* Patients Directory View */
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Showing all patients registered across the platform</span>
                    <span className="font-mono text-cyan-400 font-bold">{filteredPatients.length} Total Patients</span>
                  </div>

                  <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
                    <table className="w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 bg-dark-800/80">
                          <th className="py-3 px-4">Patient Code</th>
                          <th className="py-3 px-4">Full Name</th>
                          <th className="py-3 px-4">Email Address</th>
                          <th className="py-3 px-4">Phone</th>
                          <th className="py-3 px-4">Gender & DOB</th>
                          <th className="py-3 px-4">Registered Date</th>
                          <th className="py-3 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {filteredPatients.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/30">
                            <td className="py-3.5 px-4 font-mono text-cyan-400 font-extrabold">{p.patient_code}</td>
                            <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                                {(p.name || 'P').charAt(0)}
                              </div>
                              <span>{p.name}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-300">{p.email}</td>
                            <td className="py-3.5 px-4 text-slate-400">{p.phone}</td>
                            <td className="py-3.5 px-4 text-slate-300">
                              <span className="font-semibold text-cyan-300">{p.gender}</span> · <span className="text-slate-400">{p.dob}</span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-400">{p.created_at}</td>
                            <td className="py-3.5 px-4 text-right">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                p.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'
                              }`}>
                                {p.is_active ? 'ACTIVE' : 'DISABLED'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                /* Hospital-Wise Doctors View */
                <div className="space-y-6">
                  <div className="text-xs text-slate-400">
                    Grouped breakdown of attending physicians & specialists present in each registered healthcare organization
                  </div>

                  {hospDocList.map((hosp) => (
                    <div key={hosp.hospital_id} className="glass-panel p-5 rounded-2xl border border-purple-500/30 space-y-4">
                      {/* Hospital Header Banner */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                              <span>{hosp.hospital_name}</span>
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono text-[10px] border border-purple-500/30 font-bold">
                                {hosp.hospital_code}
                              </span>
                            </h3>
                            <p className="text-xs text-slate-400">{hosp.address} · <span className="text-purple-400">{hosp.email}</span></p>
                          </div>
                        </div>

                        <div className="px-3 py-1 rounded-xl bg-purple-500/10 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5 self-start sm:self-auto">
                          <Stethoscope className="w-4 h-4 text-purple-400" />
                          <span>{hosp.total_doctors || 0} Associated Doctors</span>
                        </div>
                      </div>

                      {/* Doctors Table inside Hospital */}
                      {(!hosp.doctors || hosp.doctors.length === 0) ? (
                        <div className="p-4 text-center text-xs text-slate-500 italic">
                          No doctors currently registered under this hospital.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="border-b border-slate-800 text-slate-400">
                                <th className="py-2.5 px-3">Doctor Code</th>
                                <th className="py-2.5 px-3">Physician Name</th>
                                <th className="py-2.5 px-3">Specialization</th>
                                <th className="py-2.5 px-3">Email Address</th>
                                <th className="py-2.5 px-3 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {hosp.doctors.map((doc: any) => (
                                <tr key={doc.id} className="hover:bg-purple-500/5">
                                  <td className="py-3 px-3 font-mono font-extrabold text-cyan-400">{doc.doctor_code}</td>
                                  <td className="py-3 px-3 font-bold text-white flex items-center gap-2">
                                    <Stethoscope className="w-3.5 h-3.5 text-cyan-400" />
                                    <span>{doc.name}</span>
                                  </td>
                                  <td className="py-3 px-3 font-semibold text-purple-300">{doc.specialization}</td>
                                  <td className="py-3 px-3 text-slate-300">{doc.email}</td>
                                  <td className="py-3 px-3 text-right">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      doc.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400'
                                    }`}>
                                      {doc.is_active ? 'ACTIVE' : 'DISABLED'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-dark-800/60 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AI HealthSecure Central Directory Service</span>
              </span>

              <button
                onClick={() => setShowDirectoryModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all"
              >
                Close Explorer
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

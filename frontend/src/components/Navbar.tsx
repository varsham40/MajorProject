import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  ShieldCheck, 
  Bell, 
  Calendar, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  CheckCircle, 
  XCircle, 
  Unlock, 
  FileText 
} from 'lucide-react';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role || 'PATIENT';
  const isDoctor = role === 'DOCTOR';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [role]);

  const fetchNotifications = () => {
    if (role !== 'DOCTOR' && role !== 'PATIENT') {
      setNotifications([]);
      return;
    }
    const endpoint = role === 'DOCTOR' ? '/doctors/notifications' : '/patients/notifications';
    api.get(endpoint)
      .then(res => setNotifications(res.data || []))
      .catch(err => console.error('Failed to fetch notifications:', err));
  };

  const handleDismissNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (role !== 'DOCTOR' && role !== 'PATIENT') return;
    const endpoint = role === 'DOCTOR' ? `/doctors/notifications/${id}/dismiss` : `/patients/notifications/${id}/dismiss`;
    try {
      await api.post(endpoint);
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(code);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleRedeemClick = (code: string) => {
    setShowPopover(false);
    navigate(`/doctor/token-redeemer?token=${code}`);
  };

  const unreadCount = notifications.length;

  return (
    <header className="h-16 bg-dark-800/60 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Blockchain Integrity Protected (Hardhat Node Active)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {role === 'PATIENT' && (
          <button
            onClick={() => navigate('/patient/appointments?book=true')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 font-extrabold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-90 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        )}

        {/* Notifications Bell & Popover Panel */}
        <div className="relative">
          <button
            onClick={() => setShowPopover(!showPopover)}
            className="p-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-cyan-500 text-dark-900 font-mono font-extrabold text-[10px] shadow-md animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showPopover && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl glass-panel bg-dark-900/95 border border-slate-700 shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-white">
                  <Bell className="w-4 h-4 text-cyan-400" />
                  <span>{isDoctor ? 'Doctor Smart Notifications' : 'Patient Smart Notifications'}</span>
                </div>
                <button
                  onClick={() => setShowPopover(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800/60"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 hover:border-slate-600 transition-all space-y-2 relative group"
                  >
                    {/* Top row: Type indicator & Dismiss button */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {n.type === 'APPOINTMENT_REQUEST' && <Calendar className="w-4 h-4 text-amber-400" />}
                        {n.type === 'REPORT_TOKEN_SHARE' && <Key className="w-4 h-4 text-cyan-400" />}
                        {n.type === 'APPOINTMENT_STATUS_CHANGE' && (
                          n.status === 'ACCEPTED' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        {n.type === 'REPORT_UNLOCKED_ACK' && <Unlock className="w-4 h-4 text-purple-400" />}

                        <span className="font-extrabold text-white text-xs">{n.title}</span>
                      </div>

                      {/* Small 'X' Dismiss Button */}
                      <button
                        onClick={(e) => handleDismissNotification(n.id, e)}
                        title="Dismiss notification"
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/20 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Content Details by Type */}
                    {n.type === 'APPOINTMENT_REQUEST' && (
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <p>👤 Patient: <strong className="text-white">{n.patient_name}</strong> ({n.patient_code})</p>
                        <p>📅 Date: <span className="text-cyan-300 font-semibold">{n.appointment_date}</span> ({n.slot_time})</p>
                        <p>🩺 Reason: <span className="text-slate-400">{n.target_disease}</span></p>
                        <div className="pt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">{n.created_at}</span>
                          <button
                            onClick={() => { setShowPopover(false); navigate('/doctor/appointments'); }}
                            className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-extrabold hover:bg-amber-500/30"
                          >
                            Manage Request
                          </button>
                        </div>
                      </div>
                    )}

                    {n.type === 'REPORT_TOKEN_SHARE' && (
                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <p>👤 Patient: <strong className="text-white">{n.patient_name}</strong> ({n.patient_code})</p>
                        <p>🏥 Origin: <span className="text-slate-400">{n.origin_doctor_name} ({n.origin_hospital_name})</span></p>
                        <p>📑 Report: <span className="text-cyan-400 font-medium">{n.disease} ({n.record_code})</span></p>
                        <div className="pt-1.5 border-t border-slate-700/60 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 bg-dark-900 px-2 py-0.5 rounded border border-slate-700">
                            <span className="font-mono font-bold text-cyan-400 uppercase text-[10px]">{n.token_code}</span>
                            <button
                              onClick={() => handleCopyCode(n.token_code)}
                              title="Copy Code"
                              className="text-slate-400 hover:text-white"
                            >
                              {copiedToken === n.token_code ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                          <button
                            onClick={() => handleRedeemClick(n.token_code)}
                            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 font-extrabold text-[10px] flex items-center gap-1 hover:opacity-90"
                          >
                            <span>Redeem Token</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}

                    {n.type === 'APPOINTMENT_STATUS_CHANGE' && (
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <p>👨‍⚕️ Doctor: <strong className="text-white">{n.doctor_name}</strong> ({n.hospital_name})</p>
                        <p>📅 Schedule: <span className="text-cyan-300 font-semibold">{n.appointment_date}</span> ({n.slot_time})</p>
                        <p className="text-[11px] text-slate-400 italic">"{n.message}"</p>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">{n.created_at}</span>
                          <button
                            onClick={() => { setShowPopover(false); navigate('/patient/appointments'); }}
                            className="px-2.5 py-1 rounded-lg bg-slate-700 text-slate-200 border border-slate-600 text-[10px] font-bold hover:bg-slate-600"
                          >
                            View Appointments
                          </button>
                        </div>
                      </div>
                    )}

                    {n.type === 'REPORT_UNLOCKED_ACK' && (
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <p>👨‍⚕️ Doctor: <strong className="text-white">{n.doctor_name}</strong> ({n.hospital_name})</p>
                        <p>📄 Record Code: <span className="text-purple-400 font-mono font-bold">{n.record_code}</span></p>
                        <p className="text-[11px] text-slate-400 italic">"{n.message}"</p>
                        <div className="pt-1 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">{n.created_at}</span>
                          <button
                            onClick={() => { setShowPopover(false); navigate(`/patient/records?record_id=${n.record_id || ''}`); }}
                            className="px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-extrabold hover:bg-purple-500/30"
                          >
                            View My Records
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    No new notifications right now.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-800"></div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center text-dark-900 font-bold text-xs">
            {user?.email[0].toUpperCase() || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-white leading-tight">{user?.email}</p>
            <p className="text-[10px] text-slate-400 font-medium capitalize">{user?.role.toLowerCase()}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

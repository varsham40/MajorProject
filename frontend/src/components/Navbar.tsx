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
  FileText,
  Search, Moon, Sun
} from 'lucide-react';
import api from '../services/api';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const role = user?.role || 'PATIENT';
  const isDoctor = role === 'DOCTOR';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showPopover, setShowPopover] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const current = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', current);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };
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
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Blockchain Integrity Protected (Hardhat Active)</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {role === 'PATIENT' && (
          <button
            onClick={() => navigate('/patient/appointments?book=true')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-800 font-extrabold text-xs shadow-sm shadow-emerald-200 transition-all"
          >
            <Calendar className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        )}

        {/* Dark / Light Theme Toggle Switcher (Top Right Navbar) */}
        <button
          onClick={toggleTheme}
          className="p-2 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 transition-all shadow-sm flex items-center gap-1.5 text-xs font-extrabold"
          title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-slate-800" /> : <Sun className="w-4 h-4 text-amber-500" />}
          <span className="hidden sm:inline text-xs font-extrabold text-slate-800">{theme === 'light' ? 'Dark' : 'Light'}</span>
        </button>

        {/* Notifications Bell & Popover Panel */}
        <div className="relative">
          <button
            onClick={() => setShowPopover(!showPopover)}
            className="p-2.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 hover:border-emerald-200 transition-colors relative shadow-sm"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-slate-900 font-bold font-mono font-extrabold text-[10px] shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showPopover && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white border border-slate-200 shadow-2xl p-4 z-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <Bell className="w-4 h-4 text-emerald-600" />
                  <span>{isDoctor ? 'Doctor Smart Notifications' : 'Patient Smart Notifications'}</span>
                </div>
                <button
                  onClick={() => setShowPopover(false)}
                  className="p-1 rounded-lg text-slate-500 hover:text-slate-600 bg-slate-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1 text-xs">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition-all space-y-2 relative group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {n.type === 'APPOINTMENT_REQUEST' && <Calendar className="w-4 h-4 text-amber-500" />}
                        {n.type === 'REPORT_TOKEN_SHARE' && <Key className="w-4 h-4 text-sky-500" />}
                        {n.type === 'APPOINTMENT_STATUS_CHANGE' && (
                          n.status === 'ACCEPTED' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-rose-500" />
                        )}
                        {n.type === 'REPORT_UNLOCKED_ACK' && <Unlock className="w-4 h-4 text-purple-500" />}

                        <span className="font-extrabold text-slate-800 text-xs">{n.title}</span>
                      </div>

                      <button
                        onClick={(e) => handleDismissNotification(n.id, e)}
                        title="Dismiss notification"
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {n.type === 'APPOINTMENT_REQUEST' && (
                      <div className="space-y-1 text-[11px] text-slate-600">
                        <p>👤 Patient: <strong className="text-slate-800">{n.patient_name}</strong> ({n.patient_code})</p>
                        <p>📅 Date: <span className="text-emerald-700 font-semibold">{n.appointment_date}</span> ({n.slot_time})</p>
                        <p>🩺 Reason: <span className="text-slate-500">{n.target_disease}</span></p>
                        <div className="pt-1.5 flex items-center justify-between">
                          <span className="text-[10px] text-slate-500">{n.created_at}</span>
                          <button
                            onClick={() => { setShowPopover(false); navigate('/doctor/appointments'); }}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 text-[10px] font-bold hover:bg-amber-200"
                          >
                            Manage Request
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {notifications.length === 0 && (
                  <div className="py-6 text-center text-slate-500 text-xs font-medium">
                    No new notifications right now.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        {/* Hello Profile Badge Pill (Matching ERES top-right pill) */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3.5 py-1.5 rounded-full font-bold text-xs shadow-sm">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-800 font-extrabold text-[11px] flex items-center justify-center">
            {user?.email[0].toUpperCase() || 'U'}
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-extrabold text-emerald-900">Hello, {user?.email.split('@')[0]}</p>
            <p className="text-[10px] text-emerald-600 capitalize font-semibold">{user?.role.toLowerCase()}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

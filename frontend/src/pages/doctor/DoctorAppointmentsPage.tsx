import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { 
  Calendar, 
  Stethoscope, 
  User, 
  Building2, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  Check, 
  X, 
  FileText,
  XCircle,
  Save,
  Calendar as CalendarIcon
} from 'lucide-react';

export const DoctorAppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'SCHEDULED' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED'>('SCHEDULED');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  // Slot Management Modal State
  const [isSlotModalOpen, setIsSlotModalOpen] = useState(false);
  const [doctorProfile, setDoctorProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slotData, setSlotData] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [savingSlots, setSavingSlots] = useState<boolean>(false);
  const [slotMsg, setSlotMsg] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState<string>('');

  useEffect(() => {
    api.get('/doctors/profile/me')
      .then(res => setDoctorProfile(res.data))
      .catch(err => console.error("Error fetching doctor profile:", err));
  }, []);

  useEffect(() => {
    if (isSlotModalOpen) {
      if (doctorProfile?.id) {
        fetchSlotAvailability(doctorProfile.id, selectedDate);
      } else {
        api.get('/doctors/profile/me').then(res => {
          setDoctorProfile(res.data);
          if (res.data?.id) {
            fetchSlotAvailability(res.data.id, selectedDate);
          }
        }).catch(err => console.error(err));
      }
    }
  }, [selectedDate, isSlotModalOpen]);

  const fetchSlotAvailability = async (docId: string, dateStr: string) => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/doctors/${docId}/availability?date=${dateStr}`);
      setSlotData(res.data.slots || []);
      const availSlots = (res.data.slots || [])
        .filter((s: any) => s.status === 'AVAILABLE')
        .map((s: any) => s.slot);
      setSelectedSlots(availSlots);
    } catch (err) {
      console.error("Error fetching slot availability:", err);
    } finally {
      setLoadingSlots(false);
    }
  };

  
  const formatTime24to12 = (time24: string): string => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return time24;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const formattedH = h < 10 ? `0${h}` : `${h}`;
    const formattedM = m < 10 ? `0${m}` : `${m}`;
    return `${formattedH}:${formattedM} ${period}`;
  };

  const handleAddCustomSlot = () => {
    if (!customTime) return;
    const formatted = formatTime24to12(customTime);
    if (!formatted) return;
    const existsInSlotData = slotData.some((s: any) => s.slot.toUpperCase() === formatted.toUpperCase());
    if (!existsInSlotData) {
      setSlotData(prev => [...prev, { slot: formatted, status: 'AVAILABLE', is_selectable: true }]);
    }
    if (!selectedSlots.includes(formatted)) {
      setSelectedSlots(prev => [...prev, formatted]);
    }
    setCustomTime('');
    setSlotMsg(`Custom slot "${formatted}" added to availability list!`);
    setTimeout(() => setSlotMsg(null), 3000);
  };

  const handleToggleSlot = (slotName: string, isBooked: boolean) => {
    if (isBooked) return;
    if (selectedSlots.includes(slotName)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotName));
    } else {
      setSelectedSlots([...selectedSlots, slotName]);
    }
  };

  const handleSaveSlots = async () => {
    if (!doctorProfile?.id) return;
    setSavingSlots(true);
    setSlotMsg(null);
    try {
      await api.post(`/doctors/${doctorProfile.id}/availability`, {
        available_date: selectedDate,
        time_slots: selectedSlots
      });
      setSlotMsg(`Availability slots saved for ${selectedDate}!`);
      fetchSlotAvailability(doctorProfile.id, selectedDate);
      setTimeout(() => setSlotMsg(null), 3000);
    } catch (err: any) {
      console.error("Error saving slot availability:", err);
      alert("Failed to save slot availability.");
    } finally {
      setSavingSlots(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments/doctor');
      setAppointments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch doctor appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (aptId: string) => {
    try {
      setProcessingId(aptId);
      await api.post(`/appointments/${aptId}/accept`);
      fetchAppointments();
    } catch (err: any) {
      console.error('Failed to accept appointment:', err);
      alert(err.response?.data?.detail || 'Failed to accept appointment.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (aptId: string) => {
    if (!window.confirm('Are you sure you want to reject this appointment request?')) return;
    try {
      setProcessingId(aptId);
      await api.post(`/appointments/${aptId}/reject`);
      fetchAppointments();
    } catch (err: any) {
      console.error('Failed to reject appointment:', err);
      alert(err.response?.data?.detail || 'Failed to reject appointment.');
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = appointments.filter(apt => {
    const matchesFilter = apt.status === filter;
    const matchesSearch =
      (apt.patient_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (apt.appointment_code || '').toLowerCase().includes(search.toLowerCase()) ||
      (apt.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (apt.target_disease || '').toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleStartAnalysis = (aptCode: string) => {
    navigate(`/doctor/new-analysis?appointment_code=${aptCode}`);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">My Scheduled Appointments         <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSlotModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:opacity-90 transition cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            <span>Manage Slot Availability</span>
          </button>
        </div></h1>
          <p className="text-xs text-slate-400 mt-1">
            Review patient appointment requests, accept/reject slots, and conduct AI clinical disease diagnosis.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code, patient, disease..."
            className="bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-900/80 border border-slate-800 w-fit text-xs overflow-x-auto">
        {(['SCHEDULED', 'ACCEPTED', 'COMPLETED', 'REJECTED'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              filter === t 
                ? 'bg-cyan-500 text-slate-950 shadow-md' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'SCHEDULED' ? 'Pending' : t.charAt(0) + t.slice(1).toLowerCase()} ({
              appointments.filter(a => a.status === t).length
            })
          </button>
        ))}
      </div>

      {/* Appointments Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-4">
          <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
          <p className="text-sm font-medium">Fetching scheduled appointments...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((apt) => (
            <div key={apt.id} className="bg-slate-900/60 hover:bg-slate-900/90 p-6 rounded-2xl space-y-4 border border-slate-800 flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono text-xs font-bold">
                    {apt.appointment_code}
                  </span>
                  
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    apt.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    apt.status === 'ACCEPTED' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30' :
                    apt.status === 'REJECTED' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' :
                    'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {apt.status === 'SCHEDULED' ? 'Pending Approval' : apt.status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>{apt.patient_name || 'Patient Profile'}</span>
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5">Code: {apt.patient_code}</p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-cyan-400" /> Date:</span>
                    <span className="text-slate-200 font-semibold">{apt.appointment_date}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-teal-400" /> Slot:</span>
                    <span className="text-slate-200 font-semibold">{apt.appointment_time}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Target Disease / Reason:</span>
                    <span className="text-emerald-400 font-bold uppercase">{apt.reason || apt.target_disease || 'General Consultation'}</span>
                  </div>
                </div>

                {apt.reason && (
                  <div className="text-xs text-slate-400 border-l-2 border-slate-700 pl-3 py-1">
                    <span className="text-slate-300 font-medium">Reason: </span>
                    {apt.reason}
                  </div>
                )}

                {apt.notes && (
                  <div className="text-xs text-slate-500 italic bg-slate-950/40 p-2 rounded-lg">
                    Notes: {apt.notes}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {apt.status === 'SCHEDULED' && (
                  <div className="w-full flex items-center gap-2">
                    <button
                      onClick={() => handleAccept(apt.id)}
                      disabled={processingId === apt.id}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Check className="w-4 h-4" /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(apt.id)}
                      disabled={processingId === apt.id}
                      className="flex-1 py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" /> Reject
                    </button>
                  </div>
                )}

                {apt.status === 'ACCEPTED' && (
                  <button
                    onClick={() => handleStartAnalysis(apt.appointment_code)}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-md flex items-center justify-center gap-2 hover:opacity-90 transition-all"
                  >
                    <Stethoscope className="w-4 h-4" />
                    <span>Start AI Clinical Analysis</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {apt.status === 'COMPLETED' && (
                  <button
                    onClick={() => navigate('/doctor/records')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-800 text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-700"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>View Completed Record</span>
                  </button>
                )}

                {apt.status === 'REJECTED' && (
                  <span className="text-xs text-rose-400 italic py-1 mx-auto flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Request Rejected
                  </span>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-500 text-sm bg-slate-900/40 rounded-2xl border border-slate-800">
              <Calendar className="w-12 h-12 mx-auto text-slate-600 mb-2 opacity-50" />
              No appointments found matching the current filter.
            </div>
          )}
        </div>
      )}
    
      {/* Manage Slot Availability Modal */}
      {isSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400">
                <Calendar className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-100">Manage My Time Slot Availability</h3>
              </div>
              <button onClick={() => setIsSlotModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Select Date:</span>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">Add Custom Flexible Time:</span>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSlot}
                  disabled={!customTime}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-lg transition disabled:opacity-40"
                >
                  + Add Slot
                </button>
              </div>
            </div>

            {slotMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{slotMsg}</span>
              </div>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                <span className="text-slate-300">Available</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-amber-500 rounded"></div>
                <span className="text-slate-300">Booked</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-slate-800 rounded border border-slate-700"></div>
                <span className="text-slate-400">Not Available</span>
              </div>
            </div>

            {/* Slots Grid */}
            {loadingSlots ? (
              <div className="p-8 text-center text-xs text-cyan-400">Loading availability...</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto">
                {slotData.map((s: any) => {
                  const isBooked = s.status === 'BOOKED';
                  const isSelected = selectedSlots.includes(s.slot);

                  return (
                    <button
                      key={s.slot}
                      type="button"
                      disabled={isBooked}
                      onClick={() => handleToggleSlot(s.slot, isBooked)}
                      className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                        isBooked
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-not-allowed opacity-80'
                          : isSelected
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span>{s.slot}</span>
                      <span className="text-[9px] font-extrabold uppercase">
                        {isBooked ? 'Booked' : isSelected ? 'Available' : 'Not Available'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                onClick={() => setIsSlotModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
              >
                Close
              </button>
              <button
                onClick={handleSaveSlots}
                disabled={savingSlots}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-md disabled:opacity-50"
              >
                {savingSlots ? 'Saving...' : 'Save Availability'}
              </button>
            </div>
          </div>
        </div>
      )}
</div>
  );
};

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Stethoscope, 
  FileText, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Plus, 
  Building2, 
  ShieldCheck,
  Activity,
  Check,
  Key,
  ChevronDown
} from 'lucide-react';
import api from '../../services/api';

interface Doctor {
  id: string;
  full_name: string;
  specialty?: string;
  department?: string;
  is_available?: boolean;
}

interface Appointment {
  id: string;
  appointment_code: string;
  patient_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'SCHEDULED' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  reason?: string;
  notes?: string;
  created_at: string;
  doctor_name?: string;
  doctor_specialty?: string;
  record_id?: string;
}

interface DiagnosticRecord {
  id: string;
  disease_type: string;
  prediction_result: string;
  risk_level: string;
  confidence: number;
  input_data: Record<string, any>;
  shap_values?: Record<string, number>;
  blockchain_tx_hash?: string;
  created_at: string;
}

const ALL_TIME_SLOTS = [
  "09:00 AM",
  "10:00 AM",
  "11:30 AM",
  "02:00 PM",
  "03:30 PM",
  "05:00 PM"
];

export const PatientAppointmentsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'ACCEPTED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'>('SCHEDULED');

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('10:00 AM');
  const [reason, setReason] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [doctorSlots, setDoctorSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isSlotDropdownOpen, setIsSlotDropdownOpen] = useState(false);

  // Cancel Confirmation Modal State
  const [cancellingAptId, setCancellingAptId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  // View Report Modal State
  const [selectedRecord, setSelectedRecord] = useState<DiagnosticRecord | null>(null);
  const [loadingRecord, setLoadingRecord] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();

    if (searchParams.get('book') === 'true') {
      setIsBookModalOpen(true);
    }
  }, []);

  useEffect(() => {
    if (selectedDoctorId && appointmentDate) {
      fetchDoctorSlotAvailability(selectedDoctorId, appointmentDate);
    } else {
      setDoctorSlots([]);
    }
  }, [selectedDoctorId, appointmentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/appointments/my');
      setAppointments(res.data || []);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/doctors');
      setDoctors(res.data || []);
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    }
  };

  const fetchDoctorSlotAvailability = async (doctorId: string, dateStr: string) => {
    try {
      setLoadingSlots(true);
      const res = await api.get(`/doctors/${doctorId}/availability?date=${dateStr}`);
      const slotsList = res.data?.slots || [];
      setDoctorSlots(slotsList);

      const currentSlotObj = slotsList.find((s: any) => s.slot === appointmentTime);
      if (!currentSlotObj || currentSlotObj.status !== 'AVAILABLE') {
        const firstAvailable = slotsList.find((s: any) => s.status === 'AVAILABLE');
        if (firstAvailable) {
          setAppointmentTime(firstAvailable.slot);
        } else {
          setAppointmentTime('');
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctor slot availability:', err);
      setDoctorSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleOpenBookModal = () => {
    setIsBookModalOpen(true);
    setBookingSuccess(false);
    if (!appointmentDate) {
      setAppointmentDate(new Date().toISOString().split('T')[0]);
    }
  };

  const handleCloseBookModal = () => {
    setIsBookModalOpen(false);
    if (searchParams.get('book')) {
      searchParams.delete('book');
      setSearchParams(searchParams);
    }
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !appointmentDate || !appointmentTime) {
      alert('Please fill in all required fields (Doctor, Date, and Time).');
      return;
    }

    if (bookedSlots.includes(appointmentTime)) {
      alert('The selected time slot is already booked for this doctor. Please choose a different slot.');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/appointments', {
        doctor_id: selectedDoctorId,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        reason: reason,
        notes: bookingNotes
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setIsBookModalOpen(false);
        setBookingSuccess(false);
        setSelectedDoctorId('');
        setAppointmentDate('');
        setAppointmentTime('10:00 AM');
        setReason('');
        setBookingNotes('');
        fetchAppointments();
      }, 1500);

    } catch (err: any) {
      console.error('Booking failed:', err);
      alert(err.response?.data?.detail || 'Failed to schedule appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!cancellingAptId) return;

    try {
      setCancelling(true);
      await api.post(`/appointments/cancel/${cancellingAptId}`);
      setCancellingAptId(null);
      fetchAppointments();
    } catch (err: any) {
      console.error('Cancel failed:', err);
      alert(err.response?.data?.detail || 'Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  const handleViewReport = (recordId: string) => {
    navigate(`/patient/records?record_id=${recordId}`);
  };



  const filteredAppointments = appointments.filter(apt => apt.status === activeTab);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Pending Doctor Confirmation
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Check className="w-3.5 h-3.5" /> Confirmed by Doctor
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Declined by Doctor
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-500 border border-slate-500/30">
            <XCircle className="w-3.5 h-3.5" /> Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7f6] text-slate-800 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 font-extrabold">
              My Medical Appointments
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Schedule doctor consultations, view appointment tokens, and access AI diagnostic reports.
            </p>
          </div>
          <button
            onClick={handleOpenBookModal}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5" /> Book New Appointment
          </button>
        </div>



        {/* Status Filter Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['SCHEDULED', 'ACCEPTED', 'COMPLETED', 'REJECTED', 'CANCELLED'] as const).map((tab) => {
              const count = appointments.filter(a => a.status === tab).length;
              const label = tab === 'SCHEDULED' ? 'Pending' : tab.charAt(0) + tab.slice(1).toLowerCase();
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeTab === tab
                      ? 'bg-slate-100 text-emerald-400 border border-slate-200 shadow-md'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {label}
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab ? 'bg-emerald-600 text-slate-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Appointments Grid / List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
            <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading your appointments...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-400">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center text-slate-500 space-y-4">
            <Calendar className="w-16 h-16 mx-auto text-slate-600 opacity-60" />
            <div>
              <h3 className="text-lg font-bold text-slate-700">No Appointments Found</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
                You currently have no {activeTab === 'SCHEDULED' ? 'pending' : activeTab.toLowerCase()} appointments.
              </p>
            </div>
            <button
              onClick={handleOpenBookModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-sm font-semibold transition-all"
            >
              <Plus className="w-4 h-4" /> Book Your First Appointment
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAppointments.map((apt) => (
              <div 
                key={apt.id}
                className="bg-white hover:bg-white border border-slate-200/80 hover:border-slate-200 rounded-2xl p-6 transition-all duration-200 flex flex-col justify-between shadow-lg relative group overflow-hidden"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-lg">
                        <Stethoscope className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-base group-hover:text-emerald-300 transition-colors">
                          Dr. {apt.doctor_name || 'Specialist Doctor'}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          {apt.doctor_specialty || 'General Practitioner'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    {getStatusBadge(apt.status)}
                  </div>

                  {/* Prominent Session Token Box for Patient */}
                  <div className="bg-slate-50 dark:bg-[#0c1322] border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between text-xs shadow-sm">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>Appointment Token:</span>
                    </div>
                    <span className="font-mono font-extrabold text-emerald-600 text-sm bg-[#f4f7f6] px-2.5 py-1 rounded-lg border border-slate-200/80 tracking-wider">
                      {apt.appointment_code}
                    </span>
                  </div>

                  <div className="bg-[#f4f7f6]/60 rounded-xl p-3.5 border border-slate-200/80 space-y-2 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 text-xs flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Date:
                      </span>
                      <span className="font-semibold text-slate-700">{apt.appointment_date}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span className="text-slate-500 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-teal-400" /> Time Slot:
                      </span>
                      <span className="font-semibold text-slate-700">{apt.appointment_time}</span>
                    </div>
                  </div>

                  {apt.reason && (
                    <div className="text-xs text-slate-500 border-l-2 border-slate-200 pl-3 py-1">
                      <span className="text-slate-600 font-medium">Reason: </span>
                      {apt.reason}
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-200/80 flex items-center justify-end gap-2">
                  {(apt.status === 'SCHEDULED' || apt.status === 'ACCEPTED') && (
                    <button
                      onClick={() => setCancellingAptId(apt.id)}
                      className="w-full py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" /> Cancel Appointment
                    </button>
                  )}

                  {apt.status === 'COMPLETED' && apt.record_id && (
                    <button
                      onClick={() => handleViewReport(apt.record_id!)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-emerald-400" /> View Diagnostic Report
                    </button>
                  )}

                  {apt.status === 'COMPLETED' && !apt.record_id && (
                    <span className="text-xs text-slate-500 italic py-1">
                      Completed (Report Pending)
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Booking Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 max-w-lg w-full shadow-2xl relative space-y-6 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Schedule Doctor Appointment</h2>
                  <p className="text-xs text-slate-500">Book a consultation with a specialist doctor</p>
                </div>
              </div>
              <button 
                onClick={handleCloseBookModal}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Appointment Scheduled!</h3>
                <p className="text-sm text-slate-500">Your request has been submitted successfully to the doctor.</p>
              </div>
            ) : (
              <form onSubmit={handleBookAppointment} className="space-y-4">
                {/* Doctor Selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Select Doctor *
                  </label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    required
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-4 py-3 text-slate-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="">-- Choose a Specialist Doctor --</option>
                    {doctors.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        Dr. {doc.full_name} ({doc.specialty || 'General Physician'})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date & Time Selection */}
                <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Appointment Date *
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      required
                      className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                {/* Real-time Doctor Time Slot Availability Dropdown & Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Preferred Appointment Time Slot *</span>
                    {loadingSlots && <span className="text-[10px] text-emerald-400 animate-pulse font-normal">Checking doctor availability...</span>}
                  </label>

                  {!selectedDoctorId ? (
                    <div className="p-3.5 rounded-xl bg-[#f4f7f6]/60 border border-slate-200/80 text-center text-xs text-slate-500">
                      Please select a Specialist Doctor above to view available time slots.
                    </div>
                  ) : loadingSlots ? (
                    <div className="p-3.5 rounded-xl bg-[#f4f7f6]/60 border border-slate-200/80 text-center text-xs text-emerald-400 font-medium animate-pulse">
                      Fetching availability slots for Dr. {doctors.find(d => d.id === selectedDoctorId)?.full_name || ''}...
                    </div>
                  ) : (
                    <div className="relative space-y-2 select-none">
                      {/* Custom Scrollable Select Trigger */}
                      <button
                        type="button"
                        onClick={() => setIsSlotDropdownOpen(!isSlotDropdownOpen)}
                        className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors flex items-center justify-between font-medium cursor-pointer"
                      >
                        {appointmentTime ? (
                          <span className="flex items-center gap-2">
                            <span>
                              {doctorSlots.find((s: any) => s.slot === appointmentTime)?.status === 'BOOKED'
                                ? '🔴'
                                : doctorSlots.find((s: any) => s.slot === appointmentTime)?.status === 'AVAILABLE'
                                ? '🟢'
                                : '⚪'}
                            </span>
                            <span className="font-bold text-slate-800">{appointmentTime}</span>
                            <span className="text-xs text-emerald-400 font-normal">
                              ({doctorSlots.find((s: any) => s.slot === appointmentTime)?.status === 'BOOKED' ? 'Booked' : 'Available'})
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-500">-- Select Available Time Slot --</span>
                        )}
                        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isSlotDropdownOpen ? 'rotate-180 text-emerald-400' : ''}`} />
                      </button>

                      {/* Custom Scrollable Dropdown Menu */}
                      {isSlotDropdownOpen && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-1.5 bg-[#f4f7f6]/95 backdrop-blur-md border border-slate-200/80 rounded-xl shadow-2xl max-h-48 overflow-y-auto p-1.5 space-y-1 scrollbar-thin scrollbar-thumb-emerald-500/40 scrollbar-track-slate-900 border-emerald-500/20">
                          {doctorSlots.map((s: any) => {
                            const isAvailable = s.status === 'AVAILABLE';
                            const isBooked = s.status === 'BOOKED';
                            const isSelected = appointmentTime === s.slot;

                            return (
                              <button
                                key={s.slot}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => {
                                  setAppointmentTime(s.slot);
                                  setIsSlotDropdownOpen(false);
                                }}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                                  isBooked
                                    ? 'bg-amber-500/10 text-amber-400 cursor-not-allowed opacity-80 border border-amber-500/20'
                                    : !isAvailable
                                    ? 'bg-white text-slate-500 cursor-not-allowed opacity-60 border border-slate-900'
                                    : isSelected
                                    ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-md shadow-emerald-500/20'
                                    : 'hover:bg-white text-slate-700 cursor-pointer border border-transparent hover:border-slate-200/80'
                                }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{isBooked ? '🔴' : isAvailable ? '🟢' : '⚪'}</span>
                                  <span className="font-bold">{s.slot}</span>
                                </span>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider">
                                  {isBooked ? 'Booked' : isAvailable ? (isSelected ? 'Selected ✓' : 'Available') : 'Not Available'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1 font-medium pt-0.5">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>🟢 Available</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500"></span>🔴 Booked</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-600"></span>⚪ Not Available</span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Reason */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Reason for Visit / Symptoms
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Regular Diabetes Checkup, Blood Pressure evaluation"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    Additional Health Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Any existing medical history or symptoms doctor should know..."
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="w-full bg-[#f4f7f6] border border-slate-200/80 rounded-xl px-4 py-2.5 text-slate-700 text-sm focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleCloseBookModal}
                    className="px-5 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-sm font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                        Scheduling...
                      </>
                    ) : (
                      'Confirm Appointment'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancellingAptId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white backdrop-blur-md animate-fade-in">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Cancel Appointment?</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to cancel this scheduled appointment? This action cannot be undone.
            </p>
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setCancellingAptId(null)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-sm font-semibold transition-all"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleCancelAppointment}
                disabled={cancelling}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-slate-800 text-sm font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Yes, Cancel Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Diagnostic Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 lg:p-8 max-w-3xl w-full shadow-2xl relative space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Clinical Diagnostic Report</h2>
                  <p className="text-xs text-slate-500">Generated via Explainable AI Diagnostic Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingRecord || !selectedRecord ? (
              <div className="py-16 text-center text-slate-500 space-y-3">
                <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm font-medium">Fetching report details...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Result Header */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Disease Category</span>
                    <span className="text-base font-bold text-emerald-400 uppercase">{selectedRecord.disease_type}</span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Diagnostic Status</span>
                    <span className={`text-base font-extrabold ${
                      selectedRecord.risk_level === 'HIGH' ? 'text-rose-400' :
                      selectedRecord.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {selectedRecord.prediction_result}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider block mb-1">Confidence Score</span>
                    <span className="text-base font-bold text-slate-800">
                      {(selectedRecord.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Input Clinical Metrics */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-400" /> Clinical Vitals & Parameters
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Object.entries(selectedRecord.input_data || {}).map(([key, val]) => (
                      <div key={key} className="bg-[#f4f7f6]/50 border border-slate-200/80 rounded-xl p-3 text-xs">
                        <span className="text-slate-500 block font-medium capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-slate-700 font-bold text-sm mt-0.5 block">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SHAP Feature Contribution */}
                {selectedRecord.shap_values && Object.keys(selectedRecord.shap_values).length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-teal-400" /> Feature Risk Impact (SHAP Analysis)
                    </h4>
                    <div className="bg-[#f4f7f6]/60 border border-slate-200/80 rounded-xl p-4 space-y-3">
                      {Object.entries(selectedRecord.shap_values).map(([feature, val]) => {
                        const numericVal = Number(val);
                        const isRiskIncrease = numericVal > 0;
                        const percentage = Math.min(Math.abs(numericVal) * 100, 100);
                        return (
                          <div key={feature} className="space-y-1">
                            <div className="flex justify-between text-xs font-medium">
                              <span className="text-slate-600 capitalize">{feature.replace(/_/g, ' ')}</span>
                              <span className={isRiskIncrease ? 'text-rose-400' : 'text-emerald-400'}>
                                {isRiskIncrease ? `+${numericVal.toFixed(3)} (Increased Risk)` : `${numericVal.toFixed(3)} (Reduced Risk)`}
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${isRiskIncrease ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.max(percentage, 5)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Blockchain Receipt */}
                {selectedRecord.blockchain_tx_hash && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <ShieldCheck className="w-5 h-5 flex-shrink-0" />
                      <div>
                        <span className="font-bold block text-slate-700">Blockchain Audit Verified</span>
                        <span className="text-slate-500 font-mono text-[10px]">Tx: {selectedRecord.blockchain_tx_hash}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

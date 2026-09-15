import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, 
  Stethoscope, Building2, Key, ShieldCheck, RefreshCw, Save, Activity, FileText, User
} from 'lucide-react';
import api from '../../services/api';

interface Props {
  doctorId: string;
  onBack: () => void;
}

export const DoctorDetailsManagement: React.FC<Props> = ({ doctorId, onBack }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'shared' | 'slots'>('overview');

  // Slot Availability State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [slotData, setSlotData] = useState<any[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [savingSlots, setSavingSlots] = useState<boolean>(false);
  const [slotMsg, setSlotMsg] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState<string>('');

  useEffect(() => {
    fetchDoctorDetails();
  }, [doctorId]);

  useEffect(() => {
    fetchSlotAvailability(selectedDate);
  }, [doctorId, selectedDate]);

  const fetchDoctorDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/hospitals/doctors/${doctorId}/details`);
      setData(res.data);
    } catch (err) {
      console.error("Error fetching doctor details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSlotAvailability = async (dateStr: string) => {
    setLoadingSlots(true);
    try {
      const res = await api.get(`/doctors/${doctorId}/availability?date=${dateStr}`);
      setSlotData(res.data.slots || []);
      const availSlots = (res.data.slots || [])
        .filter((s: any) => s.status === 'AVAILABLE')
        .map((s: any) => s.slot);
      setSelectedSlots(availSlots);
    } catch (err) {
      console.error("Error fetching doctor slot availability:", err);
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
    if (isBooked) return; // Cannot alter booked slots
    if (selectedSlots.includes(slotName)) {
      setSelectedSlots(selectedSlots.filter(s => s !== slotName));
    } else {
      setSelectedSlots([...selectedSlots, slotName]);
    }
  };

  const handleSaveSlots = async () => {
    setSavingSlots(true);
    setSlotMsg(null);
    try {
      await api.post(`/doctors/${doctorId}/availability`, {
        available_date: selectedDate,
        time_slots: selectedSlots
      });
      setSlotMsg(`Availability slots saved for ${selectedDate}!`);
      fetchSlotAvailability(selectedDate);
      setTimeout(() => setSlotMsg(null), 3000);
    } catch (err: any) {
      console.error("Error saving slot availability:", err);
      alert("Failed to save availability slots.");
    } finally {
      setSavingSlots(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
        <p className="text-sm font-semibold">Loading doctor details & performance hub...</p>
      </div>
    );
  }

  const { doctor, appointments_summary, analysis_records, shared_reports } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            Back to Doctors Directory
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDoctorDetails}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              Refresh
            </button>
          </div>
        </div>

        {/* Doctor Identity Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-2xl flex items-center justify-center text-slate-950 font-black text-xl shadow-lg shadow-cyan-500/20">
              <Stethoscope className="w-7 h-7 text-slate-950" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {doctor.name}
                <span className="px-2.5 py-0.5 text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full font-medium">
                  {doctor.specialization}
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>Department: <strong className="text-slate-200">{doctor.department}</strong></span>
                <span>License: <strong className="text-cyan-400 font-mono">{doctor.license_number}</strong></span>
                <span>Email: <strong className="text-slate-200">{doctor.email}</strong></span>
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'overview'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Overview & Appointments Summary
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'records'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Doctor Analysis Records ({analysis_records.length})
          </button>

          <button
            onClick={() => setActiveTab('shared')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'shared'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            Shared Patient Reports ({shared_reports.length})
          </button>

          <button
            onClick={() => setActiveTab('slots')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'slots'
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-800/60 text-emerald-400 hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            24-Hour Calendar Slot Management
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Appointments Metrics */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Scheduled */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Scheduled (Pending)</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-amber-400">{appointments_summary.scheduled}</span>
                <Clock className="w-6 h-6 text-amber-400/60" />
              </div>
              <p className="text-[11px] text-slate-500">Awaiting doctor review</p>
            </div>

            {/* Accepted */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Accepted (Awaiting Analysis)</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-cyan-400">{appointments_summary.accepted}</span>
                <CheckCircle2 className="w-6 h-6 text-cyan-400/60" />
              </div>
              <p className="text-[11px] text-slate-500">Accepted for consultation</p>
            </div>

            {/* Rejected */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejected Appointments</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-rose-400">{appointments_summary.rejected}</span>
                <XCircle className="w-6 h-6 text-rose-400/60" />
              </div>
              <p className="text-[11px] text-slate-500">Declined by doctor</p>
            </div>

            {/* Completed */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed (Treated)</span>
              <div className="flex items-center justify-between">
                <span className="text-3xl font-extrabold text-emerald-400">{appointments_summary.completed}</span>
                <ShieldCheck className="w-6 h-6 text-emerald-400/60" />
              </div>
              <p className="text-[11px] text-slate-500">AI analysis completed</p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Doctor Performance Overview
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dr. {doctor.name} has managed a total of <strong className="text-white font-bold">{appointments_summary.total} appointments</strong> and generated <strong className="text-white font-bold">{analysis_records.length} diagnostic medical records</strong> directly at your facility.
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Doctor Analysis Records */}
      {activeTab === 'records' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              Diagnostic Records Created by Dr. {doctor.name}
            </h2>
            <p className="text-xs text-slate-400">Medical diagnostic predictions run directly by this doctor.</p>
          </div>

          {analysis_records.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs">
              No diagnostic analysis records created by this doctor yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Record Code</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Disease Analysis</th>
                    <th className="py-3 px-4">Result</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Created Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {analysis_records.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.record_code}</td>
                      <td className="py-3 px-4 text-white font-medium">{r.patient_name} ({r.patient_code})</td>
                      <td className="py-3 px-4">{r.disease}</td>
                      <td className="py-3 px-4 text-slate-200">{r.result}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.risk_level === 'High' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {r.risk_level || 'Low'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{r.created_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Shared Patient Reports */}
      {activeTab === 'shared' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              Patient Reports Shared with Dr. {doctor.name}
            </h2>
            <p className="text-xs text-slate-400">Reports authorized to this doctor via patient Access Tokens.</p>
          </div>

          {shared_reports.length === 0 ? (
            <div className="text-center py-12 text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/60 text-xs">
              No shared patient reports found for this doctor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 uppercase text-[10px] text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Token Code</th>
                    <th className="py-3 px-4">Record Code</th>
                    <th className="py-3 px-4">Patient Name</th>
                    <th className="py-3 px-4">Diagnostic Context</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Authorized Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {shared_reports.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{s.token_code}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{s.record_code}</td>
                      <td className="py-3 px-4 text-white font-medium">{s.patient_name}</td>
                      <td className="py-3 px-4">{s.disease}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{s.authorized_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: 24-Hour Calendar Slot Availability Management */}
      {activeTab === 'slots' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-400" />
                24-Hour Availability Calendar & Time Slot Configurator
              </h2>
              <p className="text-xs text-slate-400">Select a date and click to enable or disable time slots for patient appointments.</p>
            </div>

            {/* Date & Custom Time Selector */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-300">Select Date:</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-300">Add Flexible Time:</label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSlot}
                  disabled={!customTime}
                  className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition disabled:opacity-40 shadow-sm"
                >
                  + Add Slot
                </button>
              </div>
            </div>
          </div>

          {slotMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{slotMsg}</span>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-emerald-500 rounded-md"></div>
              <span className="text-slate-300 font-medium">Available (Click to deselect)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-amber-500/80 rounded-md"></div>
              <span className="text-slate-300 font-medium">Booked Appointment (Disabled)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3.5 h-3.5 bg-slate-800 rounded-md border border-slate-700"></div>
              <span className="text-slate-400 font-medium">Not Available (Click to select)</span>
            </div>
          </div>

          {/* Slot Grid */}
          {loadingSlots ? (
            <div className="p-12 text-center text-xs text-cyan-400">Loading slot availability for {selectedDate}...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {slotData.map((s: any) => {
                const isBooked = s.status === 'BOOKED';
                const isSelected = selectedSlots.includes(s.slot);

                return (
                  <button
                    key={s.slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => handleToggleSlot(s.slot, isBooked)}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer select-none ${
                      isBooked
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 cursor-not-allowed opacity-80'
                        : isSelected
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20 hover:bg-emerald-400'
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>{s.slot}</span>
                    <span className="text-[10px] font-extrabold opacity-90">
                      {isBooked ? 'Booked' : isSelected ? 'Available' : 'Not Available'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleSaveSlots}
              disabled={savingSlots}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{savingSlots ? 'Saving Slots...' : 'Save Availability Slots'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorDetailsManagement;

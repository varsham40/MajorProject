import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { FolderOpen, Upload, FileText, Calendar, Plus, File, CheckCircle2 } from 'lucide-react';

export const MedicalReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploading, setUploading] = useState(false);

  const fetchReports = () => {
    api.get('/patients/me/reports')
      .then(res => setReports(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', description);
    formData.append('report_date', reportDate);

    try {
      await api.post('/patients/me/reports/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowUpload(false);
      setFile(null);
      setDescription('');
      fetchReports();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="p-8 text-emerald-600 text-center">Loading Medical Reports...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-bold">Personal Medical Reports Repository</h1>
          <p className="text-xs text-slate-500">Store lab reports, blood work, MRIs, CT scans, and prescriptions for checkups</p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-dark-900 font-bold text-xs shadow-lg shadow-cyan-500/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Medical Document</span>
        </button>
      </div>

      {/* Upload Form Modal / Panel */}
      {showUpload && (
        <form onSubmit={handleUploadSubmit} className="glass-panel p-6 rounded-2xl border border-cyan-500/30 space-y-4 max-w-xl">
          <h3 className="text-base font-bold text-slate-900 font-bold flex items-center gap-2">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Upload New Personal Medical Report</span>
          </h3>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Description / Document Name</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Fasting Blood Glucose Report"
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Report Date</label>
            <input
              type="date"
              required
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Select File (PDF, Image, Doc)</label>
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-2.5 rounded-xl bg-cyan-500 text-dark-900 font-extrabold text-xs"
          >
            {uploading ? 'Uploading...' : 'Confirm Upload'}
          </button>
        </form>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((r) => (
          <div key={r.id} className="glass-panel p-5 rounded-2xl space-y-3 border border-slate-200/80">
            <div className="flex items-start justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-emerald-600">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                {(r.file_size / 1024).toFixed(1)} KB
              </span>
            </div>

            <div>
              <h3 className="font-bold text-slate-800 text-sm">{r.description || r.file_name}</h3>
              <p className="text-xs text-slate-500 truncate mt-0.5">{r.file_name}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/80">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {r.report_date}
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Checkup
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

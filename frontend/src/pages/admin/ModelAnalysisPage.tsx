import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { BarChart3, Cpu, Activity } from 'lucide-react';

export const ModelAnalysisPage: React.FC = () => {
  const [diseaseKey, setDiseaseKey] = useState('diabetes');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/admin/model-analysis/${diseaseKey}`)
      .then(res => setAnalysis(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [diseaseKey]);

  const rocData = analysis?.roc_curve ? analysis.roc_curve.fpr.map((fprVal: number, idx: number) => ({
    fpr: fprVal,
    tpr: analysis.roc_curve.tpr[idx]
  })) : [];

  const featImportanceData = analysis?.feature_importance ? Object.entries(analysis.feature_importance).map(([k, v]) => ({
    feature: k,
    importance: v
  })).sort((a: any, b: any) => b.importance - a.importance).slice(0, 10) : [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">AI Model Analysis & Validation</h1>
          <p className="text-xs text-slate-400">Confusion Matrix, Receiver Operating Characteristic (ROC) Curves, & Feature Importance Rankings</p>
        </div>

        <select
          value={diseaseKey}
          onChange={(e) => setDiseaseKey(e.target.value)}
          className="bg-dark-800 border border-slate-700 rounded-xl px-4 py-2 text-xs text-cyan-400 font-bold"
        >
          <option value="diabetes">Diabetes Model Analysis</option>
          <option value="heart_disease">Heart Disease Model Analysis</option>
          <option value="kidney_disease">Kidney Disease Model Analysis</option>
          <option value="liver_disease">Liver Disease Model Analysis</option>
          <option value="thyroid_disease">Thyroid Disease Model Analysis</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8 text-cyan-400 text-center font-semibold">Loading Model Analysis...</div>
      ) : !analysis ? (
        <div className="p-8 text-slate-400 text-center">No analysis data found for this disease model.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Confusion Matrix */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <span>Confusion Matrix ({analysis.disease})</span>
            </h2>

            <div className="p-6 rounded-xl bg-dark-800/80 border border-slate-800 grid grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-xs text-slate-400 block">True Negative (TN)</span>
                <span className="text-2xl font-extrabold text-emerald-400">{analysis.confusion_matrix?.[0]?.[0] ?? 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <span className="text-xs text-slate-400 block">False Positive (FP)</span>
                <span className="text-2xl font-extrabold text-rose-400">{analysis.confusion_matrix?.[0]?.[1] ?? 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
                <span className="text-xs text-slate-400 block">False Negative (FN)</span>
                <span className="text-2xl font-extrabold text-rose-400">{analysis.confusion_matrix?.[1]?.[0] ?? 0}</span>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <span className="text-xs text-slate-400 block">True Positive (TP)</span>
                <span className="text-2xl font-extrabold text-emerald-400">{analysis.confusion_matrix?.[1]?.[1] ?? 0}</span>
              </div>
            </div>
          </div>

          {/* ROC Curve Chart */}
          <div className="glass-panel p-6 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span>ROC Curve (AUC: {((analysis.metrics.roc_auc || 0) * 100).toFixed(1)}%)</span>
            </h2>

            <div className="w-full h-60">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rocData}>
                  <XAxis dataKey="fpr" label={{ value: 'False Positive Rate', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis label={{ value: 'True Positive Rate', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                  <Line type="monotone" dataKey="tpr" stroke="#a855f7" strokeWidth={3} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Feature Importances */}
          <div className="glass-panel p-6 rounded-2xl space-y-4 lg:col-span-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-400" />
              <span>Global Feature Importance Rankings</span>
            </h2>

            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featImportanceData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#fff' }} />
                  <Bar dataKey="importance" fill="#fbbf24" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

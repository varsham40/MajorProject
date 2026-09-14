import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Database, Play, Upload, CheckCircle2, AlertCircle, FileCheck, Cpu } from 'lucide-react';

export const ModelTrainingPage: React.FC = () => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form State
  const [selectedDisease, setSelectedDisease] = useState('diabetes');
  const [datasetMode, setDatasetMode] = useState<'default' | 'custom'>('default');
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState('XGBClassifier');

  // Execution State
  const [training, setTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = () => {
    setLoadingHistory(true);
    api.get('/admin/model-training')
      .then(res => setRuns(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoadingHistory(false));
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleTrainSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTraining(true);
    setError(null);
    setTrainingResult(null);

    const formData = new FormData();
    formData.append('disease_key', selectedDisease);
    formData.append('algorithm', algorithm);
    if (datasetMode === 'custom' && customFile) {
      formData.append('file', customFile);
    }

    try {
      const res = await api.post('/admin/models/train', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setTrainingResult(res.data);
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Model training failed. Ensure dataset format is valid.');
    } finally {
      setTraining(false);
    }
  };

  const diseases = [
    { key: 'diabetes', name: 'Diabetes' },
    { key: 'heart_disease', name: 'Heart Disease' },
    { key: 'kidney_disease', name: 'Kidney Disease' },
    { key: 'liver_disease', name: 'Liver Disease' },
    { key: 'thyroid_disease', name: 'Thyroid Disease' }
  ];

  const algorithms = [
    { id: 'VotingEnsemble', name: 'Soft Voting Ensemble (RF + XGB + MLP + LR + SVC Combined)' },
    { id: 'XGBClassifier', name: 'XGBoost Classifier (Extreme Gradient Boosting)' },
    { id: 'RandomForestClassifier', name: 'Random Forest Classifier (Ensemble Trees)' },
    { id: 'GradientBoostingClassifier', name: 'Gradient Boosting Classifier' },
    { id: 'LogisticRegression', name: 'Logistic Regression (Linear Odds Ratio)' },
    { id: 'SVC', name: 'Support Vector Classifier (RBF Kernel)' },
    { id: 'MLPClassifier', name: 'Multi-Layer Perceptron (Neural Network)' }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-white">AI Model Training & Optimization Studio</h1>
        <p className="text-xs text-slate-400">Train across 6 top clinical ML algorithms, evaluate performance, and generate .pkl artifacts</p>
      </div>

      {/* Training Control Panel */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Multi-Algorithm Model Trainer</h2>
            <p className="text-xs text-slate-400">Select algorithm, pick dataset, and re-train model weights</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleTrainSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Disease Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Target Disease Model</label>
              <select
                value={selectedDisease}
                onChange={(e) => setSelectedDisease(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {diseases.map(d => (
                  <option key={d.key} value={d.key}>{d.name}</option>
                ))}
              </select>
            </div>

            {/* Algorithm Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">ML Algorithm Architecture</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full bg-dark-800 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                {algorithms.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Dataset Mode Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Dataset Source</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDatasetMode('default')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                    datasetMode === 'default'
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-dark-800 text-slate-400 border-slate-700/60'
                  }`}
                >
                  Default Dataset
                </button>
                <button
                  type="button"
                  onClick={() => setDatasetMode('custom')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                    datasetMode === 'custom'
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                      : 'bg-dark-800 text-slate-400 border-slate-700/60'
                  }`}
                >
                  Upload CSV
                </button>
              </div>
            </div>
          </div>

          {/* Custom File Upload Box */}
          {datasetMode === 'custom' && (
            <div className="p-4 rounded-xl bg-dark-800/60 border border-dashed border-slate-700 space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <Upload className="w-4 h-4 text-cyan-400" />
                <span>Upload Custom Dataset CSV File</span>
              </label>
              <input
                type="file"
                accept=".csv"
                required
                onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-cyan-500/20 file:text-cyan-400 hover:file:bg-cyan-500/30 cursor-pointer"
              />
              {customFile && (
                <p className="text-[11px] text-emerald-400 font-mono">
                  Selected File: {customFile.name} ({(customFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={training}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-dark-900 font-extrabold text-sm shadow-lg shadow-cyan-500/25 flex items-center gap-2 disabled:opacity-50"
          >
            {training ? (
              <>
                <div className="w-4 h-4 border-2 border-dark-900 border-t-transparent rounded-full animate-spin" />
                <span>Training {algorithm} & Exporting .pkl Artifacts...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Run {algorithm} Training Now</span>
              </>
            )}
          </button>
        </form>

        {/* Training Result Success Display */}
        {trainingResult && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                <span>{trainingResult.message}</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Duration: {trainingResult.metrics?.duration}s
              </span>
            </div>

            {/* Metrics Badge Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="p-3 rounded-xl bg-dark-900/60 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Accuracy</p>
                <p className="text-base font-extrabold text-emerald-400">
                  {((trainingResult.metrics?.accuracy || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/60 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Precision</p>
                <p className="text-base font-extrabold text-emerald-400">
                  {((trainingResult.metrics?.precision || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/60 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-medium">Recall</p>
                <p className="text-base font-extrabold text-emerald-400">
                  {((trainingResult.metrics?.recall || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/60 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-medium">F1 Score</p>
                <p className="text-base font-extrabold text-emerald-400">
                  {((trainingResult.metrics?.f1_score || 0) * 100).toFixed(1)}%
                </p>
              </div>
              <div className="p-3 rounded-xl bg-dark-900/60 border border-emerald-500/20 text-center">
                <p className="text-[10px] text-slate-400 font-medium">ROC-AUC</p>
                <p className="text-base font-extrabold text-emerald-400">
                  {((trainingResult.metrics?.roc_auc || 0) * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Generated Artifact Paths */}
            <div className="space-y-1.5 text-xs">
              <p className="font-semibold text-slate-300 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-cyan-400" />
                <span>Exported Model Artifact Files (.pkl & .joblib):</span>
              </p>
              <div className="bg-dark-900/80 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <p><span className="text-cyan-400">model.pkl:</span> {trainingResult.artifacts_saved?.model_pkl}</p>
                <p><span className="text-cyan-400">scaler.pkl:</span> {trainingResult.artifacts_saved?.scaler_pkl}</p>
                <p><span className="text-cyan-400">shap_explainer.pkl:</span> {trainingResult.artifacts_saved?.shap_pkl}</p>
                <p><span className="text-cyan-400">model_bundle.joblib:</span> {trainingResult.artifacts_saved?.joblib_bundle}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Model Training History Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800 space-y-4">
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white text-base">Model Training History</h2>
          </div>
          <span className="text-xs text-slate-400">{runs.length} Runs Recorded</span>
        </div>

        {loadingHistory ? (
          <div className="p-8 text-center text-cyan-400 text-xs font-semibold">Loading Training History...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-dark-800/50">
                  <th className="py-3 px-4">Disease Model</th>
                  <th className="py-3 px-4">Dataset Name</th>
                  <th className="py-3 px-4">Train / Test Samples</th>
                  <th className="py-3 px-4">Accuracy</th>
                  <th className="py-3 px-4">F1 Score</th>
                  <th className="py-3 px-4">ROC-AUC</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Training Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {runs.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-white">{r.disease}</td>
                    <td className="py-3.5 px-4 font-mono text-cyan-400">{r.dataset_name}</td>
                    <td className="py-3.5 px-4 text-slate-300">{r.training_samples} / {r.testing_samples}</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400">{((r.accuracy || 0) * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-slate-300">{((r.f1_score || 0) * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-slate-300">{((r.roc_auc || 0) * 100).toFixed(1)}%</td>
                    <td className="py-3.5 px-4 text-slate-400">{r.training_duration}s</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-400">{r.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

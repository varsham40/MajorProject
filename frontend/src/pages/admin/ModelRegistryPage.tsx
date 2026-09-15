import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Cpu, CheckCircle2 } from 'lucide-react';

export const ModelRegistryPage: React.FC = () => {
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/model-registry')
      .then(res => setModels(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-emerald-600 text-center font-semibold">Loading AI Model Registry...</div>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-bold">AI Model Registry</h1>
        <p className="text-xs text-slate-500">Deployed Machine Learning Model Artifacts for Disease Inference & SHAP Explainability</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {models.map((m) => (
          <div key={m.id} className="glass-panel p-6 rounded-2xl space-y-4 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-600">Version {m.version}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {m.status}
              </span>
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 font-bold">{m.disease}</h3>
              <p className="text-xs text-slate-500">{m.algorithm}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200/80">
              <div className="p-2 rounded-lg bg-white">
                <span className="text-slate-500">Accuracy</span>
                <p className="font-bold text-emerald-600">{((m.accuracy || 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-lg bg-white">
                <span className="text-slate-500">Precision</span>
                <p className="font-bold text-emerald-400">{((m.precision || 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-lg bg-white">
                <span className="text-slate-500">Recall</span>
                <p className="font-bold text-purple-400">{((m.recall || 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-2 rounded-lg bg-white">
                <span className="text-slate-500">ROC-AUC</span>
                <p className="font-bold text-amber-400">{((m.roc_auc || 0) * 100).toFixed(1)}%</p>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 space-y-0.5 font-mono pt-1">
              <p>Features: {m.feature_count} Inputs</p>
              <p className="truncate">Artifact: {m.artifact_path}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

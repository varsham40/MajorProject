import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ReferenceLine } from 'recharts';

interface SHAPFeature {
  feature_name: string;
  patient_value: string;
  shap_value: number;
  effect: string;
}

interface SHAPChartProps {
  features: SHAPFeature[];
  baseValue?: number;
}

export const SHAPChart: React.FC<SHAPChartProps> = ({ features }) => {
  if (!features || !Array.isArray(features) || features.length === 0) {
    return <div className="p-4 text-center text-slate-500 text-xs">No SHAP feature contributions available to display.</div>;
  }

  const validFeatures = features.filter(f => f && typeof f.shap_value === 'number');
  const sorted = [...validFeatures].sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value));
  const topFeatures = sorted.slice(0, 8);

  const chartData = topFeatures.map(f => ({
    name: f.feature_name,
    value: f.shap_value,
    patient_value: f.patient_value,
    effect: f.effect
  }));

  const maxAbsVal = Math.max(...chartData.map(d => Math.abs(d.value)), 0.005);
  const domainMin = -maxAbsVal * 1.25;
  const domainMax = maxAbsVal * 1.25;

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 110, bottom: 5 }}>
          <XAxis
            type="number"
            stroke="#94a3b8"
            domain={[domainMin, domainMax]}
            tickFormatter={(v) => (Math.abs(v) < 0.01 ? v.toFixed(3) : v.toFixed(2))}
          />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" width={140} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#090d16', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#fff' }}
            formatter={(value: any, _name: any, item: any) => [
              `${value > 0 ? '+' : ''}${value} (Patient Value: ${item.payload.patient_value})`,
              'SHAP Impact'
            ]}
          />
          <ReferenceLine x={0} stroke="#475569" strokeDasharray="3 3" />
          <Bar dataKey="value" radius={[4, 4, 4, 4]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#f43f5e' : '#10b981'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
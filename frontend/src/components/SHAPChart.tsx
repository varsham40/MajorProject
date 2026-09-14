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
  baseValue: number;
}

export const SHAPChart: React.FC<SHAPChartProps> = ({ features }) => {
  const chartData = features.slice(0, 8).map(f => ({
    name: f.feature_name,
    value: f.shap_value,
    patient_value: f.patient_value,
    effect: f.effect
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 5 }}>
          <XAxis type="number" stroke="#94a3b8" tickFormatter={(v) => v.toFixed(2)} />
          <YAxis dataKey="name" type="category" stroke="#94a3b8" width={110} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem', color: '#fff' }}
            formatter={(value: any, name: any, item: any) => [
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

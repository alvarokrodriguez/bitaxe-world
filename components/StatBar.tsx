
import React, { useEffect, useState } from 'react';

interface StatBarProps {
  label: string;
  value: number;
  maxValue: number;
}

export const StatBar: React.FC<StatBarProps> = ({ label, value, maxValue }) => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Animate the bar width on value change
    const percentage = (value / maxValue) * 100;
    const timeout = setTimeout(() => setWidth(percentage), 50); // Small delay to trigger transition
    return () => clearTimeout(timeout);
  }, [value, maxValue]);

  return (
    <div className="w-full animate-fade-in-up">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-semibold uppercase tracking-wider text-gray-300 cyber-label font-orbitron">{label}</span>
        <span className="text-sm font-bold text-white cyber-value font-orbitron">{value}</span>
      </div>
      <div className="h-4 w-full bg-slate-900/50 p-[2px] cyber-bar-container">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 cyber-bar-fill"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

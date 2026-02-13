
import React from 'react';
import { PasswordStrength } from '../types';

interface StrengthMeterProps {
  strength: PasswordStrength;
  score: number;
}

const StrengthMeter: React.FC<StrengthMeterProps> = ({ strength, score }) => {
  const getColors = () => {
    switch (strength) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-orange-500';
      case 'good': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      case 'legendary': return 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs uppercase tracking-widest font-bold text-gray-400">
        <span>Strength: <span className="text-white">{strength}</span></span>
        <span>{score}%</span>
      </div>
      <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${getColors()}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

export default StrengthMeter;

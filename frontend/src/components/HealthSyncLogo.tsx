import React from 'react';

interface LogoProps {
  containerClass?: string;
  iconSize?: string;
}

export const HealthSyncLogo: React.FC<LogoProps> = ({ 
  containerClass = "w-13 h-13 min-w-[3.25rem] rounded-2xl bg-[#d7f4eb] flex items-center justify-center shadow-md p-1 border border-emerald-300/40 shrink-0", 
  iconSize = "w-11 h-11" 
}) => {
  return (
    <div className={containerClass}>
      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={iconSize}>
        {/* Top Earpiece Dots */}
        <circle cx="56" cy="38" r="8" fill="#043c32" />
        <circle cx="118" cy="38" r="8" fill="#043c32" />

        {/* Main Stethoscope U-Arc around Heart */}
        <path
          d="M 56 38 C 30 75, 40 132, 87 150 C 95 153, 98 153, 105 148 C 145 125, 142 75, 118 38"
          fill="none"
          stroke="#043c32"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Extension Tube Loop to Chestpiece */}
        <path
          d="M 98 149 C 115 160, 145 176, 160 148 C 172 126, 164 104, 150 104"
          fill="none"
          stroke="#043c32"
          strokeWidth="11"
          strokeLinecap="round"
        />

        {/* Chestpiece Diaphragm */}
        <circle cx="150" cy="104" r="14" fill="#043c32" />
        <circle cx="150" cy="104" r="9" fill="#d7f4eb" />
        <circle cx="150" cy="104" r="4" fill="#043c32" />

        {/* Center Emerald Heart */}
        <path
          d="M 87 76 C 79 62, 57 62, 51 76 C 43 94, 63 114, 87 130 C 111 114, 131 94, 123 76 C 117 62, 95 62, 87 76 Z"
          fill="#1fb888"
        />

        {/* White ECG Pulse Line */}
        <path
          d="M 58 96 L 72 96 L 77 84 L 84 110 L 92 88 L 97 96 L 116 96"
          stroke="#ffffff"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

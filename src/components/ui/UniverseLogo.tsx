import React from 'react';

export const UniverseLogo = ({ className = "h-10 w-auto" }: { className?: string }) => (
  <svg
    viewBox="0 0 380 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="veloraGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38bdf8" /> {/* sky-400 */}
        <stop offset="100%" stopColor="#4f46e5" /> {/* indigo-600 */}
      </linearGradient>
      <linearGradient id="textGrad" x1="120" y1="0" x2="380" y2="0" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#0f172a" /> {/* slate-900 */}
        <stop offset="100%" stopColor="#334155" /> {/* slate-700 */}
      </linearGradient>
    </defs>

    <g>
      {/* Outer Ring */}
      <circle cx="50" cy="50" r="40" stroke="url(#veloraGrad)" strokeWidth="8" />
      
      {/* The V shape */}
      <path 
        d="M32 30 L50 68 L68 30" 
        stroke="url(#veloraGrad)" 
        strokeWidth="10" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </g>

    {/* Text Group */}
    <text 
      x="120" 
      y="66" 
      fontFamily="system-ui, -apple-system, sans-serif" 
      fontSize="54" 
      fontWeight="900" 
      letterSpacing="5"
    >
      <tspan fill="url(#textGrad)">VELORA</tspan>
    </text>
  </svg>
);

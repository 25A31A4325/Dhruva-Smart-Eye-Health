import React from 'react';

export const DistanceIllustration = ({ currentDistance = 55 }) => {
  // Normalize distance for SVG visualization: clamp between 20 and 100
  const clampedDist = Math.max(20, Math.min(100, currentDistance));
  
  // Calculate horizontal position for user figure in SVG viewBox (0 to 500)
  // When distance = 20, monitor at 100, user at 200 (close)
  // When distance = 70, user at 350 (ideal)
  // When distance = 100, user at 440 (far)
  const userX = 140 + (clampedDist * 2.8);

  const getZoneColor = () => {
    if (clampedDist < 35) return '#E11D48'; // Rose / Danger
    if (clampedDist < 50) return '#D97706'; // Amber / Warning
    if (clampedDist <= 75) return '#059669'; // Emerald / Safe
    return '#475569'; // Slate / Far
  };

  const getZoneText = () => {
    if (clampedDist < 35) return 'Danger: Ciliary Muscle Spasm Risk (< 35 cm)';
    if (clampedDist < 50) return 'Borderline: Below Recommended Arm\'s Length (35 - 50 cm)';
    if (clampedDist <= 75) return 'Optimal Ergonomic Safe Zone (50 - 75 cm)';
    return 'Extended Viewing Distance (> 75 cm)';
  };

  const color = getZoneColor();

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white rounded-2xl p-6 border border-slate-200/80 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase font-semibold text-slate-600 tracking-wider">Ergonomic Schematic</span>
          <h4 className="text-sm font-bold text-slate-800">Visual Distance & Gaze Angle</h4>
        </div>
        <div className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${color}15`, color: color }}>
          {getZoneText()}
        </div>
      </div>

      <div className="relative w-full aspect-[21/9] max-h-56 bg-slate-50/70 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center p-2">
        <svg viewBox="0 0 520 200" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
          {/* Desk Surface */}
          <line x1="30" y1="170" x2="490" y2="170" stroke="#CBD5E1" strokeWidth="4" strokeLinecap="round" />

          {/* Computer / Monitor */}
          <rect x="75" y="65" width="12" height="85" rx="3" fill="#0F172A" />
          <rect x="87" y="68" width="5" height="79" fill="#0284C7" />
          {/* Monitor Stand */}
          <path d="M 81 150 L 81 170" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
          <path d="M 65 170 L 97 170" stroke="#334155" strokeWidth="6" strokeLinecap="round" />

          {/* Eye Level Horizontal Reference Line */}
          <line x1="90" y1="75" x2={userX} y2="75" stroke="#94A3B8" strokeWidth="1" strokeDasharray="3 3" />
          <text x="100" y="70" fill="#64748B" fontSize="9" fontFamily="sans-serif">Horizontal Eye Level</text>

          {/* Recommended Gaze Vector (15 deg downward) */}
          <line x1={userX - 8} y1="75" x2="90" y2="105" stroke={color} strokeWidth="2" strokeDasharray="4 2" />
          <text x={userX - 55} y="100" fill={color} fontSize="9" fontWeight="600" fontFamily="sans-serif">15°-20° Gaze</text>

          {/* User Ergonomic Figure */}
          <g transform={`translate(${userX}, 0)`}>
            {/* Head */}
            <circle cx="0" cy="75" r="16" fill="#38BDF8" opacity="0.2" />
            <circle cx="0" cy="75" r="16" stroke="#0284C7" strokeWidth="2.5" fill="#FFFFFF" />
            {/* Eye point */}
            <circle cx="-8" cy="75" r="3" fill="#0284C7" />
            <circle cx="-8" cy="75" r="1" fill="#FFFFFF" />
            {/* Neck & Torso */}
            <path d="M 0 91 L 0 115 L 12 170" stroke="#0369A1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {/* Arm extended towards desk */}
            <path d="M 0 102 L -28 135 L -10 168" stroke="#0EA5E9" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            {/* Seat/Chair indicator */}
            <path d="M 8 130 L 8 170" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
            <path d="M -5 140 L 15 140" stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
          </g>

          {/* Distance Dimension Line */}
          <line x1="92" y1="183" x2={userX} y2="183" stroke={color} strokeWidth="2" markerEnd="url(#arrow)" />
          <circle cx="92" cy="183" r="3" fill={color} />
          <circle cx={userX} cy="183" r="3" fill={color} />
          <text x={(92 + userX) / 2} y="196" textAnchor="middle" fill={color} fontSize="11" fontWeight="700" fontFamily="sans-serif">
            {currentDistance} cm
          </text>
        </svg>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          Safe: 50-75 cm (Arm's Length)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Borderline: 35-50 cm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          Danger: &lt; 35 cm
        </span>
      </div>
    </div>
  );
};

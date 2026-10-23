import React from 'react';

interface RoadStageProps {
  className?: string;
  debugOverlay?: boolean;
}

/**
 * RoadStage Component:
 * Provides a genuine, perspective coastal highway roadway ribbon for the hero bus.
 * Features:
 * - Curving asphalt highway ribbon traversing across the 2.5D paper ticket plane
 * - Outer concrete curb & metallic guardrail safety barrier separating road from water
 * - Solid white shoulder line & perspective amber dashed centerline
 * - Both ends feather smoothly via SVG alpha mask so there is NO rectangular cut
 * - Leaves the paper ticket's front edge, bevel, and branding visible
 */
export const RoadStage: React.FC<RoadStageProps> = ({
  className = '',
  debugOverlay = false,
}) => {
  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 960 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible select-none pointer-events-none drop-shadow-sm"
      >
        <defs>
          {/* Asphalt surface gradient: depth from distant curb to near shoulder */}
          <linearGradient id="roadAsphaltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2A374A" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#202A38" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#141B26" stopOpacity="1" />
          </linearGradient>

          {/* Concrete barrier / curb gradient */}
          <linearGradient id="roadCurbGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#CBD5E1" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#94A3B8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#64748B" stopOpacity="0.85" />
          </linearGradient>

          {/* Guardrail metallic reflection */}
          <linearGradient id="guardrailMetalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.4" />
            <stop offset="30%" stopColor="#E2E8F0" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#CBD5E1" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.5" />
          </linearGradient>

          {/* White shoulder paint line gradient */}
          <linearGradient id="whiteShoulderGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="25%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.95" />
          </linearGradient>

          {/* Amber centerline dashed markings gradient */}
          <linearGradient id="centerlineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="25%" stopColor="#FBBF24" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.85" />
          </linearGradient>

          {/* Soft Left and Right Edge Feathering Mask so road ends organically */}
          <mask id="roadRibbonFeatherMask">
            <linearGradient id="featherGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#000000" />
              <stop offset="8%" stopColor="#000000" />
              <stop offset="22%" stopColor="#FFFFFF" />
              <stop offset="78%" stopColor="#FFFFFF" />
              <stop offset="94%" stopColor="#000000" />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
            <rect x="0" y="0" width="960" height="220" fill="url(#featherGrad)" />
          </mask>
        </defs>

        {/* Group with organic double-edge feathering mask */}
        <g mask="url(#roadRibbonFeatherMask)">
          {/* 
            LAYER 1: GUARDRAIL POSTS (Along outer curb curve)
          */}
          {[
            { x: 140, y: 110, h: 20 },
            { x: 220, y: 104, h: 20 },
            { x: 310, y: 98, h: 19 },
            { x: 410, y: 92, h: 18 },
            { x: 520, y: 86, h: 18 },
            { x: 630, y: 80, h: 17 },
            { x: 740, y: 74, h: 16 },
            { x: 840, y: 69, h: 15 },
            { x: 920, y: 64, h: 15 },
          ].map((post, idx) => (
            <rect
              key={`post-${idx}`}
              x={post.x - 2}
              y={post.y - post.h}
              width="4.5"
              height={post.h}
              rx="1"
              fill="#64748B"
              opacity="0.8"
            />
          ))}

          {/* Dual Metallic Safety Beam Rails */}
          <path
            d="M 80,102 Q 320,86 580,72 T 940,50"
            stroke="url(#guardrailMetalGrad)"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <path
            d="M 80,110 Q 320,94 580,80 T 940,58"
            stroke="url(#guardrailMetalGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* 
            LAYER 2: CONCRETE CURB BASE (Separates guardrail and asphalt)
          */}
          <path
            d="M 50,126 Q 300,108 560,92 T 940,68 L 940,80 Q 560,104 300,120 T 50,138 Z"
            fill="url(#roadCurbGrad)"
          />

          {/* 
            LAYER 3: MAIN ASPHALT HIGHWAY RIBBON
            Gracefully sweeping ribbon: curves from mid-left across to front-right
            DOES NOT fill down to bottom corners! Leaves ticket visible!
          */}
          <path
            d="M 50,136 Q 300,118 560,102 T 940,78 L 940,165 Q 600,186 320,198 T 50,192 Z"
            fill="url(#roadAsphaltGrad)"
          />

          {/* Subtle Asphalt Texture / Surface sheen */}
          <path
            d="M 50,136 Q 300,118 560,102 T 940,78 L 940,110 Q 600,134 300,150 T 50,162 Z"
            fill="#FFFFFF"
            opacity="0.04"
          />

          {/* 
            LAYER 4: SOLID WHITE SHOULDER LINE (Near outer concrete curb)
          */}
          <path
            d="M 60,142 Q 310,124 570,108 T 930,84"
            stroke="url(#whiteShoulderGrad)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />

          {/* 
            LAYER 5: PERSPECTIVE DASHED CENTERLINE (Yellow Amber)
            Curves naturally along the lane center
          */}
          <path
            d="M 70,168 Q 330,150 590,132 T 930,118"
            stroke="url(#centerlineGrad)"
            strokeWidth="3.0"
            strokeDasharray="22 18"
            strokeLinecap="round"
          />

          {/* 
            LAYER 6: FOREGROUND INNER SHOULDER ACCENT LINE
            Marks the front boundary of the asphalt ribbon on the ticket
          */}
          <path
            d="M 60,188 Q 320,194 600,182 T 930,160"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeOpacity="0.3"
            strokeLinecap="round"
          />
        </g>

        {/* Optional dev debug overlay for geometry verification */}
        {debugOverlay && (
          <g>
            <rect x="0" y="0" width="960" height="220" fill="none" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 4" />
            <text x="10" y="20" fill="#EF4444" fontSize="12" fontFamily="monospace">
              RoadStage SVG Ribbon [960x220] - Curving Highway
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

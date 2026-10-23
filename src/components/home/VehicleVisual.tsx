import React from 'react';
import type { VehicleCategory } from '../../types';
import {
  VEHICLE_VISUAL_METADATA,
  MASTER_GROUND_BASELINE_PERCENT,
} from '../../data/vehicleVisualMetadata';

interface VehicleVisualProps {
  category: VehicleCategory;
  debugMode?: boolean;
  className?: string;
}

export const VehicleVisual: React.FC<VehicleVisualProps> = ({
  category,
  debugMode = false,
  className = '',
}) => {
  const meta = VEHICLE_VISUAL_METADATA[category] || VEHICLE_VISUAL_METADATA.sleeper;

  // Vertical alignment offset so that lowest wheel contact precisely aligns
  // with the master ground baseline across all 3 vehicle models
  const groundOffsetPercent = MASTER_GROUND_BASELINE_PERCENT - meta.groundBaselineYPercent;

  // Check URL query param for dev debug mode (e.g., ?debug=vehicle)
  const isDebugActive =
    debugMode ||
    (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).has('debug'));

  return (
    <div
      className={`relative w-full aspect-[1376/768] select-none ${className}`}
      style={{
        transform: `translateY(${groundOffsetPercent}%) scale(${meta.displayScale})`,
        transformOrigin: 'bottom center',
        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* 1. SOFT AMBIENT UNDERBODY SHADOW (Anchored to chassis) */}
      <div
        className="absolute pointer-events-none select-none rounded-full"
        style={{
          left: `${meta.ambientShadow.xPercent}%`,
          top: `${meta.ambientShadow.yPercent}%`,
          width: `${meta.ambientShadow.widthPercent}%`,
          height: `${meta.ambientShadow.heightPercent}%`,
          transform: 'translate(-50%, -50%)',
          backgroundColor: '#080E18',
          opacity: meta.ambientShadow.opacity,
          filter: `blur(${meta.ambientShadow.blurPx}px)`,
          zIndex: 6,
        }}
        aria-hidden="true"
      />

      {/* 2. PRECISE TIRE GROUND CONTACT PATCHES (Individual per-wheel shadows) */}
      {meta.visibleWheelContacts.map((wheel) => (
        <div
          key={wheel.id}
          className="absolute pointer-events-none select-none rounded-full"
          style={{
            left: `${wheel.xPercent}%`,
            top: `${wheel.yPercent}%`,
            width: `${wheel.widthPercent}%`,
            height: '2.5%',
            minHeight: '4px',
            transform: 'translate(-50%, -40%)',
            backgroundColor: '#050912',
            opacity: (wheel.intensity ?? 0.9) * 0.95,
            filter: 'blur(2px)',
            zIndex: 8,
          }}
          aria-hidden="true"
        />
      ))}

      {/* 3. SHARP BUS TRANSPARENT PNG IMAGE WITH TRUE ALPHA */}
      <img
        src={meta.image}
        alt={meta.name}
        className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none drop-shadow-xs z-10"
        loading="eager"
      />

      {/* 4. OPTIONAL DEV-ONLY ALIGNMENT & CONTACT INSPECTION OVERLAY */}
      {isDebugActive && (
        <div className="absolute inset-0 pointer-events-none z-30 font-mono text-[10px]">
          {/* Master Ground Baseline */}
          <div
            className="absolute inset-x-0 border-b-2 border-red-500 flex items-center justify-between px-2 bg-red-500/10"
            style={{ top: `${MASTER_GROUND_BASELINE_PERCENT}%` }}
          >
            <span className="text-red-600 font-bold bg-white/90 px-1 rounded -translate-y-1/2">
              MASTER GROUND BASELINE ({MASTER_GROUND_BASELINE_PERCENT}%)
            </span>
            <span className="text-red-600 bg-white/90 px-1 rounded -translate-y-1/2">
              Offset: +{groundOffsetPercent.toFixed(2)}% | Scale: {meta.displayScale}
            </span>
          </div>

          {/* Wheel Contact Markers */}
          {meta.visibleWheelContacts.map((wheel) => (
            <div
              key={`debug-${wheel.id}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              style={{
                left: `${wheel.xPercent}%`,
                top: `${wheel.yPercent}%`,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 border border-black animate-pulse" />
              <span className="bg-black/85 text-cyan-300 px-1 py-0.5 rounded text-[8px] whitespace-nowrap mt-0.5">
                {wheel.name} ({wheel.xPercent.toFixed(1)}%, {wheel.yPercent.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

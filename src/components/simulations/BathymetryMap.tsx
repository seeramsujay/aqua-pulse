import React, { useMemo } from 'react';
import { BathymetryPoint } from '../../types/sonar';
import { getSeafloorDepth } from '../../physics/oceanAcoustics';

interface BathymetryMapProps {
  soundings: BathymetryPoint[];
  terrainType: string;
  onClear: () => void;
}

export const BathymetryMap: React.FC<BathymetryMapProps> = ({ soundings, terrainType, onClear }) => {
  const WORLD_WIDTH_M = 2000;
  const MAX_DEPTH_M = 1500;

  // True terrain profile points
  const trueProfile = useMemo(() => {
    const pts: { x: number; depth: number }[] = [];
    for (let x = 0; x <= WORLD_WIDTH_M; x += 25) {
      pts.push({ x, depth: getSeafloorDepth(x, terrainType, WORLD_WIDTH_M) });
    }
    return pts;
  }, [terrainType]);

  const svgWidth = 460;
  const svgHeight = 220;
  const padding = { top: 15, right: 15, bottom: 25, left: 45 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const mapX = (x: number) => padding.left + (x / WORLD_WIDTH_M) * plotWidth;
  const mapY = (depth: number) => padding.top + (depth / MAX_DEPTH_M) * plotHeight;

  // True profile path
  const truePath = useMemo(() => {
    return trueProfile.reduce((acc, p, idx) => {
      const px = mapX(p.x);
      const py = mapY(p.depth);
      return idx === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
    }, '');
  }, [trueProfile]);

  // Sounding metrics calculation
  const stats = useMemo(() => {
    if (soundings.length === 0) return { coveragePct: 0, avgConfidence: 0, rmsErrorM: 0 };

    // Group by 50m bins to calculate spatial coverage
    const bins = new Set(soundings.map((s) => Math.floor(s.x / 50)));
    const totalBins = WORLD_WIDTH_M / 50;
    const coveragePct = Math.min(100, Math.round((bins.size / totalBins) * 100));

    const avgConfidence = Math.round(
      soundings.reduce((sum, s) => sum + s.confidence, 0) / soundings.length
    );

    const errorSum = soundings.reduce((sum, s) => {
      const err = (s.measuredDepth || s.trueDepth) - s.trueDepth;
      return sum + err * err;
    }, 0);
    const rmsErrorM = Math.sqrt(errorSum / soundings.length).toFixed(1);

    return { coveragePct, avgConfidence, rmsErrorM };
  }, [soundings]);

  return (
    <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400">
            Reconstructed Bathymetry Map
          </h3>
          <p className="text-[10px] text-slate-400">Acoustic Hydrographic Sounding Reconstruction</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={onClear}
            className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
          >
            RESET MAP
          </button>
        </div>
      </div>

      {/* Map SVG */}
      <div className="relative flex-1 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
        <svg width={svgWidth} height={svgHeight} className="w-full h-full">
          {/* Depth Grid Lines */}
          {[300, 600, 900, 1200, 1500].map((d) => (
            <g key={`bathy-grid-${d}`}>
              <line
                x1={padding.left}
                y1={mapY(d)}
                x2={padding.left + plotWidth}
                y2={mapY(d)}
                stroke="rgba(255, 255, 255, 0.05)"
              />
              <text
                x={padding.left - 6}
                y={mapY(d) + 3}
                textAnchor="end"
                className="text-[9px] font-mono fill-slate-500"
              >
                {d}m
              </text>
            </g>
          ))}

          {/* True Seafloor Reference Profile (dashed gray) */}
          <path d={truePath} fill="none" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="1.5" strokeDasharray="4 4" />

          {/* Sounded Points Overlay */}
          {soundings.map((s, idx) => {
            const px = mapX(s.x);
            const py = mapY(s.measuredDepth || s.trueDepth);
            const color =
              s.frequencyKHz && s.frequencyKHz < 15
                ? '#f59e0b'
                : s.frequencyKHz && s.frequencyKHz < 35
                ? '#10b981'
                : '#a855f7';

            return (
              <circle
                key={`sounding-${idx}`}
                cx={px}
                cy={py}
                r={3}
                fill={color}
                opacity={0.85}
              />
            );
          })}
        </svg>
      </div>

      {/* Metric Telemetry Cards */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px] font-mono">
        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <div className="text-slate-500 text-[10px]">SEABED COVERAGE</div>
          <div className="text-emerald-400 font-bold text-sm mt-0.5">{stats.coveragePct}%</div>
        </div>
        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <div className="text-slate-500 text-[10px]">AVG CONFIDENCE</div>
          <div className="text-cyan-400 font-bold text-sm mt-0.5">{stats.avgConfidence}%</div>
        </div>
        <div className="bg-slate-950/60 p-2 rounded border border-slate-800/80">
          <div className="text-slate-500 text-[10px]">RMS ERROR</div>
          <div className="text-purple-300 font-bold text-sm mt-0.5">±{stats.rmsErrorM}m</div>
        </div>
      </div>
    </div>
  );
};

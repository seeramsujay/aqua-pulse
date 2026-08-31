import React, { useMemo } from 'react';
import { BathymetryPoint } from '../../types/sonar';
import { getSeafloorDepth } from '../../physics/oceanAcoustics';
import { Map } from 'lucide-react';

interface BathymetryMapProps {
  soundings: BathymetryPoint[];
  terrainType: string;
  onClear: () => void;
}

export const BathymetryMap: React.FC<BathymetryMapProps> = ({ soundings, terrainType, onClear }) => {
  const WORLD_WIDTH_M = 2000;
  const MAX_DEPTH_M = 1500;

  const trueProfile = useMemo(() => {
    const pts: { x: number; depth: number }[] = [];
    for (let x = 0; x <= WORLD_WIDTH_M; x += 25) {
      pts.push({ x, depth: getSeafloorDepth(x, terrainType, WORLD_WIDTH_M) });
    }
    return pts;
  }, [terrainType]);

  const svgWidth  = 460;
  const svgHeight = 200;
  const pad       = { top: 12, right: 14, bottom: 24, left: 44 };

  const plotW = svgWidth - pad.left - pad.right;
  const plotH = svgHeight - pad.top - pad.bottom;

  const mapX = (x: number)     => pad.left + (x / WORLD_WIDTH_M) * plotW;
  const mapY = (depth: number) => pad.top  + (depth / MAX_DEPTH_M) * plotH;

  const truePath = useMemo(() =>
    trueProfile.reduce((acc, p, i) => {
      const px = mapX(p.x), py = mapY(p.depth);
      return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
    }, ''), [trueProfile]);

  // Build filled reconstruction polygon from soundings
  const soundingPath = useMemo(() => {
    if (soundings.length < 2) return '';
    const sorted = [...soundings].sort((a, b) => a.x - b.x);
    const topLeft  = `M ${mapX(sorted[0].x)} ${pad.top}`;
    const topRight = `L ${mapX(sorted[sorted.length - 1].x)} ${pad.top}`;
    const line = sorted.reduce((acc, s, i) => {
      const px = mapX(s.x), py = mapY(s.measuredDepth || s.trueDepth);
      return i === 0 ? `${acc} L ${px} ${py}` : `${acc} L ${px} ${py}`;
    }, topLeft + topRight.replace('M', 'L'));
    return line + ' Z';
  }, [soundings]);

  const stats = useMemo(() => {
    if (soundings.length === 0) return { coveragePct: 0, avgConfidence: 0, rmsErrorM: 0 };
    const bins = new Set(soundings.map((s) => Math.floor(s.x / 50)));
    const totalBins = WORLD_WIDTH_M / 50;
    const coveragePct    = Math.min(100, Math.round((bins.size / totalBins) * 100));
    const avgConfidence  = Math.round(soundings.reduce((sum, s) => sum + s.confidence, 0) / soundings.length);
    const errorSum       = soundings.reduce((sum, s) => {
      const err = (s.measuredDepth || s.trueDepth) - s.trueDepth;
      return sum + err * err;
    }, 0);
    const rmsErrorM = parseFloat(Math.sqrt(errorSum / soundings.length).toFixed(1));
    return { coveragePct, avgConfidence, rmsErrorM };
  }, [soundings]);

  return (
    <div className="glass-panel panel-accent-emerald flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-900/50 border border-emerald-700/40">
              <Map className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="panel-title text-emerald-400">Reconstructed Bathymetry</div>
              <p className="text-[9px] text-slate-500 mt-0.5">Acoustic Hydrographic Sounding Map</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {soundings.length > 0 && (
              <span className="hud-chip bg-emerald-950/70 text-emerald-400 border-emerald-700/50">
                {soundings.length} soundings
              </span>
            )}
            <button
              onClick={onClear}
              className="hud-chip bg-slate-900/70 text-slate-400 border-slate-700/50 hover:text-slate-200 hover:border-slate-600 transition-all cursor-pointer"
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {/* SVG Map */}
      <div className="relative flex-1 mx-4 rounded-lg overflow-hidden border border-white/[0.06] flex items-center justify-center"
        style={{ background: 'rgba(1, 10, 20, 0.8)' }}>
        <svg width={svgWidth} height={svgHeight} className="w-full h-full">
          <defs>
            <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(52,211,153,0.18)" />
              <stop offset="100%" stopColor="rgba(52,211,153,0)" />
            </linearGradient>
            <filter id="greenGlow">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Depth grid */}
          {[300, 600, 900, 1200, 1500].map((d) => (
            <g key={`bg-${d}`}>
              <line x1={pad.left} y1={mapY(d)} x2={pad.left + plotW} y2={mapY(d)}
                stroke="rgba(255,255,255,0.04)" />
              <text x={pad.left - 5} y={mapY(d) + 3} textAnchor="end"
                style={{ fontSize: 7, fill: 'rgba(100,116,139,0.7)', fontFamily: 'JetBrains Mono,monospace' }}>
                {d}m
              </text>
            </g>
          ))}

          {/* Reconstructed sounding area fill */}
          {soundingPath && (
            <path d={soundingPath} fill="url(#emeraldAreaGrad)" />
          )}

          {/* True seafloor reference */}
          <path d={truePath} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth={1.5} strokeDasharray="4 4" />

          {/* Individual sounding dots */}
          {soundings.map((s, idx) => {
            const px = mapX(s.x);
            const py = mapY(s.measuredDepth || s.trueDepth);
            const color =
              s.frequencyKHz && s.frequencyKHz < 15 ? '#f59e0b'
              : s.frequencyKHz && s.frequencyKHz < 35 ? '#10b981'
              : '#a855f7';
            return (
              <circle key={`sd-${idx}`} cx={px} cy={py} r={2.5} fill={color}
                style={{ filter: `drop-shadow(0 0 3px ${color})` }} opacity={0.9} />
            );
          })}

          {/* Reconstructed line over soundings */}
          {soundings.length > 1 && (() => {
            const sorted = [...soundings].sort((a, b) => a.x - b.x);
            const path = sorted.reduce((acc, s, i) => {
              const px = mapX(s.x), py = mapY(s.measuredDepth || s.trueDepth);
              return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
            }, '');
            return <path d={path} fill="none" stroke="rgba(52,211,153,0.6)" strokeWidth={1.5} filter="url(#greenGlow)" />;
          })()}
        </svg>
      </div>

      {/* Metrics footer */}
      <div className="px-4 pb-3.5 pt-2.5 border-t border-white/[0.06] grid grid-cols-3 gap-2">
        <div className="telemetry-cell">
          <div className="telemetry-label text-emerald-500/70">Seabed Coverage</div>
          <div className="telemetry-value text-emerald-300">{stats.coveragePct}%</div>
          <div className="progress-track mt-1.5">
            <div className="progress-fill bg-emerald-400" style={{ width: `${stats.coveragePct}%` }} />
          </div>
        </div>
        <div className="telemetry-cell">
          <div className="telemetry-label text-cyan-500/70">Avg Confidence</div>
          <div className="telemetry-value text-cyan-300">{stats.avgConfidence}%</div>
          <div className="progress-track mt-1.5">
            <div className="progress-fill bg-cyan-400" style={{ width: `${stats.avgConfidence}%` }} />
          </div>
        </div>
        <div className="telemetry-cell">
          <div className="telemetry-label text-violet-500/70">RMS Error</div>
          <div className="telemetry-value text-violet-300">±{stats.rmsErrorM}</div>
          <div className="text-[8px] text-slate-600 mt-0.5">meters</div>
        </div>
      </div>
    </div>
  );
};

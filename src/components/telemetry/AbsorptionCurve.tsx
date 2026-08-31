import React, { useMemo } from 'react';
import { ChirpBand, SonarMode } from '../../types/sonar';
import { calculateThorpAttenuation } from '../../physics/oceanAcoustics';
import { TrendingUp, ShieldAlert, Sparkles } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface AbsorptionCurveProps {
  activeBand: ChirpBand;
  mode: SonarMode;
  bands: ChirpBand[];
}

export const AbsorptionCurve: React.FC<AbsorptionCurveProps> = ({
  activeBand,
  mode,
  bands
}) => {
  const currentFreq = mode === 'rc-css' ? (activeBand.fStart + activeBand.fEnd) / 2 : 450;
  const currentAlpha = calculateThorpAttenuation(currentFreq);
  const animAlpha = useAnimatedValue(currentAlpha, 300, 1);

  // SVG Dimension mappings
  const width = 280;
  const height = 140;
  const pad = { top: 12, right: 14, bottom: 24, left: 34 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // Max freq 500 kHz, max alpha 140 dB/km
  const MAX_F = 500;
  const MAX_A = 140;

  const mapX = (f: number) => pad.left + (f / MAX_F) * plotW;
  const mapY = (a: number) => pad.top + plotH - (a / MAX_A) * plotH;

  // Generate curve path for Thorp's attenuation
  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let f = 10; f <= MAX_F; f += 10) {
      const a = calculateThorpAttenuation(f);
      const px = mapX(f);
      const py = mapY(Math.min(MAX_A, a));
      pts.push(`${f === 10 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(' ');
  }, []);

  const activeX = mapX(currentFreq);
  const activeY = mapY(Math.min(MAX_A, currentAlpha));

  return (
    <div className="glass-panel panel-accent-amber flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-900/50 border border-amber-700/40">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <div className="panel-title text-amber-400">Thorp Seawater Absorption</div>
              <p className="text-[9px] text-slate-500 mt-0.5">Quadratic Loss α(f) ∝ f² Frequency Response</p>
            </div>
          </div>
          <div className="hud-chip bg-amber-950/70 text-amber-400 border-amber-700/50">
            {animAlpha} dB/km
          </div>
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="px-3 pb-2 flex-1 flex flex-col justify-between">
        <div className="relative rounded-lg border border-white/[0.06] bg-black/40 p-1 flex items-center justify-center overflow-hidden">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible select-none">
            <defs>
              <linearGradient id="thorpGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(245, 166, 35, 0.05)" />
                <stop offset="100%" stopColor="rgba(244, 63, 94, 0.25)" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[30, 60, 90, 120].map((a) => (
              <g key={`y-${a}`}>
                <line x1={pad.left} y1={mapY(a)} x2={pad.left + plotW} y2={mapY(a)} stroke="rgba(255,255,255,0.05)" />
                <text x={pad.left - 4} y={mapY(a) + 3} textAnchor="end" className="text-[7px] fill-slate-500 font-mono">
                  {a}
                </text>
              </g>
            ))}

            {[100, 250, 400].map((f) => (
              <g key={`x-${f}`}>
                <line x1={mapX(f)} y1={pad.top} x2={mapX(f)} y2={pad.top + plotH} stroke="rgba(255,255,255,0.05)" />
                <text x={mapX(f)} y={pad.top + plotH + 11} textAnchor="middle" className="text-[7px] fill-slate-500 font-mono">
                  {f}k
                </text>
              </g>
            ))}

            {/* Sub-band highlight regions */}
            {mode === 'rc-css' &&
              bands.map((b) => {
                const x1 = mapX(b.fStart);
                const x2 = mapX(b.fEnd);
                const isActive = b.id === activeBand.id;
                return (
                  <rect
                    key={b.id}
                    x={x1}
                    y={pad.top}
                    width={Math.max(2, x2 - x1)}
                    height={plotH}
                    fill={b.color}
                    opacity={isActive ? 0.22 : 0.06}
                  />
                );
              })}

            {/* Thorp Curve */}
            <path
              d={curvePoints}
              fill="none"
              stroke="#fbbf24"
              strokeWidth={2}
              style={{ filter: 'drop-shadow(0 0 4px rgba(251,191,36,0.5))' }}
            />

            {/* Operating Point Indicator */}
            <line x1={activeX} y1={pad.top} x2={activeX} y2={pad.top + plotH} stroke="rgba(255,255,255,0.4)" strokeDasharray="2 2" />
            <circle cx={activeX} cy={activeY} r={5} fill="rgba(251,191,36,0.3)" />
            <circle
              cx={activeX}
              cy={activeY}
              r={3}
              fill={mode === 'rc-css' ? activeBand.color : '#f43f5e'}
              style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
            />
          </svg>
        </div>

        {/* Insight callout footer */}
        <div className="pt-2 text-[10px] font-mono flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            {mode === 'rc-css' ? (
              <Sparkles className="w-3 h-3 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-3 h-3 text-rose-400" />
            )}
            <span className={mode === 'rc-css' ? 'text-emerald-300' : 'text-rose-300'}>
              {mode === 'rc-css'
                ? `Active Band α: ${currentAlpha.toFixed(0)} dB/km (Controlled)`
                : `Conventional CW: ${currentAlpha.toFixed(0)} dB/km (Severe Attenuation)`}
            </span>
          </span>
          <span className="text-[9px] text-slate-500">MgSO₄ Relaxation</span>
        </div>
      </div>
    </div>
  );
};

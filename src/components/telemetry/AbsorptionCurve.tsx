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
    <div className="instrument-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="instrument-panel-header">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded"
            style={{
              background: '#12232D',
              border: '1px solid #20333D',
              padding: '6px',
            }}
          >
            <TrendingUp className="w-3.5 h-3.5" style={{ color: '#D9A441' }} />
          </div>
          <div>
            <div className="instrument-panel-title">Thorp Seawater Absorption</div>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Quadratic Loss α(f) ∝ f² Frequency Response</p>
          </div>
        </div>
        <div className="hud-chip">
          {animAlpha} dB/km
        </div>
      </div>

      {/* SVG Chart Container */}
      <div className="px-3 pb-2 flex-1 flex flex-col justify-between">
        <div
          className="relative rounded p-1 flex items-center justify-center overflow-hidden"
          style={{
            background: '#091319',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-28 overflow-visible select-none">
            {/* Grid lines */}
            {[30, 60, 90, 120].map((a) => (
              <g key={`y-${a}`}>
                <line x1={pad.left} y1={mapY(a)} x2={pad.left + plotW} y2={mapY(a)} stroke="rgba(255,255,255,0.04)" />
                <text x={pad.left - 4} y={mapY(a) + 3} textAnchor="end" className="text-[7px] fill-slate-500 font-mono">
                  {a}
                </text>
              </g>
            ))}

            {[100, 250, 400].map((f) => (
              <g key={`x-${f}`}>
                <line x1={mapX(f)} y1={pad.top} x2={mapX(f)} y2={pad.top + plotH} stroke="rgba(255,255,255,0.04)" />
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
                    opacity={isActive ? 0.25 : 0.08}
                  />
                );
              })}

            {/* Thorp Curve */}
            <path
              d={curvePoints}
              fill="none"
              stroke="#D9A441"
              strokeWidth={2}
            />

            {/* Operating Point Indicator */}
            <line x1={activeX} y1={pad.top} x2={activeX} y2={pad.top + plotH} stroke="rgba(255,255,255,0.3)" strokeDasharray="2 2" />
            <circle cx={activeX} cy={activeY} r={4.5} fill="rgba(217, 164, 65, 0.25)" stroke="#D9A441" strokeWidth={1} />
            <circle
              cx={activeX}
              cy={activeY}
              r={2.5}
              fill={mode === 'rc-css' ? '#43C7D9' : '#D96B6B'}
            />
          </svg>
        </div>

        {/* Insight callout footer */}
        <div
          className="pt-2 text-[10px] font-mono flex items-center justify-between"
          style={{ color: 'var(--text-secondary)' }}
        >
          <span className="flex items-center gap-1.5">
            {mode === 'rc-css' ? (
              <Sparkles className="w-3 h-3" style={{ color: '#63C79A' }} />
            ) : (
              <ShieldAlert className="w-3 h-3" style={{ color: '#D96B6B' }} />
            )}
            <span style={{ color: mode === 'rc-css' ? '#63C79A' : '#D96B6B' }}>
              {mode === 'rc-css'
                ? `Active Band α: ${currentAlpha.toFixed(0)} dB/km (Controlled)`
                : `Conventional CW: ${currentAlpha.toFixed(0)} dB/km (High Attenuation)`}
            </span>
          </span>
          <span className="text-[9px]" style={{ color: 'var(--text-dim)' }}>MgSO₄ Relaxation</span>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import { OceanLayer } from '../../types/sonar';
import { getOceanPropertiesAtDepth } from '../../physics/oceanAcoustics';
import { Waves } from 'lucide-react';

interface SoundSpeedProfileProps {
  layers: OceanLayer[];
  auvDepth: number;
  onLayerChange?: (layers: OceanLayer[]) => void;
}

export const SoundSpeedProfile: React.FC<SoundSpeedProfileProps> = ({ layers, auvDepth }) => {
  const MAX_DEPTH = 1500;
  const MIN_SPEED = 1460;
  const MAX_SPEED = 1550;
  const MIN_TEMP = 0;
  const MAX_TEMP = 30;

  const profilePoints = useMemo(() => {
    const points: { depth: number; soundSpeed: number; temp: number; salinity: number }[] = [];
    for (let z = 0; z <= MAX_DEPTH; z += 15) {
      const prop = getOceanPropertiesAtDepth(layers, z);
      points.push({ depth: z, soundSpeed: prop.soundSpeed, temp: prop.temp, salinity: prop.salinity });
    }
    return points;
  }, [layers]);

  const svgWidth = 260;
  const svgHeight = 420;
  const pad = { top: 18, right: 16, bottom: 28, left: 44 };

  const plotW = svgWidth - pad.left - pad.right;
  const plotH = svgHeight - pad.top - pad.bottom;

  const mapDepthToY  = (d: number) => pad.top + (d / MAX_DEPTH) * plotH;
  const mapSpeedToX  = (s: number) => pad.left + ((s - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * plotW;
  const mapTempToX   = (t: number) => pad.left + ((t - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * plotW;

  const speedPath = useMemo(() =>
    profilePoints.reduce((acc, p, i) => {
      const x = mapSpeedToX(p.soundSpeed), y = mapDepthToY(p.depth);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, ''), [profilePoints]);

  const tempPath = useMemo(() =>
    profilePoints.reduce((acc, p, i) => {
      const x = mapTempToX(p.temp), y = mapDepthToY(p.depth);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, ''), [profilePoints]);

  // Area fill path for speed curve
  const speedAreaPath = useMemo(() => {
    if (profilePoints.length === 0) return '';
    const first = profilePoints[0];
    const last = profilePoints[profilePoints.length - 1];
    const linePart = profilePoints.reduce((acc, p, i) => {
      const x = mapSpeedToX(p.soundSpeed), y = mapDepthToY(p.depth);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
    return `${linePart} L ${pad.left} ${mapDepthToY(last.depth)} L ${pad.left} ${mapDepthToY(first.depth)} Z`;
  }, [profilePoints]);

  const auvY = mapDepthToY(auvDepth);
  const currentAuvProps = getOceanPropertiesAtDepth(layers, auvDepth);

  return (
    <div className="glass-panel panel-accent-cyan flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-3.5">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-900/50 border border-cyan-700/40">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <div className="panel-title text-cyan-400">Sound Speed Profile</div>
              <p className="text-[9px] text-slate-500 mt-0.5">Mackenzie-1981 Stratification c(z)</p>
            </div>
          </div>
          <div className="hud-chip bg-cyan-950/70 text-cyan-400 border-cyan-700/50">c(z) m/s</div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative flex-1 flex items-center justify-center px-2 pb-2">
        <svg width={svgWidth} height={svgHeight} className="overflow-visible select-none">
          <defs>
            <linearGradient id="speedAreaGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0,240,255,0.10)" />
              <stop offset="100%" stopColor="rgba(0,240,255,0)" />
            </linearGradient>
            <filter id="cyanGlow">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Layer background shading */}
          {layers.map((layer) => {
            const y1 = mapDepthToY(layer.depthStart);
            const y2 = mapDepthToY(layer.depthEnd);
            return (
              <g key={layer.id}>
                <rect x={pad.left} y={y1} width={plotW} height={y2 - y1} fill={layer.color} opacity={0.4} />
                <line x1={pad.left} y1={y2} x2={pad.left + plotW} y2={y2}
                  stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
              </g>
            );
          })}

          {/* Depth grid lines */}
          {[0, 300, 600, 900, 1200, 1500].map((d) => (
            <g key={`dg-${d}`}>
              <line x1={pad.left} y1={mapDepthToY(d)} x2={pad.left + plotW} y2={mapDepthToY(d)}
                stroke="rgba(255,255,255,0.05)" />
              <text x={pad.left - 6} y={mapDepthToY(d) + 3} textAnchor="end"
                style={{ fontSize: 8, fill: 'rgba(100,116,139,0.8)', fontFamily: 'JetBrains Mono,monospace' }}>
                {d}m
              </text>
            </g>
          ))}

          {/* Speed X axis labels */}
          {[1470, 1500, 1530].map((s) => (
            <g key={`sg-${s}`}>
              <line x1={mapSpeedToX(s)} y1={pad.top} x2={mapSpeedToX(s)} y2={pad.top + plotH}
                stroke="rgba(255,255,255,0.04)" />
              <text x={mapSpeedToX(s)} y={pad.top + plotH + 14} textAnchor="middle"
                style={{ fontSize: 8, fill: 'rgba(0,240,255,0.5)', fontFamily: 'JetBrains Mono,monospace' }}>
                {s}
              </text>
            </g>
          ))}

          {/* Speed area fill */}
          <path d={speedAreaPath} fill="url(#speedAreaGrad)" />

          {/* Temperature dashed curve */}
          <path d={tempPath} fill="none" stroke="#f97316" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.55} />

          {/* Sound speed curve with glow */}
          <path d={speedPath} fill="none" stroke="#00f0ff" strokeWidth={2.5} filter="url(#cyanGlow)" />
          <path d={speedPath} fill="none" stroke="#00f0ff" strokeWidth={2} />

          {/* AUV depth indicator */}
          <line x1={pad.left} y1={auvY} x2={pad.left + plotW} y2={auvY}
            stroke="rgba(234,179,8,0.7)" strokeWidth={1} strokeDasharray="4 3" />
          {/* AUV animated dot */}
          <circle cx={mapSpeedToX(currentAuvProps.soundSpeed)} cy={auvY} r={6}
            fill="rgba(234,179,8,0.15)" stroke="rgba(234,179,8,0.5)" strokeWidth={1} />
          <circle cx={mapSpeedToX(currentAuvProps.soundSpeed)} cy={auvY} r={3.5}
            fill="#eab308" />
        </svg>
      </div>

      {/* Telemetry readout footer */}
      <div className="px-4 pb-3.5 pt-2 border-t border-white/[0.06] space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="telemetry-cell">
            <div className="telemetry-label text-cyan-500/70">c(z)</div>
            <div className="telemetry-value text-cyan-300 text-base">{currentAuvProps.soundSpeed.toFixed(0)}</div>
            <div className="text-[8px] text-slate-600 mt-0.5">m/s</div>
          </div>
          <div className="telemetry-cell">
            <div className="telemetry-label text-orange-500/70">Temp</div>
            <div className="telemetry-value text-orange-300 text-base">{currentAuvProps.temp.toFixed(1)}</div>
            <div className="text-[8px] text-slate-600 mt-0.5">°C</div>
          </div>
          <div className="telemetry-cell">
            <div className="telemetry-label text-slate-500">Salinity</div>
            <div className="telemetry-value text-slate-300 text-base">{currentAuvProps.salinity.toFixed(1)}</div>
            <div className="text-[8px] text-slate-600 mt-0.5">PSU</div>
          </div>
        </div>
      </div>
    </div>
  );
};

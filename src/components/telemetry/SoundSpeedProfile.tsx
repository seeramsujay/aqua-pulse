import React, { useMemo } from 'react';
import { OceanLayer } from '../../types/sonar';
import { getOceanPropertiesAtDepth } from '../../physics/oceanAcoustics';
import { Waves } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

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

  const mapDepthToY = (d: number) => pad.top + (d / MAX_DEPTH) * plotH;
  const mapSpeedToX = (s: number) => pad.left + ((s - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * plotW;
  const mapTempToX = (t: number) => pad.left + ((t - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * plotW;

  const speedPath = useMemo(
    () =>
      profilePoints.reduce((acc, p, i) => {
        const x = mapSpeedToX(p.soundSpeed),
          y = mapDepthToY(p.depth);
        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, ''),
    [profilePoints]
  );

  const tempPath = useMemo(
    () =>
      profilePoints.reduce((acc, p, i) => {
        const x = mapTempToX(p.temp),
          y = mapDepthToY(p.depth);
        return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
      }, ''),
    [profilePoints]
  );

  // Area fill path for speed curve
  const speedAreaPath = useMemo(() => {
    if (profilePoints.length === 0) return '';
    const first = profilePoints[0];
    const last = profilePoints[profilePoints.length - 1];
    const linePart = profilePoints.reduce((acc, p, i) => {
      const x = mapSpeedToX(p.soundSpeed),
        y = mapDepthToY(p.depth);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
    return `${linePart} L ${pad.left} ${mapDepthToY(last.depth)} L ${pad.left} ${mapDepthToY(first.depth)} Z`;
  }, [profilePoints]);

  const auvY = mapDepthToY(auvDepth);
  const currentAuvProps = getOceanPropertiesAtDepth(layers, auvDepth);

  const animSpeed = useAnimatedValue(currentAuvProps.soundSpeed, 250, 0);
  const animTemp = useAnimatedValue(currentAuvProps.temp, 250, 1);
  const animSalinity = useAnimatedValue(currentAuvProps.salinity, 250, 1);

  return (
    <div className="instrument-panel flex flex-col h-full overflow-hidden">
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
            <Waves className="w-3.5 h-3.5" style={{ color: '#43C7D9' }} />
          </div>
          <div>
            <div className="instrument-panel-title">Sound Speed Profile</div>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Mackenzie-1981 Stratification c(z)</p>
          </div>
        </div>
        <div className="hud-chip">c(z) m/s</div>
      </div>

      {/* SVG Chart */}
      <div className="relative flex-1 flex items-center justify-center px-2 pb-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full max-h-[460px] overflow-visible select-none"
        >
          <defs>
            <linearGradient id="speedAreaGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(67, 199, 217, 0.12)" />
              <stop offset="100%" stopColor="rgba(67, 199, 217, 0.0)" />
            </linearGradient>
          </defs>

          {/* Layer background shading */}
          {layers.map((layer) => {
            const y1 = mapDepthToY(layer.depthStart);
            const y2 = mapDepthToY(layer.depthEnd);
            return (
              <g key={layer.id}>
                <rect x={pad.left} y={y1} width={plotW} height={y2 - y1} fill={layer.color} opacity={0.3} />
                <line
                  x1={pad.left}
                  y1={y2}
                  x2={pad.left + plotW}
                  y2={y2}
                  stroke="rgba(255,255,255,0.06)"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })}

          {/* Depth grid lines */}
          {[0, 300, 600, 900, 1200, 1500].map((d) => (
            <g key={`dg-${d}`}>
              <line
                x1={pad.left}
                y1={mapDepthToY(d)}
                x2={pad.left + plotW}
                y2={mapDepthToY(d)}
                stroke="rgba(255,255,255,0.04)"
              />
              <text
                x={pad.left - 6}
                y={mapDepthToY(d) + 3}
                textAnchor="end"
                style={{ fontSize: 8, fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}
              >
                {d}m
              </text>
            </g>
          ))}

          {/* Speed X axis labels */}
          {[1470, 1500, 1530].map((s) => (
            <g key={`sg-${s}`}>
              <line
                x1={mapSpeedToX(s)}
                y1={pad.top}
                x2={mapSpeedToX(s)}
                y2={pad.top + plotH}
                stroke="rgba(255,255,255,0.04)"
              />
              <text
                x={mapSpeedToX(s)}
                y={pad.top + plotH + 14}
                textAnchor="middle"
                style={{ fontSize: 8, fill: '#43C7D9', fontFamily: 'JetBrains Mono,monospace' }}
              >
                {s}
              </text>
            </g>
          ))}

          {/* Speed area fill */}
          <path d={speedAreaPath} fill="url(#speedAreaGrad)" />

          {/* Temperature dashed curve */}
          <path d={tempPath} fill="none" stroke="#D9A441" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.6} />

          {/* Sound speed curve */}
          <path d={speedPath} fill="none" stroke="#43C7D9" strokeWidth={2} />

          {/* AUV depth indicator */}
          <line
            x1={pad.left}
            y1={auvY}
            x2={pad.left + plotW}
            y2={auvY}
            stroke="rgba(217, 164, 65, 0.7)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          {/* AUV animated dot */}
          <circle
            cx={mapSpeedToX(currentAuvProps.soundSpeed)}
            cy={auvY}
            r={5}
            fill="rgba(217, 164, 65, 0.2)"
            stroke="rgba(217, 164, 65, 0.6)"
            strokeWidth={1}
          />
          <circle cx={mapSpeedToX(currentAuvProps.soundSpeed)} cy={auvY} r={3} fill="#D9A441" />
        </svg>
      </div>

      {/* Telemetry readout footer */}
      <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="grid grid-cols-3 gap-2">
          <div className="telemetry-cell">
            <div className="telemetry-label">c(z)</div>
            <div className="telemetry-value" style={{ color: '#43C7D9' }}>{animSpeed}</div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">m/s</div>
          </div>
          <div className="telemetry-cell">
            <div className="telemetry-label">Temp</div>
            <div className="telemetry-value" style={{ color: '#D9A441' }}>{animTemp}</div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">°C</div>
          </div>
          <div className="telemetry-cell">
            <div className="telemetry-label">Salinity</div>
            <div className="telemetry-value" style={{ color: 'var(--text-primary)' }}>{animSalinity}</div>
            <div className="text-[9px] font-mono text-slate-500 mt-0.5">PSU</div>
          </div>
        </div>
      </div>
    </div>
  );
};

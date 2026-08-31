import React, { useMemo } from 'react';
import { OceanLayer } from '../../types/sonar';
import { getOceanPropertiesAtDepth } from '../../physics/oceanAcoustics';

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

  // Generate depth profile samples
  const profilePoints = useMemo(() => {
    const points: { depth: number; soundSpeed: number; temp: number; salinity: number }[] = [];
    for (let z = 0; z <= MAX_DEPTH; z += 15) {
      const prop = getOceanPropertiesAtDepth(layers, z);
      points.push({ depth: z, soundSpeed: prop.soundSpeed, temp: prop.temp, salinity: prop.salinity });
    }
    return points;
  }, [layers]);

  // Coordinate mappers
  const svgWidth = 260;
  const svgHeight = 440;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };

  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  const mapDepthToY = (depth: number) => padding.top + (depth / MAX_DEPTH) * plotHeight;
  const mapSpeedToX = (speed: number) =>
    padding.left + ((speed - MIN_SPEED) / (MAX_SPEED - MIN_SPEED)) * plotWidth;
  const mapTempToX = (temp: number) =>
    padding.left + ((temp - MIN_TEMP) / (MAX_TEMP - MIN_TEMP)) * plotWidth;

  // Build SVG path strings
  const speedPath = useMemo(() => {
    return profilePoints.reduce((acc, p, idx) => {
      const x = mapSpeedToX(p.soundSpeed);
      const y = mapDepthToY(p.depth);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [profilePoints]);

  const tempPath = useMemo(() => {
    return profilePoints.reduce((acc, p, idx) => {
      const x = mapTempToX(p.temp);
      const y = mapDepthToY(p.depth);
      return idx === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  }, [profilePoints]);

  const auvY = mapDepthToY(auvDepth);
  const currentAuvProps = getOceanPropertiesAtDepth(layers, auvDepth);

  return (
    <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
            Sound Speed Profile (SSP)
          </h3>
          <p className="text-[10px] text-slate-400">Mackenzie-1981 Acoustic Stratification</p>
        </div>
        <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-mono text-[10px]">
          c(z) m/s
        </span>
      </div>

      {/* Profile Chart Canvas */}
      <div className="relative flex-1 flex items-center justify-center">
        <svg width={svgWidth} height={svgHeight} className="overflow-visible select-none">
          {/* Background Layer Shading */}
          {layers.map((layer) => {
            const y1 = mapDepthToY(layer.depthStart);
            const y2 = mapDepthToY(layer.depthEnd);
            return (
              <g key={layer.id}>
                <rect
                  x={padding.left}
                  y={y1}
                  width={plotWidth}
                  height={y2 - y1}
                  fill={layer.color}
                  opacity={0.35}
                />
                <line
                  x1={padding.left}
                  y1={y2}
                  x2={padding.left + plotWidth}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeDasharray="2 2"
                />
              </g>
            );
          })}

          {/* Grid lines */}
          {[0, 300, 600, 900, 1200, 1500].map((d) => (
            <g key={`d-grid-${d}`}>
              <line
                x1={padding.left}
                y1={mapDepthToY(d)}
                x2={padding.left + plotWidth}
                y2={mapDepthToY(d)}
                stroke="rgba(255, 255, 255, 0.06)"
              />
              <text
                x={padding.left - 8}
                y={mapDepthToY(d) + 3}
                textAnchor="end"
                className="text-[9px] font-mono fill-slate-500"
              >
                {d}m
              </text>
            </g>
          ))}

          {[1470, 1500, 1530].map((s) => (
            <g key={`s-grid-${s}`}>
              <line
                x1={mapSpeedToX(s)}
                y1={padding.top}
                x2={mapSpeedToX(s)}
                y2={padding.top + plotHeight}
                stroke="rgba(255, 255, 255, 0.05)"
              />
              <text
                x={mapSpeedToX(s)}
                y={padding.top + plotHeight + 16}
                textAnchor="middle"
                className="text-[9px] font-mono fill-cyan-400/70"
              >
                {s}
              </text>
            </g>
          ))}

          {/* Temperature Curve (Red/Orange dashed) */}
          <path d={tempPath} fill="none" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" opacity={0.65} />

          {/* Sound Speed Curve (Cyan solid with glow) */}
          <path
            d={speedPath}
            fill="none"
            stroke="#00f0ff"
            strokeWidth="2.5"
            filter="drop-shadow(0 0 6px rgba(0, 240, 255, 0.6))"
          />

          {/* AUV Depth Crosshair Indicator */}
          <line
            x1={padding.left}
            y1={auvY}
            x2={padding.left + plotWidth}
            y2={auvY}
            stroke="#eab308"
            strokeWidth="1.5"
          />
          <circle cx={mapSpeedToX(currentAuvProps.soundSpeed)} cy={auvY} r="4.5" fill="#eab308" />
        </svg>
      </div>

      {/* Legend & Telemetry Readout */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-1.5 text-[11px] font-mono">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
            <span className="text-cyan-400">c(z) Velocity</span>
          </span>
          <span className="font-bold text-cyan-300">{currentAuvProps.soundSpeed.toFixed(1)} m/s</span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
            <span className="text-orange-400">T(z) Temp</span>
          </span>
          <span>{currentAuvProps.temp.toFixed(1)} °C</span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span className="text-slate-400">Salinity S</span>
          <span>{currentAuvProps.salinity.toFixed(1)} PSU</span>
        </div>
      </div>
    </div>
  );
};

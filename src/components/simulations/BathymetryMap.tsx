import React, { useMemo } from 'react';
import { BathymetryPoint } from '../../types/sonar';
import { getSeafloorDepth } from '../../physics/oceanAcoustics';
import { Map, Download, Trash2 } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

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

  const svgWidth = 460;
  const svgHeight = 200;
  const pad = { top: 12, right: 14, bottom: 24, left: 44 };

  const plotW = svgWidth - pad.left - pad.right;
  const plotH = svgHeight - pad.top - pad.bottom;

  const mapX = (x: number) => pad.left + (x / WORLD_WIDTH_M) * plotW;
  const mapY = (depth: number) => pad.top + (depth / MAX_DEPTH_M) * plotH;

  const truePath = useMemo(
    () =>
      trueProfile.reduce((acc, p, i) => {
        const px = mapX(p.x),
          py = mapY(p.depth);
        return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
      }, ''),
    [trueProfile]
  );

  // Build filled reconstruction polygon from soundings
  const soundingPath = useMemo(() => {
    if (soundings.length < 2) return '';
    const sorted = [...soundings].sort((a, b) => a.x - b.x);
    const topLeft = `M ${mapX(sorted[0].x)} ${pad.top}`;
    const topRight = `L ${mapX(sorted[sorted.length - 1].x)} ${pad.top}`;
    const line = sorted.reduce((acc, s, i) => {
      const px = mapX(s.x),
        py = mapY(s.measuredDepth || s.trueDepth);
      return i === 0 ? `${acc} L ${px} ${py}` : `${acc} L ${px} ${py}`;
    }, topLeft + topRight.replace('M', 'L'));
    return line + ' Z';
  }, [soundings]);

  const stats = useMemo(() => {
    if (soundings.length === 0) return { coveragePct: 0, avgConfidence: 0, rmsErrorM: 0 };
    const bins = new Set(soundings.map((s) => Math.floor(s.x / 50)));
    const totalBins = WORLD_WIDTH_M / 50;
    const coveragePct = Math.min(100, Math.round((bins.size / totalBins) * 100));
    const avgConfidence = Math.round(soundings.reduce((sum, s) => sum + s.confidence, 0) / soundings.length);
    const errorSum = soundings.reduce((sum, s) => {
      const err = (s.measuredDepth || s.trueDepth) - s.trueDepth;
      return sum + err * err;
    }, 0);
    const rmsErrorM = parseFloat(Math.sqrt(errorSum / soundings.length).toFixed(1));
    return { coveragePct, avgConfidence, rmsErrorM };
  }, [soundings]);

  const animCoverage = useAnimatedValue(stats.coveragePct, 250, 0);
  const animConfidence = useAnimatedValue(stats.avgConfidence, 250, 0);
  const animRms = useAnimatedValue(stats.rmsErrorM, 250, 1);

  // Export surveyed soundings as CSV
  const handleExportCSV = () => {
    if (soundings.length === 0) return;
    const header = 'X_East_m,Y_North_m,Depth_Z_m,Confidence_pct,Frequency_kHz,Timestamp_ms\n';
    const rows = soundings
      .map(
        (s) =>
          `${s.x.toFixed(2)},0.00,${(s.measuredDepth || s.trueDepth).toFixed(2)},${s.confidence.toFixed(
            1
          )},${s.frequencyKHz || 120.0},${s.timestamp}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquapulse_bathymetry_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
            <Map className="w-3.5 h-3.5" style={{ color: '#63C79A' }} />
          </div>
          <div>
            <div className="instrument-panel-title">Reconstructed Bathymetry</div>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Acoustic Hydrographic Sounding Map</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {soundings.length > 0 && (
            <span className="hud-chip">
              {soundings.length} soundings
            </span>
          )}
          <button
            onClick={handleExportCSV}
            disabled={soundings.length === 0}
            className="hud-chip transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
            style={{
              background: '#12232D',
              borderColor: 'var(--border-default)',
              color: '#43C7D9',
            }}
            title="Download Bathymetric Point Cloud as CSV format"
          >
            <Download className="w-3 h-3" />
            <span>EXPORT CSV</span>
          </button>
          <button
            onClick={onClear}
            className="hud-chip transition-colors flex items-center gap-1 cursor-pointer"
            style={{
              background: '#12232D',
              borderColor: 'var(--border-default)',
              color: 'var(--text-muted)',
            }}
          >
            <Trash2 className="w-3 h-3" />
            <span>CLEAR</span>
          </button>
        </div>
      </div>

      {/* SVG Map */}
      <div
        className="relative flex-1 mx-4 rounded overflow-hidden flex items-center justify-center"
        style={{
          background: '#091319',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(99, 199, 154, 0.15)" />
              <stop offset="100%" stopColor="rgba(99, 199, 154, 0.0)" />
            </linearGradient>
          </defs>

          {/* Depth grid */}
          {[300, 600, 900, 1200, 1500].map((d) => (
            <g key={`bg-${d}`}>
              <line
                x1={pad.left}
                y1={mapY(d)}
                x2={pad.left + plotW}
                y2={mapY(d)}
                stroke="rgba(255,255,255,0.04)"
              />
              <text
                x={pad.left - 5}
                y={mapY(d) + 3}
                textAnchor="end"
                style={{ fontSize: 7, fill: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}
              >
                {d}m
              </text>
            </g>
          ))}

          {/* Reconstructed sounding area fill */}
          {soundingPath && <path d={soundingPath} fill="url(#emeraldAreaGrad)" />}

          {/* True seafloor reference */}
          <path d={truePath} fill="none" stroke="rgba(148,163,184,0.25)" strokeWidth={1.5} strokeDasharray="4 4" />

          {/* Individual sounding dots */}
          {soundings.map((s, idx) => {
            const px = mapX(s.x);
            const py = mapY(s.measuredDepth || s.trueDepth);
            const color =
              s.frequencyKHz && s.frequencyKHz < 160
                ? '#D9A441'
                : s.frequencyKHz && s.frequencyKHz < 300
                ? '#63C79A'
                : '#9B8EC4';
            return (
              <circle
                key={`sd-${idx}`}
                cx={px}
                cy={py}
                r={2}
                fill={color}
                opacity={0.85}
              />
            );
          })}

          {/* Reconstructed line over soundings */}
          {soundings.length > 1 &&
            (() => {
              const sorted = [...soundings].sort((a, b) => a.x - b.x);
              const path = sorted.reduce((acc, s, i) => {
                const px = mapX(s.x),
                  py = mapY(s.measuredDepth || s.trueDepth);
                return i === 0 ? `M ${px} ${py}` : `${acc} L ${px} ${py}`;
              }, '');
              return (
                <path d={path} fill="none" stroke="#63C79A" strokeWidth={1.5} />
              );
            })()}
        </svg>
      </div>

      {/* Metrics footer */}
      <div className="px-4 pb-3 pt-2.5 grid grid-cols-3 gap-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="telemetry-cell">
          <div className="telemetry-label">Seabed Coverage</div>
          <div className="telemetry-value" style={{ color: '#63C79A' }}>{animCoverage}%</div>
          <div className="progress-track mt-1.5">
            <div className="progress-fill" style={{ width: `${stats.coveragePct}%`, background: '#63C79A' }} />
          </div>
        </div>
        <div className="telemetry-cell">
          <div className="telemetry-label">Avg Confidence</div>
          <div className="telemetry-value" style={{ color: '#43C7D9' }}>{animConfidence}%</div>
          <div className="progress-track mt-1.5">
            <div className="progress-fill" style={{ width: `${stats.avgConfidence}%`, background: '#43C7D9' }} />
          </div>
        </div>
        <div className="telemetry-cell">
          <div className="telemetry-label">RMS Error</div>
          <div className="telemetry-value" style={{ color: '#9B8EC4' }}>±{animRms}</div>
          <div className="text-[8px] font-mono text-slate-500 mt-0.5">meters</div>
        </div>
      </div>
    </div>
  );
};

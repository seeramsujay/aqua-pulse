import React, { useState, useEffect, useRef } from 'react';
import { ChirpBand, OceanLayer, SonarMode, Submersible } from '../../types/sonar';
import { calculateThorpAttenuation, calculateCssProcessingGain, getOceanPropertiesAtDepth } from '../../physics/oceanAcoustics';
import { Cpu, ArrowRightLeft } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface PhysicsPanelProps {
  activeBand: ChirpBand;
  setActiveBand: (band: ChirpBand) => void;
  bands: ChirpBand[];
  mode: SonarMode;
  submersible: Submersible;
  layers: OceanLayer[];
  autoRoll: boolean;
  setAutoRoll: (val: boolean) => void;
  noiseFloorDb?: number;
}

interface HopEvent {
  fromBand: string;
  toBand: string;
  time: string;
  reason: string;
}

// Channel colour map for hop log pills
const BAND_COLORS: Record<string, string> = {
  'band-subbottom': '#D9A441',
  'band-midwater':  '#63C79A',
  'band-highres':   '#9B8EC4',
  'cw-sonar':       '#D96B6B',
};

const shortName = (id: string) =>
  id === 'band-subbottom' ? 'Ch0' : id === 'band-midwater' ? 'Ch1' : id === 'band-highres' ? 'Ch2' : 'CW';

export const PhysicsPanel: React.FC<PhysicsPanelProps> = ({
  activeBand,
  setActiveBand,
  bands,
  mode,
  submersible,
  layers,
  autoRoll,
  setAutoRoll,
  noiseFloorDb,
}) => {
  const centerFreq      = mode === 'rc-css' ? (activeBand.fStart + activeBand.fEnd) / 2 : 450;
  const bandwidthHz     = mode === 'rc-css' ? (activeBand.fEnd - activeBand.fStart) * 1000 : 200;
  const durationSec     = mode === 'rc-css' ? activeBand.durationMs / 1000 : 0.005;

  const thorpAlpha          = calculateThorpAttenuation(centerFreq);
  const timeBandwidthProduct = Math.round(bandwidthHz * durationSec);
  const compressionGainDb   = mode === 'rc-css' ? calculateCssProcessingGain(bandwidthHz, durationSec) : 0;
  const auvProps            = getOceanPropertiesAtDepth(layers, submersible.depth);
  const snellInvariant      = (Math.cos((submersible.pingAngleDeg * Math.PI) / 180) / auvProps.soundSpeed).toExponential(3);

  // Animated values
  const animAlpha = useAnimatedValue(thorpAlpha, 300, 2);
  const animGain  = useAnimatedValue(compressionGainDb, 300, 1);
  const animTB    = useAnimatedValue(timeBandwidthProduct, 300, 0);
  const animNoise = useAnimatedValue(noiseFloorDb ?? 0, 300, 1);

  // ── Channel Hop Log ────────────────────────────────────────────────────────
  const prevBandIdRef  = useRef<string>(activeBand.id);
  const debounceRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hopLog, setHopLog] = useState<HopEvent[]>([]);
  const [hopFlash, setHopFlash] = useState(false);

  useEffect(() => {
    if (activeBand.id === prevBandIdRef.current) return;

    const from = prevBandIdRef.current;
    const to   = activeBand.id;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      let reason = 'Manual selection';
      if (autoRoll) reason = 'Auto-roll adaptation';
      else if (submersible.depth > 500) reason = 'Depth > 500 m';
      else if (submersible.depth > 150) reason = 'Depth > 150 m';

      const now = new Date();
      const timeStr = now.toLocaleTimeString('en-GB', { hour12: false });

      setHopLog(prev => [{ fromBand: from, toBand: to, time: timeStr, reason }, ...prev].slice(0, 5));
      prevBandIdRef.current = to;

      // Background flash indicator
      setHopFlash(true);
      setTimeout(() => setHopFlash(false), 500);
    }, 1800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [activeBand.id, autoRoll, submersible.depth]);

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
            <Cpu className="w-3.5 h-3.5" style={{ color: '#43C7D9' }} />
          </div>
          <div>
            <div className="instrument-panel-title">Acoustic Physics Modulator</div>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Software-Defined Waveform Synthesis</p>
          </div>
        </div>

        {mode === 'rc-css' && (
          <div className="flex items-center gap-2 select-none">
            <span className="telemetry-label" style={{ color: 'var(--text-muted)' }}>AUTO-HOP</span>
            <div
              onClick={() => setAutoRoll(!autoRoll)}
              className={`toggle-track ${autoRoll ? 'on' : ''}`}
            >
              <div className="toggle-thumb" />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3 flex-1 overflow-y-auto">
        {/* Channel Selector */}
        {mode === 'rc-css' ? (
          <div>
            <div className="telemetry-label mb-1.5" style={{ color: 'var(--text-muted)' }}>
              ACTIVE STEPPED FREQUENCY CHANNEL
            </div>
            <div
              className="grid grid-cols-3 gap-1.5 rounded transition-colors duration-300 p-1"
              style={{
                background: hopFlash ? 'var(--bg-elevated)' : 'transparent',
              }}
            >
              {bands.map((band) => {
                const isActive = activeBand.id === band.id;
                return (
                  <button
                    key={band.id}
                    onClick={() => setActiveBand(band)}
                    className={`freq-channel ${isActive ? 'active' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: band.color }} />
                      <span className="font-mono text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>
                        {band.fStart}–{band.fEnd}k
                      </span>
                    </div>
                    <div className="font-mono text-[8px] leading-tight truncate" style={{ color: 'var(--text-dim)' }}>
                      {band.targetRegime}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div
            className="rounded px-3 py-2.5"
            style={{
              background: 'var(--bg-inset)',
              border: '1px solid #D96B6B',
            }}
          >
            <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: '#D96B6B' }}>
              <span>⚠</span>
              <span><strong>Conventional Fixed Sonar Active</strong> — Single 450 kHz CW tone. No frequency agility or pulse compression gain.</span>
            </div>
          </div>
        )}

        {/* Physics Telemetry Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="telemetry-cell">
            <div className="telemetry-label">Thorp Atten α(f)</div>
            <div className="telemetry-value" style={{ color: '#D9A441' }}>{animAlpha}</div>
            <div className="text-[8px] font-mono text-slate-500 mt-0.5">dB / km · Absorption</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label">Matched-Filter Gp</div>
            <div className="telemetry-value" style={{ color: '#63C79A' }}>+{animGain}</div>
            <div className="text-[8px] font-mono text-slate-500 mt-0.5">dB · 10log₁₀(B×T)</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label">Time-Bandwidth B×T</div>
            <div className="telemetry-value" style={{ color: '#E7EEF1' }}>{animTB}</div>
            <div className="text-[8px] font-mono text-slate-500 mt-0.5">Spread Spectrum Factor</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label">Snell Invariant p</div>
            <div className="telemetry-value text-xs leading-tight font-mono" style={{ color: '#43C7D9' }}>{snellInvariant}</div>
            <div className="text-[8px] font-mono text-slate-500 mt-0.5">cos(θ) / c(z)</div>
          </div>

          {/* Noise Floor */}
          <div className="telemetry-cell col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="telemetry-label">Wenz Noise Floor NL</div>
                <div className="telemetry-value" style={{ color: '#D96B6B' }}>
                  {noiseFloorDb !== undefined ? animNoise : '—'}
                </div>
                <div className="text-[8px] font-mono text-slate-500 mt-0.5">dB re 1 µPa²/Hz · Ambient Ocean</div>
              </div>
              {noiseFloorDb !== undefined && compressionGainDb > 0 && (
                <div className="text-right">
                  <div className="telemetry-label">Effective SNR Margin</div>
                  <div className="font-mono text-sm font-bold" style={{ color: '#63C79A' }}>
                    +{Math.max(0, compressionGainDb - noiseFloorDb * 0.05).toFixed(1)} dB
                  </div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5">Gp − NL·correction</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Channel Hop Log */}
        {mode === 'rc-css' && (
          <div
            className="rounded overflow-hidden"
            style={{
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              className="px-3 py-1.5 flex items-center gap-2"
              style={{ borderBottom: '1px solid var(--border-subtle)' }}
            >
              <ArrowRightLeft className="w-3 h-3 text-slate-500" />
              <span className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">Channel Hop Log</span>
            </div>
            {hopLog.length === 0 ? (
              <div className="px-3 py-2 font-mono text-[9px] text-slate-500">No hops recorded — change channel or enable auto-hop</div>
            ) : (
              <div className="divide-y divide-[#182A34]">
                {hopLog.map((hop, i) => (
                  <div
                    key={i}
                    className="px-3 py-1.5 flex items-center gap-2 text-[9px] font-mono"
                    style={{ background: i === 0 ? 'var(--bg-elevated)' : 'transparent' }}
                  >
                    <span className="font-bold" style={{ color: BAND_COLORS[hop.fromBand] ?? '#94a3b8' }}>
                      {shortName(hop.fromBand)}
                    </span>
                    <span className="text-slate-600">→</span>
                    <span className="font-bold" style={{ color: BAND_COLORS[hop.toBand] ?? '#94a3b8' }}>
                      {shortName(hop.toBand)}
                    </span>
                    <span className="text-slate-400 flex-1">{hop.reason}</span>
                    <span className="text-slate-500 shrink-0">{hop.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

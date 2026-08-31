import React from 'react';
import { ChirpBand, OceanLayer, SonarMode, Submersible } from '../../types/sonar';
import { calculateThorpAttenuation, calculateCssProcessingGain, getOceanPropertiesAtDepth } from '../../physics/oceanAcoustics';
import { Cpu } from 'lucide-react';
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
}

export const PhysicsPanel: React.FC<PhysicsPanelProps> = ({
  activeBand,
  setActiveBand,
  bands,
  mode,
  submersible,
  layers,
  autoRoll,
  setAutoRoll
}) => {
  const centerFreq = mode === 'rc-css' ? (activeBand.fStart + activeBand.fEnd) / 2 : 450;
  const bandwidthHz = mode === 'rc-css' ? (activeBand.fEnd - activeBand.fStart) * 1000 : 200;
  const durationSec = mode === 'rc-css' ? activeBand.durationMs / 1000 : 0.005;

  const thorpAlpha = calculateThorpAttenuation(centerFreq);
  const timeBandwidthProduct = Math.round(bandwidthHz * durationSec);
  const compressionGainDb = mode === 'rc-css' ? calculateCssProcessingGain(bandwidthHz, durationSec) : 0;
  const auvProps = getOceanPropertiesAtDepth(layers, submersible.depth);
  const snellInvariant = (Math.cos((submersible.pingAngleDeg * Math.PI) / 180) / auvProps.soundSpeed).toExponential(3);

  // Animated values
  const animAlpha = useAnimatedValue(thorpAlpha, 300, 2);
  const animGain = useAnimatedValue(compressionGainDb, 300, 1);
  const animTB = useAnimatedValue(timeBandwidthProduct, 300, 0);

  return (
    <div className="glass-panel panel-accent-amber flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-900/50 border border-amber-700/40">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div>
              <div className="panel-title text-amber-400">Acoustic Physics Modulator</div>
              <p className="text-[9px] text-slate-500 mt-0.5">Software-Defined Waveform Synthesis</p>
            </div>
          </div>

          {/* Auto-roll toggle */}
          {mode === 'rc-css' && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="telemetry-label text-slate-400">AUTO-ROLL</span>
              <button
                onClick={() => setAutoRoll(!autoRoll)}
                className={`toggle-track ${autoRoll ? 'on' : ''}`}
                aria-label="Toggle auto-roll"
              >
                <div className="toggle-thumb" />
              </button>
            </label>
          )}
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        {/* Frequency Channel Selector */}
        {mode === 'rc-css' ? (
          <div>
            <div className="telemetry-label text-slate-500 mb-1.5">ACTIVE STEPPED FREQUENCY CHANNEL</div>
            <div className="grid grid-cols-3 gap-1.5">
              {bands.map((band) => {
                const isActive = activeBand.id === band.id;
                return (
                  <button
                    key={band.id}
                    onClick={() => setActiveBand(band)}
                    className={`freq-channel ${isActive ? 'active' : ''}`}
                    style={isActive ? { borderColor: band.color + '80', boxShadow: `0 0 10px ${band.color}20` } : {}}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: band.color }} />
                      <span className="font-mono text-[10px] font-bold text-slate-200">
                        {band.fStart}–{band.fEnd}k
                      </span>
                    </div>
                    <div className="font-mono text-[8px] text-slate-500 leading-tight truncate">{band.targetRegime}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-rose-900/50 bg-rose-950/20 px-3 py-2.5">
            <div className="flex items-center gap-2 font-mono text-[11px] text-rose-300">
              <span className="text-rose-500">⚠</span>
              <span><strong>Conventional Fixed Sonar Active</strong> — Single 450 kHz CW tone. No frequency agility or pulse compression gain.</span>
            </div>
          </div>
        )}

        {/* Telemetry readout grid */}
        <div className="grid grid-cols-2 gap-2 flex-1">
          <div className="telemetry-cell">
            <div className="telemetry-label text-amber-500/70">Thorp Atten α(f)</div>
            <div className="telemetry-value text-amber-300">{animAlpha}</div>
            <div className="text-[8px] text-slate-600 mt-0.5">dB / km · Absorption</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label text-violet-500/70">Matched-Filter Gp</div>
            <div className="telemetry-value text-violet-300">+{animGain}</div>
            <div className="text-[8px] text-slate-600 mt-0.5">dB · 10log₁₀(B×T)</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label text-cyan-500/70">Time-Bandwidth B×T</div>
            <div className="telemetry-value text-cyan-300">{animTB}</div>
            <div className="text-[8px] text-slate-600 mt-0.5">Spread Spectrum Factor</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label text-emerald-500/70">Snell Invariant p</div>
            <div className="telemetry-value text-emerald-300 text-xs leading-tight font-mono">{snellInvariant}</div>
            <div className="text-[8px] text-slate-600 mt-0.5">cos(θ) / c(z)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// EOF: src/components/telemetry/PhysicsPanel.tsx

import React from 'react';
import { ChirpBand, OceanLayer, SonarMode, Submersible } from '../../types/sonar';
import { calculateThorpAttenuation, calculateCssProcessingGain, getOceanPropertiesAtDepth } from '../../physics/oceanAcoustics';

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
  const centerFreq = mode === 'rc-css' ? (activeBand.fStart + activeBand.fEnd) / 2 : 45;
  const bandwidthHz = mode === 'rc-css' ? (activeBand.fEnd - activeBand.fStart) * 1000 : 200;
  const durationSec = mode === 'rc-css' ? activeBand.durationMs / 1000 : 0.005;

  const thorpAlpha = calculateThorpAttenuation(centerFreq);
  const timeBandwidthProduct = Math.round(bandwidthHz * durationSec);
  const compressionGainDb = mode === 'rc-css' ? calculateCssProcessingGain(bandwidthHz, durationSec) : 0;
  const auvProps = getOceanPropertiesAtDepth(layers, submersible.depth);

  return (
    <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-cyan-400">
            Acoustic Physics & Channel Roller
          </h3>
          <p className="text-[10px] text-slate-400">Chirp Spread Spectrum Signal Modulator</p>
        </div>
        {mode === 'rc-css' && (
          <label className="flex items-center space-x-2 cursor-pointer select-none">
            <span className="text-[10px] font-mono text-slate-300">AUTO-ROLL CHANNEL:</span>
            <input
              type="checkbox"
              checked={autoRoll}
              onChange={(e) => setAutoRoll(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
          </label>
        )}
      </div>

      {/* Stepped Band Selector Tabs */}
      {mode === 'rc-css' ? (
        <div className="space-y-2 mb-4">
          <div className="text-[11px] font-mono text-slate-400 mb-1">ACTIVE STEPPED FREQUENCY CHANNEL:</div>
          <div className="grid grid-cols-3 gap-2">
            {bands.map((band) => {
              const isActive = activeBand.id === band.id;
              return (
                <button
                  key={band.id}
                  onClick={() => setActiveBand(band)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 mb-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: band.color }} />
                    <span className="text-[11px] font-bold font-mono text-slate-200">
                      {band.fStart}-{band.fEnd} kHz
                    </span>
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight truncate">{band.targetRegime}</div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-rose-950/30 border border-rose-900/50 p-3 rounded-lg mb-4 text-xs font-mono text-rose-300">
          ⚠️ <strong>Conventional Fixed Sonar Active</strong>: Single 45 kHz continuous wave tone. No frequency-rolling agility or pulse compression gain.
        </div>
      )}

      {/* Core Telemetry Matrix */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono flex-1">
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-500 text-[10px]">THORP ATTENUATION α(f)</div>
          <div className="text-amber-400 font-bold text-base mt-0.5">
            {thorpAlpha.toFixed(2)} <span className="text-xs font-normal text-slate-400">dB/km</span>
          </div>
          <div className="text-[9px] text-slate-500 mt-1">Absorption loss per km</div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-500 text-[10px]">MATCHED-FILTER GAIN Gp</div>
          <div className="text-purple-400 font-bold text-base mt-0.5">
            +{compressionGainDb.toFixed(1)} <span className="text-xs font-normal text-slate-400">dB</span>
          </div>
          <div className="text-[9px] text-slate-500 mt-1">10 log₁₀(B × T) pulse compression</div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-500 text-[10px]">TIME-BANDWIDTH (B×T)</div>
          <div className="text-cyan-400 font-bold text-base mt-0.5">{timeBandwidthProduct}</div>
          <div className="text-[9px] text-slate-500 mt-1">Spread Spectrum Factor</div>
        </div>

        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-500 text-[10px]">SNELL INVARIANT p</div>
          <div className="text-emerald-400 font-bold text-base mt-0.5">
            {(Math.cos((submersible.pingAngleDeg * Math.PI) / 180) / auvProps.soundSpeed).toExponential(3)}
          </div>
          <div className="text-[9px] text-slate-500 mt-1">cos(θ) / c(z) ray curvature</div>
        </div>
      </div>
    </div>
  );
};

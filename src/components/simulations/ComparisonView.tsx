import React from 'react';
import { CheckCircle2, XCircle, Zap, ShieldAlert, Radio } from 'lucide-react';

interface ComparisonViewProps {
  onSelectMode: (mode: 'rc-css' | 'traditional-cw') => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ onSelectMode }) => {
  return (
    <div className="bg-slate-900/95 rounded-xl p-6 border border-slate-800 shadow-2xl space-y-6">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-800 text-cyan-400 text-xs font-mono">
          <Zap className="w-3.5 h-3.5" />
          <span>Acoustic Paradigm Shift</span>
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          Traditional Single-Frequency Sonar vs. Rolling-Channel CSS
        </h2>
        <p className="text-xs text-slate-400">
          Why conventional submersibles lose acoustic contact in stratified ocean layers, and how Chirp Spread Spectrum with rolling channel windows solves it.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traditional Sonar Card */}
        <div className="bg-slate-950/80 rounded-xl p-5 border border-rose-900/40 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 px-3 py-1 bg-rose-950/80 text-rose-400 text-[10px] font-mono border-b border-l border-rose-900/60 rounded-bl-lg">
            LEGACY CONVENTIONAL
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-900/80 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Single-Frequency CW Pulse</h3>
                <p className="text-xs text-slate-500 font-mono">Fixed 45 - 100 kHz Narrowband Tone</p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-400">
              <li className="flex items-start space-x-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Extreme Thorp Absorption:</strong> High frequencies suffer 25-45 dB/km attenuation, completely dissipating beyond 600m depth.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Shadow Zone Blackout:</strong> Snell ray bending refracts single-frequency pings away from the seabed into blind zones.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Pulse Compression Gain:</strong> Requires massive acoustic transmitter power (SL &gt; 230 dB) to overcome ocean noise.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Range vs. Resolution Trade-off:</strong> Lowering frequency blurs vertical resolution to meters; raising frequency blinds deep sounding.
                </span>
              </li>
            </ul>

            <div className="bg-rose-950/30 p-3 rounded-lg border border-rose-900/30 font-mono text-[11px] text-rose-300">
              Avg Coverage: <strong className="text-rose-400">18.4%</strong> | Deep Trench SNR:{' '}
              <strong className="text-rose-400">-12.8 dB (Lost)</strong>
            </div>
          </div>

          <button
            onClick={() => onSelectMode('traditional-cw')}
            className="mt-5 w-full py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-rose-300 border border-rose-900/50 text-xs font-mono font-bold transition"
          >
            SIMULATE TRADITIONAL CW SONAR
          </button>
        </div>

        {/* AquaPulse RC-CSS Card */}
        <div className="bg-slate-950/80 rounded-xl p-5 border border-cyan-500/50 relative overflow-hidden flex flex-col justify-between shadow-lg shadow-cyan-950/30">
          <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-950/80 text-cyan-400 text-[10px] font-mono border-b border-l border-cyan-800/60 rounded-bl-lg">
            AQUAPULSE INNOVATION
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Rolling-Channel CSS (RC-CSS)</h3>
                <p className="text-xs text-cyan-400 font-mono">Stepped 3-12 / 15-32 / 35-70 kHz Chirps</p>
              </div>
            </div>

            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Stepped Multi-Band Penetration:</strong> Low-band (3-12 kHz) pierces deep thermoclines with &lt;1.5 dB/km loss, guaranteeing bottom return.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>+18.4 dB Matched-Filter Compression Gain:</strong> De-chirping cross-correlation detects echoes below ocean ambient noise floor (SNR &lt; -10 dB).
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Adaptive Rolling Window:</strong> Dynamically rolls channels to compensate for thermocline boundary shifts and Doppler drift.
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Dual Bathymetry & Hydrography:</strong> Resolves both sub-meter seafloor topography and stratified sound velocity layers simultaneously.
                </span>
              </li>
            </ul>

            <div className="bg-cyan-950/40 p-3 rounded-lg border border-cyan-800/40 font-mono text-[11px] text-cyan-300">
              Avg Coverage: <strong className="text-emerald-400">98.6%</strong> | Deep Trench SNR:{' '}
              <strong className="text-emerald-400">+14.2 dB (Locked)</strong>
            </div>
          </div>

          <button
            onClick={() => onSelectMode('rc-css')}
            className="mt-5 w-full py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-mono font-bold transition shadow-md shadow-cyan-500/20"
          >
            ACTIVATE ROLLING-CHANNEL CSS
          </button>
        </div>
      </div>
    </div>
  );
};

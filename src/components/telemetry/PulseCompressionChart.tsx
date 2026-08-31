import React, { useMemo } from 'react';
import { ChirpBand, SonarMode } from '../../types/sonar';
import { Activity, Zap, Cpu } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface PulseCompressionChartProps {
  activeBand: ChirpBand;
  mode: SonarMode;
  isPinging: boolean;
}

export const PulseCompressionChart: React.FC<PulseCompressionChartProps> = ({
  activeBand,
  mode,
  isPinging
}) => {
  const bandwidthHz = mode === 'rc-css' ? (activeBand.fEnd - activeBand.fStart) * 1000 : 200;
  const durationMs = mode === 'rc-css' ? activeBand.durationMs : 5.0;
  const durationSec = durationMs / 1000;
  const soundSpeed = 1500; // nominal m/s

  // Derived DSP metrics
  const timeBandwidth = Math.round(bandwidthHz * durationSec);
  const processingGainDb = mode === 'rc-css' ? 10 * Math.log10(Math.max(1, timeBandwidth)) : 0;
  const rangeResolutionCm = ((soundSpeed / (2 * bandwidthHz)) * 100);
  const blindZoneMeters = (soundSpeed * durationSec) / 2;

  // Animated telemetry numbers
  const animGain = useAnimatedValue(processingGainDb, 300, 1);
  const animResolution = useAnimatedValue(rangeResolutionCm, 300, 2);
  const animBlindZone = useAnimatedValue(blindZoneMeters, 300, 2);
  const animTB = useAnimatedValue(timeBandwidth, 300, 0);

  // Generate waveform points for Transmitted Chirp s(t)
  const chirpWaveformPath = useMemo(() => {
    const points: string[] = [];
    const width = 280;
    const height = 45;
    const centerY = height / 2;
    const samples = 140;

    for (let i = 0; i <= samples; i++) {
      const t = i / samples; // normalized 0 to 1
      const x = (i / samples) * width;
      
      if (mode === 'rc-css') {
        // Linear FM Chirp: phase = 2*pi*(f0*t + 0.5*beta*t^2)
        // Windowed by Hann window: 0.5 * (1 - cos(2*pi*t))
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * t));
        const freqSweep = 2 + 18 * t; // visual frequency progression
        const y = centerY - Math.sin(freqSweep * Math.PI * t * 4) * (centerY - 4) * window;
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      } else {
        // Single CW Tone
        const window = t > 0.05 && t < 0.95 ? 1 : 0.2;
        const y = centerY - Math.sin(t * 30 * Math.PI) * (centerY - 4) * window;
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    return points.join(' ');
  }, [mode, activeBand]);

  // Generate waveform points for Matched Filter Output (Autocorrelation Sinc)
  const compressedSincPath = useMemo(() => {
    const points: string[] = [];
    const width = 280;
    const height = 45;
    const centerY = height - 6;
    const samples = 140;
    const mainlobeWidth = mode === 'rc-css' ? 8 : 40;

    for (let i = 0; i <= samples; i++) {
      const x = (i / samples) * width;
      const distFromCenter = Math.abs(x - width / 2);
      
      if (mode === 'rc-css') {
        // Sinc function with sidelobes
        const sincArg = (distFromCenter / mainlobeWidth) * Math.PI;
        const sincVal = sincArg === 0 ? 1 : Math.sin(sincArg) / sincArg;
        const y = centerY - sincVal * (height - 12);
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      } else {
        // Wide triangular CW autocorrelation with low peak
        const triVal = Math.max(0, 1 - distFromCenter / (width / 3));
        const y = centerY - triVal * ((height - 12) * 0.35);
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    return points.join(' ');
  }, [mode]);

  return (
    <div className="glass-panel panel-accent-emerald flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
      <div className="px-4 pt-3.5">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-900/50 border border-emerald-700/40">
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <div className="panel-title text-emerald-400">Pulse Compression DSP</div>
              <p className="text-[9px] text-slate-500 mt-0.5">Matched Filter Autocorrelation &amp; Range Gain</p>
            </div>
          </div>
          <div className="hud-chip bg-emerald-950/70 text-emerald-400 border-emerald-700/50">
            {mode === 'rc-css' ? `+${animGain} dB GAIN` : '0.0 dB (CW)'}
          </div>
        </div>
      </div>

      {/* DSP Visualizer Canvas Box */}
      <div className="px-4 pb-3 flex flex-col gap-2.5 flex-1">
        {/* Waveform 1: Transmitted Chirp */}
        <div className="p-2.5 rounded-lg border border-white/[0.06] bg-black/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Activity className="w-2.5 h-2.5 text-cyan-400" />
              <span>TRANSMITTED LFM PULSE s(t)</span>
            </span>
            <span className="text-cyan-300 font-bold">
              Tp = {durationMs.toFixed(1)} ms | B = {(bandwidthHz / 1000).toFixed(0)} kHz
            </span>
          </div>
          
          <svg viewBox="0 0 280 45" className="w-full h-11 overflow-visible">
            <line x1="0" y1="22.5" x2="280" y2="22.5" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
            <path
              d={chirpWaveformPath}
              fill="none"
              stroke={mode === 'rc-css' ? activeBand.color : '#f43f5e'}
              strokeWidth={isPinging ? 2.5 : 1.8}
              className="transition-all duration-200"
              style={{
                filter: isPinging ? `drop-shadow(0 0 6px ${activeBand.color})` : undefined
              }}
            />
          </svg>
        </div>

        {/* Waveform 2: Compressed Matched Filter Spike */}
        <div className="p-2.5 rounded-lg border border-white/[0.06] bg-black/40 relative overflow-hidden">
          <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-2.5 h-2.5 text-emerald-400" />
              <span>MATCHED-FILTER OUTPUT y(t) = s(t) ⊛ h(t)</span>
            </span>
            <span className="text-emerald-300 font-bold">
              {mode === 'rc-css' ? 'SHARP DIRAC SINC' : 'DIFFUSE ENERGY'}
            </span>
          </div>

          <svg viewBox="0 0 280 45" className="w-full h-11 overflow-visible">
            <line x1="0" y1="39" x2="280" y2="39" stroke="rgba(255,255,255,0.06)" />
            <line x1="140" y1="0" x2="140" y2="45" stroke="rgba(52,211,153,0.2)" strokeDasharray="2 2" />
            <path
              d={compressedSincPath}
              fill="none"
              stroke={mode === 'rc-css' ? '#34d399' : '#f43f5e'}
              strokeWidth={2.2}
              style={{
                filter: mode === 'rc-css' ? 'drop-shadow(0 0 6px rgba(52,211,153,0.6))' : undefined
              }}
            />
          </svg>
        </div>

        {/* DSP Telemetry Metrics Readout */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="telemetry-cell">
            <div className="telemetry-label text-emerald-500/70">Range Res ΔR</div>
            <div className="telemetry-value text-emerald-300 text-sm">
              {mode === 'rc-css' ? `${animResolution} cm` : '375 cm'}
            </div>
            <div className="text-[8px] text-slate-600 mt-0.5">c / (2B) precision</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label text-cyan-500/70">Blind Zone Rmin</div>
            <div className="telemetry-value text-cyan-300 text-sm">
              {animBlindZone} m
            </div>
            <div className="text-[8px] text-slate-600 mt-0.5">(c × Tp) / 2</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label text-purple-500/70">Time-Bandwidth</div>
            <div className="telemetry-value text-purple-300 text-sm">
              {animTB}
            </div>
            <div className="text-[8px] text-slate-600 mt-0.5">B × Tp Product</div>
          </div>
        </div>
      </div>
    </div>
  );
};

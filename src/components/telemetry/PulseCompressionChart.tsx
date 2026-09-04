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
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * t));
        const freqSweep = 2 + 18 * t;
        const y = centerY - Math.sin(freqSweep * Math.PI * t * 4) * (centerY - 4) * window;
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      } else {
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
        const sincArg = (distFromCenter / mainlobeWidth) * Math.PI;
        const sincVal = sincArg === 0 ? 1 : Math.sin(sincArg) / sincArg;
        const y = centerY - sincVal * (height - 12);
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      } else {
        const triVal = Math.max(0, 1 - distFromCenter / (width / 3));
        const y = centerY - triVal * ((height - 12) * 0.35);
        points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    return points.join(' ');
  }, [mode]);

  return (
    <div className="instrument-panel flex flex-col h-full overflow-hidden">
      {/* Panel Header */}
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
            <Zap className="w-3.5 h-3.5" style={{ color: '#63C79A' }} />
          </div>
          <div>
            <div className="instrument-panel-title">Pulse Compression DSP</div>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Matched Filter Autocorrelation &amp; Range Gain</p>
          </div>
        </div>
        <div className="hud-chip">
          {mode === 'rc-css' ? `+${animGain} dB GAIN` : '0.0 dB (CW)'}
        </div>
      </div>

      {/* DSP Visualizer Box */}
      <div className="px-4 pb-3 flex flex-col gap-2.5 flex-1">
        {/* Waveform 1: Transmitted Chirp */}
        <div
          className="p-2.5 rounded relative overflow-hidden"
          style={{
            background: '#091319',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between text-[9px] font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <Activity className="w-2.5 h-2.5" style={{ color: '#43C7D9' }} />
              <span>TRANSMITTED LFM PULSE s(t)</span>
            </span>
            <span className="font-bold" style={{ color: '#43C7D9' }}>
              Tp = {durationMs.toFixed(1)} ms | B = {(bandwidthHz / 1000).toFixed(0)} kHz
            </span>
          </div>
          
          <svg viewBox="0 0 280 45" className="w-full h-11 overflow-visible">
            <line x1="0" y1="22.5" x2="280" y2="22.5" stroke="rgba(255,255,255,0.06)" strokeDasharray="2 2" />
            <path
              d={chirpWaveformPath}
              fill="none"
              stroke={mode === 'rc-css' ? '#43C7D9' : '#D96B6B'}
              strokeWidth={isPinging ? 2.5 : 1.8}
            />
          </svg>
        </div>

        {/* Waveform 2: Compressed Matched Filter Spike */}
        <div
          className="p-2.5 rounded relative overflow-hidden"
          style={{
            background: '#091319',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between text-[9px] font-mono mb-1" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1.5">
              <Cpu className="w-2.5 h-2.5" style={{ color: '#63C79A' }} />
              <span>MATCHED-FILTER OUTPUT y(t) = s(t) ⊛ h(t)</span>
            </span>
            <span className="font-bold" style={{ color: '#63C79A' }}>
              {mode === 'rc-css' ? 'SHARP DIRAC SINC' : 'DIFFUSE ENERGY'}
            </span>
          </div>

          <svg viewBox="0 0 280 45" className="w-full h-11 overflow-visible">
            <line x1="0" y1="39" x2="280" y2="39" stroke="rgba(255,255,255,0.06)" />
            <line x1="140" y1="0" x2="140" y2="45" stroke="rgba(99, 199, 154, 0.2)" strokeDasharray="2 2" />
            <path
              d={compressedSincPath}
              fill="none"
              stroke={mode === 'rc-css' ? '#63C79A' : '#D96B6B'}
              strokeWidth={2.0}
            />
          </svg>
        </div>

        {/* DSP Telemetry Metrics Readout */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="telemetry-cell">
            <div className="telemetry-label">Range Res ΔR</div>
            <div className="telemetry-value text-sm" style={{ color: '#63C79A' }}>
              {mode === 'rc-css' ? `${animResolution} cm` : '375 cm'}
            </div>
            <div className="text-[8px] font-mono text-slate-500 mt-0.5">c / (2B) precision</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label">Blind Zone Rmin</div>
            <div className="telemetry-value text-sm" style={{ color: '#43C7D9' }}>
              {animBlindZone} m
            </div>
            <div className="text-[8px] font-mono text-slate-500 mt-0.5">(c × Tp) / 2</div>
          </div>

          <div className="telemetry-cell">
            <div className="telemetry-label">Time-Bandwidth</div>
            <div className="telemetry-value text-sm" style={{ color: '#E7EEF1' }}>
              {animTB}
            </div>
            <div className="text-[8px] font-mono text-slate-500 mt-0.5">B × Tp Product</div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Zap, ShieldAlert, Radio, TrendingUp, Sparkles } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface ComparisonViewProps {
  onSelectMode: (mode: 'rc-css' | 'traditional-cw') => void;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ onSelectMode }) => {
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHasLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const animCoverageCw = useAnimatedValue(hasLoaded ? 18.4 : 0, 800, 1);
  const animCoverageCss = useAnimatedValue(hasLoaded ? 98.6 : 0, 800, 1);
  const animSnrCw = useAnimatedValue(hasLoaded ? -12.8 : 0, 800, 1);
  const animSnrCss = useAnimatedValue(hasLoaded ? 14.2 : 0, 800, 1);
  const animGainCw = useAnimatedValue(hasLoaded ? 0.0 : 0, 800, 1);
  const animGainCss = useAnimatedValue(hasLoaded ? 18.4 : 0, 800, 1);

  const METRICS = [
    {
      label: 'Deep Trench Bathymetric Coverage',
      cwVal: `${animCoverageCw}%`,
      cssVal: `${animCoverageCss}%`,
      cssGood: true,
      explanation: 'RC-CSS Ch 0 (100–140 kHz) pierces acoustic shadow zones without high-frequency Thorp extinction.'
    },
    {
      label: 'Deep Water Echo SNR',
      cwVal: `${animSnrCw} dB`,
      cssVal: `+${animSnrCss} dB`,
      cssGood: true,
      explanation: 'Pulse compression gain enables detection below the ambient thermal acoustic noise floor.'
    },
    {
      label: 'Monostatic Blind Zone (Rmin)',
      cwVal: '7.5 m',
      cssVal: '< 1.1 m',
      cssGood: true,
      explanation: 'Micro-chirps (Tp ≤ 1.5 ms) restrict receiver blanking to prevent near-field obstacle collisions.'
    },
    {
      label: 'Matched-Filter Processing Gain (Gp)',
      cwVal: `+${animGainCw} dB`,
      cssVal: `+${animGainCss} dB`,
      cssGood: true,
      explanation: 'Gp = 10 log10(B × Tp) boosts echo amplitude by +18.4 dB without increasing transducer wattage.'
    },
    {
      label: 'Onboard Battery Power Savings',
      cwVal: '0% (Static Pumping)',
      cssVal: '−38% PWR',
      cssGood: true,
      explanation: 'Quantized TinyML policy engine autonomously throttles wattage when crossing shallow thermoclines.'
    }
  ];

  const CW_CONS = [
    {
      title: 'High-Frequency Thorp Extinction',
      body: 'Conventional 450 kHz static pings suffer extreme seawater absorption (α ≈ 120 dB/km), causing complete acoustic blackout in deep trenches.'
    },
    {
      title: 'Snell Refraction Shadow Zones',
      body: 'Fixed-angle analog rays bend sharply away from thermocline boundaries, leaving massive unmapped seafloor blind spots.'
    },
    {
      title: 'Monostatic Blind Zone Obstacles',
      body: 'Long continuous pulses (Tp = 10 ms) physically blind the transceiver for 7.5 meters, endangering AUV subsea navigation.'
    },
    {
      title: 'Excessive Battery Drain',
      body: 'Inflexible analog transmitters continue pumping full power into shadow zones, rapidly draining subsea battery packs.'
    }
  ];

  const CSS_PROS = [
    {
      title: 'Stepped Frequency Sub-Band Agility',
      body: 'Channel 0 (100–140 kHz) pierces turbid thermoclines; Channel 2 (400–480 kHz) yields centimeter-grade precision in clear water.'
    },
    {
      title: 'Micro-Chirp Blind Zone Elimination',
      body: 'Short pulses (Tp = 0.4 to 1.5 ms) keep transceiver blanking below R_blind < 1.1 m while maintaining high resolution through pulse compression.'
    },
    {
      title: 'Embedded Cognitive TinyML Policy',
      body: 'On-device INT8 MLP maps 4-channel environmental telemetry (T, S, z, turbidity) to optimal chirp tuples in <1.2 ms, saving up to 38% energy.'
    },
    {
      title: 'Zero-CPU DMA Waveform Synthesis',
      body: 'Circular DMA stream pushes Blackman-Harris windowed lookup tables to internal DAC with 0.0% CPU overhead, conditioned by a 4th-order OPA1612 filter.'
    }
  ];

  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Heading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-700/50 text-cyan-300 font-mono text-[10px] tracking-widest uppercase shadow-[0_0_15px_rgba(0,240,255,0.15)]">
          <Zap className="w-3.5 h-3.5" />
          Acoustic Engineering Paradigm Shift
        </div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Conventional Fixed Sonar
          <span className="text-slate-500 font-normal mx-2.5">vs.</span>
          Rolling-Channel Chirp Spread Spectrum
        </h2>
        <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed font-sans">
          Demonstrating why conventional single-frequency sounders fail in stratified oceanic thermoclines, and how AQUAPULSE Stepped Multi-Tone CSS guarantees 100% bathymetric contact.
        </p>
      </div>

      {/* Two-column comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* ── Legacy CW ── */}
        <div
          className="relative flex flex-col rounded-xl border border-rose-900/40 overflow-hidden"
          style={{ background: 'rgba(12, 4, 6, 0.85)' }}
        >
          <div className="absolute top-0 right-0 px-3 py-1 bg-rose-950/90 text-rose-400 font-mono text-[9px] tracking-widest uppercase border-b border-l border-rose-900/60 rounded-bl-xl">
            LEGACY CONVENTIONAL
          </div>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-rose-600/60 to-transparent" />

          <div className="p-5 space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-400 flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Single-Frequency CW Pulse</h3>
                <p className="font-mono text-[10px] text-slate-500">Fixed 450 kHz High-Frequency Ping</p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {CW_CONS.map(({ title, body }) => (
                <li key={title} className="flex items-start gap-2 text-xs text-slate-400">
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-rose-300">{title}:</strong> {body}
                  </span>
                </li>
              ))}
            </ul>

            <div className="bg-rose-950/30 border border-rose-900/30 rounded-lg px-3 py-2 font-mono text-[11px] text-rose-300 flex items-center justify-between">
              <span>
                Coverage: <strong className="text-rose-400">{animCoverageCw}%</strong>
              </span>
              <span>
                Deep SNR: <strong className="text-rose-400">{animSnrCw} dB (LOST)</strong>
              </span>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={() => onSelectMode('traditional-cw')}
              className="w-full py-2.5 rounded-lg bg-rose-950/50 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 border border-rose-900/60 font-mono text-[11px] font-bold tracking-wider uppercase transition-all"
            >
              Simulate Conventional CW Sonar
            </button>
          </div>
        </div>

        {/* ── AquaPulse RC-CSS ── */}
        <div
          className="relative flex flex-col rounded-xl border border-cyan-500/40 overflow-hidden shadow-[0_0_30px_rgba(0,180,216,0.12)]"
          style={{ background: 'rgba(0, 15, 30, 0.9)' }}
        >
          <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-950/90 text-cyan-300 font-mono text-[9px] tracking-widest uppercase border-b border-l border-cyan-700/60 rounded-bl-xl flex items-center gap-1.5">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
            <span>AQUAPULSE INNOVATION</span>
          </div>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent" />

          <div className="p-5 space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 flex-shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Stepped Multi-Tone CSS (RC-CSS)</h3>
                <p className="font-mono text-[10px] text-cyan-400">100–140 / 200–250 / 400–480 kHz Micro-Chirps</p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {CSS_PROS.map(({ title, body }) => (
                <li key={title} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-emerald-300">{title}:</strong> {body}
                  </span>
                </li>
              ))}
            </ul>

            <div className="bg-cyan-950/60 border border-cyan-800/40 rounded-lg px-3 py-2 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
              <span>
                Coverage: <strong className="text-emerald-400">{animCoverageCss}%</strong>
              </span>
              <span>
                Deep SNR: <strong className="text-emerald-400">+{animSnrCss} dB (LOCKED)</strong>
              </span>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={() => onSelectMode('rc-css')}
              className="w-full py-2.5 rounded-lg text-slate-950 font-mono text-[11px] font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.3)]"
              style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #0096c7 100%)' }}
            >
              Activate Rolling-Channel CSS Mode
            </button>
          </div>
        </div>
      </div>

      {/* Bottom metric comparison table */}
      <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)' }}>
        <div className="px-4 py-2 border-b border-white/[0.07] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-mono text-[10px] text-slate-300 uppercase tracking-widest">
              Acoustic Hydrography Benchmark Breakdown
            </span>
          </div>
          <span className="font-mono text-[9px] text-slate-500">SIH26058 MoES/NIOT Metrics</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {METRICS.map(({ label, cwVal, cssVal, cssGood, explanation }) => (
            <div key={label} className="p-3 hover:bg-white/[0.015] transition-colors">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs font-mono items-center">
                <div className="md:col-span-6 font-bold text-slate-300">{label}</div>
                <div className="md:col-span-3 text-rose-400 text-left md:text-center">
                  <span className="text-[9px] text-slate-500 mr-2 md:hidden">CW:</span>
                  {cwVal}
                </div>
                <div
                  className={`md:col-span-3 text-left md:text-right font-bold ${
                    cssGood ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <span className="text-[9px] text-slate-500 mr-2 md:hidden">RC-CSS:</span>
                  {cssVal}
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 font-sans leading-relaxed">{explanation}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

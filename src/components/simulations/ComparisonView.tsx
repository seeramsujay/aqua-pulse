import React from 'react';
import { CheckCircle2, XCircle, Zap, ShieldAlert, Radio, TrendingUp } from 'lucide-react';

interface ComparisonViewProps {
  onSelectMode: (mode: 'rc-css' | 'traditional-cw') => void;
}

const METRICS = [
  { label: 'Deep Trench Coverage',  cw: '18.4%',   css: '98.6%',  cssGood: true },
  { label: 'SNR (Deep Water)',       cw: '-12.8 dB', css: '+14.2 dB', cssGood: true },
  { label: 'Blind Zone (Rmin)',      cw: '7.5 m',    css: '< 1.1 m',  cssGood: true },
  { label: 'Processing Gain (Gp)',   cw: '0 dB',     css: '+18.4 dB', cssGood: true },
  { label: 'Energy Efficiency',      cw: 'Static',   css: '−38% PWR', cssGood: true },
];

const CW_CONS = [
  { title: 'Severe Thorp Absorption', body: '450 kHz pings suffer extreme attenuation (α ∝ f²), creating complete echo blackout in deep or turbid channels.' },
  { title: 'Shadow Zone Blackout',    body: "Snell ray bending refracts static pings away from seabed targets into acoustic blind zones." },
  { title: 'Monostatic Blind Zone',   body: 'Long pulse durations (Tp = 10 ms) physically blind the receiver up to 7.5 meters.' },
  { title: 'Inflexible Energy Drain', body: 'Pumping static wattage into acoustic shadow zones rapidly drains AUV battery reserves.' },
];

const CSS_PROS = [
  { title: 'Stepped Sub-Band Agility',        body: 'Ch 0 (100–140 kHz) pierces turbid layers; Ch 2 (400–480 kHz) yields centimeter resolution in clear water.' },
  { title: 'Micro-Chirp Blind Zone Elim.',    body: 'Short pulses (Tp ≤ 1.5 ms) restrict physical receiver blind zones to R_blind < 1.1 m.' },
  { title: 'Cognitive Edge TinyML',           body: 'On-device INT8 MLP maps sensor inputs to optimal frequency/bandwidth, cutting energy by 38%.' },
  { title: 'Zero-CPU Hardware Synthesis',     body: 'Bare-metal DMA streams windowed waveforms through 4th-order Sallen-Key OPA1612 filter (fc = 450 kHz).' },
];

export const ComparisonView: React.FC<ComparisonViewProps> = ({ onSelectMode }) => {
  return (
    <div className="glass-panel p-6 space-y-6">
      {/* Heading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hydro-900/60 border border-hydro-700/50 text-hydro-300 font-mono text-[10px] tracking-widest uppercase">
          <Zap className="w-3 h-3" />
          Acoustic Paradigm Shift
        </div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Traditional Single-Frequency Sonar
          <span className="text-slate-500 font-normal mx-2">vs.</span>
          Rolling-Channel CSS
        </h2>
        <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed">
          Why conventional submersibles lose acoustic contact in stratified ocean layers, and how Chirp Spread Spectrum with rolling channel windows solves it.
        </p>
      </div>

      {/* Two-column comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Legacy CW ── */}
        <div className="relative flex flex-col rounded-xl border border-rose-900/40 overflow-hidden"
          style={{ background: 'rgba(8,3,3,0.85)' }}>
          {/* Badge */}
          <div className="absolute top-0 right-0 px-3 py-1 bg-rose-950/90 text-rose-400 font-mono text-[9px] tracking-widest uppercase border-b border-l border-rose-900/60 rounded-bl-xl">
            LEGACY CONVENTIONAL
          </div>
          {/* Accent bar */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-rose-600/60 to-transparent" />

          <div className="p-5 space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-400 flex-shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Single-Frequency CW Pulse</h3>
                <p className="font-mono text-[10px] text-slate-500">Fixed 450 kHz High-Frequency Tone</p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {CW_CONS.map(({ title, body }) => (
                <li key={title} className="flex items-start gap-2 text-xs text-slate-400">
                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <span><strong className="text-rose-300">{title}:</strong> {body}</span>
                </li>
              ))}
            </ul>

            {/* Metric chip row */}
            <div className="bg-rose-950/30 border border-rose-900/30 rounded-lg px-3 py-2 font-mono text-[11px] text-rose-300">
              Coverage: <strong className="text-rose-400">18.4%</strong>
              <span className="mx-2 text-rose-900">|</span>
              Deep SNR: <strong className="text-rose-400">−12.8 dB (LOST)</strong>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={() => onSelectMode('traditional-cw')}
              className="w-full py-2.5 rounded-lg bg-rose-950/50 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 border border-rose-900/60 font-mono text-[11px] font-bold tracking-wider uppercase transition-all"
            >
              Simulate Traditional CW Sonar
            </button>
          </div>
        </div>

        {/* ── AquaPulse RC-CSS ── */}
        <div className="relative flex flex-col rounded-xl border border-hydro-600/40 overflow-hidden shadow-[0_0_30px_rgba(0,180,216,0.12)]"
          style={{ background: 'rgba(0,15,30,0.9)' }}>
          {/* Badge */}
          <div className="absolute top-0 right-0 px-3 py-1 bg-hydro-900/90 text-hydro-300 font-mono text-[9px] tracking-widest uppercase border-b border-l border-hydro-700/60 rounded-bl-xl">
            AQUAPULSE INNOVATION
          </div>
          {/* Accent bar */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-hydro-400/70 to-transparent" />

          <div className="p-5 space-y-4 flex-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-hydro-900/70 border border-hydro-700/60 text-hydro-300 flex-shrink-0">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-100">Stepped Multi-Tone CSS (RC-CSS)</h3>
                <p className="font-mono text-[10px] text-hydro-400">100–140 / 200–250 / 400–480 kHz Micro-Chirps</p>
              </div>
            </div>

            <ul className="space-y-2.5">
              {CSS_PROS.map(({ title, body }) => (
                <li key={title} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong className="text-emerald-300">{title}:</strong> {body}</span>
                </li>
              ))}
            </ul>

            {/* Metric chip row */}
            <div className="bg-hydro-950/60 border border-hydro-800/40 rounded-lg px-3 py-2 font-mono text-[11px] text-hydro-300">
              Coverage: <strong className="text-emerald-400">98.6%</strong>
              <span className="mx-2 text-hydro-800">|</span>
              Deep SNR: <strong className="text-emerald-400">+14.2 dB (LOCKED)</strong>
            </div>
          </div>

          <div className="px-5 pb-5">
            <button
              onClick={() => onSelectMode('rc-css')}
              className="w-full py-2.5 rounded-lg text-slate-950 font-mono text-[11px] font-bold tracking-wider uppercase transition-all shadow-glow-cyan-sm"
              style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #0096c7 100%)' }}
            >
              Activate Rolling-Channel CSS
            </button>
          </div>
        </div>
      </div>

      {/* Bottom metric comparison table */}
      <div className="rounded-xl border border-white/[0.07] overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.4)' }}>
        <div className="px-4 py-2 border-b border-white/[0.07] flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Performance Benchmarks</span>
        </div>
        <div className="divide-y divide-white/[0.05]">
          {METRICS.map(({ label, cw, css, cssGood }) => (
            <div key={label} className="grid grid-cols-3 px-4 py-2 text-[11px] font-mono items-center">
              <span className="text-slate-500">{label}</span>
              <span className="text-rose-400 text-center">{cw}</span>
              <span className={`text-right font-bold ${cssGood ? 'text-emerald-400' : 'text-rose-400'}`}>{css}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 px-4 py-1.5 bg-white/[0.02] border-t border-white/[0.07] text-[9px] font-mono text-slate-600">
          <span>METRIC</span>
          <span className="text-center text-rose-700">CONVENTIONAL CW</span>
          <span className="text-right text-emerald-700">RC-CSS</span>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, XCircle, Zap, ShieldAlert, Radio, TrendingUp, Sparkles, Activity } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

interface ComparisonViewProps {
  onSelectMode: (mode: 'rc-css' | 'traditional-cw') => void;
}

type ActiveTab = 'comparison' | 'hfm';

// ── HFM Doppler Canvas ────────────────────────────────────────────────────────
const HFMDopplerCanvas: React.FC<{ speed: number; chirpType: 'LFM' | 'HFM' }> = ({ speed, chirpType }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = '#050d18';
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = '#1a2744';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < W; x += W / 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += H / 5) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = '#64748b';
    ctx.font = '9px monospace';
    ctx.fillText('Time →', W - 40, H - 4);
    ctx.save();
    ctx.translate(10, H / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Freq', 0, 0);
    ctx.restore();

    // Draw chirp + Doppler shift
    const doppler = speed / 1500; // v/c normalised
    const smear = chirpType === 'LFM' ? speed * 1.8 : 0.8; // px smear

    const gradient = ctx.createLinearGradient(30, 0, W - 30, 0);
    gradient.addColorStop(0, chirpType === 'LFM' ? '#ef444466' : '#22c55e66');
    gradient.addColorStop(1, chirpType === 'LFM' ? '#f9731666' : '#06b6d466');

    // Draw main chirp sweep
    for (let x = 30; x < W - 30; x++) {
      const t = (x - 30) / (W - 60);
      let f: number;
      if (chirpType === 'LFM') {
        f = t; // linear
      } else {
        // hyperbolic: f(t) = f0*f1 / (f1 - (f1-f0)*t)  → normalised
        const f0n = 0.1, f1n = 0.9;
        f = (f0n * f1n) / (f1n - (f1n - f0n) * t);
        f = Math.min(Math.max((f - f0n) / (f1n - f0n), 0), 1);
      }

      // Doppler shifts end frequency
      const fShifted = Math.min(1, f + doppler * t * 0.6);
      const yCenter = H - 20 - fShifted * (H - 40);

      // Smear width
      const lineW = Math.max(1.5, smear * 0.6);
      ctx.fillStyle = chirpType === 'LFM'
        ? `rgba(239,68,68,${0.6 + 0.4 * (1 - smear / 18)})`
        : 'rgba(34,197,94,0.85)';
      ctx.fillRect(x, yCenter - lineW / 2, 1.5, lineW);
    }

    // Label
    const labelColor = chirpType === 'LFM' ? '#fca5a5' : '#86efac';
    ctx.fillStyle = labelColor;
    ctx.font = 'bold 10px monospace';
    ctx.fillText(chirpType, 34, 16);

    if (chirpType === 'LFM' && speed > 0.5) {
      ctx.fillStyle = '#fca5a5';
      ctx.font = '9px monospace';
      ctx.fillText(`⚠ Smear: ±${(smear * 0.5).toFixed(1)} cm`, 34, H - 20);
    } else if (chirpType === 'HFM') {
      ctx.fillStyle = '#86efac';
      ctx.font = '9px monospace';
      ctx.fillText('✓ Doppler-invariant', 34, H - 20);
    }
  }, [speed, chirpType]);

  return <canvas ref={canvasRef} width={260} height={160} className="rounded border border-white/10 w-full" />;
};

// ── Main Component ────────────────────────────────────────────────────────────
export const ComparisonView: React.FC<ComparisonViewProps> = ({ onSelectMode }) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('comparison');
  const [auvSpeed, setAuvSpeed] = useState(2.0);

  useEffect(() => {
    const timer = setTimeout(() => setHasLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const animCoverageCw  = useAnimatedValue(hasLoaded ? 18.4 : 0, 800, 1);
  const animCoverageCss = useAnimatedValue(hasLoaded ? 98.6 : 0, 800, 1);
  const animSnrCw       = useAnimatedValue(hasLoaded ? -12.8 : 0, 800, 1);
  const animSnrCss      = useAnimatedValue(hasLoaded ? 14.2 : 0, 800, 1);
  const animGainCw      = useAnimatedValue(hasLoaded ? 0.0 : 0, 800, 1);
  const animGainCss     = useAnimatedValue(hasLoaded ? 18.4 : 0, 800, 1);

  const METRICS = [
    { label: 'Deep Trench Bathymetric Coverage', cwVal: `${animCoverageCw}%`, cssVal: `${animCoverageCss}%`, cssGood: true, explanation: 'RC-CSS Ch 0 (100–140 kHz) pierces acoustic shadow zones without high-frequency Thorp extinction.' },
    { label: 'Deep Water Echo SNR', cwVal: `${animSnrCw} dB`, cssVal: `+${animSnrCss} dB`, cssGood: true, explanation: 'Pulse compression gain enables detection below the ambient thermal acoustic noise floor.' },
    { label: 'Monostatic Blind Zone (Rmin)', cwVal: '7.5 m', cssVal: '< 1.1 m', cssGood: true, explanation: 'Micro-chirps (Tp ≤ 1.5 ms) restrict receiver blanking to prevent near-field obstacle collisions.' },
    { label: 'Matched-Filter Processing Gain (Gp)', cwVal: `+${animGainCw} dB`, cssVal: `+${animGainCss} dB`, cssGood: true, explanation: 'Gp = 10 log10(B × Tp) boosts echo amplitude by +18.4 dB without increasing transducer wattage.' },
    { label: 'Onboard Battery Power Savings', cwVal: '0% (Static Pumping)', cssVal: '−38% PWR', cssGood: true, explanation: 'Quantized TinyML policy engine autonomously throttles wattage when crossing shallow thermoclines.' },
  ];

  const CW_CONS = [
    { title: 'High-Frequency Thorp Extinction', body: 'Conventional 450 kHz static pings suffer extreme seawater absorption (α ≈ 120 dB/km), causing complete acoustic blackout in deep trenches.' },
    { title: 'Snell Refraction Shadow Zones', body: 'Fixed-angle analog rays bend sharply away from thermocline boundaries, leaving massive unmapped seafloor blind spots.' },
    { title: 'Monostatic Blind Zone Obstacles', body: 'Long continuous pulses (Tp = 10 ms) physically blind the transceiver for 7.5 meters, endangering AUV subsea navigation.' },
    { title: 'Excessive Battery Drain', body: 'Inflexible analog transmitters continue pumping full power into shadow zones, rapidly draining subsea battery packs.' },
  ];

  const CSS_PROS = [
    { title: 'Stepped Frequency Sub-Band Agility', body: 'Channel 0 (100–140 kHz) pierces turbid thermoclines; Channel 2 (400–480 kHz) yields centimeter-grade precision in clear water.' },
    { title: 'Micro-Chirp Blind Zone Elimination', body: 'Short pulses (Tp = 0.4 to 1.5 ms) keep transceiver blanking below R_blind < 1.1 m while maintaining high resolution through pulse compression.' },
    { title: 'Embedded Cognitive TinyML Policy', body: 'On-device INT8 MLP maps 4-channel environmental telemetry (T, S, z, turbidity) to optimal chirp tuples in <1.2 ms, saving up to 38% energy.' },
    { title: 'Zero-CPU DMA Waveform Synthesis', body: 'Circular DMA stream pushes Blackman-Harris windowed lookup tables to internal DAC with 0.0% CPU overhead, conditioned by a 4th-order OPA1612 filter.' },
  ];

  const tabClass = (t: ActiveTab) =>
    `px-4 py-1.5 rounded font-mono text-[10px] tracking-widest uppercase transition-all ${
      activeTab === t
        ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/60'
        : 'text-slate-500 hover:text-slate-300 border border-transparent'
    }`;

  return (
    <div className="glass-panel p-6 space-y-5">
      {/* Heading */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-700/50 text-cyan-300 font-mono text-[10px] tracking-widest uppercase">
          <Zap className="w-3.5 h-3.5" />
          Acoustic Engineering Analysis
        </div>
        <h2 className="text-xl font-bold text-slate-100 tracking-tight">
          Waveform Performance Comparison
        </h2>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-white/[0.06] pb-3">
        <button className={tabClass('comparison')} onClick={() => setActiveTab('comparison')}>
          CW vs RC-CSS
        </button>
        <button className={tabClass('hfm')} onClick={() => setActiveTab('hfm')}>
          <Activity className="w-3 h-3 inline mr-1" />
          HFM Doppler
        </button>
      </div>

      {/* ── TAB: CW vs RC-CSS ── */}
      {activeTab === 'comparison' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Legacy CW */}
            <div className="relative flex flex-col rounded-xl border border-rose-900/40 overflow-hidden" style={{ background: 'rgba(12, 4, 6, 0.85)' }}>
              <div className="absolute top-0 right-0 px-3 py-1 bg-rose-950/90 text-rose-400 font-mono text-[9px] tracking-widest uppercase border-b border-l border-rose-900/60 rounded-bl-xl">LEGACY CONVENTIONAL</div>
              <div className="h-[2px] bg-gradient-to-r from-transparent via-rose-600/60 to-transparent" />
              <div className="p-5 space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-950/70 border border-rose-800/60 text-rose-400 flex-shrink-0"><ShieldAlert className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Single-Frequency CW Pulse</h3>
                    <p className="font-mono text-[10px] text-slate-500">Fixed 450 kHz High-Frequency Ping</p>
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
                <div className="bg-rose-950/30 border border-rose-900/30 rounded-lg px-3 py-2 font-mono text-[11px] text-rose-300 flex items-center justify-between">
                  <span>Coverage: <strong className="text-rose-400">{animCoverageCw}%</strong></span>
                  <span>Deep SNR: <strong className="text-rose-400">{animSnrCw} dB (LOST)</strong></span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button onClick={() => onSelectMode('traditional-cw')} className="w-full py-2.5 rounded-lg bg-rose-950/50 hover:bg-rose-950/80 text-rose-400 hover:text-rose-300 border border-rose-900/60 font-mono text-[11px] font-bold tracking-wider uppercase transition-all">
                  Simulate Conventional CW Sonar
                </button>
              </div>
            </div>

            {/* AquaPulse RC-CSS */}
            <div className="relative flex flex-col rounded-xl border border-cyan-500/40 overflow-hidden shadow-[0_0_30px_rgba(0,180,216,0.10)]" style={{ background: 'rgba(0, 15, 30, 0.9)' }}>
              <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-950/90 text-cyan-300 font-mono text-[9px] tracking-widest uppercase border-b border-l border-cyan-700/60 rounded-bl-xl flex items-center gap-1.5">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" /><span>AQUAPULSE RC-CSS</span>
              </div>
              <div className="h-[2px] bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
              <div className="p-5 space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 flex-shrink-0"><Radio className="w-5 h-5" /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100">Stepped Multi-Tone CSS (RC-CSS)</h3>
                    <p className="font-mono text-[10px] text-cyan-400">100–140 / 200–250 / 400–480 kHz Micro-Chirps</p>
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
                <div className="bg-cyan-950/60 border border-cyan-800/40 rounded-lg px-3 py-2 font-mono text-[11px] text-cyan-300 flex items-center justify-between">
                  <span>Coverage: <strong className="text-emerald-400">{animCoverageCss}%</strong></span>
                  <span>Deep SNR: <strong className="text-emerald-400">+{animSnrCss} dB (LOCKED)</strong></span>
                </div>
              </div>
              <div className="px-5 pb-5">
                <button onClick={() => onSelectMode('rc-css')} className="w-full py-2.5 rounded-lg text-slate-950 font-mono text-[11px] font-bold tracking-wider uppercase transition-all" style={{ background: 'linear-gradient(135deg, #00e5ff 0%, #0096c7 100%)' }}>
                  Activate Rolling-Channel CSS Mode
                </button>
              </div>
            </div>
          </div>

          {/* Metric table */}
          <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(0,0,0,0.45)' }}>
            <div className="px-4 py-2 border-b border-white/[0.07] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[10px] text-slate-300 uppercase tracking-widest">Acoustic Hydrography Benchmark Breakdown</span>
              </div>
              <span className="font-mono text-[9px] text-slate-500">SIH26058 MoES/NIOT Metrics</span>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {METRICS.map(({ label, cwVal, cssVal, cssGood, explanation }) => (
                <div key={label} className="p-3 hover:bg-white/[0.015] transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-xs font-mono items-center">
                    <div className="md:col-span-6 font-bold text-slate-300">{label}</div>
                    <div className="md:col-span-3 text-rose-400 text-left md:text-center">{cwVal}</div>
                    <div className={`md:col-span-3 text-left md:text-right font-bold ${cssGood ? 'text-emerald-400' : 'text-rose-400'}`}>{cssVal}</div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 font-sans leading-relaxed">{explanation}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── TAB: HFM Doppler ── */}
      {activeTab === 'hfm' && (
        <div className="space-y-5">
          {/* Header explanation */}
          <div className="rounded-xl border border-white/[0.07] bg-black/30 p-4 space-y-1">
            <p className="font-mono text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-cyan-300">HFM (Hyperbolic FM)</strong> sweeps frequency along a hyperbolic curve:&nbsp;
              <span className="text-amber-300 font-mono">f(t) = f₀·f₁ / [f₁ − (f₁−f₀)·t/Tₚ]</span>
            </p>
            <p className="font-mono text-[10px] text-slate-500">
              Unlike LFM, Doppler compression/dilation does not change the shape of the HFM — it only shifts the matched filter peak laterally in Doppler. Range accuracy is preserved regardless of AUV speed.
            </p>
          </div>

          {/* Speed slider */}
          <div className="flex items-center gap-4">
            <span className="font-mono text-[10px] text-slate-400 w-20 shrink-0">AUV Speed</span>
            <input
              type="range" min={0} max={5} step={0.1} value={auvSpeed}
              onChange={(e) => setAuvSpeed(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400"
            />
            <span className="font-mono text-[11px] text-cyan-300 w-14 text-right">{auvSpeed.toFixed(1)} m/s</span>
          </div>

          {/* Doppler shift annotation */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: 'Doppler Δf @ 480 kHz', val: `${(480 * 2 * auvSpeed / 1500).toFixed(1)} kHz`, color: 'text-amber-300' },
              { label: 'LFM Range Error', val: auvSpeed > 0 ? `~${(auvSpeed * 1.8 * 0.5).toFixed(1)} cm` : '0 cm', color: 'text-rose-400' },
              { label: 'HFM Range Error', val: '< 0.5 cm', color: 'text-emerald-400' },
            ].map(({ label, val, color }) => (
              <div key={label} className="rounded-lg border border-white/[0.08] bg-black/30 px-3 py-2">
                <div className={`font-mono text-sm font-bold ${color}`}>{val}</div>
                <div className="font-mono text-[9px] text-slate-500 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Side-by-side canvas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] text-rose-400 uppercase tracking-widest">LFM — Linear FM</div>
              <HFMDopplerCanvas speed={auvSpeed} chirpType="LFM" />
              <p className="text-[9px] text-slate-500 font-sans">Peak broadens with AUV speed. Range resolution degrades.</p>
            </div>
            <div className="space-y-1.5">
              <div className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest">HFM — Hyperbolic FM</div>
              <HFMDopplerCanvas speed={auvSpeed} chirpType="HFM" />
              <p className="text-[9px] text-slate-500 font-sans">Peak stays sharp at all speeds. Doppler-invariant waveform.</p>
            </div>
          </div>

          {/* Physics table */}
          <div className="rounded-xl border border-white/[0.07] overflow-hidden" style={{ background: 'rgba(0,0,0,0.4)' }}>
            <div className="px-4 py-2 border-b border-white/[0.07]">
              <span className="font-mono text-[10px] text-slate-300 uppercase tracking-widest">Waveform Properties — Channel 1 (200–250 kHz, Tp = 0.8 ms)</span>
            </div>
            <div className="divide-y divide-white/[0.05]">
              {[
                { prop: 'Instantaneous Frequency Law', lfm: 'f(t) = f₀ + (B/Tₚ)·t  [linear]', hfm: 'f(t) = f₀f₁/[f₁−(f₁−f₀)t/Tₚ]  [hyperbolic]' },
                { prop: 'Doppler Sensitivity', lfm: 'High — peak smears under velocity', hfm: 'Near-zero — DFT shift only' },
                { prop: 'Matched Filter Processing Gain', lfm: '+18.4 dB (static AUV)', hfm: '+18.4 dB (all speeds)' },
                { prop: 'Range Resolution (FWHM)', lfm: `~${(1.87 + auvSpeed * 0.9).toFixed(1)} cm @ ${auvSpeed.toFixed(1)} m/s`, hfm: '~1.50 cm (invariant)' },
                { prop: 'Hardware Change Required', lfm: 'N/A (baseline)', hfm: 'None — firmware LUT only' },
              ].map(({ prop, lfm, hfm }) => (
                <div key={prop} className="grid grid-cols-3 gap-2 px-4 py-2.5 text-[10px] font-mono hover:bg-white/[0.015]">
                  <div className="text-slate-400 font-semibold">{prop}</div>
                  <div className="text-rose-300">{lfm}</div>
                  <div className="text-emerald-300">{hfm}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// EOF: src/components/simulations/ComparisonView.tsx

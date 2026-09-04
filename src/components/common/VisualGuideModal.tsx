import React from 'react';
import {
  X,
  Radio,
  Zap,
  Waves,
  Eye,
  Crosshair,
  Gauge,
  Layers,
  ArrowDownUp,
  Compass,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface VisualGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBandIndex?: number;
  currentDepth?: number;
}

export const VisualGuideModal: React.FC<VisualGuideModalProps> = ({
  isOpen,
  onClose,
  activeBandIndex = 0,
  currentDepth = 150,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-lg overflow-hidden border shadow-2xl"
        style={{
          background: '#071018',
          borderColor: '#20333D',
          boxShadow: '0 0 50px rgba(0, 240, 255, 0.12)',
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b"
          style={{
            background: '#0B1720',
            borderColor: '#182935',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center"
              style={{ background: 'rgba(67, 199, 217, 0.15)', border: '1px solid #43C7D9' }}
            >
              <Info className="w-5 h-5 text-[#43C7D9]" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-mono tracking-wider text-slate-100 flex items-center gap-2">
                <span>WHAT REPRESENTS WHAT</span>
                <span className="text-xs px-2 py-0.5 rounded font-normal bg-[#43C7D9]/10 text-[#43C7D9] border border-[#43C7D9]/30">
                  SYSTEM DYNAMICS & VISUAL GUIDE
                </span>
              </h2>
              <p className="text-xs text-[#7E93A4] font-mono mt-0.5">
                Complete architectural breakdown of on-screen colors, acoustic waves, vehicle controls, and physics metrics
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#14232C] text-[#7E93A4] hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin font-mono text-xs">
          {/* ── 1. COGNITIVE FREQUENCY HOPPING & WAVE COLORS ── */}
          <div className="rounded-lg p-4 border" style={{ background: '#091319', borderColor: '#1F313D' }}>
            <div className="flex items-center justify-between mb-3 border-b pb-2" style={{ borderColor: '#182935' }}>
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#43C7D9]" />
                <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                  1. Wave Colors & Cognitive Frequency Bands (Depth-Adaptive)
                </h3>
              </div>
              <span className="text-[11px] text-[#43C7D9]">
                Current Submersible Depth: {Math.round(currentDepth)}m
              </span>
            </div>

            <p className="text-[#94a3b8] leading-relaxed mb-4 text-[11px]">
              AquaPulse employs a <span className="text-[#43C7D9] font-bold">Cognitive Software-Defined Acoustic Engine</span>.
              As the submersible changes depth, the system automatically hops between three acoustic frequency channels to maximize SNR,
              conquer ocean absorption, and achieve sub-bottom penetration. The color of the submarine pod, acoustic rays, and expanding
              wavefronts dynamically changes to match:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* CH2 PURPLE */}
              <div
                className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                  activeBandIndex === 2 ? 'ring-2 ring-[#9B8EC4]' : ''
                }`}
                style={{
                  background: 'rgba(155, 142, 196, 0.08)',
                  borderColor: activeBandIndex === 2 ? '#9B8EC4' : 'rgba(155, 142, 196, 0.3)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold text-[12px]" style={{ color: '#9B8EC4' }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#9B8EC4', boxShadow: '0 0 8px #9B8EC4' }} />
                      PURPLE WAVE
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#9B8EC4]/20 text-[#9B8EC4] font-bold">
                      0 – 250m
                    </span>
                  </div>
                  <div className="text-slate-200 font-bold text-[11px] mb-1">
                    CH2: 400 – 480 kHz (High-Res)
                  </div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed">
                    <strong className="text-slate-200">What it represents:</strong> High-frequency epipelagic sounding.
                    <br />
                    <strong className="text-slate-200">Why it's used:</strong> Delivers sub-centimeter range resolution (<span className="text-[#9B8EC4]">&Delta;R &lt; 1.5 cm</span>)
                    for fine seafloor micro-topography. Because water depth is shallow, high Thorp absorption (~115 dB/km) does not degrade the signal.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#9B8EC4]/20 text-[10px] text-[#9B8EC4] flex items-center justify-between">
                  <span>Target: Surface Layer</span>
                  <span>Bandwidth: 80 kHz</span>
                </div>
              </div>

              {/* CH1 EMERALD GREEN */}
              <div
                className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                  activeBandIndex === 1 ? 'ring-2 ring-[#63C79A]' : ''
                }`}
                style={{
                  background: 'rgba(99, 199, 154, 0.08)',
                  borderColor: activeBandIndex === 1 ? '#63C79A' : 'rgba(99, 199, 154, 0.3)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold text-[12px]" style={{ color: '#63C79A' }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#63C79A', boxShadow: '0 0 8px #63C79A' }} />
                      EMERALD WAVE
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#63C79A]/20 text-[#63C79A] font-bold">
                      250 – 700m
                    </span>
                  </div>
                  <div className="text-slate-200 font-bold text-[11px] mb-1">
                    CH1: 200 – 250 kHz (Thermocline)
                  </div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed">
                    <strong className="text-slate-200">What it represents:</strong> Mid-depth thermocline profiler.
                    <br />
                    <strong className="text-slate-200">Why it's used:</strong> Balances resolution (<span className="text-[#63C79A]">&Delta;R &asymp; 3 cm</span>)
                    with moderate transmission range. Penetrates the sharp temperature drop and sound speed gradient without ray shadow trapping.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#63C79A]/20 text-[10px] text-[#63C79A] flex items-center justify-between">
                  <span>Target: Thermocline</span>
                  <span>Bandwidth: 50 kHz</span>
                </div>
              </div>

              {/* CH0 AMBER */}
              <div
                className={`p-3.5 rounded-lg border flex flex-col justify-between transition-all ${
                  activeBandIndex === 0 ? 'ring-2 ring-[#D9A441]' : ''
                }`}
                style={{
                  background: 'rgba(217, 164, 65, 0.08)',
                  borderColor: activeBandIndex === 0 ? '#D9A441' : 'rgba(217, 164, 65, 0.3)',
                }}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 font-bold text-[12px]" style={{ color: '#D9A441' }}>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#D9A441', boxShadow: '0 0 8px #D9A441' }} />
                      AMBER WAVE
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#D9A441]/20 text-[#D9A441] font-bold">
                      &gt; 700m
                    </span>
                  </div>
                  <div className="text-slate-200 font-bold text-[11px] mb-1">
                    CH0: 100 – 140 kHz (Deep Abyss)
                  </div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed">
                    <strong className="text-slate-200">What it represents:</strong> Deep benthic & sub-bottom penetration.
                    <br />
                    <strong className="text-slate-200">Why it's used:</strong> Lowest absorption (~36 dB/km) allows sound to propagate across deep abyssal plains
                    and punch through thick benthic silt layers to detect underlying bedrock.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-[#D9A441]/20 text-[10px] text-[#D9A441] flex items-center justify-between">
                  <span>Target: Deep Silt / Bedrock</span>
                  <span>Bandwidth: 40 kHz</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. WHAT EACH VISUAL ELEMENT ON THE OCEAN CANVAS REPRESENTS ── */}
          <div className="rounded-lg p-4 border" style={{ background: '#091319', borderColor: '#1F313D' }}>
            <div className="flex items-center gap-2 mb-3 border-b pb-2" style={{ borderColor: '#182935' }}>
              <Eye className="w-4 h-4 text-[#43C7D9]" />
              <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                2. What Every Visual Element on the Ocean Canvas Represents
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Element: Circular Wavefronts */}
              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60 flex gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center shrink-0 bg-[#43C7D9]/10 border border-[#43C7D9]/30 text-[#43C7D9]">
                  <Waves className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">Concentric Expanding Rings (Wavefronts)</div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed mt-0.5">
                    Physical acoustic pressure wavefronts radiated by the piezoelectric transducer into the water column. They propagate downward at the local sound speed <span className="text-[#43C7D9]">c(z) &asymp; 1500 m/s</span> and expand until they reach, touch, and reflect off the seafloor.
                  </p>
                </div>
              </div>

              {/* Element: Acoustic Rays */}
              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60 flex gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center shrink-0 bg-[#63C79A]/10 border border-[#63C79A]/30 text-[#63C79A]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">21-Ray Acoustic Beam (Snell Refraction Paths)</div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed mt-0.5">
                    Numerical Snell's Law ray-tracing lines (<span className="text-[#63C79A]">c₁ / cos &theta;₁ = c₂ / cos &theta;₂</span>). They visually bend as sound passes through cold thermocline and high-pressure deep water, demonstrating true acoustic beam curvature.
                  </p>
                </div>
              </div>

              {/* Element: Traveling Energy Dots */}
              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60 flex gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center shrink-0 bg-[#D9A441]/10 border border-[#D9A441]/30 text-[#D9A441]">
                  <ArrowDownUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">Slow-Moving Energy Pulse Dots</div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed mt-0.5">
                    Live acoustic energy packets traveling down each ray from the submarine to the seabed. When the pulse reaches the floor, it sparks a seafloor reflection echo returning to the transducer.
                  </p>
                </div>
              </div>

              {/* Element: Seafloor Contact Sparks */}
              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60 flex gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center shrink-0 bg-[#43C7D9]/10 border border-[#43C7D9]/30 text-[#43C7D9]">
                  <Crosshair className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">Seafloor Contact Hit Rings & Sparks</div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed mt-0.5">
                    Point of acoustic impact on the seabed. The time taken to reach this point (<span className="text-[#43C7D9]">&Delta;t</span>) is used by the matched filter to calculate bathymetric depth: <span className="text-[#43C7D9]">z = (c &middot; &Delta;t) / 2</span>.
                  </p>
                </div>
              </div>

              {/* Element: Stratified Water Layers */}
              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60 flex gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center shrink-0 bg-[#7E93A4]/10 border border-[#7E93A4]/30 text-[#7E93A4]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">Water Column Strata (Mixed, Thermocline, Abyss)</div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed mt-0.5">
                    Horizontal dashed lines mark physical ocean boundaries. Warm wind-mixed surface water transitions to the cold thermocline (200–600m), where sound speed drops sharply, and finally into the deep isothermal ocean where sound speed increases with hydrostatic pressure.
                  </p>
                </div>
              </div>

              {/* Element: Seafloor Geology & Strata */}
              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60 flex gap-3">
                <div className="w-9 h-9 rounded flex items-center justify-center shrink-0 bg-[#43C7D9]/10 border border-[#43C7D9]/30 text-[#43C7D9]">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 text-[11px]">Seafloor Crest & Sub-bottom Geological Strata</div>
                  <p className="text-[#94a3b8] text-[10.5px] leading-relaxed mt-0.5">
                    The glowing cyan line represents the true bathymetric seabed. The underlying multi-colored dashed horizons, cross-hatching, and micro-reflector speckles represent sub-bottom sedimentary horizons and bedrock penetrated by low-frequency chirps.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. SUBMERSIBLE VEHICLE & INTERACTIVE CONTROLS ── */}
          <div className="rounded-lg p-4 border" style={{ background: '#091319', borderColor: '#1F313D' }}>
            <div className="flex items-center gap-2 mb-3 border-b pb-2" style={{ borderColor: '#182935' }}>
              <Gauge className="w-4 h-4 text-[#43C7D9]" />
              <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                3. Submersible Controls & How to Move It
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60">
                <div className="font-bold text-[#43C7D9] text-[11px] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>🖱️ Precision Cursor Dragging</span>
                </div>
                <p className="text-[#94a3b8] text-[10.5px] leading-relaxed">
                  Hover your mouse cursor over the submarine hull. An in-canvas precision HUD reticle <span className="text-[#43C7D9]">[LOCK]</span> appears. Click and drag the submarine anywhere in the water column to test soundings at any depth or horizontal distance.
                </p>
              </div>

              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60">
                <div className="font-bold text-[#63C79A] text-[11px] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>⌨️ Keyboard Arrow Keys</span>
                </div>
                <p className="text-[#94a3b8] text-[10.5px] leading-relaxed">
                  Press <kbd className="px-1 py-0.5 rounded bg-[#14232C] text-slate-200 border border-[#2A3D4A]">↑</kbd> to ascend, <kbd className="px-1 py-0.5 rounded bg-[#14232C] text-slate-200 border border-[#2A3D4A]">↓</kbd> to descend, and <kbd className="px-1 py-0.5 rounded bg-[#14232C] text-slate-200 border border-[#2A3D4A]">←</kbd> <kbd className="px-1 py-0.5 rounded bg-[#14232C] text-slate-200 border border-[#2A3D4A]">→</kbd> to cruise horizontally across the ocean basin.
                </p>
              </div>

              <div className="p-3 rounded border border-[#182935] bg-[#071018]/60">
                <div className="font-bold text-[#D9A441] text-[11px] mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>🚀 Transmit Ping / Spacebar</span>
                </div>
                <p className="text-[#94a3b8] text-[10.5px] leading-relaxed">
                  Press <kbd className="px-1 py-0.5 rounded bg-[#14232C] text-slate-200 border border-[#2A3D4A]">Spacebar</kbd> or click the <span className="text-[#43C7D9] font-bold">TRANSMIT PING</span> button to emit a pulse. If <span className="text-[#63C79A] font-bold">AUTO-SWEEP</span> is enabled, pings fire periodically at a steady, majestic pace.
                </p>
              </div>
            </div>
          </div>

          {/* ── 4. WHAT DASHBOARD METRICS REPRESENT ── */}
          <div className="rounded-lg p-4 border" style={{ background: '#091319', borderColor: '#1F313D' }}>
            <div className="flex items-center gap-2 mb-3 border-b pb-2" style={{ borderColor: '#182935' }}>
              <Radio className="w-4 h-4 text-[#43C7D9]" />
              <h3 className="text-sm font-bold tracking-wider text-slate-100 uppercase">
                4. What the Telemetry & Acoustic Metrics Mean
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-[10.5px]">
              <div className="p-2.5 rounded bg-[#071018] border border-[#182935]">
                <span className="text-[#7E93A4] block text-[10px]">DEPTH</span>
                <span className="font-bold text-slate-100">Submersible Depth</span>
                <p className="text-[#94a3b8] text-[9.5px] mt-1">Vertical distance of AUV below ocean surface in meters.</p>
              </div>

              <div className="p-2.5 rounded bg-[#071018] border border-[#182935]">
                <span className="text-[#7E93A4] block text-[10px]">SNR</span>
                <span className="font-bold text-[#63C79A]">Signal-to-Noise Ratio</span>
                <p className="text-[#94a3b8] text-[9.5px] mt-1">&gt;8 dB = Strong lock; 3–8 dB = Marginal; &lt;3 dB = Shadow blackout.</p>
              </div>

              <div className="p-2.5 rounded bg-[#071018] border border-[#182935]">
                <span className="text-[#7E93A4] block text-[10px]">SOUND SPEED c(z)</span>
                <span className="font-bold text-[#43C7D9]">Mackenzie Velocity</span>
                <p className="text-[#94a3b8] text-[9.5px] mt-1">In-situ acoustic speed calculated from depth, temperature, and salinity.</p>
              </div>

              <div className="p-2.5 rounded bg-[#071018] border border-[#182935]">
                <span className="text-[#7E93A4] block text-[10px]">COMPRESSION GAIN Gp</span>
                <span className="font-bold text-[#63C79A]">Pulse Gain 10log(B&middot;T)</span>
                <p className="text-[#94a3b8] text-[9.5px] mt-1">+18 to +24 dB SNR boost created by matched-filter convolution.</p>
              </div>

              <div className="p-2.5 rounded bg-[#071018] border border-[#182935]">
                <span className="text-[#7E93A4] block text-[10px]">THORP &alpha;(f)</span>
                <span className="font-bold text-[#43C7D9]">Acoustic Absorption</span>
                <p className="text-[#94a3b8] text-[9.5px] mt-1">Viscous and boric acid sound absorption loss in dB per kilometer.</p>
              </div>

              <div className="p-2.5 rounded bg-[#071018] border border-[#182935]">
                <span className="text-[#7E93A4] block text-[10px]">RANGE RES &Delta;R</span>
                <span className="font-bold text-[#63C79A]">Resolution c/(2B)</span>
                <p className="text-[#94a3b8] text-[9.5px] mt-1">Fine vertical distance distinguishing adjacent seafloor features.</p>
              </div>

              <div className="p-2.5 rounded bg-[#071018] border border-[#182935]">
                <span className="text-[#7E93A4] block text-[10px]">WENZ NOISE</span>
                <span className="font-bold text-[#D9A441]">Ambient Ocean Floor</span>
                <p className="text-[#94a3b8] text-[9.5px] mt-1">Background acoustic noise from waves, shipping, and molecular thermal motion.</p>
              </div>

              <div className="p-2.5 rounded bg-[#071018] border border-[#182935]">
                <span className="text-[#7E93A4] block text-[10px]">ENERGY SAVED</span>
                <span className="font-bold text-[#63C79A]">Power Efficiency</span>
                <p className="text-[#94a3b8] text-[9.5px] mt-1">+33% battery life extended via cognitive duty cycling vs continuous CW.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className="px-6 py-3 border-t flex items-center justify-between"
          style={{
            background: '#0B1720',
            borderColor: '#182935',
          }}
        >
          <div className="text-[11px] text-[#7E93A4] font-mono">
            <span>AquaPulse Ground Control Station</span> · <span className="text-[#43C7D9]">SIH26058 Ministry of Earth Sciences / NIOT</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded font-mono font-bold text-xs bg-[#43C7D9] text-[#071018] hover:brightness-105 transition-all"
          >
            GOT IT / CLOSE GUIDE
          </button>
        </div>
      </div>
    </div>
  );
};

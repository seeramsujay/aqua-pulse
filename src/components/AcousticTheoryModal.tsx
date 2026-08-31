import React from 'react';
import { X, BookOpen, Waves, Radio, Activity, Compass } from 'lucide-react';

interface AcousticTheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AcousticTheoryModal: React.FC<AcousticTheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 text-slate-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-cyan-950/70 border border-cyan-800 text-cyan-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Underwater Acoustics & RC-CSS Science</h2>
              <p className="text-xs text-slate-400">
                Ocean Stratification, Snell Refraction & Rolling Chirp Spread Spectrum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Sections */}
        <div className="space-y-5 text-xs text-slate-300 leading-relaxed max-h-[65vh] overflow-y-auto pr-2">
          {/* Section 1: Sound Speed Profile */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold font-mono text-sm">
              <Waves className="w-4 h-4" />
              <span>1. The Non-Uniform Ocean: Sound Speed Profile (Mackenzie Equation)</span>
            </div>
            <p>
              Unlike air, sound velocity in the ocean is highly non-uniform. It is governed by temperature (T), salinity (S), and hydrostatic depth pressure (z) according to the <strong>Mackenzie (1981) formula</strong>:
            </p>
            <div className="bg-slate-900 p-2.5 rounded font-mono text-cyan-300 text-[11px] border border-slate-800">
              c(T, S, z) = 1449.2 + 4.6T - 0.055T² + 0.00029T³ + (1.34 - 0.010T)(S - 35) + 0.0163z (m/s)
            </div>
            <p>
              In the <strong>Epipelagic mixed layer</strong> (0-200m), water is warm (~22°C) with high velocity (~1530 m/s). In the <strong>Permanent Thermocline</strong> (200-700m), temperature plunges to 4°C, causing sound speed to drop sharply to ~1480 m/s at the <strong>SOFAR Channel Axis</strong>. Below 1000m, increasing hydrostatic pressure (+0.0163z) causes sound speed to rise again.
            </p>
          </div>

          {/* Section 2: Snell's Law & Shadow Zones */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 font-bold font-mono text-sm">
              <Compass className="w-4 h-4" />
              <span>2. Snell's Law & Acoustic Shadow Zones</span>
            </div>
            <p>
              Acoustic waves continuously refract (bend) towards regions of <strong>lower sound velocity</strong> according to Snell's acoustic invariant:
            </p>
            <div className="bg-slate-900 p-2.5 rounded font-mono text-amber-300 text-[11px] border border-slate-800">
              p = cos(θ(z)) / c(z) = constant  ⇒  dθ/ds = - (1/c) · (dc/dz) · cos(θ)
            </div>
            <p>
              When a submersible in the warm surface layer transmits sound downwards into a colder thermocline, rays bend sharply downward or reflect upwards away from the deep seabed. This leaves massive <strong>Acoustic Shadow Zones</strong> where conventional single-frequency sonars cannot penetrate.
            </p>
          </div>

          {/* Section 3: Thorp Attenuation */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-purple-400 font-bold font-mono text-sm">
              <Activity className="w-4 h-4" />
              <span>3. Frequency-Dependent Attenuation (Thorp's Formula)</span>
            </div>
            <p>
              Seawater absorbs acoustic energy via boric acid and magnesium sulfate molecular relaxation. Attenuation α(f) in dB/km increases quadratically with frequency:
            </p>
            <div className="bg-slate-900 p-2.5 rounded font-mono text-purple-300 text-[11px] border border-slate-800">
              α(f) ≈ [0.11 f² / (1 + f²)] + [44 f² / (4100 + f²)] + 2.75×10⁻⁴ f² + 0.003 (dB/km)
            </div>
            <p>
              A 50 kHz ping loses &gt;30 dB/km and vanishes in deep water, whereas a 5 kHz chirp loses only ~0.8 dB/km, penetrating through deep thermoclines to the ocean floor.
            </p>
          </div>

          {/* Section 4: Rolling-Channel CSS Breakthrough */}
          <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold font-mono text-sm">
              <Radio className="w-4 h-4" />
              <span>4. The RC-CSS Solution: Rolling Chirp Spread Spectrum</span>
            </div>
            <p>
              Inspired by LoRa RF Spread Spectrum, <strong>AquaPulse Rolling-Channel CSS</strong> applies stepped Linear Frequency Modulated (LFM) chirps across staggered bands:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-2">
              <li><strong>Band 1 (3 - 12 kHz):</strong> Low-frequency upchirp with minimal absorption to pierce deep shadow zones and trenches.</li>
              <li><strong>Band 2 (15 - 32 kHz):</strong> Mid-band linear chirp to detect thermocline backscatter interfaces.</li>
              <li><strong>Band 3 (35 - 70 kHz):</strong> Wideband sweep for sub-meter high-resolution bathymetric imaging.</li>
            </ul>
            <p className="mt-2">
              By applying a <strong>Matched Filter cross-correlation</strong> at the receiver, the system achieves a pulse compression processing gain of <strong>G_p = 10 log₁₀(B × T) ≈ +18 dB</strong>, detecting weak returns even with SNR &lt; -10 dB!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-[11px] text-slate-500 font-mono">AquaPulse UUV Hydrography & Bathymetry Suite</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-lg transition font-mono"
          >
            CLOSE & RETURN TO SIMULATOR
          </button>
        </div>
      </div>
    </div>
  );
};

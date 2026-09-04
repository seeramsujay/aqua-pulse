import React from 'react';
import { X, BookOpen, Waves, Radio, Activity, Compass } from 'lucide-react';

interface AcousticTheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTIONS = [
  {
    icon: <Waves className="w-4 h-4" />,
    color: '#43C7D9',
    title: '1. The Non-Uniform Ocean: Sound Speed Profile (Mackenzie Equation)',
    formula: 'c(T, S, z) = 1449.2 + 4.6T − 0.055T² + 0.00029T³ + (1.34 − 0.010T)(S − 35) + 0.0163z  (m/s)',
    body: [
      'Unlike air, sound velocity in the ocean is highly non-uniform. It is governed by temperature (T), salinity (S), and hydrostatic depth pressure (z) according to the Mackenzie (1981) formula above.',
      'In the Epipelagic mixed layer (0–200m), water is warm (~22°C) with high velocity (~1530 m/s). In the Permanent Thermocline (200–700m), temperature plunges to 4°C, causing sound speed to drop sharply to ~1480 m/s at the SOFAR Channel Axis. Below 1000m, increasing hydrostatic pressure (+0.0163z) causes sound speed to rise again.'
    ]
  },
  {
    icon: <Compass className="w-4 h-4" />,
    color: '#D9A441',
    title: "2. Snell's Law & Acoustic Shadow Zones",
    formula: "p = cos(θ(z)) / c(z) = constant  ⟹  dθ/ds = −(1/c) · (dc/dz) · cos(θ)",
    body: [
      "Acoustic waves continuously refract (bend) towards regions of lower sound velocity according to Snell's acoustic invariant shown above.",
      "When a submersible in the warm surface layer transmits sound downwards into a colder thermocline, rays bend sharply downward or reflect upwards away from the deep seabed. This leaves massive Acoustic Shadow Zones where conventional single-frequency sonars cannot penetrate."
    ]
  },
  {
    icon: <Activity className="w-4 h-4" />,
    color: '#9B8EC4',
    title: "3. Frequency-Dependent Attenuation (Thorp's Formula)",
    formula: 'α(f) ≈ [0.11f² / (1 + f²)] + [44f² / (4100 + f²)] + 2.75×10⁻⁴f² + 0.003  (dB/km)',
    body: [
      "Seawater absorbs acoustic energy via boric acid and magnesium sulfate molecular relaxation. Attenuation α(f) in dB/km increases quadratically with frequency.",
      "A 50 kHz ping loses >30 dB/km and vanishes in deep water, whereas a 5 kHz chirp loses only ~0.8 dB/km, penetrating through deep thermoclines to the ocean floor."
    ]
  },
  {
    icon: <Radio className="w-4 h-4" />,
    color: '#63C79A',
    title: '4. Stepped Multi-Tone CSS & Micro-Chirp Innovation',
    formula: 'Gp = 10 log₁₀(B × T)  |  ΔR = c / (2B)  |  R_blind = (c × Tp) / 2',
    body: [
      'AQUAPULSE implements bare-metal software-defined wave synthesis emitting micro-chirps (Tp ≤ 1.5 ms) across agile sub-bands tailored to AUV transducer apertures.',
    ],
    list: [
      'Channel 0 (100–140 kHz, Tp = 1.5 ms): Deep penetration micro-chirp for turbid estuaries and deep strata.',
      'Channel 1 (200–250 kHz, Tp = 1.0 ms): Mid-band profiler across halocline and thermocline velocity boundaries.',
      'Channel 2 (400–480 kHz, Tp = 0.4 ms): Centimeter-grade bathymetric sounder in clear shallow water.',
    ],
    footer: 'Monostatic Blind Zone Elimination: Micro-chirps keep the physical receiver blind distance below R_blind < 1.1 m. Raw DAC samples are conditioned by an active 4th-order Sallen-Key Butterworth filter (TI OPA1612, fc = 450 kHz).'
  },
];

export const AcousticTheoryModal: React.FC<AcousticTheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      style={{ background: 'rgba(7, 16, 24, 0.85)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-3xl my-8 overflow-hidden flex flex-col"
        style={{
          background: '#0B1720',
          border: '1px solid #20333D',
          borderRadius: '8px',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: '#0E1C25',
            borderBottom: '1px solid #182A34',
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center rounded"
              style={{
                background: '#12232D',
                border: '1px solid #20333D',
                padding: '8px',
              }}
            >
              <BookOpen className="w-5 h-5 text-[#43C7D9]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Underwater Acoustics &amp; RC-CSS Science</h2>
              <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                Ocean Stratification · Snell Refraction · Rolling Chirp Spread Spectrum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded transition-colors text-slate-400 hover:text-slate-100"
            style={{
              background: '#12232D',
              border: '1px solid #20333D',
              padding: '6px',
            }}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {SECTIONS.map((sec) => (
            <div
              key={sec.title}
              className="p-4 space-y-3"
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
              }}
            >
              {/* Section header */}
              <div className="flex items-center gap-2.5">
                <div
                  className="p-1.5 rounded flex items-center justify-center"
                  style={{
                    background: '#12232D',
                    border: '1px solid #20333D',
                    color: sec.color,
                  }}
                >
                  {sec.icon}
                </div>
                <h3 className="font-mono text-xs font-bold" style={{ color: sec.color }}>{sec.title}</h3>
              </div>

              {/* Formula block */}
              <div
                className="rounded px-3 py-2.5 font-mono text-[11px] leading-relaxed tracking-wide"
                style={{
                  background: '#071018',
                  border: '1px solid var(--border-subtle)',
                  color: sec.color,
                }}
              >
                {sec.formula}
              </div>

              {/* Body paragraphs */}
              {sec.body.map((para, i) => (
                <p key={i} className="text-xs text-slate-300 leading-relaxed font-sans">{para}</p>
              ))}

              {/* List items */}
              {sec.list && (
                <ul className="space-y-1.5">
                  {sec.list.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-slate-400">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: sec.color }}
                      />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Footer note */}
              {sec.footer && (
                <p className="text-xs text-slate-400 leading-relaxed italic font-sans">{sec.footer}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            borderTop: '1px solid #182A34',
            background: '#0E1C25',
          }}
        >
          <span className="font-mono text-[10px] text-slate-500">AquaPulse UUV Hydrography &amp; Bathymetry Suite · MoES/NIOT SIH26058</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded font-mono text-[11px] font-bold tracking-wider uppercase transition-colors"
            style={{
              background: '#43C7D9',
              color: '#071018',
              border: 'none',
            }}
          >
            Close &amp; Return
          </button>
        </div>
      </div>
    </div>
  );
};

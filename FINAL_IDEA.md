# 🌊 AQUAPULSE — Final Consolidated Idea & Architecture
### SIH26058 | MoES / NIOT | Primary Reference Document
#### Last Updated: 2026-09-03 | Status: FINALISED

> This is the canonical reference document for all AquaPulse development.
> All other docs (idea.md, roadmap.md, walkthru.md, aquapulse_sih_report.md) are superseded by this file where there is a conflict.

---

## 1. Problem Statement — What We Are Solving

Autonomous Underwater Vehicles (AUVs) used by NIOT/MoES for bathymetric mapping, pipeline inspection, and ocean floor surveys rely on acoustic sonar to "see" underwater. The core failure:

**Conventional AUVs emit a single fixed-frequency acoustic pulse.** The ocean is not static — sound speed varies with temperature, salinity, and depth. At different depths, this single-frequency approach fails in predictable, physics-driven ways:

| Failure Mode | Cause | Effect |
|:--|:--|:--|
| High-Frequency Blackout (400–480 kHz) | Seawater absorption α ∝ f² | Echo dies in deep/murky water |
| Monostatic Blind Zone | Long pulse duration T_p | AUV blind to objects within 7.5 m |
| Acoustic Shadow Zones | Snell's Law ray bending at thermoclines | Entire ocean floor regions invisible |
| Energy Waste | Fixed power regardless of environment | Battery drained for zero mapping gain |

---

## 2. Our Solution — What AquaPulse Is

AquaPulse is a **Cognitive, Software-Defined Stepped Multi-Tone Chirp Spread Spectrum (RC-CSS) Acoustic Payload** — a smart sonar transmitter that continuously reads the ocean environment and automatically selects the best acoustic settings.

### Core Innovation: Three Adaptive Channels

Instead of one fixed frequency, AquaPulse divides the acoustic spectrum into three optimised sub-bands:

| Channel | Frequency Range | Bandwidth | Pulse Duration | Use Case |
|:--|:--|:--|:--|:--|
| **Ch0** | 100 – 140 kHz | 40 kHz | 1.2 ms | Deep water, turbid/murky estuaries |
| **Ch1** | 200 – 250 kHz | 50 kHz | 0.8 ms | Mid-water, thermocline boundary profiling |
| **Ch2** | 400 – 480 kHz | 80 kHz | 0.5 ms | Clear shallow water, centimetre-grade bathymetry |

A TinyML neural network (INT8 MLP) on the microcontroller reads 5 live sensor values and picks the optimal channel in under 0.42 ms.

### Key Physics Guarantees

**Range Resolution** (how sharp the depth image is):
$$\Delta R \approx \frac{c}{2B} \approx 0.93 \text{ to } 1.87 \text{ cm per channel}$$

**Blind Zone** (closest detectable distance — HARD CAPPED at 1.5 ms pulse):
$$R_{\text{blind}} = \frac{c \cdot T_p}{2} < 1.1 \text{ m}$$

**Matched Filter Processing Gain** (noise rejection boost):
$$\text{PG} = 10 \log_{10}(B \cdot T_{\text{sym}}) \approx +18.4 \text{ dB}$$

**Energy Savings vs. fixed-frequency transmitter:** Up to 38%

---

## 3. New Addition — HFM (Hyperbolic Frequency Modulated) Waveform

**Why this was added (post-finalisation):** The original design only had Linear Frequency Modulated (LFM) chirps. When the AUV moves through water (1–3 m/s), the Doppler effect compresses the returning echo in both range and time simultaneously — causing the matched filter output to smear and blurring the depth reading by several centimetres.

**HFM sweeps a hyperbolic frequency curve:**
$$f(t) = \frac{f_0 \cdot f_1}{f_1 - (f_1 - f_0)(t / T_p)}$$

HFM is Doppler-invariant — motion only shifts the matched filter peak laterally (in Doppler), it does NOT blur the range. A moving AUV gets a sharp depth map regardless of its speed.

**HFM is a pure firmware/software change — zero new hardware required.**

---

## 4. Complete Cyber-Physical Architecture (4 Tiers)

```
┌─────────────────────────────────────────────────────────────┐
│ TIER 4 — SURFACE GROUND CONTROL STATION (Host PC)           │
│  React 18 + TypeScript + Vite + TailwindCSS                 │
│  • Snell's Law 2D ray-tracing canvas (OceanCanvas.tsx)      │
│  • Reconstructed bathymetric map (BathymetryMap.tsx)        │
│  • FFT spectrogram waterfall (SpectrogramWaterfall.tsx)      │
│  • Mackenzie c(T,S,z) sound speed profile SVG               │
│  • Physics panel: SNR, TL, absorption, beam width           │
│  • Channel hop animation (NEWLY ADDED)                      │
│  • HFM vs LFM comparison panel (NEWLY ADDED)                │
│  • LFM vs RC-CSS comparison (ComparisonView.tsx)            │
│  • Environmental fault injector (EnvironmentalInjector.tsx) │
│  • MoES/NIOT RAG explanation assistant                      │
│  FastAPI Backend: /ws/telemetry, /api/bathymetry, /api/rag  │
│  Noise Floor Estimator — Wenz Ambient Model (NEWLY ADDED)   │
└────────────────────▲────────────────────────────────────────┘
                     │ WebSocket / UART 115200 Baud
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 3 — EMBEDDED COGNITIVE ADAPTATION (MCU Core 1)         │
│  • 4-ch ADC: Turbidity, Salinity, Temperature, Depth        │
│  • INT8 MLP Policy: → (channel, window, amplitude)          │
│  • T_pulse hard clamp: max 1.5 ms (NEWLY ADDED)             │
│  • 1D-CNN Echo Classifier: Specular / Diffuse / Multipath   │
│  • JSON telemetry packet → UART                             │
└────────────────────▲────────────────────────────────────────┘
                     │ Ping-Pong Buffer Swap
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 2 — BARE-METAL WAVE ENGINE (MCU Core 0 + DMA)          │
│  • 32-bit HW Timer: 2.4 MSPS TRGO → DAC (0% CPU overhead)  │
│  • LFM chirp lookup table generator                         │
│  • HFM chirp lookup table generator (NEWLY ADDED)           │
│  • Hann + Blackman-Harris windowing (sidelobes < -35 dB)    │
└────────────────────▲────────────────────────────────────────┘
                     │ Stepped 12-bit DAC voltage (0–3.3V)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ TIER 1 — ANALOG FRONT-END (Hardware — Post-Hackathon)        │
│  • OPA1612 4th-Order Sallen-Key Butterworth LPF             │
│  • f_c = 450 kHz, -80 dB/decade roll-off                   │
│  • BD139/BD140 Class-AB push-pull driver (1.5A peak)        │
│  • 50Ω matched load / BNC → Oscilloscope                    │
│  [NOTE: Physical assembly deferred post-internal hackathon] │
│  [SPICE simulation validates design — verified in software] │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Dropped / Descoped Features

The following were considered and explicitly removed for SIH26058:

| Feature | Reason Dropped |
|:--|:--|
| AES-128 encryption / LPI signal reduction | Not a defence project. MoES mandate is civilian exploration. Full signal power maintained. |
| Passive jammer localization demo | Defence framing inappropriate for MoES/NIOT evaluation context |
| IP68 hardware assembly | Deferred post internal hackathon |
| Real wet tank test | Deferred post internal hackathon |

---

## 6. Files in Repo — What Each Does

### Firmware (`firmware/src/`)
| File | Purpose |
|:--|:--|
| `main.cpp` | FreeRTOS dual-core entry point. Core 0: DMA wave engine. Core 1: TinyML + telemetry |
| `dma_dac_engine.c/.h` | LFM chirp synthesis. HFM to be added here. |
| `tinyml_policy.cpp/.h` | INT8 MLP inference. T_pulse clamp to be added here. |
| `sensor_adc.c/.h` | 4-channel ADC acquisition |

### Backend (`backend/`)
| File | Purpose |
|:--|:--|
| `server.py` | FastAPI: WebSocket /ws/telemetry, REST endpoints, RAG API |
| `rag_engine.py` | Oceanographic RAG + Mackenzie/Thorp/Snell physics. Wenz noise floor to be added. |
| `simulator.py` | Hardware-absent simulation mode |
| `database.py` | SQLite ORM for telemetry persistence |

### Frontend (`src/`)
| File | Purpose |
|:--|:--|
| `App.tsx` | Main layout, state, tab routing |
| `components/simulations/OceanCanvas.tsx` | 2D Snell's Law ray tracer + interactive AUV |
| `components/simulations/BathymetryMap.tsx` | Seabed point-cloud reconstruction |
| `components/simulations/ComparisonView.tsx` | Legacy CW vs RC-CSS. HFM tab to be added. |
| `components/telemetry/PhysicsPanel.tsx` | Live SNR/TL/absorption readout. Hop animation to be added. |
| `components/telemetry/SpectrogramWaterfall.tsx` | FFT waterfall display |
| `components/telemetry/SoundSpeedProfile.tsx` | Mackenzie c(z) graph |
| `components/common/AcousticTheoryModal.tsx` | In-app physics reference manual |
| `components/common/RagAssistantModal.tsx` | MoES/NIOT RAG assistant UI |
| `physics/oceanAcoustics.ts` | All physics math: Mackenzie, Thorp, Snell, matched filter |

### Hardware (`hardware/`)
| File | Purpose |
|:--|:--|
| `simulation/filter_and_driver_spice.cir` | SPICE netlist — OPA1612 filter + BD139/BD140 driver (has syntax error on lines 26 & 28, fix before running) |
| `schematics/*.sch.md` | Schematic documentation in markdown |
| `bom/BOM.md` | Full bill of materials |

### Simulations & Scripts
| File | Purpose |
|:--|:--|
| `docs/AquaPulse_3D_Simulation.blend` | Blender scene file (209 KB, needs animation render) |
| `scripts/build_blender_scene.py` | Programmatic Blender scene builder |
| `scripts/live_blender_bridge.py` | Live backend telemetry → Blender animation bridge |

---

## 7. Pending Changes (Finalised List)

| # | Change | File | Status |
|:--|:--|:--|:--|
| B1 | HFM waveform mode | `dma_dac_engine.c/.h` | ❌ Not started |
| B2 | T_pulse hard clamp ≤ 1.5 ms | `tinyml_policy.cpp/.h` | ❌ Not started |
| B3 | Wenz noise floor estimator | `rag_engine.py`, `simulator.py` | ❌ Not started |
| B5 | Fix SPICE file + run ngspice | `filter_and_driver_spice.cir` | ⚠️ File has syntax error |
| B6 | HFM tab in ComparisonView | `ComparisonView.tsx` | ❌ Not started |
| B8 | Channel hop animation | `PhysicsPanel.tsx` | ❌ Not started |

<!-- EOF: FINAL_IDEA.md -->

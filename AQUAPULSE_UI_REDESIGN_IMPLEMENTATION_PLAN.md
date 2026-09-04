# AQUAPULSE UI REDESIGN — COMPLETE IMPLEMENTATION PLAN

> **Design Authority**: This document is the single source of truth for the AquaPulse dashboard redesign. Gemini Flash MUST NOT make design decisions beyond what is specified here.

---

## A. CURRENT UI AUDIT

### A.1 Architecture Summary

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 18 + TypeScript | Single `App.tsx` monolith (~560 lines) |
| Styling | Tailwind CSS 3.4 + vanilla CSS | `index.css` (318 lines) + `tailwind.config.js` |
| Build | Vite 6.1 | Standard config |
| 3D | Three.js 0.185 | Used only in `ThreeDViewportModal` |
| Icons | lucide-react 0.475 | Used throughout |
| Charts | Hand-rolled SVG + Canvas | No charting library |
| State | React `useState` in `App.tsx` | No state management library |
| Audio | Web Audio API | `utils/audioSonar.ts` |
| Fonts | Inter + JetBrains Mono | Loaded via Google Fonts in `index.css` |

### A.2 File Inventory (24 source files)

```
src/
├── App.tsx                                    (560 lines)  — Monolithic shell, state, layout
├── index.css                                  (318 lines)  — Design tokens, utility classes
├── main.tsx                                   (10 lines)   — Entry point
├── types/sonar.ts                             (110 lines)  — All TypeScript interfaces
├── physics/
│   ├── oceanAcoustics.ts                      (376 lines)  — Mackenzie, Snell, Thorp, ray tracer
│   └── presets.ts                             (118 lines)  — 3 scenario definitions
├── hooks/
│   └── useAnimatedValue.ts                    (49 lines)   — Telemetry number animation
├── utils/
│   └── audioSonar.ts                          (87 lines)   — Web Audio chirp/echo synthesis
├── components/
│   ├── common/
│   │   ├── Navbar.tsx                         (272 lines)  — Top navigation bar
│   │   ├── BootSequence.tsx                   (204 lines)  — Startup splash screen
│   │   ├── AcousticTheoryModal.tsx            (174 lines)  — Theory reference modal
│   │   └── RagAssistantModal.tsx              (176 lines)  — RAG chat modal
│   ├── simulations/
│   │   ├── OceanCanvas.tsx                    (650 lines)  — Main canvas: ocean, AUV, rays
│   │   ├── ComparisonView.tsx                 (350 lines)  — CW vs RC-CSS + HFM Doppler
│   │   ├── BathymetryMap.tsx                  (248 lines)  — SVG bathymetry reconstruction
│   │   └── ThreeDViewportModal.tsx            (175 lines)  — Three.js GLB model viewer
│   └── telemetry/
│       ├── PhysicsPanel.tsx                   (249 lines)  — Channel selector + physics metrics
│       ├── SoundSpeedProfile.tsx              (230 lines)  — SVG c(z) vs depth profile
│       ├── SpectrogramWaterfall.tsx            (236 lines)  — Canvas spectrogram
│       ├── PulseCompressionChart.tsx          (198 lines)  — SVG chirp + sinc waveforms
│       ├── AbsorptionCurve.tsx                (162 lines)  — SVG Thorp α(f) curve
│       ├── EnvironmentalInjector.tsx          (160 lines)  — 4 environment sliders
│       ├── LiveHardwareBridge.tsx             (181 lines)  — WebSocket telemetry + RAG rationale
│       └── MissionLog.tsx                     (119 lines)  — Scrollable event timeline
```

### A.3 Current Navigation Structure

The current app has **no multi-page navigation**. Everything is on a single page.

**Current layout** (single page):
```
┌─────────────────────────────────────────────┐
│ Navbar (sticky)                              │
│  Brand | Scenario | Mode Switcher | Actions  │
│  Hardware Sub-System Strip                   │
├─────────────────────────────────────────────┤
│ Auto-sweep ribbon (conditional)              │
├────────────────────────┬────────────────────┤
│ Mission Header Card    │                     │
├────────────────────────┤                     │
│                        │ Tabbed Right Column │
│ OceanCanvas            │ SIGNAL|DSP|ENV|LOG  │
│ (8/12 cols)            │ (4/12 cols)         │
│                        │                     │
│ BathymetryMap          │ (varies by tab)     │
│                        │                     │
├────────────────────────┴────────────────────┤
│ Footer (keyboard hints)                      │
└─────────────────────────────────────────────┘
```

**Right column tab contents:**
- **SIGNAL**: SoundSpeedProfile → SpectrogramWaterfall → LiveHardwareBridge → PhysicsPanel
- **DSP**: PulseCompressionChart → AbsorptionCurve → LiveHardwareBridge → PhysicsPanel
- **ENVIRONMENT**: EnvironmentalInjector → LiveHardwareBridge → PhysicsPanel
- **LOG**: MissionLog → PhysicsPanel

When `mode === 'side-by-side'`: entire main area replaced by `ComparisonView`.

**Modals**: AcousticTheoryModal, RagAssistantModal, ThreeDViewportModal.

### A.4 Current Design Problems

| Problem | Severity | Details |
|---|---|---|
| No multi-screen navigation | HIGH | All content crammed on one page; right column is extremely cramped (4/12 cols) |
| PhysicsPanel duplicated 4× | HIGH | Identical component rendered in every tab, wasteful and confusing |
| LiveHardwareBridge duplicated 3× | HIGH | Same issue |
| Color palette is scattered | MEDIUM | Uses ocean-*, hydro-*, sonar-* palettes plus inline rgba values; inconsistent |
| Excessive glowing | MEDIUM | `glow-cyan`, `glow-pulse`, neon sonar rings — too much for a scientific tool |
| No Decision Trail | HIGH | User cannot see Environment → Physics → TinyML → Waveform → Result flow |
| No mission context bar | HIGH | Critical metrics (depth, SNR, channel, energy) scattered in mission header |
| Decorative animations | LOW | `scan-overlay`, `sonar-logo-ring`, `float` animation serve no scientific purpose |
| Panel accent borders | LOW | Top-border accent color system is reasonable but overused with glow effects |
| Grid pattern background | LOW | SVG grid overlay is purely decorative |
| Boot sequence too flashy | LOW | Animated radar pulses, spinning icons — overly theatrical |

### A.5 What Works Well (PRESERVE)

- **Physics engine** (`oceanAcoustics.ts`): Mackenzie, Thorp, Snell, ray tracing — excellent, do not touch
- **OceanCanvas**: 650-line canvas with proper ocean rendering, AUV, ray paths — scientifically accurate
- **BathymetryMap**: SVG with true profile, reconstructed soundings, CSV export — great
- **SoundSpeedProfile**: Clean c(z) profile with temperature overlay
- **SpectrogramWaterfall**: Proper time-frequency canvas with echo returns
- **PulseCompressionChart**: Educational chirp → sinc visualization
- **AbsorptionCurve**: Accurate Thorp α(f) with band highlight regions
- **ComparisonView**: CW vs RC-CSS + HFM Doppler tab — valuable for SIH demo
- **useAnimatedValue**: Clean easeOutCubic telemetry interpolation
- **audioSonar.ts**: Down-converted chirp/echo playback
- **WebSocket reconnection** in LiveHardwareBridge
- **Type system** in `sonar.ts`: Well-defined interfaces

---

## B. FINAL DESIGN SYSTEM

### B.1 Color Tokens

```css
:root {
  /* Backgrounds */
  --bg-root:       #071018;
  --bg-surface:    #0B1720;
  --bg-panel:      #0E1C25;
  --bg-elevated:   #12232D;
  --bg-inset:      #091319;     /* For chart areas, code blocks */

  /* Borders & Dividers */
  --border-default:  #20333D;
  --border-subtle:   #182A34;
  --border-strong:   #2A4050;

  /* Primary */
  --cyan:            #43C7D9;
  --cyan-muted:      #2A8997;
  --cyan-dim:        #1A5F6B;

  /* Semantic */
  --positive:        #63C79A;
  --warning:         #D9A441;
  --critical:        #D96B6B;

  /* Text */
  --text-primary:    #E7EEF1;
  --text-secondary:  #A9BBC3;
  --text-muted:      #71858F;
  --text-dim:        #4A6270;

  /* Chart Colors (for multi-series) */
  --chart-amber:     #D9A441;
  --chart-emerald:   #63C79A;
  --chart-violet:    #9B8EC4;
  --chart-rose:      #D96B6B;
  --chart-cyan:      #43C7D9;
}
```

### B.2 Typography

| Role | Font | Weight | Size | Tracking | Transform |
|---|---|---|---|---|---|
| Body text | Inter | 400 | 13px | 0 | none |
| UI label | Inter | 500 | 11px | 0.02em | none |
| Section heading | Inter | 600 | 14px | 0.01em | none |
| Page heading | Inter | 700 | 18px | -0.01em | none |
| Nav tab label | Inter | 600 | 12px | 0.04em | uppercase |
| Instrument value | JetBrains Mono | 600 | 16px | -0.02em | none |
| Instrument label | JetBrains Mono | 500 | 10px | 0.08em | uppercase |
| Instrument unit | JetBrains Mono | 400 | 9px | 0.04em | none |
| Code/formula | JetBrains Mono | 400 | 11px | 0 | none |

### B.3 Spacing & Layout

| Token | Value | Usage |
|---|---|---|
| `--space-xs` | 4px | Inline gaps |
| `--space-sm` | 8px | Tight padding |
| `--space-md` | 12px | Default gap |
| `--space-lg` | 16px | Section padding |
| `--space-xl` | 24px | Page margin |
| `--radius-sm` | 4px | Buttons, badges |
| `--radius-md` | 6px | Panels, cards |
| `--radius-lg` | 8px | Modal corners |
| `--radius-none` | 0px | Instrument readouts (sharp-cornered) |

### B.4 Panel System

**InstrumentPanel** — the universal container:
```css
.instrument-panel {
  background: var(--bg-panel);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  /* NO backdrop-filter blur */
  /* NO box-shadow glow */
  /* NO gradient background */
}
```

**Panel header** — simple divider, not a visual feature:
```css
.instrument-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  /* Label: Inter 600 12px var(--text-secondary) uppercase tracking 0.06em */
}
```

**MetricReadout** — for instrument values:
```css
.metric-readout {
  background: var(--bg-inset);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
}
/* Label: JetBrains Mono 500 10px var(--text-muted) uppercase tracking 0.08em */
/* Value: JetBrains Mono 600 16px var(--text-primary) */
/* Unit:  JetBrains Mono 400 9px  var(--text-dim) */
```

### B.5 Buttons & Interactive Elements

**Navigation tab (active)**:
```css
background: var(--bg-elevated);
border-bottom: 2px solid var(--cyan);
color: var(--text-primary);
```

**Navigation tab (inactive)**:
```css
background: transparent;
border-bottom: 2px solid transparent;
color: var(--text-muted);
```

**Primary action button**:
```css
background: var(--cyan);
color: var(--bg-root);
border-radius: var(--radius-sm);
font: Inter 600 12px;
/* Hover: brightness(1.1) */
```

**Subtle button**:
```css
background: var(--bg-elevated);
border: 1px solid var(--border-default);
color: var(--text-secondary);
/* Hover: border-color var(--border-strong) */
```

### B.6 Charts & Visualizations

- Chart background: `var(--bg-inset)` (#091319)
- Grid lines: `var(--border-subtle)` at 0.3 opacity
- Axis labels: JetBrains Mono 9px `var(--text-dim)`
- Data lines: 2px stroke, no glow effects, no `drop-shadow`
- Active indicator dot: 4px radius solid fill, no halo
- Chart border: 1px solid `var(--border-subtle)`
- Chart border-radius: `var(--radius-sm)` (4px)

### B.7 Animation Rules

| Allowed | Not Allowed |
|---|---|
| Acoustic ray propagation on canvas | Decorative scan-line overlays |
| Spectrogram time-scroll | Pulsing/glowing borders |
| AUV movement | Floating animations |
| Channel hop transition (brief flash) | Sonar ring logo animation |
| Telemetry value interpolation | Background gradient shifts |
| Ping wavefront expansion on canvas | Spinning icons |

### B.8 Status Indicators

- **Online/Connected**: 6px circle, solid `var(--positive)`, no ring animation
- **Warning**: 6px circle, solid `var(--warning)`
- **Error/Disconnected**: 6px circle, solid `var(--critical)`
- **Active channel**: Small filled rectangle (4×12px) in channel color, no glow

---

## C. FINAL NAVIGATION

### C.1 Tab Structure

The app shell uses a **horizontal tab bar** below the top header. NO sidebar. NO nested dropdowns.

```
┌──────────────────────────────────────────────────────────────────────┐
│ MISSION │ ACOUSTICS │ WAVEFORMS │ BATHYMETRY │ COGNITION │ SYSTEM │
└──────────────────────────────────────────────────────────────────────┘
```

**Secondary sub-tabs** appear as a row within the tab content area for tabs that need them:

| Tab | Sub-tabs |
|---|---|
| MISSION | *(none — single screen)* |
| ACOUSTICS | Propagation · Sound Speed · Absorption · Signal |
| WAVEFORMS | RC-CSS · CW vs RC-CSS · HFM / Doppler |
| BATHYMETRY | *(none — single screen)* |
| COGNITION | Live Decision · Environment · Decision History |
| SYSTEM | Hardware · Signal Chain · Mission Log |

### C.2 Modal Access

| Modal | Access Method |
|---|---|
| AcousticTheoryModal | Button in header utility area (book icon) |
| RagAssistantModal | Button in header utility area (bot icon), label "ASSIST" |
| ThreeDViewportModal | Button in header utility area (cube icon), label "TWIN" |
| BootSequence | On initial load only (no replay button) |

### C.3 Header Layout (Simplified)

```
┌──────────────────────────────────────────────────────────────────────┐
│ ◉ AQUAPULSE  │ [Scenario ▾] │ Auto-Sweep [ON/OFF] │ 🔊 📖 🤖 📦  │
│              │              │                     │ Status: ONLINE │
├──────────────────────────────────────────────────────────────────────┤
│ MISSION │ ACOUSTICS │ WAVEFORMS │ BATHYMETRY │ COGNITION │ SYSTEM  │
└──────────────────────────────────────────────────────────────────────┘
```

- Remove hardware sub-strip from navbar (move to SYSTEM tab)
- Remove mode switcher from navbar (mode is now selected via WAVEFORMS tab)
- Remove boot replay button
- Remove gradient top accent line
- Remove sonar logo ring animation

---

## D. SCREEN-BY-SCREEN LAYOUT

### D.1 MISSION Screen (Default, Hero)

The visual centerpiece of the SIH demonstration.

```
┌──────────────────────────────────────────────────────────────────┐
│                     MISSION CONTEXT BAR                          │
│  Depth: 120m │ Ch: Ch0 100-140k │ SNR: +14.2dB │ c(z): 1512 │  │
│  Energy Saved: 32% │ State: PROPAGATING │ Scenario: Thermocline │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│                      OceanCanvas (Hero)                          │
│            (Full width, min-height 520px)                        │
│     AUV → water column → thermocline → rays → seabed → echo    │
│                                                                  │
├───────────────────────────┬──────────────────────────────────────┤
│    DECISION TRAIL         │       KEY METRICS                    │
│                           │                                      │
│  ┌─────────────────┐      │  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ ENVIRONMENT     │      │  │Thorp │ │ Gp   │ │ B×T  │        │
│  │ T:18°C S:35 PSU │      │  │α(f)  │ │+18.4 │ │  60  │        │
│  │ Turb: 12 NTU    │      │  │dB/km │ │ dB   │ │      │        │
│  ├─────────────────┤      │  └──────┘ └──────┘ └──────┘        │
│  │ ACOUSTIC PHYSICS│      │                                      │
│  │ c(z)=1512 m/s   │      │  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ α=3.2 dB/km     │      │  │Blind │ │Noise │ │Snell │        │
│  ├─────────────────┤      │  │Zone  │ │Floor │ │Inv.  │        │
│  │ TINYML DECISION │      │  │<1.1m │ │62 dB │ │      │        │
│  │ Policy: Ch0     │      │  └──────┘ └──────┘ └──────┘        │
│  │ Latency: 0.42ms │      │                                      │
│  ├─────────────────┤      │                                      │
│  │ WAVEFORM        │      │                                      │
│  │ 100-140 kHz LFM │      │                                      │
│  │ Tp=1.5ms B=40k  │      │                                      │
│  ├─────────────────┤      │                                      │
│  │ RESULT          │      │                                      │
│  │ Echo Lock: YES  │      │                                      │
│  │ Depth: 1124.3m  │      │                                      │
│  │ SNR: +14.2 dB   │      │                                      │
│  └─────────────────┘      │                                      │
└───────────────────────────┴──────────────────────────────────────┘
```

**Components used:**
- `MissionContextBar` (NEW) — reads from App state
- `OceanCanvas` (existing, restyled)
- `DecisionTrail` (NEW) — vertical pipeline widget
- `MetricReadout` ×6 (NEW primitive) — using existing physics calculations

### D.2 ACOUSTICS Screen

Sub-tabs: **Propagation** · **Sound Speed** · **Absorption** · **Signal**

#### Propagation sub-tab:
```
┌──────────────────────────────────────────────────────────────────┐
│ OceanCanvas (compact, ~400px height, no controls overlay)       │
├──────────────────────────────────────────────────────────────────┤
│ Key Physics Metrics (single row of MetricReadouts)               │
│ [Thorp α(f)] [Processing Gain] [Time-Bandwidth] [Snell Inv.]   │
└──────────────────────────────────────────────────────────────────┘
```

#### Sound Speed sub-tab:
```
┌──────────────────────────────────┬───────────────────────────────┐
│ SoundSpeedProfile (SVG chart)    │ Layer Details & Readouts      │
│ (occupies ~60% width)            │ c(z), Temp, Salinity          │
│                                  │ Layer name, depth range       │
└──────────────────────────────────┴───────────────────────────────┘
```

#### Absorption sub-tab:
```
┌──────────────────────────────────┬───────────────────────────────┐
│ AbsorptionCurve (SVG chart)      │ Band regions, current α       │
│ (occupies ~60% width)            │ Channel selector              │
│                                  │ PhysicsPanel (channel only)   │
└──────────────────────────────────┴───────────────────────────────┘
```

#### Signal sub-tab:
```
┌──────────────────────────────────────────────────────────────────┐
│ SpectrogramWaterfall (full width, ~280px height)                 │
├──────────────────────────────────────────────────────────────────┤
│ [Peak SNR] [Dechirp Gain] [2-Way TOF] (readouts row)           │
└──────────────────────────────────────────────────────────────────┘
```

### D.3 WAVEFORMS Screen

Sub-tabs: **RC-CSS** · **CW vs RC-CSS** · **HFM / Doppler**

#### RC-CSS sub-tab:
```
┌──────────────────────────────────────────────────────────────────┐
│ PulseCompressionChart (full width)                               │
│   Transmitted Chirp s(t) + Matched Filter y(t)                  │
├──────────────────────────────────────────────────────────────────┤
│ Channel Selector (3 bands as radio buttons)                      │
├──────────────────────────────────────────────────────────────────┤
│ [Range Res] [Blind Zone] [Time-Bandwidth] (readouts row)        │
├──────────────────────────────────────────────────────────────────┤
│ Channel Hop Log (compact table)                                  │
└──────────────────────────────────────────────────────────────────┘
```

#### CW vs RC-CSS sub-tab:
```
ComparisonView (existing, restyled) — comparison tab only
```

#### HFM / Doppler sub-tab:
```
ComparisonView (existing, restyled) — hfm tab only
```

### D.4 BATHYMETRY Screen

```
┌──────────────────────────────────────────────────────────────────┐
│ BathymetryMap (full width, ~350px height)                        │
│   True profile + reconstructed soundings + sounding dots        │
├──────────────────────────────────────────────────────────────────┤
│ [Coverage %] [Avg Confidence %] [RMS Error ±m]  [EXPORT] [CLEAR]│
└──────────────────────────────────────────────────────────────────┘
```

### D.5 COGNITION Screen

Sub-tabs: **Live Decision** · **Environment** · **Decision History**

#### Live Decision sub-tab:
```
┌───────────────────────────────┬──────────────────────────────────┐
│ LiveHardwareBridge            │ DecisionTrail (vertical)         │
│  INT8 MLP Latency             │  Environment → Physics →         │
│  DMA CPU Load                 │  TinyML → Waveform → Result     │
│  Energy Saved                 │                                  │
├───────────────────────────────┤                                  │
│ RAG Mission Rationale         │                                  │
│ (the NIOT rule card)          │                                  │
└───────────────────────────────┴──────────────────────────────────┘
```

#### Environment sub-tab:
```
EnvironmentalInjector (full width, restyled)
```

#### Decision History sub-tab:
```
Channel Hop Log (expanded, full width table)
```

### D.6 SYSTEM Screen

Sub-tabs: **Hardware** · **Signal Chain** · **Mission Log**

#### Hardware sub-tab:
```
┌──────────────────────────────────────────────────────────────────┐
│ Hardware telemetry strip (moved from Navbar sub-strip)            │
│ STM32H7 DMA: 2.4 MSPS | OPA1612 Sallen-Key: fc=450kHz          │
│ INT8 TinyML Inference: <1.1ms                                    │
├──────────────────────────────────────────────────────────────────┤
│ WebSocket Connection Status                                      │
│ [Connected/Simulator] indicator + telemetry data                │
└──────────────────────────────────────────────────────────────────┘
```

#### Signal Chain sub-tab:
```
PhysicsPanel (channel selector + physics metrics — ONE instance)
```

#### Mission Log sub-tab:
```
MissionLog (full width, expanded height ~500px)
```

### D.7 Modal: Acoustic Theory
- Restyle with new panel system, remove gradient top bars
- Keep all 4 scientific sections
- Use `var(--bg-surface)` as modal background

### D.8 Modal: RAG Assistant
- Restyle chat bubbles: user = `var(--bg-elevated)`, assistant = `var(--bg-inset)`
- Remove gradient on user messages
- Keep suggested queries and input bar

### D.9 Modal: Digital Twin (3D)
- Restyle header with new panel system
- Remove cyan glow shadow on modal border
- Keep Three.js rendering untouched

---

## E. COMPONENT CHANGE MATRIX

| Component | Action | Files Modified | Priority | Risk |
|---|---|---|---|---|
| `index.css` | REWRITE | `src/index.css` | P0 | LOW |
| `tailwind.config.js` | REWRITE | `tailwind.config.js` | P0 | LOW |
| `App.tsx` | MAJOR REFACTOR | `src/App.tsx` | P0 | HIGH |
| `Navbar.tsx` | MAJOR RESTYLE | `src/components/common/Navbar.tsx` | P1 | MEDIUM |
| `BootSequence.tsx` | RESTYLE | `src/components/common/BootSequence.tsx` | P3 | LOW |
| `OceanCanvas.tsx` | MINOR RESTYLE | `src/components/simulations/OceanCanvas.tsx` | P1 | LOW |
| `BathymetryMap.tsx` | RESTYLE | `src/components/simulations/BathymetryMap.tsx` | P2 | LOW |
| `ComparisonView.tsx` | RESTYLE + SPLIT | `src/components/simulations/ComparisonView.tsx` | P2 | MEDIUM |
| `SoundSpeedProfile.tsx` | RESTYLE | `src/components/telemetry/SoundSpeedProfile.tsx` | P2 | LOW |
| `SpectrogramWaterfall.tsx` | RESTYLE | `src/components/telemetry/SpectrogramWaterfall.tsx` | P2 | LOW |
| `PulseCompressionChart.tsx` | RESTYLE | `src/components/telemetry/PulseCompressionChart.tsx` | P2 | LOW |
| `AbsorptionCurve.tsx` | RESTYLE | `src/components/telemetry/AbsorptionCurve.tsx` | P2 | LOW |
| `EnvironmentalInjector.tsx` | RESTYLE | `src/components/telemetry/EnvironmentalInjector.tsx` | P2 | LOW |
| `LiveHardwareBridge.tsx` | RESTYLE | `src/components/telemetry/LiveHardwareBridge.tsx` | P2 | LOW |
| `MissionLog.tsx` | RESTYLE | `src/components/telemetry/MissionLog.tsx` | P2 | LOW |
| `PhysicsPanel.tsx` | RESTYLE | `src/components/telemetry/PhysicsPanel.tsx` | P2 | LOW |
| `AcousticTheoryModal.tsx` | RESTYLE | `src/components/common/AcousticTheoryModal.tsx` | P3 | LOW |
| `RagAssistantModal.tsx` | RESTYLE | `src/components/common/RagAssistantModal.tsx` | P3 | LOW |
| `ThreeDViewportModal.tsx` | RESTYLE | `src/components/simulations/ThreeDViewportModal.tsx` | P3 | LOW |
| `MissionContextBar.tsx` | NEW | `src/components/common/MissionContextBar.tsx` | P1 | LOW |
| `DecisionTrail.tsx` | NEW | `src/components/common/DecisionTrail.tsx` | P1 | LOW |

---

## F. FILE-BY-FILE IMPLEMENTATION PLAN

---

### F.1 `tailwind.config.js`

**ACTION**: Rewrite color palette and clean up

**EXACT CHANGES**:
- Replace entire `colors` object with new palette tokens (bg, surface, panel, elevated, border, cyan, positive, warning, critical, text-primary, text-secondary, text-muted, text-dim, chart-amber, chart-emerald, chart-violet, chart-rose)
- Remove `ocean.*`, `hydro.*`, `sonar.*` color scales
- Remove ALL `animation` entries EXCEPT `pulse-slow` (keep for status dots only)
- Remove `keyframes`: sweep, sonarRing, scanLine, dataFlash, depthPulse, float, glowPulse
- Remove ALL `boxShadow` entries (glow-cyan, glow-green, glow-purple, glow-amber, glow-red, panel, panel-cyan, inner-glow)
- Remove `backgroundImage` entries (gradient-radial, grid-pattern)
- Keep `fontFamily` (mono: JetBrains Mono, sans: Inter) as is

**DO NOT CHANGE**: `content` paths, `plugins` array, fontFamily definitions

**VALIDATION**: Run `npx tailwindcss --help` or `pnpm dev` — app should compile with no missing utility errors.

---

### F.2 `src/index.css`

**ACTION**: Rewrite design tokens and utility classes

**EXACT CHANGES**:
- Keep Google Fonts import (line 1) unchanged
- Keep `@tailwind base/components/utilities` directives unchanged
- Replace `:root` CSS custom properties with new B.1 tokens
- Replace `body` styles: `background-color: #071018`, remove `background-image` (no SVG grid pattern, no radial gradient overlays)
- Keep scrollbar styles but change colors to new palette: track `#091319`, thumb `rgba(67, 199, 217, 0.2)`, thumb:hover `rgba(67, 199, 217, 0.35)`
- Replace `.glass-panel` with `.instrument-panel` class (see B.4 — no backdrop-filter, no glow)
- Remove `.panel-accent-cyan`, `.panel-accent-emerald`, `.panel-accent-purple`, `.panel-accent-amber` (no colored accent borders)
- Keep `.telemetry-cell` but restyle: bg `var(--bg-inset)`, border `var(--border-subtle)`, radius 4px, remove `::before` pseudo-element
- Keep `.telemetry-label` but change font-size to 10px, color to `var(--text-muted)`
- Keep `.telemetry-value` but change font-size to 16px, color to `var(--text-primary)`
- Replace `.panel-header`: remove border-bottom glow, use `var(--border-subtle)`
- Replace `.panel-title`: font Inter 600 12px (not JetBrains Mono), color `var(--text-secondary)`, tracking 0.06em
- Replace `.status-dot`: 6px circle, solid color, remove `::after` sonar ring animation
- Replace `.hud-chip`: bg `var(--bg-elevated)`, border `var(--border-default)`, radius 4px, font Inter 500 10px
- Keep `.freq-channel` but restyle: active uses `var(--border-strong)` border and subtle bg tint, no glow shadow
- Replace `.toggle-track` and `.toggle-thumb`: use new palette colors, remove glow shadows
- Remove `.scan-overlay` class entirely
- Remove `.sonar-logo-ring` rules
- Remove `.text-gradient-cyan` and `.text-gradient-brand`
- Remove `@keyframes sonarRing, scanLine, dataFlash, depthPulse, glowPulse`
- Keep `canvas { display: block; }` and `svg text { font-family: … }`
- Keep `::selection` but change to `rgba(67, 199, 217, 0.2)`

**DO NOT CHANGE**: Google Fonts import URL, `@tailwind` directives, canvas/svg base rules

**VALIDATION**: Verify that `.instrument-panel`, `.telemetry-cell`, `.telemetry-label`, `.telemetry-value`, `.metric-readout`, `.status-dot`, `.hud-chip`, `.freq-channel` classes all exist. No visual glitch on dev server.

---

### F.3 `src/App.tsx`

**ACTION**: Major refactor — add tab navigation, restructure layout, de-duplicate components

**EXACT CHANGES**:

1. **Add state**: `const [activeTab, setActiveTab] = useState<'MISSION' | 'ACOUSTICS' | 'WAVEFORMS' | 'BATHYMETRY' | 'COGNITION' | 'SYSTEM'>('MISSION');`
2. **Add sub-tab state**: `const [acousticsSubTab, setAcousticsSubTab] = useState<'propagation' | 'soundspeed' | 'absorption' | 'signal'>('propagation');`
3. **Add sub-tab state**: `const [waveformsSubTab, setWaveformsSubTab] = useState<'rccss' | 'cwvscss' | 'hfm'>('rccss');`
4. **Add sub-tab state**: `const [cognitionSubTab, setCognitionSubTab] = useState<'decision' | 'environment' | 'history'>('decision');`
5. **Add sub-tab state**: `const [systemSubTab, setSystemSubTab] = useState<'hardware' | 'signalchain' | 'log'>('hardware');`
6. **Remove**: `telemetryTab` state (replaced by tab navigation)
7. **Remove**: `mode` state from App and Navbar — mode is now implicitly RC-CSS (default) or set via WAVEFORMS tab sub-tab selection
8. **Actually**: Keep `mode` state but move the mode switcher out of Navbar and into the WAVEFORMS tab area. When user clicks "CW vs RC-CSS" or "HFM" sub-tab, mode changes accordingly.
9. **Root container**: Change `style={{ background: '#020612' }}` to `style={{ background: 'var(--bg-root)' }}` (which resolves to `#071018`)
10. **Remove**: Auto-sweep status ribbon (the green bar). Auto-sweep status moves into MissionContextBar.
11. **Replace**: Mission Header Card with `<MissionContextBar>` component
12. **Replace**: The tabbed right column + grid layout with a full-width content area that renders based on `activeTab`
13. **Render PhysicsPanel** only ONCE, in the SYSTEM > Signal Chain sub-tab
14. **Render LiveHardwareBridge** only ONCE, in the COGNITION > Live Decision sub-tab
15. **Replace**: Footer styling with new palette (bg `var(--bg-surface)`, border `var(--border-subtle)`)
16. **Keep**: ALL state logic for submersible, echoes, soundings, missionEvents, bands, activeBandIndex, autoRoll, isAutoPinging, environmental knobs
17. **Keep**: ALL callback handlers (handleSelectScenario, handleResetEnvironment, triggerPingWithAudio, handleEchoDetected, handleSoundingPoint)
18. **Keep**: ALL useEffect hooks (keyboard handler, autoRoll timer, auto-ping timer, activeBandIndex sync)
19. **Keep**: Wenz noise floor calculation

**DO NOT CHANGE**: Any import from `physics/*`, `types/*`, `hooks/*`, `utils/*`. Any state management logic. Any callback function body. Any useEffect dependency array or body.

**VALIDATION**: All 16 existing components must still receive their original props. Submersible movement, ping, echo, and sounding flow must work identically. Switching tabs must not reset state.

---

### F.4 `src/components/common/Navbar.tsx`

**ACTION**: Simplify — remove mode switcher, hardware strip, decorative elements

**EXACT CHANGES**:
- Remove `modeButtons` array and mode switcher button group
- Remove `mode` and `setMode` from props interface
- Remove hardware sub-system strip (the bottom `<div>` with STM32, OPA1612, TinyML info)
- Remove gradient top accent line (`h-[2px] bg-gradient-to-r…`)
- Remove sonar logo ring animation spans
- Simplify brand: icon in a simple `var(--bg-elevated)` box with `var(--border-default)` border, no glow
- Remove `text-gradient-cyan` from "PULSE" — use `var(--cyan)` color instead
- Remove `hud-chip` from "RC-CSS SONAR" badge — use simple `var(--bg-elevated)` badge
- Style header: `background: var(--bg-surface)`, `border-bottom: 1px solid var(--border-default)`, no `backdrop-filter`
- Keep: scenario selector, auto-sweep toggle, audio toggle, theory/RAG/3D buttons, clock
- Restyle all buttons to use new palette tokens

**Add props**: `activeTab`, `setActiveTab` — render the main tab bar WITHIN the Navbar component at the bottom.

**Tab bar**: Horizontal row of 6 tabs (MISSION, ACOUSTICS, WAVEFORMS, BATHYMETRY, COGNITION, SYSTEM). Each tab renders with Inter 600 12px uppercase. Active tab: `var(--text-primary)` + 2px bottom border `var(--cyan)`. Inactive: `var(--text-muted)`, no border.

**DO NOT CHANGE**: Scenario selector logic, auto-sweep toggle logic, time clock logic, audio toggle logic, button handler callbacks

**VALIDATION**: All Navbar actions (scenario change, auto-sweep, audio, theory, RAG, 3D) must work. Tab bar must highlight active tab and call `setActiveTab`.

---

### F.5 `src/components/common/MissionContextBar.tsx` (NEW)

**ACTION**: Create new component

**Props**:
```typescript
interface MissionContextBarProps {
  submersible: Submersible;
  activeBand: ChirpBand;
  mode: SonarMode;
  activeScenario: PresetScenario;
  isAutoPinging: boolean;
  latestEcho: EchoReturn | undefined;
  layers: OceanLayer[];
  energySaved: number;
}
```

**Layout**: Single horizontal bar with 7-8 metric readouts in a row:
- **Depth**: `submersible.depth` m (JetBrains Mono 14px, color `var(--chart-amber)`)
- **Channel**: `activeBand.name` short form (e.g. "Ch0 100-140k")
- **SNR**: latest echo SNR or "--" (color: positive if >8, warning if 3-8, critical if <3)
- **c(z)**: sound speed at AUV depth (computed via `getOceanPropertiesAtDepth`)
- **Energy Saved**: `energySaved`% (color `var(--chart-emerald)`)
- **State**: `submersible.status` uppercase
- **Auto-Sweep**: indicator dot (green if active, dim if not)

**Styling**: Background `var(--bg-surface)`, border `var(--border-default)`, padding 8px 16px, no rounded corners (sharp, instrument-like). No shadows. No glass effect.

**DO NOT CHANGE**: N/A (new file)

**VALIDATION**: Values must update when AUV moves, band changes, echo received.

---

### F.6 `src/components/common/DecisionTrail.tsx` (NEW)

**ACTION**: Create new component

**Props**:
```typescript
interface DecisionTrailProps {
  layers: OceanLayer[];
  submersible: Submersible;
  activeBand: ChirpBand;
  latestEcho: EchoReturn | undefined;
  mode: SonarMode;
  turbidity: number;
  temperature: number;
  salinity: number;
}
```

**Layout**: Vertical pipeline with 5 stages connected by thin lines:

```
┌─ ENVIRONMENT ─────────────────┐
│ T: 18.0°C  S: 35.0 PSU       │
│ Turb: 12 NTU  Depth: 120m    │
└───────────────┬───────────────┘
                │ (thin line, var(--border-default))
┌─ ACOUSTIC PHYSICS ────────────┐
│ c(z): 1512 m/s                │
│ α(f): 3.2 dB/km              │
│ Shadow risk: LOW              │
└───────────────┬───────────────┘
                │
┌─ TINYML DECISION ─────────────┐
│ Policy → Ch0 (100-140 kHz)    │
│ Latency: 0.42ms               │
│ Confidence: 94%               │
└───────────────┬───────────────┘
                │
┌─ WAVEFORM ────────────────────┐
│ LFM Chirp 100-140 kHz        │
│ Tp=1.5ms  B=40kHz            │
│ Gp=+18.4 dB                  │
└───────────────┬───────────────┘
                │
┌─ RESULT ──────────────────────┐
│ Echo: LOCKED / LOST           │
│ Depth: 1124.3m               │
│ SNR: +14.2 dB                │
└───────────────────────────────┘
```

Each stage: `var(--bg-panel)` background, `var(--border-default)` border, 6px radius. Stage label in Inter 600 11px `var(--text-muted)` uppercase. Values in JetBrains Mono.

Compute all values from existing physics functions — DO NOT invent data.

**VALIDATION**: Trail updates reactively. Environment stage uses `getOceanPropertiesAtDepth`. Physics stage uses `calculateThorpAttenuation`. Result stage reads from `latestEcho`.

---

### F.7 `src/components/simulations/OceanCanvas.tsx`

**ACTION**: Minor restyle — clean up overlays

**EXACT CHANGES**:
- Change viewport header overlay: replace `bg-slate-900/85 backdrop-blur-md` with `background: var(--bg-surface)`, `border: 1px solid var(--border-default)`. Remove `shadow-lg`.
- Change "TRANSMIT PING" button: `background: var(--cyan)`, `color: var(--bg-root)`, remove gradient, remove glow shadow on hover
- Change bottom legend overlay: `background: var(--bg-surface)`, `border: 1px solid var(--border-default)`. Remove `backdrop-blur-sm`.
- Change canvas clear color: `'#071018'` (was `'#020612'`)
- Remove emoji `💡` from bottom hint text

**DO NOT CHANGE**: ANY physics/rendering logic. Canvas drawing code for layers, particles, depth grid, seafloor, acoustic rays, ping wavefronts, AUV hull, telemetry tag. Mouse drag handler. Trigger ping logic. Auto-ping loop. Coordinate system.

**VALIDATION**: Canvas renders identically except for slightly different background shade and overlay styling. Ping, drag, auto-sweep all work.

---

### F.8–F.16 All Telemetry Components

For each of: `SoundSpeedProfile`, `SpectrogramWaterfall`, `PhysicsPanel`, `PulseCompressionChart`, `AbsorptionCurve`, `EnvironmentalInjector`, `LiveHardwareBridge`, `MissionLog`, `BathymetryMap`:

**ACTION**: Restyle containers only

**UNIVERSAL CHANGES**:
- Replace `glass-panel` class with `instrument-panel`
- Remove `panel-accent-*` class (no colored top accent borders)
- Replace panel header icon boxes: `bg: var(--bg-elevated)`, `border: var(--border-default)` — remove per-color icon backgrounds
- Replace `.panel-title` color: use `var(--text-secondary)` for all (not per-color)
- Replace `.hud-chip` styling: `bg: var(--bg-elevated)`, `border: var(--border-default)`, `color: var(--text-secondary)`
- Replace `.telemetry-cell` styling: `bg: var(--bg-inset)`, `border: var(--border-subtle)`, radius 4px
- Replace color-specific telemetry-label/value classes with `var(--text-muted)` for labels, `var(--text-primary)` for values (values can use semantic colors for positive/warning/critical based on thresholds)
- Remove filter: `drop-shadow` from SVG elements — use solid strokes only
- Remove `shadow-xl`, `shadow-2xl`, `shadow-lg` from containers

**DO NOT CHANGE**: SVG path generation logic. Canvas rendering logic. Physics calculations (Thorp, Mackenzie, compression gain). Animation hook usage. WebSocket connection logic. CSV export logic. Event handlers. Component props interface. Data flow.

**VALIDATION**: Each component must render its chart/data identically to before, just with muted styling. No computation breakage.

---

### F.17–F.19 Modal Components

For `AcousticTheoryModal`, `RagAssistantModal`, `ThreeDViewportModal`:

**EXACT CHANGES**:
- Replace modal backdrop: `background: rgba(7, 16, 24, 0.85)`. Remove `backdrop-filter: blur`.
- Replace modal container: `background: var(--bg-surface)`, `border: 1px solid var(--border-default)`, `border-radius: var(--radius-lg)` (8px). Remove glow shadows.
- Replace accent bars: remove gradient top bars (`h-[2px] bg-gradient-to-r…`)
- Replace header background: `var(--bg-panel)` with `var(--border-subtle)` bottom border
- Replace close button: `var(--bg-elevated)` bg, `var(--border-default)` border
- AcousticTheoryModal: Keep all 4 SECTIONS array content. Replace per-section colors with `var(--text-secondary)`. Replace formula block bg with `var(--bg-inset)`.
- RagAssistantModal: Replace user message bg with `var(--bg-elevated)`. Replace assistant message bg with `var(--bg-inset)`. Remove gradient on user messages. Keep WebSocket/setTimeout logic.
- ThreeDViewportModal: Replace header bg. Remove outer glow shadow. Keep Three.js scene code, OrbitControls, GLTFLoader, lighting, fallback geometry, resize handler.

**DO NOT CHANGE**: Three.js scene setup, camera, renderer, lighting, animation loop, model loading, error handling, orbit controls. RAG assistant message handler logic. Theory section scientific content.

---

## G. GEMINI FLASH EXECUTION PLAN

### PHASE 0: Design Tokens & Global Stylesheet
**Priority**: P0 — Must be done first
**Files to modify**: `tailwind.config.js`, `src/index.css`
**Files NOT to modify**: Everything else

---

### PHASE 1: App Shell & Navigation
**Priority**: P0
**Files to modify**: `src/App.tsx`, `src/components/common/Navbar.tsx`
**New files**: `src/components/common/MissionContextBar.tsx`, `src/components/common/DecisionTrail.tsx`
**Files NOT to modify**: All other components, physics, hooks, utils, types

---

### PHASE 2: Mission Screen
**Priority**: P1
**Files to modify**: `src/components/simulations/OceanCanvas.tsx` (minor restyle)
**Files NOT to modify**: Canvas rendering logic, physics calculations

---

### PHASE 3: Acoustics Screens
**Priority**: P2
**Files to modify**: `SoundSpeedProfile.tsx`, `SpectrogramWaterfall.tsx`, `AbsorptionCurve.tsx`

---

### PHASE 4: Waveforms Screens
**Priority**: P2
**Files to modify**: `PulseCompressionChart.tsx`, `ComparisonView.tsx`, `PhysicsPanel.tsx`

---

### PHASE 5: Bathymetry Screen
**Priority**: P2
**Files to modify**: `BathymetryMap.tsx`

---

### PHASE 6: Cognition Screens
**Priority**: P2
**Files to modify**: `LiveHardwareBridge.tsx`, `EnvironmentalInjector.tsx`

---

### PHASE 7: System Screens
**Priority**: P2
**Files to modify**: `MissionLog.tsx`

---

### PHASE 8: Modals & Digital Twin
**Priority**: P3
**Files to modify**: `AcousticTheoryModal.tsx`, `RagAssistantModal.tsx`, `ThreeDViewportModal.tsx`

---

### PHASE 9: Polish & QA
**Priority**: P3
**Files to modify**: `BootSequence.tsx`, any final adjustments

---

## G.1 PHASE 0 PROMPT — Design Tokens & Global Stylesheet

```
You are modifying the AquaPulse project. This is Phase 0: Design Tokens.

FILES YOU MAY MODIFY:
- tailwind.config.js
- src/index.css

FILES YOU MUST NOT MODIFY: Everything else.

TASK 1: Rewrite tailwind.config.js

Replace the entire `colors` object inside `theme.extend` with this exact palette:

colors: {
  'bg-root':      '#071018',
  'bg-surface':   '#0B1720',
  'bg-panel':     '#0E1C25',
  'bg-elevated':  '#12232D',
  'bg-inset':     '#091319',
  'border-default': '#20333D',
  'border-subtle':  '#182A34',
  'border-strong':  '#2A4050',
  cyan:           '#43C7D9',
  'cyan-muted':   '#2A8997',
  'cyan-dim':     '#1A5F6B',
  positive:       '#63C79A',
  warning:        '#D9A441',
  critical:       '#D96B6B',
  'text-primary': '#E7EEF1',
  'text-secondary': '#A9BBC3',
  'text-muted':   '#71858F',
  'text-dim':     '#4A6270',
  'chart-amber':  '#D9A441',
  'chart-emerald': '#63C79A',
  'chart-violet': '#9B8EC4',
  'chart-rose':   '#D96B6B',
  'chart-cyan':   '#43C7D9',
},

Remove ALL entries under `animation` and `keyframes`.
Remove ALL entries under `boxShadow`.
Remove ALL entries under `backgroundImage`.
Keep `fontFamily` exactly as is.
Keep `content` and `plugins` exactly as is.

TASK 2: Rewrite src/index.css

Keep line 1 (Google Fonts import) unchanged.
Keep @tailwind base/components/utilities unchanged.

Replace :root with:

:root {
  color-scheme: dark;
  --bg-root: #071018;
  --bg-surface: #0B1720;
  --bg-panel: #0E1C25;
  --bg-elevated: #12232D;
  --bg-inset: #091319;
  --border-default: #20333D;
  --border-subtle: #182A34;
  --border-strong: #2A4050;
  --cyan: #43C7D9;
  --cyan-muted: #2A8997;
  --cyan-dim: #1A5F6B;
  --positive: #63C79A;
  --warning: #D9A441;
  --critical: #D96B6B;
  --text-primary: #E7EEF1;
  --text-secondary: #A9BBC3;
  --text-muted: #71858F;
  --text-dim: #4A6270;
}

Replace body styles:
  background-color: #071018;
  Remove ALL background-image declarations (no SVG grid, no radial gradients).
  Keep font-family, overflow-x, min-height.

Replace scrollbar styles:
  ::-webkit-scrollbar-track { background: #091319; }
  ::-webkit-scrollbar-thumb { background: rgba(67, 199, 217, 0.2); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(67, 199, 217, 0.35); }

Inside @layer components, replace ALL existing classes with:

  .instrument-panel {
    background: var(--bg-panel);
    border: 1px solid var(--border-default);
    border-radius: 6px;
  }

  .instrument-panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-bottom: 1px solid var(--border-subtle);
  }

  .instrument-panel-title {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-secondary);
  }

  .telemetry-cell {
    background: var(--bg-inset);
    border: 1px solid var(--border-subtle);
    border-radius: 4px;
    padding: 8px 10px;
  }

  .telemetry-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-muted);
  }

  .telemetry-value {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
    margin-top: 2px;
    color: var(--text-primary);
  }

  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    display: inline-block;
  }

  .hud-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border-radius: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.02em;
    text-transform: uppercase;
    background: var(--bg-elevated);
    border: 1px solid var(--border-default);
    color: var(--text-secondary);
  }

  .freq-channel {
    border-radius: 4px;
    border: 1px solid var(--border-default);
    background: var(--bg-inset);
    padding: 8px 10px;
    cursor: pointer;
    transition: border-color 0.15s ease;
    text-align: left;
  }
  .freq-channel:hover {
    border-color: var(--border-strong);
  }
  .freq-channel.active {
    background: var(--bg-elevated);
    border-color: var(--cyan-muted);
  }

  .toggle-track {
    position: relative;
    width: 32px;
    height: 18px;
    border-radius: 9px;
    background: var(--bg-inset);
    border: 1px solid var(--border-default);
    transition: all 0.2s ease;
    cursor: pointer;
    flex-shrink: 0;
  }
  .toggle-track.on {
    background: var(--cyan-dim);
    border-color: var(--cyan-muted);
  }
  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--text-muted);
    transition: all 0.2s ease;
  }
  .toggle-track.on .toggle-thumb {
    left: 16px;
    background: var(--cyan);
  }

  .progress-track {
    height: 3px;
    border-radius: 2px;
    background: var(--border-subtle);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.5s ease;
  }

Remove ALL other @layer components rules that are not listed above.

Remove ALL @keyframes rules.

Remove .sonar-logo-ring rules.
Remove .text-gradient-cyan and .text-gradient-brand rules.

Keep: canvas { display: block; }, svg text { font-family: ... }, ::selection (change to rgba(67,199,217,0.2)).

ACCEPTANCE CRITERIA:
- File contains exactly the classes listed above and nothing else inside @layer components
- No @keyframes blocks remain
- No gradient text utilities remain
- No sonar-logo-ring rules remain
- Body has solid #071018 background with no images
- Run `pnpm dev` — page loads (will look broken because components still use old classes, that's expected)
```

---

## G.2 PHASE 1 PROMPT — App Shell & Navigation

```
You are modifying the AquaPulse project. This is Phase 1: App Shell & Navigation.
Phase 0 (design tokens) has already been completed.

FILES YOU MAY MODIFY:
- src/App.tsx
- src/components/common/Navbar.tsx

FILES YOU MUST CREATE:
- src/components/common/MissionContextBar.tsx
- src/components/common/DecisionTrail.tsx

FILES YOU MUST NOT MODIFY: All physics, types, hooks, utils files. All other components.

CRITICAL RULE: Do NOT change any state management logic, callback functions, useEffect hooks, or physics calculations in App.tsx. Only change the JSX layout and add new state for tab navigation.

TASK 1: Create MissionContextBar.tsx

Create a new component at src/components/common/MissionContextBar.tsx.

Import types: Submersible, ChirpBand, SonarMode, PresetScenario, EchoReturn, OceanLayer from ../../types/sonar
Import: getOceanPropertiesAtDepth from ../../physics/oceanAcoustics

Props interface:
  submersible: Submersible
  activeBand: ChirpBand
  mode: SonarMode
  activeScenario: PresetScenario
  isAutoPinging: boolean
  latestEcho: EchoReturn | undefined
  layers: OceanLayer[]
  energySaved: number

The component renders a horizontal bar (div) with these styles:
  background: var(--bg-surface)
  border: 1px solid var(--border-default)
  border-radius: 0
  padding: 8px 16px
  display: flex
  align-items: center
  justify-content: space-between
  gap: 16px
  flex-wrap: wrap

Inside, render 7 metric cells. Each metric cell is a span with:
  font-family: 'JetBrains Mono', monospace
  font-size: 11px

Each cell has a label (10px, color var(--text-dim), uppercase) and a value (14px font-weight 600).

Metrics to show:
1. DEPTH: submersible.depth.toFixed(0) + "m", value color #D9A441
2. CHANNEL: Short form of activeBand.name (extract first part like "Ch0 100-140k"), value color var(--text-primary)
3. SNR: latestEcho?.snrDb?.toFixed(1) ?? "--", append " dB". Color: #63C79A if > 8, #D9A441 if 3-8, #D96B6B if < 3, var(--text-muted) if "--"
4. c(z): Compute getOceanPropertiesAtDepth(layers, submersible.depth).soundSpeed.toFixed(0) + " m/s", value color #43C7D9
5. ENERGY SAVED: energySaved.toFixed(0) + "%", value color #63C79A
6. STATE: submersible.status.toUpperCase(), value color var(--text-secondary)
7. SWEEP: Show a 6px status-dot (green #63C79A if isAutoPinging, gray var(--text-dim) if not) followed by text "AUTO" or "OFF"

TASK 2: Create DecisionTrail.tsx

Create src/components/common/DecisionTrail.tsx.

Import types: OceanLayer, Submersible, ChirpBand, EchoReturn, SonarMode from ../../types/sonar
Import: getOceanPropertiesAtDepth, calculateThorpAttenuation, calculateCssProcessingGain from ../../physics/oceanAcoustics

Props interface:
  layers: OceanLayer[]
  submersible: Submersible
  activeBand: ChirpBand
  latestEcho: EchoReturn | undefined
  mode: SonarMode
  turbidity: number
  temperature: number
  salinity: number

The component renders 5 stages connected by vertical lines.

Each stage is a div:
  background: var(--bg-panel)
  border: 1px solid var(--border-default)
  border-radius: 6px
  padding: 10px 12px

Stage header: Inter 600 11px var(--text-muted) uppercase, tracking 0.04em
Stage values: JetBrains Mono 400 11px var(--text-primary)

Connector between stages: a div with width 1px, height 16px, background var(--border-default), margin 0 auto.

Stage 1 - ENVIRONMENT:
  T: temperature.toFixed(1) + "°C"
  S: salinity.toFixed(1) + " PSU"
  Turb: turbidity.toFixed(0) + " NTU"
  Depth: submersible.depth.toFixed(0) + "m"

Stage 2 - ACOUSTIC PHYSICS:
  const props = getOceanPropertiesAtDepth(layers, submersible.depth)
  c(z): props.soundSpeed.toFixed(0) + " m/s"
  const centerFreq = (activeBand.fStart + activeBand.fEnd) / 2
  α(f): calculateThorpAttenuation(centerFreq).toFixed(1) + " dB/km"

Stage 3 - TINYML DECISION:
  Policy: activeBand.name (short form, e.g. extract "Ch0" from the name)
  Latency: "0.42 ms" (static — this is a simulation)

Stage 4 - WAVEFORM:
  Type: mode === 'rc-css' ? 'LFM Chirp' : 'CW Tone'
  Band: activeBand.fStart + "-" + activeBand.fEnd + " kHz"
  Tp: activeBand.durationMs + " ms"
  B: ((activeBand.fEnd - activeBand.fStart)) + " kHz"
  Gp: "+" + calculateCssProcessingGain((activeBand.fEnd - activeBand.fStart) * 1000, activeBand.durationMs / 1000).toFixed(1) + " dB"

Stage 5 - RESULT:
  If latestEcho exists and latestEcho.success: "Echo LOCKED", color #63C79A
  If latestEcho exists and !latestEcho.success: "Echo LOST", color #D96B6B
  If no latestEcho: "Awaiting echo...", color var(--text-dim)
  Depth: latestEcho?.calculatedDepthM?.toFixed(1) + "m" or "--"
  SNR: latestEcho?.snrDb?.toFixed(1) + " dB" or "--"

TASK 3: Modify Navbar.tsx

Remove from props: mode, setMode
Add to props: activeTab (string), setActiveTab (function)

Remove:
- modeButtons array and mode switcher button group
- Hardware sub-system strip (bottom div with STM32, OPA1612, TinyML)
- Gradient top accent line (h-[2px] bg-gradient-to-r)
- sonar-logo-ring spans (3 of them)
- text-gradient-cyan class usage — replace with style={{ color: '#43C7D9' }}
- hud-chip styling on "RC-CSS SONAR" badge — replace with the new hud-chip class
- All bg-cyan-950, text-cyan-300, border-cyan-700 etc inline Tailwind classes — replace with new token classes or inline styles using the new palette
- The onOpenBoot prop and boot replay button

Style the header:
  background: var(--bg-surface)
  border-bottom: 1px solid var(--border-default)
  Remove backdrop-filter
  Remove shadow-xl

After the main header content row, render a tab navigation bar:
  A div with display flex, gap 0, border-top 1px solid var(--border-subtle), padding 0 16px

  6 button elements for tabs: MISSION, ACOUSTICS, WAVEFORMS, BATHYMETRY, COGNITION, SYSTEM

  Each tab button:
    padding: 8px 16px
    font: Inter 600 12px
    letter-spacing: 0.04em
    text-transform: uppercase
    border: none
    border-bottom: 2px solid transparent
    background: transparent
    color: var(--text-muted)
    cursor: pointer
    transition: color 0.15s, border-color 0.15s

  Active tab:
    color: var(--text-primary)
    border-bottom-color: var(--cyan) (#43C7D9)

  onClick: () => setActiveTab(tabId)

TASK 4: Modify App.tsx

Add new state:
  const [activeTab, setActiveTab] = useState<string>('MISSION')
  const [acousticsSubTab, setAcousticsSubTab] = useState<string>('propagation')
  const [waveformsSubTab, setWaveformsSubTab] = useState<string>('rccss')
  const [cognitionSubTab, setCognitionSubTab] = useState<string>('decision')
  const [systemSubTab, setSystemSubTab] = useState<string>('hardware')

Remove: telemetryTab state

Keep ALL existing state and logic unchanged. Keep mode state (it will still be used).

Change root div style: background '#071018'

Update Navbar props: remove mode/setMode, add activeTab/setActiveTab.
Remove onOpenBoot prop.

Remove auto-sweep status ribbon div entirely.

Replace the entire <main> content with:

<main className="flex-1 w-full max-w-7xl mx-auto" style={{ padding: '16px' }}>

  <MissionContextBar
    submersible={submersible}
    activeBand={activeBand}
    mode={mode}
    activeScenario={activeScenario}
    isAutoPinging={isAutoPinging}
    latestEcho={echoes[echoes.length - 1]}
    layers={activeScenario.layers}
    energySaved={32.5}
  />

  <div style={{ marginTop: '16px' }}>
    {activeTab === 'MISSION' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ minHeight: '520px' }}>
          <OceanCanvas ... (same props as before) />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <DecisionTrail
            layers={activeScenario.layers}
            submersible={submersible}
            activeBand={activeBand}
            latestEcho={echoes[echoes.length - 1]}
            mode={mode}
            turbidity={turbidity}
            temperature={temperature}
            salinity={salinity}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', alignContent: 'start' }}>
            {/* 6 MetricReadout cells using telemetry-cell class */}
            {/* Thorp α(f), Processing Gain, Time-Bandwidth, Snell Invariant, Noise Floor, Blind Zone */}
            {/* Compute all values from existing physics functions */}
          </div>
        </div>
      </div>
    )}

    {activeTab === 'ACOUSTICS' && (
      <div>
        {/* Sub-tab bar */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {['propagation', 'soundspeed', 'absorption', 'signal'].map(tab => (
            <button key={tab} onClick={() => setAcousticsSubTab(tab)}
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                border: 'none',
                borderBottom: acousticsSubTab === tab ? '2px solid #43C7D9' : '2px solid transparent',
                background: 'transparent',
                color: acousticsSubTab === tab ? '#E7EEF1' : '#71858F',
                cursor: 'pointer',
              }}
            >{tab}</button>
          ))}
        </div>
        {acousticsSubTab === 'propagation' && <OceanCanvas ... />}
        {acousticsSubTab === 'soundspeed' && <SoundSpeedProfile ... />}
        {acousticsSubTab === 'absorption' && <AbsorptionCurve ... />}
        {acousticsSubTab === 'signal' && <SpectrogramWaterfall ... />}
      </div>
    )}

    {activeTab === 'WAVEFORMS' && (
      <div>
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          {[{id:'rccss',label:'RC-CSS'},{id:'cwvscss',label:'CW vs RC-CSS'},{id:'hfm',label:'HFM / Doppler'}].map(tab => (
            <button key={tab.id} onClick={() => { setWaveformsSubTab(tab.id); if(tab.id==='cwvscss') setMode('side-by-side'); else if(tab.id==='rccss') setMode('rc-css'); }}
              style={{...same tab styles...}}
            >{tab.label}</button>
          ))}
        </div>
        {waveformsSubTab === 'rccss' && <>
          <PulseCompressionChart ... />
          <PhysicsPanel ... /> {/* channel selector part */}
        </>}
        {waveformsSubTab === 'cwvscss' && <ComparisonView ... />}
        {waveformsSubTab === 'hfm' && <ComparisonView ... />}
      </div>
    )}

    {activeTab === 'BATHYMETRY' && <BathymetryMap ... />}

    {activeTab === 'COGNITION' && (
      <div>
        <div style={{ display: 'flex', gap: '0', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
          ...sub-tabs: decision, environment, history...
        </div>
        {cognitionSubTab === 'decision' && <LiveHardwareBridge ... />}
        {cognitionSubTab === 'environment' && <EnvironmentalInjector ... />}
        {cognitionSubTab === 'history' && <PhysicsPanel ... /> /* hop log only */}
      </div>
    )}

    {activeTab === 'SYSTEM' && (
      <div>
        ...sub-tabs: hardware, signalchain, log...
        {systemSubTab === 'hardware' && /* hardware info moved from navbar strip */}
        {systemSubTab === 'signalchain' && <PhysicsPanel ... />}
        {systemSubTab === 'log' && <MissionLog ... />}
      </div>
    )}
  </div>
</main>

Keep all modal rendering at the bottom unchanged.

Update footer styling: background var(--bg-surface), border-top 1px solid var(--border-default). Remove backdrop-filter.

ACCEPTANCE CRITERIA:
- App loads with MISSION tab active by default
- MissionContextBar shows real values that update
- Tab navigation works — clicking each tab shows relevant content
- OceanCanvas renders and is interactive (ping, drag AUV)
- All existing functionality preserved (auto-sweep, keyboard shortcuts, scenario switching, echo detection, bathymetry recording)
- PhysicsPanel rendered only once (in SYSTEM > Signal Chain)
- LiveHardwareBridge rendered only once (in COGNITION > Live Decision)
- No TypeScript errors
- No console errors
```

---

## G.3–G.9 REMAINING PHASE PROMPTS

### PHASE 2 PROMPT (Mission Screen Polish)

```
Phase 2: Mission Screen Polish. Phase 0 and 1 are complete.

FILES YOU MAY MODIFY: src/components/simulations/OceanCanvas.tsx

DO NOT MODIFY: Canvas physics, ray tracing, particle rendering, AUV drawing, seafloor rendering, drag handlers, ping logic.

CHANGES:
1. Canvas clear color: change '#020612' to '#071018'
2. Viewport header overlay: replace classes with inline styles:
   background: '#0B1720', border: '1px solid #20333D', borderRadius: '6px'. Remove backdrop-blur-md, shadow-lg.
3. TRANSMIT PING button: background '#43C7D9', color '#071018', borderRadius '4px'. Remove gradient. Remove glow shadow.
4. Bottom legend overlay: background '#0B1720', border '1px solid #20333D'. Remove backdrop-blur-sm.
5. Remove emoji '💡' from bottom hint.
6. Status dot animation on viewport header: replace animate-ping with a static dot.

ACCEPTANCE: Canvas renders. Ping works. Drag works. Overlays use new colors.
```

### PHASE 3 PROMPT (Acoustics)

```
Phase 3: Acoustics Screen Components. Phases 0-2 are complete.

FILES YOU MAY MODIFY:
- src/components/telemetry/SoundSpeedProfile.tsx
- src/components/telemetry/SpectrogramWaterfall.tsx
- src/components/telemetry/AbsorptionCurve.tsx

UNIVERSAL CHANGES for each file:
1. Replace 'glass-panel' class with 'instrument-panel'
2. Remove 'panel-accent-*' class
3. Replace panel header icon box: bg '#12232D', border '1px solid #20333D'
4. Replace panel-title class with instrument-panel-title
5. Replace hud-chip colors with default hud-chip styling
6. Replace telemetry-cell colors: labels use var(--text-muted), values use var(--text-primary) for default, keep semantic colors for threshold-based values
7. Remove filter: drop-shadow from SVG elements
8. Remove shadow-xl, shadow-2xl from containers

DO NOT MODIFY: SVG path generation, canvas rendering logic, physics calculations, useAnimatedValue usage, component props.

ACCEPTANCE: Each chart renders correctly with new muted styling. Data is identical.
```

### PHASE 4 PROMPT (Waveforms)

```
Phase 4: Waveforms Screen Components. Phases 0-3 complete.

FILES YOU MAY MODIFY:
- src/components/telemetry/PulseCompressionChart.tsx
- src/components/simulations/ComparisonView.tsx
- src/components/telemetry/PhysicsPanel.tsx

Apply same universal restyle rules as Phase 3.

Additional for ComparisonView:
- Replace rose/cyan accent borders with var(--border-default)
- Replace shadow-[0_0_30px...] with nothing
- Replace gradient buttons with solid var(--cyan) background
- Keep all METRICS, CW_CONS, CSS_PROS data arrays unchanged
- Keep HFMDopplerCanvas rendering logic unchanged

Additional for PhysicsPanel:
- Keep channel hop log logic
- Replace hopFlash ring animation with a brief background flash using var(--bg-elevated)

ACCEPTANCE: All charts render. Hop log works. Comparison view works.
```

### PHASE 5 PROMPT (Bathymetry)

```
Phase 5: Bathymetry. Apply universal restyle to BathymetryMap.tsx.
Keep SVG rendering, CSV export, sounding point rendering, useAnimatedValue unchanged.
ACCEPTANCE: Map renders. Export works. Metrics update.
```

### PHASE 6 PROMPT (Cognition)

```
Phase 6: Cognition. Apply universal restyle to LiveHardwareBridge.tsx and EnvironmentalInjector.tsx.
Keep WebSocket connection logic in LiveHardwareBridge unchanged.
Keep slider ranges and fault presets in EnvironmentalInjector unchanged.
ACCEPTANCE: WebSocket connects/reconnects. Sliders work. RAG rationale updates.
```

### PHASE 7 PROMPT (System)

```
Phase 7: System. Apply universal restyle to MissionLog.tsx.
Keep scrollContainerRef, auto-scroll, event icon mapping unchanged.
ACCEPTANCE: Events display. Auto-scroll works. Clear button works.
```

### PHASE 8 PROMPT (Modals)

```
Phase 8: Modals. Apply modal restyle rules to:
- AcousticTheoryModal.tsx
- RagAssistantModal.tsx
- ThreeDViewportModal.tsx

Universal modal changes:
- Backdrop: background rgba(7, 16, 24, 0.85), no backdrop-filter
- Modal container: background #0B1720, border 1px solid #20333D, border-radius 8px, no glow shadow
- Remove gradient accent bars
- Header: background #0E1C25, border-bottom 1px solid #182A34
- Close button: bg #12232D, border 1px solid #20333D

Keep: Three.js scene, RAG message logic, theory SECTIONS data.
ACCEPTANCE: All 3 modals open/close. Content renders. 3D viewport works.
```

### PHASE 9 PROMPT (Polish)

```
Phase 9: Polish & QA.

FILE: src/components/common/BootSequence.tsx

Changes:
- Background: #071018, remove radial gradient and scanline background-image
- Remove animate-ping-slow and animate-pulse-slow from radar emblem
- Simplify to a static icon in a var(--bg-elevated) box
- Progress bar: background var(--cyan), track var(--bg-inset)
- Boot log text colors: use var(--text-primary), var(--text-secondary), var(--text-muted)
- Remove spinning Radio icon

Keep: Boot step timing logic, handleFinish, keyboard handler, progress increment.

FINAL QA CHECKLIST (manual):
- [ ] All 6 tabs navigate correctly
- [ ] All sub-tabs within tabs work
- [ ] OceanCanvas: ping, drag, auto-sweep, keyboard
- [ ] BathymetryMap: soundings accumulate, CSV export
- [ ] SpectrogramWaterfall: echoes appear
- [ ] SoundSpeedProfile: AUV depth indicator moves
- [ ] PulseCompressionChart: chirp/sinc waveforms render
- [ ] AbsorptionCurve: operating point indicator
- [ ] PhysicsPanel: channel selector, hop log, auto-roll
- [ ] EnvironmentalInjector: sliders move, presets apply
- [ ] LiveHardwareBridge: WebSocket status, RAG rationale
- [ ] MissionLog: events log, auto-scroll, clear
- [ ] ComparisonView: CW vs CSS comparison, HFM Doppler
- [ ] AcousticTheoryModal: opens, shows all 4 sections
- [ ] RagAssistantModal: opens, chat works
- [ ] ThreeDViewportModal: opens, 3D renders
- [ ] MissionContextBar: all 7 metrics update
- [ ] DecisionTrail: all 5 stages update
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Colors consistent with palette
- [ ] No glow/neon effects anywhere
- [ ] No decorative animations
- [ ] JetBrains Mono used only for instrument values
- [ ] Inter used for all UI text
```

---

## APPENDIX: SAFETY BOUNDARIES

### Files That Must NEVER Be Modified

| File | Reason |
|---|---|
| `src/physics/oceanAcoustics.ts` | Core physics engine — Mackenzie, Thorp, Snell, ray tracer |
| `src/physics/presets.ts` | Scenario definitions with calibrated layer data |
| `src/types/sonar.ts` | TypeScript interfaces used by every component |
| `src/hooks/useAnimatedValue.ts` | Telemetry animation hook used throughout |
| `src/utils/audioSonar.ts` | Web Audio chirp synthesis |
| `src/main.tsx` | React entry point |

### Logic That Must NEVER Be Changed (Even In Modified Files)

- `calculateSoundSpeed()` function and its formula
- `calculateThorpAttenuation()` function and its formula
- `calculateTransmissionLoss()` function and its formula
- `calculateCssProcessingGain()` function and its formula
- `getSeafloorDepth()` terrain generation functions
- `traceAcousticRay()` numerical ray tracer
- `STANDARD_CHIRP_BANDS` band definitions
- `DEFAULT_OCEAN_LAYERS` layer definitions
- `SCENARIO_PRESETS` scenario definitions
- `SonarAudioEngine` class methods
- `useAnimatedValue` hook implementation
- WebSocket connection/reconnection logic in LiveHardwareBridge
- Canvas render loop physics in OceanCanvas (layers, particles, rays, seafloor, AUV)
- BathymetryMap SVG path calculations and CSV export
- SpectrogramWaterfall canvas echo rendering
- SoundSpeedProfile SVG path calculations
- PulseCompressionChart waveform generation (chirpWaveformPath, compressedSincPath)
- AbsorptionCurve curvePoints generation
- All event handlers and state update callbacks in App.tsx
- All useEffect dependencies and timing

---

*Document version 1.0 — Generated for AquaPulse SIH 2026*
*Design Authority: Senior UI/UX Architect*
*Execution Target: Gemini Flash*

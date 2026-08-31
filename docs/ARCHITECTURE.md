# 🏗️ AQUAPULSE: Modular Component & Physics Architecture

The AQUAPULSE project components and physics engine have been restructured into modular sub-packages to separate simulation viewports, telemetry analyzers, and common UI elements.

---

## 📁 Modular Layout

```
src/
├── main.tsx                           # Application entry point
├── App.tsx                            # Root operational layout manager
├── index.css                          # Custom CSS animations & Tailwind utilities
├── types/
│   └── sonar.ts                       # TypeScript interfaces (Ray, Submersible, Echo, Band)
├── physics/
│   ├── oceanAcoustics.ts              # Core numerical Snell ray tracer & Mackenzie formula
│   └── presets.ts                     # Ocean stratification scenario presets
└── components/
    ├── simulations/                   # 2D Canvas & Physical Viewports
    │   ├── OceanCanvas.tsx            # HTML5 Canvas real-time Snell ray-tracing viewport
    │   ├── BathymetryMap.tsx          # Reconstructed point-cloud bathymetric sonar map
    │   └── ComparisonView.tsx         # Benchmark view (Single-Frequency CW vs. RC-CSS)
    ├── telemetry/                     # Dynamic Telemetry & Analytical Graphs
    │   ├── SoundSpeedProfile.tsx      # Mackenzie c(z) velocity profile SVG graph
    │   ├── SpectrogramWaterfall.tsx   # Time-frequency spectrogram & de-chirp correlation
    │   └── PhysicsPanel.tsx           # Numeric parameters (attenuation, TL, SNR, beam width)
    └── common/                        # Shared UI Components & Modals
        ├── Navbar.tsx                 # Header navigation & scenario selector
        └── AcousticTheoryModal.tsx    # US Navy / NIOT Acoustic Handbook Reference
```

---

## 🔬 Subsystem Responsibilities

### 1. `components/simulations/`
- **`OceanCanvas.tsx`**: Renders real-time sound rays, thermocline shimmer, AUV movement, and seafloor collisions.
- **`BathymetryMap.tsx`**: Processes sounding returns to plot measured vs. true seabed profiles.
- **`ComparisonView.tsx`**: Provides side-by-side verification proving how RC-CSS eliminates blind zones.

### 2. `components/telemetry/`
- **`SoundSpeedProfile.tsx`**: Dynamically plots sound velocity $c(T, S, z)$ across depth layers.
- **`SpectrogramWaterfall.tsx`**: Visualizes FFT chirp frequencies and pulse compression spikes.
- **`PhysicsPanel.tsx`**: Live acoustic parameter monitoring (Thorp absorption, bandwidth, processing gain).

### 3. `components/common/`
- **`Navbar.tsx`**: Mode switcher, auto-ping toggle, and ocean preset selector.
- **`AcousticTheoryModal.tsx`**: Built-in mathematical reference manual.

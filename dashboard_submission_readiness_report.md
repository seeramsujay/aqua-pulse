# 🌊 AquaPulse — Web Dashboard Submission Readiness & Component Analysis Report
### SIH26058 | Ministry of Earth Sciences (MoES) / NIOT Context
**Target Deliverable:** Surface Ground Control Station (GCS) Web Application  
**Tech Stack:** React 18 + TypeScript + Vite + TailwindCSS + HTML5 Canvas + WebAudio API  

---

## 1. Executive Overview & Purpose of the Dashboard

The **AquaPulse Web Dashboard** acts as the **Tier 4 Surface Ground Control Station (GCS)** for the autonomous underwater bathymetric survey payload. During final hackathon judging for **SIH26058 (MoES/NIOT)**, the dashboard serves as the central visual proof of your cyber-physical architecture.

It bridges:
1. **Physical Ocean Science**: Live Snell's Law ray bending, Mackenzie sound speed profiling, and Thorp absorption attenuation.
2. **Signal & Waveform DSP**: Stepped Multi-Tone Chirp Spread Spectrum (RC-CSS), Doppler-invariant Hyperbolic Frequency Modulation (HFM), matched filter pulse compression, and FFT spectrogram waterfalls.
3. **Embedded TinyML Telemetry**: Real-time INT8 neural network channel decision telemetry, DMA DAC wave engine status, and environmental fault injection response.
4. **Interactive Hydrography**: Live AUV steering, bathymetric seabed point-cloud reconstruction, 3D Blender digital twin visualization, and an agentic RAG assistant.

---

## 2. Complete Inventory of Dashboard Components Required for Submission

```
AquaPulse Web Dashboard Architecture
├── Header & Navigation (Navbar, Boot Sequence, Quick Controls)
├── Main Viewport Area (OceanCanvas 2D Ray Tracer, BathymetryMap Seabed Mapper)
├── Waveform & Benchmark Suite (ComparisonView: CW vs RC-CSS & HFM Doppler)
├── Telemetry & DSP Analytics Column (Tabbed Layout)
│   ├── Tab 1: SIGNAL (SoundSpeedProfile, SpectrogramWaterfall)
│   ├── Tab 2: DSP & PHYSICS (PulseCompressionChart, AbsorptionCurve)
│   ├── Tab 3: ENVIRONMENT (EnvironmentalInjector, LiveHardwareBridge)
│   └── Tab 4: LOG (MissionLog Event Tracker)
└── Interactive Modals & 3D Twins
    ├── AcousticTheoryModal (In-App Physics Reference Manual)
    ├── RagAssistantModal (MoES / NIOT Domain AI Assistant)
    └── ThreeDViewportModal (Blender 3D Submersible Viewport)
```

---

## 3. Detailed Component Breakdown & Submission Requirements

### A. Core Header & Navigation Bar (`Navbar.tsx`, `BootSequence.tsx`)

| Component | Function / Subsystem | Required Features at Submission |
|:---|:---|:---|
| **Boot Diagnostics Overlay** (`BootSequence.tsx`) | System Startup Visualizer | • Cyberpunk/Industrial terminal diagnostic animation.<br>• Logs initialization of FreeRTOS dual-core DMA DAC engine, INT8 TinyML policy, UART bridge at 115200 baud, and Mackenzie engine. |
| **Header Navbar** (`Navbar.tsx`) | Primary System Navigation | • **Mode Selectors**: `RC-CSS (Agile)`, `CW (Fixed 450k)`, `BENCHMARK (Side-by-Side)`.<br>• **Ocean Profiles Dropdown**: 4 presets (*Deep Pacific Trench, Shallow Isothermal Coast, Strong Thermocline Layer, Arctic Sub-Ice Sounding*).<br>• **Controls**: `Transmit Ping (Space)`, `Auto-Sweep Toggle`, `Audio Feedback Toggle`.<br>• **Modal Triggers**: `3D Viewport`, `Agentic RAG Assistant`, `Acoustic Theory Manual`. |
| **Auto-Sweep Ribbon** | Live Transmission Indicator | • Top glowing emerald ribbon indicating continuous autonomous multi-tone pinging. |

---

### B. Main Viewport & Simulation Suite (`components/simulations/`)

| Component | Function / Subsystem | Required Features at Submission |
|:---|:---|:---|
| **2D Ocean Ray Tracing Canvas** (`OceanCanvas.tsx`) | Real-Time Snell's Law Physics Engine | • **Interactive AUV Submersible**: Draggable via mouse or controllable via Arrow Keys ($\uparrow \downarrow \leftarrow \rightarrow$).<br>• **Ocean Column Gradient**: Epipelagic (surface blue), Thermocline (gradient transition), Abyssal (deep navy).<br>• **Snell's Law Ray Bending**: Acoustic rays bending dynamically according to depth-dependent velocity $c(z)$.<br>• **Color-Coded Multi-Tone Channels**: Ch0 Amber ($100\text{--}140\text{ kHz}$), Ch1 Cyan ($200\text{--}250\text{ kHz}$), Ch2 Purple ($400\text{--}480\text{ kHz}$).<br>• **Seabed Impact Markers**: Dynamic echo return dots on seabed contour. |
| **Reconstructed Bathymetry Map** (`BathymetryMap.tsx`) | Seabed Sounding & Point-Cloud Reconstruction | • Real-time depth sounding plot reconstructed from acoustic travel time ($R = c \cdot t / 2$).<br>• Point-cloud depth color gradient (Shallow yellow/green to Deep purple).<br>• Clear soundings reset button & live point count statistics. |
| **Waveform Performance Benchmark** (`ComparisonView.tsx`) | Comparative Scientific Proof | • **Tab 1 (CW vs RC-CSS Benchmark)**: Side-by-side metric comparison card (Bathymetric Coverage, Deep SNR, Monostatic Blind Zone $R_{min} < 1.1\text{ m}$, Processing Gain $+18.4\text{ dB}$, Battery Savings up to $38\%$).<br>• **Tab 2 (HFM Doppler-Invariant Mode)**: Interactive AUV Speed slider ($0\text{ to }5\text{ m/s}$) showing Doppler frequency shift ($\Delta f$), LFM range error smearing ($\pm \text{cm}$), vs HFM crisp impulse response. |

---

### C. Telemetry & DSP Analytics Suite (`components/telemetry/`)

| Component | Function / Subsystem | Required Features at Submission |
|:---|:---|:---|
| **Sound Speed Profile** (`SoundSpeedProfile.tsx`) | Mackenzie (1981) Velocity Profile SVG | • Real-time graph plotting Depth ($z$) vs Sound Speed ($c(z)$ in m/s).<br>• Visualizes thermocline velocity drop ($1540\text{ m/s} \to 1490\text{ m/s}$).<br>• Horizontal marker tracking live AUV depth. |
| **Spectrogram Waterfall** (`SpectrogramWaterfall.tsx`) | Time-Frequency FFT Waterfall Display | • Dynamic Canvas showing frequency sweep spectrum over time ($100\text{--}480\text{ kHz}$).<br>• Displays chirp sweep trajectories and matched-filter echo correlation spikes. |
| **Pulse Compression & Matched Filter** (`PulseCompressionChart.tsx`) | DSP Matched Filter Processing View | • Plots raw noisy echo input vs compressed sinc-like output pulse.<br>• Demonstrates $+18.4\text{ dB}$ Processing Gain ($10 \log_{10}(B \cdot T_{sym})$). |
| **Thorp Seawater Absorption** (`AbsorptionCurve.tsx`) | Attenuation Science Graph | • Frequency-dependent seawater absorption $\alpha(f)$ curve in dB/km.<br>• Highlights high-frequency blackout at $450\text{ kHz}$ vs deep penetration at $120\text{ kHz}$. |
| **Live Hardware / HIL Bridge** (`LiveHardwareBridge.tsx`) | Embedded MCU Telemetry Link | • WebSocket/UART telemetry connection status badge (`CONNECTED` / `EMULATED`).<br>• Microcontroller metrics: Core 0 DMA transfer count, Core 1 TinyML inference latency ($<0.42\text{ ms}$), DAC sample rate ($2.4\text{ MSPS}$), UART baud rate ($115200$). |
| **Environmental Fault Injector** (`EnvironmentalInjector.tsx`) | Stress Testing & Fault Simulation | • Interactive sliders: **Turbidity** (NTU), **Salinity** (PSU), **Temperature** (°C), **Battery Voltage** (V).<br>• Allows judges to simulate murky estuarine water (forcing TinyML to switch to Ch0 $120\text{ kHz}$) or low battery modes. |
| **Live Mission & Telemetry Log** (`MissionLog.tsx`) | System Event Stream | • Rolling terminal-style event logger recording pings, echo locks, SNR readings, TinyML channel transitions, and scenario updates. |

---

### D. Modals & Extended Visualizers (`components/common/`)

| Component | Function / Subsystem | Required Features at Submission |
|:---|:---|:---|
| **Agentic RAG Assistant** (`RagAssistantModal.tsx`) | MoES / NIOT Domain AI Assistant | • Interactive AI chat modal powered by `backend/rag_engine.py`.<br>• Pre-loaded prompt buttons (*"Explain Snell's Law", "Why use HFM?", "How does RC-CSS save battery?"*).<br>• Formatted markdown physics answers for judges. |
| **Acoustic Theory Manual** (`AcousticTheoryModal.tsx`) | In-App Scientific Reference | • Modal containing formal mathematical formulas (Mackenzie sound speed, Snell's law, Thorp absorption, Range resolution $\Delta R = c/2B$, Blind zone $R_{blind} = c \cdot T_p / 2$). |
| **3D Blender Digital Twin** (`ThreeDViewportModal.tsx`) | 3D CAD & Subsea Viewport | • Modal embedding/visualizing the Blender 3D AUV model and 3D Snell's Law ray bending simulation. |

---

## 4. Key Scientific Metrics That MUST Be Visible to Judges

When presenting to judges, the dashboard MUST display these 5 primary metrics:

1. **Range Resolution ($\Delta R$)**: $\approx 0.93 \text{ to } 1.87\text{ cm}$ across active channels.
2. **Monostatic Blind Zone ($R_{blind}$)**: Hard capped at $< 1.1\text{ m}$ (due to $T_p \le 1.5\text{ ms}$).
3. **Matched Filter Processing Gain ($G_p$)**: $+18.4\text{ dB}$ gain ($10 \log_{10}(B \cdot T_{sym})$).
4. **Energy Consumption Savings**: Up to $38\%$ power reduction vs fixed single-frequency pings.
5. **TinyML Cognitive Hop Latency**: $< 0.42\text{ ms}$ on microcontroller Core 1.

---

## 5. Submission Checklist for Dashboard UI Developers

Use this checklist to ensure all dashboard features are 100% submission-ready:

- [x] **2D Ray Tracing Canvas**: Smooth 60 FPS Snell's law curve rendering & draggable AUV.
- [x] **Bathymetry Mapper**: Real-time seabed point-cloud reconstruction from ping returns.
- [x] **Waveform Benchmark**: Side-by-side metric comparison tab (CW vs RC-CSS).
- [x] **HFM Doppler Simulator**: Interactive speed slider demonstrating Doppler-invariance.
- [x] **Sound Speed Profile**: Mackenzie equation graph updating dynamically with environmental knobs.
- [x] **Spectrogram & Waterfall**: Live time-frequency FFT waterfall display.
- [x] **Pulse Compression View**: Matched filter impulse spike displaying $+18.4\text{ dB}$ gain.
- [x] **Environmental Injector**: Turbidity, salinity, temperature, and battery sliders.
- [x] **Hardware Bridge Panel**: Live UART/WebSocket status & MCU metrics ($<0.42\text{ ms}$ TinyML latency).
- [x] **WebAudio Ping Feedback**: Synthesized chirp sound on ping trigger.
- [x] **MoES/NIOT RAG Assistant**: Agentic AI modal for answering judge physics questions.
- [x] **3D Digital Twin**: Blender 3D AUV model viewport integration modal.

---
*Report compiled for SIH26058 AquaPulse Project Team | Ministry of Earth Sciences (MoES) / NIOT Final Submission.*

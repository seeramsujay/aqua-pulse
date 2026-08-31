# AquaPulse 🌊🔊
> **Rolling-Channel Chirp Spread Spectrum (RC-CSS) Acoustic Bathymetry & Underwater Sounding Simulator**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com/)

AquaPulse is an interactive physics simulation of **Rolling-Channel Chirp Spread Spectrum (RC-CSS)** acoustic bathymetry and hydrographic sounding for unmanned underwater vehicles (AUVs / UUVs). It models stratified ocean propagation, Snell's law acoustic ray curvature, Thorp's frequency-dependent seawater absorption, and demonstrates why conventional fixed-frequency sonars fail in deep shadow zones while frequency-rolling CSS delivers sub-meter bathymetric accuracy.

---

## 🎯 The Core Problem & The RC-CSS Solution

### 1. The Stratified Ocean Challenge
Unlike air, sound velocity $c(T, S, z)$ in the ocean varies continuously with temperature ($T$), salinity ($S$), and depth pressure ($z$). Governed by the **Mackenzie (1981) Equation**:
$$c(T, S, z) = 1449.2 + 4.6T - 0.055T^2 + 0.00029T^3 + (1.34 - 0.010T)(S - 35) + 0.0163z \quad (\text{m/s})$$

- **Surface Mixed Layer (0-200m)**: Warm (~22°C), high velocity (~1530 m/s).
- **Permanent Thermocline (200-700m)**: Temperature drops steeply to ~4°C, causing sound speed to collapse to ~1480 m/s.
- **Snell's Law Curvature**: Acoustic rays bend continuously toward regions of lower sound velocity:
$$\frac{\cos\theta(z)}{c(z)} = \text{constant} \implies \frac{d\theta}{ds} = -\frac{1}{c(z)}\frac{dc}{dz}\cos\theta$$
- **Acoustic Shadow Zones**: Single-frequency pings sent from near the surface refract away from deep trenches or seamounts, creating total acoustic blind spots.

### 2. High-Frequency Absorption (Thorp's Formula)
Conventional high-frequency sonars (45–100 kHz) suffer massive molecular relaxation absorption $\alpha(f)$:
$$\alpha(f) \approx \frac{0.11 f^2}{1 + f^2} + \frac{44 f^2}{4100 + f^2} + 2.75 \times 10^{-4} f^2 + 0.003 \quad (\text{dB/km})$$
At 50 kHz, two-way transmission loss exceeds 60 dB over just 1 km, completely blacking out deep returns.

### 3. The AquaPulse Rolling-Channel CSS Innovation
Adapted from LoRa RF Spread Spectrum, **RC-CSS** steps through synchronized Linear Frequency Modulated (LFM) chirps across staggered acoustic bands:
- **Band 1 (3 – 12 kHz)**: Low-frequency deep penetrator. Survives high-gradient thermoclines with $<1.5\text{ dB/km}$ loss to guarantee seafloor sounding.
- **Band 2 (15 – 32 kHz)**: Mid-band profiler. Resolves internal thermocline boundaries and backscatter interfaces.
- **Band 3 (35 – 70 kHz)**: Wideband sounder. Yields centimeter-grade vertical resolution in shallow isothermal layers.
- **Matched-Filter Processing Gain**: Pulse compression delivers:
$$G_p = 10 \log_{10}(B \cdot T) \approx +18.4\text{ dB}$$
allowing reliable echo detection even at negative signal-to-noise ratios ($\text{SNR} < -10\text{ dB}$).

---

## 🚀 Interactive Features

- 🎮 **Stratified 2D Ocean Viewport**: Real-time numerical Snell's law acoustic ray tracer with animated wave packet pulses, dynamic thermocline shimmer, and terrain bathymetry.
- 🕹️ **Draggable AUV Submersible**: Reposition the unmanned submersible in depth and range to observe refractive ray bending in real time.
- 📊 **Sound Speed Profile (SSP) Analyzer**: Live Mackenzie equation graph displaying sound velocity $c(z)$, temperature $T(z)$, and salinity $S(z)$ across ocean depth zones.
- 🌈 **Time-Frequency Waterfall Spectrogram**: Real-time visualization of rolling chirps, return echoes, Doppler shifts, and matched-filter correlation spikes.
- 🗺️ **Reconstructed Bathymetry Map**: Point-cloud sounding map plotting confidence ratings, spatial coverage percentage, and RMS vertical error.
- ⚡ **Side-by-Side Comparison Mode**: Direct benchmark showing why Legacy Single-Frequency Sonar loses signal in shadow zones while Rolling CSS achieves 98%+ seabed coverage.
- 📖 **US Navy Acoustic Handbook**: Built-in modal reference covering ocean physics formulas, Snell invariants, and spread spectrum modulation mathematics.

---

## 🛠️ Getting Started

### Prerequisites
- Node.js 18+
- `pnpm` (recommended package manager)

### Installation
```bash
# Clone the repository
git clone https://github.com/seeramsujay/aqua-pulse.git
cd aqua-pulse

# Install dependencies using pnpm
pnpm install

# Start the Vite development server
pnpm dev
```

### Building for Production
```bash
pnpm build
```

---

## ⌨️ Controls & Keybindings

| Key / Action | Function |
| :--- | :--- |
| **`Spacebar`** | Transmit Acoustic Ping |
| **`Arrow Keys`** | Steer Submersible (Left/Right horizontal, Up/Down depth) |
| **`Mouse Drag`** | Grab and drag the AUV icon anywhere in the water column |
| **`Auto-Sweep Toggle`** | Continuous automated ping and channel-rolling cycle |

---

## 📜 License
MIT License © 2026 Sujay Seeram & AquaPulse Contributors.

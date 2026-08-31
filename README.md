# 🌊 AQUAPULSE: Cognitive Software-Defined Sonar Payload & Ground Station

> **SIH26058 MoES/NIOT Mandate:** Cognitive, Low-Power, Software-Defined Sonar Payload & Cyber-Physical Ground Console for Autonomous Underwater Vehicles (AUVs / UUVs).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF.svg)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![Firmware: Bare-Metal C/C++](https://img.shields.io/badge/Firmware-FreeRTOS%2FSTM32%2FESP32--S3-green.svg)]()

---

## 📌 Executive Summary

Autonomous Underwater Vehicles (AUVs) operate in hostile, dynamically shifting marine environments where temperature gradients (thermoclines), salinity changes (haloclines), and suspended particulate matter (turbidity) alter acoustic wave propagation in real time. 

Traditional static, single-frequency sonars fail when encountering these underwater boundary layers:
* **High-frequency pings ($400\text{--}480\text{ kHz}$):** Deliver centimeter resolution but suffer severe viscosity attenuation ($\alpha \propto f^2$), causing total echo blackouts in turbid or deep waters.
* **Low-frequency pings ($100\text{--}140\text{ kHz}$):** Penetrate deep strata but lack spatial resolution.
* **Static Transmitters:** Waste finite onboard AUV battery reserves pumping power into shadow zones.

**AQUAPULSE** solves this with a **Cognitive, Software-Defined Sonar Payload**. By combining bare-metal Zero-CPU DMA-to-DAC waveform synthesis, an INT8 quantized TinyML edge policy engine, active analog signal conditioning (OPA1612 Butterworth filters), and a WebGL-powered cyber-physical ground station console, AQUAPULSE dynamically adapts its acoustic transmission to guarantee sub-meter bathymetric accuracy with up to **38% energy savings**.

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 4: SURFACE COMMAND CONSOLE & DIGITAL TWIN (Host Workstation)       │
│  • Next.js + React 18 Telemetry Dashboard & WebGL Spectrogram          │
│  • Mackenzie Dynamic Sound Speed Profile c(T,S,z) Calculator           │
│  • Snell's Law Acoustic Ray-Tracing Engine (Visualizes Shadow Zones)   │
│  • Oceanographic RAG Agent (Parses NIOT Bathymetry Guidelines)         │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Bidirectional Serial / WebSocket (115200 Baud)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 3: EMBEDDED COGNITIVE ADAPTATION (Microcontroller Core 1)         │
│  • 4-Channel Environmental ADC Acquisition (Salinity, Turbidity, Depth)│
│  • Quantized INT8 TinyML MLP Policy Engine (TensorFlow Lite Micro)     │
│  • Dynamic Parameter Tuple Generator: (f0, BW, Tpulse, Window, Amp)    │
│  • Closed-Loop Synthetic Echo Classifier (1D-CNN)                      │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Asynchronous Ping-Pong Buffer Swap
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 2: DETERMINISTIC BARE-METAL WAVE ENGINE (Core 0 + Peripherals)    │
│  • 32-Bit Hardware Timer (TIM6 / Timer Group) Generating 2.4 MSPS TRGO │
│  • Circular DMA Stream: Pushes SRAM Lookup Table to Internal/SPI DAC   │
│  • Zero-CPU Overhead (0.0% CPU Utilization During Active Transmission) │
│  • Digital Windowing: Real-time Hann & Blackman-Harris sample tapering │
└───────────────────────────────────▲────────────────────────────────────┘
                                    │ Discrete Stepped Voltage
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ TIER 1: ACTIVE ANALOG FRONT-END & POWER TRANSDUCTION                   │
│  • 4th-Order Active Sallen-Key Butterworth Low-Pass Filter (OPA1612)   │
│  • High-Frequency Cutoff fc = 450 kHz (-80 dB/decade roll-off)         │
│  • BD139/BD140 Push-Pull Transistor Driver                             │
│  • Matched 50Ω Reactive Dummy Load / Bench BNC to Oscilloscope (DSO)  │
│  • Transducer Model: Switched Dual-Element Cluster / 1-3 Piezocomposite│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🔬 Key Engineering Innovations

### 1. Stepped Multi-Tone Chirp Spread Spectrum (RC-CSS)
To prevent the **Monostatic Blind Zone** ($R_{\text{blind}} = \frac{c \cdot T_p}{2}$) from blinding the AUV, AQUAPULSE uses micro-chirps ($T_p = 0.4\text{ to }1.5\text{ ms}$), keeping the blind zone under $1.1\text{ meters}$:
* **Channel 0 ($100\text{--}140\text{ kHz}$, $B = 40\text{ kHz}$):** Deep penetration for turbid strata.
* **Channel 1 ($200\text{--}250\text{ kHz}$, $B = 50\text{ kHz}$):** Mid-water thermocline profiling.
* **Channel 2 ($400\text{--}480\text{ kHz}$, $B = 80\text{ kHz}$):** Centimeter-grade bathymetry in clear water.

### 2. Zero-CPU Hardware Synthesis & Active Analog Conditioning
* **DMA-to-DAC Streaming:** Pushes pre-calculated, digitally windowed (Blackman-Harris / Hann) lookup tables to the DAC with **0.0% CPU load**.
* **4th-Order Sallen-Key Butterworth Filter:** TI OPA1612 active low-pass filter ($f_c \approx 450\text{ kHz}$, $-80\text{ dB/decade}$ roll-off) removes digital staircase aliasing and out-of-band harmonics before driving the push-pull power stage (BD139/BD140).

### 3. Edge TinyML Optimization & Echo Perception
* **INT8 Quantized MLP:** Maps real-time ADC inputs $(\text{Turbidity}, \text{Salinity}, \text{Temperature}, \text{Depth}, V_{\text{battery}})$ to optimal pulse tuples $(f_0, B, T_p, \text{Window}, \text{Amp})$ in $<1.2\text{ ms}$ ($14.2\text{ KB}$ Flash, $4.8\text{ KB}$ RAM).
* **Closed-Loop 1D-CNN Echo Perception:** Classifies returns into specular reflection, diffuse scattering, or multipath distortion to adapt chirp slopes within $50\text{ ms}$.

---

## 📁 Repository Structure

```
aqua-pulse/
├── firmware/              # Embedded C/C++ (FreeRTOS, DMA Drivers, TFLite Micro)
├── hardware/              # Altium / KiCAD EDA Schematics (OPA1612 Filter & BD139 Driver)
├── backend/               # FastAPI Hub & TimescaleDB Telemetry Ingestion Service
├── src/                   # React 18 + TypeScript + Vite Ground Station UI
│   ├── components/        # OceanCanvas, SpectrogramWaterfall, PhysicsPanel, BathymetryMap
│   ├── physics/           # Mackenzie formula, Snell's law tracer, Thorp absorption model
│   └── types/             # System interfaces & telemetry data structures
├── docs/                  # Engineering spec, mathematical proofs, and NIOT guidelines
├── idea.md                # Comprehensive Executive Technical Specification
├── roadmap.md             # 4-Phase Cyber-Physical Execution Plan
├── README.md              # Architecture & Setup Guide (This file)
└── package.json           # Frontend dependency declarations
```

---

## 🛠️ Quickstart Guide

### Prerequisites
* **Node.js 18+** & **pnpm** (or npm/yarn)
* **Python 3.10+** (for FastAPI backend service)
* **STM32CubeIDE / ESP-IDF** (for microcontroller flashing)

### 1. Launch Ground Control Station (Frontend)
```bash
# Clone the repository
git clone https://github.com/seeramsujay/aqua-pulse.git
cd aqua-pulse

# Install dependencies
pnpm install

# Start development server
pnpm dev
```
Open **`http://localhost:3000/`** to launch the interactive Ground Control Station.

### 2. Flash Microcontroller Payload (Firmware)
```bash
cd firmware
# Build and flash FreeRTOS DMA waveform engine to target board (e.g. ESP32-S3 / STM32H7)
make flash PORT=/dev/ttyUSB0
```

---

## 📜 License
MIT License © 2026 Sujay Seeram & AQUAPULSE Contributors.

<!-- EOF: README.md -->

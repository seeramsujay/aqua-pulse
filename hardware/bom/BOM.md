# 📦 AQUAPULSE: Complete Bill of Materials (BOM)

| Designator | Component | Description | Package | Qty | Manufacturer | MPN | Notes |
|:---|:---|:---|:---|:---:|:---|:---|:---|
| **U1** | OPA1612 | Dual High-Performance Audio Op-Amp (40MHz, 27V/µs) | SOIC-8 | 1 | Texas Instruments | `OPA1612AIDR` | Active Butterworth filter |
| **Q1** | BD139 | NPN Power Bipolar Transistor (80V, 1.5A) | TO-126 | 1 | STMicroelectronics | `BD13916STU` | High-side push-pull driver |
| **Q2** | BD140 | PNP Power Bipolar Transistor (80V, 1.5A) | TO-126 | 1 | STMicroelectronics | `BD14016STU` | Low-side push-pull driver |
| **D1, D2** | 1N4148 | Fast Switching Diode (100V, 200mA) | SOD-123 | 2 | Vishay | `1N4148W-G3-08` | Class-AB bias stabilization |
| **R1–R4** | 1.2 kΩ | Precision Thin Film Resistor 0.1% 25ppm | 0805 | 4 | Panasonic | `ERA-6AEB122V` | Sallen-Key tuning network |
| **C1, C2** | 470 pF | C0G/NP0 Dielectric Ceramic Capacitor 50V 1% | 0805 | 2 | Murata | `GRM2195C1H471JA01D` | Zero temperature drift |
| **C3, C4** | 220 pF | C0G/NP0 Dielectric Ceramic Capacitor 50V 1% | 0805 | 2 | Murata | `GRM2195C1H221JA01D` | Filter pole shaping |
| **RE1, RE2** | 0.47 Ω | Power Metal Film Resistor 2W | Axial | 2 | Vishay Dale | `CW002R4700JE12` | Emitter degeneration |
| **COUT** | 10 µF | Polypropylene Film Capacitor 100V Low-ESR | Radial | 1 | WIMA | `MKP10 10uF` | DC blocking output cap |
| **RLOAD** | 50 Ω | Matched 50 Ω 5W Non-Inductive Resistor | TO-220 | 1 | Ohmite | `TCH35P50R0JE` | Benchtop dummy load |
| **U2** | INA219 | High-Side Zero-Drift I2C Current Monitor | SOIC-8 | 1 | Texas Instruments | `INA219AIDR` | Real-time power measurement |
| **J1** | BNC Jack | 50 Ω Female BNC Edge Connector | Edge-TH | 1 | Amphenol RF | `112404` | Oscilloscope interface |

<!-- EOF: hardware/bom/BOM.md -->

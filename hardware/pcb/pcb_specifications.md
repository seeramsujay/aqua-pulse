# 🛠️ AQUAPULSE: 4-Layer PCB Stackup & IP68 Pod Mechanical Design

## 1. 4-Layer Controlled-Impedance Stackup

| Layer | Type | Copper Thickness | Material | Dielectric Thickness | Purpose |
|:---|:---|:---:|:---|:---:|:---|
| **Layer 1 (Top)** | High-Speed Signal | $1.0\text{ oz } (35\,\mu\text{m})$ | FR-4 ($\varepsilon_r = 4.3$) | $0.2\text{ mm}$ | DAC signal, OPA1612 filter traces, BNC microstrip ($50\,\Omega$) |
| **Layer 2 (Inner 1)** | Ground Plane | $1.0\text{ oz } (35\,\mu\text{m})$ | Prepreg FR-4 | $1.0\text{ mm}$ | Unbroken reference ground plane (Analog/Digital Star Split) |
| **Layer 3 (Inner 2)** | Power Planes | $1.0\text{ oz } (35\,\mu\text{m})$ | Prepreg FR-4 | $0.2\text{ mm}$ | Split power islands: $+15\text{V}$, $-15\text{V}$, $+3.3\text{V}$, $+5\text{V}$ |
| **Layer 4 (Bottom)** | Low-Speed Signal & Heatsink | $1.0\text{ oz } (35\,\mu\text{m})$ | FR-4 | Total: $1.6\text{ mm}$ | Slow I2C telemetry, sensor lines, BD139/140 thermal copper pours |

## 2. High-Frequency Microstrip Parameters ($50\,\Omega$ Matching)
* **Trace Width ($W$):** $0.36\text{ mm}$ over $0.2\text{ mm}$ dielectric height.
* **Trace Clearance ($S$):** $0.25\text{ mm}$ to coplanar top ground pour.
* **Via Stitching:** $0.3\text{ mm}$ drill vias placed at $\lambda/20 \approx 5\text{ mm}$ intervals along RF return paths.

## 3. Submersible IP68 Enclosure & Subsea Connector
* **Enclosure:** Hard-anodized 6061-T6 Aluminum cylindrical pod ($80\text{ mm}$ OD $\times 180\text{ mm}$ length), rated to $2000\text{ meters}$ hydrostatic depth ($20\text{ MPa}$ test pressure).
* **Seals:** Dual redundant Nitrile 70 Shore A O-rings on end-caps with silicone vacuum grease.
* **External Bulkhead:** SubConn MCBH8M 8-pin micro circular wet-mateable connector.
  - Pin 1-2: $+12\text{--}24\text{V}$ DC Power Input & Ground
  - Pin 3-4: RS-485 / Differential UART Telemetry (Ground station link)
  - Pin 5-6: Piezo Transducer Differential Drive
  - Pin 7-8: Hydrostatic Depth / Thermistor Sensor Bus

<!-- EOF: hardware/pcb/pcb_specifications.md -->

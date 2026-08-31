# ⚡ AQUAPULSE: Class-AB Push-Pull Transducer Power Driver Stage

## 1. Schematic Overview

```
                      +15V Power Rail
                            │
                            ├───[C_bulk 100uF]── GND
                            │
                       ┌────┴────┐ (Collector)
                       │  BD139  │ NPN Transistor
                       │ (Q_top) │
                       └────┬────┘
     Filtered In            │ (Base)
   ──────►[R_b1 100Ω]──┬────┤
                       │    │ (Emitter)
                     [1N4148] ├───[R_e1 0.47Ω 2W]───┐
                       │                            │
                     [1N4148]                       ├───►[C_out 10uF]──► Transducer / 50Ω Load
                       │                            │
   ──────►[R_b2 100Ω]──┴────┤ (Base)                 │
                       │    │ (Emitter)             │
                       │ ┌──┴────┐                  │
                       │ │ BD140 │ PNP Transistor   │
                       │ │(Q_bot)│                  │
                       │ └──┬────┘                  │
                       └────┼─────[R_e2 0.47Ω 2W]───┘
                            │ (Collector)
                            │
                      -15V Power Rail
```

## 2. Circuit Analysis & Performance

* **Transistor Pair:** STMicroelectronics BD139 (NPN) & BD140 (PNP) in complementary push-pull topology.
  - Collector-Emitter Voltage $V_{CEO} = 80\text{ V}$
  - Continuous Collector Current $I_C = 1.5\text{ A}$ (Peak $3.0\text{ A}$)
  - Transition Frequency $f_T = 190\text{ MHz}$ (easily handling $100\text{--}480\text{ kHz}$)
* **Crossover Distortion Mitigation:** Dual 1N4148 diodes thermally coupled to the transistor package provide $\approx 1.3\text{ V}$ base-to-base forward bias, operating the output stage in linear Class-AB mode.
* **Thermal Stabilization:** Emitter degeneration resistors ($R_{E1}, R_{E2} = 0.47\,\Omega$, $2\text{ W}$ wirewound) prevent thermal runaway at elevated subsea ambient temperatures.
* **Output Coupling:** $10\,\mu\text{F}$ $100\text{ V}$ low-ESR polypropylene film capacitor blocks DC bias, driving the acoustic transducer or matched $50\,\Omega$ reactive dummy load.
* **Peak Output Power:** $P_{\text{peak}} = \frac{V_{\text{peak}}^2}{2 R_L} \approx \frac{(12\text{V})^2}{2 \times 50\,\Omega} = 1.44\text{ W}$ into $50\,\Omega$ load.

<!-- EOF: hardware/schematics/BD139_BD140_PushPull_Driver.sch.md -->

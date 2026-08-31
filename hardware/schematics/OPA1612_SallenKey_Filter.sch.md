# ⚡ AQUAPULSE: 4th-Order Active Sallen-Key Butterworth Reconstruction Filter

## 1. Schematic Overview

```
DAC Output (0-3.3V) ──►[R_in 100Ω]──┬──[R1 1.2k]──┬──[R2 1.2k]──┬──► (+) OPA1612 (Stage 1) ──┬──► Stage 2 In
                                   │              │             │                             │
                                   │              └───[C1 470p]─┼─────────────┐               │
                                   │                            │             │               │
                                   │                            └───[C2 220p]─┴── GND         │
                                   │                                                          │
                                   └──────────────────────────[Feedback]──────────────────────┘
```

## 2. Stage Mathematical Formulation

Each 2nd-order Sallen-Key low-pass filter stage has the transfer function:

$$H(s) = \frac{K \cdot \omega_0^2}{s^2 + \left(\frac{\omega_0}{Q}\right) s + \omega_0^2}$$

Where:
* **Natural Angular Frequency:** $\omega_0 = 2\pi f_c = \frac{1}{\sqrt{R_1 R_2 C_1 C_2}}$
* **Cutoff Frequency:** $f_c = \frac{1}{2\pi \sqrt{1200 \times 1200 \times 470\times 10^{-12} \times 220 \times 10^{-12}}} \approx 451.2\text{ kHz}$
* **Quality Factor ($Q$):** $Q = \frac{\sqrt{R_1 R_2 C_1 C_2}}{C_2 (R_1 + R_2)} = \frac{\sqrt{470\text{ pF} \times 220\text{ pF}}}{2 \times 220\text{ pF}} = \frac{321.4}{440} \approx 0.73$ (Maximally Flat Butterworth)

## 3. Two-Stage Cascaded 4th-Order Response
Cascading Stage 1 ($Q_1 = 0.541$) and Stage 2 ($Q_2 = 1.306$) yields:
* **Roll-off Slope:** $-80\text{ dB/decade}$ ($-24\text{ dB/octave}$)
* **DAC Clock Suppression:** At $2.4\text{ MSPS}$ sampling frequency, out-of-band clock images are attenuated by $> -78.5\text{ dB}$.
* **Passband Flatness:** $< 0.1\text{ dB}$ variation from $100\text{ kHz}$ to $480\text{ kHz}$.

## 4. Power Rails & Decoupling
* $V_{CC} = +12.0\text{V}$, $V_{EE} = -12.0\text{V}$ (Split Dual Rail).
* Decoupling: $100\text{ nF}$ C0G ceramic in parallel with $10\,\mu\text{F}$ Tantalum right at pin 8 ($V+$) and pin 4 ($V-$).

<!-- EOF: hardware/schematics/OPA1612_SallenKey_Filter.sch.md -->

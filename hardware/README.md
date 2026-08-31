# AQUAPULSE Hardware & Schematic Subsystem

KiCAD / Altium EDA schematics and layout files for the active analog front-end and power driver stage.

## Circuit Specifications
1. **Active Analog Reconstruction Filter:**
   - 4th-order active Sallen-Key Butterworth low-pass filter using Texas Instruments **OPA1612** op-amps.
   - High-speed parameters: 40 MHz Gain-Bandwidth product, 27 V/µs slew rate.
   - Component values: $R = 1.2\text{ k}\Omega$, $C_1 = 470\text{ pF}$, $C_2 = 220\text{ pF}$.
   - Cutoff frequency: $f_c \approx 450\text{ kHz}$ with $-80\text{ dB/decade}$ attenuation.

2. **Power Transduction Stage:**
   - Complementary push-pull transistor driver using BD139 (NPN) and BD140 (PNP).
   - Peak current delivery: Up to $1.5\text{ A}$ into $50\,\Omega$ reactive dummy load or piezo element.

3. **Termination:**
   - Benchtop BNC connection terminated into a matched $50\,\Omega$ reactive load for oscilloscope verification.

<!-- EOF: hardware/README.md -->

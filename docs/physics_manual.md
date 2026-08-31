# 🔬 AQUAPULSE: Physical & Acoustic Wave Equations Manual

This manual documents the mathematical formulas implemented across the AQUAPULSE cyber-physical system.

---

## 1. Sound Speed in Seawater — Mackenzie (1981) Equation

Sound speed $c(T, S, z)$ in meters per second is expressed as a function of temperature $T$ (°C), salinity $S$ (PPT/PSU), and depth $z$ (meters):

$$c(T, S, z) = 1449.2 + 4.6T - 0.055T^2 + 0.00029T^3 + (1.34 - 0.010T)(S - 35) + 0.0163z$$

Valid range: $0 \le T \le 30^\circ\text{C}$, $30 \le S \le 40\text{ PSU}$, $0 \le z \le 8000\text{ m}$.

---

## 2. Refraction & Acoustic Ray Tracing — Snell's Law

In stratified water columns where sound speed changes with depth, acoustic rays bend towards regions of lower sound velocity:

$$\frac{\cos \theta(z)}{c(z)} = \text{Constant (Ray Parameter } \xi)$$

The ray curvature is given by:

$$\frac{d\theta}{ds} = -\frac{1}{c(z)} \frac{dc}{dz} \cos \theta$$

Where $s$ is the distance along the ray path.

---

## 3. Seawater Absorption — Thorp's Formula

High-frequency acoustic absorption $\alpha(f)$ in $\text{dB/km}$ for frequency $f$ in kHz:

$$\alpha(f) \approx \frac{0.11 f^2}{1 + f^2} + \frac{44 f^2}{4100 + f^2} + 2.75 \times 10^{-4} f^2 + 0.003$$

---

## 4. Pulse Compression & Matched Filter Processing Gain

For a Linear Frequency Modulated (LFM) chirp of bandwidth $B$ and pulse duration $T_p$, matched filtering yields a processing gain $G_p$:

$$G_p = 10 \log_{10} (B \cdot T_p)$$

Slant-range spatial resolution $\Delta R$ is governed by chirp bandwidth:

$$\Delta R \approx \frac{c}{2B}$$

Monostatic blind zone distance $R_{\text{blind}}$:

$$R_{\text{blind}} = \frac{c \cdot T_p}{2}$$

---

## 5. Active Reconstruction Filter — Sallen-Key 4th-Order Butterworth

The 2nd-order active stage cutoff frequency $f_c$:

$$f_c = \frac{1}{2\pi \sqrt{R_1 R_2 C_1 C_2}}$$

Cascading two stages delivers a $-80\text{ dB/decade}$ roll-off, removing out-of-band DAC aliasing above $450\text{ kHz}$.

<!-- EOF: docs/physics_manual.md -->

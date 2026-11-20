# AQUAPULSE: Future Roadmap & Architectural Evolution

AQUAPULSE delivers real-time hydro-acoustic pulse synthesis, active analog conditioning, and edge TinyML echo perception for autonomous subsea bathymetry. This document outlines upcoming research and hardware development trajectories.

---

## 1. Acoustic Beamforming & Synthetic Aperture Sonar (SAS)

- **Multichannel Phased Array Beamforming**:
  - Scale from single-element switched clusters to a 16-channel linear hydrophone array driven by FPGA-synchronized ADCs.
  - Implement real-time Delay-and-Sum (DAS) and Minimum Variance Distortionless Response (MVDR / Capon) beamforming algorithms on embedded DSP.
- **Synthetic Aperture Sonar (SAS) Algorithm**:
  - Combine coherent along-track ping returns to synthesize a virtual aperture, achieving sub-decimeter bathymetric resolution across long-range ocean swaths.

---

## 2. Micro-Modem & Subsea Acoustic Networking

- **Dual-Mode Bathymetry & Acoustic Telemetry**:
  - Interleave bathymetric sounding chirps with Direct-Sequence Spread Spectrum (DSSS) Phase-Shift Keying (BPSK/QPSK) acoustic packet modems.
  - Enable AUV-to-AUV and AUV-to-Surface vessel low-bitrate data telemetry up to $1.5\text{ km}$ range without dedicated communications transducers.
- **Doppler Shift Velocity Log (DVL)**:
  - Exploit multi-beam Janus geometry to measure bottom-tracking Doppler shift, providing accurate dead-reckoning velocity vectors in GPS-denied benthic environments.

---

## 3. High-Pressure Hardware & Edge Acceleration

- **GaN Power Transistor Driver Stage**:
  - Replace bipolar BD139/BD140 drivers with ultra-efficient Gallium Nitride (GaN) half-bridge FETs, achieving $>92\%$ electrical-to-acoustic efficiency and reducing thermal sinking requirements in sealed subsea pressure hulls.
- **FPGA TinyML Coprocessor**:
  - Port echo perception CNN and pulse parameter optimization directly to a low-power Lattice iCE40 UltraPlus or AMD Kria SOM, driving inference latency $<100\ \mu\text{s}$.

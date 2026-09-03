#!/usr/bin/env python3
import subprocess
import os
import matplotlib.pyplot as plt
import numpy as np

def run_and_plot():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    docs_dir = os.path.abspath(os.path.join(script_dir, "../../docs"))
    os.makedirs(docs_dir, exist_ok=True)
    
    cir_file = os.path.join(script_dir, "filter_and_driver_spice.cir")

    print(f"Running ngspice on {cir_file}...")
    cmd = ["ngspice", "-b", cir_file]
    subprocess.run(cmd, capture_output=True, text=True, check=True, cwd=script_dir)

    ac_file = os.path.join(script_dir, "ac_out.txt")
    tran_file = os.path.join(script_dir, "tran_out.txt")

    # Parse AC data (Frequency, Magnitude dB, Phase Rad -> Deg)
    ac_freqs, ac_vdb, ac_vp_deg = [], [], []
    if os.path.exists(ac_file):
        with open(ac_file, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 4:
                    try:
                        f_val = float(parts[0])
                        vdb_val = float(parts[1])
                        vp_rad = float(parts[3])
                        # Convert radians to degrees
                        vp_deg = vp_rad * (180.0 / np.pi)
                        ac_freqs.append(f_val)
                        ac_vdb.append(vdb_val)
                        ac_vp_deg.append(vp_deg)
                    except ValueError:
                        pass

    # Parse TRAN data with decoupled time vectors (t1 for V16, t2 for V1)
    t1_us, tran_v16 = [], []
    t2_us, tran_v1 = [], []
    if os.path.exists(tran_file):
        with open(tran_file, 'r') as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 4:
                    try:
                        t1_val = float(parts[0]) * 1e6 # us
                        v16_val = float(parts[1])
                        t2_val = float(parts[2]) * 1e6 # us
                        v1_val = float(parts[3])
                        
                        t1_us.append(t1_val)
                        tran_v16.append(v16_val)
                        t2_us.append(t2_val)
                        tran_v1.append(v1_val)
                    except ValueError:
                        pass

    # Plot Bode Plot
    if ac_freqs and ac_vdb:
        plt.style.use('dark_background')
        fig, ax1 = plt.subplots(figsize=(10, 6))

        color = '#00f0ff'
        ax1.set_xlabel('Frequency (Hz)', fontsize=12, color='white')
        ax1.set_ylabel('Magnitude (dB)', color=color, fontsize=12)
        ax1.semilogx(ac_freqs, ac_vdb, color=color, linewidth=2.5, label='Magnitude V(16) [dB]')
        ax1.tick_params(axis='y', labelcolor=color)
        ax1.grid(True, which="both", ls="--", alpha=0.3)
        ax1.set_ylim(-100, 10)

        # Annotations
        ax1.axvline(x=450000, color='#ff007f', linestyle='--', linewidth=1.5, label='fc ~ 450 kHz (-3dB cutoff)')
        ax1.axhline(y=-4.55, color='#ffaa00', linestyle=':', linewidth=1.2, label='-3 dB Cutoff Threshold (-4.55 dB)')

        if len(ac_freqs) == len(ac_vp_deg):
            ax2 = ax1.twinx()
            color_phase = '#a855f7'
            ax2.set_ylabel('Phase (deg)', color=color_phase, fontsize=12)
            ax2.semilogx(ac_freqs, ac_vp_deg, color=color_phase, linewidth=1.8, linestyle='-.', label='Phase V(16)')
            ax2.tick_params(axis='y', labelcolor=color_phase)
            ax2.set_ylim(-200, 200)

        plt.title('AquaPulse AFE: 4th-Order Butterworth Filter Frequency Response (Bode Plot)', fontsize=14, pad=15, fontweight='bold', color='#00f0ff')
        fig.tight_layout()
        
        bode_path = os.path.join(docs_dir, "spice_bode_plot.png")
        plt.savefig(bode_path, dpi=300)
        plt.close()
        print(f"✅ Saved corrected Bode plot to {bode_path}")

    # Plot Transient Waveform
    if t1_us and tran_v16:
        plt.style.use('dark_background')
        fig, ax = plt.subplots(figsize=(10, 6))

        if t2_us and tran_v1:
            ax.plot(t2_us, tran_v1, color='#ff9900', linewidth=1.8, linestyle='--', alpha=0.85, label='V(1) DAC Input (250.0 kHz Sine, T = 4.0 µs)')

        ax.plot(t1_us, tran_v16, color='#00ff88', linewidth=2.2, label='V(16) Filter & Driver Output (250.0 kHz Sine, T = 4.0 µs)')

        ax.set_xlabel('Time (µs)', fontsize=12, color='white')
        ax.set_ylabel('Voltage (V)', fontsize=12, color='white')
        ax.grid(True, ls="--", alpha=0.3)
        ax.set_xlim(min(t1_us), max(t1_us))
        ax.legend(loc='upper right', framealpha=0.85)

        plt.title('AquaPulse AFE: Steady-State Transient Response (250.0 kHz Continuous Wave Drive)', fontsize=14, pad=15, fontweight='bold', color='#00ff88')
        fig.tight_layout()

        tran_path = os.path.join(docs_dir, "spice_transient.png")
        plt.savefig(tran_path, dpi=300)
        plt.close()
        print(f"✅ Saved corrected Transient waveform to {tran_path}")

if __name__ == "__main__":
    run_and_plot()

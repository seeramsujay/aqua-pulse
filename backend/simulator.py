"""
AQUAPULSE: Hardware-in-the-Loop (HIL) AUV Subsea Simulator
Emulates continuous real-time serial telemetry packets as if streaming from STM32H7 / ESP32-S3.
"""

import math
import time
import random
from typing import Dict, Any, Generator

class SubseaHardwareSimulator:
    def __init__(self):
        self.seq = 0
        self.auv_x = 100.0
        self.auv_depth = 80.0
        self.speed_mps = 2.5
        self.battery_v = 12.6
        self.auto_ping = True

    def step(self) -> Dict[str, Any]:
        self.seq += 1
        self.auv_x += self.speed_mps * 0.2
        if self.auv_x > 2000.0:
            self.auv_x = 50.0

        # Simulate ocean environment dynamics
        # Turbidity plume around x=800..1200
        dist_to_plume = abs(self.auv_x - 1000.0)
        if dist_to_plume < 300:
            turbidity = 250.0 * math.exp(-0.5 * (dist_to_plume / 100.0)**2) + random.uniform(5, 15)
        else:
            turbidity = random.uniform(5.0, 18.0)

        # Depth undulating trajectory
        self.auv_depth = 120.0 + 80.0 * math.sin(self.auv_x * 0.005) + random.uniform(-1, 1)

        # Temperature stratification (warmer surface, cold deep)
        temp = 22.0 - 0.015 * self.auv_depth + random.uniform(-0.2, 0.2)
        if temp < 2.0:
            temp = 2.0

        salinity = 35.0 + 0.002 * self.auv_depth + (0.5 if turbidity > 50 else 0)

        # Battery slow discharge
        self.battery_v = max(10.2, 12.6 - (self.seq * 0.0005))

        # Cognitive Channel Selection (TinyML Logic)
        if turbidity > 120.0 or self.auv_depth > 500.0:
            ch = 0 # 100 - 140 kHz
            f0, f1, tp = 100000.0, 140000.0, 1.2
            win = 2 # Blackman-Harris
        elif self.auv_depth > 150.0 or temp < 14.0:
            ch = 1 # 200 - 250 kHz
            f0, f1, tp = 200000.0, 250000.0, 0.8
            win = 1 # Hann
        else:
            ch = 2 # 400 - 480 kHz
            f0, f1, tp = 400000.0, 480000.0, 0.5
            win = 1 # Hann

        amp = 0.85 if self.battery_v > 11.2 else 0.65
        power_mw = 1800.0 * amp * (0.7 if ch == 0 else (0.85 if ch == 1 else 1.0))
        saved_pct = round((1.0 - (power_mw / 3500.0)) * 100.0, 1)

        # Mackenzie Sound Speed
        T, S, z = temp, salinity, self.auv_depth
        c = 1449.2 + 4.6 * T - 0.055 * T**2 + 0.00029 * T**3 + (1.34 - 0.010 * T) * (S - 35.0) + 0.0163 * z

        # Seabed profile simulation
        seabed_depth = 400.0 + 200.0 * math.sin(self.auv_x * 0.003) + 50.0 * math.cos(self.auv_x * 0.01)
        altitude = max(10.0, seabed_depth - self.auv_depth)
        travel_time_ms = (2.0 * altitude / c) * 1000.0
        snr = 24.0 - (turbidity * 0.03) - (altitude * 0.02) + (18.4 if ch < 2 else 15.0)

        echo_cls = 0 if snr > 10.0 else (1 if turbidity > 100 else 3)

        return {
            "type": "TELEMETRY",
            "seq": self.seq,
            "ts": time.time(),
            "ch": ch,
            "f0": f0,
            "f1": f1,
            "tp": tp,
            "win": win,
            "amp": round(amp, 2),
            "turb": round(turbidity, 1),
            "sal": round(salinity, 1),
            "temp": round(temp, 1),
            "depth": round(self.auv_depth, 1),
            "auv_x": round(self.auv_x, 1),
            "v_bat": round(self.battery_v, 2),
            "c_mps": round(c, 1),
            "p_mw": round(power_mw, 1),
            "saved_pct": saved_pct,
            "snr": round(snr, 1),
            "echo_cls": echo_cls,
            "est_bottom": round(seabed_depth, 1),
            "altitude_m": round(altitude, 1),
            "travel_time_ms": round(travel_time_ms, 2)
        }

simulator = SubseaHardwareSimulator()

# EOF: backend/simulator.py

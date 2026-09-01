"""
Unit Tests for Ocean Acoustic Wave Propagation Equations
Validates Mackenzie (1981), Thorp (1967), and Snell's Law numerical models.
"""

import math
import pytest
from rag_engine import rag_engine

def test_mackenzie_sound_speed_standard():
    # Standard surface seawater: T=15°C, S=35 PSU, z=0m -> ~1507.0 m/s
    c = rag_engine.compute_mackenzie_sound_speed(temp_c=15.0, salinity_psu=35.0, depth_m=0.0)
    assert 1500.0 < c < 1515.0, f"Expected ~1507 m/s, got {c}"

def test_mackenzie_sound_speed_deep_abyss():
    # Deep trench: T=2°C, S=35 PSU, z=4000m (High pressure increases c)
    c_deep = rag_engine.compute_mackenzie_sound_speed(temp_c=2.0, salinity_psu=35.0, depth_m=4000.0)
    assert c_deep > 1520.0, f"Expected deep pressure sound speed > 1520 m/s, got {c_deep}"

def test_thorp_attenuation_frequency_scaling():
    # Thorp absorption should monotonically increase with frequency
    alpha_100k = rag_engine.compute_thorp_attenuation(100.0)
    alpha_250k = rag_engine.compute_thorp_attenuation(250.0)
    alpha_450k = rag_engine.compute_thorp_attenuation(450.0)

    assert alpha_100k < alpha_250k < alpha_450k
    assert alpha_100k < 35.0
    assert alpha_450k > 50.0

def test_snell_refraction_angle():
    # Normal incidence (90 deg) should remain undeflected
    angle = rag_engine.calculate_snell_ray_trajectory(90.0, 1500.0, 1480.0)
    assert math.isclose(angle, 90.0, abs_tol=1e-3)

def test_rag_agent_evaluation():
    telemetry = {
        "turbidity_ntu": 350.0,
        "salinity_psu": 35.0,
        "temperature_c": 12.0,
        "depth_m": 450.0,
        "battery_v": 10.4
    }
    result = rag_engine.evaluate_mission_rationale(telemetry, chosen_channel=0)
    assert "NIOT-BATHY-01" in result["rule_id"] or "NIOT-ENERGY-04" in result["explanation"]
    assert result["compression_gain_db"] == 18.4

# EOF: backend/tests/test_physics.py

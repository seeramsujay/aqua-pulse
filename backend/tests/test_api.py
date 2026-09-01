"""
Integration Tests for FastAPI Ground Station Telemetry Server
"""

import pytest
from fastapi.testclient import TestClient
from server import app
from database import init_db

client = TestClient(app)

def test_api_status():
    response = client.get("/api/status")
    assert response.status_code == 200
    data = response.json()
    assert data["payload_connected"] is True
    assert "2.4 MSPS TRGO" in data["dma_rate"]
    assert "OPA1612" in data["analog_filter"]

def test_api_telemetry_latest():
    response = client.get("/api/telemetry/latest")
    assert response.status_code == 200
    data = response.json()
    assert "turb" in data or "turbidity_ntu" in data or "c_mps" in data

def test_api_rag_explain():
    payload = {
        "turbidity_ntu": 220.0,
        "depth_m": 150.0,
        "temperature_c": 16.5,
        "salinity_psu": 35.2,
        "battery_v": 12.1,
        "channel_id": 0
    }
    response = client.post("/api/rag/explain", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert "sound_speed_mps" in data

# EOF: backend/tests/test_api.py

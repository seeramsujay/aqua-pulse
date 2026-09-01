"""
AQUAPULSE: Ground Control Station Hub & Telemetry Ingestion Server
FastAPI + WebSockets + TimescaleDB/SQLite Persistence + Agentic RAG Service
"""

import asyncio
import json
import time
from typing import Dict, Any, List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    init_db, insert_telemetry, insert_ping, insert_echo, insert_sounding,
    log_mission_event, get_recent_telemetry, get_all_soundings
)
from rag_engine import rag_engine
from simulator import simulator

# Active WebSocket Clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                self.disconnect(connection)

manager = ConnectionManager()

background_sim_task: Optional[asyncio.Task] = None
is_streaming = True

async def telemetry_stream_worker():
    """Streams continuous real-time telemetry packets at 5 Hz (200 ms interval)"""
    while True:
        if is_streaming:
            data = simulator.step()
            
            insert_telemetry({
                "timestamp": data["ts"],
                "turbidity_ntu": data["turb"],
                "salinity_psu": data["sal"],
                "temperature_c": data["temp"],
                "depth_m": data["depth"],
                "battery_v": data["v_bat"],
                "sound_speed_mps": data["c_mps"]
            })

            ping_id = insert_ping({
                "timestamp": data["ts"],
                "mode": "rc-css",
                "channel_id": data["ch"],
                "f_start_hz": data["f0"],
                "f_end_hz": data["f1"],
                "duration_ms": data["tp"],
                "window_type": "Blackman-Harris" if data["win"] == 2 else "Hann",
                "amplitude_norm": data["amp"],
                "power_mw": data["p_mw"],
                "energy_saved_pct": data["saved_pct"]
            })

            insert_echo({
                "ping_id": ping_id,
                "timestamp": data["ts"],
                "travel_time_ms": data["travel_time_ms"],
                "calculated_depth_m": data["est_bottom"],
                "true_depth_m": data["est_bottom"],
                "snr_db": data["snr"],
                "classification": "Specular" if data["echo_cls"] == 0 else "Diffuse",
                "success": data["snr"] > 0
            })

            insert_sounding({
                "timestamp": data["ts"],
                "x": data["auv_x"],
                "true_depth": data["est_bottom"],
                "measured_depth": data["est_bottom"],
                "confidence": 0.96 if data["ch"] == 2 else 0.88,
                "frequency_khz": (data["f0"] + data["f1"]) / 2000.0
            })

            await manager.broadcast(json.dumps(data))
        await asyncio.sleep(0.2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    global background_sim_task
    background_sim_task = asyncio.create_task(telemetry_stream_worker())
    yield
    if background_sim_task:
        background_sim_task.cancel()

app = FastAPI(
    title="AQUAPULSE Ground Station Backend",
    version="2.0.0",
    description="SIH26058 MoES/NIOT Cognitive Acoustic Sonar Ground Station API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- REST Endpoints ---

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "AQUAPULSE Cyber-Physical Ground Station API",
        "version": "2.0.0",
        "protocols": ["REST", "WebSocket (ws://localhost:8000/ws/telemetry)"]
    }

@app.get("/api/status")
def get_system_status():
    return {
        "payload_connected": True,
        "mcu_target": "STM32H743ZI / ESP32-S3",
        "dma_rate": "2.4 MSPS TRGO (0.0% CPU)",
        "analog_filter": "OPA1612 4th-Order Butterworth (fc=450 kHz, -80 dB/dec)",
        "power_driver": "BD139/BD140 Push-Pull (1.5A peak, 50-ohm load)",
        "edge_ai": "INT8 Quantized MLP (<1.2ms inference)",
        "active_clients": len(manager.active_connections)
    }

@app.get("/api/telemetry/latest")
def get_latest_telemetry():
    recent = get_recent_telemetry(limit=1)
    if not recent:
        return simulator.step()
    return recent[0]

@app.get("/api/telemetry/history")
def get_telemetry_history(limit: int = Query(50, ge=1, le=500)):
    return get_recent_telemetry(limit=limit)

@app.get("/api/bathymetry")
def get_bathymetry_map():
    return get_all_soundings()

class RAGQueryRequest(BaseModel):
    turbidity_ntu: float
    depth_m: float
    temperature_c: float
    salinity_psu: float
    battery_v: float
    channel_id: int

@app.post("/api/rag/explain")
def query_rag_explanation(req: RAGQueryRequest):
    telemetry_dict = req.model_dump()
    explanation = rag_engine.evaluate_mission_rationale(telemetry_dict, req.channel_id)
    log_mission_event(
        event_type="CHANNEL_ADAPTATION",
        channel_id=req.channel_id,
        rationale=explanation["explanation"],
        rag_context=explanation["rule_id"]
    )
    return explanation

class ControlCommand(BaseModel):
    command: str
    value: Optional[Any] = None

@app.post("/api/control")
def send_control_command(cmd: ControlCommand):
    global is_streaming
    if cmd.command == "SET_STREAMING":
        is_streaming = bool(cmd.value)
        return {"status": "ok", "streaming": is_streaming}
    elif cmd.command == "PING":
        data = simulator.step()
        return {"status": "ok", "ping_emitted": data}
    return {"status": "unknown_command"}

# --- WebSocket Telemetry Stream ---

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                msg = json.loads(data_text)
                if msg.get("action") == "PING_TRIGGER":
                    ping_data = simulator.step()
                    await websocket.send_text(json.dumps(ping_data))
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)

# EOF: backend/server.py

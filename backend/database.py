"""
AQUAPULSE Telemetry & Mission Database Layer
Stores time-series ping records, sensor telemetry, return echoes, and bathymetry soundings.
Compatible with SQLite (local embedded) and TimescaleDB (production PostgreSQL extension).
"""

import sqlite3
import json
import time
from typing import List, Dict, Any, Optional
from pathlib import Path

DB_PATH = Path(__file__).parent / "aquapulse_telemetry.db"

def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Pings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS pings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL NOT NULL,
        mode TEXT NOT NULL,
        channel_id INTEGER NOT NULL,
        f_start_hz REAL NOT NULL,
        f_end_hz REAL NOT NULL,
        duration_ms REAL NOT NULL,
        window_type TEXT NOT NULL,
        amplitude_norm REAL NOT NULL,
        power_mw REAL NOT NULL,
        energy_saved_pct REAL NOT NULL
    )
    """)

    # 2. Sensor Telemetry Table (Time-Series)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS telemetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL NOT NULL,
        turbidity_ntu REAL NOT NULL,
        salinity_psu REAL NOT NULL,
        temperature_c REAL NOT NULL,
        depth_m REAL NOT NULL,
        battery_v REAL NOT NULL,
        sound_speed_mps REAL NOT NULL
    )
    """)

    # 3. Echo Returns Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS echoes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ping_id INTEGER,
        timestamp REAL NOT NULL,
        travel_time_ms REAL NOT NULL,
        calculated_depth_m REAL NOT NULL,
        true_depth_m REAL,
        snr_db REAL NOT NULL,
        classification TEXT NOT NULL,
        success INTEGER NOT NULL
    )
    """)

    # 4. Bathymetry Soundings Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS bathymetry (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL NOT NULL,
        x REAL NOT NULL,
        true_depth REAL NOT NULL,
        measured_depth REAL,
        confidence REAL NOT NULL,
        frequency_khz REAL NOT NULL
    )
    """)

    # 5. Mission Logs & RAG Explanations Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mission_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp REAL NOT NULL,
        event_type TEXT NOT NULL,
        channel_id INTEGER,
        rationale TEXT NOT NULL,
        rag_context TEXT
    )
    """)

    conn.commit()
    conn.close()

def insert_telemetry(data: Dict[str, Any]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    ts = data.get("timestamp", time.time())
    
    cursor.execute("""
        INSERT INTO telemetry (timestamp, turbidity_ntu, salinity_psu, temperature_c, depth_m, battery_v, sound_speed_mps)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        ts,
        data.get("turbidity_ntu", 0.0),
        data.get("salinity_psu", 35.0),
        data.get("temperature_c", 18.0),
        data.get("depth_m", 100.0),
        data.get("battery_v", 12.6),
        data.get("sound_speed_mps", 1500.0)
    ))
    row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return row_id

def insert_ping(data: Dict[str, Any]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    ts = data.get("timestamp", time.time())

    cursor.execute("""
        INSERT INTO pings (timestamp, mode, channel_id, f_start_hz, f_end_hz, duration_ms, window_type, amplitude_norm, power_mw, energy_saved_pct)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        ts,
        data.get("mode", "rc-css"),
        data.get("channel_id", 0),
        data.get("f_start_hz", 100000.0),
        data.get("f_end_hz", 140000.0),
        data.get("duration_ms", 1.2),
        data.get("window_type", "Blackman-Harris"),
        data.get("amplitude_norm", 0.8),
        data.get("power_mw", 1800.0),
        data.get("energy_saved_pct", 24.5)
    ))
    row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return row_id

def insert_echo(data: Dict[str, Any]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    ts = data.get("timestamp", time.time())

    cursor.execute("""
        INSERT INTO echoes (ping_id, timestamp, travel_time_ms, calculated_depth_m, true_depth_m, snr_db, classification, success)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data.get("ping_id"),
        ts,
        data.get("travel_time_ms", 0.0),
        data.get("calculated_depth_m", 0.0),
        data.get("true_depth_m"),
        data.get("snr_db", 0.0),
        data.get("classification", "Specular"),
        1 if data.get("success", True) else 0
    ))
    row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return row_id

def insert_sounding(data: Dict[str, Any]) -> int:
    conn = get_db_connection()
    cursor = conn.cursor()
    ts = data.get("timestamp", time.time())

    cursor.execute("""
        INSERT INTO bathymetry (timestamp, x, true_depth, measured_depth, confidence, frequency_khz)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        ts,
        data.get("x", 0.0),
        data.get("true_depth", 0.0),
        data.get("measured_depth"),
        data.get("confidence", 0.95),
        data.get("frequency_khz", 120.0)
    ))
    row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return row_id

def log_mission_event(event_type: str, channel_id: Optional[int], rationale: str, rag_context: Optional[str] = None):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO mission_logs (timestamp, event_type, channel_id, rationale, rag_context)
        VALUES (?, ?, ?, ?, ?)
    """, (time.time(), event_type, channel_id, rationale, rag_context))
    conn.commit()
    conn.close()

def get_recent_telemetry(limit: int = 50) -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM telemetry ORDER BY id DESC LIMIT ?", (limit,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows[::-1]

def get_all_soundings() -> List[Dict[str, Any]]:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM bathymetry ORDER BY x ASC")
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

# Auto initialize table on load
init_db()

# EOF: backend/database.py

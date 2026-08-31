# AQUAPULSE Telemetry & Agentic RAG Backend

FastAPI service and TimescaleDB time-series database for real-time telemetry ingestion and mission logging.

## Core Services
1. **Telemetry Ingestion Service (`server.py`):**
   - Reads 115200 Baud serial payload stream or WebSocket connection from MCU.
   - Decodes pulse parameter tuples $(f_0, B, T_p, \text{Window}, \text{Amp})$ and environmental sensor readings.
   - Pushes time-series logs to TimescaleDB.

2. **Oceanographic Agentic RAG Service:**
   - Ingests live parameter updates and evaluates oceanographic guidelines (e.g. MoES / NIOT bathymetry rules).
   - Generates real-time mission rationale explaining parameter shifts (e.g., carrier frequency downshifts due to turbidity spikes).

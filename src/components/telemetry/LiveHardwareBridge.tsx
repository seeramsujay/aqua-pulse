import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Wifi, WifiOff, ShieldCheck, Activity } from 'lucide-react';
import { ChirpBand, OceanLayer } from '../../types/sonar';

interface LiveHardwareBridgeProps {
  activeBand: ChirpBand;
  auvDepth: number;
  layers: OceanLayer[];
}

export interface TelemetryData {
  seq?: number;
  ts?: number;
  ch?: number;
  turb?: number;
  sal?: number;
  temp?: number;
  depth?: number;
  v_bat?: number;
  c_mps?: number;
  p_mw?: number;
  saved_pct?: number;
  snr?: number;
  echo_cls?: number;
  est_bottom?: number;
}

export const LiveHardwareBridge: React.FC<LiveHardwareBridgeProps> = ({
  activeBand,
  auvDepth,
  layers
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    turb: 14.2,
    sal: 35.1,
    temp: 17.8,
    depth: auvDepth,
    v_bat: 12.45,
    c_mps: 1512.4,
    p_mw: 1680.0,
    saved_pct: 32.5,
    snr: 21.8,
    echo_cls: 0
  });

  const [ragExplanation, setRagExplanation] = useState<string>(
    'MoES/NIOT Rule NIOT-BATHY-02 Active: Thermocline gradient detected. Applying Blackman-Harris windowing to suppress sidelobes across acoustic boundary layer.'
  );
  const [ruleId, setRuleId] = useState<string>('NIOT-BATHY-02');

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    const connectWs = () => {
      try {
        ws = new WebSocket('ws://localhost:8000/ws/telemetry');
        ws.onopen = () => {
          setIsConnected(true);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setTelemetry(data);
          } catch (e) {
            // ignore parse error
          }
        };
        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
        ws.onerror = () => {
          setIsConnected(false);
        };
      } catch (e) {
        setIsConnected(false);
      }
    };

    connectWs();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Update RAG rationale when depth, layers or telemetry shifts
  useEffect(() => {
    const layerCount = layers.length;
    if (auvDepth > 500 || (telemetry.turb || 0) > 100) {
      setRuleId('NIOT-BATHY-01');
      setRagExplanation(
        `NIOT-BATHY-01 Guideline: Deep/turbid water column attenuation across ${layerCount} stratification layers. Channel ${activeBand.name} downshifted carrier frequency to guarantee sub-bottom sounding without echo blackout.`
      );
    } else if (auvDepth > 150) {
      setRuleId('NIOT-BATHY-02');
      setRagExplanation(
        `NIOT-BATHY-02 Guideline: Negative thermocline sound velocity gradient detected. Stepped micro-chirping on ${activeBand.name} (${activeBand.fStart}-${activeBand.fEnd} kHz) prevents acoustic ray shadow zones.`
      );
    } else {
      setRuleId('NIOT-BATHY-03');
      setRagExplanation(
        `NIOT-BATHY-03 Guideline: Clear shallow profile allows high-definition wideband chirp spread spectrum on ${activeBand.name} for sub-centimeter bathymetric resolution.`
      );
    }
  }, [auvDepth, telemetry.turb, activeBand, layers]);

  return (
    <div className="instrument-panel p-3.5 flex flex-col gap-2.5">
      {/* Header */}
      <div className="flex items-center justify-between pb-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center space-x-2">
          <div
            className="flex items-center justify-center rounded"
            style={{
              background: '#12232D',
              border: '1px solid #20333D',
              padding: '6px',
            }}
          >
            <Cpu className="w-3.5 h-3.5" style={{ color: '#43C7D9' }} />
          </div>
          <div className="instrument-panel-title">
            Cognitive Edge AI &amp; Payload Bridge
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <span
              className="hud-chip"
              style={{
                background: 'rgba(99, 199, 154, 0.15)',
                borderColor: '#63C79A',
                color: '#63C79A',
              }}
            >
              <Wifi className="w-3 h-3 text-[#63C79A]" />
              <span>LIVE PAYLOAD LINK</span>
            </span>
          ) : (
            <span
              className="hud-chip"
              style={{
                background: '#12232D',
                borderColor: 'var(--border-default)',
                color: '#D9A441',
              }}
            >
              <WifiOff className="w-3 h-3 text-[#D9A441]" />
              <span>HIL SIMULATOR READY</span>
            </span>
          )}
        </div>
      </div>

      {/* Edge AI Telemetry Chips */}
      <div className="grid grid-cols-3 gap-2">
        <div className="telemetry-cell">
          <div className="telemetry-label">INT8 MLP LATENCY</div>
          <div className="telemetry-value text-sm" style={{ color: '#43C7D9' }}>0.42 ms</div>
          <div className="text-[9px] font-mono flex items-center space-x-1 mt-0.5" style={{ color: 'var(--text-dim)' }}>
            <Activity className="w-2.5 h-2.5 text-[#43C7D9]" />
            <span>Dual-Core Core 1</span>
          </div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-label">DMA CPU LOAD</div>
          <div className="telemetry-value text-sm" style={{ color: '#63C79A' }}>0.0%</div>
          <div className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-dim)' }}>2.4 MSPS TRGO DAC</div>
        </div>

        <div className="telemetry-cell">
          <div className="telemetry-label">ENERGY SAVED</div>
          <div className="telemetry-value text-sm flex items-center space-x-1" style={{ color: '#63C79A' }}>
            <Zap className="w-3 h-3 text-[#D9A441] inline" />
            <span>{(telemetry.saved_pct || 32.5).toFixed(1)}%</span>
          </div>
          <div className="text-[9px] font-mono mt-0.5" style={{ color: 'var(--text-dim)' }}>vs Static CW Ping</div>
        </div>
      </div>

      {/* Agentic RAG Mission Rationale Card */}
      <div
        className="rounded p-2.5 flex flex-col gap-1 text-xs"
        style={{
          background: 'var(--bg-inset)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex items-center justify-between text-[10px] font-mono" style={{ color: '#43C7D9' }}>
          <span className="flex items-center space-x-1.5 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>MOES / NIOT BATHYMETRIC RAG AGENT</span>
          </span>
          <span
            className="px-1.5 py-0.5 rounded font-mono text-[9px]"
            style={{
              background: '#12232D',
              border: '1px solid #20333D',
              color: 'var(--text-primary)',
            }}
          >
            {ruleId}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed font-sans mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {ragExplanation}
        </p>
      </div>
    </div>
  );
};

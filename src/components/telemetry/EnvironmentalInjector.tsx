import React from 'react';
import { Sliders, AlertTriangle, Battery, Droplets, Thermometer, Waves } from 'lucide-react';

interface EnvironmentalInjectorProps {
  turbidity: number;
  setTurbidity: (val: number) => void;
  temperature: number;
  setTemperature: (val: number) => void;
  salinity: number;
  setSalinity: (val: number) => void;
  batteryV: number;
  setBatteryV: (val: number) => void;
  onReset: () => void;
}

export const EnvironmentalInjector: React.FC<EnvironmentalInjectorProps> = ({
  turbidity,
  setTurbidity,
  temperature,
  setTemperature,
  salinity,
  setSalinity,
  batteryV,
  setBatteryV,
  onReset
}) => {
  return (
    <div className="instrument-panel p-3.5 flex flex-col gap-3">
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
            <Sliders className="w-3.5 h-3.5" style={{ color: '#43C7D9' }} />
          </div>
          <div className="instrument-panel-title">
            Environment &amp; Fault Injector
          </div>
        </div>
        <button
          onClick={onReset}
          className="hud-chip transition-colors cursor-pointer"
          style={{
            background: '#12232D',
            borderColor: 'var(--border-default)',
            color: 'var(--text-secondary)',
          }}
        >
          RESET NOMINAL
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        {/* Turbidity Slider */}
        <div className="flex flex-col gap-1 telemetry-cell">
          <div className="flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center space-x-1">
              <Droplets className="w-3 h-3 text-[#D9A441]" />
              <span className="telemetry-label">Turbidity</span>
            </span>
            <span className={turbidity > 150 ? 'font-bold' : ''} style={{ color: turbidity > 150 ? '#D9A441' : 'var(--text-primary)' }}>
              {turbidity.toFixed(0)} NTU
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="600"
            step="10"
            value={turbidity}
            onChange={(e) => setTurbidity(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded appearance-none cursor-pointer accent-[#D9A441]"
            style={{ background: '#12232D' }}
          />
        </div>

        {/* Temperature Slider */}
        <div className="flex flex-col gap-1 telemetry-cell">
          <div className="flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center space-x-1">
              <Thermometer className="w-3 h-3 text-[#43C7D9]" />
              <span className="telemetry-label">Temperature</span>
            </span>
            <span className={temperature < 10 ? 'font-bold' : ''} style={{ color: temperature < 10 ? '#43C7D9' : 'var(--text-primary)' }}>
              {temperature.toFixed(1)} °C
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="0.5"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded appearance-none cursor-pointer accent-[#43C7D9]"
            style={{ background: '#12232D' }}
          />
        </div>

        {/* Salinity Slider */}
        <div className="flex flex-col gap-1 telemetry-cell">
          <div className="flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center space-x-1">
              <Waves className="w-3 h-3 text-[#63C79A]" />
              <span className="telemetry-label">Salinity</span>
            </span>
            <span style={{ color: 'var(--text-primary)' }}>{salinity.toFixed(1)} PSU</span>
          </div>
          <input
            type="range"
            min="25"
            max="42"
            step="0.5"
            value={salinity}
            onChange={(e) => setSalinity(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded appearance-none cursor-pointer accent-[#63C79A]"
            style={{ background: '#12232D' }}
          />
        </div>

        {/* Battery Voltage Slider */}
        <div className="flex flex-col gap-1 telemetry-cell">
          <div className="flex items-center justify-between" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center space-x-1">
              <Battery className="w-3 h-3 text-[#63C79A]" />
              <span className="telemetry-label">Battery</span>
            </span>
            <span className={batteryV < 11.0 ? 'font-bold' : ''} style={{ color: batteryV < 11.0 ? '#D96B6B' : 'var(--text-primary)' }}>
              {batteryV.toFixed(2)} V
            </span>
          </div>
          <input
            type="range"
            min="9.5"
            max="14.8"
            step="0.1"
            value={batteryV}
            onChange={(e) => setBatteryV(parseFloat(e.target.value))}
            className="w-full h-1.5 rounded appearance-none cursor-pointer accent-[#63C79A]"
            style={{ background: '#12232D' }}
          />
        </div>
      </div>

      {/* Quick Trigger Presets */}
      <div className="flex items-center space-x-2 pt-1">
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>QUICK FAULTS:</span>
        <button
          onClick={() => {
            setTurbidity(380);
            setTemperature(8.5);
          }}
          className="hud-chip transition-colors flex items-center space-x-1 cursor-pointer"
          style={{
            background: '#12232D',
            borderColor: 'var(--border-default)',
            color: '#D9A441',
          }}
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>Turbidity Plume</span>
        </button>
        <button
          onClick={() => setBatteryV(10.2)}
          className="hud-chip transition-colors flex items-center space-x-1 cursor-pointer"
          style={{
            background: '#12232D',
            borderColor: 'var(--border-default)',
            color: '#D96B6B',
          }}
        >
          <Battery className="w-2.5 h-2.5" />
          <span>Low Battery</span>
        </button>
      </div>
    </div>
  );
};

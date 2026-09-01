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
    <div className="bg-slate-900/90 rounded-xl p-3.5 border border-slate-800 shadow-xl flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
            Environment & Fault Injector
          </h3>
        </div>
        <button
          onClick={onReset}
          className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
        >
          RESET NOMINAL
        </button>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono">
        {/* Turbidity Slider */}
        <div className="flex flex-col gap-1 bg-slate-950/70 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1">
              <Droplets className="w-3 h-3 text-amber-400" />
              <span>Turbidity</span>
            </span>
            <span className={turbidity > 150 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
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
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
          />
        </div>

        {/* Temperature Slider */}
        <div className="flex flex-col gap-1 bg-slate-950/70 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1">
              <Thermometer className="w-3 h-3 text-cyan-400" />
              <span>Temperature</span>
            </span>
            <span className={temperature < 10 ? 'text-cyan-400 font-bold' : 'text-slate-200'}>
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
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        {/* Salinity Slider */}
        <div className="flex flex-col gap-1 bg-slate-950/70 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1">
              <Waves className="w-3 h-3 text-blue-400" />
              <span>Salinity</span>
            </span>
            <span className="text-slate-200">{salinity.toFixed(1)} PSU</span>
          </div>
          <input
            type="range"
            min="25"
            max="42"
            step="0.5"
            value={salinity}
            onChange={(e) => setSalinity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-400"
          />
        </div>

        {/* Battery Voltage Slider */}
        <div className="flex flex-col gap-1 bg-slate-950/70 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center space-x-1">
              <Battery className="w-3 h-3 text-emerald-400" />
              <span>Battery</span>
            </span>
            <span className={batteryV < 11.0 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
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
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
          />
        </div>
      </div>

      {/* Quick Trigger Presets */}
      <div className="flex items-center space-x-2 pt-1">
        <span className="text-[10px] text-slate-500 font-mono">QUICK FAULTS:</span>
        <button
          onClick={() => {
            setTurbidity(380);
            setTemperature(8.5);
          }}
          className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/50 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 transition flex items-center space-x-1"
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          <span>Turbidity Plume</span>
        </button>
        <button
          onClick={() => setBatteryV(10.2)}
          className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950/50 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition flex items-center space-x-1"
        >
          <Battery className="w-2.5 h-2.5" />
          <span>Low Battery</span>
        </button>
      </div>
    </div>
  );
};

// EOF: src/components/telemetry/EnvironmentalInjector.tsx

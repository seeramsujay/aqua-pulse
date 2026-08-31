import React from 'react';
import { SonarMode, PresetScenario } from '../../types/sonar';
import { Radio, Layers, BookOpen, Play, Pause, Activity, Sparkles } from 'lucide-react';

interface NavbarProps {
  mode: SonarMode;
  setMode: (mode: SonarMode) => void;
  scenarios: PresetScenario[];
  activeScenario: PresetScenario;
  onSelectScenario: (scenario: PresetScenario) => void;
  isAutoPinging: boolean;
  setIsAutoPinging: (val: boolean) => void;
  onOpenTheory: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mode,
  setMode,
  scenarios,
  activeScenario,
  onSelectScenario,
  isAutoPinging,
  setIsAutoPinging,
  onOpenTheory
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 px-4 py-3 shadow-xl">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 shadow-lg shadow-cyan-500/20">
            <Radio className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500" />
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-wide text-slate-100 font-mono">
                AQUA<span className="text-cyan-400">PULSE</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                RC-CSS SONAR
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-sans">
              Rolling-Channel Chirp Spread Spectrum Acoustic Bathymetry Simulator
            </p>
          </div>
        </div>

        {/* Preset Scenario Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">Scenario:</span>
          <select
            value={activeScenario.id}
            onChange={(e) => {
              const selected = scenarios.find((s) => s.id === e.target.value);
              if (selected) onSelectScenario(selected);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500 font-mono transition"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Operating Modes Switcher */}
        <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('rc-css')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 ${
              mode === 'rc-css'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rolling-CSS</span>
          </button>

          <button
            onClick={() => setMode('traditional-cw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 ${
              mode === 'traditional-cw'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Single CW Tone</span>
          </button>

          <button
            onClick={() => setMode('side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 ${
              mode === 'side-by-side'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Comparison</span>
          </button>
        </div>

        {/* Action Controls: Auto-Ping & Theory Guide */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAutoPinging(!isAutoPinging)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center space-x-1.5 border ${
              isAutoPinging
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            {isAutoPinging ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isAutoPinging ? 'AUTO-SWEEP ON' : 'AUTO-SWEEP'}</span>
          </button>

          <button
            onClick={onOpenTheory}
            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-cyan-400 border border-slate-800 transition flex items-center space-x-1 text-xs font-mono"
            title="Acoustic Theory & US Navy Sonar Primer"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">ACOUSTICS GUIDE</span>
          </button>
        </div>
      </div>
    </header>
  );
};

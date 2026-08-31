import React, { useState, useEffect } from 'react';
import { SonarMode, PresetScenario } from '../../types/sonar';
import { Radio, Layers, BookOpen, Play, Pause, Activity, Sparkles, Wifi } from 'lucide-react';

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
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const modeButtons: { id: SonarMode; label: string; shortLabel: string; icon: React.ReactNode; activeClass: string }[] = [
    {
      id: 'rc-css',
      label: 'Rolling-CSS',
      shortLabel: 'RC-CSS',
      icon: <Sparkles className="w-3 h-3" />,
      activeClass: 'bg-hydro-500/20 text-hydro-300 border-hydro-500/60 shadow-glow-cyan-sm',
    },
    {
      id: 'traditional-cw',
      label: 'Single CW',
      shortLabel: 'CW',
      icon: <Activity className="w-3 h-3" />,
      activeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/60 shadow-[0_0_8px_rgba(239,68,68,0.35)]',
    },
    {
      id: 'side-by-side',
      label: 'Compare',
      shortLabel: 'VS',
      icon: <Layers className="w-3 h-3" />,
      activeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/60 shadow-[0_0_8px_rgba(139,92,246,0.35)]',
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] shadow-xl"
      style={{ background: 'rgba(3, 7, 18, 0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>

      {/* Top line — thin accent */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-hydro-500/60 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">

        {/* ── Brand ── */}
        <div className="flex items-center gap-3">
          {/* Sonar Logo */}
          <div className="relative flex items-center justify-center w-9 h-9 flex-shrink-0">
            {/* Animated sonar rings */}
            <span className="sonar-logo-ring" />
            <span className="sonar-logo-ring" />
            <div className="relative z-10 flex items-center justify-center w-9 h-9 rounded-xl bg-hydro-900/60 border border-hydro-500/40">
              <Radio className="w-4 h-4 text-hydro-300" />
              {/* Active ping dot */}
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-hydro-300 opacity-70" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-hydro-400" />
              </span>
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-wider font-mono">
                <span className="text-slate-100">AQUA</span>
                <span className="text-gradient-cyan">PULSE</span>
              </h1>
              <span className="hud-chip bg-hydro-900/70 text-hydro-300 border-hydro-700/60">
                RC-CSS SONAR
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-sans tracking-wide mt-0.5 hidden sm:block">
              Rolling-Channel Chirp Spread Spectrum · Acoustic Bathymetry
            </p>
          </div>
        </div>

        {/* ── Scenario Selector ── */}
        <div className="flex items-center gap-2">
          <span className="telemetry-label hidden md:inline">Mission:</span>
          <select
            id="scenario-select"
            value={activeScenario.id}
            onChange={(e) => {
              const selected = scenarios.find((s) => s.id === e.target.value);
              if (selected) onSelectScenario(selected);
            }}
            className="font-mono text-[11px] rounded-lg px-2.5 py-1.5 border transition-all focus:outline-none focus:border-hydro-500/60"
            style={{
              background: 'rgba(0,0,0,0.5)',
              borderColor: 'rgba(255,255,255,0.1)',
              color: '#cbd5e1',
            }}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* ── Mode Switcher ── */}
        <div className="flex items-center gap-1 p-1 rounded-xl border border-white/[0.07]"
          style={{ background: 'rgba(0,0,0,0.45)' }}>
          {modeButtons.map(({ id, label, shortLabel, icon, activeClass }) => (
            <button
              key={id}
              id={`mode-${id}`}
              onClick={() => setMode(id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all duration-200 border ${
                mode === id
                  ? activeClass
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
              <span className="sm:hidden">{shortLabel}</span>
            </button>
          ))}
        </div>

        {/* ── Actions & Status ── */}
        <div className="flex items-center gap-2">
          {/* Auto-sweep toggle */}
          <button
            id="auto-sweep-btn"
            onClick={() => setIsAutoPinging(!isAutoPinging)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-semibold transition-all duration-200 border ${
              isAutoPinging
                ? 'text-emerald-300 border-emerald-500/50 bg-emerald-950/50 shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                : 'text-slate-500 border-white/[0.08] bg-black/30 hover:text-slate-300 hover:border-white/15'
            }`}
          >
            {isAutoPinging ? (
              <><Pause className="w-3 h-3" /><span className="hidden sm:inline">SWEEPING</span><span className="sm:hidden">ON</span></>
            ) : (
              <><Play className="w-3 h-3" /><span className="hidden sm:inline">AUTO-SWEEP</span><span className="sm:hidden">PING</span></>
            )}
          </button>

          {/* Theory guide */}
          <button
            id="theory-btn"
            onClick={onOpenTheory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-semibold text-slate-400 border border-white/[0.08] bg-black/30 hover:text-hydro-300 hover:border-hydro-500/40 transition-all duration-200"
            title="Acoustic Theory Reference"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">THEORY GUIDE</span>
          </button>

          {/* Live clock / status */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.06] font-mono text-[10px] text-slate-500"
            style={{ background: 'rgba(0,0,0,0.35)' }}>
            <Wifi className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400/80">ONLINE</span>
            <span className="text-white/20">|</span>
            <span>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

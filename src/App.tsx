import { useState, useEffect, useCallback } from 'react';
import { Submersible, EchoReturn, BathymetryPoint, SonarMode, PresetScenario, ChirpBand } from './types/sonar';
import { STANDARD_CHIRP_BANDS } from './physics/oceanAcoustics';
import { SCENARIO_PRESETS } from './physics/presets';
import { Navbar } from './components/common/Navbar';
import { OceanCanvas } from './components/simulations/OceanCanvas';
import { ComparisonView } from './components/simulations/ComparisonView';
import { BathymetryMap } from './components/simulations/BathymetryMap';
import { SoundSpeedProfile } from './components/telemetry/SoundSpeedProfile';
import { SpectrogramWaterfall } from './components/telemetry/SpectrogramWaterfall';
import { PhysicsPanel } from './components/telemetry/PhysicsPanel';
import { AcousticTheoryModal } from './components/common/AcousticTheoryModal';
import { Compass, Navigation, Signal } from 'lucide-react';

export function App() {
  const [scenarios] = useState<PresetScenario[]>(SCENARIO_PRESETS);
  const [activeScenario, setActiveScenario] = useState<PresetScenario>(SCENARIO_PRESETS[0]);
  const [mode, setMode] = useState<SonarMode>('rc-css');
  const [bands] = useState<ChirpBand[]>(STANDARD_CHIRP_BANDS);
  const [activeBandIndex, setActiveBandIndex] = useState<number>(0);
  const [autoRoll, setAutoRoll] = useState<boolean>(true);
  const [isAutoPinging, setIsAutoPinging] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [pingFlash, setPingFlash] = useState(false);

  const [submersible, setSubmersible] = useState<Submersible>({
    x: 450,
    depth: activeScenario.auvDepth,
    beamSpreadDeg: 60,
    pingAngleDeg: 90,
    pingActive: false,
    status: 'idle',
    activeBandIndex: 0
  });

  const [echoes, setEchoes] = useState<EchoReturn[]>([]);
  const [soundings, setSoundings] = useState<BathymetryPoint[]>([]);

  const activeBand = bands[activeBandIndex] || bands[0];

  const handleSelectScenario = (scenario: PresetScenario) => {
    setActiveScenario(scenario);
    setSubmersible((prev) => ({ ...prev, depth: scenario.auvDepth, x: 450 }));
    setSoundings([]);
    setEchoes([]);
  };

  const handleEchoDetected = useCallback(
    (echo: EchoReturn) => {
      setEchoes((prev) => [...prev.slice(-40), echo]);
      setPingFlash(true);
      setTimeout(() => setPingFlash(false), 300);
      if (autoRoll && mode === 'rc-css') {
        setActiveBandIndex((prev) => (prev + 1) % bands.length);
      }
    },
    [autoRoll, mode, bands.length]
  );

  const handleSoundingPoint = useCallback((point: BathymetryPoint) => {
    setSoundings((prev) => {
      const filtered = prev.filter((p) => Math.abs(p.x - point.x) > 15);
      return [...filtered, point];
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSubmersible((prev) => ({ ...prev, pingActive: true }));
      } else if (e.code === 'ArrowRight') {
        setSubmersible((prev) => ({ ...prev, x: Math.min(1900, prev.x + 30) }));
      } else if (e.code === 'ArrowLeft') {
        setSubmersible((prev) => ({ ...prev, x: Math.max(100, prev.x - 30) }));
      } else if (e.code === 'ArrowUp') {
        setSubmersible((prev) => ({ ...prev, depth: Math.max(30, prev.depth - 25) }));
      } else if (e.code === 'ArrowDown') {
        setSubmersible((prev) => ({ ...prev, depth: Math.min(1300, prev.depth + 25) }));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans" style={{ background: '#030712' }}>
      {/* Navigation */}
      <Navbar
        mode={mode}
        setMode={setMode}
        scenarios={scenarios}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        isAutoPinging={isAutoPinging}
        setIsAutoPinging={setIsAutoPinging}
        onOpenTheory={() => setIsTheoryOpen(true)}
      />

      {/* Auto-sweep status ribbon */}
      {isAutoPinging && (
        <div className="bg-emerald-950/60 border-b border-emerald-800/50 px-4 py-1 flex items-center justify-center gap-2">
          <span className="status-dot text-emerald-400" style={{ backgroundColor: '#34d399' }} />
          <span className="font-mono text-[10px] text-emerald-300 tracking-widest uppercase">
            Auto-Sweep Active — RC-CSS Rolling Channel Transmission
          </span>
        </div>
      )}

      {/* Main layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">

        {/* Mission Header Card */}
        <div className="glass-panel px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-hydro-900/50 border border-hydro-700/40 text-hydro-300 flex-shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-sm font-bold text-slate-100 font-mono">{activeScenario.name}</h2>
                <span className="hud-chip bg-slate-900/80 text-slate-400 border-slate-700/60">{activeScenario.subtitle}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-2xl leading-relaxed">{activeScenario.description}</p>
            </div>
          </div>

          {/* AUV Telemetry strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.07] font-mono text-[10px]"
              style={{ background: 'rgba(0,0,0,0.45)' }}>
              <Navigation className="w-3 h-3 text-hydro-400" />
              <span className="text-slate-500">X:</span>
              <span className={`text-hydro-300 font-bold transition-all ${pingFlash ? 'text-white' : ''}`}>
                {submersible.x.toFixed(0)}m
              </span>
              <span className="text-white/20 mx-1">|</span>
              <span className="text-slate-500">Z:</span>
              <span className={`text-amber-300 font-bold transition-all ${pingFlash ? 'text-white' : ''}`}>
                {submersible.depth.toFixed(0)}m
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.07] font-mono text-[10px]"
              style={{ background: 'rgba(0,0,0,0.45)' }}>
              <Signal className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-500">Mode:</span>
              <span className={`font-bold ml-1 ${mode === 'rc-css' ? 'text-hydro-300' : mode === 'traditional-cw' ? 'text-rose-400' : 'text-violet-400'}`}>
                {mode === 'rc-css' ? 'RC-CSS' : mode === 'traditional-cw' ? 'CW TONE' : 'COMPARE'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Panel Area */}
        {mode === 'side-by-side' ? (
          <ComparisonView onSelectMode={(selected) => setMode(selected)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Left: Ocean Canvas + Bathymetry */}
            <div className="lg:col-span-8 flex flex-col gap-4 min-h-[560px]">
              <div className="flex-1 w-full min-h-[460px]">
                <OceanCanvas
                  submersible={submersible}
                  setSubmersible={setSubmersible}
                  layers={activeScenario.layers}
                  terrainType={activeScenario.terrainType}
                  mode={mode}
                  activeBand={activeBand}
                  onEchoDetected={handleEchoDetected}
                  onSoundingPoint={handleSoundingPoint}
                  isAutoPinging={isAutoPinging}
                />
              </div>
              <div className="h-[260px]">
                <BathymetryMap
                  soundings={soundings}
                  terrainType={activeScenario.terrainType}
                  onClear={() => setSoundings([])}
                />
              </div>
            </div>

            {/* Right: Telemetry column */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="h-[300px]">
                <SoundSpeedProfile layers={activeScenario.layers} auvDepth={submersible.depth} />
              </div>
              <div className="h-[250px]">
                <SpectrogramWaterfall
                  echoes={echoes}
                  activeBand={activeBand}
                  mode={mode}
                  isPinging={submersible.pingActive}
                />
              </div>
              <div className="flex-1 min-h-[220px]">
                <PhysicsPanel
                  activeBand={activeBand}
                  setActiveBand={(band) => {
                    const idx = bands.findIndex((b) => b.id === band.id);
                    if (idx !== -1) setActiveBandIndex(idx);
                  }}
                  bands={bands}
                  mode={mode}
                  submersible={submersible}
                  layers={activeScenario.layers}
                  autoRoll={autoRoll}
                  setAutoRoll={setAutoRoll}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] px-4 py-2.5 font-mono text-[10px] text-slate-600 flex flex-wrap items-center justify-between gap-2"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-3">
          <span className="text-slate-500">AquaPulse Cyber-Physical Suite</span>
          <span className="text-white/15">·</span>
          <span className="text-hydro-500/70">RC-CSS Acoustic Bathymetry Engine v2.0.0</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">Space</kbd>
            <span>Ping</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">↑↓←→</kbd>
            <span>Steer AUV</span>
          </span>
          <span className="text-slate-700">· Drag AUV on canvas</span>
        </div>
      </footer>

      <AcousticTheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}

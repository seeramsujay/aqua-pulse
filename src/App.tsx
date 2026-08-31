import React, { useState, useEffect, useCallback } from 'react';
import { Submersible, EchoReturn, BathymetryPoint, SonarMode, PresetScenario, ChirpBand } from './types/sonar';
import { STANDARD_CHIRP_BANDS, DEFAULT_OCEAN_LAYERS } from './physics/oceanAcoustics';
import { SCENARIO_PRESETS } from './physics/presets';
import { Navbar } from './components/Navbar';
import { OceanCanvas } from './components/OceanCanvas';
import { SoundSpeedProfile } from './components/SoundSpeedProfile';
import { SpectrogramWaterfall } from './components/SpectrogramWaterfall';
import { BathymetryMap } from './components/BathymetryMap';
import { PhysicsPanel } from './components/PhysicsPanel';
import { ComparisonView } from './components/ComparisonView';
import { AcousticTheoryModal } from './components/AcousticTheoryModal';
import { Waves, Sparkles, Compass, HelpCircle } from 'lucide-react';

export function App() {
  const [scenarios] = useState<PresetScenario[]>(SCENARIO_PRESETS);
  const [activeScenario, setActiveScenario] = useState<PresetScenario>(SCENARIO_PRESETS[0]);
  const [mode, setMode] = useState<SonarMode>('rc-css');
  const [bands] = useState<ChirpBand[]>(STANDARD_CHIRP_BANDS);
  const [activeBandIndex, setActiveBandIndex] = useState<number>(0);
  const [autoRoll, setAutoRoll] = useState<boolean>(true);
  const [isAutoPinging, setIsAutoPinging] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

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

  // Scenario switch handler
  const handleSelectScenario = (scenario: PresetScenario) => {
    setActiveScenario(scenario);
    setSubmersible((prev) => ({
      ...prev,
      depth: scenario.auvDepth,
      x: 450
    }));
    setSoundings([]);
    setEchoes([]);
  };

  // Echo and sounding handlers
  const handleEchoDetected = useCallback(
    (echo: EchoReturn) => {
      setEchoes((prev) => [...prev.slice(-40), echo]);

      // If auto-roll is enabled and in RC-CSS mode, roll to next band
      if (autoRoll && mode === 'rc-css') {
        setActiveBandIndex((prev) => (prev + 1) % bands.length);
      }
    },
    [autoRoll, mode, bands.length]
  );

  const handleSoundingPoint = useCallback((point: BathymetryPoint) => {
    setSoundings((prev) => {
      // Deduplicate close points
      const filtered = prev.filter((p) => Math.abs(p.x - point.x) > 15);
      return [...filtered, point];
    });
  }, []);

  // Keyboard shortcut listener (Space = ping, Arrows = steer AUV)
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
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
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

      {/* Main Operational Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Scenario Mission Header */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-100">{activeScenario.name}</h2>
                <span className="text-xs text-slate-400 font-mono">[{activeScenario.subtitle}]</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">{activeScenario.description}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <span className="text-slate-400">AUV Position:</span>
            <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
              X: {submersible.x.toFixed(0)}m | Z: {submersible.depth.toFixed(0)}m
            </span>
          </div>
        </div>

        {/* View Switcher: Side-by-Side Comparison OR Real-Time Viewport Grid */}
        {mode === 'side-by-side' ? (
          <ComparisonView onSelectMode={(selected) => setMode(selected)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Left Column: 2D Ocean Simulation Canvas Viewport (7 Cols) */}
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

              {/* Bottom Reconstructed Bathymetry Map */}
              <div className="h-[260px]">
                <BathymetryMap
                  soundings={soundings}
                  terrainType={activeScenario.terrainType}
                  onClear={() => setSoundings([])}
                />
              </div>
            </div>

            {/* Right Column: Telemetry, SSP & Spectrogram Waterfall (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Sound Speed Profile (SSP) Chart */}
              <div className="h-[300px]">
                <SoundSpeedProfile layers={activeScenario.layers} auvDepth={submersible.depth} />
              </div>

              {/* Spectrogram & De-Chirp Waterfall */}
              <div className="h-[250px]">
                <SpectrogramWaterfall
                  echoes={echoes}
                  activeBand={activeBand}
                  mode={mode}
                  isPinging={submersible.pingActive}
                />
              </div>

              {/* Acoustic Physics & Stepped Rolling Controller */}
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

      {/* Footer Status Bar */}
      <footer className="bg-slate-950 border-t border-slate-900 px-4 py-2.5 text-[11px] text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span>AquaPulse Acoustic Suite v1.0.0</span>
          <span>•</span>
          <span className="text-cyan-400/80">Stratified Snell Ray Tracing Engine</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-400">
          <span>
            Controls: <kbd className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded text-[10px]">Space</kbd> Ping |{' '}
            <kbd className="bg-slate-900 text-slate-300 px-1 py-0.5 rounded text-[10px]">Arrow Keys</kbd> Steer AUV | Drag AUV Icon
          </span>
        </div>
      </footer>

      {/* Acoustic Theory & Navy Documentation Modal */}
      <AcousticTheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}

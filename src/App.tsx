import { useState, useEffect, useCallback } from 'react';
import { Submersible, EchoReturn, BathymetryPoint, SonarMode, PresetScenario, ChirpBand } from './types/sonar';
import { STANDARD_CHIRP_BANDS } from './physics/oceanAcoustics';
import { SCENARIO_PRESETS } from './physics/presets';
import { Navbar } from './components/common/Navbar';
import { BootSequence } from './components/common/BootSequence';
import { OceanCanvas } from './components/simulations/OceanCanvas';
import { ComparisonView } from './components/simulations/ComparisonView';
import { BathymetryMap } from './components/simulations/BathymetryMap';
import { SoundSpeedProfile } from './components/telemetry/SoundSpeedProfile';
import { SpectrogramWaterfall } from './components/telemetry/SpectrogramWaterfall';
import { PhysicsPanel } from './components/telemetry/PhysicsPanel';
import { PulseCompressionChart } from './components/telemetry/PulseCompressionChart';
import { AbsorptionCurve } from './components/telemetry/AbsorptionCurve';
import { MissionLog, MissionEvent } from './components/telemetry/MissionLog';
import { LiveHardwareBridge } from './components/telemetry/LiveHardwareBridge';
import { EnvironmentalInjector } from './components/telemetry/EnvironmentalInjector';
import { AcousticTheoryModal } from './components/common/AcousticTheoryModal';
import { RagAssistantModal } from './components/common/RagAssistantModal';
import { sonarAudio } from './utils/audioSonar';
import { Compass, Navigation, Signal, Activity, Cpu, Terminal, AlertTriangle } from 'lucide-react';

export function App() {
  const [isBooting, setIsBooting] = useState<boolean>(true);
  const [scenarios] = useState<PresetScenario[]>(SCENARIO_PRESETS);
  const [activeScenario, setActiveScenario] = useState<PresetScenario>(SCENARIO_PRESETS[0]);
  const [mode, setMode] = useState<SonarMode>('rc-css');
  const [bands] = useState<ChirpBand[]>(STANDARD_CHIRP_BANDS);
  const [activeBandIndex, setActiveBandIndex] = useState<number>(0);
  const [autoRoll, setAutoRoll] = useState<boolean>(true);
  const [isAutoPinging, setIsAutoPinging] = useState<boolean>(false);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isRagOpen, setIsRagOpen] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [pingFlash, setPingFlash] = useState(false);
  const [telemetryTab, setTelemetryTab] = useState<'SIGNAL' | 'DSP' | 'FAULT' | 'LOG'>('SIGNAL');

  // Environmental Knobs State
  const [turbidity, setTurbidity] = useState<number>(12.0);
  const [temperature, setTemperature] = useState<number>(18.0);
  const [salinity, setSalinity] = useState<number>(35.0);
  const [batteryV, setBatteryV] = useState<number>(12.6);

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
  const [missionEvents, setMissionEvents] = useState<MissionEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'SYSTEM',
      title: 'AQUAPULSE Ground Station Online',
      details: 'Connected to MoES / NIOT Autonomous Hydrographic Telemetry Payload.'
    }
  ]);

  const activeBand = bands[activeBandIndex] || bands[0];

  const addMissionEvent = useCallback((event: Omit<MissionEvent, 'id' | 'timestamp'>) => {
    const newEvent: MissionEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };
    setMissionEvents((prev) => [...prev.slice(-35), newEvent]);
  }, []);

  const handleSelectScenario = (scenario: PresetScenario) => {
    setActiveScenario(scenario);
    setSubmersible((prev) => ({ ...prev, depth: scenario.auvDepth, x: 450 }));
    setSoundings([]);
    setEchoes([]);
    addMissionEvent({
      type: 'SYSTEM',
      title: `Scenario Loaded: ${scenario.name}`,
      details: `Profile: ${scenario.subtitle}. AUV depth set to ${scenario.auvDepth}m.`
    });
  };

  const handleResetEnvironment = () => {
    setTurbidity(12.0);
    setTemperature(18.0);
    setSalinity(35.0);
    setBatteryV(12.6);
    addMissionEvent({
      type: 'SYSTEM',
      title: 'Environmental Injector Reset',
      details: 'Restored nominal oceanographic baseline parameters.'
    });
  };

  useEffect(() => {
    if (autoRoll && mode === 'rc-css') {
      const timer = setInterval(() => {
        setActiveBandIndex((prev) => {
          const next = (prev + 1) % bands.length;
          return next;
        });
      }, 1400);
      return () => clearInterval(timer);
    }
  }, [autoRoll, mode, bands.length]);

  useEffect(() => {
    setSubmersible((prev) => ({ ...prev, activeBandIndex }));
  }, [activeBandIndex]);

  const triggerPingWithAudio = useCallback(() => {
    if (isAudioEnabled) {
      sonarAudio.playChirp(activeBand.fStart, activeBand.fEnd, activeBand.durationMs);
    }
    setSubmersible((prev) => ({ ...prev, pingActive: true }));
    setPingFlash(true);
    setTimeout(() => setPingFlash(false), 200);
    addMissionEvent({
      type: 'PING',
      title: `Pulse Emitted (${activeBand.label || activeBand.name})`,
      details: `Carrier ${activeBand.fCenter} kHz · Beam ${submersible.beamSpreadDeg}° · Depth ${submersible.depth.toFixed(1)}m`
    });
  }, [isAudioEnabled, activeBand, submersible.beamSpreadDeg, submersible.depth, addMissionEvent]);

  useEffect(() => {
    if (!isAutoPinging) return;
    const interval = setInterval(() => {
      triggerPingWithAudio();
    }, 1100);
    return () => clearInterval(interval);
  }, [isAutoPinging, triggerPingWithAudio]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerPingWithAudio();
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
  }, [triggerPingWithAudio]);

  const handleEchoDetected = useCallback(
    (returns: EchoReturn[] | EchoReturn) => {
      const returnArray = Array.isArray(returns) ? returns : [returns];
      setEchoes((prev) => [...prev.slice(-40), ...returnArray]);
      setPingFlash(true);
      setTimeout(() => setPingFlash(false), 300);

      if (returnArray.length > 0) {
        const top = returnArray.reduce((max, r) => (r.snrDb > max.snrDb ? r : max), returnArray[0]);
        if (top.snrDb > 8) {
          if (isAudioEnabled) {
            sonarAudio.playEchoReturn(top.rangeM * 0.5, top.snrDb);
          }
          addMissionEvent({
            type: 'ECHO',
            title: `Bottom Acoustic Return Locked (${top.targetType?.toUpperCase() || 'SEABED'})`,
            details: `Range: ${top.rangeM.toFixed(1)}m · SNR: +${top.snrDb.toFixed(1)} dB · Doppler: ${top.dopplerShiftHz >= 0 ? '+' : ''}${top.dopplerShiftHz.toFixed(1)} Hz`
          });
        }
      }
    },
    [addMissionEvent, isAudioEnabled]
  );

  const handleSoundingPoint = useCallback((point: BathymetryPoint) => {
    setSoundings((prev) => {
      const filtered = prev.filter((p) => Math.abs(p.x - point.x) > 15);
      return [...filtered, point];
    });
  }, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans" style={{ background: '#020612' }}>
      {/* Boot Sequence Overlay */}
      {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}

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
        onOpenBoot={() => setIsBooting(true)}
        onOpenRag={() => setIsRagOpen(true)}
        isAudioEnabled={isAudioEnabled}
        setIsAudioEnabled={setIsAudioEnabled}
      />

      {/* Auto-sweep status ribbon */}
      {isAutoPinging && (
        <div className="bg-emerald-950/60 border-b border-emerald-800/50 px-4 py-1 flex items-center justify-center gap-2">
          <span className="status-dot text-emerald-400" style={{ backgroundColor: '#34d399' }} />
          <span className="font-mono text-[10px] text-emerald-300 tracking-widest uppercase">
            Auto-Sweep Active — RC-CSS Stepped Multi-Tone Transmission
          </span>
        </div>
      )}

      {/* Main layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4">
        {/* Mission Header Card */}
        <div className="glass-panel px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-700/40 text-cyan-300 flex-shrink-0">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-sm font-bold text-slate-100 font-mono">{activeScenario.name}</h2>
                <span className="hud-chip bg-slate-900/80 text-slate-400 border-slate-700/60">
                  {activeScenario.subtitle}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-2xl leading-relaxed font-sans">
                {activeScenario.description}
              </p>
            </div>
          </div>

          {/* AUV Telemetry strip */}
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.07] font-mono text-[10px]"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              <Navigation className="w-3 h-3 text-cyan-400" />
              <span className="text-slate-500">POS X:</span>
              <span className={`text-cyan-300 font-bold transition-all ${pingFlash ? 'text-white' : ''}`}>
                {submersible.x.toFixed(0)}m
              </span>
              <span className="text-white/20 mx-1">|</span>
              <span className="text-slate-500">DEPTH:</span>
              <span className={`text-amber-300 font-bold transition-all ${pingFlash ? 'text-white' : ''}`}>
                {submersible.depth.toFixed(0)}m
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/[0.07] font-mono text-[10px]"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              <Signal className="w-3 h-3 text-emerald-400" />
              <span className="text-slate-500">PROTOCOL:</span>
              <span
                className={`font-bold ml-1 ${
                  mode === 'rc-css'
                    ? 'text-cyan-300'
                    : mode === 'traditional-cw'
                    ? 'text-rose-400'
                    : 'text-violet-400'
                }`}
              >
                {mode === 'rc-css' ? 'RC-CSS (Agile)' : mode === 'traditional-cw' ? 'CW (Fixed 450k)' : 'BENCHMARK'}
              </span>
            </div>
          </div>
        </div>

        {/* Main Panel Area */}
        {mode === 'side-by-side' ? (
          <ComparisonView onSelectMode={(selected) => setMode(selected)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
            {/* Left: Ocean Canvas + Bathymetry Viewport */}
            <div className="lg:col-span-8 flex flex-col gap-4 min-h-[580px]">
              <div className="flex-1 w-full min-h-[480px]">
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
              <div className="h-[250px]">
                <BathymetryMap
                  soundings={soundings}
                  terrainType={activeScenario.terrainType}
                  onClear={() => setSoundings([])}
                />
              </div>
            </div>

            {/* Right: Tabbed Telemetry & DSP Analysis Column */}
            <div className="lg:col-span-4 flex flex-col gap-3">
              {/* Telemetry Tab Switcher Bar */}
              <div
                className="flex items-center justify-between p-1 rounded-xl border border-white/[0.08]"
                style={{ background: 'rgba(2, 6, 18, 0.85)' }}
              >
                <button
                  onClick={() => setTelemetryTab('SIGNAL')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider transition-all ${
                    telemetryTab === 'SIGNAL'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Activity className="w-3 h-3" />
                  <span>SIGNAL</span>
                </button>

                <button
                  onClick={() => setTelemetryTab('DSP')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider transition-all ${
                    telemetryTab === 'DSP'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Cpu className="w-3 h-3" />
                  <span>DSP &amp; PHYSICS</span>
                </button>

                <button
                  onClick={() => setTelemetryTab('FAULT')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider transition-all ${
                    telemetryTab === 'FAULT'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50 shadow-[0_0_10px_rgba(244,63,94,0.2)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>ENVIRONMENT</span>
                </button>

                <button
                  onClick={() => setTelemetryTab('LOG')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider transition-all ${
                    telemetryTab === 'LOG'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  <span>LOG</span>
                </button>
              </div>

              {/* Tab Contents */}
              {telemetryTab === 'SIGNAL' && (
                <div className="flex flex-col gap-3 flex-1">
                  <div className="h-[280px]">
                    <SoundSpeedProfile layers={activeScenario.layers} auvDepth={submersible.depth} />
                  </div>
                  <div className="h-[240px]">
                    <SpectrogramWaterfall
                      echoes={echoes}
                      activeBand={activeBand}
                      mode={mode}
                      isPinging={submersible.pingActive}
                    />
                  </div>
                  <LiveHardwareBridge
                    activeBand={activeBand}
                    auvDepth={submersible.depth}
                    layers={activeScenario.layers}
                  />
                  <div className="flex-1 min-h-[200px]">
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
              )}

              {telemetryTab === 'DSP' && (
                <div className="flex flex-col gap-3 flex-1">
                  <div className="h-[270px]">
                    <PulseCompressionChart
                      activeBand={activeBand}
                      mode={mode}
                      isPinging={submersible.pingActive}
                    />
                  </div>
                  <div className="h-[240px]">
                    <AbsorptionCurve
                      activeBand={activeBand}
                      mode={mode}
                      bands={bands}
                    />
                  </div>
                  <LiveHardwareBridge
                    activeBand={activeBand}
                    auvDepth={submersible.depth}
                    layers={activeScenario.layers}
                  />
                  <div className="flex-1 min-h-[200px]">
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
              )}

              {telemetryTab === 'FAULT' && (
                <div className="flex flex-col gap-3 flex-1">
                  <EnvironmentalInjector
                    turbidity={turbidity}
                    setTurbidity={setTurbidity}
                    temperature={temperature}
                    setTemperature={setTemperature}
                    salinity={salinity}
                    setSalinity={setSalinity}
                    batteryV={batteryV}
                    setBatteryV={setBatteryV}
                    onReset={handleResetEnvironment}
                  />
                  <LiveHardwareBridge
                    activeBand={activeBand}
                    auvDepth={submersible.depth}
                    layers={activeScenario.layers}
                  />
                  <div className="flex-1 min-h-[200px]">
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
              )}

              {telemetryTab === 'LOG' && (
                <div className="flex flex-col gap-3 flex-1">
                  <div className="h-[360px]">
                    <MissionLog
                      events={missionEvents}
                      onClearLogs={() => setMissionEvents([])}
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
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        className="border-t border-white/[0.05] px-4 py-2.5 font-mono text-[10px] text-slate-500 flex flex-wrap items-center justify-between gap-2"
        style={{ background: 'rgba(2, 6, 18, 0.8)', backdropFilter: 'blur(12px)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-slate-400">AquaPulse Ground Station Console</span>
          <span className="text-white/15">·</span>
          <span className="text-cyan-400/80">SIH26058 MoES / NIOT Autonomous Bathymetric Sounding Solution</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">Space</kbd>
            <span>Transmit Ping</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">↑↓←→</kbd>
            <span>Steer AUV Depth/Range</span>
          </span>
          <span className="text-slate-600">· Drag Submersible on Viewport</span>
        </div>
      </footer>

      {/* Acoustic Theory & Navy Documentation Modal */}
      <AcousticTheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />

      {/* MoES / NIOT Agentic RAG Assistant Modal */}
      <RagAssistantModal isOpen={isRagOpen} onClose={() => setIsRagOpen(false)} />
    </div>
  );
}

// EOF: src/App.tsx


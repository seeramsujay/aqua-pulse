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
<<<<<<< HEAD
import { Compass, Navigation, Signal, Activity, Cpu, Terminal } from 'lucide-react';
=======
import { RagAssistantModal } from './components/common/RagAssistantModal';
import { sonarAudio } from './utils/audioSonar';
import { Compass } from 'lucide-react';
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)

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
<<<<<<< HEAD
  const [pingFlash, setPingFlash] = useState(false);
  const [telemetryTab, setTelemetryTab] = useState<'SIGNAL' | 'DSP' | 'LOG'>('SIGNAL');
=======
  const [isRagOpen, setIsRagOpen] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  // Environmental Knobs State
  const [turbidity, setTurbidity] = useState<number>(12.0);
  const [temperature, setTemperature] = useState<number>(18.0);
  const [salinity, setSalinity] = useState<number>(35.0);
  const [batteryV, setBatteryV] = useState<number>(12.6);
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)

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
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
      type: 'SCENARIO_CHANGE',
      title: `Scenario Loaded: ${scenario.name}`,
      details: `Profile: ${scenario.subtitle}. AUV depth set to ${scenario.auvDepth}m.`
    });
  };

<<<<<<< HEAD
=======
  // Reset environmental parameters to nominal
  const handleResetEnvironment = () => {
    setTurbidity(12.0);
    setTemperature(18.0);
    setSalinity(35.0);
    setBatteryV(12.6);
  };

  // Echo and sounding handlers
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)
  const handleEchoDetected = useCallback(
    (echo: EchoReturn) => {
      setEchoes((prev) => [...prev.slice(-40), echo]);
      setPingFlash(true);
      setTimeout(() => setPingFlash(false), 300);

      if (echo.success) {
        addMissionEvent({
          type: 'ECHO_LOCK',
          title: `Echo Locked @ ${echo.calculatedDepthM.toFixed(0)}m (${echo.freqKHz.toFixed(0)} kHz)`,
          details: `SNR: +${echo.snrDb.toFixed(1)} dB | Gain: +${echo.compressionGainDb.toFixed(1)} dB | TOF: ${echo.travelTimeMs.toFixed(0)} ms`
        });
      } else {
        addMissionEvent({
          type: 'SHADOW_ZONE',
          title: `Acoustic Shadow Zone Intercept (${echo.freqKHz.toFixed(0)} kHz)`,
          details: `Echo attenuated below detection threshold (${echo.attenuationDb.toFixed(1)} dB loss).`
        });
      }

<<<<<<< HEAD
=======
      // Play audio feedback for echo return
      if (isAudioEnabled && echo.success) {
        sonarAudio.playEchoReturn(echo.travelTimeMs * 0.3, echo.snrDb);
      }

      // If auto-roll is enabled and in RC-CSS mode, roll to next band
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)
      if (autoRoll && mode === 'rc-css') {
        setActiveBandIndex((prev) => {
          const nextIdx = (prev + 1) % bands.length;
          addMissionEvent({
            type: 'CHANNEL_ROLL',
            title: `RC-CSS Rolling Band → ${bands[nextIdx].name}`,
            details: `Frequency: ${bands[nextIdx].fStart}-${bands[nextIdx].fEnd} kHz (${bands[nextIdx].targetRegime})`
          });
          return nextIdx;
        });
      }
    },
<<<<<<< HEAD
    [autoRoll, mode, bands, addMissionEvent]
=======
    [autoRoll, mode, bands.length, isAudioEnabled]
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)
  );

  const handleSoundingPoint = useCallback((point: BathymetryPoint) => {
    setSoundings((prev) => {
      const filtered = prev.filter((p) => Math.abs(p.x - point.x) > 15);
      return [...filtered, point];
    });
  }, []);

<<<<<<< HEAD
=======
  // Audio chirp feedback on ping trigger
  const triggerPingWithAudio = useCallback(() => {
    if (isAudioEnabled) {
      sonarAudio.playChirp(activeBand.fStart, activeBand.fEnd, activeBand.durationMs);
    }
    setSubmersible((prev) => ({ ...prev, pingActive: true }));
  }, [isAudioEnabled, activeBand]);

  // Keyboard shortcut listener (Space = ping, Arrows = steer AUV)
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)
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
<<<<<<< HEAD
        onOpenBoot={() => setIsBooting(true)}
=======
        onOpenRag={() => setIsRagOpen(true)}
        isAudioEnabled={isAudioEnabled}
        setIsAudioEnabled={setIsAudioEnabled}
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)
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

<<<<<<< HEAD
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
                  onClick={() => setTelemetryTab('LOG')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-mono text-[10px] font-bold tracking-wider transition-all ${
                    telemetryTab === 'LOG'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Terminal className="w-3 h-3" />
                  <span>TACTICAL LOG</span>
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
=======
            {/* Right Column: Telemetry, SSP & Spectrogram Waterfall (4 Cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Sound Speed Profile (SSP) Chart */}
              <div className="h-[260px]">
                <SoundSpeedProfile layers={activeScenario.layers} auvDepth={submersible.depth} />
              </div>

              {/* Spectrogram & De-Chirp Waterfall */}
              <div className="h-[220px]">
                <SpectrogramWaterfall
                  echoes={echoes}
                  activeBand={activeBand}
                  mode={mode}
                  isPinging={submersible.pingActive}
                />
              </div>
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)

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

<<<<<<< HEAD
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
=======
              {/* Environmental Sensor & Fault Injector */}
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

              {/* Acoustic Physics & Stepped Rolling Controller */}
              <div className="min-h-[220px]">
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
>>>>>>> c87a173 (feat(software-enhancements): add audio sonar feedback, fault injection panel, RAG assistant chat, GIS CSV export, and full test suites)
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

      <AcousticTheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />

      {/* MoES / NIOT Agentic RAG Assistant Modal */}
      <RagAssistantModal isOpen={isRagOpen} onClose={() => setIsRagOpen(false)} />
    </div>
  );
}

// EOF: src/App.tsx

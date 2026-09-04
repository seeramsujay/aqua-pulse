import { useState, useEffect, useCallback, useRef } from 'react';
import { Submersible, EchoReturn, BathymetryPoint, SonarMode, PresetScenario, ChirpBand } from './types/sonar';
import {
  STANDARD_CHIRP_BANDS,
  calculateThorpAttenuation,
  calculateCssProcessingGain,
  getOceanPropertiesAtDepth,
} from './physics/oceanAcoustics';
import { SCENARIO_PRESETS } from './physics/presets';
import { Navbar } from './components/common/Navbar';
import { BootSequence } from './components/common/BootSequence';
import { MissionContextBar } from './components/common/MissionContextBar';
import { DecisionTrail } from './components/common/DecisionTrail';
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
import { ThreeDViewportModal } from './components/simulations/ThreeDViewportModal';
import { sonarAudio } from './utils/audioSonar';
import {
  Cpu,
  Activity,
  Sparkles,
  Gauge,
  Signal,
  Waves,
  Leaf,
  CircleDot,
  RotateCw,
  Thermometer,
  Droplets,
  Layers,
  Anchor,
} from 'lucide-react';

// Sleek Instrument Toggle Switch Component matching mockup
const ToggleSwitch: React.FC<{ checked: boolean; onChange: () => void; id?: string }> = ({
  checked,
  onChange,
  id,
}) => (
  <button
    id={id}
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-all duration-200 ease-in-out focus:outline-none"
    style={{
      background: checked ? '#43C7D9' : '#14232C',
      borderColor: checked ? '#43C7D9' : '#2A3D4A',
    }}
  >
    <span
      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full shadow transition duration-200 ease-in-out mt-[2px] ${
        checked ? 'translate-x-4 bg-[#071018]' : 'translate-x-0.5 bg-[#7E93A4]'
      }`}
    />
  </button>
);

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
  const [is3DOpen, setIs3DOpen] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('MISSION');
  const [acousticsSubTab, setAcousticsSubTab] = useState<string>('propagation');
  const [waveformsSubTab, setWaveformsSubTab] = useState<string>('rccss');
  const [cognitionSubTab, setCognitionSubTab] = useState<string>('decision');
  const [systemSubTab, setSystemSubTab] = useState<string>('hardware');

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
    activeBandIndex: 0,
  });

  const triggerPingRef = useRef<(() => void) | null>(null);

  const [echoes, setEchoes] = useState<EchoReturn[]>([]);
  const [soundings, setSoundings] = useState<BathymetryPoint[]>([]);
  const [missionEvents, setMissionEvents] = useState<MissionEvent[]>([
    {
      id: 'init-1',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      type: 'SYSTEM',
      title: 'AQUAPULSE Ground Station Online',
      details: 'Connected to MoES / NIOT Autonomous Hydrographic Telemetry Payload.',
    },
  ]);

  const activeBand = bands[activeBandIndex] || bands[0];

  // Wenz (1962) noise floor computed client-side for active channel
  const activeCenterKHz = (activeBand.fStart + activeBand.fEnd) / 2;
  const wenzLogF = Math.log10(Math.max(0.1, activeCenterKHz));
  const wenzNoiseFloor = parseFloat(
    Math.max(
      76.0 - 20.0 * wenzLogF,
      44.0 + 7.5 * Math.sqrt(3) - 17.0 * wenzLogF,
      -15.0 + 20.0 * wenzLogF
    ).toFixed(1)
  );

  const addMissionEvent = useCallback((event: Omit<MissionEvent, 'id' | 'timestamp'>) => {
    const newEvent: MissionEvent = {
      ...event,
      id: `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
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
      details: `Profile: ${scenario.subtitle}. AUV depth set to ${scenario.auvDepth}m.`,
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
      details: 'Restored nominal oceanographic baseline parameters.',
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
    triggerPingRef.current?.();
    setSubmersible((prev) => ({ ...prev, pingActive: true }));
    addMissionEvent({
      type: 'PING',
      title: `Pulse Emitted (${activeBand.name})`,
      details: `Carrier ${((activeBand.fStart + activeBand.fEnd) / 2).toFixed(0)} kHz · Beam ${submersible.beamSpreadDeg}° · Depth ${submersible.depth.toFixed(1)}m`,
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

      if (returnArray.length > 0) {
        const top = returnArray.reduce((max, r) => (r.snrDb > max.snrDb ? r : max), returnArray[0]);
        if (top.snrDb > 8) {
          if (isAudioEnabled) {
            sonarAudio.playEchoReturn(top.calculatedDepthM * 0.5, top.snrDb);
          }
          addMissionEvent({
            type: 'ECHO_LOCK',
            title: `Bottom Acoustic Return Locked (${top.reason?.toUpperCase() || 'SEABED'})`,
            details: `Depth: ${top.calculatedDepthM.toFixed(1)}m · SNR: +${top.snrDb.toFixed(1)} dB · Time: ${top.travelTimeMs.toFixed(1)}ms`,
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

  const currentOceanProps = getOceanPropertiesAtDepth(activeScenario.layers, submersible.depth);
  const latestEcho = echoes[echoes.length - 1];
  const bandwidthKhz = activeBand.fEnd - activeBand.fStart;
  const timeBandwidthProduct = bandwidthKhz * activeBand.durationMs;
  const processingGainDb = calculateCssProcessingGain(bandwidthKhz * 1000, activeBand.durationMs / 1000);
  const thorpDbKm = calculateThorpAttenuation(activeCenterKHz);
  const blindZoneM = (currentOceanProps.soundSpeed * (activeBand.durationMs / 1000)) / 2;

  // Sub-tab bar renderer helper
  const renderSubTabs = (
    tabs: { id: string; label: string }[],
    current: string,
    onChange: (id: string) => void
  ) => (
    <div
      style={{
        display: 'flex',
        gap: '0',
        marginBottom: '16px',
        borderBottom: '1px solid var(--border-subtle)',
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const active = current === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: '6px 14px',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              border: 'none',
              borderBottom: active ? '2px solid #43C7D9' : '2px solid transparent',
              background: 'transparent',
              color: active ? 'var(--text-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans" style={{ background: '#071018' }}>
      {/* Boot Sequence Overlay */}
      {isBooting && <BootSequence onComplete={() => setIsBooting(false)} />}

      {/* Navigation with Tab Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        scenarios={scenarios}
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        isAutoPinging={isAutoPinging}
        setIsAutoPinging={setIsAutoPinging}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onOpenRag={() => setIsRagOpen(true)}
        onOpen3D={() => setIs3DOpen(true)}
        isAudioEnabled={isAudioEnabled}
        setIsAudioEnabled={setIsAudioEnabled}
      />

      {/* Auto-sweep Status Ribbon (Indicating Autonomous Multi-Tone Transmission) */}
      {isAutoPinging && (
        <div className="bg-emerald-950/40 border-b border-emerald-500/30 px-4 py-1 flex items-center justify-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full inline-block bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[10px] text-emerald-300 tracking-widest uppercase">
            Auto-Sweep Active — RC-CSS Stepped Multi-Tone Transmission
          </span>
        </div>
      )}

      {/* Main Layout */}
      <main
        className={`flex-1 w-full mx-auto ${
          activeTab === 'MISSION'
            ? 'max-w-[1920px] px-4 pt-2.5 pb-2 h-[calc(100vh-76px)] overflow-hidden'
            : 'max-w-7xl px-4 py-4'
        }`}
      >
        {/* Mission Context Bar Strip (shown on non-MISSION tabs) */}
        {activeTab !== 'MISSION' && (
          <MissionContextBar
            submersible={submersible}
            activeBand={activeBand}
            mode={mode}
            activeScenario={activeScenario}
            isAutoPinging={isAutoPinging}
            latestEcho={latestEcho}
            layers={activeScenario.layers}
            energySaved={32.5}
          />
        )}

        {/* Tab-driven Content Router */}
        <div className={activeTab === 'MISSION' ? 'w-full h-full' : 'mt-4'}>
          {/* ── 1. MISSION SCREEN (3-Column Layout Matching Mockup) ── */}
          {activeTab === 'MISSION' && (
            <div className="flex flex-col lg:flex-row gap-3.5 w-full h-full">
              {/* ── LEFT PANEL (≈ 260–290px) ── */}
              <div className="w-full lg:w-[275px] shrink-0 flex flex-col gap-3 overflow-y-auto pr-0.5 scrollbar-thin">
                {/* MISSION STATUS */}
                <div className="instrument-panel p-3.5 flex flex-col gap-3">
                  <div className="text-[11px] font-semibold tracking-wider text-[#7E93A4] font-mono uppercase">
                    MISSION STATUS
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* DEPTH */}
                    <div className="flex items-center gap-3">
                      <Gauge className="w-4 h-4 text-[#43C7D9] shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono uppercase text-[#7E93A4]">DEPTH</span>
                        <span className="text-[15px] font-bold font-mono text-slate-100 leading-tight">
                          {Math.round(submersible.depth)} m
                        </span>
                      </div>
                    </div>

                    {/* CHANNEL */}
                    <div className="flex items-center gap-3">
                      <Activity className="w-4 h-4 text-[#43C7D9] shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono uppercase text-[#7E93A4]">CHANNEL</span>
                        <span className="text-[13px] font-bold font-mono text-slate-100 leading-tight">
                          CH{activeBandIndex} · {activeBand.fStart}-{activeBand.fEnd} kHz
                        </span>
                      </div>
                    </div>

                    {/* SNR */}
                    <div className="flex items-center gap-3">
                      <Signal className="w-4 h-4 text-[#43C7D9] shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono uppercase text-[#7E93A4]">SNR</span>
                        <span className="text-[15px] font-bold font-mono text-slate-100 leading-tight">
                          {latestEcho ? `${latestEcho.snrDb.toFixed(1)} dB` : '18.6 dB'}
                        </span>
                      </div>
                    </div>

                    {/* SOUND SPEED c(z) */}
                    <div className="flex items-center gap-3">
                      <Waves className="w-4 h-4 text-[#43C7D9] shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono uppercase text-[#7E93A4]">SOUND SPEED c(z)</span>
                        <span className="text-[15px] font-bold font-mono text-slate-100 leading-tight">
                          {currentOceanProps.soundSpeed.toFixed(0)} m/s
                        </span>
                      </div>
                    </div>

                    {/* ENERGY SAVED */}
                    <div className="flex items-center gap-3">
                      <Leaf className="w-4 h-4 text-[#63C79A] shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono uppercase text-[#7E93A4]">ENERGY SAVED</span>
                        <span className="text-[15px] font-bold font-mono leading-tight" style={{ color: '#63C79A' }}>
                          +33%
                        </span>
                      </div>
                    </div>

                    {/* STATE */}
                    <div className="flex items-center gap-3">
                      <CircleDot className="w-4 h-4 text-[#43C7D9] shrink-0" />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono uppercase text-[#7E93A4]">STATE</span>
                        <span className="text-[14px] font-bold font-mono text-slate-100 leading-tight uppercase">
                          {submersible.status === 'transmitting' ? 'PINGING' : submersible.status.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* AUTO-SWEEP */}
                    <div className="flex items-center justify-between pt-1 border-t border-[#182935]">
                      <div className="flex items-center gap-3">
                        <RotateCw className="w-4 h-4 text-[#43C7D9] shrink-0" />
                        <span className="text-[10px] font-mono uppercase text-[#7E93A4] font-semibold">AUTO-SWEEP</span>
                      </div>
                      <ToggleSwitch
                        checked={autoRoll}
                        onChange={() => setAutoRoll(!autoRoll)}
                        id="left-auto-sweep-toggle"
                      />
                    </div>
                  </div>
                </div>

                {/* ENVIRONMENT */}
                <div className="instrument-panel p-3.5 flex flex-col gap-2.5">
                  <div className="text-[11px] font-semibold tracking-wider text-[#7E93A4] font-mono uppercase">
                    ENVIRONMENT
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-[11px]">
                    {/* Temperature */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#7E93A4]">
                        <Thermometer className="w-3.5 h-3.5 text-[#43C7D9]" />
                        <span>Temperature</span>
                      </span>
                      <span className="font-semibold text-slate-100">{temperature.toFixed(1)} °C</span>
                    </div>

                    {/* Salinity */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#7E93A4]">
                        <Droplets className="w-3.5 h-3.5 text-[#43C7D9]" />
                        <span>Salinity</span>
                      </span>
                      <span className="font-semibold text-slate-100">{salinity.toFixed(1)} PSU</span>
                    </div>

                    {/* Turbidity */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#7E93A4]">
                        <Layers className="w-3.5 h-3.5 text-[#43C7D9]" />
                        <span>Turbidity</span>
                      </span>
                      <span className="font-semibold text-slate-100">{Math.round(turbidity)} NTU</span>
                    </div>

                    {/* AUV Depth */}
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-[#7E93A4]">
                        <Anchor className="w-3.5 h-3.5 text-[#43C7D9]" />
                        <span>AUV Depth</span>
                      </span>
                      <span className="font-semibold text-slate-100">{Math.round(submersible.depth)} m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CENTER COLUMN (OceanCanvas) ── */}
              <div className="flex-1 min-w-0 h-full flex flex-col">
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
                  turbidity={turbidity}
                  triggerPingRef={triggerPingRef}
                />
              </div>

              {/* ── RIGHT PANEL (≈ 310–340px) ── */}
              <div className="w-full lg:w-[325px] shrink-0 flex flex-col gap-3 overflow-y-auto pl-0.5">
                {/* QUICK CONTROLS */}
                <div className="instrument-panel p-3.5 flex flex-col gap-3">
                  <div className="text-[11px] font-semibold tracking-wider text-[#7E93A4] font-mono uppercase">
                    QUICK CONTROLS
                  </div>

                  {/* TRANSMIT PING Button */}
                  <button
                    id="main-transmit-ping-btn"
                    onClick={triggerPingWithAudio}
                    className="w-full py-2.5 px-4 rounded font-mono font-bold text-xs tracking-wider flex items-center justify-between transition-all active:scale-[0.98] hover:brightness-105 shadow-sm"
                    style={{
                      background: '#43C7D9',
                      color: '#071018',
                    }}
                  >
                    <span className="flex-1 text-center font-extrabold text-[12px] tracking-wider">TRANSMIT PING</span>
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded ml-2"
                      style={{
                        background: 'rgba(7, 16, 24, 0.25)',
                        border: '1px solid rgba(7, 16, 24, 0.2)',
                        color: '#071018',
                      }}
                    >
                      SPACE
                    </span>
                  </button>

                  {/* CHANNEL Selector */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#7E93A4] font-semibold">CHANNEL</span>
                    <div className="flex items-center gap-1.5">
                      {bands.map((b, idx) => {
                        const isSelected = activeBandIndex === idx;
                        return (
                          <button
                            key={b.id}
                            onClick={() => {
                              setActiveBandIndex(idx);
                              setAutoRoll(false);
                            }}
                            className="px-2.5 py-1 rounded text-[11px] font-mono font-semibold transition-all"
                            style={{
                              background: isSelected ? 'rgba(67, 199, 217, 0.15)' : '#091319',
                              border: `1px solid ${isSelected ? '#43C7D9' : '#20333D'}`,
                              color: isSelected ? '#43C7D9' : '#7E93A4',
                            }}
                          >
                            CH{idx}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* MODE Dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase text-[#7E93A4] font-semibold">MODE</span>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as SonarMode)}
                      className="text-[11px] font-mono rounded px-2.5 py-1 focus:outline-none cursor-pointer"
                      style={{
                        background: '#091319',
                        border: '1px solid #20333D',
                        color: 'var(--text-primary)',
                        width: '130px',
                      }}
                    >
                      <option value="rc-css" style={{ background: '#0B1720', color: '#E7EEF1' }}>LFM Chirp</option>
                      <option value="traditional-cw" style={{ background: '#0B1720', color: '#E7EEF1' }}>CW Pulse</option>
                      <option value="side-by-side" style={{ background: '#0B1720', color: '#E7EEF1' }}>Side-by-Side Dual</option>
                    </select>
                  </div>

                  {/* AUTO-SWEEP Toggle */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-[#7E93A4] font-semibold">AUTO-SWEEP</span>
                    <ToggleSwitch
                      checked={isAutoPinging}
                      onChange={() => setIsAutoPinging(!isAutoPinging)}
                      id="right-auto-sweep-toggle"
                    />
                  </div>
                </div>

                {/* ACOUSTIC METRICS */}
                <div className="instrument-panel p-3 flex flex-col gap-2">
                  <div className="text-[11px] font-semibold tracking-wider text-[#7E93A4] font-mono uppercase mb-0.5">
                    ACOUSTIC METRICS
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Thorp α(f)</span>
                    <span className="font-semibold" style={{ color: '#43C7D9' }}>{thorpDbKm.toFixed(2)} dB/km</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Processing Gain</span>
                    <span className="font-semibold" style={{ color: '#63C79A' }}>+{processingGainDb.toFixed(1)} dB</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Time-Bandwidth B×T</span>
                    <span className="font-semibold text-slate-100">{timeBandwidthProduct.toFixed(0)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Wenz Noise Floor</span>
                    <span className="font-semibold" style={{ color: '#D9A441' }}>{wenzNoiseFloor} dB</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Blind Zone Distance</span>
                    <span className="font-semibold" style={{ color: '#D96B6B' }}>&lt; {blindZoneM.toFixed(2)} m</span>
                  </div>
                </div>

                {/* WAVEFORM */}
                <div className="instrument-panel p-3 flex flex-col gap-2">
                  <div className="text-[11px] font-semibold tracking-wider text-[#7E93A4] font-mono uppercase mb-0.5">
                    WAVEFORM
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Tp</span>
                    <span className="font-semibold text-slate-100">{activeBand.durationMs.toFixed(1)} ms</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Bandwidth</span>
                    <span className="font-semibold text-slate-100">{bandwidthKhz} kHz</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Gain Gp</span>
                    <span className="font-semibold" style={{ color: '#63C79A' }}>+{processingGainDb.toFixed(1)} dB</span>
                  </div>
                </div>

                {/* ACOUSTIC RESULT */}
                <div className="instrument-panel p-3 flex flex-col gap-2">
                  <div className="text-[11px] font-semibold tracking-wider text-[#7E93A4] font-mono uppercase mb-0.5">
                    ACOUSTIC RESULT
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">Measured Depth</span>
                    <span className="font-semibold text-slate-100">
                      {latestEcho ? `${latestEcho.calculatedDepthM.toFixed(1)} m` : '--'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#7E93A4]">SNR</span>
                    <span className="font-semibold text-slate-100">
                      {latestEcho ? `+${latestEcho.snrDb.toFixed(1)} dB` : '--'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. ACOUSTICS SCREEN ── */}
          {activeTab === 'ACOUSTICS' && (
            <div>
              {renderSubTabs(
                [
                  { id: 'propagation', label: 'Ray Propagation' },
                  { id: 'soundspeed', label: 'Sound Speed Profile' },
                  { id: 'absorption', label: 'Thorp Absorption' },
                  { id: 'signal', label: 'Spectrogram Waterfall' },
                ],
                acousticsSubTab,
                setAcousticsSubTab
              )}

              {acousticsSubTab === 'propagation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ minHeight: '460px', width: '100%' }}>
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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div className="telemetry-cell">
                      <div className="telemetry-label">Thorp α(f)</div>
                      <div className="telemetry-value" style={{ color: '#43C7D9' }}>{thorpDbKm.toFixed(2)} dB/km</div>
                    </div>
                    <div className="telemetry-cell">
                      <div className="telemetry-label">Processing Gain</div>
                      <div className="telemetry-value" style={{ color: '#63C79A' }}>+{processingGainDb.toFixed(1)} dB</div>
                    </div>
                    <div className="telemetry-cell">
                      <div className="telemetry-label">Time-Bandwidth</div>
                      <div className="telemetry-value" style={{ color: '#E7EEF1' }}>{timeBandwidthProduct.toFixed(0)}</div>
                    </div>
                    <div className="telemetry-cell">
                      <div className="telemetry-label">Snell Invariant c/cos(θ)</div>
                      <div className="telemetry-value" style={{ color: '#D9A441' }}>
                        {(currentOceanProps.soundSpeed / Math.cos(((submersible.pingAngleDeg - 90) * Math.PI) / 180)).toFixed(0)} m/s
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {acousticsSubTab === 'soundspeed' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  <div style={{ minHeight: '380px' }}>
                    <SoundSpeedProfile layers={activeScenario.layers} auvDepth={submersible.depth} />
                  </div>
                  <div className="instrument-panel" style={{ padding: '16px' }}>
                    <div className="instrument-panel-header" style={{ padding: '0 0 12px 0' }}>
                      <span className="instrument-panel-title">Layer Stratification Details</span>
                      <span className="hud-chip">{activeScenario.name}</span>
                    </div>
                    <div className="flex flex-col gap-3 mt-3">
                      {activeScenario.layers.map((layer, idx) => {
                        const isCurrentLayer =
                          submersible.depth >= layer.depthStart && submersible.depth <= layer.depthEnd;
                        return (
                          <div
                            key={idx}
                            className="telemetry-cell"
                            style={{
                              borderColor: isCurrentLayer ? '#43C7D9' : 'var(--border-subtle)',
                              background: isCurrentLayer ? 'var(--bg-elevated)' : 'var(--bg-inset)',
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[12px]" style={{ color: 'var(--text-primary)' }}>
                                {layer.name}
                              </span>
                              <span className="font-mono text-[11px]" style={{ color: 'var(--text-muted)' }}>
                                {layer.depthStart}m - {layer.depthEnd}m
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-2 font-mono text-[11px]">
                              <div><span style={{ color: 'var(--text-dim)' }}>c: </span>{getOceanPropertiesAtDepth(activeScenario.layers, (layer.depthStart + layer.depthEnd) / 2).soundSpeed.toFixed(0)} m/s</div>
                              <div><span style={{ color: 'var(--text-dim)' }}>T: </span>{layer.tempStart}°C</div>
                              <div><span style={{ color: 'var(--text-dim)' }}>S: </span>{layer.salinity} PSU</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {acousticsSubTab === 'absorption' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                  <div style={{ minHeight: '380px' }}>
                    <AbsorptionCurve activeBand={activeBand} mode={mode} bands={bands} />
                  </div>
                  <div className="instrument-panel" style={{ padding: '16px' }}>
                    <div className="instrument-panel-header" style={{ padding: '0 0 12px 0' }}>
                      <span className="instrument-panel-title">Operating Acoustic Band</span>
                      <span className="hud-chip">{activeBand.name}</span>
                    </div>
                    <div className="flex flex-col gap-3 mt-3 font-mono text-[11px]">
                      <div className="telemetry-cell">
                        <div className="telemetry-label">Frequency Span</div>
                        <div className="telemetry-value" style={{ color: '#43C7D9' }}>
                          {activeBand.fStart} - {activeBand.fEnd} kHz
                        </div>
                      </div>
                      <div className="telemetry-cell">
                        <div className="telemetry-label">Pulse Duration (Tp)</div>
                        <div className="telemetry-value" style={{ color: '#E7EEF1' }}>
                          {activeBand.durationMs} ms
                        </div>
                      </div>
                      <div className="telemetry-cell">
                        <div className="telemetry-label">Computed Attenuation at Center Freq</div>
                        <div className="telemetry-value" style={{ color: '#D9A441' }}>
                          {thorpDbKm.toFixed(2)} dB/km
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {acousticsSubTab === 'signal' && (
                <div style={{ minHeight: '380px', width: '100%' }}>
                  <SpectrogramWaterfall
                    echoes={echoes}
                    activeBand={activeBand}
                    mode={mode}
                    isPinging={submersible.pingActive}
                  />
                </div>
              )}
            </div>
          )}

          {/* ── 3. WAVEFORMS SCREEN ── */}
          {activeTab === 'WAVEFORMS' && (
            <div>
              {renderSubTabs(
                [
                  { id: 'rccss', label: 'RC-CSS Chirp Synthesis' },
                  { id: 'cwvscss', label: 'CW vs RC-CSS Benchmark' },
                  { id: 'hfm', label: 'HFM Doppler Invariance' },
                ],
                waveformsSubTab,
                (id) => {
                  setWaveformsSubTab(id);
                  if (id === 'cwvscss') setMode('side-by-side');
                  else if (id === 'rccss') setMode('rc-css');
                }
              )}

              {waveformsSubTab === 'rccss' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ minHeight: '340px', width: '100%' }}>
                    <PulseCompressionChart
                      activeBand={activeBand}
                      mode={mode}
                      isPinging={submersible.pingActive}
                    />
                  </div>

                  {/* Channel Selector Bar */}
                  <div className="instrument-panel" style={{ padding: '12px 16px' }}>
                    <div className="instrument-panel-header" style={{ padding: '0 0 10px 0' }}>
                      <span className="instrument-panel-title">Agile Frequency Hop Channel</span>
                      <div className="flex items-center gap-2">
                        <span className="telemetry-label">Auto-Hop:</span>
                        <div
                          className={`toggle-track ${autoRoll ? 'on' : ''}`}
                          onClick={() => setAutoRoll(!autoRoll)}
                        >
                          <div className="toggle-thumb" />
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      {bands.map((band, idx) => {
                        const isSelected = activeBandIndex === idx;
                        return (
                          <div
                            key={band.id}
                            onClick={() => {
                              setAutoRoll(false);
                              setActiveBandIndex(idx);
                            }}
                            className={`freq-channel ${isSelected ? 'active' : ''}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-[12px]" style={{ color: isSelected ? '#43C7D9' : 'var(--text-primary)' }}>
                                {band.name}
                              </span>
                              <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>
                                {band.durationMs}ms
                              </span>
                            </div>
                            <div className="font-mono text-[11px] mt-1" style={{ color: 'var(--text-muted)' }}>
                              {band.fStart} - {band.fEnd} kHz (B = {band.fEnd - band.fStart} kHz)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Waveform Metric Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div className="telemetry-cell">
                      <div className="telemetry-label">Range Resolution ΔR</div>
                      <div className="telemetry-value" style={{ color: '#63C79A' }}>
                        {((currentOceanProps.soundSpeed / (2 * (bandwidthKhz * 1000))) * 100).toFixed(1)} cm
                      </div>
                    </div>
                    <div className="telemetry-cell">
                      <div className="telemetry-label">Blind Zone Distance</div>
                      <div className="telemetry-value" style={{ color: '#D96B6B' }}>
                        &lt; {blindZoneM.toFixed(2)} m
                      </div>
                    </div>
                    <div className="telemetry-cell">
                      <div className="telemetry-label">Time-Bandwidth Product</div>
                      <div className="telemetry-value" style={{ color: '#E7EEF1' }}>
                        {timeBandwidthProduct.toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {waveformsSubTab === 'cwvscss' && (
                <ComparisonView onSelectMode={(selected) => setMode(selected)} />
              )}

              {waveformsSubTab === 'hfm' && (
                <ComparisonView onSelectMode={(selected) => setMode(selected)} initialTab="hfm" />
              )}
            </div>
          )}

          {/* ── 4. BATHYMETRY SCREEN ── */}
          {activeTab === 'BATHYMETRY' && (
            <div style={{ minHeight: '520px', width: '100%' }}>
              <BathymetryMap
                soundings={soundings}
                terrainType={activeScenario.terrainType}
                onClear={() => setSoundings([])}
              />
            </div>
          )}

          {/* ── 5. COGNITION SCREEN ── */}
          {activeTab === 'COGNITION' && (
            <div>
              {renderSubTabs(
                [
                  { id: 'decision', label: 'Live Hardware & RAG Bridge' },
                  { id: 'environment', label: 'Oceanographic Injector' },
                ],
                cognitionSubTab,
                setCognitionSubTab
              )}

              {cognitionSubTab === 'decision' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
                  <LiveHardwareBridge
                    activeBand={activeBand}
                    auvDepth={submersible.depth}
                    layers={activeScenario.layers}
                  />
                  <DecisionTrail
                    layers={activeScenario.layers}
                    submersible={submersible}
                    activeBand={activeBand}
                    latestEcho={latestEcho}
                    mode={mode}
                    turbidity={turbidity}
                    temperature={temperature}
                    salinity={salinity}
                  />
                </div>
              )}

              {cognitionSubTab === 'environment' && (
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
              )}
            </div>
          )}

          {/* ── 6. SYSTEM SCREEN ── */}
          {activeTab === 'SYSTEM' && (
            <div>
              {renderSubTabs(
                [
                  { id: 'hardware', label: 'Embedded Hardware Status' },
                  { id: 'signalchain', label: 'Signal Chain & Physics' },
                  { id: 'log', label: 'Mission Event Log' },
                ],
                systemSubTab,
                setSystemSubTab
              )}

              {systemSubTab === 'hardware' && (
                <div className="flex flex-col gap-4">
                  <div className="instrument-panel" style={{ padding: '16px' }}>
                    <div className="instrument-panel-header" style={{ padding: '0 0 12px 0' }}>
                      <span className="instrument-panel-title">Embedded Micro-Architecture</span>
                      <span className="hud-chip">MoES / NIOT Specs</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                      <div className="telemetry-cell">
                        <div className="flex items-center gap-1.5 text-cyan-400 mb-1">
                          <Cpu className="w-3.5 h-3.5" />
                          <span className="telemetry-label" style={{ color: 'var(--text-muted)' }}>STM32H7 DMA TRGO</span>
                        </div>
                        <div className="telemetry-value">2.4 MSPS</div>
                        <div className="font-mono text-[10px] text-slate-500 mt-1">Dual-buffer circular DMA to DAC1</div>
                      </div>

                      <div className="telemetry-cell">
                        <div className="flex items-center gap-1.5 text-teal-400 mb-1">
                          <Activity className="w-3.5 h-3.5" />
                          <span className="telemetry-label" style={{ color: 'var(--text-muted)' }}>OPA1612 SALLEN-KEY</span>
                        </div>
                        <div className="telemetry-value">fc = 450 kHz</div>
                        <div className="font-mono text-[10px] text-slate-500 mt-1">4th-order active reconstruction filter</div>
                      </div>

                      <div className="telemetry-cell">
                        <div className="flex items-center gap-1.5 text-amber-400 mb-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="telemetry-label" style={{ color: 'var(--text-muted)' }}>INT8 TINYML INFERENCE</span>
                        </div>
                        <div className="telemetry-value">&lt; 1.1 ms</div>
                        <div className="font-mono text-[10px] text-slate-500 mt-1">CMSIS-NN quantized MLP policy</div>
                      </div>
                    </div>
                  </div>

                  <div className="instrument-panel" style={{ padding: '16px' }}>
                    <div className="instrument-panel-header" style={{ padding: '0 0 12px 0' }}>
                      <span className="instrument-panel-title">Subsystem Health &amp; Power</span>
                      <span className="hud-chip">Nominal</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                      <div className="telemetry-cell">
                        <div className="telemetry-label">Bus Voltage</div>
                        <div className="telemetry-value" style={{ color: '#63C79A' }}>{batteryV.toFixed(2)} V</div>
                      </div>
                      <div className="telemetry-cell">
                        <div className="telemetry-label">Transceiver State</div>
                        <div className="telemetry-value" style={{ color: '#63C79A' }}>LOCKED</div>
                      </div>
                      <div className="telemetry-cell">
                        <div className="telemetry-label">Active Channel</div>
                        <div className="telemetry-value" style={{ color: '#43C7D9' }}>{activeBand.name.split(' ')[0]}</div>
                      </div>
                      <div className="telemetry-cell">
                        <div className="telemetry-label">Auto-Ping Engine</div>
                        <div className="telemetry-value" style={{ color: isAutoPinging ? '#63C79A' : 'var(--text-dim)' }}>
                          {isAutoPinging ? 'ACTIVE' : 'STANDBY'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {systemSubTab === 'signalchain' && (
                <div style={{ minHeight: '480px', width: '100%' }}>
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
                    noiseFloorDb={wenzNoiseFloor}
                  />
                </div>
              )}

              {systemSubTab === 'log' && (
                <div style={{ minHeight: '480px', width: '100%' }}>
                  <MissionLog
                    events={missionEvents}
                    onClearLogs={() => setMissionEvents([])}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer (shown on sub-pages) */}
      {activeTab !== 'MISSION' && (
        <footer
          className="font-mono text-[10px] flex flex-wrap items-center justify-between gap-2"
          style={{
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-default)',
            padding: '10px 16px',
            color: 'var(--text-muted)',
          }}
        >
          <div className="flex items-center gap-3">
            <span style={{ color: 'var(--text-secondary)' }}>AquaPulse Ground Station Console</span>
            <span style={{ color: 'var(--border-default)' }}>·</span>
            <span style={{ color: '#43C7D9' }}>SIH26058 MoES / NIOT Autonomous Bathymetric Sounding Solution</span>
          </div>
          <div className="flex items-center gap-3" style={{ color: 'var(--text-dim)' }}>
            <span className="flex items-center gap-1">
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                Space
              </kbd>
              <span>Transmit Ping</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px]"
                style={{
                  background: 'var(--bg-inset)',
                  border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                ↑↓←→
              </kbd>
              <span>Steer AUV</span>
            </span>
            <span>· Drag Submersible on Viewport</span>
          </div>
        </footer>
      )}

      {/* Modals */}
      <AcousticTheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
      <RagAssistantModal isOpen={isRagOpen} onClose={() => setIsRagOpen(false)} />
      <ThreeDViewportModal isOpen={is3DOpen} onClose={() => setIs3DOpen(false)} />
    </div>
  );
}

// EOF: src/App.tsx

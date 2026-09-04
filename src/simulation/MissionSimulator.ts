/**
 * MissionSimulator.ts — Deterministic Autonomous AUV Mission Engine
 *
 * Drives the AUV through a scripted trajectory across three environmental zones:
 *   Phase 1: Shallow/Clear  → CH2 (400–480 kHz, high-res bathymetry)
 *   Phase 2: Mid/Thermocline → CH1 (200–250 kHz, thermocline profiler)
 *   Phase 3: Deep/Turbid     → CH0 (100–140 kHz, deep penetrator)
 *
 * The AUV moves forward autonomously. The "world" scrolls past the AUV in OceanCanvas.
 * Environmental parameters (turbidity, temperature, salinity) change with mission phase.
 * Channel switching is automatic and driven by the current zone.
 *
 * IMPORTANT: This module does NOT modify physics, telemetry, or TinyML logic.
 */

// ─── Mission Phase Definitions ──────────────────────────────────────

export type MissionPhaseId = 'SHALLOW_CLEAR' | 'MID_THERMOCLINE' | 'DEEP_TURBID';

export interface MissionPhase {
  id: MissionPhaseId;
  label: string;
  /** Target channel index (0 = CH0/Deep, 1 = CH1/Mid, 2 = CH2/High-res) */
  channelIndex: number;
  /** Target terrain elevation (meters the seabed rises upward toward surface) */
  targetElevation: number;
  /** Environmental parameters for this zone */
  environment: {
    turbidity: number;   // NTU
    temperature: number; // °C
    salinity: number;    // PSU
  };
  /** Duration of this phase in simulation ticks (at ~60fps, 1 tick = ~16ms) */
  durationTicks: number;
  /** Description for mission log */
  description: string;
}

export const MISSION_PHASES: MissionPhase[] = [
  {
    id: 'SHALLOW_CLEAR',
    label: 'Deep Basin / Clear Survey',
    channelIndex: 2, // CH2: 400–480 kHz
    targetElevation: 0, // Seafloor at baseline deep depth (~1200m)
    environment: { turbidity: 5, temperature: 22.0, salinity: 35.2 },
    durationTicks: 600,  // ~10 seconds at 60fps
    description: 'Cruising straight over deep abyssal basin. High-frequency CH2 (400–480 kHz) active for high-resolution bathymetric soundings.',
  },
  {
    id: 'MID_THERMOCLINE',
    label: 'Ascending Continental Slope',
    channelIndex: 1, // CH1: 200–250 kHz
    targetElevation: 450, // Seafloor rises up towards ~750m
    environment: { turbidity: 18, temperature: 12.0, salinity: 34.8 },
    durationTicks: 720,  // ~12 seconds
    description: 'Seafloor terrain ascending through thermocline boundary. CH1 (200–250 kHz) active for mid-water velocity profiling.',
  },
  {
    id: 'DEEP_TURBID',
    label: 'High Seamount & Ridge Crest',
    channelIndex: 0, // CH0: 100–140 kHz
    targetElevation: 820, // Seafloor rises high up to ~350m beneath AUV!
    environment: { turbidity: 45, temperature: 5.0, salinity: 34.7 },
    durationTicks: 840,  // ~14 seconds
    description: 'High underwater ridge crests rising close beneath AUV. Low-frequency CH0 (100–140 kHz) penetrating turbid sediment.',
  },
];

// ─── Mission State ──────────────────────────────────────────────────

export interface MissionState {
  /** Whether the mission is currently running */
  isRunning: boolean;
  /** Current phase index (0, 1, 2) */
  phaseIndex: number;
  /** Tick counter within current phase */
  phaseTick: number;
  /** Global elapsed ticks since mission start */
  globalTick: number;
  /** World X offset (scrolls terrain; AUV stays centered) */
  worldOffsetX: number;
  /** Current AUV depth (stays straight at constant depth) */
  currentDepth: number;
  /** Current terrain elevation offset in meters (raises the seafloor height) */
  terrainElevation: number;
  /** Current AUV heading angle (0 = straight ahead) */
  heading: number;
  /** Forward-looking collision warning (distance to seafloor ahead in meters) */
  collisionDistanceM: number | null;
  /** Whether collision warning is active (< threshold) */
  collisionWarning: boolean;
  /** Whether the mission has completed all phases */
  missionComplete: boolean;
  /** Current mission phase data */
  currentPhase: MissionPhase;
  /** Speed multiplier for demo */
  speedMultiplier: number;
}

// ─── Collision Prediction ───────────────────────────────────────────

const COLLISION_LOOK_AHEAD_M = 200;   // meters ahead to check
const COLLISION_WARN_THRESHOLD_M = 160; // warn if seafloor rises close to AUV

// ─── Simulator Class ────────────────────────────────────────────────

export interface MissionEvent {
  type: 'SYSTEM' | 'CHANNEL_ROLL' | 'SCENARIO_CHANGE' | 'SHADOW_ZONE';
  title: string;
  details: string;
}

export class MissionSimulator {
  private state: MissionState;
  private eventQueue: MissionEvent[] = [];
  private getSeafloorDepthFn: ((x: number, terrainType: string, widthM?: number) => number) | null = null;
  private terrainType: string = 'continental-slope';
  // Track transition zone for smooth terrain elevation interpolation
  private transitionTick: number = 0;
  private transitionFromElev: number = 0;
  private transitionToElev: number = 0;
  private isTransitioning: boolean = false;

  constructor() {
    this.state = this.getInitialState();
  }

  private getInitialState(): MissionState {
    const phase = MISSION_PHASES[0];
    return {
      isRunning: false,
      phaseIndex: 0,
      phaseTick: 0,
      globalTick: 0,
      worldOffsetX: 0,
      currentDepth: 120, // Submarine cruises straight at constant 120m depth
      terrainElevation: 0,
      heading: 0, // Perfectly level straight trajectory
      collisionDistanceM: null,
      collisionWarning: false,
      missionComplete: false,
      currentPhase: phase,
      speedMultiplier: 2.0, // 2x for SIH demo pacing
    };
  }

  /** Bind the terrain function so collision detection can query seafloor depth */
  setTerrainQuery(fn: (x: number, terrainType: string, widthM?: number) => number, terrain: string) {
    this.getSeafloorDepthFn = fn;
    this.terrainType = terrain;
  }

  /** Start or restart the mission */
  start(): MissionEvent[] {
    this.state = this.getInitialState();
    this.state.isRunning = true;
    this.eventQueue = [];
    this.eventQueue.push({
      type: 'SYSTEM',
      title: 'Autonomous Mission Initiated',
      details: `Phase 1/3: ${MISSION_PHASES[0].label}. AUV will traverse Shallow → Thermocline → Deep zones autonomously.`,
    });
    this.eventQueue.push({
      type: 'CHANNEL_ROLL',
      title: `Channel Switched → CH${MISSION_PHASES[0].channelIndex}`,
      details: MISSION_PHASES[0].description,
    });
    return this.drainEvents();
  }

  /** Stop the mission */
  stop(): MissionEvent[] {
    this.state.isRunning = false;
    this.eventQueue.push({
      type: 'SYSTEM',
      title: 'Autonomous Mission Halted',
      details: `Stopped at phase ${this.state.phaseIndex + 1}/3, tick ${this.state.globalTick}.`,
    });
    return this.drainEvents();
  }

  /** Core tick — call this every animation frame (~60fps) */
  tick(): { state: MissionState; events: MissionEvent[] } {
    if (!this.state.isRunning || this.state.missionComplete) {
      return { state: { ...this.state }, events: this.drainEvents() };
    }

    const speed = this.state.speedMultiplier;

    // ── Advance world position (horizontal scroll) ──
    // Constant forward velocity: ~3 m/tick at 2x speed → ~180 m/s effective demo speed
    this.state.worldOffsetX += 2.5 * speed;
    this.state.globalTick += 1;
    this.state.phaseTick += 1;

    // ── Compute Terrain Elevation Trajectory (Seafloor rises upward beneath AUV) ──
    const phase = MISSION_PHASES[this.state.phaseIndex];

    if (this.isTransitioning) {
      // Smooth terrain elevation transition between phases (ease-in-out over 120 ticks)
      this.transitionTick += 1;
      const t = Math.min(1, this.transitionTick / 120);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      this.state.terrainElevation = this.transitionFromElev + (this.transitionToElev - this.transitionFromElev) * ease;
      if (t >= 1) this.isTransitioning = false;
    } else {
      this.state.terrainElevation = phase.targetElevation;
    }

    // Submarine stays straight at constant cruising depth
    this.state.currentDepth = 120;
    this.state.heading = 0;

    // ── Collision prediction ──
    this.updateCollisionPrediction();

    // ── Phase transition check ──
    if (this.state.phaseTick >= phase.durationTicks) {
      const nextIndex = this.state.phaseIndex + 1;

      if (nextIndex >= MISSION_PHASES.length) {
        // Mission complete — loop back for demo
        this.state.missionComplete = true;
        this.state.isRunning = false;
        this.eventQueue.push({
          type: 'SYSTEM',
          title: 'Mission Complete — All Zones Surveyed',
          details: 'AUV has completed Shallow → Thermocline → Deep autonomous survey. Bathymetric data acquired across all frequency channels.',
        });
      } else {
        const nextPhase = MISSION_PHASES[nextIndex];
        // Begin terrain elevation transition
        this.isTransitioning = true;
        this.transitionTick = 0;
        this.transitionFromElev = this.state.terrainElevation;
        this.transitionToElev = nextPhase.targetElevation;

        this.state.phaseIndex = nextIndex;
        this.state.phaseTick = 0;
        this.state.currentPhase = nextPhase;

        this.eventQueue.push({
          type: 'SCENARIO_CHANGE',
          title: `Phase ${nextIndex + 1}/3: ${nextPhase.label}`,
          details: nextPhase.description,
        });
        this.eventQueue.push({
          type: 'CHANNEL_ROLL',
          title: `Channel Switched → CH${nextPhase.channelIndex}`,
          details: `Frequency: ${nextPhase.channelIndex === 0 ? '100–140' : nextPhase.channelIndex === 1 ? '200–250' : '400–480'} kHz. Environment: ${nextPhase.environment.turbidity} NTU turbidity, ${nextPhase.environment.temperature}°C.`,
        });
      }
    }

    return { state: { ...this.state }, events: this.drainEvents() };
  }

  /** Get current state without advancing */
  getState(): MissionState {
    return { ...this.state };
  }

  /** Check if the mission is currently running */
  isActive(): boolean {
    return this.state.isRunning && !this.state.missionComplete;
  }

  /** Forward-looking collision prediction */
  private updateCollisionPrediction() {
    if (!this.getSeafloorDepthFn) {
      this.state.collisionDistanceM = null;
      this.state.collisionWarning = false;
      return;
    }

    // The "world X" that's ahead of the AUV
    const lookAheadWorldX = this.state.worldOffsetX + COLLISION_LOOK_AHEAD_M;
    // Wrap within terrain width for getSeafloorDepth (uses 2000m world)
    const queryX = lookAheadWorldX % 2000;
    const rawSeafloorAhead = this.getSeafloorDepthFn(queryX, this.terrainType, 2000);
    const seafloorAhead = Math.max(150, rawSeafloorAhead - this.state.terrainElevation);
    const verticalGap = seafloorAhead - this.state.currentDepth;

    this.state.collisionDistanceM = Math.max(0, verticalGap);
    this.state.collisionWarning = verticalGap < COLLISION_WARN_THRESHOLD_M;

    if (verticalGap < 40 && verticalGap > 0) {
      // Emit collision warning event (throttled — only once per 180 ticks)
      if (this.state.globalTick % 180 === 0) {
        this.eventQueue.push({
          type: 'SHADOW_ZONE',
          title: `⚠ Terrain Proximity Alert`,
          details: `Seafloor ${verticalGap.toFixed(0)}m below AUV at look-ahead range. Adjusting descent profile.`,
        });
      }
    }
  }

  /** Drain and return queued events */
  private drainEvents(): MissionEvent[] {
    const events = [...this.eventQueue];
    this.eventQueue = [];
    return events;
  }
}

// EOF: src/simulation/MissionSimulator.ts

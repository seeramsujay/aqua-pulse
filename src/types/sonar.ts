export interface OceanLayer {
  id: string;
  name: string;
  depthStart: number; // in meters (e.g., 0)
  depthEnd: number;   // in meters (e.g., 200)
  tempStart: number;  // in °C (e.g., 22)
  tempEnd: number;    // in °C (e.g., 18)
  salinity: number;   // in PSU (e.g., 35.0)
  description: string;
  color: string;
}

export interface ChirpBand {
  id: string;
  name: string;
  fStart: number;     // in kHz (e.g., 5)
  fEnd: number;       // in kHz (e.g., 15)
  durationMs: number; // in ms (e.g., 50)
  color: string;
  secondaryColor: string;
  description: string;
  targetRegime: 'Deep Penetration & Turbid Estuaries' | 'Mid-Water & Thermocline' | 'High-Res Bathymetry';
}

export interface RaySegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  timeMs: number;
  attenuationDb: number;
  intensity: number; // 0 to 1
  freqKHz: number;
  color: string;
  isReflected: boolean;
  isSeafloorHit: boolean;
  isLostInShadow: boolean;
}

export interface EchoReturn {
  id: string;
  bandId: string;
  freqKHz: number;
  launchAngleDeg: number;
  travelTimeMs: number;
  calculatedDepthM: number;
  trueDepthM: number;
  snrDb: number;
  attenuationDb: number;
  color: string;
  timestamp: number;
  compressionGainDb: number;
  success: boolean;
  reason?: string;
}

export interface AcousticRay {
  id: string;
  bandId: string;
  freqKHz: number;
  launchAngleDeg: number;
  color: string;
  segments: RaySegment[];
  echo?: EchoReturn;
  pulseProgress: number; // 0 to 1 for animated wave packet
  isReturning: boolean;
}

export interface Submersible {
  x: number;          // meters (0 to 2000m)
  depth: number;      // meters (0 to 1500m)
  beamSpreadDeg: number; // e.g. 60 deg cone
  pingAngleDeg: number;  // nadir is 90 deg (pointing straight down)
  pingActive: boolean;
  status: 'idle' | 'transmitting' | 'propagating' | 'dechirping' | 'locked';
  activeBandIndex: number;
}

export interface BathymetryPoint {
  x: number;
  trueDepth: number;
  measuredDepth?: number;
  confidence: number; // 0 to 100%
  frequencyKHz?: number;
  timestamp: number;
}

export type SonarMode = 'rc-css' | 'traditional-cw' | 'side-by-side';

export interface PresetScenario {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  layers: OceanLayer[];
  auvDepth: number;
  terrainType: 'trench' | 'seamount' | 'continental-slope' | 'shallow-shelf';
  problemStatement: string;
  whyCssWins: string;
}

export interface SpectrogramSample {
  timeMs: number;
  frequencies: { freqKHz: number; power: number; color: string }[];
  activeChirpId?: string;
  detectedEcho?: boolean;
}

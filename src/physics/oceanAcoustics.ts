import { OceanLayer, RaySegment, AcousticRay, EchoReturn, ChirpBand } from '../types/sonar';

/**
 * Mackenzie (1981) formula for sound speed in seawater
 * T: Temperature in °C
 * S: Salinity in PSU (practical salinity units)
 * z: Depth in meters
 * Returns: Speed of sound c in m/s
 */
export function calculateSoundSpeed(T: number, S: number, z: number): number {
  return (
    1449.2 +
    4.6 * T -
    0.055 * Math.pow(T, 2) +
    0.00029 * Math.pow(T, 3) +
    (1.34 - 0.010 * T) * (S - 35) +
    0.0163 * z
  );
}

/**
 * Interpolates temperature and salinity at any given depth z based on defined layers
 */
export function getOceanPropertiesAtDepth(layers: OceanLayer[], z: number): { temp: number; salinity: number; soundSpeed: number; layer: OceanLayer } {
  const layer = layers.find((l) => z >= l.depthStart && z <= l.depthEnd) || layers[layers.length - 1];
  const layerSpan = Math.max(1, layer.depthEnd - layer.depthStart);
  const ratio = Math.max(0, Math.min(1, (z - layer.depthStart) / layerSpan));

  const temp = layer.tempStart + ratio * (layer.tempEnd - layer.tempStart);
  const salinity = layer.salinity;
  const soundSpeed = calculateSoundSpeed(temp, salinity, z);

  return { temp, salinity, soundSpeed, layer };
}

/**
 * Thorp's Acoustic Attenuation Formula
 * f: Frequency in kHz
 * Returns: Attenuation coefficient alpha in dB/km
 */
export function calculateThorpAttenuation(fKHz: number): number {
  if (fKHz <= 0) return 0.01;
  const f2 = Math.pow(fKHz, 2);
  const boricAcid = (0.11 * f2) / (1 + f2);
  const magnesiumSulfate = (44 * f2) / (4100 + f2);
  const pureWater = 2.75e-4 * f2;
  const viscosity = 0.003;
  return boricAcid + magnesiumSulfate + pureWater + viscosity;
}

/**
 * Transmission Loss (Spherical spreading + Frequency Absorption)
 * r: Total distance traveled in meters
 * fKHz: Frequency in kHz
 * Returns: Loss in dB
 */
export function calculateTransmissionLoss(rMeters: number, fKHz: number): number {
  if (rMeters <= 1) return 0;
  const sphericalSpreading = 20 * Math.log10(rMeters);
  const alpha = calculateThorpAttenuation(fKHz);
  const absorptionLoss = (alpha * rMeters) / 1000;
  return sphericalSpreading + absorptionLoss;
}

/**
 * Chirp Spread Spectrum Pulse Compression Processing Gain
 * B: Bandwidth in Hz
 * T: Chirp duration in seconds
 * Returns: Processing gain in dB
 */
export function calculateCssProcessingGain(bandwidthHz: number, durationSec: number): number {
  const timeBandwidthProduct = Math.max(1, bandwidthHz * durationSec);
  return 10 * Math.log10(timeBandwidthProduct);
}

/**
 * Returns seafloor depth at horizontal coordinate x for different terrain types
 */
export function getSeafloorDepth(x: number, terrainType: string, widthMeters: number = 2000): number {
  const normX = x / widthMeters;
  switch (terrainType) {
    case 'trench':
      // Mariana trench style deep V-trough
      return 1100 + 350 * Math.exp(-Math.pow((normX - 0.55) / 0.18, 2)) + 15 * Math.sin(normX * 40);
    case 'seamount':
      // Submerged underwater volcano / ridge
      return 1300 - 650 * Math.exp(-Math.pow((normX - 0.5) / 0.15, 2)) + 20 * Math.cos(normX * 30);
    case 'shallow-shelf':
      // Continental shelf sloping from 200m down to 600m
      return 250 + 400 * Math.pow(normX, 1.4) + 12 * Math.sin(normX * 25);
    case 'continental-slope':
    default:
      // Continental slope with ridges
      return 600 + 650 * (0.5 + 0.5 * Math.tanh((normX - 0.45) * 5)) + 25 * Math.sin(normX * 20);
  }
}

/**
 * Numerical Snell's Law Acoustic Ray Tracer
 * Traces curved acoustic ray paths through stratified sound velocity layers
 */
export function traceAcousticRay(
  startX: number,
  startZ: number,
  initialAngleDeg: number, // angle from vertical downward (90 is straight down, 60 is angled left, 120 is angled right)
  freqKHz: number,
  band: ChirpBand | null,
  layers: OceanLayer[],
  terrainType: string,
  mode: 'rc-css' | 'traditional-cw',
  maxDistanceM: number = 3200
): AcousticRay {
  const segments: RaySegment[] = [];
  const ds = 12; // Step size in meters
  let currX = startX;
  let currZ = startZ;
  let angleRad = (initialAngleDeg * Math.PI) / 180; // theta from horizontal or vertical
  let totalDistance = 0;
  let totalTimeMs = 0;
  let isReflected = false;
  let isLostInShadow = false;

  const color = band ? band.color : '#00ffff';

  // Sound source level SL in dB
  const sourceLevelDb = 210;
  // Ambient Ocean Noise Level NL in dB
  const ambientNoiseDb = 60;
  // CSS Processing gain
  const bandwidthHz = band ? (band.fEnd - band.fStart) * 1000 : 100;
  const durationSec = band ? band.durationMs / 1000 : 0.005;
  const processingGainDb = mode === 'rc-css' ? calculateCssProcessingGain(bandwidthHz, durationSec) : 0;

  // Maximum detection threshold (SNR > 0 dB after processing)
  const maxAllowableTL = (sourceLevelDb - ambientNoiseDb + processingGainDb) / 2;

  const maxSteps = Math.floor(maxDistanceM / ds);
  for (let step = 0; step < maxSteps; step++) {
    const prevX = currX;
    const prevZ = currZ;

    const { soundSpeed } = getOceanPropertiesAtDepth(layers, currZ);
    // Sound speed gradient dc/dz
    const deltaZ = 2;
    const speedBelow = getOceanPropertiesAtDepth(layers, currZ + deltaZ).soundSpeed;
    const speedAbove = getOceanPropertiesAtDepth(layers, Math.max(0, currZ - deltaZ)).soundSpeed;
    const dc_dz = (speedBelow - speedAbove) / (2 * deltaZ);

    // Ray direction vector
    const dx = ds * Math.cos(angleRad);
    const dz = ds * Math.sin(angleRad);

    currX += dx;
    currZ += dz;
    totalDistance += ds;
    totalTimeMs += (ds / soundSpeed) * 1000;

    // Snell's ray curvature: dTheta/ds = - (1/c) * (dc/dz) * cos(theta)
    const dAngle = -(1 / soundSpeed) * dc_dz * Math.cos(angleRad) * ds;
    angleRad += dAngle;

    // Surface reflection (z <= 0)
    if (currZ <= 5) {
      currZ = 5;
      angleRad = -angleRad; // Bounce downwards
    }

    // Seafloor collision check
    const seafloorZ = getSeafloorDepth(currX, terrainType);
    if (currZ >= seafloorZ) {
      currZ = seafloorZ;

      // Transmission loss computation
      const tlOneWay = calculateTransmissionLoss(totalDistance, freqKHz);
      const tlTwoWay = tlOneWay * 2;
      const receivedSnr = sourceLevelDb - tlTwoWay - ambientNoiseDb + processingGainDb;

      // Check if signal survived round trip
      const signalSurvived = receivedSnr > 3;

      segments.push({
        x1: prevX,
        y1: prevZ,
        x2: currX,
        y2: currZ,
        timeMs: totalTimeMs,
        attenuationDb: tlOneWay,
        intensity: Math.max(0.1, Math.min(1, (receivedSnr + 30) / 60)),
        freqKHz,
        color,
        isReflected: true,
        isSeafloorHit: true,
        isLostInShadow: !signalSurvived
      });

      // Calculate echo return metrics
      const echo: EchoReturn = {
        id: `echo-${Math.random().toString(36).substr(2, 9)}`,
        bandId: band ? band.id : 'cw-sonar',
        freqKHz,
        launchAngleDeg: initialAngleDeg,
        travelTimeMs: totalTimeMs * 2, // Round-trip
        calculatedDepthM: (totalTimeMs * soundSpeed) / 1000,
        trueDepthM: seafloorZ,
        snrDb: receivedSnr,
        attenuationDb: tlTwoWay,
        color,
        timestamp: Date.now(),
        compressionGainDb: processingGainDb,
        success: signalSurvived,
        reason: signalSurvived
          ? 'Clear Matched-Filter Peak Detected'
          : `High Attenuation / Shadow Blackout (SNR ${receivedSnr.toFixed(1)} dB < 3.0 dB)`
      };

      return {
        id: `ray-${freqKHz}-${initialAngleDeg}`,
        bandId: band ? band.id : 'cw',
        freqKHz,
        launchAngleDeg: initialAngleDeg,
        color,
        segments,
        echo,
        pulseProgress: 0,
        isReturning: false
      };
    }

    // Shadow zone check: If ray bends upwards and escapes back to surface without hitting bottom
    if (angleRad < -0.1 && currZ < 80 && totalDistance > 500) {
      isLostInShadow = true;
    }

    const currentTL = calculateTransmissionLoss(totalDistance, freqKHz);
    if (currentTL > maxAllowableTL * 1.4) {
      // Ray dissipated completely
      segments.push({
        x1: prevX,
        y1: prevZ,
        x2: currX,
        y2: currZ,
        timeMs: totalTimeMs,
        attenuationDb: currentTL,
        intensity: 0.05,
        freqKHz,
        color,
        isReflected: false,
        isSeafloorHit: false,
        isLostInShadow: true
      });
      break;
    }

    segments.push({
      x1: prevX,
      y1: prevZ,
      x2: currX,
      y2: currZ,
      timeMs: totalTimeMs,
      attenuationDb: currentTL,
      intensity: Math.max(0.15, 1 - currentTL / 120),
      freqKHz,
      color,
      isReflected,
      isSeafloorHit: false,
      isLostInShadow
    });
  }

  return {
    id: `ray-${freqKHz}-${initialAngleDeg}`,
    bandId: band ? band.id : 'cw',
    freqKHz,
    launchAngleDeg: initialAngleDeg,
    color,
    segments,
    pulseProgress: 0,
    isReturning: false
  };
}

/**
 * Standard Multi-band CSS Stepped Rolling Channels
 */
export const STANDARD_CHIRP_BANDS: ChirpBand[] = [
  {
    id: 'band-subbottom',
    name: 'Channel 0: Deep Penetrator (Turbid / Strata)',
    fStart: 100,
    fEnd: 140,
    durationMs: 1.5,
    color: '#f59e0b', // Amber
    secondaryColor: '#ef4444',
    description: 'Low-frequency micro-chirp (100-140 kHz, B=40 kHz, Tp=1.5 ms). Maximum penetration for turbid estuaries and deep strata.',
    targetRegime: 'Deep Penetration & Turbid Estuaries'
  },
  {
    id: 'band-midwater',
    name: 'Channel 1: Halocline / Thermocline Profiler',
    fStart: 200,
    fEnd: 250,
    durationMs: 1.0,
    color: '#10b981', // Emerald
    secondaryColor: '#06b6d4',
    description: 'Mid-band micro-chirp (200-250 kHz, B=50 kHz, Tp=1.0 ms). Mid-water profiling across halocline & thermocline velocity boundaries.',
    targetRegime: 'Mid-Water & Thermocline'
  },
  {
    id: 'band-highres',
    name: 'Channel 2: Centimeter Bathymetric Sounder',
    fStart: 400,
    fEnd: 480,
    durationMs: 0.4,
    color: '#a855f7', // Purple
    secondaryColor: '#ec4899',
    description: 'High-frequency micro-chirp (400-480 kHz, B=80 kHz, Tp=0.4 ms). High-definition centimeter bathymetry in clear water.',
    targetRegime: 'High-Res Bathymetry'
  }
];

/**
 * Ocean Stratification Presets
 */
export const DEFAULT_OCEAN_LAYERS: OceanLayer[] = [
  {
    id: 'layer-mixed',
    name: '1. Surface Mixed Layer (Epipelagic)',
    depthStart: 0,
    depthEnd: 180,
    tempStart: 24,
    tempEnd: 21,
    salinity: 35.2,
    description: 'Sun-warmed, wind-mixed upper layer. Nearly isothermal with high sound speed (~1530 m/s).',
    color: 'rgba(14, 116, 144, 0.25)'
  },
  {
    id: 'layer-thermocline',
    name: '2. Permanent Thermocline (Mesopelagic)',
    depthStart: 180,
    depthEnd: 650,
    tempStart: 21,
    tempEnd: 5,
    salinity: 34.8,
    description: 'Steep temperature plunge creates severe downward refractive ray bending and acoustic shadow zones.',
    color: 'rgba(30, 58, 138, 0.4)'
  },
  {
    id: 'layer-sofar',
    name: '3. Deep Sound Channel (SOFAR Axis)',
    depthStart: 650,
    depthEnd: 950,
    tempStart: 5,
    tempEnd: 3.5,
    salinity: 34.7,
    description: 'Sound speed minimum (~1480 m/s). Acts as a natural acoustic waveguide trapping horizontal rays.',
    color: 'rgba(15, 23, 42, 0.6)'
  },
  {
    id: 'layer-abyss',
    name: '4. Deep Isothermal Layer (Bathypelagic)',
    depthStart: 950,
    depthEnd: 1500,
    tempStart: 3.5,
    tempEnd: 2.0,
    salinity: 34.9,
    description: 'Hydrostatic pressure dominance (+0.0163z) steadily increases sound velocity causing upward ray bending.',
    color: 'rgba(2, 6, 23, 0.85)'
  }
];

// EOF: src/physics/oceanAcoustics.ts

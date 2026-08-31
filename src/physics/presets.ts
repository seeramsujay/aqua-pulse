import { PresetScenario } from '../types/sonar';
import { DEFAULT_OCEAN_LAYERS } from './oceanAcoustics';

export const SCENARIO_PRESETS: PresetScenario[] = [
  {
    id: 'thermocline-trap',
    name: '1. Thermocline Shadow Zone & Trench',
    subtitle: 'Mariana Arc Stratification Profile',
    description:
      'A sharp 17°C thermal gradient across 180m-600m depth creates a severe acoustic shadow zone. High-frequency pings refract horizontally and attenuate before reaching the trench floor.',
    layers: DEFAULT_OCEAN_LAYERS,
    auvDepth: 120,
    terrainType: 'trench',
    problemStatement:
      'Standard 45 kHz single-frequency sonars experience ~35 dB/km Thorp attenuation and extreme Snell downward deflection, blacking out the bathymetric sensor.',
    whyCssWins:
      'Rolling-Channel CSS deploys Band 1 (3-12 kHz) with +18 dB matched filter processing gain to pierce through the shadow zone, while Band 2 locks on the thermocline boundary.'
  },
  {
    id: 'seamount-hydrography',
    name: '2. Submerged Seamount & Ridge Mapping',
    subtitle: 'Complex Topography & Multipath',
    description:
      'Autonomous survey over a volcanic underwater ridge. Steep bathymetric slopes cause multipath echo collisions and shadow pockets behind the summit.',
    layers: [
      {
        id: 'layer-warm',
        name: 'Upper Epipelagic',
        depthStart: 0,
        depthEnd: 250,
        tempStart: 26,
        tempEnd: 22,
        salinity: 35.5,
        description: 'Warm tropical surface layer.',
        color: 'rgba(14, 116, 144, 0.25)'
      },
      {
        id: 'layer-thermo-steep',
        name: 'Sharp Thermocline',
        depthStart: 250,
        depthEnd: 700,
        tempStart: 22,
        tempEnd: 6,
        salinity: 35.1,
        description: 'Steep density gradient.',
        color: 'rgba(30, 58, 138, 0.4)'
      },
      {
        id: 'layer-deep',
        name: 'Abyssal Plain',
        depthStart: 700,
        depthEnd: 1500,
        tempStart: 6,
        tempEnd: 3,
        salinity: 34.8,
        description: 'Cold deep water.',
        color: 'rgba(2, 6, 23, 0.85)'
      }
    ],
    auvDepth: 200,
    terrainType: 'seamount',
    problemStatement:
      'Conventional CW sonars suffer pulse collision between the seamount peak and the deeper flanking seafloor, blurring depth sounding.',
    whyCssWins:
      'Orthogonal chirping with distinct Time-Bandwidth signatures decouples multipath reflections, isolating seamount summit from deep base echoes.'
  },
  {
    id: 'shallow-halocline',
    name: '3. Coastal Halocline & Shelf Slope',
    subtitle: 'Estuarine Outflow & Rapid Salinity Changes',
    description:
      'River discharge creates low-salinity surface water (31 PSU) resting over dense oceanic brine (36 PSU). Rapid sound speed inversion traps acoustic energy in a surface duct.',
    layers: [
      {
        id: 'layer-brackish',
        name: 'Brackish Surface Duct',
        depthStart: 0,
        depthEnd: 120,
        tempStart: 18,
        tempEnd: 16,
        salinity: 31.0,
        description: 'Low salinity surface water from river outflow.',
        color: 'rgba(13, 148, 136, 0.3)'
      },
      {
        id: 'layer-halocline',
        name: 'Halocline Barrier',
        depthStart: 120,
        depthEnd: 400,
        tempStart: 16,
        tempEnd: 10,
        salinity: 35.8,
        description: 'Steep salinity leap (+4.8 PSU) causing upward acoustic refraction.',
        color: 'rgba(30, 58, 138, 0.45)'
      },
      {
        id: 'layer-shelf-floor',
        name: 'Continental Slope Deep',
        depthStart: 400,
        depthEnd: 1500,
        tempStart: 10,
        tempEnd: 4,
        salinity: 35.2,
        description: 'Cold stable shelf water.',
        color: 'rgba(2, 6, 23, 0.85)'
      }
    ],
    auvDepth: 60,
    terrainType: 'continental-slope',
    problemStatement:
      'The salinity jump creates a critical angle barrier where conventional acoustic pings suffer total internal reflection at 120m depth.',
    whyCssWins:
      'Rolling frequency stepped sweeping penetrates beyond the critical angle and de-chirping pinpoints both the halocline layer interface and the underlying slope.'
  }
];

// EOF: src/physics/presets.ts

import React from 'react';
import { OceanLayer, Submersible, ChirpBand, EchoReturn, SonarMode } from '../../types/sonar';
import {
  getOceanPropertiesAtDepth,
  calculateThorpAttenuation,
  calculateCssProcessingGain,
} from '../../physics/oceanAcoustics';

interface DecisionTrailProps {
  layers: OceanLayer[];
  submersible: Submersible;
  activeBand: ChirpBand;
  latestEcho: EchoReturn | undefined;
  mode: SonarMode;
  turbidity: number;
  temperature: number;
  salinity: number;
}

export const DecisionTrail: React.FC<DecisionTrailProps> = ({
  layers,
  submersible,
  activeBand,
  latestEcho,
  mode,
  turbidity,
  temperature,
  salinity,
}) => {
  const props = getOceanPropertiesAtDepth(layers, submersible.depth);
  const centerFreq = (activeBand.fStart + activeBand.fEnd) / 2;
  const thorpAtten = calculateThorpAttenuation(centerFreq);
  const bandwidthHz = (activeBand.fEnd - activeBand.fStart) * 1000;
  const durationSec = activeBand.durationMs / 1000;
  const processingGain = calculateCssProcessingGain(bandwidthHz, durationSec);

  const stageStyle: React.CSSProperties = {
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-default)',
    borderRadius: '6px',
    padding: '10px 12px',
  };

  const headerStyle: React.CSSProperties = {
    fontFamily: 'Inter, sans-serif',
    fontWeight: 600,
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const connector = (
    <div
      style={{
        width: '1px',
        height: '14px',
        background: 'var(--border-default)',
        margin: '0 auto',
      }}
    />
  );

  let resultStatusText = 'Awaiting echo...';
  let resultStatusColor = 'var(--text-dim)';
  if (latestEcho) {
    if (latestEcho.success) {
      resultStatusText = 'Echo LOCKED';
      resultStatusColor = '#63C79A';
    } else {
      resultStatusText = 'Echo LOST';
      resultStatusColor = '#D96B6B';
    }
  }

  return (
    <div className="flex flex-col w-full">
      {/* Stage 1 - ENVIRONMENT */}
      <div style={stageStyle}>
        <div style={headerStyle}>
          <span>1. Environment</span>
          <span className="text-[10px] text-slate-500 font-mono">CTD In-situ</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>T: </span>{temperature.toFixed(1)}°C</div>
          <div><span style={{ color: 'var(--text-muted)' }}>S: </span>{salinity.toFixed(1)} PSU</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Turb: </span>{turbidity.toFixed(0)} NTU</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Depth: </span>{submersible.depth.toFixed(0)}m</div>
        </div>
      </div>

      {connector}

      {/* Stage 2 - ACOUSTIC PHYSICS */}
      <div style={stageStyle}>
        <div style={headerStyle}>
          <span>2. Acoustic Physics</span>
          <span className="text-[10px] text-slate-500 font-mono">Snell &amp; Thorp</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>c(z): </span>{props.soundSpeed.toFixed(0)} m/s</div>
          <div><span style={{ color: 'var(--text-muted)' }}>α(f): </span>{thorpAtten.toFixed(1)} dB/km</div>
        </div>
      </div>

      {connector}

      {/* Stage 3 - TINYML DECISION */}
      <div style={stageStyle}>
        <div style={headerStyle}>
          <span>3. TinyML Decision</span>
          <span className="text-[10px] text-slate-500 font-mono">Edge Policy</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Policy: </span>{activeBand.name.split(' ')[0]}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Latency: </span>0.42 ms</div>
        </div>
      </div>

      {connector}

      {/* Stage 4 - WAVEFORM */}
      <div style={stageStyle}>
        <div style={headerStyle}>
          <span>4. Waveform Synthesis</span>
          <span className="text-[10px] text-slate-500 font-mono">Matched Filter</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
          <div><span style={{ color: 'var(--text-muted)' }}>Type: </span>{mode === 'rc-css' ? 'LFM Chirp' : 'CW Tone'}</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Band: </span>{activeBand.fStart}-{activeBand.fEnd} kHz</div>
          <div><span style={{ color: 'var(--text-muted)' }}>Tp: </span>{activeBand.durationMs} ms</div>
          <div><span style={{ color: 'var(--text-muted)' }}>B: </span>{activeBand.fEnd - activeBand.fStart} kHz</div>
          <div className="col-span-2">
            <span style={{ color: 'var(--text-muted)' }}>Gain Gp: </span>
            <span style={{ color: '#43C7D9' }}>+{processingGain.toFixed(1)} dB</span>
          </div>
        </div>
      </div>

      {connector}

      {/* Stage 5 - RESULT */}
      <div style={stageStyle}>
        <div style={headerStyle}>
          <span>5. Acoustic Result</span>
          <span className="font-semibold" style={{ color: resultStatusColor }}>{resultStatusText}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 font-mono text-[11px]" style={{ color: 'var(--text-primary)' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Depth: </span>
            {latestEcho ? `${latestEcho.calculatedDepthM.toFixed(1)}m` : '--'}
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>SNR: </span>
            {latestEcho ? `${latestEcho.snrDb > 0 ? '+' : ''}${latestEcho.snrDb.toFixed(1)} dB` : '--'}
          </div>
        </div>
      </div>
    </div>
  );
};

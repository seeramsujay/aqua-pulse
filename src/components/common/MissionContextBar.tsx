import React from 'react';
import { Submersible, ChirpBand, SonarMode, PresetScenario, EchoReturn, OceanLayer } from '../../types/sonar';
import { getOceanPropertiesAtDepth } from '../../physics/oceanAcoustics';

interface MissionContextBarProps {
  submersible: Submersible;
  activeBand: ChirpBand;
  mode: SonarMode;
  activeScenario: PresetScenario;
  isAutoPinging: boolean;
  latestEcho: EchoReturn | undefined;
  layers: OceanLayer[];
  energySaved: number;
}

export const MissionContextBar: React.FC<MissionContextBarProps> = ({
  submersible,
  activeBand,
  mode: _mode,
  activeScenario: _activeScenario,
  isAutoPinging,
  latestEcho,
  layers,
  energySaved,
}) => {
  const oceanProps = getOceanPropertiesAtDepth(layers, submersible.depth);
  const soundSpeedStr = `${oceanProps.soundSpeed.toFixed(0)} m/s`;

  // SNR formatting and coloring
  let snrColor = 'var(--text-muted)';
  let snrText = '--';
  if (latestEcho?.snrDb != null) {
    snrText = `${latestEcho.snrDb > 0 ? '+' : ''}${latestEcho.snrDb.toFixed(1)} dB`;
    if (latestEcho.snrDb > 8) {
      snrColor = '#63C79A';
    } else if (latestEcho.snrDb >= 3) {
      snrColor = '#D9A441';
    } else {
      snrColor = '#D96B6B';
    }
  }

  // Channel short name
  const channelShort = `${activeBand.name.split(' ')[0]} ${activeBand.fStart}-${activeBand.fEnd}k`;

  return (
    <div
      className="w-full"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-default)',
        borderRadius: '6px',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* 1. DEPTH */}
      <div className="flex flex-col">
        <span className="telemetry-label" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>DEPTH</span>
        <span className="font-mono text-[14px] font-semibold" style={{ color: '#D9A441' }}>
          {submersible.depth.toFixed(0)}m
        </span>
      </div>

      {/* 2. CHANNEL */}
      <div className="flex flex-col">
        <span className="telemetry-label" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>CHANNEL</span>
        <span className="font-mono text-[14px] font-semibold" style={{ color: 'var(--text-primary)' }}>
          {channelShort}
        </span>
      </div>

      {/* 3. SNR */}
      <div className="flex flex-col">
        <span className="telemetry-label" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>SNR</span>
        <span className="font-mono text-[14px] font-semibold" style={{ color: snrColor }}>
          {snrText}
        </span>
      </div>

      {/* 4. c(z) */}
      <div className="flex flex-col">
        <span className="telemetry-label" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>c(z)</span>
        <span className="font-mono text-[14px] font-semibold" style={{ color: '#43C7D9' }}>
          {soundSpeedStr}
        </span>
      </div>

      {/* 5. ENERGY SAVED */}
      <div className="flex flex-col">
        <span className="telemetry-label" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>ENERGY SAVED</span>
        <span className="font-mono text-[14px] font-semibold" style={{ color: '#63C79A' }}>
          {energySaved.toFixed(0)}%
        </span>
      </div>

      {/* 6. STATE */}
      <div className="flex flex-col">
        <span className="telemetry-label" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>STATE</span>
        <span className="font-mono text-[14px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
          {submersible.status.toUpperCase()}
        </span>
      </div>

      {/* 7. SWEEP */}
      <div className="flex flex-col">
        <span className="telemetry-label" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>SWEEP</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span
            className="status-dot"
            style={{
              backgroundColor: isAutoPinging ? '#63C79A' : 'var(--text-dim)',
            }}
          />
          <span
            className="font-mono text-[12px] font-semibold"
            style={{ color: isAutoPinging ? '#63C79A' : 'var(--text-dim)' }}
          >
            {isAutoPinging ? 'AUTO' : 'OFF'}
          </span>
        </div>
      </div>
    </div>
  );
};

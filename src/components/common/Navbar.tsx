import React, { useState, useEffect } from 'react';
import { PresetScenario } from '../../types/sonar';
import { Radio, BookOpen, Bot, Volume2, VolumeX, Box } from 'lucide-react';

export const MAIN_TABS = [
  { id: 'MISSION', label: 'Mission' },
  { id: 'ACOUSTICS', label: 'Acoustics' },
  { id: 'WAVEFORMS', label: 'Waveforms' },
  { id: 'BATHYMETRY', label: 'Bathymetry' },
  { id: 'COGNITION', label: 'Cognition' },
  { id: 'SYSTEM', label: 'System' },
] as const;

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  scenarios: PresetScenario[];
  activeScenario: PresetScenario;
  onSelectScenario: (scenario: PresetScenario) => void;
  isAutoPinging?: boolean;
  setIsAutoPinging?: (val: boolean) => void;
  onOpenTheory: () => void;
  onOpenRag?: () => void;
  onOpen3D?: () => void;
  isAudioEnabled?: boolean;
  setIsAudioEnabled?: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  scenarios,
  activeScenario,
  onSelectScenario,
  isAutoPinging: _isAutoPinging,
  setIsAutoPinging: _setIsAutoPinging,
  onOpenTheory,
  onOpenRag,
  onOpen3D,
  isAudioEnabled,
  setIsAudioEnabled,
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      <div className="w-full max-w-[1920px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* ── Brand ── */}
        <div className="flex items-center gap-3">
          {/* Sonar Logo */}
          <div
            className="flex items-center justify-center w-8 h-8 rounded"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
            }}
          >
            <Radio className="w-4 h-4" style={{ color: '#43C7D9' }} />
          </div>

          {/* Title */}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-extrabold tracking-wider font-mono">
                <span style={{ color: 'var(--text-primary)' }}>AQUA</span>
                <span style={{ color: '#43C7D9' }}>PULSE</span>
              </h1>
              <span className="hud-chip">
                RC-CSS SONAR
              </span>
            </div>
            <p className="text-[10px] font-sans tracking-wide mt-0.5 hidden sm:block" style={{ color: 'var(--text-muted)' }}>
              Cognitive Software-Defined Acoustic Payload · Ground Control Console
            </p>
          </div>
        </div>

        {/* ── Scenario Selector ── */}
        <div className="flex items-center gap-2">
          <span className="telemetry-label hidden md:inline text-[11px]" style={{ color: 'var(--text-muted)' }}>
            PROFILE:
          </span>
          <select
            id="scenario-select"
            value={activeScenario.id}
            onChange={(e) => {
              const selected = scenarios.find((s) => s.id === e.target.value);
              if (selected) onSelectScenario(selected);
            }}
            className="font-mono text-[11px] rounded px-2.5 py-1.5 focus:outline-none"
            style={{
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id} style={{ background: '#0B1720', color: '#E7EEF1' }}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* ── Actions & Status ── */}
        <div className="flex items-center gap-2.5">
          {/* Live status and clock */}
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded font-mono text-[11px]"
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
            }}
          >
            <span className="flex items-center gap-1.5 font-semibold text-[11px]" style={{ color: '#63C79A' }}>
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#63C79A' }} />
              ONLINE
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              {time.toLocaleTimeString('en-US', { hour12: false })}
            </span>
          </div>

          {/* 3D Viewport button */}
          {onOpen3D && (
            <button
              onClick={onOpen3D}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold transition-colors"
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-default)',
                color: '#63C79A',
              }}
              title="Open 3D CAD & Ray Physics Viewport"
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D</span>
            </button>
          )}

          {/* RAG assistant button */}
          {onOpenRag && (
            <button
              onClick={onOpenRag}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold transition-colors"
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-default)',
                color: '#43C7D9',
              }}
              title="Ask MoES/NIOT RAG Assistant"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>RAG</span>
            </button>
          )}

          {/* Theory guide */}
          <button
            id="theory-btn"
            onClick={onOpenTheory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[11px] font-mono font-semibold transition-colors"
            style={{
              background: 'var(--bg-inset)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-secondary)',
            }}
            title="Acoustic Theory Reference"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>THEORY</span>
          </button>

          {/* Audio toggle */}
          {setIsAudioEnabled && (
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className="p-1.5 rounded text-xs font-mono transition-colors flex items-center"
              style={{
                background: isAudioEnabled ? 'var(--bg-elevated)' : 'var(--bg-inset)',
                border: '1px solid',
                borderColor: isAudioEnabled ? '#2A8997' : 'var(--border-default)',
                color: isAudioEnabled ? '#43C7D9' : 'var(--text-muted)',
              }}
              title={isAudioEnabled ? 'Mute Sonar Audio' : 'Enable Down-converted Sonar Audio'}
            >
              {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── Tab Navigation Bar ── */}
      <div
        className="w-full max-w-[1920px] mx-auto flex items-center overflow-x-auto"
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '0 16px',
        }}
      >
        {MAIN_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '8px 16px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '12px',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                border: 'none',
                borderBottom: isActive ? '2px solid #43C7D9' : '2px solid transparent',
                background: 'transparent',
                color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'color 0.15s, border-color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};

import React, { useRef, useEffect } from 'react';
import { Terminal, ShieldAlert, CheckCircle2, RefreshCw, Radio, Layers } from 'lucide-react';

export interface MissionEvent {
  id: string;
  timestamp: string;
  type: 'PING' | 'ECHO_LOCK' | 'SHADOW_ZONE' | 'CHANNEL_ROLL' | 'SCENARIO_CHANGE' | 'SYSTEM';
  title: string;
  details: string;
  bandColor?: string;
}

interface MissionLogProps {
  events: MissionEvent[];
  onClearLogs?: () => void;
}

export const MissionLog: React.FC<MissionLogProps> = ({ events, onClearLogs }) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [events]);

  const getEventIcon = (type: MissionEvent['type']) => {
    switch (type) {
      case 'PING':
        return <Radio className="w-3 h-3 text-[#43C7D9]" />;
      case 'ECHO_LOCK':
        return <CheckCircle2 className="w-3 h-3 text-[#63C79A]" />;
      case 'SHADOW_ZONE':
        return <ShieldAlert className="w-3 h-3 text-[#D96B6B]" />;
      case 'CHANNEL_ROLL':
        return <RefreshCw className="w-3 h-3 text-[#D9A441]" />;
      case 'SCENARIO_CHANGE':
        return <Layers className="w-3 h-3 text-[#9B8EC4]" />;
      default:
        return <Terminal className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="instrument-panel flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="instrument-panel-header">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded"
            style={{
              background: '#12232D',
              border: '1px solid #20333D',
              padding: '6px',
            }}
          >
            <Terminal className="w-3.5 h-3.5 text-[#43C7D9]" />
          </div>
          <div>
            <div className="instrument-panel-title">Tactical Mission Log</div>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Real-time Acoustic Event Stream</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hud-chip">
            {events.length} EVENTS
          </span>
          {onClearLogs && (
            <button
              onClick={onClearLogs}
              className="hud-chip transition-colors cursor-pointer"
              style={{
                background: '#12232D',
                borderColor: 'var(--border-default)',
                color: 'var(--text-muted)',
              }}
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 px-4 py-2 space-y-2 overflow-y-auto font-mono text-[11px] select-text"
        style={{ minHeight: '320px', maxHeight: '480px' }}
      >
        {events.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-slate-600 space-y-1">
            <Terminal className="w-6 h-6 opacity-30" />
            <span className="text-[10px]">Awaiting acoustic transmissions...</span>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="p-2 rounded flex items-start gap-2.5 transition-colors"
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                className="p-1 rounded mt-0.5 shrink-0"
                style={{
                  background: '#12232D',
                  border: '1px solid #20333D',
                }}
              >
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {event.title}
                  </span>
                  <span className="text-[9px] shrink-0 font-mono" style={{ color: 'var(--text-muted)' }}>
                    {event.timestamp}
                  </span>
                </div>
                <p className="text-[10px] mt-0.5 leading-relaxed break-words font-sans" style={{ color: 'var(--text-secondary)' }}>
                  {event.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Status Indicator */}
      <div
        className="px-4 py-2 flex items-center justify-between text-[10px] font-mono"
        style={{
          background: 'var(--bg-inset)',
          borderTop: '1px solid var(--border-subtle)',
          color: 'var(--text-muted)',
        }}
      >
        <div className="flex items-center gap-2">
          <span className="status-dot" style={{ backgroundColor: '#63C79A' }} />
          <span>CARRIER LOCK: ACTIVE</span>
        </div>
        <span style={{ color: 'var(--text-dim)' }}>INT8 TinyML INFERENCE: &lt;1.2ms</span>
      </div>
    </div>
  );
};

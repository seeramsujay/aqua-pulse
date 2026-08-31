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
        return <Radio className="w-3 h-3 text-cyan-400" />;
      case 'ECHO_LOCK':
        return <CheckCircle2 className="w-3 h-3 text-emerald-400" />;
      case 'SHADOW_ZONE':
        return <ShieldAlert className="w-3 h-3 text-rose-400" />;
      case 'CHANNEL_ROLL':
        return <RefreshCw className="w-3 h-3 text-amber-400" />;
      case 'SCENARIO_CHANGE':
        return <Layers className="w-3 h-3 text-indigo-400" />;
      default:
        return <Terminal className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="glass-panel panel-accent-cyan flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3.5">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-cyan-900/50 border border-cyan-700/40">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div>
              <div className="panel-title text-cyan-400">Tactical Mission Log</div>
              <p className="text-[9px] text-slate-500 mt-0.5">Real-time Acoustic Event Stream</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="hud-chip bg-slate-900/80 text-cyan-400 border-cyan-800/50">
              {events.length} EVENTS
            </span>
            {onClearLogs && (
              <button
                onClick={onClearLogs}
                className="text-[9px] font-mono text-slate-500 hover:text-slate-300 transition-colors"
              >
                CLEAR
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Events List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 px-4 py-2 space-y-2 overflow-y-auto font-mono text-[11px] select-text"
        style={{ maxHeight: '280px' }}
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
              className="p-2 rounded-lg border border-white/[0.05] bg-black/40 flex items-start gap-2.5 transition-all hover:bg-white/[0.02]"
            >
              <div className="p-1 rounded bg-slate-900/90 border border-white/[0.08] mt-0.5 shrink-0">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-slate-200 truncate">{event.title}</span>
                  <span className="text-[9px] text-slate-500 shrink-0">{event.timestamp}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed break-words">
                  {event.details}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer / Status Indicator */}
      <div className="px-4 py-2 border-t border-white/[0.06] bg-black/30 flex items-center justify-between text-[10px] font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="status-dot text-emerald-400" style={{ backgroundColor: '#34d399' }} />
          <span>CARRIER LOCK: ACTIVE</span>
        </div>
        <span className="text-slate-600">INT8 TinyML INFERENCE: &lt;1.2ms</span>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Radio, ShieldCheck, Cpu, Waves, Activity, Terminal } from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
}

interface BootLog {
  id: number;
  text: string;
  subtext?: string;
  status: 'PENDING' | 'SUCCESS' | 'ACTIVE';
  icon?: React.ReactNode;
}

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  const logs: BootLog[] = [
    {
      id: 0,
      text: 'AQUAPULSE GROUND CONTROL TELEMETRY SUITE v2.4.0',
      subtext: 'MoES / NIOT Autonomous Hydrographic Payload Interface Initializing...',
      status: currentStep > 0 ? 'SUCCESS' : 'ACTIVE',
      icon: <Terminal className="w-3.5 h-3.5 text-[#43C7D9]" />
    },
    {
      id: 1,
      text: 'MACKENZIE (1981) VELOCITY & SNELL RAY TRACER ENGINE',
      subtext: 'Calculating c(T, S, z) sound speed gradients across 4 bathymetric strata...',
      status: currentStep > 1 ? 'SUCCESS' : currentStep === 1 ? 'ACTIVE' : 'PENDING',
      icon: <Waves className="w-3.5 h-3.5 text-[#43C7D9]" />
    },
    {
      id: 2,
      text: 'ROLLING-CHANNEL CHIRP SPREAD SPECTRUM (RC-CSS) SYNTHESIZER',
      subtext: 'Bands: Ch0 (100-140kHz), Ch1 (200-250kHz), Ch2 (400-480kHz) Matched Filters Loaded',
      status: currentStep > 2 ? 'SUCCESS' : currentStep === 2 ? 'ACTIVE' : 'PENDING',
      icon: <Radio className="w-3.5 h-3.5 text-[#D9A441]" />
    },
    {
      id: 3,
      text: 'INT8 TINYML COGNITIVE POLICY & ADAPTIVE ACOUSTIC AGENT',
      subtext: 'Zero-overhead DMA timing synced with OPA1612 4th-order Sallen-Key analog filter',
      status: currentStep > 3 ? 'SUCCESS' : currentStep === 3 ? 'ACTIVE' : 'PENDING',
      icon: <Cpu className="w-3.5 h-3.5 text-[#9B8EC4]" />
    },
    {
      id: 4,
      text: 'TACTICAL ACOUSTIC TELEMETRY BRIDGE CONNECTED',
      subtext: 'Subsea AUV Carrier lock established. Monostatic blind zone restricted to <1.1m.',
      status: currentStep >= 4 ? 'SUCCESS' : 'PENDING',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-[#63C79A]" />
    }
  ];

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 400);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < logs.length) {
          return prev + 1;
        } else {
          clearInterval(stepInterval);
          setTimeout(handleFinish, 600);
          return prev;
        }
      });
    }, 450);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 4;
      });
    }, 80);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 select-none transition-opacity duration-400 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: '#071018',
        color: 'var(--text-primary)',
      }}
    >
      {/* Central Emblem - Static Instrument Box */}
      <div className="mb-6 flex items-center justify-center">
        <div
          className="w-16 h-16 rounded flex items-center justify-center"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
          }}
        >
          <Activity className="w-8 h-8 text-[#43C7D9]" />
        </div>
      </div>

      {/* Title & Subheading */}
      <div className="text-center mb-6 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded hud-chip mb-2">
          <span>CYBER-PHYSICAL SONAR PAYLOAD</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-wider font-mono text-white">
          AQUA<span className="text-[#43C7D9]">PULSE</span> GROUND STATION
        </h1>
        <p className="text-xs font-mono mt-1" style={{ color: 'var(--text-muted)' }}>
          Ministry of Earth Sciences (MoES) / NIOT Deep-Sea Acoustic Sounding Protocol
        </p>
      </div>

      {/* Boot Log Console */}
      <div
        className="w-full max-w-2xl rounded p-4 mb-6 font-mono text-xs space-y-3"
        style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
        }}
      >
        {logs.map((log) => (
          <div
            key={log.id}
            className={`flex items-start gap-3 transition-opacity duration-200 ${
              log.status === 'PENDING'
                ? 'opacity-25'
                : log.status === 'ACTIVE'
                ? 'opacity-100'
                : 'opacity-90'
            }`}
          >
            <div
              className="p-1 rounded mt-0.5"
              style={{
                background: 'var(--bg-inset)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              {log.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="font-bold text-[11px] truncate tracking-wide"
                  style={{
                    color: log.status === 'ACTIVE' ? '#43C7D9' : 'var(--text-primary)',
                  }}
                >
                  {log.text}
                </span>
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider font-mono"
                  style={{
                    background:
                      log.status === 'SUCCESS'
                        ? 'rgba(99, 199, 154, 0.15)'
                        : log.status === 'ACTIVE'
                        ? 'rgba(67, 199, 217, 0.15)'
                        : '#12232D',
                    color:
                      log.status === 'SUCCESS'
                        ? '#63C79A'
                        : log.status === 'ACTIVE'
                        ? '#43C7D9'
                        : 'var(--text-muted)',
                    border: '1px solid',
                    borderColor:
                      log.status === 'SUCCESS'
                        ? '#63C79A'
                        : log.status === 'ACTIVE'
                        ? '#43C7D9'
                        : 'var(--border-subtle)',
                  }}
                >
                  {log.status === 'SUCCESS' ? 'OK' : log.status === 'ACTIVE' ? 'INITIALIZING' : 'WAIT'}
                </span>
              </div>
              {log.subtext && (
                <p className="text-[10px] mt-0.5 leading-relaxed font-sans" style={{ color: 'var(--text-muted)' }}>
                  {log.subtext}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar & Actions */}
      <div className="w-full max-w-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
          <span>SYSTEM READY: {progress}%</span>
          <span style={{ color: '#43C7D9' }}>STATUS: INITIALIZING ACOUSTIC HARDWARE</span>
        </div>
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{
            background: 'var(--bg-inset)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div
            className="h-full transition-all duration-150 rounded-full"
            style={{
              width: `${progress}%`,
              background: '#43C7D9',
            }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-[10px] font-mono" style={{ color: 'var(--text-dim)' }}>
            Press <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>ESC</kbd> or <kbd className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--bg-inset)', border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>SPACE</kbd> to enter console
          </span>
          <button
            onClick={handleFinish}
            className="px-4 py-1.5 rounded font-mono text-[11px] font-bold tracking-wider uppercase transition-colors"
            style={{
              background: '#43C7D9',
              color: '#071018',
              border: 'none',
            }}
          >
            ENTER CONSOLE →
          </button>
        </div>
      </div>
    </div>
  );
};

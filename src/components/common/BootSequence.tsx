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
      icon: <Terminal className="w-3.5 h-3.5 text-cyan-400" />
    },
    {
      id: 1,
      text: 'MACKENZIE (1981) VELOCITY & SNELL RAY TRACER ENGINE',
      subtext: 'Calculating c(T, S, z) sound speed gradients across 4 bathymetric strata...',
      status: currentStep > 1 ? 'SUCCESS' : currentStep === 1 ? 'ACTIVE' : 'PENDING',
      icon: <Waves className="w-3.5 h-3.5 text-teal-400" />
    },
    {
      id: 2,
      text: 'ROLLING-CHANNEL CHIRP SPREAD SPECTRUM (RC-CSS) SYNTHESIZER',
      subtext: 'Bands: Ch0 (100-140kHz), Ch1 (200-250kHz), Ch2 (400-480kHz) Matched Filters Loaded',
      status: currentStep > 2 ? 'SUCCESS' : currentStep === 2 ? 'ACTIVE' : 'PENDING',
      icon: <Radio className="w-3.5 h-3.5 text-amber-400" />
    },
    {
      id: 3,
      text: 'INT8 TINYML COGNITIVE POLICY & ADAPTIVE ACOUSTIC AGENT',
      subtext: 'Zero-overhead DMA timing synced with OPA1612 4th-order Sallen-Key analog filter',
      status: currentStep > 3 ? 'SUCCESS' : currentStep === 3 ? 'ACTIVE' : 'PENDING',
      icon: <Cpu className="w-3.5 h-3.5 text-indigo-400" />
    },
    {
      id: 4,
      text: 'TACTICAL ACOUSTIC TELEMETRY BRIDGE CONNECTED',
      subtext: 'Subsea AUV Carrier lock established. Monostatic blind zone restricted to <1.1m.',
      status: currentStep >= 4 ? 'SUCCESS' : 'PENDING',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
    }
  ];

  const handleFinish = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 500);
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
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-[#020612] text-slate-100 select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        backgroundImage: `
          radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0, 180, 216, 0.08) 0%, transparent 80%),
          repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 2px, transparent 2px, transparent 4px)
        `
      }}
    >
      {/* Central Radar Pulse Emblem */}
      <div className="relative mb-8 flex items-center justify-center">
        <div className="w-24 h-24 rounded-full border border-cyan-500/20 flex items-center justify-center animate-ping-slow absolute inset-0 m-auto" />
        <div className="w-32 h-32 rounded-full border border-cyan-500/10 flex items-center justify-center animate-pulse-slow absolute inset-0 m-auto" />
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-950/80 to-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.25)] relative z-10">
          <Activity className="w-10 h-10 text-cyan-400 animate-pulse" />
        </div>
      </div>

      {/* Title & Organization Subheading */}
      <div className="text-center mb-6 max-w-xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-700/50 text-cyan-300 font-mono text-[11px] tracking-widest uppercase mb-2">
          <Radio className="w-3.5 h-3.5 animate-spin" />
          <span>CYBER-PHYSICAL SONAR PAYLOAD</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-wider font-mono text-white">
          AQUA<span className="text-cyan-400">PULSE</span> GROUND STATION
        </h1>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Ministry of Earth Sciences (MoES) / NIOT Deep-Sea Acoustic Sounding Protocol
        </p>
      </div>

      {/* Boot Log Console */}
      <div className="w-full max-w-2xl bg-black/60 border border-slate-800/80 rounded-xl p-4 shadow-2xl backdrop-blur-xl mb-6 font-mono text-xs space-y-3">
        {logs.map((log) => (
          <div
            key={log.id}
            className={`flex items-start gap-3 transition-all duration-300 ${
              log.status === 'PENDING'
                ? 'opacity-20 translate-y-1'
                : log.status === 'ACTIVE'
                ? 'opacity-100 text-cyan-300'
                : 'opacity-85 text-slate-300'
            }`}
          >
            <div className="p-1 rounded bg-slate-900 border border-slate-800 mt-0.5">
              {log.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[11px] truncate tracking-wide">{log.text}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                    log.status === 'SUCCESS'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                      : log.status === 'ACTIVE'
                      ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 animate-pulse'
                      : 'bg-slate-900 text-slate-600'
                  }`}
                >
                  {log.status === 'SUCCESS' ? 'OK' : log.status === 'ACTIVE' ? 'INITIALIZING' : 'WAIT'}
                </span>
              </div>
              {log.subtext && (
                <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{log.subtext}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar & Actions */}
      <div className="w-full max-w-2xl flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>SYSTEM READY: {progress}%</span>
          <span className="text-cyan-400">STATUS: INITIALIZING ACOUSTIC HARDWARE</span>
        </div>
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 transition-all duration-150 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-3">
          <span className="text-[10px] font-mono text-slate-500">
            Press <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">ESC</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-900 border border-slate-700 rounded text-slate-300">SPACE</kbd> to enter console
          </span>
          <button
            onClick={handleFinish}
            className="px-4 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 font-mono text-[11px] font-bold tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(0,240,255,0.15)] hover:shadow-[0_0_20px_rgba(0,240,255,0.3)]"
          >
            ENTER CONSOLE →
          </button>
        </div>
      </div>
    </div>
  );
};

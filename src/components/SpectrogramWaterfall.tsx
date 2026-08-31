import React, { useRef, useEffect } from 'react';
import { EchoReturn, ChirpBand, SonarMode } from '../types/sonar';

interface SpectrogramWaterfallProps {
  echoes: EchoReturn[];
  activeBand: ChirpBand;
  mode: SonarMode;
  isPinging: boolean;
}

export const SpectrogramWaterfall: React.FC<SpectrogramWaterfallProps> = ({
  echoes,
  activeBand,
  mode,
  isPinging
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let timeOffset = 0;

    const render = () => {
      timeOffset += 1;
      const w = canvas.width;
      const h = canvas.height;

      // Dark Spectrogram Waterfall Background
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, w, h);

      // Frequency Grid Lines (0 kHz to 80 kHz)
      const maxFreq = 80;
      const freqStep = 10;
      ctx.font = '9px monospace';

      for (let f = 0; f <= maxFreq; f += freqStep) {
        const y = h - (f / maxFreq) * h;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.fillText(`${f}k`, 4, y - 2);
      }

      // Time Grid Lines (vertical scrolling markers)
      for (let x = (timeOffset % 50); x < w; x += 50) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Draw Active Transmitted CSS Chirps / CW Tone
      const chirpX = w - 80;
      if (isPinging) {
        if (mode === 'rc-css') {
          // Render Linear Frequency Chirp Sweep Line (Up-chirp)
          const y1 = h - (activeBand.fStart / maxFreq) * h;
          const y2 = h - (activeBand.fEnd / maxFreq) * h;

          ctx.strokeStyle = activeBand.color;
          ctx.lineWidth = 3.5;
          ctx.shadowColor = activeBand.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(chirpX, y1);
          ctx.lineTo(chirpX + 30, y2);
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Bandwidth Ribbon Highlight
          ctx.fillStyle = `${activeBand.color}22`;
          ctx.fillRect(chirpX, y2, 30, y1 - y2);
        } else {
          // Render CW Fixed Frequency Tone Line
          const yCW = h - (45 / maxFreq) * h;
          ctx.strokeStyle = '#00f0ff';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#00f0ff';
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.moveTo(chirpX, yCW);
          ctx.lineTo(chirpX + 25, yCW);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Draw Echo Returns (De-chirped Matched Filter Spikes)
      const now = Date.now();
      echoes.forEach((echo) => {
        const ageSec = (now - echo.timestamp) / 1000;
        if (ageSec > 12) return; // Discard older echoes

        const echoX = w - 80 - ageSec * 45;
        if (echoX < 20) return;

        const echoY = h - (echo.freqKHz / maxFreq) * h;

        if (echo.success) {
          // Successful matched-filter dechirp detection peak
          ctx.fillStyle = echo.color;
          ctx.shadowColor = echo.color;
          ctx.shadowBlur = 14;

          // Vertical pulse compression spike
          ctx.beginPath();
          ctx.ellipse(echoX, echoY, 3, 14, 0, 0, Math.PI * 2);
          ctx.fill();

          // Matched filter gain annotation
          ctx.font = '8px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.fillText(`+${echo.compressionGainDb.toFixed(0)}dB`, echoX - 12, echoY - 16);
          ctx.shadowBlur = 0;
        } else {
          // Attenuated / Blacked out signal
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(echoX, echoY, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [echoes, activeBand, mode, isPinging]);

  const latestEcho = echoes[echoes.length - 1];

  return (
    <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
        <div>
          <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-purple-400">
            Spectrogram & De-Chirp Waterfall
          </h3>
          <p className="text-[10px] text-slate-400">Matched-Filter Pulse Compression Telemetry</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-800/60 font-mono text-[10px]">
            0 - 80 kHz
          </span>
        </div>
      </div>

      <div className="relative flex-1 w-full bg-slate-950 rounded-lg overflow-hidden border border-slate-800">
        <canvas ref={canvasRef} width={400} height={200} className="w-full h-full block" />
      </div>

      {/* Real-time pulse stats */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono">
        <div className="text-slate-300">
          <span className="text-slate-500">Peak SNR:</span>{' '}
          <span className={latestEcho?.success ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            {latestEcho ? `${latestEcho.snrDb.toFixed(1)} dB` : '-- dB'}
          </span>
        </div>
        <div className="text-slate-300">
          <span className="text-slate-500">Dechirp Gain:</span>{' '}
          <span className="text-purple-300 font-bold">
            {latestEcho && mode === 'rc-css' ? `+${latestEcho.compressionGainDb.toFixed(1)} dB` : '0 dB (CW)'}
          </span>
        </div>
        <div className="text-slate-300">
          <span className="text-slate-500">2-Way TOF:</span>{' '}
          <span className="text-cyan-300 font-bold">
            {latestEcho ? `${latestEcho.travelTimeMs.toFixed(0)} ms` : '-- ms'}
          </span>
        </div>
      </div>
    </div>
  );
};

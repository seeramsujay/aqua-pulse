import React, { useRef, useEffect } from 'react';
import { EchoReturn, ChirpBand, SonarMode } from '../../types/sonar';
import { Activity } from 'lucide-react';
import { useAnimatedValue } from '../../hooks/useAnimatedValue';

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
  const latestEcho = echoes[echoes.length - 1];

  const animSnr = useAnimatedValue(latestEcho?.snrDb ?? 0, 250, 1);
  const animGain = useAnimatedValue(latestEcho?.compressionGainDb ?? 0, 250, 1);
  const animTof = useAnimatedValue(latestEcho?.travelTimeMs ?? 0, 250, 0);

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

      // Background gradient
      ctx.fillStyle = '#010810';
      ctx.fillRect(0, 0, w, h);

      // Subtle scanline texture
      for (let y = 0; y < h; y += 4) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
        ctx.fillRect(0, y, w, 1);
      }

      // Frequency grid lines (up to 500 kHz)
      const maxFreq = 500;
      const freqStep = 100;
      ctx.font = '8px JetBrains Mono, monospace';

      for (let f = 0; f <= maxFreq; f += freqStep) {
        const y = h - (f / maxFreq) * h;

        ctx.strokeStyle = 'rgba(0, 240, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(28, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(100,116,139,0.55)';
        ctx.fillText(`${f}k`, 4, y - 1);
      }

      // Time grid lines (scrolling)
      for (let x = (timeOffset % 50) + 28; x < w; x += 50) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Active band frequency band highlight
      if (mode === 'rc-css') {
        const bandY1 = h - (activeBand.fEnd / maxFreq) * h;
        const bandY2 = h - (activeBand.fStart / maxFreq) * h;
        ctx.fillStyle = `${activeBand.color}10`;
        ctx.fillRect(28, bandY1, w - 28, Math.max(2, bandY2 - bandY1));
      }

      // Transmitted chirp / CW tone
      const chirpX = w - 70;
      if (isPinging) {
        if (mode === 'rc-css') {
          const y1 = h - (activeBand.fStart / maxFreq) * h;
          const y2 = h - (activeBand.fEnd / maxFreq) * h;

          // Ribbon
          const ribbonGrad = ctx.createLinearGradient(chirpX, 0, chirpX + 28, 0);
          ribbonGrad.addColorStop(0, `${activeBand.color}33`);
          ribbonGrad.addColorStop(1, `${activeBand.color}00`);
          ctx.fillStyle = ribbonGrad;
          ctx.fillRect(chirpX, y2, 28, y1 - y2);

          // Chirp line
          ctx.strokeStyle = activeBand.color;
          ctx.lineWidth = 3;
          ctx.shadowColor = activeBand.color;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.moveTo(chirpX, y1);
          ctx.lineTo(chirpX + 28, y2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else {
          const yCW = h - (450 / maxFreq) * h;
          // CW tone glow
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.moveTo(chirpX, yCW);
          ctx.lineTo(chirpX + 22, yCW);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      }

      // Echo returns — matched filter spikes
      const now = Date.now();
      echoes.forEach((echo) => {
        const ageSec = (now - echo.timestamp) / 1000;
        if (ageSec > 12) return;

        const echoX = w - 70 - ageSec * 42;
        if (echoX < 32) return;

        const echoY = h - (echo.freqKHz / maxFreq) * h;
        const fadeOpacity = Math.max(0, 1 - ageSec / 10);

        if (echo.success) {
          ctx.globalAlpha = fadeOpacity;
          ctx.fillStyle = echo.color;
          ctx.shadowColor = echo.color;
          ctx.shadowBlur = 12;
          // Vertical spike
          ctx.beginPath();
          ctx.ellipse(echoX, echoY, 2.5, 12, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;

          // Gain label
          ctx.font = '7px JetBrains Mono, monospace';
          ctx.fillStyle = 'rgba(248,250,252,0.85)';
          ctx.fillText(`+${echo.compressionGainDb.toFixed(0)}dB`, echoX - 10, echoY - 15);
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = fadeOpacity * 0.7;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(echoX, echoY, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      });

      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [echoes, activeBand, mode, isPinging]);

  return (
    <div className="glass-panel panel-accent-purple flex flex-col h-full overflow-hidden">
      <div className="px-4 pt-3.5">
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-violet-900/50 border border-violet-700/40">
              <Activity className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div>
              <div className="panel-title text-violet-400">Spectrogram Waterfall</div>
              <p className="text-[9px] text-slate-500 mt-0.5">Time-Frequency Energy Heatmap</p>
            </div>
          </div>
          <div className="hud-chip bg-violet-950/70 text-violet-400 border-violet-700/50">0 – 500 kHz</div>
        </div>
      </div>

      <div
        className="relative flex-1 mx-4 mb-3 rounded-lg overflow-hidden border border-white/[0.06]"
        style={{ background: '#010810' }}
      >
        <canvas ref={canvasRef} width={400} height={180} className="w-full h-full block" />
        {/* Subtle scan overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px)'
          }}
        />
      </div>

      {/* Telemetry footer */}
      <div className="px-4 pb-3.5 border-t border-white/[0.06] pt-2 grid grid-cols-3 gap-2">
        <div className="telemetry-cell">
          <div className="telemetry-label text-violet-500/70">Peak SNR</div>
          <div
            className={`telemetry-value text-sm ${
              latestEcho?.success ? 'text-emerald-300' : latestEcho ? 'text-rose-400' : 'text-slate-500'
            }`}
          >
            {latestEcho ? `${animSnr}` : '--'}
          </div>
          <div className="text-[8px] text-slate-600">dB</div>
        </div>
        <div className="telemetry-cell">
          <div className="telemetry-label text-violet-500/70">Dechirp Gain</div>
          <div className="telemetry-value text-violet-300 text-sm">
            {latestEcho && mode === 'rc-css' ? `+${animGain}` : '0.0'}
          </div>
          <div className="text-[8px] text-slate-600">dB</div>
        </div>
        <div className="telemetry-cell">
          <div className="telemetry-label text-slate-500">2-Way TOF</div>
          <div className="telemetry-value text-cyan-300 text-sm">
            {latestEcho ? `${animTof}` : '--'}
          </div>
          <div className="text-[8px] text-slate-600">ms</div>
        </div>
      </div>
    </div>
  );
};

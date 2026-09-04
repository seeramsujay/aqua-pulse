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

      // Deep instrument background clear
      ctx.fillStyle = '#091319';
      ctx.fillRect(0, 0, w, h);

      // Frequency grid lines (up to 500 kHz)
      const maxFreq = 500;
      const freqStep = 100;
      ctx.font = '8px JetBrains Mono, monospace';

      for (let f = 0; f <= maxFreq; f += freqStep) {
        const y = h - (f / maxFreq) * h;

        ctx.strokeStyle = 'rgba(32, 51, 61, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(28, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = '#71858F';
        ctx.fillText(`${f}k`, 4, y - 1);
      }

      // Time grid lines (scrolling)
      for (let x = (timeOffset % 50) + 28; x < w; x += 50) {
        ctx.strokeStyle = 'rgba(24, 42, 52, 0.4)';
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
        ctx.fillStyle = 'rgba(67, 199, 217, 0.08)';
        ctx.fillRect(28, bandY1, w - 28, Math.max(2, bandY2 - bandY1));
      }

      // Transmitted chirp / CW tone
      const chirpX = w - 70;
      if (isPinging) {
        if (mode === 'rc-css') {
          const y1 = h - (activeBand.fStart / maxFreq) * h;
          const y2 = h - (activeBand.fEnd / maxFreq) * h;

          // Clean ribbon
          const ribbonGrad = ctx.createLinearGradient(chirpX, 0, chirpX + 28, 0);
          ribbonGrad.addColorStop(0, 'rgba(67, 199, 217, 0.25)');
          ribbonGrad.addColorStop(1, 'rgba(67, 199, 217, 0.0)');
          ctx.fillStyle = ribbonGrad;
          ctx.fillRect(chirpX, y2, 28, y1 - y2);

          // Chirp line
          ctx.strokeStyle = '#43C7D9';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(chirpX, y1);
          ctx.lineTo(chirpX + 28, y2);
          ctx.stroke();
        } else {
          const yCW = h - (450 / maxFreq) * h;
          ctx.strokeStyle = '#D96B6B';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(chirpX, yCW);
          ctx.lineTo(chirpX + 22, yCW);
          ctx.stroke();
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
          ctx.fillStyle = '#63C79A';
          // Vertical spike
          ctx.beginPath();
          ctx.ellipse(echoX, echoY, 2.5, 10, 0, 0, Math.PI * 2);
          ctx.fill();

          // Gain label
          ctx.font = '7px JetBrains Mono, monospace';
          ctx.fillStyle = '#E7EEF1';
          ctx.fillText(`+${echo.compressionGainDb.toFixed(0)}dB`, echoX - 10, echoY - 14);
          ctx.globalAlpha = 1;
        } else {
          ctx.globalAlpha = fadeOpacity * 0.7;
          ctx.fillStyle = '#D96B6B';
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
    <div className="instrument-panel flex flex-col h-full overflow-hidden">
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
            <Activity className="w-3.5 h-3.5" style={{ color: '#9B8EC4' }} />
          </div>
          <div>
            <div className="instrument-panel-title">Spectrogram Waterfall</div>
            <p className="text-[10px] text-slate-500 font-sans mt-0.5">Time-Frequency Energy Heatmap</p>
          </div>
        </div>
        <div className="hud-chip">0 – 500 kHz</div>
      </div>

      <div
        className="relative flex-1 mx-4 mb-3 rounded overflow-hidden"
        style={{
          background: '#091319',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <canvas ref={canvasRef} width={400} height={180} className="w-full h-full block" />
      </div>

      {/* Telemetry footer */}
      <div className="px-4 pb-3 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="grid grid-cols-3 gap-2">
          <div className="telemetry-cell">
            <div className="telemetry-label">Peak SNR</div>
            <div
              className="telemetry-value"
              style={{
                color: latestEcho?.success ? '#63C79A' : latestEcho ? '#D96B6B' : 'var(--text-muted)',
              }}
            >
              {latestEcho ? `${animSnr} dB` : '--'}
            </div>
          </div>
          <div className="telemetry-cell">
            <div className="telemetry-label">Dechirp Gain</div>
            <div className="telemetry-value" style={{ color: '#63C79A' }}>
              {latestEcho && mode === 'rc-css' ? `+${animGain} dB` : '0.0 dB'}
            </div>
          </div>
          <div className="telemetry-cell">
            <div className="telemetry-label">2-Way TOF</div>
            <div className="telemetry-value" style={{ color: '#43C7D9' }}>
              {latestEcho ? `${animTof} ms` : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Submersible, OceanLayer, AcousticRay, ChirpBand, EchoReturn, BathymetryPoint, SonarMode } from '../../types/sonar';
import { getOceanPropertiesAtDepth, getSeafloorDepth, traceAcousticRay } from '../../physics/oceanAcoustics';

interface OceanCanvasProps {
  submersible: Submersible;
  setSubmersible: React.Dispatch<React.SetStateAction<Submersible>>;
  layers: OceanLayer[];
  terrainType: string;
  mode: SonarMode;
  activeBand: ChirpBand;
  onEchoDetected: (echo: EchoReturn) => void;
  onSoundingPoint: (point: BathymetryPoint) => void;
  isAutoPinging: boolean;
}

export const OceanCanvas: React.FC<OceanCanvasProps> = ({
  submersible,
  setSubmersible,
  layers,
  terrainType,
  mode,
  activeBand,
  onEchoDetected,
  onSoundingPoint,
  isAutoPinging
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rays, setRays] = useState<AcousticRay[]>([]);
  const [isDraggingAuv, setIsDraggingAuv] = useState(false);
  const [, setPingWaveRadius] = useState<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  // Ocean coordinate system bounds
  const WORLD_WIDTH_M = 2000;
  const WORLD_DEPTH_M = 1500;

  // Trigger Acoustic Ping
  const triggerPing = useCallback(() => {
    const numRays = mode === 'rc-css' ? 21 : 13;
    const spread = submersible.beamSpreadDeg;
    const centerAngle = submersible.pingAngleDeg;
    const angleStep = spread / (numRays - 1);
    const startAngle = centerAngle - spread / 2;

    const newRays: AcousticRay[] = [];

    if (mode === 'rc-css') {
      // For RC-CSS, fire rays for the active stepped frequency band
      for (let i = 0; i < numRays; i++) {
        const angle = startAngle + i * angleStep;
        const centerFreq = (activeBand.fStart + activeBand.fEnd) / 2;
        const ray = traceAcousticRay(
          submersible.x,
          submersible.depth,
          angle,
          centerFreq,
          activeBand,
          layers,
          terrainType,
          'rc-css'
        );
        newRays.push(ray);
      }
    } else {
      // For Traditional CW Sonar, fire single fixed high frequency (e.g. 45 kHz)
      const fixedFreq = 45;
      for (let i = 0; i < numRays; i++) {
        const angle = startAngle + i * angleStep;
        const ray = traceAcousticRay(
          submersible.x,
          submersible.depth,
          angle,
          fixedFreq,
          null,
          layers,
          terrainType,
          'traditional-cw'
        );
        newRays.push(ray);
      }
    }

    setRays(newRays);
    setPingWaveRadius((prev) => [...prev, 5]);

    // Update status
    setSubmersible((prev: Submersible) => ({ ...prev, status: 'transmitting', pingActive: true }));

    // Register echo returns with realistic delay
    newRays.forEach((r) => {
      if (r.echo) {
        setTimeout(() => {
          if (r.echo) {
            onEchoDetected(r.echo);
            if (r.echo.success) {
              onSoundingPoint({
                x: r.segments[r.segments.length - 1]?.x2 || submersible.x,
                trueDepth: r.echo.trueDepthM,
                measuredDepth: r.echo.calculatedDepthM,
                confidence: Math.max(10, Math.min(100, Math.round(r.echo.snrDb * 3.5))),
                frequencyKHz: r.freqKHz,
                timestamp: Date.now()
              });
            }
          }
        }, Math.min(1200, (r.echo.travelTimeMs / 20) * 10));
      }
    });

    setTimeout(() => {
      setSubmersible((prev: Submersible) => ({ ...prev, status: 'propagating' }));
    }, 300);

    setTimeout(() => {
      setSubmersible((prev: Submersible) => ({ ...prev, status: 'idle', pingActive: false }));
    }, 1400);
  }, [submersible, mode, activeBand, layers, terrainType, onEchoDetected, onSoundingPoint, setSubmersible]);

  // Handle manual ping on space or prop change
  useEffect(() => {
    if (submersible.pingActive && rays.length === 0) {
      triggerPing();
    }
  }, [submersible.pingActive, triggerPing, rays.length]);

  // Auto-ping loop
  useEffect(() => {
    if (!isAutoPinging) return;
    const interval = setInterval(() => {
      triggerPing();
    }, 1800);
    return () => clearInterval(interval);
  }, [isAutoPinging, triggerPing]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.02;
      const w = canvas.width;
      const h = canvas.height;

      // Coordinate transforms
      const scaleX = (x: number) => (x / WORLD_WIDTH_M) * w;
      const scaleY = (z: number) => (z / WORLD_DEPTH_M) * h;
      const unscaleX = (px: number) => (px / w) * WORLD_WIDTH_M;

      // Clear Canvas
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // 1. Draw Stratified Ocean Water Column with Depth Gradients
      layers.forEach((layer) => {
        const yStart = scaleY(layer.depthStart);
        const yEnd = scaleY(layer.depthEnd);
        const layerHeight = yEnd - yStart;

        const grad = ctx.createLinearGradient(0, yStart, 0, yEnd);
        if (layer.id.includes('mixed')) {
          grad.addColorStop(0, 'rgba(14, 116, 144, 0.45)');
          grad.addColorStop(1, 'rgba(12, 74, 110, 0.55)');
        } else if (layer.id.includes('thermocline') || layer.id.includes('thermo')) {
          grad.addColorStop(0, 'rgba(12, 74, 110, 0.55)');
          grad.addColorStop(1, 'rgba(15, 23, 42, 0.75)');
        } else if (layer.id.includes('sofar')) {
          grad.addColorStop(0, 'rgba(15, 23, 42, 0.75)');
          grad.addColorStop(0.5, 'rgba(30, 27, 75, 0.85)'); // SOFAR channel axis violet tint
          grad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
        } else {
          grad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
          grad.addColorStop(1, 'rgba(2, 6, 23, 0.96)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, yStart, w, layerHeight);

        // Draw Layer Boundary Lines & Labels
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yEnd);
        ctx.lineTo(w, yEnd);
        ctx.stroke();
        ctx.setLineDash([]);

        // Layer Name Annotation
        ctx.font = '11px monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.fillText(`${layer.name} (${layer.depthStart}m - ${layer.depthEnd}m)`, 16, yStart + 20);

        // Sound Speed at Layer Boundary
        const { soundSpeed } = getOceanPropertiesAtDepth(layers, layer.depthStart);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.fillText(`c ≈ ${soundSpeed.toFixed(1)} m/s`, w - 140, yStart + 20);
      });

      // 2. Animated Thermocline Internal Waves
      layers.forEach((layer, idx) => {
        if (idx > 0 && idx < layers.length) {
          const yBound = scaleY(layer.depthStart);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 10) {
            const waveY = yBound + Math.sin(x * 0.015 + time * 1.5 + idx) * 4;
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
      });

      // 3. Draw Depth Grid Lines (every 200m)
      ctx.font = '10px monospace';
      for (let d = 200; d < WORLD_DEPTH_M; d += 200) {
        const y = scaleY(d);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.fillText(`${d}m`, 6, y - 4);
      }

      // 4. Render Realistic Seafloor Terrain
      const seafloorPath = new Path2D();
      seafloorPath.moveTo(0, h);
      const stepPx = 8;
      for (let px = 0; px <= w; px += stepPx) {
        const worldX = unscaleX(px);
        const depthM = getSeafloorDepth(worldX, terrainType, WORLD_WIDTH_M);
        const py = scaleY(depthM);
        if (px === 0) seafloorPath.lineTo(px, py);
        else seafloorPath.lineTo(px, py);
      }
      seafloorPath.lineTo(w, h);
      seafloorPath.closePath();

      // Seafloor fill gradient
      const seafloorGrad = ctx.createLinearGradient(0, scaleY(600), 0, h);
      seafloorGrad.addColorStop(0, '#1e293b');
      seafloorGrad.addColorStop(0.3, '#0f172a');
      seafloorGrad.addColorStop(1, '#020617');
      ctx.fillStyle = seafloorGrad;
      ctx.fill(seafloorPath);

      // Seafloor luminous border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 10;
      ctx.stroke(seafloorPath);
      ctx.shadowBlur = 0;

      // 5. Draw Acoustic Rays & Refraction Paths
      rays.forEach((ray) => {
        if (ray.segments.length === 0) return;

        // Draw Ray Trajectory Path
        ctx.beginPath();
        ctx.strokeStyle = ray.color;
        ctx.lineWidth = mode === 'rc-css' ? 2 : 1.5;
        ctx.globalAlpha = 0.65;

        ray.segments.forEach((seg: any, idx: number) => {
          const sx1 = scaleX(seg.x1);
          const sy1 = scaleY(seg.y1);
          const sx2 = scaleX(seg.x2);
          const sy2 = scaleY(seg.y2);

          if (idx === 0) ctx.moveTo(sx1, sy1);
          ctx.lineTo(sx2, sy2);
        });
        ctx.stroke();
        ctx.globalAlpha = 1.0;

        // Draw Animated Energy Pulse along the ray
        const pulseRatio = (time * 1.5 + (ray.launchAngleDeg % 10) * 0.1) % 1;
        const totalSegments = ray.segments.length;
        const targetSegIndex = Math.min(totalSegments - 1, Math.floor(pulseRatio * totalSegments));
        const seg = ray.segments[targetSegIndex];

        if (seg && !seg.isLostInShadow) {
          const px = scaleX(seg.x1 + (seg.x2 - seg.x1) * (pulseRatio * totalSegments - targetSegIndex));
          const py = scaleY(seg.y1 + (seg.y2 - seg.y1) * (pulseRatio * totalSegments - targetSegIndex));

          ctx.fillStyle = ray.color;
          ctx.shadowColor = ray.color;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, py, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Seafloor hit spark / reflection point
        const lastSeg = ray.segments[ray.segments.length - 1];
        if (lastSeg && lastSeg.isSeafloorHit) {
          const hitX = scaleX(lastSeg.x2);
          const hitY = scaleY(lastSeg.y2);

          ctx.fillStyle = lastSeg.isLostInShadow ? '#ef4444' : ray.color;
          ctx.shadowColor = lastSeg.isLostInShadow ? '#ef4444' : ray.color;
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(hitX, hitY, lastSeg.isLostInShadow ? 3 : 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 6. Draw Expanding Acoustic Ping Wavefronts
      setPingWaveRadius((prevRadii) => {
        return prevRadii
          .map((r) => r + 4)
          .filter((r) => {
            const auvX = scaleX(submersible.x);
            const auvY = scaleY(submersible.depth);

            ctx.strokeStyle = activeBand.color;
            ctx.lineWidth = Math.max(0.5, 3 - r / 60);
            ctx.globalAlpha = Math.max(0, 1 - r / 220);
            ctx.beginPath();
            ctx.arc(auvX, auvY, r, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;

            return r < 220;
          });
      });

      // 7. Draw AUV / Unmanned Submersible Vehicle
      const auvCanvasX = scaleX(submersible.x);
      const auvCanvasY = scaleY(submersible.depth);

      ctx.save();
      ctx.translate(auvCanvasX, auvCanvasY);

      // Acoustic Transducer Cone Indicator
      const beamSpreadRad = (submersible.beamSpreadDeg * Math.PI) / 180;
      const pingAngleRad = (submersible.pingAngleDeg * Math.PI) / 180;
      ctx.fillStyle = activeBand.color;
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 160, pingAngleRad - beamSpreadRad / 2, pingAngleRad + beamSpreadRad / 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Submersible Body (Submarine hull)
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = isDraggingAuv ? 18 : 8;

      // Main Hull Ellipse
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Top Conning Tower / Periscope
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(-6, -18, 12, 8);
      ctx.fill();
      ctx.stroke();

      // Periscope Sensor Mast
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(0, -25);
      ctx.lineTo(4, -25);
      ctx.stroke();

      // Transducer Array Pod (bottom)
      ctx.fillStyle = activeBand.color;
      ctx.beginPath();
      ctx.arc(0, 13, 5, 0, Math.PI);
      ctx.fill();

      // Propulsion Thruster
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.rect(-28, -5, 6, 10);
      ctx.fill();

      // Propeller Cavitation Bubbles
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      for (let b = 0; b < 3; b++) {
        const bubbleX = -32 - b * 8 - (time * 20) % 10;
        const bubbleY = Math.sin(time * 5 + b) * 3;
        ctx.beginPath();
        ctx.arc(bubbleX, bubbleY, 1.5 + b * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Status Indicator LED
      ctx.fillStyle = submersible.status === 'transmitting' ? '#ef4444' : '#10b981';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(8, -2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();

      // 8. Draw AUV Telemetry Tag
      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`AUV-AQUAPULSE [${submersible.depth.toFixed(0)}m]`, auvCanvasX - 60, auvCanvasY - 32);

      const auvProps = getOceanPropertiesAtDepth(layers, submersible.depth);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`T: ${auvProps.temp.toFixed(1)}°C | c: ${auvProps.soundSpeed.toFixed(0)}m/s`, auvCanvasX - 60, auvCanvasY - 20);

      // Loop animation
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [layers, terrainType, mode, activeBand, rays, submersible, isDraggingAuv]);

  // Mouse drag handler for AUV repositioning
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const auvCanvasX = (submersible.x / WORLD_WIDTH_M) * canvas.width;
    const auvCanvasY = (submersible.depth / WORLD_DEPTH_M) * canvas.height;

    const dist = Math.hypot(clickX - auvCanvasX, clickY - auvCanvasY);
    if (dist < 40) {
      setIsDraggingAuv(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isDraggingAuv) {
      const newWorldX = Math.max(100, Math.min(WORLD_WIDTH_M - 100, (mouseX / canvas.width) * WORLD_WIDTH_M));
      const newDepth = Math.max(30, Math.min(WORLD_DEPTH_M - 200, (mouseY / canvas.height) * WORLD_DEPTH_M));
      setSubmersible((prev: Submersible) => ({ ...prev, x: newWorldX, depth: newDepth }));
    }
  };

  const handleMouseUp = () => {
    setIsDraggingAuv(false);
  };

  return (
    <div className="relative w-full h-full bg-[#030712] rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex flex-col">
      {/* Viewport Header Controls Overlay */}
      <div className="absolute top-3 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-lg border border-slate-700/60 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  submersible.pingActive ? 'bg-cyan-400' : 'bg-emerald-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  submersible.pingActive ? 'bg-cyan-500' : 'bg-emerald-500'
                }`}
              />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              {mode === 'rc-css' ? 'Rolling-Channel CSS' : 'Traditional CW Ping'}
            </span>
          </div>

          <span className="text-slate-600">|</span>

          <div className="text-xs text-slate-300 font-mono">
            <span className="text-slate-400">Band:</span>{' '}
            <span style={{ color: activeBand.color }} className="font-bold">
              {mode === 'rc-css' ? `${activeBand.name} (${activeBand.fStart}-${activeBand.fEnd} kHz)` : 'Fixed 45 kHz CW Tone'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={triggerPing}
            disabled={submersible.pingActive}
            className={`px-4 py-1.5 rounded-md text-xs font-bold font-mono tracking-wide transition-all shadow-md flex items-center space-x-1.5 ${
              submersible.pingActive
                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 hover:shadow-cyan-500/25 active:scale-95'
            }`}
          >
            <span>TRANSMIT PING</span>
            <kbd className="bg-slate-950/40 text-slate-200 px-1 py-0.5 rounded text-[10px]">SPACE</kbd>
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={650}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-crosshair select-none"
      />

      {/* Bottom Floating Legend & Hint */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/70 backdrop-blur-sm px-3 py-1.5 rounded-md border border-slate-800">
        <div className="flex items-center space-x-4 font-mono">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>Band 1: 3-12 kHz (Deep)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Band 2: 15-32 kHz (Thermo)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            <span>Band 3: 35-70 kHz (High-Res)</span>
          </span>
        </div>
        <div className="text-slate-400 font-sans italic">
          💡 Drag the yellow AUV icon to adjust depth and observe Snell refraction!
        </div>
      </div>
    </div>
  );
};

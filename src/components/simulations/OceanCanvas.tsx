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
  turbidity?: number;
  triggerPingRef?: React.MutableRefObject<(() => void) | null>;
  /** Autonomous mission mode: world-scrolling offset in meters */
  worldOffsetX?: number;
  /** Whether the autonomous mission is active (disables manual control) */
  isMissionActive?: boolean;
  /** Collision warning distance (meters below AUV to seafloor ahead) */
  collisionWarning?: boolean;
  collisionDistanceM?: number | null;
}

interface OceanParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  baseAlpha: number;
  type: 'caustic' | 'thermocline' | 'bioluminescent' | 'sediment';
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
  isAutoPinging,
  turbidity = 12.0,
  triggerPingRef,
  worldOffsetX = 0,
  isMissionActive = false,
  collisionWarning = false,
  collisionDistanceM = null,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rays, setRays] = useState<AcousticRay[]>([]);
  const [isDraggingAuv, setIsDraggingAuv] = useState(false);
  const pingWaveRadiiRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<OceanParticle[]>([]);
  const [collisionDismissed, setCollisionDismissed] = useState(false);

  // Ocean coordinate system bounds
  const WORLD_WIDTH_M = 2000;
  const WORLD_DEPTH_M = 1500;

  // Reset collision dismissed state when warning clears
  useEffect(() => {
    if (!collisionWarning) setCollisionDismissed(false);
  }, [collisionWarning]);

  // Initialize environmental ocean particles once
  useEffect(() => {
    const pts: OceanParticle[] = [];
    const count = 65;
    for (let i = 0; i < count; i++) {
      const y = Math.random() * WORLD_DEPTH_M;
      let type: OceanParticle['type'] = 'caustic';
      if (y > 250 && y < 750) type = 'thermocline';
      else if (y >= 750 && y < 1200) type = 'bioluminescent';
      else if (y >= 1200) type = 'sediment';

      pts.push({
        x: Math.random() * WORLD_WIDTH_M,
        y,
        vx: (Math.random() - 0.5) * 0.4 + (type === 'caustic' ? 0.3 : 0.05),
        vy: (Math.random() - 0.5) * 0.2 + (type === 'sediment' ? -0.1 : 0),
        size: type === 'bioluminescent' ? 1.8 + Math.random() * 1.5 : 1 + Math.random() * 1.5,
        baseAlpha: 0.15 + Math.random() * 0.35,
        type
      });
    }
    particlesRef.current = pts;
  }, []);

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
          'rc-css',
          3200,
          turbidity
        );
        newRays.push(ray);
      }
    } else {
      // For Traditional CW Sonar, fire single fixed high frequency tone (450 kHz)
      const fixedFreq = 450;
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
          'traditional-cw',
          3200,
          turbidity
        );
        newRays.push(ray);
      }
    }

    setRays(newRays);
    pingWaveRadiiRef.current.push(5);

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

  useEffect(() => {
    if (triggerPingRef) {
      triggerPingRef.current = triggerPing;
    }
  }, [triggerPing, triggerPingRef]);

  // Handle manual ping on prop change
  useEffect(() => {
    if (submersible.pingActive && submersible.status === 'idle') {
      triggerPing();
    }
  }, [submersible.pingActive, submersible.status, triggerPing]);

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

      // ── Coordinate transforms ──
      // In mission mode: worldOffsetX shifts the terrain; AUV stays centered horizontally
      const offsetX = isMissionActive ? worldOffsetX : 0;

      const scaleX = (x: number) => ((x - offsetX) / WORLD_WIDTH_M) * w;
      const scaleY = (z: number) => (z / WORLD_DEPTH_M) * h;
      const unscaleX = (px: number) => (px / w) * WORLD_WIDTH_M + offsetX;

      // AUV always draws at its submersible.x position
      // In mission mode, submersible.x is set to offsetX + WORLD_WIDTH_M/2 by App.tsx
      // so scaleX(submersible.x) → center of canvas

      // Clear Canvas
      ctx.fillStyle = '#071018';
      ctx.fillRect(0, 0, w, h);

      // 1. Draw Stratified Ocean Water Column with Depth Gradients
      layers.forEach((layer) => {
        const yStart = scaleY(layer.depthStart);
        const yEnd = scaleY(layer.depthEnd);
        const layerHeight = yEnd - yStart;

        const grad = ctx.createLinearGradient(0, yStart, 0, yEnd);
        if (layer.id.includes('mixed')) {
          grad.addColorStop(0, 'rgba(10, 80, 110, 0.45)');
          grad.addColorStop(1, 'rgba(8, 55, 85, 0.55)');
        } else if (layer.id.includes('thermocline') || layer.id.includes('thermo')) {
          grad.addColorStop(0, 'rgba(8, 55, 85, 0.55)');
          grad.addColorStop(1, 'rgba(12, 20, 36, 0.75)');
        } else if (layer.id.includes('sofar')) {
          grad.addColorStop(0, 'rgba(12, 20, 36, 0.75)');
          grad.addColorStop(0.5, 'rgba(25, 22, 60, 0.85)');
          grad.addColorStop(1, 'rgba(12, 20, 36, 0.85)');
        } else {
          grad.addColorStop(0, 'rgba(12, 20, 36, 0.85)');
          grad.addColorStop(1, 'rgba(2, 5, 18, 0.96)');
        }

        ctx.fillStyle = grad;
        ctx.fillRect(0, yStart, w, layerHeight);

        // Draw Layer Boundary Lines & Labels
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.18)';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, yEnd);
        ctx.lineTo(w, yEnd);
        ctx.stroke();
        ctx.setLineDash([]);

        // Layer Name Annotation
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.65)';
        ctx.fillText(`${layer.name.toUpperCase()} [${layer.depthStart}m - ${layer.depthEnd}m]`, 16, yStart + 18);

        // Sound Speed at Layer Boundary
        const { soundSpeed } = getOceanPropertiesAtDepth(layers, layer.depthStart);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.5)';
        ctx.fillText(`c(z) ≈ ${soundSpeed.toFixed(1)} m/s`, w - 145, yStart + 18);
      });

      // 2. Animated Thermocline Internal Waves
      layers.forEach((layer, idx) => {
        if (idx > 0 && idx < layers.length) {
          const yBound = scaleY(layer.depthStart);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          for (let x = 0; x <= w; x += 10) {
            // In mission mode, shift the wave pattern with world offset
            const worldPhase = isMissionActive ? (offsetX * 0.01) : 0;
            const waveY = yBound + Math.sin(x * 0.015 + time * 1.5 + idx + worldPhase) * 3.5;
            if (x === 0) ctx.moveTo(x, waveY);
            else ctx.lineTo(x, waveY);
          }
          ctx.stroke();
        }
      });

      // 3. Ambient Ocean Particles (Living water column)
      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = WORLD_WIDTH_M;
          if (p.x > WORLD_WIDTH_M) p.x = 0;
          if (p.y < 0) p.y = WORLD_DEPTH_M;
          if (p.y > WORLD_DEPTH_M) p.y = 0;

          // In mission mode, shift particles with the world
          const particleWorldX = isMissionActive ? p.x + offsetX : p.x;
          const px = scaleX(particleWorldX);

          // Only draw if on-screen
          if (px < -10 || px > w + 10) return;

          const py = scaleY(p.y);

          ctx.beginPath();
          if (p.type === 'caustic') {
            ctx.fillStyle = `rgba(180, 240, 255, ${p.baseAlpha * (0.6 + 0.4 * Math.sin(time * 2 + p.x))})`;
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
          } else if (p.type === 'thermocline') {
            ctx.fillStyle = `rgba(56, 189, 248, ${p.baseAlpha * 0.6})`;
            ctx.arc(px, py, p.size * 0.8, 0, Math.PI * 2);
          } else if (p.type === 'bioluminescent') {
            const glow = 0.5 + 0.5 * Math.sin(time * 3 + p.y);
            ctx.fillStyle = `rgba(52, 211, 153, ${p.baseAlpha * glow})`;
            ctx.shadowColor = '#34d399';
            ctx.shadowBlur = 4;
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = `rgba(148, 163, 184, ${p.baseAlpha * 0.4})`;
            ctx.arc(px, py, p.size * 0.7, 0, Math.PI * 2);
          }
          ctx.fill();
        });
      }

      // 4. Draw Depth Grid Lines (every 200m)
      ctx.font = '10px JetBrains Mono, monospace';
      for (let d = 200; d < WORLD_DEPTH_M; d += 200) {
        const y = scaleY(d);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();

        ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
        ctx.fillText(`${d}m`, 6, y - 4);
      }

      // 5. Render Realistic Seafloor Terrain
      // In mission mode, query terrain using the world-offset coordinate
      const seafloorPath = new Path2D();
      seafloorPath.moveTo(0, h);
      const stepPx = 8;
      for (let px = 0; px <= w; px += stepPx) {
        const worldX = unscaleX(px);
        // Wrap worldX into valid terrain range for getSeafloorDepth
        const wrappedX = ((worldX % WORLD_WIDTH_M) + WORLD_WIDTH_M) % WORLD_WIDTH_M;
        const depthM = getSeafloorDepth(wrappedX, terrainType, WORLD_WIDTH_M);
        const py = scaleY(depthM);
        if (px === 0) seafloorPath.lineTo(px, py);
        else seafloorPath.lineTo(px, py);
      }
      seafloorPath.lineTo(w, h);
      seafloorPath.closePath();

      // Seafloor fill gradient
      const seafloorGrad = ctx.createLinearGradient(0, scaleY(600), 0, h);
      seafloorGrad.addColorStop(0, '#111827');
      seafloorGrad.addColorStop(0.3, '#0b1120');
      seafloorGrad.addColorStop(1, '#020617');
      ctx.fillStyle = seafloorGrad;
      ctx.fill(seafloorPath);

      // Seafloor luminous border
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#0284c7';
      ctx.shadowBlur = 8;
      ctx.stroke(seafloorPath);
      ctx.shadowBlur = 0;

      // 6. Draw Acoustic Rays & Refraction Paths
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
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
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
          ctx.shadowBlur = 14;
          ctx.beginPath();
          ctx.arc(hitX, hitY, lastSeg.isLostInShadow ? 3 : 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // 7. Draw Expanding Acoustic Ping Wavefronts
      pingWaveRadiiRef.current = pingWaveRadiiRef.current
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

      // 8. Draw AUV / Unmanned Submersible Vehicle
      const auvCanvasX = scaleX(submersible.x);
      const auvCanvasY = scaleY(submersible.depth);

      ctx.save();
      ctx.translate(auvCanvasX, auvCanvasY);

      // Acoustic Transducer Cone Indicator
      const beamSpreadRad = (submersible.beamSpreadDeg * Math.PI) / 180;
      const pingAngleRad = (submersible.pingAngleDeg * Math.PI) / 180;
      ctx.fillStyle = activeBand.color;
      ctx.globalAlpha = 0.07;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 170, pingAngleRad - beamSpreadRad / 2, pingAngleRad + beamSpreadRad / 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Submersible Ambient Glow Halo
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = isMissionActive ? 14 : (isDraggingAuv ? 20 : 10);

      // Main Hull Ellipse
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 24, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Top Conning Tower / Periscope
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.rect(-6, -18, 12, 8);
      ctx.fill();
      ctx.stroke();

      // Periscope Sensor Mast
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
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

      // 9. Draw AUV Telemetry Tag & Pressure Calculation
      const pressureBar = (1 + 0.1 * (submersible.depth / 10)).toFixed(1);
      ctx.font = 'bold 11px JetBrains Mono, monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText(`AUV-AQUAPULSE [${submersible.depth.toFixed(0)}m]`, auvCanvasX - 60, auvCanvasY - 32);

      const auvProps = getOceanPropertiesAtDepth(layers, submersible.depth);
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(
        `T: ${auvProps.temp.toFixed(1)}°C | c: ${auvProps.soundSpeed.toFixed(0)}m/s | P: ${pressureBar}bar`,
        auvCanvasX - 60,
        auvCanvasY - 18
      );

      // 10. Mission Mode HUD overlay — Mission Phase & Scroll Progress
      if (isMissionActive) {
        // World offset indicator (top-left)
        ctx.font = 'bold 10px JetBrains Mono, monospace';
        ctx.fillStyle = 'rgba(67, 199, 217, 0.7)';
        ctx.fillText(`▸ AUTONOMOUS MISSION · RANGE: ${Math.round(worldOffsetX)}m`, 16, h - 14);
      }

      // Loop animation
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [layers, terrainType, mode, activeBand, rays, submersible, isDraggingAuv, worldOffsetX, isMissionActive]);

  // Mouse drag handler for AUV repositioning (disabled in mission mode)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMissionActive) return; // No manual control during autonomous mission
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const auvCanvasX = (submersible.x / WORLD_WIDTH_M) * canvas.width;
    const auvCanvasY = (submersible.depth / WORLD_DEPTH_M) * canvas.height;

    const dist = Math.hypot(clickX - auvCanvasX, clickY - auvCanvasY);
    if (dist < 45) {
      setIsDraggingAuv(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isMissionActive) return; // No manual control during autonomous mission
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

  const currentSoundSpeed = getOceanPropertiesAtDepth(layers, submersible.depth).soundSpeed;

  return (
    <div
      className="relative w-full h-full overflow-hidden flex flex-col"
      style={{
        background: '#071018',
        borderRadius: '6px',
        border: '1px solid #20333D',
      }}
    >
      {/* Top right in-situ sound speed readout */}
      <div
        className="absolute top-3 right-4 z-10 font-mono text-[11px] pointer-events-none"
        style={{ color: '#43C7D9' }}
      >
        c(z) = {currentSoundSpeed.toFixed(1)} m/s
      </div>

      {/* Collision Warning Overlay — Critical Red Alert */}
      {isMissionActive && collisionWarning && !collisionDismissed && (
        <div
          className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-2.5 rounded-md"
          style={{
            background: 'rgba(220, 38, 38, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            backdropFilter: 'blur(8px)',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: '#ef4444', boxShadow: '0 0 8px #ef4444' }}
          />
          <div className="flex flex-col">
            <span className="font-mono font-bold text-[11px] tracking-wider" style={{ color: '#fca5a5' }}>
              TERRAIN PROXIMITY WARNING
            </span>
            <span className="font-mono text-[10px]" style={{ color: '#fecaca' }}>
              Seafloor {collisionDistanceM !== null ? `${Math.round(collisionDistanceM)}m` : '--'} below AUV at forward look-ahead
            </span>
          </div>
          <button
            onClick={() => setCollisionDismissed(true)}
            className="ml-2 px-2 py-0.5 rounded text-[9px] font-mono font-bold cursor-pointer transition-colors"
            style={{
              background: 'rgba(239, 68, 68, 0.25)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
            }}
          >
            DISMISS
          </button>
        </div>
      )}

      {/* Main Canvas Viewport */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={650}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-full select-none ${isMissionActive ? 'cursor-default' : 'cursor-crosshair'}`}
      />

      {/* Bottom Floating Legend */}
      <div
        className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-center text-[10px] font-mono px-3 py-1.5 rounded"
        style={{
          background: 'rgba(11, 23, 32, 0.85)',
          border: '1px solid #20333D',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="flex items-center space-x-6">
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#D9A441' }} />
            <span>CH0: 100–140 kHz (Deep / Turbid)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#63C79A' }} />
            <span>CH1: 200–250 kHz (Thermocline)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: '#9B8EC4' }} />
            <span>CH2: 400–480 kHz (High-Res Bathymetry)</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// EOF: src/components/simulations/OceanCanvas.tsx

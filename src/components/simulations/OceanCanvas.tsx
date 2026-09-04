import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Submersible, OceanLayer, AcousticRay, ChirpBand, EchoReturn, BathymetryPoint, SonarMode } from '../../types/sonar';
import {
  getOceanPropertiesAtDepth,
  getSeafloorDepth,
  traceAcousticRay,
  calculateTransmissionLoss,
  calculateCssProcessingGain,
} from '../../physics/oceanAcoustics';

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
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rays, setRays] = useState<AcousticRay[]>([]);
  const [isDraggingAuv, setIsDraggingAuv] = useState(false);
  const [isHoveringAuv, setIsHoveringAuv] = useState(false);
  const dragOffsetRef = useRef<{ x: number; depth: number }>({ x: 0, depth: 0 });
  const pingWaveRadiiRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<OceanParticle[]>([]);

  // Ocean coordinate system bounds
  const WORLD_WIDTH_M = 2000;
  const WORLD_DEPTH_M = 1500;

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
        vx: (Math.random() - 0.5) * 0.35 + (type === 'caustic' ? 0.25 : 0.04),
        vy: (Math.random() - 0.5) * 0.18 + (type === 'sediment' ? -0.08 : 0),
        size: type === 'bioluminescent' ? 1.8 + Math.random() * 1.5 : 1 + Math.random() * 1.5,
        baseAlpha: 0.15 + Math.random() * 0.35,
        type,
      });
    }
    particlesRef.current = pts;
  }, []);

  // Ray generation helper for given origin
  const generateRaysAt = useCallback(
    (startX: number, startDepth: number): AcousticRay[] => {
      const numRays = mode === 'rc-css' ? 21 : 13;
      const spread = submersible.beamSpreadDeg;
      const centerAngle = submersible.pingAngleDeg;
      const angleStep = spread / (numRays - 1);
      const startAngle = centerAngle - spread / 2;

      const newRays: AcousticRay[] = [];

      if (mode === 'rc-css') {
        for (let i = 0; i < numRays; i++) {
          const angle = startAngle + i * angleStep;
          const centerFreq = (activeBand.fStart + activeBand.fEnd) / 2;
          const ray = traceAcousticRay(
            startX,
            startDepth,
            angle,
            centerFreq,
            activeBand,
            layers,
            terrainType,
            'rc-css',
            3200,
            turbidity,
            0
          );
          newRays.push(ray);
        }
      } else {
        const fixedFreq = 450;
        for (let i = 0; i < numRays; i++) {
          const angle = startAngle + i * angleStep;
          const ray = traceAcousticRay(
            startX,
            startDepth,
            angle,
            fixedFreq,
            null,
            layers,
            terrainType,
            'traditional-cw',
            3200,
            turbidity,
            0
          );
          newRays.push(ray);
        }
      }
      return newRays;
    },
    [mode, submersible.beamSpreadDeg, submersible.pingAngleDeg, activeBand, layers, terrainType, turbidity]
  );

  // Trigger Acoustic Ping
  const triggerPing = useCallback(() => {
    const newRays = generateRaysAt(submersible.x, submersible.depth);
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
                timestamp: Date.now(),
              });
            }
          }
        }, Math.min(1800, (r.echo.travelTimeMs / 20) * 12));
      }
    });

    setTimeout(() => {
      setSubmersible((prev: Submersible) => ({ ...prev, status: 'propagating' }));
    }, 450);

    setTimeout(() => {
      setSubmersible((prev: Submersible) => ({ ...prev, status: 'idle', pingActive: false }));
    }, 2200);
  }, [generateRaysAt, submersible.x, submersible.depth, onEchoDetected, onSoundingPoint, setSubmersible]);

  // Hook triggerPingRef for external triggers (Space bar, Navbar button)
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

  // Whenever the submarine moves: re-trace active rays so the ping beam moves along with it in real-time!
  useEffect(() => {
    if (rays.length > 0) {
      const updatedRays = generateRaysAt(submersible.x, submersible.depth);
      setRays(updatedRays);
      const centerRay = updatedRays[Math.floor(updatedRays.length / 2)];
      if (centerRay && centerRay.echo) {
        onEchoDetected(centerRay.echo);
      }
    } else {
      // Calculate and emit live in-situ sounding values on submarine movement
      const seafloorZ = getSeafloorDepth(submersible.x, terrainType, WORLD_WIDTH_M);
      const altitude = Math.max(0.5, seafloorZ - submersible.depth);
      const c = getOceanPropertiesAtDepth(layers, submersible.depth).soundSpeed;
      const travelTimeMs = (2 * altitude / c) * 1000;
      const fCenter = (activeBand.fStart + activeBand.fEnd) / 2;
      const tl = calculateTransmissionLoss(altitude * 2, fCenter, turbidity);
      const gain = calculateCssProcessingGain((activeBand.fEnd - activeBand.fStart) * 1000, activeBand.durationMs / 1000);
      const snr = Math.max(4, 210 - tl - 45 + gain);

      onEchoDetected({
        id: `live-sounding-${Date.now()}`,
        bandId: activeBand.id,
        freqKHz: fCenter,
        launchAngleDeg: 90,
        travelTimeMs,
        calculatedDepthM: seafloorZ,
        trueDepthM: seafloorZ,
        snrDb: snr,
        attenuationDb: tl,
        color: activeBand.color,
        timestamp: Date.now(),
        compressionGainDb: gain,
        success: snr > 3,
        reason: 'Real-time Transducer Sounding',
      });
    }
  }, [submersible.x, submersible.depth, generateRaysAt, onEchoDetected, terrainType, layers, activeBand, turbidity]);

  // Auto-ping loop: Deliberate, relaxed cadence (4.0s) so soundings are clear and majestic
  useEffect(() => {
    if (!isAutoPinging) return;
    const interval = setInterval(() => {
      triggerPing();
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPinging, triggerPing]);

  // Helper to convert PointerEvent into exact canvas, world, and CSS coordinates
  const getPointerCoords = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const cssX = e.clientX - rect.left;
      const cssY = e.clientY - rect.top;
      const normX = Math.max(0, Math.min(1, cssX / rect.width));
      const normY = Math.max(0, Math.min(1, cssY / rect.height));

      const worldX = normX * WORLD_WIDTH_M;
      const depthM = normY * WORLD_DEPTH_M;

      // Submarine actual position mapped to CSS pixels
      const auvActualCssX = (submersible.x / WORLD_WIDTH_M) * rect.width;
      const auvActualCssY = (submersible.depth / WORLD_DEPTH_M) * rect.height;
      const distCssPx = Math.hypot(cssX - auvActualCssX, cssY - auvActualCssY);

      return {
        cssX,
        cssY,
        normX,
        normY,
        worldX,
        depthM,
        auvActualCssX,
        auvActualCssY,
        distCssPx,
      };
    },
    [submersible.x, submersible.depth]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const data = getPointerCoords(e);
    if (!data) return;

    // Precision hit radius: 42 CSS pixels around submarine hull
    if (data.distCssPx <= 42) {
      setIsDraggingAuv(true);
      dragOffsetRef.current = {
        x: submersible.x - data.worldX,
        depth: submersible.depth - data.depthM,
      };
      (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const data = getPointerCoords(e);
    if (!data) return;

    setIsHoveringAuv(data.distCssPx <= 42);

    if (isDraggingAuv) {
      const targetX = Math.max(50, Math.min(WORLD_WIDTH_M - 50, data.worldX + dragOffsetRef.current.x));
      const targetDepth = Math.max(25, Math.min(WORLD_DEPTH_M - 100, data.depthM + dragOffsetRef.current.depth));
      setSubmersible((prev: Submersible) => ({
        ...prev,
        x: targetX,
        depth: targetDepth,
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingAuv) {
      setIsDraggingAuv(false);
      try {
        (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      } catch (_) {}
    }
  };

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.015; // Slow, deliberate animation speed
      const w = canvas.width;
      const h = canvas.height;

      const scaleX = (x: number) => (x / WORLD_WIDTH_M) * w;
      const scaleY = (z: number) => (z / WORLD_DEPTH_M) * h;

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

        ctx.fillStyle = 'rgba(126, 147, 164, 0.65)';
        ctx.font = '10px JetBrains Mono, monospace';
        ctx.fillText(`${layer.name} (${layer.depthStart}-${layer.depthEnd}m)`, 10, yStart + 16);
      });

      // 2. Animated Ocean Surface Waves
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let x = 0; x <= w; x += 15) {
        const waveY = 3 * Math.sin(x * 0.015 + time * 1.5) + 2 * Math.cos(x * 0.03 - time * 0.8);
        ctx.lineTo(x, Math.max(1, waveY + 4));
      }
      ctx.lineTo(w, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
      ctx.fill();

      // 3. Render Floating Ocean Particles
      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach((p) => {
          p.x += p.vx;
          p.y += p.vy;

          if (p.x < 0) p.x = WORLD_WIDTH_M;
          if (p.x > WORLD_WIDTH_M) p.x = 0;
          if (p.y < 0) p.y = WORLD_DEPTH_M;
          if (p.y > WORLD_DEPTH_M) p.y = 0;

          const px = scaleX(p.x);
          if (px < -10 || px > w + 10) return;
          const py = scaleY(p.y);

          ctx.beginPath();
          if (p.type === 'caustic') {
            ctx.fillStyle = `rgba(180, 240, 255, ${p.baseAlpha * (0.6 + 0.4 * Math.sin(time * 1.5 + p.x))})`;
            ctx.arc(px, py, p.size, 0, Math.PI * 2);
          } else if (p.type === 'thermocline') {
            ctx.fillStyle = `rgba(56, 189, 248, ${p.baseAlpha * 0.6})`;
            ctx.arc(px, py, p.size * 0.8, 0, Math.PI * 2);
          } else if (p.type === 'bioluminescent') {
            const glow = 0.5 + 0.5 * Math.sin(time * 2 + p.y);
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

      // 5. Render Realistic Seafloor Terrain with Rich Geological Textures
      const seafloorPath = new Path2D();
      seafloorPath.moveTo(0, h);
      const stepPx = 6;
      const terrainPoints: { px: number; py: number; worldX: number; depthM: number }[] = [];

      for (let px = 0; px <= w; px += stepPx) {
        const worldX = (px / w) * WORLD_WIDTH_M;
        const depthM = getSeafloorDepth(worldX, terrainType, WORLD_WIDTH_M);
        const py = scaleY(depthM);
        terrainPoints.push({ px, py, worldX, depthM });
        seafloorPath.lineTo(px, py);
      }
      seafloorPath.lineTo(w, h);
      seafloorPath.closePath();

      // Clip inside seafloor for internal strata and geological textures
      ctx.save();
      ctx.clip(seafloorPath);

      // A. Deep Marine Substrate Gradient Base
      const seafloorGrad = ctx.createLinearGradient(0, scaleY(150), 0, h);
      seafloorGrad.addColorStop(0, '#0c1b26');
      seafloorGrad.addColorStop(0.25, '#08141d');
      seafloorGrad.addColorStop(0.6, '#050d14');
      seafloorGrad.addColorStop(1, '#020508');
      ctx.fillStyle = seafloorGrad;
      ctx.fill(seafloorPath);

      // B. Sub-bottom Acoustic Strata Layers (Geological Horizons)
      const strataOffsets = [28, 68, 125, 210, 320, 480];
      const strataStyles = [
        { color: 'rgba(67, 199, 217, 0.24)', dash: [8, 4], width: 1.5 },
        { color: 'rgba(99, 199, 154, 0.20)', dash: [14, 6], width: 1.2 },
        { color: 'rgba(217, 164, 65, 0.18)', dash: [5, 5], width: 1.0 },
        { color: 'rgba(155, 142, 196, 0.15)', dash: [18, 8], width: 1.2 },
        { color: 'rgba(67, 199, 217, 0.12)', dash: [10, 6], width: 1.0 },
        { color: 'rgba(255, 255, 255, 0.08)', dash: [4, 8], width: 0.8 },
      ];

      strataOffsets.forEach((offsetM, sIdx) => {
        const style = strataStyles[sIdx % strataStyles.length];
        ctx.beginPath();
        ctx.strokeStyle = style.color;
        ctx.setLineDash(style.dash);
        ctx.lineWidth = style.width;

        for (let i = 0; i < terrainPoints.length; i++) {
          const pt = terrainPoints[i];
          const fold = Math.sin((pt.worldX + sIdx * 180) * 0.007) * (10 + sIdx * 4);
          const strataY = scaleY(pt.depthM + offsetM) + fold;
          if (i === 0) ctx.moveTo(pt.px, strataY);
          else ctx.lineTo(pt.px, strataY);
        }
        ctx.stroke();
      });
      ctx.setLineDash([]);

      // C. Geological 45° Acoustic Penetration Cross-Hatch Grain
      ctx.strokeStyle = 'rgba(67, 199, 217, 0.03)';
      ctx.lineWidth = 1;
      const hatchSpacing = 24;
      for (let x = -h; x < w + h; x += hatchSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x + h, h);
        ctx.stroke();
      }

      // D. Vertical Core Sounding Calibration Reference Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
      ctx.lineWidth = 1;
      for (let px = 0; px <= w; px += 75) {
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, h);
        ctx.stroke();
      }

      // E. Sediment Speckles & Micro-Reflectors
      for (let i = 0; i < terrainPoints.length; i += 3) {
        const pt = terrainPoints[i];
        for (let k = 1; k <= 4; k++) {
          const speckleY = pt.py + k * 35 + ((pt.worldX * (k + 1) * 19) % 25);
          if (speckleY < h) {
            ctx.fillStyle = k % 2 === 0 ? 'rgba(67, 199, 217, 0.25)' : 'rgba(99, 199, 154, 0.2)';
            ctx.fillRect(pt.px, speckleY, 1.5, 1.5);
          }
        }
      }

      ctx.restore(); // Exit clipped seafloor

      // F. Acoustic Surface Backscatter Relief Ticks
      ctx.strokeStyle = 'rgba(67, 199, 217, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < terrainPoints.length - 1; i += 2) {
        const pt = terrainPoints[i];
        const nextPt = terrainPoints[i + 1];
        const slope = (nextPt.py - pt.py) / (nextPt.px - pt.px);
        const reliefLength = Math.max(2, Math.min(8, 4 - slope * 3));
        ctx.beginPath();
        ctx.moveTo(pt.px, pt.py);
        ctx.lineTo(pt.px, pt.py + reliefLength);
        ctx.stroke();
      }

      // G. Glowing Multi-Layer Seafloor Crest Contour
      ctx.save();
      ctx.strokeStyle = '#43C7D9';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.stroke(seafloorPath);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke(seafloorPath);

      // 6. Draw Acoustic Rays & Refraction Paths (Matching Active Band Color)
      rays.forEach((ray) => {
        if (ray.segments.length === 0) return;

        // Draw Ray Trajectory Path
        ctx.beginPath();
        ctx.strokeStyle = ray.color;
        ctx.lineWidth = mode === 'rc-css' ? 2 : 1.5;
        ctx.globalAlpha = 0.68;

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

        // Draw Deliberate, Slow Animated Energy Pulse along the ray (time * 0.35)
        const pulseRatio = (time * 0.35 + (ray.launchAngleDeg % 10) * 0.04) % 1;
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

      // 7. Draw Expanding Acoustic Ping Wavefronts (Slow, Majestic Expansion at r + 1.2)
      pingWaveRadiiRef.current = pingWaveRadiiRef.current
        .map((r) => r + 1.2)
        .filter((r) => {
          const auvX = scaleX(submersible.x);
          const auvY = scaleY(submersible.depth);

          ctx.strokeStyle = activeBand.color;
          ctx.lineWidth = Math.max(0.6, 2.8 - r / 100);
          ctx.globalAlpha = Math.max(0, 1 - r / 300);
          ctx.beginPath();
          ctx.arc(auvX, auvY, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1.0;

          return r < 300;
        });

      // 8. Draw AUV / Submersible Vehicle
      const auvCanvasX = scaleX(submersible.x);
      const auvCanvasY = scaleY(submersible.depth);

      ctx.save();
      ctx.translate(auvCanvasX, auvCanvasY);

      // Acoustic Transducer Cone Indicator (Colored by Active Band)
      const beamSpreadRad = (submersible.beamSpreadDeg * Math.PI) / 180;
      const pingAngleRad = (submersible.pingAngleDeg * Math.PI) / 180;
      ctx.fillStyle = activeBand.color;
      ctx.globalAlpha = 0.08;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 170, pingAngleRad - beamSpreadRad / 2, pingAngleRad + beamSpreadRad / 2);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // Submersible Ambient Glow Halo
      ctx.shadowColor = activeBand.color;
      ctx.shadowBlur = isDraggingAuv ? 22 : isHoveringAuv ? 16 : 10;

      // Precision Reticle & Lock HUD when hovering or dragging AUV
      if (isHoveringAuv || isDraggingAuv) {
        ctx.save();
        ctx.strokeStyle = isDraggingAuv ? '#43C7D9' : '#63C79A';
        ctx.lineWidth = 1.6;
        ctx.shadowColor = isDraggingAuv ? '#00f0ff' : '#63C79A';
        ctx.shadowBlur = 10;

        const reticleSize = 30;
        const cornerLen = 8;
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(-reticleSize, -reticleSize + cornerLen);
        ctx.lineTo(-reticleSize, -reticleSize);
        ctx.lineTo(-reticleSize + cornerLen, -reticleSize);
        ctx.stroke();

        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(reticleSize - cornerLen, -reticleSize);
        ctx.lineTo(reticleSize, -reticleSize);
        ctx.lineTo(reticleSize, -reticleSize + cornerLen);
        ctx.stroke();

        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(-reticleSize, reticleSize - cornerLen);
        ctx.lineTo(-reticleSize, reticleSize);
        ctx.lineTo(-reticleSize + cornerLen, reticleSize);
        ctx.stroke();

        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(reticleSize - cornerLen, reticleSize);
        ctx.lineTo(reticleSize, reticleSize);
        ctx.lineTo(reticleSize, reticleSize - cornerLen);
        ctx.stroke();

        // Center crosshair dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // Main Hull Ellipse
      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isDraggingAuv ? '#43C7D9' : isHoveringAuv ? '#63C79A' : activeBand.color;
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

      // Transducer Array Pod (bottom) - Dynamic Active Band Color
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
        const bubbleX = -32 - b * 8 - (time * 15) % 10;
        const bubbleY = Math.sin(time * 4 + b) * 3;
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
      ctx.fillStyle = isDraggingAuv ? '#43C7D9' : activeBand.color;
      ctx.fillText(
        `AUV-AQUAPULSE [${submersible.depth.toFixed(0)}m] · ${activeBand.name.split(':')[0]}`,
        auvCanvasX - 60,
        auvCanvasY - 32
      );

      const auvProps = getOceanPropertiesAtDepth(layers, submersible.depth);
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(
        `T: ${auvProps.temp.toFixed(1)}°C | c: ${auvProps.soundSpeed.toFixed(0)}m/s | P: ${pressureBar}bar`,
        auvCanvasX - 60,
        auvCanvasY - 18
      );

      // Loop animation
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    layers,
    terrainType,
    mode,
    activeBand,
    rays,
    submersible,
    isDraggingAuv,
    isHoveringAuv,
  ]);

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
      {/* Top right in-situ sound speed readout & active channel frequency */}
      <div
        className="absolute top-3 right-4 z-10 flex items-center gap-3 font-mono text-[11px] pointer-events-none"
      >
        <span
          className="px-2 py-0.5 rounded font-bold"
          style={{
            background: `${activeBand.color}20`,
            border: `1px solid ${activeBand.color}60`,
            color: activeBand.color,
          }}
        >
          {activeBand.fStart}–{activeBand.fEnd} kHz
        </span>
        <span style={{ color: '#43C7D9' }}>
          c(z) = {currentSoundSpeed.toFixed(1)} m/s
        </span>
      </div>

      {/* Main Canvas Viewport with Precision Pointer Capture */}
      <canvas
        ref={canvasRef}
        width={1000}
        height={650}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`w-full h-full select-none touch-none ${
          isDraggingAuv ? 'cursor-grabbing' : isHoveringAuv ? 'cursor-grab' : 'cursor-crosshair'
        }`}
      />

      {/* Bottom Floating Legend */}
      <div
        className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-center text-[10px] font-mono px-3 py-1.5 rounded pointer-events-none"
        style={{
          background: 'rgba(11, 23, 32, 0.85)',
          border: '1px solid #20333D',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="flex items-center space-x-6">
          <span
            className={`flex items-center space-x-1.5 transition-opacity duration-200 ${
              activeBand.id === 'band-subbottom' ? 'opacity-100 font-bold' : 'opacity-60'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{
                background: '#D9A441',
                boxShadow: activeBand.id === 'band-subbottom' ? '0 0 8px #D9A441' : 'none',
              }}
            />
            <span style={{ color: activeBand.id === 'band-subbottom' ? '#D9A441' : 'inherit' }}>
              CH0: 100–140 kHz (Deep &gt;700m)
            </span>
          </span>

          <span
            className={`flex items-center space-x-1.5 transition-opacity duration-200 ${
              activeBand.id === 'band-midwater' ? 'opacity-100 font-bold' : 'opacity-60'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{
                background: '#63C79A',
                boxShadow: activeBand.id === 'band-midwater' ? '0 0 8px #63C79A' : 'none',
              }}
            />
            <span style={{ color: activeBand.id === 'band-midwater' ? '#63C79A' : 'inherit' }}>
              CH1: 200–250 kHz (Thermocline 250–700m)
            </span>
          </span>

          <span
            className={`flex items-center space-x-1.5 transition-opacity duration-200 ${
              activeBand.id === 'band-highres' ? 'opacity-100 font-bold' : 'opacity-60'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{
                background: '#9B8EC4',
                boxShadow: activeBand.id === 'band-highres' ? '0 0 8px #9B8EC4' : 'none',
              }}
            />
            <span style={{ color: activeBand.id === 'band-highres' ? '#9B8EC4' : 'inherit' }}>
              CH2: 400–480 kHz (Shallow 0–250m)
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

// EOF: src/components/simulations/OceanCanvas.tsx

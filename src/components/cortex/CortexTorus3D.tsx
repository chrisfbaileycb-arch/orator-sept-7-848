/**
 * ============================================================================
 * THE ORATOR — CYBERPUNK DATA VORTEX ORB
 * ============================================================================
 *
 * Implements the Cyberpunk Data Vortex Orb directly into The Orator's visual core:
 * - 3,000 active particles orbiting in 7 logarithmic spiral arms
 * - Exponential decay trail buffer (trailLength = 0.92) for luminous comet tails
 * - HSB rainbow chromatic spectrum across the arms with pulsing luminance
 * - Concentric glowing energy core with rhythmic breathing
 * - Real-time acoustic coupling:
 *   * Speech Cadence: accelerations, outward flaring, and core plasma pulses
 *   * User Input: inward gravitational sonic absorption toward the singularity
 *   * Shockwave: expanding radiant pulse rings across the spiral arms
 *   * Inquest Complete: coherent emerald/cyan resonance
 * - Interactive 3D tilt tracking cursor motion
 * - Anchored 3D vector pin displaying the active Orator Inquest prompt
 * - Pure Orb: Zero graphs, zero diagnostic noise, zero status bars.
 */

import React, { useEffect, useRef, useState, useMemo } from "react";
import type { CortexPhase, CortexReasoningStep } from "../../lib/cortex/types";
import { globalAudioEngine } from "../../lib/audio-engine";

interface Props {
  phase?: CortexPhase;
  consensusScore?: number;
  contextLoadPct?: number;
  tokPerSec?: number;
  reasoningSteps?: CortexReasoningStep[];
  onSelectStep?: (step: CortexReasoningStep) => void;
  // Audio-reactive vocal entity props
  isOratorSpeaking?: boolean;
  isUserSpeaking?: boolean;
  currentQuestionPrompt?: string;
  currentQuestionIndex?: number;
  totalQuestions?: number;
  isInquestComplete?: boolean;
  shockwaveTrigger?: number;
  cleanMode?: boolean;
  hideBorders?: boolean;
}

interface ProjectedPin {
  label: string;
  sub: string;
  tag: string;
  screenX: number;
  screenY: number;
  visible: boolean;
  colorScheme: "cyan" | "amber" | "magenta" | "emerald";
}

// ============================================================================
// Ultra-Fast 2D Perlin / Simplex Noise Generator (Deterministic & Zero Allocation)
// ============================================================================
const PERM = new Uint8Array(512);
const P_BASE = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69,
  142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
  203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230,
  220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209,
  76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198,
  173, 186, 3, 64, 52, 217, 220, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85,
  212, 207, 206, 59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152,
  2, 44, 154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110,
  79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144,
  12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106,
  157, 184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67,
  29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 61, 156, 180,
];
for (let i = 0; i < 256; i++) {
  PERM[i] = P_BASE[i];
  PERM[256 + i] = P_BASE[i];
}

function perlin2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;
  const xf = x - Math.floor(x);
  const yf = y - Math.floor(y);

  // Fade curves
  const u = xf * xf * xf * (xf * (xf * 6 - 15) + 10);
  const v = yf * yf * yf * (yf * (yf * 6 - 15) + 10);

  const A = PERM[X] + Y;
  const B = PERM[X + 1] + Y;

  const grad = (hash: number, gx: number, gy: number) => {
    const h = hash & 3;
    const uVal = h < 2 ? gx : gy;
    const vVal = h < 2 ? gy : gx;
    return ((h & 1) === 0 ? uVal : -uVal) + ((h & 2) === 0 ? vVal : -vVal);
  };

  const a1 = grad(PERM[A], xf, yf);
  const a2 = grad(PERM[B], xf - 1, yf);
  const b1 = grad(PERM[A + 1], xf, yf - 1);
  const b2 = grad(PERM[B + 1], xf - 1, yf - 1);

  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  const x1 = lerp(a1, a2, u);
  const x2 = lerp(b1, b2, u);
  return (lerp(x1, x2, v) + 1) * 0.5; // return 0 to 1
}

// ============================================================================
// Vortex Particle Definition
// ============================================================================
interface ParticleData {
  angle: number;
  radius: number;
  armIndex: number;
  baseAngle: number;
  speed: number;
  size: number;
  alpha: number;
  noiseOffset: number;
  hue: number;
  sat: number;
  bri: number;
  hasGlow: boolean;
  x: number;
  y: number;
}

export default function CortexTorus3D({
  isOratorSpeaking = false,
  isUserSpeaking = false,
  currentQuestionPrompt = 'What is your primary persistence model: local SQLite or multi-tenant cloud?',
  currentQuestionIndex = 4,
  totalQuestions = 15,
  isInquestComplete = false,
  shockwaveTrigger = 0,
  cleanMode = true,
  hideBorders = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 3D Projected Vector Pin State
  const [projectedPin, setProjectedPin] = useState<ProjectedPin | null>(null);

  // Dynamic tilt offsets
  const tiltRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  // Acoustic dynamic parameters
  const shockwaveRadiusRef = useRef<number>(0);
  const shockwaveStrengthRef = useRef<number>(0);
  const speechSmoothingRef = useRef<number>(0);
  const userSmoothingRef = useRef<number>(0);
  const completeSmoothingRef = useRef<number>(0);

  // Trigger shockwave pulse on question advance
  useEffect(() => {
    if (shockwaveTrigger > 0) {
      shockwaveRadiusRef.current = 10;
      shockwaveStrengthRef.current = 1.0;
    }
  }, [shockwaveTrigger]);

  // Main Render Loop for the Cyberpunk Data Vortex Orb
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = container.clientWidth || 600);
    let height = (canvas.height = container.clientHeight || 500);

    const handleResize = () => {
      if (!container || !canvas) return;
      width = canvas.width = container.clientWidth || 600;
      height = canvas.height = container.clientHeight || 500;
      initParticles();
    };

    window.addEventListener("resize", handleResize);

    // ========================================================================
    // Vortex Orb Kinematics Parameters (from uploaded specification)
    // ========================================================================
    const PARTICLE_COUNT = 3000;
    const SPIRAL_ARMS = 7;
    const BASE_ROTATION_SPEED = 0.0008;
    const BASE_PARTICLE_SIZE = 2;
    const TRAIL_FADE_ALPHA = 0.08; // 1 - 0.92 = 0.08 trail fade rate

    let time = 0;
    let particles: ParticleData[] = [];

    const initParticles = () => {
      particles = [];
      const maxRadius = Math.min(width, height) * 0.38;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const armIndex = Math.floor(Math.random() * SPIRAL_ARMS);
        const radius = 10 + Math.random() * (maxRadius - 10);
        const baseAngle = ((Math.PI * 2) / SPIRAL_ARMS) * armIndex;
        const speed = 0.02 - (radius / maxRadius) * 0.015;
        const size = BASE_PARTICLE_SIZE * (0.5 + Math.random());
        const alpha = 1.0 - (radius / maxRadius) * 0.7;
        const noiseOffset = Math.random() * 1000;

        // Rainbow spectral distribution across spiral arms
        const hueBase = (armIndex * 360) / SPIRAL_ARMS;
        const hueVar = ((radius / maxRadius) * 60) - 30;
        const hue = (hueBase + hueVar + 360) % 360;

        particles.push({
          angle,
          radius,
          armIndex,
          baseAngle,
          speed,
          size,
          alpha,
          noiseOffset,
          hue,
          sat: 100,
          bri: 90,
          hasGlow: Math.random() < 0.1,
          x: width / 2,
          y: height / 2,
        });
      }
    };

    initParticles();

    // Mouse tilt tracking for 3D presence
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      tiltRef.current.targetX = nx * 30;
      tiltRef.current.targetY = ny * 20;
    };

    const handleMouseLeave = () => {
      tiltRef.current.targetX = 0;
      tiltRef.current.targetY = 0;
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    // Initial canvas fill with dark obsidian tone
    ctx.fillStyle = "#07070a";
    ctx.fillRect(0, 0, width, height);

    // Main animation loop
    const render = () => {
      time += 1;

      // 1. Audio Coupling & Smooth Interpolation
      const targetSpeech = isOratorSpeaking ? 1.0 : 0.0;
      speechSmoothingRef.current += (targetSpeech - speechSmoothingRef.current) * 0.12;

      const targetUser = isUserSpeaking ? 1.0 : 0.0;
      userSmoothingRef.current += (targetUser - userSmoothingRef.current) * 0.12;

      const targetComplete = isInquestComplete ? 1.0 : 0.0;
      completeSmoothingRef.current += (targetComplete - completeSmoothingRef.current) * 0.08;

      // Sample live audio amplitude if available
      const audioSample = globalAudioEngine.sampleSignal(isOratorSpeaking ? 0.6 : 0.1);
      const audioRms = audioSample.rms;

      // Tilt smooth interpolation
      tiltRef.current.x += (tiltRef.current.targetX - tiltRef.current.x) * 0.06;
      tiltRef.current.y += (tiltRef.current.targetY - tiltRef.current.y) * 0.06;

      // 2. Exponential Decay Particle Trails
      // Instead of clearing the canvas, draw a semi-transparent dark rect to leave radiant glowing trails!
      ctx.fillStyle = `rgba(7, 7, 10, ${TRAIL_FADE_ALPHA})`;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2 + tiltRef.current.x;
      const cy = height / 2 + tiltRef.current.y;
      const maxRadius = Math.min(width, height) * 0.38;

      // 3. Shockwave propagation
      if (shockwaveStrengthRef.current > 0.01) {
        shockwaveRadiusRef.current += 7;
        shockwaveStrengthRef.current *= 0.94;

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, shockwaveRadiusRef.current, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(53, 224, 255, ${shockwaveStrengthRef.current * 0.6})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cx, cy, shockwaveRadiusRef.current * 0.85, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 158, 11, ${shockwaveStrengthRef.current * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();
      }

      // 4. Update and Draw 3,000 Particles along 7 Spiral Arms
      const speedMultiplier = 1.0 + speechSmoothingRef.current * 1.4 - userSmoothingRef.current * 0.4;
      const rotationSpeed = (BASE_ROTATION_SPEED + speechSmoothingRef.current * 0.002) * speedMultiplier;

      // Select particle #180 as anchor target for the 3D Vector Question Pin
      let anchorScreenX = cx;
      let anchorScreenY = cy;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Angular movement
        p.angle += p.speed * speedMultiplier + rotationSpeed;

        // Perlin Noise Perturbation
        const noiseVal = perlin2D(p.noiseOffset + time * 0.02, p.armIndex * 10);
        const perturbation = (noiseVal - 0.5) * 12;

        // Radial breathing and audio speech expansion
        const audioRadialBoost = speechSmoothingRef.current * (audioRms * 32);
        const absorptionInward = userSmoothingRef.current * (p.radius * 0.25);
        const breath = Math.sin(time * 0.03 + p.noiseOffset) * 6;

        const effectiveRadius = Math.max(
          4,
          p.radius + breath + perturbation + audioRadialBoost - absorptionInward
        );

        // Parametric Archimedean Logarithmic Spiral Geometry
        const spiralAngle = p.angle + p.baseAngle + effectiveRadius * 0.009;

        p.x = cx + Math.cos(spiralAngle) * effectiveRadius;
        p.y = cy + Math.sin(spiralAngle) * effectiveRadius;

        // Track anchor position for the question pin
        if (i === 180) {
          anchorScreenX = p.x;
          anchorScreenY = p.y;
        }

        // Color computation: dynamic chromatic spectrum
        let particleHue = p.hue;
        let particleSat = p.sat;
        let particleBri = 60 + Math.sin(time * 0.05 + p.angle) * 35;

        // Orator speaking: warm golden/cyan firestorm
        if (speechSmoothingRef.current > 0.1) {
          particleBri = Math.min(100, particleBri + speechSmoothingRef.current * 30);
        }

        // User speaking: inward magenta/violet gravity well
        if (userSmoothingRef.current > 0.1) {
          particleHue = (particleHue * 0.4 + 310 * 0.6 + 360) % 360;
          particleBri = Math.min(100, particleBri + 20);
        }

        // Inquest complete: emerald/cyan coherent resonance
        if (completeSmoothingRef.current > 0.1) {
          particleHue = (particleHue * 0.3 + 160 * 0.7 + 360) % 360;
          particleSat = 95;
          particleBri = 95;
        }

        // Shockwave interaction
        if (shockwaveStrengthRef.current > 0.05) {
          const distToWave = Math.abs(effectiveRadius - shockwaveRadiusRef.current);
          if (distToWave < 35) {
            particleBri = 100;
            particleSat = 40; // white-hot flash
          }
        }

        // Render particle with high-performance HSL/HSB fill
        ctx.fillStyle = `hsla(${particleHue}, ${particleSat}%, ${particleBri}%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Soft outer glow disk for accented particles
        if (p.hasGlow) {
          ctx.fillStyle = `hsla(${particleHue}, ${Math.max(20, particleSat - 30)}%, 90%, ${
            p.alpha * 0.25
          })`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Central Glowing Concentric Energy Core (from uploaded file)
      const corePulse = Math.sin(time * 0.05) * 18 + speechSmoothingRef.current * 16;
      const baseCenterSize = Math.max(30, 52 + corePulse);

      // Core Outer Halo
      const coreHue = completeSmoothingRef.current > 0.5 ? 160 : speechSmoothingRef.current > 0.5 ? 45 : 185;
      for (let k = 0; k < 3; k++) {
        const ringSize = baseCenterSize * (2.8 - k * 0.6);
        const ringAlpha = (0.12 - k * 0.035) * (1.0 + speechSmoothingRef.current * 0.5);

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, ringSize);
        grad.addColorStop(0, `hsla(${coreHue}, 100%, 80%, ${ringAlpha})`);
        grad.addColorStop(0.6, `hsla(${coreHue}, 100%, 60%, ${ringAlpha * 0.5})`);
        grad.addColorStop(1, `hsla(${coreHue}, 100%, 50%, 0)`);

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, ringSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner Luminous Core
      ctx.fillStyle = `hsla(${coreHue}, 80%, 95%, 0.85)`;
      ctx.beginPath();
      ctx.arc(cx, cy, 8 + Math.sin(time * 0.08) * 3, 0, Math.PI * 2);
      ctx.fill();

      // 6. Update 3D Surface Anchor Question Pin
      const pinVisible = Boolean(currentQuestionPrompt && currentQuestionPrompt.length > 0);
      setProjectedPin({
        label: `INQUEST ${String(currentQuestionIndex).padStart(2, "0")}/${totalQuestions}`,
        sub: currentQuestionPrompt,
        tag: isInquestComplete ? "RESONANCE" : isOratorSpeaking ? "DELIBERATION" : "THE ORATOR",
        screenX: anchorScreenX,
        screenY: anchorScreenY - 14,
        visible: pinVisible,
        colorScheme: isInquestComplete
          ? "emerald"
          : isOratorSpeaking
          ? "amber"
          : isUserSpeaking
          ? "magenta"
          : "cyan",
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [
    isOratorSpeaking,
    isUserSpeaking,
    isInquestComplete,
    currentQuestionPrompt,
    currentQuestionIndex,
    totalQuestions,
  ]);

  return (
    <div
      className={`relative h-full w-full select-none overflow-hidden ${
        hideBorders
          ? "bg-transparent"
          : "rounded-2xl border border-seam/90 bg-[#07070a] shadow-2xl"
      }`}
    >
      {/* Container holding the 2D/3D Particle Vortex Orb Canvas */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Top Status HUD Banner (Relocated strictly to top-0 / top-2 above the orb so the particle sphere and core vortex are 100% unobstructed) */}
      {projectedPin && projectedPin.visible && (
        <div className="pointer-events-none absolute top-2 inset-x-0 mx-auto z-30 flex justify-center px-3">
          <div
            className={`flex max-w-lg items-center justify-between gap-3 rounded-xl border px-3.5 py-1.5 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
              projectedPin.colorScheme === "amber"
                ? "border-amber-400/80 bg-amber-950/85 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/40"
                : projectedPin.colorScheme === "magenta"
                ? "border-pink-500/80 bg-pink-950/85 text-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.35)] ring-1 ring-pink-400/40"
                : projectedPin.colorScheme === "emerald"
                ? "border-emerald-400/80 bg-emerald-950/85 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-400/40"
                : "border-cyan-400/60 bg-cyan-950/85 text-cyan-300 shadow-[0_0_16px_rgba(53,224,255,0.3)]"
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span className="flex items-center gap-1.5 text-[8.5px] font-mono-hud font-bold tracking-wider uppercase shrink-0">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isOratorSpeaking ? "bg-amber-400 animate-ping" : "bg-cyan-400"
                  }`}
                />
                {projectedPin.tag}
              </span>
              <span className="text-[10px] font-mono text-pearl/90 truncate">
                "{projectedPin.sub}"
              </span>
            </div>

            <div className="shrink-0 font-extrabold text-[9px] text-pearl tracking-wider font-mono-hud bg-black/40 border border-white/10 px-2 py-0.5 rounded">
              {projectedPin.label}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

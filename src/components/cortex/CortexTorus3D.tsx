/**
 * CORTEX 3D Audio-Morphing Vocal Manifold
 * - Voice-reactive vertex displacement & acoustic morphing via WebGL ShaderMaterial
 * - Simplex noise displacement along surface normals scaled by vocal frequencies
 * - Inward sound absorption ripples during user speech
 * - Real-time Web Audio AnalyserNode integration (globalAudioEngine)
 * - 3D vector pin projection displaying the active 15-Question Orator Inquest prompt
 * - High-density emerald-cyan resonance state upon 15-question completion
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CortexPhase, CortexReasoningStep } from "../../lib/cortex/types";
import { cortexBus } from "../../lib/cortex/bus";
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

// -------------------------------------------------------------
// GLSL Shaders for Dynamic Vertex Displacement & Acoustic Morphing
// -------------------------------------------------------------
const TORUS_VERTEX_SHADER = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uSpeechCadence; // 0.0 when silent, 1.0 when Orator speaks
  uniform float uUserSpeaking;  // 1.0 when user speaks into microphone
  uniform float uPulseShockwave;// 1.0 decaying shockwave on question advance
  uniform float uCompleteState; // 1.0 when 15 questions complete

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  // Simplex 3D Noise Functions
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
               i.z + vec4(0.0, i1.z, i2.z, 1.0))
             + i.y + vec4(0.0, i1.y, i2.y, 1.0))
             + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vUv = uv;
    vNormal = normal;

    // 1. Silent Breathing: gentle, subtle low-frequency oscillation
    float breath = sin(uTime * 1.5 + position.x * 0.75 + position.y * 0.5) * 0.045;

    // 2. Orator Speaking: outward normal displacement with harmonic noise scaled by vocal frequencies
    // The ring undulates, breathes, and morphs like a resonant acoustic chamber
    vec3 sampleCoord = position * 0.85 + vec3(uTime * 2.4, uTime * 1.8, uTime * 2.1);
    float vocalNoise = snoise(sampleCoord);
    float oratorDisplacement = vocalNoise * (0.16 + uAudioLevel * 0.55) * uSpeechCadence;

    // 3. User Speaking: inward reactive ripple effect absorbing sound waves into center manifold
    float rDist = length(position.xy);
    float inwardRipple = sin(rDist * 4.8 - uTime * 8.0) * (0.10 + uAudioLevel * 0.35) * uUserSpeaking;

    // 4. Question Advance Shockwave
    float shockwave = sin(uPulseShockwave * 3.14159) * cos(position.x * 2.2) * 0.38;

    // 5. High-density coherent resonance upon 15-question completion
    float coherentResonance = sin(uTime * 2.2 + position.z * 3.0) * 0.04 * uCompleteState;

    float totalDisp = breath + oratorDisplacement - inwardRipple + shockwave + coherentResonance;
    vDisplacement = totalDisp;

    vec3 displacedPos = position + normal * totalDisp;
    vPosition = displacedPos;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPos, 1.0);
  }
`;

const TORUS_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uSpeechCadence;
  uniform float uUserSpeaking;
  uniform float uPulseShockwave;
  uniform float uCompleteState;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;
  varying vec2 vUv;

  void main() {
    // Acoustic palette
    vec3 cyan = vec3(0.208, 0.878, 1.0);     // #35e0ff
    vec3 amber = vec3(0.961, 0.620, 0.043);   // #f59e0b
    vec3 magenta = vec3(0.851, 0.275, 0.937); // #d946ef
    vec3 emerald = vec3(0.063, 0.725, 0.506); // #10b981
    vec3 obsidian = vec3(0.024, 0.055, 0.10); // #060e1a

    // Dynamic color shift during speech: Cyan -> Electric Amber -> Magenta deliberation
    vec3 vocalGlow = mix(cyan, amber, clamp(uSpeechCadence * (0.4 + uAudioLevel * 0.9), 0.0, 1.0));
    vocalGlow = mix(vocalGlow, magenta, clamp(sin(uTime * 3.2 + vPosition.x * 1.5) * 0.5 + 0.5, 0.0, 1.0) * uSpeechCadence);

    // User speech color: electric inward amber
    vec3 colorStage = mix(vocalGlow, amber, uUserSpeaking * 0.85);

    // Completed state: coherent emerald-cyan resonance state
    vec3 completeGlow = mix(emerald, cyan, sin(uTime * 2.0) * 0.5 + 0.5);
    vec3 activeColor = mix(colorStage, completeGlow, uCompleteState);

    // Shockwave pulse highlight
    activeColor = mix(activeColor, vec3(1.0, 1.0, 1.0), uPulseShockwave * 0.75);

    // Fresnel rim effect
    vec3 viewDir = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.2);

    // Procedural wireframe lattice grid from UVs
    vec2 grid = abs(fract(vUv * vec2(96.0, 32.0) - 0.5) - 0.5) / fwidth(vUv * vec2(96.0, 32.0));
    float lineDist = min(grid.x, grid.y);
    float wireAlpha = 1.0 - min(lineDist, 1.0);

    vec3 surface = mix(obsidian, activeColor, 0.32 + fresnel * 0.68 + abs(vDisplacement) * 2.2);
    vec3 wire = activeColor * (1.1 + fresnel * 0.5);

    vec3 finalRgb = mix(surface, wire, wireAlpha * 0.65);
    gl_FragColor = vec4(finalRgb, 0.90);
  }
`;

export default function CortexTorus3D({
  phase = "parse",
  consensusScore = 0.96,
  contextLoadPct = 76,
  tokPerSec = 380,
  reasoningSteps = [],
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
  const [projectedPin, setProjectedPin] = useState<ProjectedPin | null>(null);
  const [wireframeMode, setWireframeMode] = useState<boolean>(true);

  // References to Three objects for animation updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const torusMeshRef = useRef<THREE.Mesh | null>(null);
  const torusMaterialRef = useRef<THREE.ShaderMaterial | null>(null);
  const normalPointsRef = useRef<THREE.Points | null>(null);
  const torusPointsRef = useRef<THREE.Points | null>(null);

  // Speech envelope smoothing references
  const speechCadenceRef = useRef<number>(0);
  const userSpeakingRef = useRef<number>(0);
  const shockwaveRef = useRef<number>(0);
  const completeStateRef = useRef<number>(0);

  // Particle simulation buffers
  const normalDataRef = useRef<{
    u: Float32Array;
    v: Float32Array;
    dist: Float32Array;
    speedDist: Float32Array;
  } | null>(null);

  const driftDataRef = useRef<{
    u: Float32Array;
    v: Float32Array;
    r: Float32Array;
    speedU: Float32Array;
    speedV: Float32Array;
  } | null>(null);

  // Shockwave trigger effect
  useEffect(() => {
    if (shockwaveTrigger > 0) {
      shockwaveRef.current = 1.0;
    }
  }, [shockwaveTrigger]);

  // Main Three.js Scene Setup & Morphing Loop
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x03060c, 0.06);

    // 2. Camera
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 3.8, 8.2);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 14;
    controls.minDistance = 3.0;
    controls.autoRotate = false; // We drive rotation through dynamic acoustic resonance!
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x0a1424, 2.5);
    scene.add(ambientLight);

    const pointCyan = new THREE.PointLight(0x35e0ff, 5.0, 15);
    pointCyan.position.set(3, 4, 3);
    scene.add(pointCyan);

    const pointAmber = new THREE.PointLight(0xf59e0b, 4.0, 12);
    pointAmber.position.set(-3, -2, -2);
    scene.add(pointAmber);

    // 6. The Reasoning Torus Geometry (R = 2.8, r = 0.95, high-density mesh for fluid morphing)
    const R = 2.8;
    const r = 0.95;
    const torusGeo = new THREE.TorusGeometry(R, r, 48, 128);

    // Shader Material with dynamic uniforms
    const uniforms = {
      uTime: { value: 0 },
      uAudioLevel: { value: 0 },
      uSpeechCadence: { value: 0 },
      uUserSpeaking: { value: 0 },
      uPulseShockwave: { value: 0 },
      uCompleteState: { value: 0 },
    };

    const morphMaterial = new THREE.ShaderMaterial({
      vertexShader: TORUS_VERTEX_SHADER,
      fragmentShader: TORUS_FRAGMENT_SHADER,
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
    });
    torusMaterialRef.current = morphMaterial;

    const torusMesh = new THREE.Mesh(torusGeo, morphMaterial);
    torusMesh.rotation.x = Math.PI / 2.35;
    scene.add(torusMesh);
    torusMeshRef.current = torusMesh;

    // Concentric Equatorial Glow Rings
    const ringGeo = new THREE.TorusGeometry(R + 0.12, 0.018, 16, 96);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x35e0ff, transparent: true, opacity: 0.7 });
    torusMesh.add(new THREE.Mesh(ringGeo, ringMat));

    const ringAmberGeo = new THREE.TorusGeometry(R - 0.12, 0.015, 16, 80);
    const ringAmberMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.6 });
    torusMesh.add(new THREE.Mesh(ringAmberGeo, ringAmberMat));

    // Particle Texture Canvas (Soft radial glow)
    const particleCanvas = document.createElement("canvas");
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const pctx = particleCanvas.getContext("2d")!;
    const grad = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.35, "rgba(255, 255, 255, 0.85)");
    grad.addColorStop(0.7, "rgba(53, 224, 255, 0.5)");
    grad.addColorStop(1, "rgba(53, 224, 255, 0)");
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 32, 32);
    const pTexture = new THREE.CanvasTexture(particleCanvas);

    // Layer 1: Normal Radiation Particles (1,400 points)
    const normalCount = 1400;
    const normalPositions = new Float32Array(normalCount * 3);
    const normalColors = new Float32Array(normalCount * 3);

    const normU = new Float32Array(normalCount);
    const normV = new Float32Array(normalCount);
    const normDist = new Float32Array(normalCount);
    const normSpeed = new Float32Array(normalCount);

    const colCyan = new THREE.Color(0x35e0ff);
    const colAmber = new THREE.Color(0xf59e0b);
    const colMagenta = new THREE.Color(0xd946ef);

    for (let i = 0; i < normalCount; i++) {
      normU[i] = Math.random() * Math.PI * 2;
      normV[i] = Math.random() * Math.PI * 2;
      normDist[i] = Math.random() * 0.8;
      normSpeed[i] = 0.007 + Math.random() * 0.012;

      const curR = r + normDist[i];
      normalPositions[i * 3] = (R + curR * Math.cos(normV[i])) * Math.cos(normU[i]);
      normalPositions[i * 3 + 1] = (R + curR * Math.cos(normV[i])) * Math.sin(normU[i]);
      normalPositions[i * 3 + 2] = curR * Math.sin(normV[i]);

      const c = Math.random() > 0.6 ? colAmber : Math.random() > 0.5 ? colMagenta : colCyan;
      normalColors[i * 3] = c.r;
      normalColors[i * 3 + 1] = c.g;
      normalColors[i * 3 + 2] = c.b;
    }

    const normalGeometry = new THREE.BufferGeometry();
    normalGeometry.setAttribute("position", new THREE.BufferAttribute(normalPositions, 3));
    normalGeometry.setAttribute("color", new THREE.BufferAttribute(normalColors, 3));

    const normalMaterial = new THREE.PointsMaterial({
      size: 0.12,
      map: pTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const normalPoints = new THREE.Points(normalGeometry, normalMaterial);
    torusMesh.add(normalPoints);
    normalPointsRef.current = normalPoints;
    normalDataRef.current = { u: normU, v: normV, dist: normDist, speedDist: normSpeed };

    // Layer 2: Toroidal Circulation Particles (1,000 points)
    const driftCount = 1000;
    const driftPositions = new Float32Array(driftCount * 3);
    const driftColors = new Float32Array(driftCount * 3);
    const driftU = new Float32Array(driftCount);
    const driftV = new Float32Array(driftCount);
    const driftRad = new Float32Array(driftCount);
    const driftSpeedU = new Float32Array(driftCount);
    const driftSpeedV = new Float32Array(driftCount);

    for (let i = 0; i < driftCount; i++) {
      driftU[i] = Math.random() * Math.PI * 2;
      driftV[i] = Math.random() * Math.PI * 2;
      driftRad[i] = r * (0.8 + Math.random() * 0.4);
      driftSpeedU[i] = 0.004 + Math.random() * 0.008;
      driftSpeedV[i] = 0.006 + Math.random() * 0.014;

      const px = (R + driftRad[i] * Math.cos(driftV[i])) * Math.cos(driftU[i]);
      const py = (R + driftRad[i] * Math.cos(driftV[i])) * Math.sin(driftU[i]);
      const pz = driftRad[i] * Math.sin(driftV[i]);

      driftPositions[i * 3] = px;
      driftPositions[i * 3 + 1] = py;
      driftPositions[i * 3 + 2] = pz;

      driftColors[i * 3] = 0.21;
      driftColors[i * 3 + 1] = 0.88;
      driftColors[i * 3 + 2] = 1.0;
    }

    const driftGeometry = new THREE.BufferGeometry();
    driftGeometry.setAttribute("position", new THREE.BufferAttribute(driftPositions, 3));
    driftGeometry.setAttribute("color", new THREE.BufferAttribute(driftColors, 3));

    const driftMaterial = new THREE.PointsMaterial({
      size: 0.09,
      map: pTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const torusPoints = new THREE.Points(driftGeometry, driftMaterial);
    torusMesh.add(torusPoints);
    torusPointsRef.current = torusPoints;
    driftDataRef.current = { u: driftU, v: driftV, r: driftRad, speedU: driftSpeedU, speedV: driftSpeedV };

    // 3D Vector Pin Anchor Position for the Question Callout Badge
    const pinWorldPos = new THREE.Vector3(0.0, R + r + 0.25, 0.0);
    const screenCoord = new THREE.Vector3();

    // 7. Render & Acoustic Animation Loop
    let animationFrameId: number;
    let clockTime = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Sample Live Web Audio Signal
      const audioSignal = globalAudioEngine.sampleSignal();
      const rawLevel = Math.max(audioSignal.rms, audioSignal.amplitude * 0.5);

      clockTime += 0.016;

      // Smooth attack/decay for speech envelopes
      const targetCadence = isOratorSpeaking ? 1.0 : 0.0;
      speechCadenceRef.current += (targetCadence - speechCadenceRef.current) * (isOratorSpeaking ? 0.25 : 0.08);

      const targetUserSpeaking = isUserSpeaking ? 1.0 : 0.0;
      userSpeakingRef.current += (targetUserSpeaking - userSpeakingRef.current) * (isUserSpeaking ? 0.35 : 0.1);

      const targetComplete = isInquestComplete ? 1.0 : 0.0;
      completeStateRef.current += (targetComplete - completeStateRef.current) * 0.04;

      // Shockwave decay
      if (shockwaveRef.current > 0.01) {
        shockwaveRef.current *= 0.91;
      } else {
        shockwaveRef.current = 0.0;
      }

      // Update shader uniforms
      uniforms.uTime.value = clockTime;
      uniforms.uAudioLevel.value = rawLevel;
      uniforms.uSpeechCadence.value = speechCadenceRef.current;
      uniforms.uUserSpeaking.value = userSpeakingRef.current;
      uniforms.uPulseShockwave.value = shockwaveRef.current;
      uniforms.uCompleteState.value = completeStateRef.current;

      // Subtle dynamic acoustic rotation (not monotonous static spin)
      const rotationSpeed = 0.0012 + speechCadenceRef.current * 0.004 + userSpeakingRef.current * 0.006;
      torusMesh.rotation.z += rotationSpeed;
      torusMesh.rotation.y = Math.sin(clockTime * 0.8) * 0.12;

      // Acoustic Particle Morphing (Layer 1: Normal Radiation)
      if (normalDataRef.current && normalPointsRef.current) {
        const nPos = normalPointsRef.current.geometry.attributes.position.array as Float32Array;
        const { u, v, dist, speedDist } = normalDataRef.current;
        const particleSpeedMult = 1.0 + speechCadenceRef.current * 2.8 + rawLevel * 3.0;

        for (let i = 0; i < normalCount; i++) {
          dist[i] += speedDist[i] * particleSpeedMult;
          if (dist[i] > 1.3) {
            dist[i] = 0.02;
            u[i] = Math.random() * Math.PI * 2;
            v[i] = Math.random() * Math.PI * 2;
          }

          const curR = r + dist[i];
          nPos[i * 3] = (R + curR * Math.cos(v[i])) * Math.cos(u[i]);
          nPos[i * 3 + 1] = (R + curR * Math.cos(v[i])) * Math.sin(u[i]);
          nPos[i * 3 + 2] = curR * Math.sin(v[i]);
        }
        normalPointsRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // 3D Vector Pin Projection: Convert 3D world coordinate to 2D Screen Space
      pinWorldPos.set(0.0, R + r + 0.25 + Math.sin(clockTime * 1.5) * 0.05, 0.0);
      pinWorldPos.applyMatrix4(torusMesh.matrixWorld);

      screenCoord.copy(pinWorldPos);
      screenCoord.project(camera);

      // Check if coordinate is in front of camera
      const isVisible = screenCoord.z < 1.0;
      const screenX = ((screenCoord.x + 1) * width) / 2;
      const screenY = ((-screenCoord.y + 1) * height) / 2;

      // Determine active callout color scheme
      const colorScheme = isInquestComplete
        ? "emerald"
        : isOratorSpeaking
        ? "amber"
        : isUserSpeaking
        ? "magenta"
        : "cyan";

      setProjectedPin({
        label: `INQUEST ${String(currentQuestionIndex).padStart(2, "0")}/${totalQuestions}`,
        sub: currentQuestionPrompt,
        tag: isInquestComplete
          ? "REQUIREMENTS CONVERGED"
          : isOratorSpeaking
          ? "ORATOR SPEAKING"
          : isUserSpeaking
          ? "USER SPEAKING"
          : "ACTIVE INQUEST",
        screenX,
        screenY,
        visible: isVisible,
        colorScheme,
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 800;
      const newH = container.clientHeight || 500;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      torusGeo.dispose();
      morphMaterial.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      ringAmberGeo.dispose();
      ringAmberMat.dispose();
      normalGeometry.dispose();
      normalMaterial.dispose();
      driftGeometry.dispose();
      driftMaterial.dispose();
      pTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [
    isOratorSpeaking,
    isUserSpeaking,
    currentQuestionPrompt,
    currentQuestionIndex,
    totalQuestions,
    isInquestComplete,
  ]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 3.8, 8.2);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div
      className={`relative h-full w-full select-none overflow-hidden ${
        hideBorders
          ? "bg-transparent"
          : "rounded-2xl border border-seam/90 bg-abyss/90 shadow-2xl"
      }`}
    >
      {/* 3D WebGL Canvas Viewport */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Glowing 3D Vector Pin Anchored Directly to the Torus Surface */}
      {projectedPin && projectedPin.visible && (
        <div
          style={{
            left: `${projectedPin.screenX}px`,
            top: `${projectedPin.screenY}px`,
            transform: "translate(-50%, -100%)",
          }}
          className="pointer-events-none absolute z-30 transition-transform duration-75"
        >
          <div className="flex flex-col items-center">
            {/* Callout Card */}
            <div
              className={`flex max-w-[280px] sm:max-w-[340px] flex-col gap-1 rounded-xl border p-2.5 backdrop-blur-2xl shadow-2xl transition-all duration-300 ${
                projectedPin.colorScheme === "amber"
                  ? "border-amber-400 bg-amber-950/90 text-amber-300 shadow-[0_0_24px_rgba(245,158,11,0.5)] ring-1 ring-amber-400/50"
                  : projectedPin.colorScheme === "magenta"
                  ? "border-pink-500 bg-pink-950/90 text-pink-300 shadow-[0_0_24px_rgba(236,72,153,0.5)] ring-1 ring-pink-400/50"
                  : projectedPin.colorScheme === "emerald"
                  ? "border-emerald-400 bg-emerald-950/90 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.5)] ring-1 ring-emerald-400/50"
                  : "border-cyan-400 bg-cyan-950/90 text-cyan-300 shadow-[0_0_20px_rgba(53,224,255,0.45)]"
              }`}
            >
              <div className="flex items-center justify-between text-[8px] font-mono-hud font-bold tracking-wider uppercase">
                <span className="flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isOratorSpeaking ? "bg-amber-400 animate-ping" : "bg-cyan-400"
                    }`}
                  />
                  {projectedPin.tag}
                </span>
                <span className="text-[7.5px] opacity-75">ORATOR INQUEST</span>
              </div>

              <div className="font-extrabold text-[11px] text-pearl tracking-wide">
                [ {projectedPin.label} ]
              </div>

              <div className="text-[10px] font-mono leading-tight text-white/95 line-clamp-2">
                "{projectedPin.sub}"
              </div>
            </div>

            {/* Glowing Anchored Needle */}
            <div className="flex flex-col items-center">
              <div
                className={`h-5 w-0.5 ${
                  projectedPin.colorScheme === "amber"
                    ? "bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]"
                    : projectedPin.colorScheme === "emerald"
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,1)]"
                    : "bg-cyan-400 shadow-[0_0_8px_rgba(53,224,255,1)]"
                }`}
              />
              <div
                className={`h-2.5 w-2.5 rounded-full border border-pearl animate-pulse ${
                  projectedPin.colorScheme === "amber"
                    ? "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,1)]"
                    : projectedPin.colorScheme === "emerald"
                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,1)]"
                    : "bg-cyan-400 shadow-[0_0_10px_rgba(53,224,255,1)]"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {/* Only render diagnostic badges when cleanMode is false */}
      {!cleanMode && (
        <>
          <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg border border-seam/80 bg-abyss/85 px-3 py-1.5 font-mono-hud text-[10px] tracking-wider text-forge-cyan backdrop-blur-md">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isOratorSpeaking
                  ? "bg-amber-400 animate-ping"
                  : isInquestComplete
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-cyan-400 animate-ping"
              }`}
            />
            <span className="font-bold">THE ORATOR</span>
          </div>

          <div className="pointer-events-auto absolute right-3 top-3 flex items-center gap-1.5">
            <button
              onClick={resetCamera}
              className="rounded-lg border border-seam bg-depth px-2.5 py-1 font-mono-hud text-[9.5px] text-forge-dim transition-colors hover:border-forge-cyan/50 hover:text-pearl"
            >
              RESET CAM
            </button>
          </div>
        </>
      )}
    </div>
  );
}

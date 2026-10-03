/**
 * CORTEX 3D Reasoning Manifold
 * Three.js WebGL Toroidal State Machine with dynamic particle cloud,
 * vector normal rings, and projected 2D HTML callout annotations.
 */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { CortexPhase, CortexReasoningStep } from "../../lib/cortex/types";
import { cortexBus } from "../../lib/cortex/bus";

interface Props {
  phase: CortexPhase;
  consensusScore: number;
  contextLoadPct: number;
  tokPerSec: number;
  reasoningSteps: CortexReasoningStep[];
  onSelectStep?: (step: CortexReasoningStep) => void;
}

interface ProjectedAnnotation {
  id: string;
  step: CortexReasoningStep;
  screenX: number;
  screenY: number;
  visible: boolean;
}

export default function CortexTorus3D({
  phase,
  consensusScore,
  contextLoadPct,
  tokPerSec,
  reasoningSteps,
  onSelectStep,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [annotations, setAnnotations] = useState<ProjectedAnnotation[]>([]);
  const [wireframeMode, setWireframeMode] = useState<boolean>(true);
  const [particleDensity, setParticleDensity] = useState<"standard" | "dense">("standard");

  // Keep references to Three objects for animation updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const torusWireRef = useRef<THREE.Mesh | null>(null);
  const torusSolidRef = useRef<THREE.Mesh | null>(null);
  const particlePointsRef = useRef<THREE.Points | null>(null);
  const particleDataRef = useRef<{
    u: Float32Array;
    v: Float32Array;
    r: Float32Array;
    speedU: Float32Array;
    speedV: Float32Array;
  } | null>(null);

  // References to dynamic values without recreation
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const consensusRef = useRef(consensusScore);
  consensusRef.current = consensusScore;
  const loadRef = useRef(contextLoadPct);
  loadRef.current = contextLoadPct;
  const tokRef = useRef(tokPerSec);
  tokRef.current = tokPerSec;
  const stepsRef = useRef(reasoningSteps);
  stepsRef.current = reasoningSteps;

  // Pulse animation state on token
  const pulseRef = useRef<number>(0);

  useEffect(() => {
    const unsub = cortexBus.subscribe((e) => {
      if (e.type === "onToken") {
        pulseRef.current = Math.min(1.0, pulseRef.current + 0.15);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x060913, 0.08);

    // 2. Camera Setup
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 4.2, 7.8);
    cameraRef.current = camera;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 14;
    controls.minDistance = 2.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;
    controlsRef.current = controls;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0x0b172a, 1.8);
    scene.add(ambientLight);

    const pointLightCyan = new THREE.PointLight(0x35e0ff, 4, 12);
    pointLightCyan.position.set(3, 4, 3);
    scene.add(pointLightCyan);

    const pointLightMagenta = new THREE.PointLight(0xec4899, 3, 12);
    pointLightMagenta.position.set(-3, -2, -3);
    scene.add(pointLightMagenta);

    const pointLightEmerald = new THREE.PointLight(0x10b981, 2, 10);
    pointLightEmerald.position.set(0, 0, 0);
    scene.add(pointLightEmerald);

    // 6. The Reasoning Manifold (Torus r1=3, r2=1)
    const R = 3.0; // Major radius (r1=3)
    const r = 1.0; // Minor tube radius (r2=1)

    const torusGeo = new THREE.TorusGeometry(3.0, 1.0, 32, 100);
    
    // Wireframe lattice mesh
    const wireMat = new THREE.MeshStandardMaterial({
      color: 0x35e0ff,
      emissive: 0x0c314b,
      wireframe: true,
      transparent: true,
      opacity: 0.45,
      roughness: 0.2,
      metalness: 0.8,
    });
    const torusWire = new THREE.Mesh(torusGeo, wireMat);
    torusWire.rotation.x = Math.PI / 2.5;
    scene.add(torusWire);
    torusWireRef.current = torusWire;

    // Inner translucent core skin
    const solidMat = new THREE.MeshPhysicalMaterial({
      color: 0x071526,
      emissive: 0x051b2c,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.9,
      transmission: 0.6,
      ior: 1.4,
    });
    const torusSolid = new THREE.Mesh(torusGeo, solidMat);
    torusWire.add(torusSolid);
    torusSolidRef.current = torusSolid;

    // Equatorial Ring Accent
    const ringGeo = new THREE.TorusGeometry(R + 0.12, 0.02, 16, 96);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x35e0ff,
      transparent: true,
      opacity: 0.7,
    });
    const eqRing = new THREE.Mesh(ringGeo, ringMat);
    torusWire.add(eqRing);

    // Secondary Poloidal Ring
    const poloidalGeo = new THREE.TorusGeometry(r + 0.08, 0.015, 16, 64);
    const poloidalMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.6,
    });
    const polRing = new THREE.Mesh(poloidalGeo, poloidalMat);
    polRing.rotation.y = Math.PI / 2;
    polRing.position.x = R;
    torusWire.add(polRing);

    // 7. Dynamic Particle Point Cloud
    const particleCount = 2200;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);

    const uArr = new Float32Array(particleCount);
    const vArr = new Float32Array(particleCount);
    const rArr = new Float32Array(particleCount);
    const speedUArr = new Float32Array(particleCount);
    const speedVArr = new Float32Array(particleCount);

    const colorA = new THREE.Color(0x35e0ff); // cyan
    const colorB = new THREE.Color(0xa855f7); // purple
    const colorC = new THREE.Color(0x10b981); // emerald

    for (let i = 0; i < particleCount; i++) {
      uArr[i] = Math.random() * Math.PI * 2;
      vArr[i] = Math.random() * Math.PI * 2;
      rArr[i] = r + (Math.random() - 0.5) * 0.35;
      speedUArr[i] = 0.004 + Math.random() * 0.008;
      speedVArr[i] = 0.006 + Math.random() * 0.012;

      const px = (R + rArr[i] * Math.cos(vArr[i])) * Math.cos(uArr[i]);
      const py = (R + rArr[i] * Math.cos(vArr[i])) * Math.sin(uArr[i]);
      const pz = rArr[i] * Math.sin(vArr[i]);

      particlePositions[i * 3] = px;
      particlePositions[i * 3 + 1] = py;
      particlePositions[i * 3 + 2] = pz;

      const t = Math.random();
      const col = t < 0.5 ? colorA.clone().lerp(colorB, t * 2) : colorB.clone().lerp(colorC, (t - 0.5) * 2);
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    particleDataRef.current = {
      u: uArr,
      v: vArr,
      r: rArr,
      speedU: speedUArr,
      speedV: speedVArr,
    };

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute("color", new THREE.BufferAttribute(particleColors, 3));

    // Custom circular particle texture via HTML canvas
    const particleCanvas = document.createElement("canvas");
    particleCanvas.width = 32;
    particleCanvas.height = 32;
    const pctx = particleCanvas.getContext("2d")!;
    const grad = pctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, "rgba(255, 255, 255, 1)");
    grad.addColorStop(0.35, "rgba(255, 255, 255, 0.85)");
    grad.addColorStop(0.7, "rgba(53, 224, 255, 0.4)");
    grad.addColorStop(1, "rgba(53, 224, 255, 0)");
    pctx.fillStyle = grad;
    pctx.fillRect(0, 0, 32, 32);

    const pTexture = new THREE.CanvasTexture(particleCanvas);

    const particleMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      map: pTexture,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    torusWire.add(particlePoints);
    particlePointsRef.current = particlePoints;

    // 8. Animation & Render Loop
    let animationFrameId: number;
    const tempVec = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // System load modulates auto-rotation speed
      const load = loadRef.current;
      const speedMult = 0.5 + (load / 100) * 1.5;
      controls.autoRotateSpeed = 0.6 * speedMult;
      controls.update();

      // Dynamic Torus subtle breathing & wobble
      const time = performance.now() * 0.001;
      torusWire.rotation.z += 0.0015 * speedMult;
      torusWire.rotation.y = Math.sin(time * 0.4) * 0.12;

      // Pulse decay from token bursts
      if (pulseRef.current > 0.01) {
        pulseRef.current *= 0.92;
        torusWire.scale.setScalar(1.0 + pulseRef.current * 0.05);
      } else {
        torusWire.scale.setScalar(1.0);
      }

      // Update particles streaming across torus surface
      if (particleDataRef.current && particlePointsRef.current) {
        const pPositions = particlePointsRef.current.geometry.attributes.position.array as Float32Array;
        const pColors = particlePointsRef.current.geometry.attributes.color.array as Float32Array;
        const { u, v, r: rads, speedU, speedV } = particleDataRef.current;
        const consensus = consensusRef.current;
        const curPhase = phaseRef.current;

        // Base target color based on consensus / phase
        const targetColor = new THREE.Color();
        if (consensus > 0.9) {
          targetColor.setHex(0x10b981); // Emerald consensus
        } else if (curPhase === "retry") {
          targetColor.setHex(0xf59e0b); // Warning amber
        } else if (curPhase === "eval") {
          targetColor.setHex(0xa855f7); // Deliberation purple
        } else {
          targetColor.setHex(0x35e0ff); // Radiant cyan
        }

        const effectiveSpeed = (1 + load / 80) * (1 + pulseRef.current * 2);

        for (let i = 0; i < particleCount; i++) {
          u[i] = (u[i] + speedU[i] * effectiveSpeed) % (Math.PI * 2);
          v[i] = (v[i] + speedV[i] * effectiveSpeed) % (Math.PI * 2);

          const curR = rads[i] + Math.sin(u[i] * 3 + time) * 0.04;
          const px = (R + curR * Math.cos(v[i])) * Math.cos(u[i]);
          const py = (R + curR * Math.cos(v[i])) * Math.sin(u[i]);
          const pz = curR * Math.sin(v[i]);

          pPositions[i * 3] = px;
          pPositions[i * 3 + 1] = py;
          pPositions[i * 3 + 2] = pz;

          // Color blending towards target color
          pColors[i * 3] = THREE.MathUtils.lerp(pColors[i * 3], targetColor.r, 0.03);
          pColors[i * 3 + 1] = THREE.MathUtils.lerp(pColors[i * 3 + 1], targetColor.g, 0.03);
          pColors[i * 3 + 2] = THREE.MathUtils.lerp(pColors[i * 3 + 2], targetColor.b, 0.03);
        }

        particlePointsRef.current.geometry.attributes.position.needsUpdate = true;
        particlePointsRef.current.geometry.attributes.color.needsUpdate = true;
      }

      // Project 3D reasoning steps to 2D screen space for annotations
      const activeSteps = stepsRef.current.slice(0, 4);
      const projected: ProjectedAnnotation[] = [];

      activeSteps.forEach((step) => {
        if (!step.worldCoord) return;
        tempVec.set(step.worldCoord[0], step.worldCoord[1], step.worldCoord[2]);

        // Transform into torus local coordinate space
        tempVec.applyMatrix4(torusWire.matrixWorld);
        tempVec.project(camera);

        const isVisible = tempVec.z < 1.0;
        const screenX = ((tempVec.x + 1) * 0.5) * width;
        const screenY = ((-tempVec.y + 1) * 0.5) * height;

        if (isVisible && screenX > 20 && screenX < width - 20 && screenY > 20 && screenY < height - 20) {
          projected.push({
            id: step.id,
            step,
            screenX,
            screenY,
            visible: true,
          });
        }
      });

      setAnnotations(projected);
      renderer.render(scene, camera);
    };

    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      renderer.dispose();
      torusGeo.dispose();
      wireMat.dispose();
      solidMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      pTexture.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update wireframe mode
  useEffect(() => {
    if (torusWireRef.current) {
      const mat = torusWireRef.current.material as THREE.MeshStandardMaterial;
      mat.wireframe = wireframeMode;
    }
  }, [wireframeMode]);

  const resetCamera = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 4.2, 7.8);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  };

  return (
    <div className="relative h-full w-full select-none overflow-hidden rounded-2xl border border-seam/80 bg-abyss/90">
      {/* Three.js canvas container */}
      <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Tracked Annotations */}
      {annotations.map((ann) => {
        const isLoop = ann.step.loopBack;
        const badgeBorder = isLoop
          ? "border-forge-alert bg-forge-alert/10 text-forge-alert"
          : ann.step.confidence > 0.9
          ? "border-emerald-400 bg-emerald-950/40 text-emerald-300"
          : "border-forge-cyan bg-cyan-950/40 text-forge-cyan";

        return (
          <div
            key={ann.id}
            style={{
              left: `${ann.screenX}px`,
              top: `${ann.screenY}px`,
              transform: "translate(-50%, -100%)",
            }}
            onClick={() => onSelectStep?.(ann.step)}
            className="pointer-events-auto absolute z-20 transition-transform duration-75 hover:scale-105"
          >
            {/* Coordinate pin anchor */}
            <div className="flex flex-col items-center">
              <div
                className={`flex max-w-[210px] cursor-pointer flex-col gap-1 rounded-lg border px-2.5 py-1.5 backdrop-blur-md shadow-lg ${badgeBorder}`}
              >
                <div className="flex items-center justify-between gap-2 text-[9px] font-mono-hud font-bold tracking-wider uppercase">
                  <span>{ann.step.phase}</span>
                  <span className="opacity-80">{(ann.step.confidence * 100).toFixed(0)}% CONF</span>
                </div>
                <div className="line-clamp-1 text-[11px] font-semibold text-pearl">
                  {ann.step.title}
                </div>
                <div className="line-clamp-1 text-[9px] font-mono-hud text-forge-dim">
                  {ann.step.detail}
                </div>
              </div>

              {/* Pulsing beacon needle */}
              <div className="flex flex-col items-center">
                <div className={`h-4 w-px ${isLoop ? "bg-forge-alert" : "bg-forge-cyan"}`} />
                <div
                  className={`h-2 w-2 rounded-full border border-pearl ${
                    isLoop ? "bg-forge-alert animate-ping" : "bg-forge-cyan animate-pulse"
                  }`}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* 3D Viewport HUD Overlay Controls */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-seam/80 bg-abyss/80 px-2.5 py-1 font-mono-hud text-[10px] tracking-wider text-forge-cyan backdrop-blur-md">
          <span className="inline-block h-2 w-2 animate-ping rounded-full bg-forge-cyan" />
          <span>REASONING MANIFOLD // TORUS STATE MACHINE</span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={() => setWireframeMode((v) => !v)}
            className={`rounded border px-2 py-1 font-mono-hud text-[10px] transition-colors ${
              wireframeMode
                ? "border-forge-cyan/60 bg-forge-cyan/10 text-forge-cyan"
                : "border-seam bg-depth text-forge-dim hover:text-pearl"
            }`}
            title="Toggle Wireframe Lattice"
          >
            LATTICE
          </button>
          <button
            onClick={resetCamera}
            className="rounded border border-seam bg-depth px-2 py-1 font-mono-hud text-[10px] text-forge-dim transition-colors hover:border-forge-cyan/50 hover:text-pearl"
            title="Reset 3D Camera"
          >
            RESET CAM
          </button>
        </div>
      </div>

      {/* 3D Orbit Help Hint */}
      <div className="pointer-events-none absolute bottom-3 left-3 rounded border border-seam/60 bg-abyss/70 px-2 py-1 font-mono-hud text-[9px] tracking-wider text-forge-dim/80 backdrop-blur-sm">
        DRAG TO ROTATE · SCROLL TO ZOOM · SHIFT+DRAG TO PAN
      </div>

      {/* Active Phase & Consensus Watermark */}
      <div className="pointer-events-none absolute bottom-3 right-3 text-right font-mono-hud">
        <div className="text-[10px] tracking-widest text-forge-dim">MANIFOLD STATE</div>
        <div
          className={`text-xs font-bold uppercase tracking-wider ${
            consensusScore > 0.9 ? "text-emerald-400" : phase === "retry" ? "text-amber-400" : "text-forge-cyan"
          }`}
        >
          {phase} · {consensusScore > 0.9 ? "CONSENSUS CONVERGED" : "EVALUATING INVARIANTS"}
        </div>
      </div>
    </div>
  );
}

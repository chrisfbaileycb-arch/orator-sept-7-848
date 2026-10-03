import { useState } from "react";
import type { SessionApi } from "../lib/session";
import type { ScarcityTelemetry } from "../lib/types";
import type { DesignExploration } from "../lib/exploration-types";
import CortexTopologyMatrix from "./cortex/CortexTopologyMatrix";
import { SKILL_CODEX } from "../lib/skills";
import { MCP_BENCH } from "../lib/mcp";
import DesignExplorationDeck from "./DesignExplorationDeck";

/** ---------- Landing: ORATOR DESIGN STUDIO ---------- */

interface Props {
  session: SessionApi;
  telemetry: ScarcityTelemetry;
  explorations: DesignExploration[];
  remainingExplorations: number;
  onBeginExploration: () => void;
  onOpenSandbox: (exploration: DesignExploration) => void;
  onMoveToBuild: (exploration: DesignExploration) => void;
  onBook: () => void;
  onOpenBuildPasses: () => void;
  onOpenCortex?: () => void;
}

const APPRAISALS = [
  "Begin with three Design Explorations.",
  "Explore alternative workflows before committing to code.",
  "What you whisper to the orb, the forge models.",
  "Guided reasoning transforms intent into software.",
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Design Exploration",
    body: "Examine ideas, compare alternative workflows, and discover the right product direction. Three Design Explorations are included.",
  },
  {
    step: "02",
    title: "Concept Sandbox",
    body: "Interact with private, temporary sandboxes to test layouts, controls, and workflows with safe demonstration data.",
  },
  {
    step: "03",
    title: "Complete Orator Build",
    body: "When you are confident in the direction, initiate a Complete Orator Build to generate, verify, preview, and export.",
  },
  {
    step: "04",
    title: "Independent Hosting",
    body: "Complete the Deployment Questionnaire to receive unbiased hosting recommendations and clean handoff packages.",
  },
];

export default function Landing({
  session,
  telemetry,
  explorations,
  remainingExplorations,
  onBeginExploration,
  onOpenSandbox,
  onMoveToBuild,
  onBook,
  onOpenBuildPasses,
  onOpenCortex,
}: Props) {
  const [appraisal] = useState(() => Math.floor(Math.random() * APPRAISALS.length));

  return (
    <div className="relative mx-auto max-w-7xl px-3 sm:px-6 pb-28 pt-16">
      {/* ============ HERO & CORTEX REASONING MANIFOLD CENTERPIECE ============ */}
      <section className="relative flex flex-col items-center text-center">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-seam/80 bg-depth/70 px-3.5 py-1 font-mono-hud text-[9.5px] tracking-[0.2em] text-forge-cyan backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-forge-cyan animate-pulse-soft" />
            ORATOR DESIGN STUDIO // CORTEX REASONING MATRIX ACTIVE
          </div>

          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-pearl sm:text-4xl md:text-5xl">
            Discover your software
            <br />
            <span className="text-glow-cyan text-forge-cyan">with the Orator</span>
          </h1>
        </div>

        {/* Central 3D Canvas Torus & Telemetry Matrix (Directly replacing moon/sphere orb) */}
        <div className="relative my-4 w-full text-left">
          <CortexTopologyMatrix isModal={false} />
        </div>

        <div className="relative z-10 max-w-3xl">
          <p className="mx-auto text-[14px] leading-relaxed text-forge-dim">
            Three Design Explorations included. Deliberate architectures, inspect real-time agentic reasoning, and execute production-grade software delivery.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {remainingExplorations > 0 ? (
              <button onClick={onBeginExploration} className="btn-forge btn-primary px-9 py-4 text-xs">
                START DESIGN EXPLORATION →
              </button>
            ) : (
              <button onClick={onOpenBuildPasses} className="btn-forge btn-primary px-9 py-4 text-xs">
                START COMPLETE ORATOR BUILD →
              </button>
            )}
            <button onClick={onBook} className="btn-forge btn-ghost px-6 py-4 text-xs">
              BOOK A SLOT
            </button>
            <button onClick={onOpenBuildPasses} className="btn-forge btn-gold px-6 py-4 text-xs">
              BUILD PASSES ($49–$199)
            </button>
            {onOpenCortex && (
              <button
                onClick={onOpenCortex}
                className="btn-forge border border-forge-cyan/50 bg-cyan-950/40 px-6 py-4 text-xs text-forge-cyan shadow-glow hover:bg-cyan-900/50"
              >
                ⚡ EXPAND MATRIX
              </button>
            )}
          </div>

          <div className="mt-5 font-mono-hud text-[10.5px] tracking-[0.14em] text-forge-dim">
            {remainingExplorations > 0 ? (
              <>
                <span className="font-bold text-forge-cyan">{remainingExplorations}</span> DESIGN EXPLORATION{remainingExplorations === 1 ? "" : "S"} AVAILABLE
              </>
            ) : (
              <span className="text-forge-gold">✦ DESIGN EXPLORATIONS COMPLETED — MOVE TO A COMPLETE BUILD</span>
            )}
          </div>
        </div>

        <div key={appraisal} className="mt-8 font-mono-hud text-[10px] tracking-[0.3em] text-forge-dim/70 animate-drift-up">
          {APPRAISALS[appraisal]}
        </div>
      </section>

      {/* ============ DESIGN EXPLORATIONS DECK ============ */}
      <section className="mt-16">
        <DesignExplorationDeck
          explorations={explorations}
          remainingExplorations={remainingExplorations}
          onOpenSandbox={onOpenSandbox}
          onMoveToBuild={onMoveToBuild}
          onStartNewExploration={onBeginExploration}
        />
      </section>

      {/* ============ THE JOURNEY ============ */}
      <section className="mt-24">
        <div className="mb-8 flex items-center gap-4">
          <div className="h-px flex-1 bg-seam/60" />
          <div className="font-mono-hud text-[10px] tracking-[0.25em] text-forge-cyan">
            ORATOR DESIGN STUDIO METHODOLOGY
          </div>
          <div className="h-px flex-1 bg-seam/60" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((h) => (
            <div key={h.step} className="hud-panel p-5">
              <div className="font-mono-hud text-xs font-bold text-forge-cyan">{h.step}</div>
              <h3 className="mt-2 font-display text-base font-semibold text-pearl">{h.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-forge-dim">{h.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ CODEX & MCP PREVIEW ============ */}
      <section className="mt-24 grid gap-6 md:grid-cols-2">
        <div className="hud-panel p-6">
          <div className="font-mono-hud text-[9.5px] tracking-[0.2em] text-forge-gold">
            AUTONOMOUS TOOL CODEX
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold text-pearl">16 Integrated Forge Tools</h3>
          <p className="mt-2 text-xs text-forge-dim">
            From deterministic AST generation to invariant auditing, every tool runs inside an isolated execution boundary.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {SKILL_CODEX.slice(0, 8).map((s) => (
              <span key={s.id} className="rounded border border-seam bg-abyss/60 px-2 py-1 font-mono-hud text-[9.5px] text-forge-dim">
                {s.name}
              </span>
            ))}
          </div>
        </div>

        <div className="hud-panel p-6">
          <div className="font-mono-hud text-[9.5px] tracking-[0.2em] text-forge-cyan">
            MCP TOOL SERVER BENCH
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold text-pearl">Model Context Protocol</h3>
          <p className="mt-2 text-xs text-forge-dim">
            Connect external MCP providers for real-time repository analysis, database introspection, and cloud resource provisioning.
          </p>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {MCP_BENCH.map((m) => (
              <span key={m.id} className="rounded border border-seam bg-abyss/60 px-2 py-1 font-mono-hud text-[9.5px] text-forge-dim">
                {m.name}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

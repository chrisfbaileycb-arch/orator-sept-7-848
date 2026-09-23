import { useMemo } from "react";
import { INQUEST_QUESTIONS } from "../lib/inquest";

/**
 * THE SOUL-TRUTH GRAPH
 *
 * A living constellation that assembles one node at a time as the inquest is
 * answered. Each sealed answer lights its node, draws the connecting sinew back
 * toward the core, and inks its dimension into the ledger — so the "complete
 * soul-truth" of the build is watched taking shape, step by step.
 */

interface Props {
  /** Number of answers sealed so far (0..15). */
  doneCount: number;
  /** Index of the question currently being asked, or null when sealed. */
  currentIndex: number | null;
}

const PHASE_COLOR: Record<string, string> = {
  GENESIS: "#35e0ff",
  ARCHITECTURE: "#f2c14e",
  BACKEND: "#a78bfa",
  INTERFACE: "#eaf6ff",
  OPERATIONS: "#5ef2b0",
};

const W = 300;
const H = 400;
const CX = 150;
const CY = 196;

export default function SoulTruthGraph({ doneCount, currentIndex }: Props) {
  const total = INQUEST_QUESTIONS.length;

  const nodes = useMemo(
    () =>
      INQUEST_QUESTIONS.map((q, i) => {
        const t = i / (total - 1);
        const angle = -Math.PI / 2 + t * Math.PI * 3.0;
        const r = 40 + t * 128;
        return {
          q,
          i,
          x: CX + Math.cos(angle) * r,
          y: CY + Math.sin(angle) * r * 0.92,
          color: PHASE_COLOR[q.phase] ?? "#35e0ff",
        };
      }),
    [total]
  );

  // Path points: core first, then every node in sequence.
  const points = useMemo(() => [{ x: CX, y: CY }, ...nodes.map((n) => ({ x: n.x, y: n.y }))], [nodes]);
  const pct = Math.round((doneCount / total) * 100);
  const activeNode = currentIndex != null ? nodes[currentIndex] : null;

  return (
    <aside
      aria-label="Soul-Truth graph — the build's truth assembling"
      className="hud-panel corner-tick fixed left-4 top-24 z-20 hidden w-[300px] flex-col overflow-hidden p-3 lg:flex"
    >
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono-hud text-[10px] font-semibold tracking-[0.22em] text-pearl">
          SOUL&#8209;TRUTH
        </span>
        <span className="font-mono-hud text-[9px] tracking-[0.18em] text-forge-cyan/80">
          {doneCount}/{total} SEALED
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${doneCount} of ${total} soul-truths sealed`}
      >
        <defs>
          <radialGradient id="soul-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#eaf6ff" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#35e0ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#35e0ff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Connective sinew — dim skeleton, then lit segments as answers seal */}
        {points.slice(1).map((p, idx) => {
          const from = points[idx];
          const lit = idx < doneCount; // segment leading into node idx
          const color = nodes[idx].color;
          return (
            <line
              key={`seg-${idx}`}
              x1={from.x}
              y1={from.y}
              x2={p.x}
              y2={p.y}
              stroke={lit ? color : "#16283f"}
              strokeWidth={lit ? 1.6 : 1}
              strokeOpacity={lit ? 0.75 : 0.5}
              style={lit ? { filter: `drop-shadow(0 0 3px ${color})` } : undefined}
            />
          );
        })}

        {/* Core */}
        <circle cx={CX} cy={CY} r="26" fill="url(#soul-core)" />
        <circle cx={CX} cy={CY} r="6.5" fill="#eaf6ff">
          <animate attributeName="r" values="6.5;8;6.5" dur="3.2s" repeatCount="indefinite" />
        </circle>

        {/* Nodes */}
        {nodes.map((n) => {
          const sealed = n.i < doneCount;
          const isCurrent = currentIndex === n.i;
          return (
            <g key={n.q.id}>
              {isCurrent && (
                <circle cx={n.x} cy={n.y} r="9" fill="none" stroke={n.color} strokeWidth="1.4" strokeOpacity="0.9">
                  <animate attributeName="r" values="6;13;6" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="stroke-opacity" values="0.9;0;0.9" dur="1.6s" repeatCount="indefinite" />
                </circle>
              )}
              <circle
                cx={n.x}
                cy={n.y}
                r={sealed ? 5 : isCurrent ? 4.5 : 3}
                fill={sealed || isCurrent ? n.color : "#0b1424"}
                stroke={n.color}
                strokeWidth={sealed ? 0 : 1.2}
                strokeOpacity={sealed ? 1 : 0.5}
                style={sealed ? { filter: `drop-shadow(0 0 5px ${n.color})` } : undefined}
              />
            </g>
          );
        })}
      </svg>

      {/* Ledger footer: what is being sealed right now */}
      <div className="mt-1 border-t border-seam/50 pt-2">
        <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-seam/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forge-cyan to-forge-gold transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        {activeNode ? (
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ background: activeNode.color, boxShadow: `0 0 8px ${activeNode.color}` }}
            />
            <span className="font-mono-hud text-[9px] tracking-[0.14em] text-forge-dim">
              INKING&nbsp;·&nbsp;
              <span className="text-pearl">{activeNode.q.dimension.toUpperCase()}</span>
            </span>
          </div>
        ) : (
          <div className="font-mono-hud text-[9px] tracking-[0.14em] text-forge-gold text-glow-gold">
            SOUL&#8209;TRUTH COMPLETE
          </div>
        )}
      </div>
    </aside>
  );
}

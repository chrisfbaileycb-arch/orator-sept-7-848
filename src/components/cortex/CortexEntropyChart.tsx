/**
 * CORTEX Confidence Distribution Histogram & Token Entropy Bar Chart
 * Plus model consensus & state indicator matrix.
 */

import { useMemo } from "react";
import type { CortexAgent, CortexMetrics, CortexReasoningStep } from "../../lib/cortex/types";

interface Props {
  metrics: CortexMetrics;
  agents: CortexAgent[];
  reasoningSteps: CortexReasoningStep[];
}

export default function CortexEntropyChart({ metrics, agents, reasoningSteps }: Props) {
  // Compute confidence distribution histogram bins (0.5 - 1.0 in 5 buckets)
  const histogramBins = useMemo(() => {
    const buckets = [
      { label: "0.5-0.6", count: 0, min: 0.5, max: 0.6, color: "bg-red-500" },
      { label: "0.6-0.7", count: 0, min: 0.6, max: 0.7, color: "bg-amber-500" },
      { label: "0.7-0.8", count: 0, min: 0.7, max: 0.8, color: "bg-yellow-400" },
      { label: "0.8-0.9", count: 0, min: 0.8, max: 0.9, color: "bg-cyan-400" },
      { label: "0.9-1.0", count: 0, min: 0.9, max: 1.01, color: "bg-emerald-400" },
    ];

    // Seed with baseline plus recent reasoning steps
    buckets[0].count = 1;
    buckets[1].count = Math.max(1, metrics.loopCount);
    buckets[2].count = 3;
    buckets[3].count = 6;
    buckets[4].count = Math.floor(8 + metrics.consensusScore * 10);

    reasoningSteps.forEach((step) => {
      const b = buckets.find((bucket) => step.confidence >= bucket.min && step.confidence < bucket.max);
      if (b) b.count += 1;
    });

    const maxCount = Math.max(...buckets.map((b) => b.count), 1);
    return buckets.map((b) => ({ ...b, pct: (b.count / maxCount) * 100 }));
  }, [reasoningSteps, metrics.loopCount, metrics.consensusScore]);

  // Compute token entropy frequency spectrum bars (12 bars)
  const entropyBars = useMemo(() => {
    const bars: { heightPct: number; active: boolean }[] = [];
    const baseEntropy = metrics.tokenEntropy;
    for (let i = 0; i < 14; i++) {
      const noise = Math.sin(i * 0.8 + Date.now() * 0.002) * 0.25;
      const val = Math.max(10, Math.min(95, (baseEntropy + noise) * 100));
      bars.push({
        heightPct: val,
        active: val > 60,
      });
    }
    return bars;
  }, [metrics.tokenEntropy]);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-seam/90 bg-hull/80 p-3.5 backdrop-blur-md">
      {/* Confidence Distribution Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono-hud text-[11px] font-bold tracking-wider text-pearl">
            CONFIDENCE DISTRIBUTION & ENTROPY
          </span>
        </div>
        <span className="font-mono-hud text-[10px] text-forge-dim">
          ENTROPY: <span className="text-forge-cyan">{metrics.tokenEntropy.toFixed(3)}</span>
        </span>
      </div>

      {/* Dual Grid: Histogram on left, Entropy Bars on right */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Confidence Histogram */}
        <div className="flex flex-col justify-end gap-1 rounded-lg border border-seam/60 bg-abyss p-2.5">
          <div className="text-[9px] font-mono-hud tracking-wider text-forge-dim mb-1">
            CONFIDENCE HISTOGRAM
          </div>
          <div className="flex h-20 items-end gap-1.5 pt-1">
            {histogramBins.map((bin, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1 h-full justify-end">
                <div
                  style={{ height: `${bin.pct}%` }}
                  className={`w-full rounded-t transition-all duration-300 ${bin.color} opacity-85 shadow-sm`}
                  title={`${bin.label}: ${bin.count} occurrences`}
                />
                <span className="font-mono-hud text-[7px] text-forge-dim scale-90">
                  {bin.label.split("-")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Token Entropy Frequency Spectrum */}
        <div className="flex flex-col justify-end gap-1 rounded-lg border border-seam/60 bg-abyss p-2.5">
          <div className="text-[9px] font-mono-hud tracking-wider text-forge-dim mb-1">
            TOKEN ENTROPY SPECTRUM
          </div>
          <div className="flex h-20 items-end gap-1 pt-1">
            {entropyBars.map((bar, i) => (
              <div
                key={i}
                style={{ height: `${bar.heightPct}%` }}
                className={`flex-1 rounded-t transition-all duration-200 ${
                  bar.active
                    ? "bg-gradient-to-t from-cyan-500 to-pink-500"
                    : "bg-cyan-900/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Model Consensus & State Indicator Matrix */}
      <div className="grid grid-cols-3 gap-2 pt-1 font-mono-hud">
        {/* Active Agents */}
        <div className="rounded-lg border border-seam/60 bg-abyss/80 p-2 text-center">
          <div className="text-[8px] tracking-wider text-forge-dim uppercase">AGENTS ACTIVE</div>
          <div className="text-sm font-bold text-forge-cyan">
            {agents.filter((a) => a.status !== "idle").length}/{agents.length}
          </div>
        </div>

        {/* Loop Count */}
        <div className="rounded-lg border border-seam/60 bg-abyss/80 p-2 text-center">
          <div className="text-[8px] tracking-wider text-forge-dim uppercase">LOOP COUNT</div>
          <div className={`text-sm font-bold ${metrics.loopCount > 0 ? "text-amber-400" : "text-pearl"}`}>
            {metrics.loopCount} CYCLES
          </div>
        </div>

        {/* Consensus Score */}
        <div className="rounded-lg border border-seam/60 bg-abyss/80 p-2 text-center">
          <div className="text-[8px] tracking-wider text-forge-dim uppercase">CONSENSUS</div>
          <div className={`text-sm font-bold ${metrics.consensusScore > 0.85 ? "text-emerald-400" : "text-cyan-400"}`}>
            {(metrics.consensusScore * 100).toFixed(0)}%
          </div>
        </div>

        {/* Temperature */}
        <div className="rounded-lg border border-seam/60 bg-abyss/80 p-2 text-center">
          <div className="text-[8px] tracking-wider text-forge-dim uppercase">TEMPERATURE</div>
          <div className="text-xs font-semibold text-pearl">
            T = {metrics.temperature.toFixed(2)}
          </div>
        </div>

        {/* Perplexity */}
        <div className="rounded-lg border border-seam/60 bg-abyss/80 p-2 text-center">
          <div className="text-[8px] tracking-wider text-forge-dim uppercase">PERPLEXITY</div>
          <div className="text-xs font-semibold text-pearl">
            {metrics.perplexity.toFixed(2)} PPL
          </div>
        </div>

        {/* Token Velocity */}
        <div className="rounded-lg border border-seam/60 bg-abyss/80 p-2 text-center">
          <div className="text-[8px] tracking-wider text-forge-dim uppercase">TOKEN RATE</div>
          <div className="text-xs font-semibold text-forge-gold">
            {metrics.tokPerSec} tok/s
          </div>
        </div>
      </div>
    </div>
  );
}

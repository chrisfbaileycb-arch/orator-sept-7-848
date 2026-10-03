/**
 * CORTEX Multi-Trace Oscillating Signal Monitors
 * 60fps HTML5 Canvas multi-trace waveform monitor for:
 * 1. Context Load (Cyan)
 * 2. Latency / Response Time (Amber)
 * 3. Attention Entropy Spike (Magenta)
 */

import { useEffect, useRef, useState } from "react";
import type { CortexMetrics } from "../../lib/cortex/types";

interface Props {
  metrics: CortexMetrics;
}

export default function CortexOscilloscope({ metrics }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedTrace, setSelectedTrace] = useState<"all" | "context" | "latency" | "attention">("all");

  const metricsRef = useRef(metrics);
  metricsRef.current = metrics;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let time = 0;

    // History buffers for the 3 traces (180 points each)
    const pointsCount = 180;
    const traceContext: number[] = new Array(pointsCount).fill(30);
    const traceLatency: number[] = new Array(pointsCount).fill(40);
    const traceAttention: number[] = new Array(pointsCount).fill(20);

    const render = () => {
      animId = requestAnimationFrame(render);
      time += 0.04;

      const w = canvas.width;
      const h = canvas.height;
      const cur = metricsRef.current;

      // Push latest sampled values with gentle organic wave harmonics
      const contextTarget = cur.contextLoadPct;
      const latencyTarget = Math.min(100, (cur.latencyMs / 120) * 100);
      const attentionTarget = cur.attentionSpike * 100;

      const nextContext =
        contextTarget * 0.7 +
        Math.sin(time * 2.2) * 6 +
        Math.cos(time * 0.9) * 4;
      const nextLatency =
        latencyTarget * 0.8 +
        Math.sin(time * 4.1 + 1.2) * 8 +
        (Math.random() - 0.5) * 5;
      const nextAttention =
        attentionTarget * 0.85 +
        Math.cos(time * 3.5) * 7 +
        Math.sin(time * 1.1) * 3;

      traceContext.shift();
      traceContext.push(Math.max(5, Math.min(95, nextContext)));

      traceLatency.shift();
      traceLatency.push(Math.max(5, Math.min(95, nextLatency)));

      traceAttention.shift();
      traceAttention.push(Math.max(5, Math.min(95, nextAttention)));

      // Clear with phosphor persistence fade
      ctx.fillStyle = "rgba(7, 13, 24, 0.28)";
      ctx.fillRect(0, 0, w, h);

      // Cybernetic grid lines
      ctx.strokeStyle = "rgba(22, 40, 63, 0.4)";
      ctx.lineWidth = 1;

      const gridCols = 8;
      const gridRows = 5;
      for (let x = 0; x <= gridCols; x++) {
        const gx = (w / gridCols) * x;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, h);
        ctx.stroke();
      }
      for (let y = 0; y <= gridRows; y++) {
        const gy = (h / gridRows) * y;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(w, gy);
        ctx.stroke();
      }

      // Draw Trace function
      const drawTrace = (
        data: number[],
        color: string,
        glowColor: string,
        lineWidth: number = 1.6
      ) => {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.lineWidth = lineWidth;

        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
          const x = (w / (data.length - 1)) * i;
          // Invert y so 100 is at top, 0 at bottom
          const val = data[i];
          const y = h - (val / 100) * (h - 20) - 10;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        // Draw leading bright spark dot
        const lastX = w;
        const lastY = h - (data[data.length - 1] / 100) * (h - 20) - 10;
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 12;
        ctx.beginPath();
        ctx.arc(lastX - 2, lastY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      // Draw active traces
      if (selectedTrace === "all" || selectedTrace === "context") {
        drawTrace(traceContext, "#35e0ff", "rgba(53, 224, 255, 0.8)", 1.8);
      }
      if (selectedTrace === "all" || selectedTrace === "latency") {
        drawTrace(traceLatency, "#f59e0b", "rgba(245, 158, 11, 0.8)", 1.6);
      }
      if (selectedTrace === "all" || selectedTrace === "attention") {
        drawTrace(traceAttention, "#ec4899", "rgba(236, 72, 153, 0.8)", 1.6);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedTrace]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-seam/90 bg-hull/80 p-3.5 backdrop-blur-md">
      {/* Header & Trace selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-forge-cyan" />
          <span className="font-mono-hud text-[11px] font-bold tracking-wider text-pearl">
            OSCILLATING SIGNAL MONITORS
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono-hud text-[9px]">
          {(["all", "context", "latency", "attention"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setSelectedTrace(mode)}
              className={`rounded px-1.5 py-0.5 uppercase transition-colors ${
                selectedTrace === mode
                  ? "bg-forge-cyan/20 text-forge-cyan font-bold"
                  : "text-forge-dim hover:text-pearl"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* 60fps Canvas Display */}
      <div className="relative h-32 w-full overflow-hidden rounded-lg border border-seam/60 bg-abyss">
        <canvas
          ref={canvasRef}
          width={420}
          height={128}
          className="h-full w-full object-cover"
        />

        {/* Digital readouts overlay */}
        <div className="pointer-events-none absolute bottom-1.5 left-2 flex items-center gap-3 font-mono-hud text-[9px]">
          <span className="flex items-center gap-1 text-forge-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-forge-cyan" />
            CTX: {metrics.contextLoadPct}%
          </span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            LAT: {metrics.latencyMs}ms
          </span>
          <span className="flex items-center gap-1 text-pink-400">
            <span className="h-1.5 w-1.5 rounded-full bg-pink-400" />
            ATTN: {(metrics.attentionSpike * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

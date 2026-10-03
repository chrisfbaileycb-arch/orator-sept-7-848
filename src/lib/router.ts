import type { ModelExpert, InquestAnswer, ForgePlan } from "./types";
import { INQUEST_QUESTIONS } from "./inquest";

/** ---------- 16-Model Mixture-of-Experts Router (Multi-Provider Architecture) ----------
 *
 * The router selects the expert quorum for a forge run. In multi-provider mode,
 * Cheaper Inference serves as the preferred multi-provider route with OpenRouter,
 * direct providers, and deterministic autonomous fallback.
 */

export const EXPERT_ROSTER: ModelExpert[] = [
  { id: "exp-gemini-1", label: "Gemini-Architect", provider: "gemini", model: "gemini-3.8-flash", role: "architect", tier: "free" },
  { id: "exp-gemini-2", label: "Gemini-Synthesis", provider: "gemini", model: "gemini-3.8-flash", role: "backend", tier: "free" },
  { id: "exp-gemini-3", label: "Gemini-Audit", provider: "gemini", model: "gemini-3.8-flash", role: "security", tier: "free" },
  { id: "exp-arch-1", label: "ORATOR-Architect", provider: "gemini", model: "gemini-3.8-flash", role: "architect", tier: "paid" },
  { id: "exp-arch-2", label: "ORATOR-Architect-Lite", provider: "gemini", model: "gemini-3.8-flash", role: "architect", tier: "free" },
  { id: "exp-schema-1", label: "SchemaSmith", provider: "gemini", model: "gemini-3.8-flash", role: "schema", tier: "paid" },
  { id: "exp-schema-2", label: "SchemaSmith-Lite", provider: "gemini", model: "gemini-3.8-flash", role: "schema", tier: "free" },
  { id: "exp-be-1", label: "BackendForge", provider: "cheaper-inference", model: "openai/gpt-4o", role: "backend", tier: "paid" },
  { id: "exp-be-2", label: "BackendForge-Lite", provider: "gemini", model: "gemini-3.8-flash", role: "backend", tier: "free" },
  { id: "exp-fe-1", label: "FacadeWeaver", provider: "cheaper-inference", model: "anthropic/claude-3.5-sonnet", role: "frontend", tier: "paid" },
  { id: "exp-fe-2", label: "FacadeWeaver-Lite", provider: "gemini", model: "gemini-3.8-flash", role: "frontend", tier: "free" },
  { id: "exp-rev-1", label: "Adversary-Review", provider: "gemini", model: "gemini-3.8-flash", role: "review", tier: "paid" },
  { id: "exp-rev-2", label: "Adversary-Review-Lite", provider: "gemini", model: "gemini-3.8-flash", role: "review", tier: "free" },
  { id: "exp-sec-1", label: "Aegis-Security", provider: "cheaper-inference", model: "anthropic/claude-3.5-sonnet", role: "security", tier: "paid" },
  { id: "exp-sec-2", label: "Aegis-Security-Lite", provider: "gemini", model: "gemini-3.8-flash", role: "security", tier: "free" },
  { id: "exp-perf-1", label: "Kinetic-Perf", provider: "gemini", model: "gemini-3.8-flash", role: "performance", tier: "paid" },
];

/** Rotate quorum deterministically by client + question count so demo runs vary. */
export function selectQuorum(clientId: string, tier: "free" | "paid"): ModelExpert[] {
  const seed = Array.from(clientId).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const preferredTier = tier === "paid" ? "paid" : "free";
  const rotated = [...EXPERT_ROSTER].sort((a, b) => {
    const scoreA = (a.id.charCodeAt(4) * 31 + seed) % EXPERT_ROSTER.length;
    const scoreB = (b.id.charCodeAt(4) * 31 + seed) % EXPERT_ROSTER.length;
    if (scoreA !== scoreB) return scoreA - scoreB;
    return a.id.localeCompare(b.id);
  });
  // Paid tier leads with paid experts; free tier leads with lite experts.
  return rotated.sort((a, b) => {
    if (a.tier === preferredTier && b.tier !== preferredTier) return -1;
    if (b.tier === preferredTier && a.tier !== preferredTier) return 1;
    return 0;
  });
}

export interface RouterEvent {
  at: number;
  expert: string;
  action: string;
}

export function routerIntroLine(tier: "free" | "paid"): string {
  return tier === "paid"
    ? "Google Gemini Project engaged — high-reasoning quorum (gemini-3.8-flash), secondary routes on standby."
    : "Google Gemini Project engaged — native Gemini intelligence (gemini-3.8-flash), secondary routes on standby.";
}

/** Extract the archetype keyword used by the generator to theme the plan. */
export function archetypeFromAnswers(answers: Record<string, string>): string {
  const blob = Object.values(answers).join(" ").toLowerCase();
  const table: [RegExp, string][] = [
    [/(book|reserv|schedul|appointment)/, "booking"],
    [/(crm|lead|pipeline|contact)/, "crm"],
    [/(shop|store|ecommerce|commerce|cart|checkout)/, "commerce"],
    [/(habit|track|journal|streak)/, "tracker"],
    [/(chat|messag|social|forum)/, "social"],
    [/(dashboard|analytic|metric|report)/, "analytics"],
    [/(task|kanban|project|sprint)/, "tasks"],
    [/(learn|course|school|tutor|quiz)/, "learning"],
    [/(health|fitness|gym|workout)/, "fitness"],
    [/(file|document|note|wiki)/, "docs"],
  ];
  for (const [rx, archetype] of table) {
    if (rx.test(blob)) return archetype;
  }
  return "custom-tool";
}

export function appNameFromAnswers(answers: Record<string, string>): string {
  const raw = (answers["q1"] ?? "").trim();
  if (!raw) return "untitled-forge";
  const words = raw
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.length ? words.join("-") : "untitled-forge";
}

export function inquestDigest(answers: Record<string, string>): string {
  return INQUEST_QUESTIONS.map((q) => {
    const v = answers[q.id];
    if (!v) return null;
    return `${q.id.toUpperCase()} ${q.prompt} → ${v}`;
  })
    .filter(Boolean)
    .join("\n")
    .slice(0, 2000);
}

export function planTelemetry(plan: ForgePlan): string {
  return `archetype=${plan.archetype} experts=${plan.experts.length} files=${plan.files.length} audit=${plan.audit.score}%`;
}

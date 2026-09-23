import type { InquestAnswer } from "./types";

/** ---------- The 15-Question Conversational Inquest ---------- */

export interface InquestQuestion {
  id: string;
  phase: string;
  /** Short axis label plotted on the Soul-Truth graph as each answer seals. */
  dimension: string;
  prompt: string;
  /**
   * The Orator's guided, detailed spoken script for this question. This is the
   * backend narration the Orator recites aloud before it invites your answer —
   * it frames why the question matters and how it shapes the forge.
   */
  script: string;
  hint: string;
  placeholder: string;
  /** Short suggestions the user can tap to fill the input */
  suggestions?: string[];
}

export const INQUEST_QUESTIONS: InquestQuestion[] = [
  {
    id: "q1",
    phase: "GENESIS",
    dimension: "Essence",
    prompt: "What software are we forging today?",
    script:
      "We begin at the genesis. Before a single line is drawn, I must know the essence of the thing. Tell me, in one plain sentence, what software we are forging today — do not decorate it, simply name it, and the router will do the rest.",
    hint: "One sentence. Plain language. The router does the rest.",
    placeholder: "e.g. A booking system for a boutique climbing gym",
    suggestions: [
      "A booking system for a climbing gym",
      "An internal CRM for my agency",
      "A habit tracker with streak analytics",
    ],
  },
  {
    id: "q2",
    phase: "GENESIS",
    dimension: "Wielder",
    prompt: "Who exactly wields this software?",
    script:
      "Every tool is shaped by the hand that holds it. Name the wielder — the role, the persona, the human on the other side of the screen. Be specific, for this single truth bends every screen we forge.",
    hint: "Role or persona. Be specific — it shapes every screen.",
    placeholder: "e.g. Front-desk staff and members, on phones mostly",
  },
  {
    id: "q3",
    phase: "GENESIS",
    dimension: "Victory",
    prompt: "What single outcome defines success?",
    script:
      "Now define victory. If this product does only one thing, and does it flawlessly, what is that one thing? Speak the outcome that would let you call this a triumph, and I will make the quorum protect it.",
    hint: "If this product does only one thing perfectly, what is it?",
    placeholder: "e.g. A member books a class in under 30 seconds",
  },
  {
    id: "q4",
    phase: "ARCHITECTURE",
    dimension: "Domains",
    prompt: "Which domains live inside the system?",
    script:
      "We move to architecture. Every system is a small world of nouns. Name the domains that live inside yours — separated by commas — and the schema expert will normalize them into clean, load-bearing tables.",
    hint: "Comma-separated nouns. The schema expert will normalize them.",
    placeholder: "e.g. members, classes, bookings, payments, waitlists",
  },
  {
    id: "q5",
    phase: "ARCHITECTURE",
    dimension: "Authority",
    prompt: "Who may read, and who may write?",
    script:
      "Authority must be drawn before it can be defended. Tell me who may read and who may write — name each role and the powers it holds — so the guardians of access can be forged around them.",
    hint: "Name the roles and their powers.",
    placeholder: "e.g. Admins manage everything; members see only their bookings",
  },
  {
    id: "q6",
    phase: "ARCHITECTURE",
    dimension: "Invariants",
    prompt: "What must be true after every operation?",
    script:
      "Here lies the spine of the contract: the invariants. Tell me what must remain true after every single operation, no matter what. Each law you speak, the audit engine will enforce without mercy.",
    hint: "Invariants. The audit engine will enforce each one you list.",
    placeholder: "e.g. No double-booking a full class; payments always logged",
  },
  {
    id: "q7",
    phase: "BACKEND",
    dimension: "Foundation",
    prompt: "Where does data rest?",
    script:
      "We descend into the backend. Data must have a place to rest. Name your preference for its foundation — a database, a store — or grant me the choice, and I will lay the strongest stone I can.",
    hint: "Database or storage preference, if any.",
    placeholder: "e.g. Postgres, or SQLite for simplicity",
    suggestions: ["Postgres", "SQLite", "MongoDB", "You decide"],
  },
  {
    id: "q8",
    phase: "BACKEND",
    dimension: "Alliances",
    prompt: "What external services must it speak to?",
    script:
      "No system stands alone. Tell me the alliances it must keep — the external services it must speak to. Payments, mail, maps, whatever they may be. Name them, or tell me it stands alone.",
    hint: "Payments, email, maps — list any, or skip.",
    placeholder: "e.g. Stripe for payments, SendGrid for confirmations",
  },
  {
    id: "q9",
    phase: "BACKEND",
    dimension: "Resilience",
    prompt: "What happens when it fails?",
    script:
      "The measure of a system is how it falls. When something breaks — and it will — what must happen? Speak of the fallbacks, the retries, the moment a human must be summoned. This is your resilience.",
    hint: "Fallbacks, retries, human handoffs.",
    placeholder: "e.g. Show a retry banner and email admin after 3 failures",
  },
  {
    id: "q10",
    phase: "INTERFACE",
    dimension: "Stage",
    prompt: "Describe the primary screen.",
    script:
      "We rise into the interface. There is always one stage that carries the weight of the play — the single view where most of life is lived. Describe that primary screen to me as you imagine it.",
    hint: "The one view that carries 80% of usage.",
    placeholder: "e.g. Weekly grid of classes with instant booking",
  },
  {
    id: "q11",
    phase: "INTERFACE",
    dimension: "Temperament",
    prompt: "What is the visual temperament?",
    script:
      "Every interface has a temperament, a mood it wears before a word is read. Give me two or three adjectives — the feeling you want a first glance to leave behind — and the design experts will honor it.",
    hint: "Two or three adjectives.",
    placeholder: "e.g. Calm, premium, high-contrast",
  },
  {
    id: "q12",
    phase: "INTERFACE",
    dimension: "Vessel",
    prompt: "Which device deserves first-class care?",
    script:
      "Tell me the vessel that deserves first-class care. Is this born on the small glass of a phone, on the wide field of a desktop, or must both be served as equals? Where the hands are, the polish must follow.",
    hint: "Mobile-first, desktop-first, or both.",
    placeholder: "e.g. Mobile-first — members book from the gym floor",
    suggestions: ["Mobile-first", "Desktop-first", "Both equally"],
  },
  {
    id: "q13",
    phase: "OPERATIONS",
    dimension: "Sight",
    prompt: "What must be measurable on day one?",
    script:
      "We arrive at operations. What we cannot see, we cannot steer. Tell me what must be measurable on the very first day — the metrics, the events, the numbers you will watch — and I will forge the instruments of sight.",
    hint: "Metrics, events, dashboards.",
    placeholder: "e.g. Bookings per class, no-show rate, peak hours",
  },
  {
    id: "q14",
    phase: "OPERATIONS",
    dimension: "Horizon",
    prompt: "What is the growth edge for v2?",
    script:
      "Now look to the horizon. Name the one capability you will hunger for next — the growth edge beyond this first build. I will leave the seams open so the second version can rise without tearing the first.",
    hint: "One capability you'll want next.",
    placeholder: "e.g. Recurring memberships with auto-billing",
  },
  {
    id: "q15",
    phase: "OPERATIONS",
    dimension: "Covenant",
    prompt: "Any constraint the forge must respect?",
    script:
      "The final truth is a covenant. Name any constraint the forge must respect without question — a budget, a deadline, a banned tool, a compliance law. Speak it now, and every expert will bow to it.",
    hint: "Budget, deadlines, tech bans, compliance.",
    placeholder: "e.g. No paid tools; must run offline at the gym",
  },
];

export const INQUEST_PHASES = [
  "GENESIS",
  "ARCHITECTURE",
  "BACKEND",
  "INTERFACE",
  "OPERATIONS",
] as const;

export function phaseOf(index: number): string {
  return INQUEST_QUESTIONS[Math.min(index, INQUEST_QUESTIONS.length - 1)].phase;
}

/** Deterministic completion ratio helper for the halo ring */
export function ringProgress(index: number, total: number): number {
  return Math.max(0, Math.min(1, index / total));
}

export function summarizeInquest(answers: InquestAnswer[]): string {
  return answers
    .map((a) => {
      const q = INQUEST_QUESTIONS.find((q) => q.id === a.questionId);
      return `${q?.prompt ?? a.questionId}\n→ ${a.value}`;
    })
    .join("\n\n");
}

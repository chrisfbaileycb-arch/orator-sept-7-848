import React, { useState, useEffect, useRef } from "react";
import type { SessionApi } from "../lib/session";
import type { ScarcityTelemetry } from "../lib/types";
import type { DesignExploration } from "../lib/exploration-types";
import CortexTorus3D from "./cortex/CortexTorus3D";
import LivingBuildTree from "./LivingBuildTree";
import SlideOverAppViewport from "./SlideOverAppViewport";
import { INQUEST_QUESTIONS } from "../lib/inquest";
import { orate, hush, listen, listeningSupported, type ListenHandle } from "../lib/voice";

/**
 * THE WIZARD OF OZ THEATRICAL FORGE
 *
 * ACT I: THE AUDIENCE WITH THE ORATOR (CENTER STAGE)
 * - Zero clutter, pure grand obsidian chamber.
 * - The Orator (Three.js Torus Geometry) commands center stage.
 * - Morphing along its normals, breathing, and rippling dynamically to speech & mic audio.
 * - Single floating projected title: "I am The Orator. What shall we forge today?"
 * - Guided 15-Question Discovery with [SPEAK], animated waveforms, and shockwaves.
 *
 * ACT II: THE BIG TECH WEAVE (PROGRESSIVE BUILD TREE)
 * - The Orator glides to the left flank holding glowing deliberation.
 * - The right pane draws downward in real time (Gemini -> AWS -> Claude -> Azure).
 * - Terminal button: [ THE SOFTWARE IS FORGED · CLICK TO ENTER ]
 *
 * ACT III: THE REVEAL (INTERACTIVE SLIDE-OVER)
 * - Full-height viewport smoothly slides in.
 * - Live working iframe preview.
 * - Top bar: [← Return to Chamber] [Push to GitHub] [Download Project ZIP]
 */

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

export default function Landing({
  session,
  onBeginExploration,
  onOpenBuildPasses,
}: Props) {
  // Acts: "audience" (Center stage) | "weave" (Left flank + Build tree) | "reveal" (Slide-over iframe)
  const [currentAct, setCurrentAct] = useState<"audience" | "weave" | "reveal">("audience");

  // Inquest question tracking (0 to 14)
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: "Print app with micro fighting",
  });
  const [activePrompt, setActivePrompt] = useState<string>(
    "Print app with micro fighting"
  );
  const [inputValue, setInputValue] = useState("");
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState<boolean>(false);

  // Vocal & Shockwave state
  const [isOratorSpeaking, setIsOratorSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [shockwaveTrigger, setShockwaveTrigger] = useState(0);
  const [waveHeights, setWaveHeights] = useState<number[]>([12, 20, 28, 16, 24, 18, 14]);

  // Weave orchestration state
  const [isTreeComplete, setIsTreeComplete] = useState(false);
  const [activeAgentName, setActiveAgentName] = useState("Google Gemini");
  const [isAgentGenerating, setIsAgentGenerating] = useState(true);

  const listenHandleRef = useRef<ListenHandle | null>(null);

  const currentQ = INQUEST_QUESTIONS[currentQIndex] || INQUEST_QUESTIONS[0];

  // Waveform animation reactive to speech
  useEffect(() => {
    const isPulsing = isOratorSpeaking || isUserSpeaking || (currentAct === "weave" && isAgentGenerating);
    const interval = setInterval(() => {
      if (isPulsing) {
        setWaveHeights([
          Math.floor(8 + Math.random() * 24),
          Math.floor(14 + Math.random() * 26),
          Math.floor(18 + Math.random() * 28),
          Math.floor(12 + Math.random() * 24),
          Math.floor(16 + Math.random() * 26),
          Math.floor(10 + Math.random() * 22),
          Math.floor(14 + Math.random() * 24),
        ]);
      } else {
        setWaveHeights([8, 12, 16, 12, 14, 10, 8]);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [isOratorSpeaking, isUserSpeaking, currentAct, isAgentGenerating]);

  // Speak current question
  const speakCurrentQuestion = async () => {
    if (isOratorSpeaking) {
      hush();
      setIsOratorSpeaking(false);
      return;
    }
    try {
      setIsOratorSpeaking(true);
      await orate(currentQ.prompt);
    } catch {
      // ignore
    } finally {
      setIsOratorSpeaking(false);
    }
  };

  // User voice toggle
  const toggleUserListening = async () => {
    if (isUserSpeaking) {
      if (listenHandleRef.current) {
        listenHandleRef.current.stop();
        listenHandleRef.current = null;
      }
      setIsUserSpeaking(false);
      return;
    }

    if (!listeningSupported()) {
      setIsUserSpeaking(true);
      setTimeout(() => {
        setIsUserSpeaking(false);
        handleAnswer(inputValue || "Multi-tenant POS order bridge with Gemini ingestion and Claude logic");
      }, 2400);
      return;
    }

    try {
      setIsUserSpeaking(true);
      const result = await listen({
        onPartial: (p) => setInputValue(p),
      });
      listenHandleRef.current = result.handle;
      if (result.text) {
        handleAnswer(result.text);
      }
    } catch {
      // fallback
    } finally {
      setIsUserSpeaking(false);
    }
  };

  // Answer handler
  const handleAnswer = (text: string) => {
    if (!text.trim()) return;
    const cleanText = text.trim();
    const updated = { ...answers, [currentQ.id]: cleanText };
    setAnswers(updated);
    session.recordAnswer(currentQ.id, cleanText);
    setInputValue("");

    // Entity pulses with a radiant shockwave
    setShockwaveTrigger((v) => v + 1);

    // If Question 1, set as activePrompt
    if (currentQIndex === 0) {
      setActivePrompt(cleanText);
    }

    // Advance to next question or conclude into Act II
    if (currentQIndex < INQUEST_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      transitionToWeave();
    }
  };

  // Transition from Act I (Audience) to Act II (Big Tech Weave)
  const transitionToWeave = async () => {
    setCurrentAct("weave");
    setIsTreeComplete(false);
    setIsAgentGenerating(true);
    setActiveAgentName("Google Gemini");

    try {
      setIsOratorSpeaking(true);
      await orate("Requirements converged. Generating architectural blueprints.");
    } catch {
      // ignore
    } finally {
      setIsOratorSpeaking(false);
    }
  };

  // Return to Chamber from Act III
  const returnToChamber = () => {
    setCurrentAct("weave");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#07070a] text-pearl flex flex-col justify-between p-4 sm:p-6 select-none font-mono-hud">
      {/* Subtle Chamber Watermark */}
      <div className="absolute top-4 left-6 z-20 pointer-events-none opacity-40 text-[9px] tracking-[0.3em] font-bold text-forge-dim uppercase">
        ORATOR // THE FORGE
      </div>

      {/* ========================================================================= */}
      {/* ACT I: THE AUDIENCE WITH THE ORATOR (CENTER STAGE)                       */}
      {/* ========================================================================= */}
      {currentAct === "audience" && (
        <div className="relative flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-between py-2 sm:py-6 animate-in fade-in duration-700">
          {/* The Orator 3D Torus commands center stage */}
          <div className="relative w-full h-[46vh] sm:h-[50vh] flex items-center justify-center">
            <CortexTorus3D
              cleanMode={true}
              hideBorders={true}
              isOratorSpeaking={isOratorSpeaking}
              isUserSpeaking={isUserSpeaking}
              currentQuestionPrompt={currentQ.prompt}
              currentQuestionIndex={currentQIndex + 1}
              totalQuestions={15}
              shockwaveTrigger={shockwaveTrigger}
            />
          </div>

          {/* Underneath: Floating Projected Title & 15-Question Discovery */}
          <div className="w-full flex flex-col items-center text-center space-y-3 z-20">
            {/* Projected Title */}
            <div className="space-y-1">
              <h1 className="text-lg sm:text-2xl font-extrabold tracking-wider text-pearl drop-shadow-[0_0_24px_rgba(255,255,255,0.25)]">
                "I am The Orator. What shall we forge today?"
              </h1>
              <div className="text-[11px] text-cyan-300/80 font-bold tracking-widest uppercase">
                DISCOVERY INQUEST · QUESTION {String(currentQIndex + 1).padStart(2, "0")} OF 15 ({currentQ.phase})
              </div>
            </div>

            {/* Current Question Inquest Anchor */}
            <div className="w-full max-w-2xl bg-[#090e18]/80 border border-seam/80 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <div className="flex items-center justify-between text-[10px] text-forge-dim border-b border-seam/40 pb-2 mb-2.5">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  CURRENT INQUIRY
                </span>
                <button
                  type="button"
                  onClick={speakCurrentQuestion}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition ${
                    isOratorSpeaking
                      ? "bg-amber-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.8)]"
                      : "text-gray-400 hover:text-cyan-300"
                  }`}
                >
                  {isOratorSpeaking ? "🔊 ORATOR SPEAKING…" : "🎙 READ QUESTION"}
                </button>
              </div>

              <h2 className="text-sm sm:text-base font-bold text-white mb-1.5">
                {currentQ.prompt}
              </h2>
              <p className="text-[10.5px] text-forge-dim font-mono mb-3">
                {currentQ.hint}
              </p>

              {/* Suggestion Chips */}
              {currentQ.suggestions && currentQ.suggestions.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1.5 mb-3.5">
                  {currentQ.suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleAnswer(s)}
                      className="rounded-full border border-seam bg-depth px-3 py-1 text-[10px] text-cyan-200 hover:border-cyan-400 hover:bg-cyan-950/60 transition"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Minimalist Audio & Input Dock */}
              <div className="flex items-center gap-2 pt-2 border-t border-seam/40">
                {/* Amber [SPEAK] Button with Audio Waveform */}
                <button
                  type="button"
                  onClick={toggleUserListening}
                  className={`btn-forge shrink-0 rounded-xl px-3.5 py-2 text-[11px] font-bold transition-all ${
                    isUserSpeaking
                      ? "bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.8)]"
                      : "bg-gradient-to-r from-amber-500 to-amber-400 text-black hover:scale-[1.02] shadow-[0_0_14px_rgba(245,158,11,0.35)]"
                  }`}
                  title="Voice Input (Mic)"
                >
                  <span className="flex items-center gap-2">
                    <span className="flex items-end gap-0.5 h-3.5">
                      {waveHeights.map((h, i) => (
                        <span
                          key={i}
                          style={{ height: `${h * 0.7}px` }}
                          className={`w-0.5 rounded-full transition-all duration-100 ${
                            isUserSpeaking ? "bg-white" : "bg-black"
                          }`}
                        />
                      ))}
                    </span>
                    <span>{isUserSpeaking ? "LISTENING…" : "SPEAK"}</span>
                  </span>
                </button>

                {/* Text input */}
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAnswer(inputValue);
                  }}
                  placeholder={currentQ.placeholder}
                  className="flex-1 bg-[#040810]/90 border border-seam/80 rounded-xl px-3.5 py-2 font-mono text-[12px] text-pearl placeholder:text-gray-600 outline-none focus:border-cyan-400"
                />

                <button
                  type="button"
                  onClick={() => handleAnswer(inputValue)}
                  className="btn-forge btn-primary px-4 py-2 text-[11px] font-bold shrink-0 rounded-xl"
                >
                  DISPATCH ↵
                </button>
              </div>
            </div>

            {/* Quick action to begin Weave immediately */}
            <div className="pt-1 flex items-center gap-4 text-[10px]">
              <button
                type="button"
                onClick={transitionToWeave}
                className="text-cyan-300 hover:text-white font-bold tracking-wider transition underline underline-offset-4"
              >
                SKIP INQUEST &amp; BEGIN BIG TECH WEAVE ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACT II: THE BIG TECH WEAVE (PROGRESSIVE BUILD TREE)                       */}
      {/* ========================================================================= */}
      {currentAct === "weave" && (
        <div className="relative flex-1 w-full grid grid-cols-12 h-full gap-4 overflow-hidden animate-in fade-in duration-700">
          {/* Left Flank (5 cols): The Orator glides to the flank */}
          <div className="col-span-12 lg:col-span-5 h-full min-h-0 flex flex-col justify-between rounded-2xl border border-seam/70 bg-[#090e18]/80 p-4 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-seam/40 pb-2 text-[10px]">
              <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                ORATOR DELIBERATION CHAMBER
              </span>
              <button
                type="button"
                onClick={() => setCurrentAct("audience")}
                className="text-forge-dim hover:text-pearl text-[9.5px]"
              >
                ← Back to Audience
              </button>
            </div>

            {/* The Orator in Deliberation state */}
            <div className="relative flex-1 min-h-[220px]">
              <CortexTorus3D
                cleanMode={true}
                hideBorders={true}
                isOratorSpeaking={isOratorSpeaking}
                currentQuestionPrompt={activePrompt}
                currentQuestionIndex={15}
                totalQuestions={15}
                isInquestComplete={true}
              />
            </div>

            {/* Deliberation Transcript Quote */}
            <div className="rounded-xl border border-seam/60 bg-[#040810] p-3 text-[10.5px] font-mono text-gray-300">
              <div className="text-[9px] text-forge-gold uppercase font-bold mb-1">TARGET SPECIFICATION:</div>
              <p className="line-clamp-2 italic">"{activePrompt}"</p>
            </div>
          </div>

          {/* Right Pane (7 cols): The Big Tech Weave Living Tree */}
          <div className="col-span-12 lg:col-span-7 h-full min-h-0 overflow-hidden">
            <LivingBuildTree
              activePrompt={activePrompt}
              onLaunchApp={() => setIsAppDrawerOpen(true)}
              onActiveAgentChange={(agent, generating) => {
                setActiveAgentName(agent);
                setIsAgentGenerating(generating);
              }}
              isComplete={isTreeComplete}
              setIsComplete={setIsTreeComplete}
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ACT III: THE REVEAL (INTERACTIVE SLIDE-OVER LAUNCHPAD)                     */}
      {/* ========================================================================= */}
      <SlideOverAppViewport
        isOpen={isAppDrawerOpen}
        activePrompt={activePrompt}
        onClose={() => setIsAppDrawerOpen(false)}
      />
    </div>
  );
}

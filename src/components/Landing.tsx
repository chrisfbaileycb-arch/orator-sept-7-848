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
 * THE WIZARD OF OZ THEATRICAL FORGE — THE ORATOR
 *
 * ACT I: THE AUDIENCE WITH THE ORATOR (CENTER STAGE)
 * - Part A: Initial Exploratory Dialogue Back-and-Forth:
 *   * The Orator speaks naturally on arrival ("Hello, I am The Orator. Nice to meet you...").
 *   * Live speech-to-text continuously renders directly inside the chat box in real time.
 *   * Customer and The Orator talk out problems, workflows, and edge cases before building.
 *   * The Orator automatically speaks responses on its own without requiring any buttons.
 * - Part B: 15-Question Architectural Inquest:
 *   * Seamless transition to formalize schemas, APIs, and deployment invariants.
 *   * The Orator automatically speaks each question as it loads.
 *   * Speech-to-text continuously renders live into the answer field.
 *
 * ACT II: THE BIG TECH WEAVE (PROGRESSIVE BUILD TREE)
 * - Left flank deliberation + living pipeline draw (Gemini -> AWS -> Claude -> Azure).
 *
 * ACT III: THE REVEAL (INTERACTIVE SLIDE-OVER LAUNCHPAD)
 * - Live compiled application iframe preview & source export.
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

interface ChatMessage {
  id: string;
  role: "orator" | "user";
  text: string;
  timestamp: number;
}

const INITIAL_GREETING =
  "Hello, I am The Orator. Nice to meet you. Welcome to the Forge. Before we spin up the 15-question architectural inquest, tell me: what vision, problem, or application is on your mind today?";

export default function Landing({
  session,
  onBeginExploration,
  onOpenBuildPasses,
}: Props) {
  // Acts: "audience" (Center stage) | "weave" (Left flank + Build tree) | "reveal" (Slide-over iframe)
  const [currentAct, setCurrentAct] = useState<"audience" | "weave" | "reveal">("audience");

  // Audience Sub-modes: "dialogue" (pre-build chat back-and-forth) | "inquest" (15-question build phase)
  const [audienceMode, setAudienceMode] = useState<"dialogue" | "inquest">("dialogue");

  // Dialogue Chat History
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "msg-0",
      role: "orator",
      text: INITIAL_GREETING,
      timestamp: Date.now(),
    },
  ]);
  const [isOratorThinking, setIsOratorThinking] = useState(false);

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
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const hasSpokenInitialRef = useRef(false);

  const currentQ = INQUEST_QUESTIONS[currentQIndex] || INQUEST_QUESTIONS[0];

  // Auto-scroll chat to latest message
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isOratorThinking]);

  // =========================================================================
  // NATURAL ORATOR SPEECH: Speaks automatically on arrival without buttons
  // =========================================================================
  useEffect(() => {
    let unmounted = false;

    const playGreeting = async () => {
      // Small pause to allow browser audio engine & voices to settle
      await new Promise((r) => setTimeout(r, 650));
      if (unmounted || hasSpokenInitialRef.current) return;
      hasSpokenInitialRef.current = true;
      try {
        setIsOratorSpeaking(true);
        await orate(INITIAL_GREETING);
      } catch {
        // Fallback for browsers requiring gesture
      } finally {
        if (!unmounted) setIsOratorSpeaking(false);
      }
    };

    playGreeting();

    // Fallback gesture listener in case browser blocked autoplay audio before first click
    const handleGesture = () => {
      window.removeEventListener("pointerdown", handleGesture);
      window.removeEventListener("keydown", handleGesture);
      if (!hasSpokenInitialRef.current) {
        hasSpokenInitialRef.current = true;
        playGreeting();
      }
    };

    window.addEventListener("pointerdown", handleGesture);
    window.addEventListener("keydown", handleGesture);

    return () => {
      unmounted = true;
      window.removeEventListener("pointerdown", handleGesture);
      window.removeEventListener("keydown", handleGesture);
    };
  }, []);

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

  // =========================================================================
  // NATURAL QUESTION AUTO-SPEECH: Reads question automatically when index changes
  // =========================================================================
  useEffect(() => {
    if (audienceMode === "inquest" && currentAct === "audience") {
      let isCancelled = false;
      const speakQuestionAloud = async () => {
        try {
          hush();
          setIsOratorSpeaking(true);
          await orate(currentQ.prompt);
        } catch {
          // ignore
        } finally {
          if (!isCancelled) setIsOratorSpeaking(false);
        }
      };

      const timer = setTimeout(speakQuestionAloud, 250);
      return () => {
        isCancelled = true;
        clearTimeout(timer);
      };
    }
  }, [currentQIndex, audienceMode, currentAct, currentQ.prompt]);

  // =========================================================================
  // LIVE SPEECH-TO-TEXT: Transcribes and renders directly into chat box
  // =========================================================================
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
      const simulatedText = "Hello Orator, nice to meet you. I'm exploring an application idea.";
      setInputValue(simulatedText);
      setTimeout(() => {
        setIsUserSpeaking(false);
      }, 1600);
      return;
    }

    try {
      setIsUserSpeaking(true);
      const result = await listen({
        onPartial: (partialText) => {
          // Renders live speech-to-text continuously directly into the chat input
          setInputValue(partialText);
        },
      });
      listenHandleRef.current = result.handle;
      if (result.text) {
        setInputValue(result.text);
      }
    } catch (err) {
      console.warn("[Landing] Speech recognition exception:", err);
    } finally {
      setIsUserSpeaking(false);
    }
  };

  // =========================================================================
  // SEND CHAT MESSAGE (DIALOGUE BACK-AND-FORTH WITH THE ORATOR)
  // =========================================================================
  const sendChatMessage = async (overrideText?: string) => {
    const textToSend = (overrideText ?? inputValue).trim();
    if (!textToSend) return;

    // Stop microphone if currently listening
    if (listenHandleRef.current) {
      listenHandleRef.current.stop();
      listenHandleRef.current = null;
      setIsUserSpeaking(false);
    }

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      text: textToSend,
      timestamp: Date.now(),
    };

    const nextMessages = [...chatMessages, userMsg];
    setChatMessages(nextMessages);
    setInputValue("");
    setActivePrompt(textToSend);

    // Entity flares with shockwave pulse
    setShockwaveTrigger((v) => v + 1);
    setIsOratorThinking(true);

    try {
      const response = await fetch("/api/orator/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, text: m.text })),
          userMessage: textToSend,
        }),
      });

      const data = await response.json();
      const oratorReplyText =
        data?.reply ||
        "I understand your vision. Tell me more about your target audience and the primary workflow you want to enable.";

      const oratorMsg: ChatMessage = {
        id: `orator-${Date.now()}`,
        role: "orator",
        text: oratorReplyText,
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, oratorMsg]);
      setIsOratorThinking(false);

      // The Orator naturally speaks its response on its own without any button!
      setIsOratorSpeaking(true);
      await orate(oratorReplyText);
    } catch (error) {
      console.warn("[Landing] Orator chat error:", error);
      const fallbackReply =
        "An intriguing concept. Who will be using this system most frequently, and what is the single most critical action they must perform in the first ten seconds?";
      setChatMessages((prev) => [
        ...prev,
        {
          id: `orator-${Date.now()}`,
          role: "orator",
          text: fallbackReply,
          timestamp: Date.now(),
        },
      ]);
      setIsOratorThinking(false);
      setIsOratorSpeaking(true);
      await orate(fallbackReply);
    } finally {
      setIsOratorSpeaking(false);
    }
  };

  // =========================================================================
  // ANSWER HANDLER FOR 15-QUESTION INQUEST PHASE
  // =========================================================================
  const handleInquestAnswer = (text: string) => {
    if (!text.trim()) return;
    const cleanText = text.trim();
    const updated = { ...answers, [currentQ.id]: cleanText };
    setAnswers(updated);
    session.recordAnswer(currentQ.id, cleanText);
    setInputValue("");

    // Entity pulses with a radiant shockwave
    setShockwaveTrigger((v) => v + 1);

    if (currentQIndex === 0) {
      setActivePrompt(cleanText);
    }

    if (currentQIndex < INQUEST_QUESTIONS.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      transitionToWeave();
    }
  };

  // Transition from Dialogue to Inquest
  const enterInquestMode = () => {
    setAudienceMode("inquest");
    setShockwaveTrigger((v) => v + 1);
    // Seed question 1 with activePrompt if already discussed
    if (activePrompt && activePrompt !== "Print app with micro fighting") {
      setInputValue(activePrompt);
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#07070a] text-pearl flex flex-col justify-between p-3 sm:p-5 select-none font-mono-hud">
      {/* Subtle Chamber Watermark */}
      <div className="absolute top-3 left-5 z-20 pointer-events-none opacity-40 text-[9px] tracking-[0.3em] font-bold text-forge-dim uppercase">
        ORATOR // THE FORGE
      </div>

      {/* ========================================================================= */}
      {/* ACT I: THE AUDIENCE WITH THE ORATOR (CENTER STAGE)                       */}
      {/* ========================================================================= */}
      {currentAct === "audience" && (
        <div className="relative flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-between py-1 sm:py-3 animate-in fade-in duration-700 min-h-0">
          {/* The Orator Cyberpunk Data Vortex Orb commands center stage */}
          <div className="relative w-full h-[38vh] sm:h-[44vh] flex items-center justify-center shrink-0">
            <CortexTorus3D
              cleanMode={true}
              hideBorders={true}
              isOratorSpeaking={isOratorSpeaking}
              isUserSpeaking={isUserSpeaking}
              currentQuestionPrompt={
                audienceMode === "dialogue"
                  ? "Talk through your idea with The Orator"
                  : currentQ.prompt
              }
              currentQuestionIndex={audienceMode === "dialogue" ? 0 : currentQIndex + 1}
              totalQuestions={15}
              shockwaveTrigger={shockwaveTrigger}
            />
          </div>

          {/* Underneath: Dynamic Interface (Dialogue Chat vs Inquest Phase) */}
          <div className="w-full flex flex-col items-center text-center space-y-2.5 z-20 flex-1 min-h-0 justify-end">
            {/* Top Mode Header Strip */}
            <div className="flex items-center justify-between w-full max-w-2xl px-1">
              <div className="text-[10px] text-cyan-300 font-bold tracking-widest uppercase flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                {audienceMode === "dialogue" ? (
                  <span>STAGE 0: PRE-BUILD EXPLORATORY DIALOGUE</span>
                ) : (
                  <span>DISCOVERY INQUEST · QUESTION {String(currentQIndex + 1).padStart(2, "0")} OF 15 ({currentQ.phase})</span>
                )}
              </div>

              {/* Mode Switcher Buttons */}
              <div className="flex items-center gap-2">
                {audienceMode === "dialogue" ? (
                  <button
                    type="button"
                    onClick={enterInquestMode}
                    className="px-2.5 py-1 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-[9px] font-bold text-cyan-300 hover:bg-cyan-900/60 hover:border-cyan-400 transition"
                  >
                    BEGIN 15-Q INQUEST ➔
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAudienceMode("dialogue")}
                    className="px-2.5 py-1 rounded-lg border border-seam bg-[#090e18] text-[9px] font-bold text-gray-400 hover:text-pearl transition"
                  >
                    ← BACK TO CHAT
                  </button>
                )}
              </div>
            </div>

            {/* =================================================================== */}
            {/* AUDIENCE MODE A: INITIAL EXPLORATORY CHAT BACK-AND-FORTH           */}
            {/* =================================================================== */}
            {audienceMode === "dialogue" && (
              <div className="w-full max-w-2xl bg-[#090e18]/85 border border-seam/80 rounded-2xl p-3 sm:p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col min-h-[220px] max-h-[36vh]">
                {/* Chat Log Thread */}
                <div
                  ref={chatScrollRef}
                  className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin text-left min-h-[110px]"
                >
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="text-[8px] font-mono tracking-wider uppercase mb-0.5 text-forge-dim flex items-center gap-1.5">
                        {msg.role === "orator" ? (
                          <>
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isOratorSpeaking ? "bg-amber-400 animate-ping" : "bg-cyan-400"
                              }`}
                            />
                            <span className="text-cyan-400 font-bold">THE ORATOR</span>
                          </>
                        ) : (
                          <span className="text-gray-400">YOU (CUSTOMER)</span>
                        )}
                      </div>
                      <div
                        className={`rounded-xl px-3.5 py-2 text-[11px] leading-relaxed max-w-[88%] ${
                          msg.role === "user"
                            ? "bg-cyan-950/60 border border-cyan-500/40 text-pearl font-mono"
                            : "bg-[#040810]/90 border border-seam/80 text-white font-mono shadow-md"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isOratorThinking && (
                    <div className="flex items-center gap-2 text-[10px] text-amber-300 font-mono italic animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-ping" />
                      The Orator is formulating architectural analysis...
                    </div>
                  )}
                </div>

                {/* Quick Dialogue Prompt Chips */}
                <div className="flex flex-wrap gap-1.5 py-2 border-t border-seam/40 mt-2 shrink-0">
                  {[
                    "Hello Orator, nice to meet you.",
                    "I want to build a real-time POS & order bridge.",
                    "An app with 2D micro combat & printable certificates.",
                    "A high-throughput cyberpunk telemetry visualizer.",
                  ].map((quick) => (
                    <button
                      key={quick}
                      type="button"
                      onClick={() => sendChatMessage(quick)}
                      className="rounded-full border border-seam/70 bg-depth/70 px-2.5 py-0.5 text-[9px] text-cyan-200 hover:border-cyan-400 hover:bg-cyan-950/60 transition truncate max-w-[280px]"
                    >
                      "{quick}"
                    </button>
                  ))}
                </div>

                {/* Minimalist Speech & Input Dock */}
                <div className="flex items-center gap-2 pt-1 border-t border-seam/40 shrink-0">
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

                  {/* Text input with Live Speech-to-Text rendering */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendChatMessage();
                    }}
                    placeholder={
                      isUserSpeaking
                        ? "Transcribing your speech in real time..."
                        : "Talk through your idea or problem with The Orator..."
                    }
                    className="flex-1 bg-[#040810]/90 border border-seam/80 rounded-xl px-3.5 py-2 font-mono text-[12px] text-pearl placeholder:text-gray-600 outline-none focus:border-cyan-400"
                  />

                  <button
                    type="button"
                    onClick={() => sendChatMessage()}
                    disabled={isOratorThinking || (!inputValue.trim() && !isUserSpeaking)}
                    className="btn-forge btn-primary px-4 py-2 text-[11px] font-bold shrink-0 rounded-xl disabled:opacity-50"
                  >
                    SEND ↵
                  </button>
                </div>
              </div>
            )}

            {/* =================================================================== */}
            {/* AUDIENCE MODE B: 15-QUESTION ARCHITECTURAL INQUEST                 */}
            {/* =================================================================== */}
            {audienceMode === "inquest" && (
              <div className="w-full max-w-2xl bg-[#090e18]/85 border border-seam/80 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.8)] backdrop-blur-xl">
                <div className="flex items-center justify-between text-[10px] text-forge-dim border-b border-seam/40 pb-2 mb-2.5">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    CURRENT ARCHITECTURAL INQUIRY
                  </span>
                  <span className="text-[9px] text-amber-300 font-bold flex items-center gap-1">
                    {isOratorSpeaking ? "🔊 ORATOR SPEAKING ALOUD…" : "✓ NATURAL VOICE SYNTHESIS ACTIVE"}
                  </span>
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
                        onClick={() => handleInquestAnswer(s)}
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

                  {/* Text input with live speech-to-text rendering */}
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleInquestAnswer(inputValue);
                    }}
                    placeholder={
                      isUserSpeaking
                        ? "Transcribing your voice in real time..."
                        : currentQ.placeholder
                    }
                    className="flex-1 bg-[#040810]/90 border border-seam/80 rounded-xl px-3.5 py-2 font-mono text-[12px] text-pearl placeholder:text-gray-600 outline-none focus:border-cyan-400"
                  />

                  <button
                    type="button"
                    onClick={() => handleInquestAnswer(inputValue)}
                    className="btn-forge btn-primary px-4 py-2 text-[11px] font-bold shrink-0 rounded-xl"
                  >
                    DISPATCH ↵
                  </button>
                </div>
              </div>
            )}

            {/* Quick action to begin Weave immediately */}
            <div className="pt-1 flex items-center justify-between w-full max-w-2xl px-2 text-[10px]">
              <span className="text-gray-500 text-[9.5px]">
                {audienceMode === "dialogue"
                  ? "Chat back and forth to refine your concept before code generation"
                  : "All specifications audited against US Sovereign compliance"}
              </span>
              <button
                type="button"
                onClick={transitionToWeave}
                className="text-cyan-300 hover:text-white font-bold tracking-wider transition underline underline-offset-4"
              >
                PROCEED TO BIG TECH WEAVE ➔
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

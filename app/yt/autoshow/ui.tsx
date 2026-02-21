"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AutoShowItem = {
  id: string;
  question: string;
  answer: string;
  category: string | null;
};

type Props = {
  items: AutoShowItem[];
  cleanMode?: boolean;
};

function playDing() {
  // No external asset needed; generates a short "ding" with Web Audio.
  try {
    const AudioContextImpl =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextImpl();

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);

    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.12,
      audioContext.currentTime + 0.01,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      audioContext.currentTime + 0.18,
    );

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);

    oscillator.onended = () => {
      try {
        void audioContext.close();
      } catch {
        // ignore
      }
    };
  } catch {
    // ignore (e.g., autoplay restrictions, unsupported env)
  }
}

export default function AutoShowClient({ items, cleanMode = true }: Props) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [revealPulse, setRevealPulse] = useState(0);
  const [lastKeyHintVisible, setLastKeyHintVisible] = useState(true);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const current = safeItems[index] ?? null;
  const total = safeItems.length;

  const advance = useCallback(() => {
    if (finished) return;

    if (!current) {
      setFinished(true);
      return;
    }

    if (!revealed) {
      setRevealed(true);
      setRevealPulse((n) => n + 1);
      setLastKeyHintVisible(false);
      playDing();
      return;
    }

    // Already revealed -> move forward or finish.
    const isLast = index >= total - 1;
    if (isLast) {
      setFinished(true);
      return;
    }

    setIndex((i) => i + 1);
    setRevealed(false);
    setLastKeyHintVisible(false);
  }, [current, finished, index, revealed, total]);

  const restart = useCallback(() => {
    setIndex(0);
    setRevealed(false);
    setFinished(false);
    setRevealPulse(0);
    setLastKeyHintVisible(true);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        advance();
      }

      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        restart();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [advance]);

  useEffect(() => {
    // Help ensure arrow keys go to the page (useful during recording).
    containerRef.current?.focus?.();
  }, []);

  if (total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-xl text-center">
          <div className="text-3xl font-black">No trivia found</div>
          <div className="mt-3 text-white/70">
            Seed the database with `TriviaQuestion` rows and reload.
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <div
        ref={containerRef}
        tabIndex={-1}
        className="min-h-screen flex items-center justify-center p-8 outline-none"
      >
        <div className="max-w-4xl w-full text-center">
          {!cleanMode ? (
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white/80">
              End of round
            </div>
          ) : null}

          <div className="mt-6 text-4xl md:text-6xl font-black tracking-tight">
            like and subscribe for daily trivia
          </div>

          {!cleanMode ? (
            <>
              <div className="mt-8 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={restart}
                  className="rounded-xl bg-white text-slate-900 px-5 py-3 font-bold hover:bg-white/90"
                >
                  Restart (R)
                </button>
              </div>

              <div className="mt-6 text-sm text-white/60">
                Tip: Press → to advance during recording.
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      className="min-h-screen flex items-center justify-center p-6 md:p-10 outline-none"
    >
      <div className="max-w-5xl w-full">
        {!cleanMode ? (
          <div className="flex items-center justify-between gap-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/80">
              <span className="font-semibold">AutoShow</span>
              <span className="text-white/40">•</span>
              <span>
                {Math.min(index + 1, total)}/{total}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-sm text-white/60">
              <span className="rounded-md bg-white/10 px-2 py-1 font-semibold">
                →
              </span>
              <span>reveal / next</span>
              <span className="text-white/30">·</span>
              <span className="rounded-md bg-white/10 px-2 py-1 font-semibold">
                R
              </span>
              <span>restart</span>
            </div>
          </div>
        ) : null}

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 shadow-2xl">
          {!cleanMode && current?.category ? (
            <div className="text-sm uppercase tracking-widest text-white/60">
              {current.category}
            </div>
          ) : null}

          <div className="mt-4 text-3xl md:text-5xl font-black leading-tight">
            {current?.question}
          </div>

          <div className="mt-10">
            <div
              key={`${current?.id ?? "q"}-pulse-${revealPulse}`}
              className={
                revealed
                  ? "answer-pop rounded-2xl bg-emerald-500/15 border border-emerald-300/30 p-6"
                  : "rounded-2xl bg-white/5 border border-white/10 p-6"
              }
            >
              <div className="text-sm font-semibold text-white/70">Answer</div>

              <div
                className={
                  revealed
                    ? "mt-2 text-2xl md:text-4xl font-black text-emerald-100 transition-all duration-300"
                    : "mt-2 text-2xl md:text-4xl font-black text-white/10 blur-md select-none transition-all duration-300"
                }
                aria-label={revealed ? "Answer revealed" : "Answer hidden"}
              >
                {revealed ? current?.answer : "████████████"}
              </div>

              {!cleanMode && !revealed && lastKeyHintVisible ? (
                <div className="mt-4 text-sm text-white/60">
                  Press → to reveal.
                </div>
              ) : null}
            </div>
          </div>

          {!cleanMode ? (
            <div className="mt-8 flex items-center justify-between text-sm text-white/50">
              <div>
                {revealed
                  ? "Press → for next question"
                  : "Press → to reveal the answer"}
              </div>
              <button
                type="button"
                onClick={restart}
                className="rounded-lg bg-white/10 px-3 py-2 font-semibold text-white/80 hover:bg-white/15"
              >
                Restart
              </button>
            </div>
          ) : null}
        </div>

        <style jsx>{`
          .answer-pop {
            animation: answerPop 420ms ease-out;
          }

          @keyframes answerPop {
            0% {
              transform: scale(0.985);
              filter: brightness(0.95);
            }
            60% {
              transform: scale(1.02);
              filter: brightness(1.1);
            }
            100% {
              transform: scale(1);
              filter: brightness(1);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

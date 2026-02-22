"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type AutoShowItem = {
  id: string;
  question: string;
  answer: string;
  context?: string | null;
  category: string | null;
};

type Props = {
  items: AutoShowItem[];
  cleanMode?: boolean;
};

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioContextImpl =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextImpl) return null;

    if (!sharedAudioContext || sharedAudioContext.state === "closed") {
      sharedAudioContext = new AudioContextImpl();
    }

    // If the browser suspended audio (autoplay policy), a user keypress should allow resume.
    if (sharedAudioContext.state === "suspended") {
      void sharedAudioContext.resume();
    }

    return sharedAudioContext;
  } catch {
    return null;
  }
}

type WinSoundId =
  | "ta-da"
  | "coin"
  | "sparkle"
  | "power"
  | "chime"
  | "pop"
  | "laser"
  | "bright";

const WIN_SOUND_STORAGE_KEY = "yt_autoshow_win_sound";
const SHOW_CONTEXT_STORAGE_KEY = "yt_autoshow_show_context";
const GAME_LENGTH_STORAGE_KEY = "yt_autoshow_game_length";
const TIMER_ENABLED_STORAGE_KEY = "yt_autoshow_timer_enabled";
const TIMER_MANUAL_STORAGE_KEY = "yt_autoshow_timer_manual";
const TIMER_PLACEMENT_STORAGE_KEY = "yt_autoshow_timer_placement";
const TIMER_D3_STORAGE_KEY = "yt_autoshow_timer_d3";
const TIMER_D2_STORAGE_KEY = "yt_autoshow_timer_d2";
const TIMER_D1_STORAGE_KEY = "yt_autoshow_timer_d1";

type CountdownValue = 3 | 2 | 1;

type TimerPlacement = "between" | "overlay-right" | "under-answer";

type GameLength = 5 | 10;

function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function parseSecondsInput(raw: string, fallbackSeconds: number): number {
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallbackSeconds;
  return clampNumber(parsed, 0.1, 30);
}

const COUNTDOWN_RADIUS = 28;
const COUNTDOWN_CIRCUMFERENCE = 2 * Math.PI * COUNTDOWN_RADIUS;

function CountdownCircle({
  value,
  durationMs,
}: {
  value: CountdownValue;
  durationMs: number;
}) {
  const color =
    value === 3
      ? {
          ringStart: "rgba(8, 145, 178, 0.35)",
          ringEnd: "rgba(34, 211, 238, 0.98)",
          textStart: "rgba(165, 243, 252, 0.55)",
          textEnd: "rgba(165, 243, 252, 0.98)",
          glow: "rgba(34, 211, 238, 0.55)",
        }
      : value === 2
        ? {
            ringStart: "rgba(168, 85, 247, 0.35)",
            ringEnd: "rgba(236, 72, 153, 0.98)",
            textStart: "rgba(240, 171, 252, 0.55)",
            textEnd: "rgba(251, 113, 133, 0.98)",
            glow: "rgba(236, 72, 153, 0.55)",
          }
        : {
            ringStart: "rgba(16, 185, 129, 0.35)",
            ringEnd: "rgba(163, 230, 53, 0.98)",
            textStart: "rgba(187, 247, 208, 0.55)",
            textEnd: "rgba(217, 249, 157, 0.98)",
            glow: "rgba(163, 230, 53, 0.55)",
          };

  const style = {
    ["--dur" as any]: `${Math.max(1, Math.trunc(durationMs))}ms`,
    ["--circ" as any]: COUNTDOWN_CIRCUMFERENCE,
    ["--ringStart" as any]: color.ringStart,
    ["--ringEnd" as any]: color.ringEnd,
    ["--textStart" as any]: color.textStart,
    ["--textEnd" as any]: color.textEnd,
    ["--glow" as any]: color.glow,
  };

  return (
    <div className="relative h-20 w-20 overflow-visible" style={style as any}>
      <svg
        viewBox="0 0 100 100"
        className="h-20 w-20 overflow-visible"
        aria-label={`Countdown ${value}`}
      >
        <g transform="rotate(-90 50 50)">
          <circle
            cx="50"
            cy="50"
            r={COUNTDOWN_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="8"
          />
          <circle
            className="countdown-progress"
            cx="50"
            cy="50"
            r={COUNTDOWN_RADIUS}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
          />
        </g>
      </svg>

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-14 w-14 rounded-full bg-slate-950/50 border border-white/10 flex items-center justify-center">
          <span className="countdown-text text-3xl font-black">{value}</span>
        </div>
      </div>
    </div>
  );
}

const WIN_SOUNDS: Array<{ id: WinSoundId; name: string }> = [
  { id: "ta-da", name: "Ta‑da" },
  { id: "coin", name: "Coin" },
  { id: "sparkle", name: "Sparkle" },
  { id: "power", name: "Power" },
  { id: "chime", name: "Chime" },
  { id: "pop", name: "Pop" },
  { id: "laser", name: "Laser" },
  { id: "bright", name: "Bright" },
];

function playCountdownTone(value: CountdownValue) {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    const now = audioContext.currentTime;

    // Ascending tones as the countdown approaches 1.
    const freqHz = value === 3 ? 440 : value === 2 ? 554.37 : 659.25;

    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freqHz, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);

    osc.connect(gain);
    gain.connect(audioContext.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  } catch {
    // ignore
  }
}

function playWinSound(soundId: WinSoundId) {
  const audioContext = getAudioContext();
  if (!audioContext) return;

  try {
    const now = audioContext.currentTime;

    const master = audioContext.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.22, now + 0.01);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    master.connect(audioContext.destination);

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(7000, now);
    filter.Q.setValueAtTime(0.6, now);
    filter.connect(master);

    const makeOsc = (
      type: OscillatorType,
      freq: number,
      startAt: number,
      stopAt: number,
      gainValue: number,
      detune = 0,
    ) => {
      const osc = audioContext.createOscillator();
      const g = audioContext.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startAt);
      osc.detune.setValueAtTime(detune, startAt);
      g.gain.setValueAtTime(gainValue, startAt);
      osc.connect(g);
      g.connect(filter);
      osc.start(startAt);
      osc.stop(stopAt);
      return osc;
    };

    const t0 = now;
    const t1 = now + 0.07;
    const t2 = now + 0.14;
    const endAt = now + 0.36;

    switch (soundId) {
      case "ta-da": {
        filter.frequency.setValueAtTime(5200, now);
        makeOsc("triangle", 523.25, t0, endAt, 0.95, -6);
        const sparkle = audioContext.createOscillator();
        const sparkleGain = audioContext.createGain();
        sparkle.type = "sine";
        sparkle.detune.setValueAtTime(9, now);
        sparkleGain.gain.setValueAtTime(0.55, now);
        sparkle.connect(sparkleGain);
        sparkleGain.connect(filter);
        sparkle.frequency.setValueAtTime(1046.5, t0);
        sparkle.frequency.exponentialRampToValueAtTime(1318.5, t1);
        sparkle.frequency.exponentialRampToValueAtTime(1568.0, t2 + 0.06);
        sparkle.start(t0);
        sparkle.stop(endAt);
        // melody
        // (body already has first note; jump it to E then G)
        // cheap: second body oscillator for additional notes
        makeOsc("triangle", 659.25, t1, endAt, 0.7, -6);
        makeOsc("triangle", 783.99, t2, endAt, 0.6, -6);
        break;
      }
      case "coin": {
        filter.frequency.setValueAtTime(9000, now);
        makeOsc("square", 988.0, t0, now + 0.18, 0.75);
        makeOsc("square", 1318.5, t0 + 0.03, now + 0.2, 0.55);
        break;
      }
      case "sparkle": {
        filter.frequency.setValueAtTime(10000, now);
        makeOsc("sine", 1568.0, t0, endAt, 0.75);
        makeOsc("sine", 2093.0, t1, endAt, 0.55);
        makeOsc("sine", 2637.0, t2, endAt, 0.45);
        break;
      }
      case "power": {
        filter.frequency.setValueAtTime(4200, now);
        const body = audioContext.createOscillator();
        const bodyGain = audioContext.createGain();
        body.type = "sawtooth";
        body.frequency.setValueAtTime(220, now);
        body.frequency.exponentialRampToValueAtTime(440, now + 0.12);
        bodyGain.gain.setValueAtTime(0.35, now);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
        body.connect(bodyGain);
        bodyGain.connect(filter);
        body.start(now);
        body.stop(now + 0.3);
        makeOsc("sine", 880, now + 0.05, now + 0.32, 0.55);
        break;
      }
      case "chime": {
        filter.frequency.setValueAtTime(6000, now);
        makeOsc("sine", 659.25, t0, endAt, 0.6);
        makeOsc("sine", 987.77, t1, endAt, 0.5);
        makeOsc("sine", 1318.5, t2, endAt, 0.4);
        break;
      }
      case "pop": {
        filter.frequency.setValueAtTime(3500, now);
        const pop = audioContext.createOscillator();
        const popGain = audioContext.createGain();
        pop.type = "sine";
        pop.frequency.setValueAtTime(240, now);
        pop.frequency.exponentialRampToValueAtTime(90, now + 0.09);
        popGain.gain.setValueAtTime(0.42, now);
        popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        pop.connect(popGain);
        popGain.connect(filter);
        pop.start(now);
        pop.stop(now + 0.13);
        makeOsc("triangle", 880, now + 0.02, now + 0.22, 0.45);
        break;
      }
      case "laser": {
        filter.frequency.setValueAtTime(8500, now);
        const laser = audioContext.createOscillator();
        const laserGain = audioContext.createGain();
        laser.type = "sawtooth";
        laser.frequency.setValueAtTime(1600, now);
        laser.frequency.exponentialRampToValueAtTime(400, now + 0.18);
        laserGain.gain.setValueAtTime(0.18, now);
        laserGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
        laser.connect(laserGain);
        laserGain.connect(filter);
        laser.start(now);
        laser.stop(now + 0.21);
        makeOsc("sine", 880, now + 0.05, now + 0.28, 0.25);
        break;
      }
      case "bright": {
        filter.frequency.setValueAtTime(7800, now);
        makeOsc("triangle", 523.25, t0, endAt, 0.7);
        makeOsc("triangle", 783.99, t1, endAt, 0.6);
        makeOsc("triangle", 1046.5, t2, endAt, 0.5);
        makeOsc("sine", 2093.0, t2 + 0.03, endAt, 0.35);
        break;
      }
    }
  } catch {
    // ignore
  }
}

export default function AutoShowClient({ items, cleanMode = true }: Props) {
  const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

  const [started, setStarted] = useState(false);
  const [titleActive, setTitleActive] = useState(false);
  const [gameLength, setGameLength] = useState<GameLength>(10);
  const [winSoundId, setWinSoundId] = useState<WinSoundId>(WIN_SOUNDS[0].id);
  const [showContextStep, setShowContextStep] = useState(false);

  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerManualStart, setTimerManualStart] = useState(false);
  const [timerPlacement, setTimerPlacement] =
    useState<TimerPlacement>("between");
  const [timerD3Seconds, setTimerD3Seconds] = useState(1);
  const [timerD2Seconds, setTimerD2Seconds] = useState(1);
  const [timerD1Seconds, setTimerD1Seconds] = useState(1);

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [extraInfoShown, setExtraInfoShown] = useState(false);
  const [finished, setFinished] = useState(false);
  const [revealPulse, setRevealPulse] = useState(0);
  const [lastKeyHintVisible, setLastKeyHintVisible] = useState(true);

  const [countdownValue, setCountdownValue] = useState<CountdownValue | null>(
    null,
  );
  const [countdownDurationMs, setCountdownDurationMs] = useState(1000);
  const [countdownKey, setCountdownKey] = useState(0);
  const countdownTimeoutsRef = useRef<number[]>([]);

  const [titleCountdownValue, setTitleCountdownValue] =
    useState<CountdownValue | null>(null);
  const [titleCountdownDurationMs, setTitleCountdownDurationMs] =
    useState(1000);
  const [titleCountdownKey, setTitleCountdownKey] = useState(0);
  const titleTimeoutsRef = useRef<number[]>([]);

  const [transcriptCopied, setTranscriptCopied] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const startedRef = useRef(false);
  const finishedRef = useRef(false);
  const revealedRef = useRef(false);
  const indexRef = useRef(0);
  const hasCurrentRef = useRef(false);
  const winSoundIdRef = useRef<WinSoundId>(WIN_SOUNDS[0].id);

  const gameItems = useMemo(
    () => safeItems.slice(0, gameLength),
    [gameLength, safeItems],
  );
  const current = gameItems[index] ?? null;
  const total = gameItems.length;
  const currentContext = (current?.context ?? null)?.trim?.() || null;
  const isExtraInfoSlide =
    revealed && showContextStep && Boolean(currentContext) && extraInfoShown;

  const transcriptText = useMemo(() => {
    const lines: string[] = [];
    lines.push(`YT AutoShow Transcript (${total} questions)`);
    lines.push("");

    for (let i = 0; i < gameItems.length; i++) {
      const item = gameItems[i];
      const extraInfo = (item?.context ?? null)?.trim?.() || "";
      lines.push(`Q${i + 1}: ${item.question}`);
      lines.push(`A${i + 1}: ${item.answer}`);
      if (extraInfo) {
        lines.push(`Extra info: ${extraInfo}`);
      }
      lines.push("");
    }

    return lines.join("\n").trimEnd();
  }, [gameItems, total]);

  const copyTranscript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(transcriptText);
      setTranscriptCopied(true);
      window.setTimeout(() => setTranscriptCopied(false), 900);
    } catch {
      // ignore
    }
  }, [transcriptText]);

  useEffect(() => {
    startedRef.current = started;
    finishedRef.current = finished;
    revealedRef.current = revealed;
    indexRef.current = index;
    hasCurrentRef.current = Boolean(current);
    winSoundIdRef.current = winSoundId;
  }, [current, finished, index, revealed, started, winSoundId]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(WIN_SOUND_STORAGE_KEY);
      const isValid = WIN_SOUNDS.some((s) => s.id === saved);
      if (saved && isValid) setWinSoundId(saved as WinSoundId);
    } catch {
      // ignore
    }

    try {
      const savedLength = window.localStorage.getItem(GAME_LENGTH_STORAGE_KEY);
      if (savedLength === "5") setGameLength(5);
      if (savedLength === "10") setGameLength(10);
    } catch {
      // ignore
    }

    try {
      const savedContext = window.localStorage.getItem(
        SHOW_CONTEXT_STORAGE_KEY,
      );
      if (savedContext === "1") setShowContextStep(true);
      if (savedContext === "0") setShowContextStep(false);
    } catch {
      // ignore
    }

    try {
      const savedTimerEnabled = window.localStorage.getItem(
        TIMER_ENABLED_STORAGE_KEY,
      );
      if (savedTimerEnabled === "1") setTimerEnabled(true);
      if (savedTimerEnabled === "0") setTimerEnabled(false);

      const savedTimerManual = window.localStorage.getItem(
        TIMER_MANUAL_STORAGE_KEY,
      );
      if (savedTimerManual === "1") setTimerManualStart(true);
      if (savedTimerManual === "0") setTimerManualStart(false);

      const savedPlacement = window.localStorage.getItem(
        TIMER_PLACEMENT_STORAGE_KEY,
      );
      if (
        savedPlacement === "between" ||
        savedPlacement === "overlay-right" ||
        savedPlacement === "under-answer"
      ) {
        setTimerPlacement(savedPlacement);
      }

      const savedD3 = window.localStorage.getItem(TIMER_D3_STORAGE_KEY);
      const savedD2 = window.localStorage.getItem(TIMER_D2_STORAGE_KEY);
      const savedD1 = window.localStorage.getItem(TIMER_D1_STORAGE_KEY);

      if (savedD3) setTimerD3Seconds(parseSecondsInput(savedD3, 1));
      if (savedD2) setTimerD2Seconds(parseSecondsInput(savedD2, 1));
      if (savedD1) setTimerD1Seconds(parseSecondsInput(savedD1, 1));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(WIN_SOUND_STORAGE_KEY, winSoundId);
    } catch {
      // ignore
    }
  }, [winSoundId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(GAME_LENGTH_STORAGE_KEY, String(gameLength));
    } catch {
      // ignore
    }
  }, [gameLength]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        SHOW_CONTEXT_STORAGE_KEY,
        showContextStep ? "1" : "0",
      );
    } catch {
      // ignore
    }
  }, [showContextStep]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        TIMER_ENABLED_STORAGE_KEY,
        timerEnabled ? "1" : "0",
      );
      window.localStorage.setItem(
        TIMER_MANUAL_STORAGE_KEY,
        timerManualStart ? "1" : "0",
      );
      window.localStorage.setItem(TIMER_PLACEMENT_STORAGE_KEY, timerPlacement);
      window.localStorage.setItem(TIMER_D3_STORAGE_KEY, String(timerD3Seconds));
      window.localStorage.setItem(TIMER_D2_STORAGE_KEY, String(timerD2Seconds));
      window.localStorage.setItem(TIMER_D1_STORAGE_KEY, String(timerD1Seconds));
    } catch {
      // ignore
    }
  }, [
    timerD1Seconds,
    timerD2Seconds,
    timerD3Seconds,
    timerEnabled,
    timerManualStart,
    timerPlacement,
  ]);

  const stopCountdown = useCallback(() => {
    for (const timeoutId of countdownTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    countdownTimeoutsRef.current = [];
    setCountdownValue(null);
  }, []);

  const stopTitleSequence = useCallback(() => {
    for (const timeoutId of titleTimeoutsRef.current) {
      window.clearTimeout(timeoutId);
    }
    titleTimeoutsRef.current = [];
    setTitleCountdownValue(null);
    setTitleActive(false);
  }, []);

  const startTitleSequence = useCallback(() => {
    stopTitleSequence();

    setTitleActive(true);
    setTitleCountdownValue(null);

    const waitBeforeMs = 1000;
    const d3 = 1000;
    const d2 = 1000;
    const d1 = 1000;

    const tStart = window.setTimeout(() => {
      setTitleCountdownValue(3);
      setTitleCountdownDurationMs(d3);
      setTitleCountdownKey((k) => k + 1);
      playCountdownTone(3);
    }, waitBeforeMs);

    const tTo2 = window.setTimeout(() => {
      setTitleCountdownValue(2);
      setTitleCountdownDurationMs(d2);
      setTitleCountdownKey((k) => k + 1);
      playCountdownTone(2);
    }, waitBeforeMs + d3);

    const tTo1 = window.setTimeout(
      () => {
        setTitleCountdownValue(1);
        setTitleCountdownDurationMs(d1);
        setTitleCountdownKey((k) => k + 1);
        playCountdownTone(1);
      },
      waitBeforeMs + d3 + d2,
    );

    const tDone = window.setTimeout(
      () => {
        setTitleCountdownValue(null);
        setTitleActive(false);
      },
      waitBeforeMs + d3 + d2 + d1,
    );

    titleTimeoutsRef.current = [tStart, tTo2, tTo1, tDone];
  }, [stopTitleSequence]);

  const revealAnswer = useCallback(() => {
    if (!startedRef.current) return;
    if (finishedRef.current) return;
    if (revealedRef.current) return;
    if (!hasCurrentRef.current) return;

    stopCountdown();
    setRevealed(true);
    setRevealPulse((n) => n + 1);
    setLastKeyHintVisible(false);
    playWinSound(winSoundIdRef.current);
  }, [stopCountdown]);

  const startCountdown = useCallback(() => {
    stopCountdown();

    const countdownIndex = indexRef.current;

    const d3 = Math.round(clampNumber(timerD3Seconds, 0.1, 30) * 1000);
    const d2 = Math.round(clampNumber(timerD2Seconds, 0.1, 30) * 1000);
    const d1 = Math.round(clampNumber(timerD1Seconds, 0.1, 30) * 1000);

    setCountdownValue(3);
    setCountdownDurationMs(d3);
    setCountdownKey((k) => k + 1);
    playCountdownTone(3);

    const tTo2 = window.setTimeout(() => {
      setCountdownValue(2);
      setCountdownDurationMs(d2);
      setCountdownKey((k) => k + 1);
      playCountdownTone(2);
    }, d3);

    const tTo1 = window.setTimeout(() => {
      setCountdownValue(1);
      setCountdownDurationMs(d1);
      setCountdownKey((k) => k + 1);
      playCountdownTone(1);
    }, d3 + d2);

    const tDone = window.setTimeout(
      () => {
        setCountdownValue(null);

        // Auto-reveal when the countdown completes (unless the user already revealed).
        if (indexRef.current === countdownIndex) {
          revealAnswer();
        }
      },
      d3 + d2 + d1,
    );

    countdownTimeoutsRef.current = [tTo2, tTo1, tDone];
  }, [
    revealAnswer,
    stopCountdown,
    timerD1Seconds,
    timerD2Seconds,
    timerD3Seconds,
  ]);

  useEffect(() => {
    if (!started) {
      stopCountdown();
      return;
    }

    if (titleActive) {
      stopCountdown();
      return;
    }

    if (!timerEnabled) {
      stopCountdown();
      return;
    }

    if (revealed) {
      stopCountdown();
      return;
    }

    if (timerManualStart) {
      stopCountdown();
      return;
    }

    startCountdown();
    return () => stopCountdown();
  }, [
    index,
    revealed,
    started,
    titleActive,
    startCountdown,
    stopCountdown,
    timerEnabled,
    timerManualStart,
  ]);

  const advance = useCallback(() => {
    if (!started) return;
    if (finished) return;

    if (titleActive) {
      stopTitleSequence();
      return;
    }

    if (!current) {
      setFinished(true);
      return;
    }

    if (
      timerEnabled &&
      timerManualStart &&
      !revealed &&
      countdownValue === null
    ) {
      startCountdown();
      return;
    }

    if (!revealed) {
      revealAnswer();
      return;
    }

    if (showContextStep && !extraInfoShown && currentContext) {
      setExtraInfoShown(true);
      setLastKeyHintVisible(false);
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
    setExtraInfoShown(false);
    setLastKeyHintVisible(false);
  }, [
    extraInfoShown,
    countdownValue,
    current,
    currentContext,
    finished,
    index,
    revealed,
    showContextStep,
    started,
    startCountdown,
    stopTitleSequence,
    total,
    revealAnswer,
    titleActive,
    timerEnabled,
    timerManualStart,
  ]);

  const restart = useCallback(() => {
    stopTitleSequence();
    stopCountdown();
    setIndex(0);
    setRevealed(false);
    setExtraInfoShown(false);
    setFinished(false);
    setRevealPulse(0);
    setLastKeyHintVisible(true);
    setStarted(false);
  }, [stopCountdown, stopTitleSequence]);

  const startGame = useCallback(() => {
    setStarted(true);
    startTitleSequence();
    setLastKeyHintVisible(true);
    setRevealed(false);
    setExtraInfoShown(false);
    stopCountdown();
    // Helpful to ensure audio can play (resume context on a user gesture).
    void getAudioContext()?.resume?.();
  }, [startTitleSequence, stopCountdown]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      if (!started) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          startGame();
        }
        return;
      }

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
  }, [advance, startGame, started]);

  useEffect(() => {
    if (!started) {
      stopTitleSequence();
      return;
    }

    if (!titleActive) return;
    return () => stopTitleSequence();
  }, [started, stopTitleSequence, titleActive]);

  useEffect(() => {
    // Help ensure arrow keys go to the page (useful during recording).
    containerRef.current?.focus?.();
  }, []);

  useEffect(() => {
    // If length changes (or items arrive), keep index in bounds.
    if (index > total - 1) {
      stopCountdown();
      setIndex(0);
      setRevealed(false);
      setExtraInfoShown(false);
      setFinished(false);
    }
  }, [index, stopCountdown, total]);

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

  if (!started) {
    return (
      <div
        ref={containerRef}
        tabIndex={-1}
        className="min-h-screen flex items-center justify-center p-6 md:p-10 outline-none"
      >
        <div className="max-w-3xl w-full">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 md:p-12 shadow-2xl">
            <div className="text-4xl md:text-6xl font-black tracking-tight">
              YT AutoShow
            </div>
            <div className="mt-3 text-white/70">
              Pick a correct-answer sound, sample it, then start.
            </div>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm font-semibold text-white/70">
                Game length
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGameLength(5)}
                  className={
                    gameLength === 5
                      ? "rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-left"
                      : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                  }
                  aria-pressed={gameLength === 5}
                >
                  <div className="font-black">5 questions</div>
                  <div className="text-sm text-white/60">Short round</div>
                </button>

                <button
                  type="button"
                  onClick={() => setGameLength(10)}
                  className={
                    gameLength === 10
                      ? "rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-3 text-left"
                      : "rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-left"
                  }
                  aria-pressed={gameLength === 10}
                >
                  <div className="font-black">10 questions</div>
                  <div className="text-sm text-white/60">Full round</div>
                </button>
              </div>
            </div>

            <div className="mt-10">
              <div className="text-sm font-semibold text-white/70">
                Correct answer sound
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIN_SOUNDS.map((sound) => {
                  const selected = sound.id === winSoundId;

                  return (
                    <div
                      key={sound.id}
                      className={
                        selected
                          ? "rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4"
                          : "rounded-2xl border border-white/10 bg-white/5 p-4"
                      }
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setWinSoundId(sound.id)}
                          className="text-left"
                          aria-pressed={selected}
                        >
                          <div className="font-black text-lg">{sound.name}</div>
                          <div className="text-sm text-white/60">
                            {selected ? "Selected" : "Select"}
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => playWinSound(sound.id)}
                          className="rounded-xl bg-white/10 px-4 py-2 font-bold text-white/85 hover:bg-white/15"
                        >
                          Sample
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showContextStep}
                  onChange={(e) => setShowContextStep(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-emerald-400"
                />
                <span>
                  <span className="block font-bold">Show extra info</span>
                  <span className="block text-sm text-white/60">
                    After the answer is revealed, press → again to show the
                    extra info (only if it exists).
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={timerEnabled}
                  onChange={(e) => setTimerEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4 accent-emerald-400"
                />
                <span>
                  <span className="block font-bold">
                    Countdown timer (3–2–1)
                  </span>
                  <span className="block text-sm text-white/60">
                    Shows a circle below the question. Each number uses its own
                    duration.
                  </span>
                </span>
              </label>

              {timerEnabled ? (
                <>
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={timerManualStart}
                        onChange={(e) => setTimerManualStart(e.target.checked)}
                        className="mt-1 h-4 w-4 accent-emerald-400"
                      />
                      <span>
                        <span className="block font-bold">
                          Start timer manually (press →)
                        </span>
                        <span className="block text-sm text-white/60">
                          When enabled, the first → starts the countdown instead
                          of instantly revealing.
                        </span>
                      </span>
                    </label>
                  </div>

                  <label className="mt-4 block rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-sm font-semibold text-white/70">
                      Timer position
                    </div>
                    <select
                      value={timerPlacement}
                      onChange={(e) =>
                        setTimerPlacement(e.target.value as TimerPlacement)
                      }
                      className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-400/60"
                    >
                      <option value="between">Between question & answer</option>
                      <option value="overlay-right">
                        Overlay right on answer
                      </option>
                      <option value="under-answer">Under the answer</option>
                    </select>
                  </label>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <label className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-sm font-semibold text-white/70">
                        3 duration (sec)
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0.1}
                        max={30}
                        step={0.1}
                        value={timerD3Seconds}
                        onChange={(e) =>
                          setTimerD3Seconds(
                            parseSecondsInput(e.target.value, 1),
                          )
                        }
                        className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-400/60"
                      />
                    </label>

                    <label className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-sm font-semibold text-white/70">
                        2 duration (sec)
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0.1}
                        max={30}
                        step={0.1}
                        value={timerD2Seconds}
                        onChange={(e) =>
                          setTimerD2Seconds(
                            parseSecondsInput(e.target.value, 1),
                          )
                        }
                        className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-400/60"
                      />
                    </label>

                    <label className="rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                      <div className="text-sm font-semibold text-white/70">
                        1 duration (sec)
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        min={0.1}
                        max={30}
                        step={0.1}
                        value={timerD1Seconds}
                        onChange={(e) =>
                          setTimerD1Seconds(
                            parseSecondsInput(e.target.value, 1),
                          )
                        }
                        className="mt-2 w-full rounded-lg bg-white/10 px-3 py-2 text-white outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-400/60"
                      />
                    </label>
                  </div>
                </>
              ) : null}
            </div>

            <div className="mt-10 flex items-center gap-3">
              <button
                type="button"
                onClick={startGame}
                className="rounded-2xl bg-white text-slate-900 px-6 py-4 font-black text-lg hover:bg-white/90"
              >
                Start
              </button>

              {!cleanMode ? (
                <div className="text-sm text-white/60">
                  Tip: Press Enter to start. Use → to reveal/next.
                </div>
              ) : null}
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="font-black">Transcript</div>
                  <div className="text-sm text-white/60">
                    Copy/paste for recording. Matches question order.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={copyTranscript}
                  className="shrink-0 rounded-xl bg-white/10 px-4 py-2 font-bold text-white/85 hover:bg-white/15"
                >
                  {transcriptCopied ? "Copied" : "Copy"}
                </button>
              </div>

              <textarea
                readOnly
                value={transcriptText}
                rows={Math.min(18, Math.max(8, total * 3 + 3))}
                className="mt-4 w-full resize-y rounded-xl bg-slate-950/40 px-4 py-3 text-sm text-white/90 outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-emerald-400/60 font-mono"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (titleActive) {
    return (
      <div
        ref={containerRef}
        tabIndex={-1}
        className="min-h-screen flex items-center justify-center p-8 outline-none"
      >
        <div className="max-w-4xl w-full text-center">
          <div className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
            Daily Trivia Warm-Up
          </div>

          <div className="mt-10 flex justify-center h-28">
            {titleCountdownValue ? (
              <div key={titleCountdownKey} className="countdown-pop">
                <CountdownCircle
                  value={titleCountdownValue}
                  durationMs={titleCountdownDurationMs}
                />
              </div>
            ) : (
              <div aria-hidden className="h-28 w-28" />
            )}
          </div>

          {!cleanMode ? (
            <div className="mt-10 text-sm text-white/60">
              Tip: Press → to skip.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  if (finished) {
    const waveText = "for daily trivia";
    const waveStartMs = 1300;
    const waveStaggerMs = 45;
    const waveDurationMs = 450;
    const mainEndMs =
      waveStartMs +
      Math.max(0, waveText.length - 1) * waveStaggerMs +
      waveDurationMs;
    const promoDelayMs = mainEndMs + 1000;

    return (
      <div
        ref={containerRef}
        tabIndex={-1}
        className="min-h-screen p-8 outline-none"
      >
        <div
          className="end-stage mx-auto max-w-4xl w-full min-h-[calc(100vh-64px)] relative flex flex-col items-center justify-center text-center"
          style={{ ["--promoDelay" as any]: `${promoDelayMs}ms` } as any}
        >
          <div className="end-main">
            {!cleanMode ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-white/80">
                End of round
              </div>
            ) : null}

            <div className="mt-6 mb-10">
              <div className="text-5xl md:text-7xl font-black tracking-tight leading-tight">
                <span className="end-like inline-block">like</span>
                <span className="end-and inline-block mx-4">and</span>
                <span className="end-subscribe inline-block">subscribe</span>
              </div>

              <div className="end-line2 mt-4 text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {Array.from(waveText).map((ch, i) => (
                  <span
                    key={`${ch}-${i}`}
                    className={ch === " " ? "" : "wave-letter"}
                    style={
                      ch === " "
                        ? undefined
                        : ({
                            ["--d" as any]: `${waveStartMs + i * waveStaggerMs}ms`,
                          } as any)
                    }
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="end-promo" aria-hidden={false}>
            <div className="end-promo-inner space-y-3">
              <div className="text-lg md:text-xl font-semibold text-white/70">
                Brought to you by
              </div>
              <div className="end-promo-brand text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Trivia Central
              </div>
              <div className="mx-auto max-w-2xl text-xl md:text-xl text-white/70 leading-relaxed">
                Prepping for a game show or trivia night? <br></br>Train like a
                pro on our free site.<br></br> Link in description.
              </div>
            </div>
          </div>

          {!cleanMode ? (
            <div className="end-actions">
              <div className="flex items-center justify-center gap-3">
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
            </div>
          ) : null}
        </div>

        <style jsx>{`
          .end-like {
            opacity: 0;
            color: rgba(59, 130, 246, 0.98);
            text-shadow:
              0 0 16px rgba(59, 130, 246, 0.35),
              0 0 30px rgba(59, 130, 246, 0.25);
            animation: endFlyLeft 560ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
          }

          .end-and {
            opacity: 0;
            color: rgba(16, 195, 129, 0.98);
            text-shadow:
              0 0 16px rgba(16, 195, 129, 0.35),
              0 0 30px rgba(16, 195, 129, 0.25);
            animation: endPop 360ms ease-out forwards;
            animation-delay: 420ms;
          }

          .end-subscribe {
            opacity: 0;
            color: rgba(236, 72, 153, 0.98);
            text-shadow:
              0 0 16px rgba(236, 72, 153, 0.35),
              0 0 30px rgba(236, 72, 153, 0.25);
            animation: endFlyRight 560ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
            animation-delay: 600ms;
          }

          .end-line2 {
            opacity: 0;
            color: rgba(250, 204, 21, 0.98);
            text-shadow:
              0 0 18px rgba(250, 204, 21, 0.28),
              0 0 34px rgba(250, 204, 21, 0.18);
            animation: endFlyUp 520ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
            animation-delay: 980ms;
          }

          .wave-letter {
            display: inline-block;
            animation: endWave 450ms ease-in-out 1;
            animation-delay: var(--d);
          }

          .end-stage {
            --mainUp: clamp(120px, 16vh, 220px);
          }

          .end-main {
            transform: translateY(0);
            animation: endMainUp 520ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
            animation-delay: var(--promoDelay);
          }

          .end-promo {
            position: absolute;
            left: 0;
            right: 0;
            top: 50%;
            margin-top: 50px;
            transform: translateY(-50%);
            pointer-events: none;
          }

          .end-promo-inner {
            opacity: 0;
            animation: endPromoIn 520ms cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
            animation-delay: var(--promoDelay);
          }

          .end-actions {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
          }

          .end-promo-brand {
            color: rgba(226, 232, 240, 0.98);
            text-shadow:
              0 0 16px rgba(226, 232, 240, 0.18),
              0 0 34px rgba(226, 232, 240, 0.12);
          }

          @keyframes endFlyLeft {
            from {
              transform: translateX(-56px);
              opacity: 0;
              filter: blur(2px);
            }
            to {
              transform: translateX(0);
              opacity: 1;
              filter: blur(0px);
            }
          }

          @keyframes endFlyRight {
            from {
              transform: translateX(56px);
              opacity: 0;
              filter: blur(2px);
            }
            to {
              transform: translateX(0);
              opacity: 1;
              filter: blur(0px);
            }
          }

          @keyframes endFlyUp {
            from {
              transform: translateY(28px);
              opacity: 0;
              filter: blur(2px);
            }
            to {
              transform: translateY(0);
              opacity: 1;
              filter: blur(0px);
            }
          }

          @keyframes endPop {
            0% {
              transform: scale(0.92);
              opacity: 0;
            }
            70% {
              transform: scale(1.06);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes endWave {
            0% {
              transform: translateY(0);
            }
            50% {
              transform: translateY(-7px);
            }
            100% {
              transform: translateY(0);
            }
          }

          @keyframes endMainUp {
            from {
              transform: translateY(0);
            }
            to {
              transform: translateY(calc(-1 * var(--mainUp)));
            }
          }

          @keyframes endPromoIn {
            from {
              transform: translateY(14px);
              opacity: 0;
              filter: blur(2px);
            }
            to {
              transform: translateY(0);
              opacity: 1;
              filter: blur(0px);
            }
          }
        `}</style>
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
          {!isExtraInfoSlide && !cleanMode && current?.category ? (
            <div className="text-sm uppercase tracking-widest text-white/60">
              {current.category}
            </div>
          ) : null}

          {!isExtraInfoSlide ? (
            <div className="mt-4 text-3xl md:text-5xl font-black leading-tight">
              {current?.question}
            </div>
          ) : null}

          {!isExtraInfoSlide && timerEnabled && timerPlacement === "between" ? (
            <div className="mt-8 flex justify-center h-20">
              {!revealed && countdownValue ? (
                <div key={countdownKey} className="countdown-pop">
                  <CountdownCircle
                    value={countdownValue}
                    durationMs={countdownDurationMs}
                  />
                </div>
              ) : (
                <div aria-hidden className="h-20 w-20" />
              )}
            </div>
          ) : null}

          <div className={isExtraInfoSlide ? "mt-0" : "mt-10"}>
            <div className="relative">
              {timerEnabled &&
              timerPlacement === "overlay-right" &&
              !revealed &&
              countdownValue ? (
                <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
                  <div key={countdownKey} className="countdown-pop">
                    <CountdownCircle
                      value={countdownValue}
                      durationMs={countdownDurationMs}
                    />
                  </div>
                </div>
              ) : null}

              {revealed &&
              showContextStep &&
              currentContext &&
              extraInfoShown ? (
                <div
                  key={`${current?.id ?? "q"}-extra-${revealPulse}`}
                  className="extra-pop rounded-2xl border border-white/10 bg-white/5 p-6"
                  aria-label="Extra info"
                >
                  <div className="text-sm font-semibold text-white/70">
                    More on that...
                  </div>
                  <div className="mt-2 text-xl md:text-xl lg:text-xl text-white/90 leading-relaxed">
                    {currentContext}
                  </div>
                </div>
              ) : (
                <div
                  key={`${current?.id ?? "q"}-pulse-${revealPulse}`}
                  className={
                    revealed
                      ? "answer-pop rounded-2xl bg-emerald-500/15 border border-emerald-300/30 p-6"
                      : "rounded-2xl bg-white/5 border border-white/10 p-6"
                  }
                >
                  <div className="text-sm font-semibold text-white/70">
                    Answer
                  </div>

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
                      {timerEnabled && timerManualStart && !countdownValue
                        ? "Press → to start the timer."
                        : "Press → to reveal."}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {!cleanMode ? (
            <div className="mt-8 flex items-center justify-between text-sm text-white/50">
              <div>
                {!revealed
                  ? "Press → to reveal the answer"
                  : showContextStep && currentContext && !extraInfoShown
                    ? "Press → for extra info"
                    : "Press → for next question"}
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

        {timerEnabled && timerPlacement === "under-answer" ? (
          <div className="mt-6 flex justify-center h-20">
            {!revealed && countdownValue ? (
              <div key={countdownKey} className="countdown-pop">
                <CountdownCircle
                  value={countdownValue}
                  durationMs={countdownDurationMs}
                />
              </div>
            ) : (
              <div aria-hidden className="h-20 w-20" />
            )}
          </div>
        ) : null}

        <style jsx global>{`
          .answer-pop {
            animation: answerPop 420ms ease-out;
          }

          .extra-pop {
            animation: extraPop 360ms ease-out;
          }

          .countdown-pop {
            animation: countdownPop 220ms ease-out;
          }

          .countdown-progress {
            stroke-dasharray: var(--circ);
            stroke-dashoffset: 0;
            stroke: var(--ringStart);
            filter: drop-shadow(0 0 0px rgba(0, 0, 0, 0));
            animation:
              countdownDash var(--dur) linear forwards,
              countdownColor var(--dur) linear forwards,
              countdownGlow var(--dur) ease-out forwards;
          }

          .countdown-text {
            color: var(--textStart);
            text-shadow: 0 0 0px rgba(0, 0, 0, 0);
            animation:
              countdownTextColor var(--dur) linear forwards,
              countdownTextGlow var(--dur) ease-out forwards;
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

          @keyframes extraPop {
            0% {
              transform: translateY(4px);
              opacity: 0.85;
            }
            100% {
              transform: translateY(0);
              opacity: 1;
            }
          }

          @keyframes countdownDash {
            from {
              stroke-dashoffset: 0;
            }
            to {
              stroke-dashoffset: var(--circ);
            }
          }

          @keyframes countdownPop {
            0% {
              transform: scale(0.96);
              opacity: 0.85;
            }
            100% {
              transform: scale(1);
              opacity: 1;
            }
          }

          @keyframes countdownColor {
            from {
              stroke: var(--ringStart);
            }
            to {
              stroke: var(--ringEnd);
            }
          }

          @keyframes countdownTextColor {
            from {
              color: var(--textStart);
            }
            to {
              color: var(--textEnd);
            }
          }

          @keyframes countdownGlow {
            from {
              filter: drop-shadow(0 0 0px rgba(0, 0, 0, 0));
            }
            to {
              filter: drop-shadow(0 0 10px var(--glow))
                drop-shadow(0 0 22px var(--glow));
            }
          }

          @keyframes countdownTextGlow {
            from {
              text-shadow: 0 0 0px rgba(0, 0, 0, 0);
            }
            to {
              text-shadow:
                0 0 10px var(--glow),
                0 0 24px var(--glow);
            }
          }
        `}</style>
      </div>
    </div>
  );
}

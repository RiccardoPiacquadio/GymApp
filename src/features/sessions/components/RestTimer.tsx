import { useCallback, useEffect, useRef, useState } from "react";

type RestTimerProps = {
  /** Auto-start when this value changes (e.g. set count) */
  trigger?: number;
  /** Default rest duration in seconds */
  defaultSeconds?: number;
};

const REST_PRESETS = [60, 90, 120, 180, 240, 300];

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const vibrate = () => {
  try {
    navigator.vibrate?.([200, 100, 200, 100, 300]);
  } catch {
    // Vibration not supported
  }
};

const playBeep = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.3;
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
    setTimeout(() => ctx.close(), 500);
  } catch {
    // Audio not supported
  }
};

export const RestTimer = ({ trigger, defaultSeconds = 90 }: RestTimerProps) => {
  const [duration, setDuration] = useState(defaultSeconds);
  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTrigger = useRef(trigger);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setRemaining(0);
  }, []);

  const start = useCallback((seconds: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRemaining(seconds);
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
          vibrate();
          playBeep();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Auto-start when trigger changes (new set logged)
  useEffect(() => {
    if (trigger !== undefined && prevTrigger.current !== undefined && trigger !== prevTrigger.current) {
      start(duration);
    }
    prevTrigger.current = trigger;
  }, [trigger, duration, start]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const progress = isRunning ? ((duration - remaining) / duration) * 100 : 0;

  return (
    <div className="app-panel overflow-hidden">
      {/* Timer header — always visible */}
      <button
        type="button"
        className="flex w-full items-center justify-between p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="text-ink/50">
            <circle cx="10" cy="11" r="7" />
            <polyline points="10,7 10,11 13,13" />
            <line x1="8" y1="2" x2="12" y2="2" />
          </svg>
          <span className="text-sm font-semibold text-ink">Rest Timer</span>
        </div>
        <div className="flex items-center gap-3">
          {isRunning ? (
            <span className={`text-lg font-bold tabular-nums ${remaining <= 10 ? "text-danger animate-pulse" : "text-accent"}`}>
              {formatTime(remaining)}
            </span>
          ) : remaining === 0 && prevTrigger.current !== undefined ? (
            <span className="text-sm text-ink/40">{formatTime(duration)}</span>
          ) : null}
          <svg
            width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            className={`text-ink/30 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          >
            <polyline points="2,4 6,8 10,4" />
          </svg>
        </div>
      </button>

      {/* Progress bar */}
      {isRunning ? (
        <div className="h-1 bg-ink/[0.06]">
          <div
            className="h-full bg-accent transition-all duration-1000 ease-linear"
            style={{ width: `${100 - progress}%` }}
          />
        </div>
      ) : null}

      {/* Expanded controls */}
      {isExpanded ? (
        <div className="space-y-3 border-t border-ink/[0.06] p-4">
          {/* Duration presets */}
          <div className="flex flex-wrap gap-2">
            {REST_PRESETS.map((s) => (
              <button
                key={s}
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  duration === s
                    ? "bg-accent text-white"
                    : "bg-ink/[0.04] text-ink/60 hover:text-ink"
                }`}
                onClick={() => {
                  setDuration(s);
                  if (!isRunning) setRemaining(0);
                }}
              >
                {formatTime(s)}
              </button>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {isRunning ? (
              <>
                <button
                  type="button"
                  className="secondary-button flex-1 py-2 text-xs"
                  onClick={() => setRemaining((r) => Math.max(0, r - 15))}
                >
                  -15s
                </button>
                <button
                  type="button"
                  className="secondary-button flex-1 py-2 text-xs"
                  onClick={() => setRemaining((r) => r + 15)}
                >
                  +15s
                </button>
                <button
                  type="button"
                  className="danger-button flex-1 py-2 text-xs"
                  onClick={stop}
                >
                  Stop
                </button>
              </>
            ) : (
              <button
                type="button"
                className="primary-button flex-1 py-2 text-xs"
                onClick={() => start(duration)}
              >
                Avvia timer ({formatTime(duration)})
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

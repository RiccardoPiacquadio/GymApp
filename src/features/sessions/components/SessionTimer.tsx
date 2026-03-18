import { useEffect, useState } from "react";
import type { WorkoutSession } from "../../../types";

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const calcElapsed = (session: WorkoutSession): number => {
  const start = new Date(session.startedAt).getTime();
  const paused = session.totalPausedMs ?? 0;

  if (session.status === "paused" && session.pausedAt) {
    return new Date(session.pausedAt).getTime() - start - paused;
  }

  return Date.now() - start - paused;
};

type Props = {
  session: WorkoutSession;
  onPause: () => void;
  onResume: () => void;
  onClose: () => void;
};

export const SessionTimer = ({ session, onPause, onResume, onClose }: Props) => {
  const [elapsed, setElapsed] = useState(() => calcElapsed(session));
  const isPaused = session.status === "paused";

  useEffect(() => {
    setElapsed(calcElapsed(session));

    if (isPaused) return;

    const interval = setInterval(() => setElapsed(calcElapsed(session)), 1000);
    return () => clearInterval(interval);
  }, [session.startedAt, session.status, session.pausedAt, session.totalPausedMs, isPaused]);

  return (
    <div className="dark-panel flex items-center justify-between gap-3 px-5 py-4">
      <div className="flex items-center gap-3">
        {/* Pulsating dot — green when running, yellow when paused */}
        <span
          className={`h-3 w-3 rounded-full ${
            isPaused ? "bg-yellow-400" : "bg-green-400 animate-pulse"
          }`}
        />
        <span className="font-mono text-2xl font-semibold tabular-nums text-white">
          {formatElapsed(elapsed)}
        </span>
      </div>
      <div className="flex gap-2">
        {isPaused ? (
          <button
            type="button"
            className="rounded-full bg-accent px-4 py-2 text-xs font-semibold text-white"
            onClick={onResume}
          >
            Riprendi
          </button>
        ) : (
          <button
            type="button"
            className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white"
            onClick={onPause}
          >
            Pausa
          </button>
        )}
        <button
          type="button"
          className="rounded-full bg-danger px-4 py-2 text-xs font-semibold text-white"
          onClick={onClose}
        >
          Fine
        </button>
      </div>
    </div>
  );
};

"use client";

import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";

const FOCUS_MINUTES = 50;

/**
 * Distraction-free countdown timer, shelf-card sized. Deliberately minimal:
 * one block length, start / pause / reset. Session logging to the API
 * arrives with the Daily Alignment backend module (Action Plan, iteration 3).
 */
export function FocusTimer() {
  const [secondsLeft, setSecondsLeft] = useState(FOCUS_MINUTES * 60);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setRunning(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const done = secondsLeft === 0;

  return (
    <article className="flex w-full flex-col items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
      <p className="self-start text-xs uppercase tracking-widest text-muted-foreground">
        Focus block · {FOCUS_MINUTES} min
      </p>
      <div
        className={`font-mono text-5xl tabular-nums tracking-tight ${
          done ? "text-primary" : ""
        }`}
      >
        {done ? "done" : `${minutes}:${seconds}`}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={running ? "secondary" : "default"}
          onClick={() => setRunning((r) => !r && !done)}
        >
          {running ? "Pause" : "Start"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setSecondsLeft(FOCUS_MINUTES * 60);
          }}
        >
          Reset
        </Button>
      </div>
    </article>
  );
}

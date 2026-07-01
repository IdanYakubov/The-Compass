"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";

/**
 * A lightweight, dependency-free product tour. Each step anchors a popover to a
 * real element on the page (matched by a `data-tour` attribute) and dims the
 * rest with a spotlight ring. The last step is the hand-off to the Roadmap.
 *
 * Kept deliberately self-contained so it can be dropped onto any screen: the
 * host decides when to render it (e.g. first visit after onboarding) and what
 * "finish" does via the callbacks.
 */

interface TourStep {
  /** CSS selector for the element to highlight, e.g. '[data-tour="top3"]'. */
  selector: string;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    selector: '[data-tour="top3"]',
    title: "Your Top 3",
    body: "Every day we surface the three highest-impact tasks. This is where you start.",
  },
  {
    selector: '[data-tour="focus"]',
    title: "Focus timer",
    body: "Run a focused block on the one task that matters most right now.",
  },
  {
    selector: '[data-tour="advisor"]',
    title: "Your mentor",
    body: "Ask anything about your venture — it knows what stage and milestone you're on.",
  },
  {
    selector: '[data-tour="horizon"]',
    title: "Your Roadmap",
    body: "This is the path we mapped from your onboarding. Let's take a look.",
  },
];

interface Props {
  /** Called when the user finishes the last step (e.g. mark done + go to Roadmap). */
  onFinish: () => void;
  /** Called when the user skips/dismisses the tour (mark done, stay put). */
  onSkip: () => void;
}

export function TutorialOverlay({ onFinish, onSkip }: Props) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  // Measure the anchored element; re-measure on scroll/resize so the popover
  // and spotlight track the target. useLayoutEffect avoids a one-frame flash.
  const measure = useCallback(() => {
    const el = document.querySelector(step.selector);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "smooth" });
    setRect(el.getBoundingClientRect());
  }, [step.selector]);

  useLayoutEffect(() => {
    // Measuring requires reading the DOM after render, so setState-in-effect is
    // intentional here (there's no render-time way to get the element's rect).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- DOM measurement
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [measure]);

  // If a target is missing (layout differs), don't trap the user — skip the step.
  useEffect(() => {
    if (rect === null) {
      const t = setTimeout(() => {
        if (!document.querySelector(step.selector)) {
          if (isLast) onFinish();
          else setIndex((i) => i + 1);
        }
      }, 400);
      return () => clearTimeout(t);
    }
  }, [rect, step.selector, isLast, onFinish]);

  if (!rect) return null;

  // Place the popover below the target, clamped to the viewport.
  const popoverWidth = 288; // w-72
  const top = Math.min(rect.bottom + 12, window.innerHeight - 200);
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - popoverWidth - 12);

  return (
    <div className="fixed inset-0 z-50 bg-black/60" onClick={onSkip} role="presentation">
      {/* Spotlight ring around the anchored element. */}
      <div
        className="pointer-events-none absolute rounded-xl ring-2 ring-primary transition-all duration-300"
        style={{
          top: rect.top - 6,
          left: rect.left - 6,
          width: rect.width + 12,
          height: rect.height + 12,
        }}
      />

      {/* The instruction card. Stop propagation so clicks inside don't dismiss. */}
      <div
        className="absolute w-72 rounded-xl border border-border bg-card p-4 shadow-xl"
        style={{ top, left }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={step.title}
      >
        <p className="text-xs uppercase tracking-widest text-muted-foreground">
          Step {index + 1} of {STEPS.length}
        </p>
        <h3 className="mt-1 font-serif text-base">{step.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{step.body}</p>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Skip tour
          </button>
          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={() => setIndex((i) => i - 1)}
                className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
              >
                Back
              </button>
            )}
            <button
              onClick={() => (isLast ? onFinish() : setIndex((i) => i + 1))}
              className="rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
            >
              {isLast ? "Open my Roadmap" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

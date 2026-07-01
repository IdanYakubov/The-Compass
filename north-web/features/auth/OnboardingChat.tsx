"use client";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import { ONBOARDING_QUESTIONS, type OnboardingAnswers } from "./onboarding";

interface ChatLine {
  role: "advisor" | "user";
  text: string;
}

/**
 * The mandatory intro conversation. Asks the 3 key questions one at a time, then
 * commits the answers via completeOnboarding, which sets OnboardingCompleted and
 * tailors the dashboard. Until that call, AppGate keeps the dashboard and The
 * Horizon out of reach. Feature gates themselves are unlocked by real milestone
 * progress on the backend, not by onboarding.
 */
export function OnboardingChat() {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [history, setHistory] = useState<ChatLine[]>([]);
  // Free-text "in your own words" answer, captured after the multiple-choice steps.
  const [about, setAbout] = useState("");
  // Per-question "write my own answer" mode: lets a custom answer replace the
  // preset buttons on any question. The structured field still needs a typed
  // value (stage/situation/etc. drive existing UI), so we keep a sensible
  // fallback (the question's first option) and stash the actual free text —
  // it's folded into `about` at the end as extra context for a future AI mentor.
  const [customMode, setCustomMode] = useState(false);
  const [customText, setCustomText] = useState("");
  const [customNotes, setCustomNotes] = useState<string[]>([]);

  const finished = step >= ONBOARDING_QUESTIONS.length;
  const question = finished ? null : ONBOARDING_QUESTIONS[step];

  const choose = (value: string, label: string) => {
    const q = ONBOARDING_QUESTIONS[step];
    setHistory((h) => [
      ...h,
      { role: "advisor", text: q.prompt },
      { role: "user", text: label },
    ]);
    setAnswers((a) => ({ ...a, [q.id]: value }));
    setStep((s) => s + 1);
  };

  const submitCustom = () => {
    const trimmed = customText.trim();
    if (!trimmed) return;
    const q = ONBOARDING_QUESTIONS[step];
    setHistory((h) => [
      ...h,
      { role: "advisor", text: q.prompt },
      { role: "user", text: trimmed },
    ]);
    // Fall back to the first preset option for the structured field — existing
    // UI (stage badge, personalization) still needs a typed value — while the
    // actual free text is preserved in customNotes for the mentor later.
    setAnswers((a) => ({ ...a, [q.id]: q.options[0].value }));
    setCustomNotes((n) => [...n, `${q.prompt}: ${trimmed}`]);
    setCustomText("");
    setCustomMode(false);
    setStep((s) => s + 1);
  };

  // Once every question is answered the full set is ready to commit — including
  // any per-question custom answers plus the closing free-text, so a future AI
  // mentor has the person's own words wherever they gave them.
  const combinedAbout = [...customNotes, about.trim()].filter(Boolean).join("\n");
  const complete: OnboardingAnswers = { ...(answers as OnboardingAnswers), about: combinedAbout };

  return (
    <div className="flex w-full items-center justify-center px-6 py-10">
      <div className="flex h-full max-h-[680px] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
        {/* header */}
        <header className="flex items-center gap-2 border-b border-border px-5 py-4">
          <Logo className="h-5 w-5" />
          <div>
            <h2 className="font-serif text-lg tracking-tight">Let&apos;s set your bearing</h2>
            <p className="text-xs text-muted-foreground">
              {user?.email} · {Math.min(step + (finished ? 0 : 1), ONBOARDING_QUESTIONS.length)} of{" "}
              {ONBOARDING_QUESTIONS.length}
            </p>
          </div>
        </header>

        {/* conversation */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {history.map((line, i) => (
            <div
              key={i}
              className={
                line.role === "user"
                  ? "max-w-[80%] self-end rounded-2xl rounded-br-sm bg-primary/15 px-4 py-2.5 text-sm"
                  : "max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed"
              }
            >
              {line.text}
            </div>
          ))}

          {question && (
            <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed">
              {question.prompt}
            </div>
          )}

          {finished && (
            <>
              <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed">
                Perfect — I&apos;ve set your stage to{" "}
                <span className="font-semibold text-foreground">{complete.stage}</span>.
                I&apos;ve lined up the right first milestones and tailored your daily tasks.
              </div>
              <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed">
                Last thing — in your own words, what are you building or working on,
                and what do you want from me? The more I know, the sharper my advice.
                <span className="text-muted-foreground"> (Optional — you can skip.)</span>
              </div>
            </>
          )}
        </div>

        {/* answer options / finish */}
        <footer className="border-t border-border px-5 py-4">
          {question && customMode ? (
            <div className="flex flex-col gap-3">
              <textarea
                autoFocus
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                rows={2}
                placeholder="Type your own answer…"
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
              />
              <div className="flex justify-between gap-2">
                <button
                  onClick={() => {
                    setCustomMode(false);
                    setCustomText("");
                  }}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Back to choices
                </button>
                <Button onClick={submitCustom} disabled={!customText.trim()}>
                  Continue
                </Button>
              </div>
            </div>
          ) : question ? (
            <div className="flex flex-wrap gap-2">
              {question.options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => choose(opt.value, opt.label)}
                  className="rounded-full border border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {opt.label}
                </button>
              ))}
              <button
                onClick={() => setCustomMode(true)}
                className="rounded-full border border-dashed border-border bg-background px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
              >
                ✎ Write my own answer
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={3}
                placeholder="e.g. I'm a graphic designer going solo — I want to land my first 3 paying clients and stay focused in the mornings."
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
              />
              <Button size="lg" className="w-full" onClick={() => completeOnboarding(complete)}>
                Open my North →
              </Button>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

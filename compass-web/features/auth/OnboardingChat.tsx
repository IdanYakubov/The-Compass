"use client";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "./AuthContext";
import {
  ONBOARDING_QUESTIONS,
  deriveUnlocks,
  type OnboardingAnswers,
} from "./onboarding";

interface ChatLine {
  role: "advisor" | "user";
  text: string;
}

/**
 * The mandatory intro conversation. Asks the 3 key questions one at a time, then
 * commits the answers via completeOnboarding — which sets OnboardingCompleted and
 * derives the founder's starting unlocks. Until that call, AppGate keeps the
 * dashboard and The Horizon out of reach.
 */
export function OnboardingChat() {
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<OnboardingAnswers>>({});
  const [history, setHistory] = useState<ChatLine[]>([]);

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

  // Once all three are answered we can compute the unlock preview.
  const complete = answers as OnboardingAnswers;
  const preview = finished ? deriveUnlocks(complete) : null;

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
            <div className="max-w-[80%] self-start rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed">
              Perfect — I&apos;ve set your stage to{" "}
              <span className="font-semibold text-foreground">{preview?.stage}</span>.
              {preview && preview.unlockedGateKeys.length > 0 ? (
                <> Based on your answers I&apos;ve unlocked {preview.unlockedGateKeys.length} early feature
                {preview.unlockedGateKeys.length > 1 ? "s" : ""} and tailored your daily tasks.</>
              ) : (
                <> I&apos;ve lined up the right first milestones and tailored your daily tasks.</>
              )}
            </div>
          )}
        </div>

        {/* answer options / finish */}
        <footer className="border-t border-border px-5 py-4">
          {question ? (
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
            </div>
          ) : (
            <Button size="lg" className="w-full" onClick={() => completeOnboarding(complete)}>
              Open my Compass →
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

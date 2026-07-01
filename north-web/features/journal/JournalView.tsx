"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { getJournalPrompts } from "./prompts";

interface JournalEntry {
  id: string;
  dateISO: string;
  prompt: string;
  text: string;
}

/**
 * Situation-aware journaling. Prompts adapt to the person (set at onboarding),
 * and entries are stored locally per user. Available to everyone, regardless of
 * whether they have a venture/roadmap.
 */
export function JournalView() {
  const { user, onboarding } = useAuth();
  const situation = onboarding?.situation ?? "exploring";
  const prompts = useMemo(() => getJournalPrompts(situation), [situation]);
  const storageKey = `north.journal.${user?.email ?? "anon"}`;

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [ready, setReady] = useState(false);
  const [prompt, setPrompt] = useState(prompts[0]);
  const [text, setText] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only localStorage hydration; reading during render would break SSR
      if (raw) setEntries(JSON.parse(raw));
    } catch {
      // ignore corrupt/blocked storage
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(entries));
    } catch {
      // ignore
    }
  }, [entries, ready, storageKey]);

  // Keep the selected prompt valid if the situation (and prompt list) changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- resetting selection when the prompt list changes is the intended sync
  useEffect(() => setPrompt(prompts[0]), [prompts]);

  const save = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setEntries((e) => [
      { id: crypto.randomUUID(), dateISO: new Date().toISOString(), prompt, text: trimmed },
      ...e,
    ]);
    setText("");
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl tracking-tight">Journal</h1>
        <p className="text-sm text-muted-foreground">
          A few minutes of reflection, tuned to where you are. Private to you.
        </p>
      </header>

      {/* ---- Today's entry ---- */}
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap gap-2">
          {prompts.map((p) => (
            <button
              key={p}
              onClick={() => setPrompt(p)}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                prompt === p
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <p className="font-serif text-lg leading-snug">{prompt}</p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Write freely…"
          className="resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none transition-colors focus:border-primary/60"
        />
        <div className="flex justify-end">
          <Button onClick={save} disabled={!text.trim()}>
            Save entry
          </Button>
        </div>
      </section>

      {/* ---- Past entries ---- */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground">
          {entries.length > 0 ? "Your entries" : "No entries yet"}
        </h2>
        {entries.map((entry) => (
          <article key={entry.id} className="flex flex-col gap-1.5 rounded-xl border border-border bg-card/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-primary/80">{entry.prompt}</span>
              <time className="text-[11px] tabular-nums text-muted-foreground">
                {new Date(entry.dateISO).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </time>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{entry.text}</p>
          </article>
        ))}
      </section>
    </div>
  );
}

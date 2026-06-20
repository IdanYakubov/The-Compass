"use client";

import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Today } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { getAdvice, getQuickPrompts, type AdvisorContext } from "./advisor";

interface Message {
  id: number;
  role: "user" | "advisor";
  text: string;
}

/** Renders the advisor's lightweight markdown: only **bold** is supported. */
function FormattedText({ text }: { text: string }) {
  return (
    <>
      {text.split("**").map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-foreground">
            {part}
          </strong>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * The Advisory Matrix — a context-aware advisor docked beside the dashboard,
 * so the founder can consult it while looking at their Top 3 and timer.
 * Replies come from the local rule-based engine in advisor.ts for now.
 */
export function AdvisorPanel({ today }: { today: Today }) {
  const ctx: AdvisorContext = {
    stage: today.stage,
    milestone: today.activeMilestoneTitle,
    activeTask: today.topTasks[0]?.title ?? null,
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const nextId = useRef(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    setMessages((m) => [...m, { id: nextId.current++, role: "user", text: trimmed }]);
    setInput("");
    setThinking(true);
    // Simulated latency so the exchange reads like a conversation.
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: nextId.current++, role: "advisor", text: getAdvice(trimmed, ctx) },
      ]);
      setThinking(false);
    }, 600);
  };

  return (
    <aside
      data-tour="advisor"
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      {/* ---- Contextual header: proof the advisor knows where you are ---- */}
      <header className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          <Logo className="h-4 w-4" />
          <h2 className="font-serif text-lg tracking-tight">The Advisory Matrix</h2>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {ctx.milestone ?? "No active milestone"}
          </Badge>
          {ctx.activeTask && (
            <Badge variant="outline" className="border-border bg-secondary text-muted-foreground">
              Now: {ctx.activeTask}
            </Badge>
          )}
        </div>
      </header>

      {/* ---- Message history ---- */}
      <div ref={scrollRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 && (
          <p className="m-auto max-w-[26ch] text-center text-sm text-muted-foreground">
            I&apos;m tracking your work on{" "}
            <span className="text-foreground">“{ctx.milestone ?? "your venture"}”</span>.
            Ask me anything — or start from a prompt below.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user"
                ? "max-w-[70ch] self-end rounded-2xl rounded-br-sm bg-primary/15 px-4 py-2.5 text-sm whitespace-pre-wrap"
                : "max-w-[70ch] self-start rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap"
            }
          >
            <FormattedText text={msg.text} />
          </div>
        ))}
        {thinking && (
          <div className="mr-4 self-start rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-muted-foreground">
            <span className="animate-pulse">Consulting the matrix…</span>
          </div>
        )}
      </div>

      {/* ---- Quick prompts + minimalist input ---- */}
      <footer className="flex flex-col gap-3 border-t border-border px-5 py-4">
        <div className="flex flex-wrap gap-2">
          {getQuickPrompts(ctx.stage).map((prompt) => (
            <button
              key={prompt}
              onClick={() => send(prompt)}
              disabled={thinking}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 transition-colors focus-within:border-primary/60"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your advisor…"
            className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button type="submit" size="sm" disabled={!input.trim() || thinking} className="rounded-full">
            Send
          </Button>
        </form>
      </footer>
    </aside>
  );
}

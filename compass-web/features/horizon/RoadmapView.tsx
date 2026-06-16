"use client";

import { Shelf } from "@/components/Shelf";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ApiError } from "@/lib/api";
import type { Milestone } from "@/lib/types";
import { useState } from "react";
import { useVenture } from "../daily/hooks";
import { useCompleteMilestone, useRoadmap } from "./hooks";

/** Streaming-style Horizon: a hero with the venture's bearing, then one shelf per status. */
export function RoadmapView() {
  const venture = useVenture();
  const roadmap = useRoadmap(venture.data?.id);
  const completeMilestone = useCompleteMilestone(venture.data?.id);
  const [notice, setNotice] = useState<string | null>(null);

  if (venture.isLoading || roadmap.isLoading) {
    return <p className="text-sm text-muted-foreground">Charting the horizon…</p>;
  }
  if (!roadmap.data) {
    return <p className="text-sm text-muted-foreground">Could not load the roadmap.</p>;
  }

  const milestones = roadmap.data.milestones;
  const active = milestones.filter((m) => m.status === "Active");
  const locked = milestones.filter((m) => m.status === "Locked");
  const achieved = milestones.filter((m) => m.status === "Achieved");

  const handleComplete = (milestone: Milestone) => {
    setNotice(null);
    completeMilestone.mutate(milestone.id, {
      onSuccess: (result) => {
        const unlocked = result.unlockedMilestones.map((m) => `“${m.title}”`).join(", ");
        setNotice(
          unlocked
            ? `🎉 “${milestone.title}” achieved — unlocked ${unlocked}. Stage: ${result.stage}.`
            : `🎉 “${milestone.title}” achieved. Stage: ${result.stage}.`,
        );
      },
      // Domain rule violations (open tasks, locked prerequisite) come back as 409s.
      onError: (err) =>
        setNotice(err instanceof ApiError ? err.message : "Something went wrong."),
    });
  };

  return (
    <div className="flex flex-col gap-12">
      {/* ============ Hero ============ */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-background px-8 py-10 md:px-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {roadmap.data.ventureName}
          </p>
          <h1 className="font-serif text-4xl tracking-tight">The Horizon</h1>
          <p className="text-sm text-muted-foreground">
            Stage <span className="text-primary">{roadmap.data.stage}</span> ·{" "}
            {achieved.length} of {milestones.length} milestones achieved
          </p>
        </div>
      </section>

      {notice && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm">
          {notice}
        </div>
      )}

      {active.length > 0 && (
        <Shelf title="In play" subtitle="what you're building right now">
          {active.map((m) => (
            <MilestoneCard key={m.id} milestone={m} onComplete={handleComplete} completing={completeMilestone.isPending} />
          ))}
        </Shelf>
      )}

      {locked.length > 0 && (
        <Shelf title="Up next" subtitle="unlocks as you progress">
          {locked.map((m) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </Shelf>
      )}

      {achieved.length > 0 && (
        <Shelf title="Achieved" subtitle="the road behind you">
          {achieved.map((m) => (
            <MilestoneCard key={m.id} milestone={m} />
          ))}
        </Shelf>
      )}
    </div>
  );
}

function MilestoneCard({
  milestone: m,
  onComplete,
  completing,
}: {
  milestone: Milestone;
  onComplete?: (m: Milestone) => void;
  completing?: boolean;
}) {
  const locked = m.status === "Locked";
  const achieved = m.status === "Achieved";

  return (
    <article
      className={`flex w-[340px] shrink-0 snap-start flex-col gap-3 rounded-xl border p-5 transition-colors ${
        locked
          ? "border-border bg-card/50 opacity-60"
          : achieved
            ? "border-primary/25 bg-card"
            : "border-border bg-card hover:border-primary/40"
      }`}
    >
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={
            achieved
              ? "border-primary/30 bg-primary/10 text-primary"
              : locked
                ? "border-border bg-muted text-muted-foreground"
                : "border-sky-500/30 bg-sky-500/10 text-sky-400"
          }
        >
          {locked ? "🔒 Locked" : achieved ? "✓ Achieved" : "Active"}
        </Badge>
        {m.gateKey && (
          <span className="font-mono text-[10px] text-muted-foreground">{m.gateKey}</span>
        )}
      </div>

      <h3 className="font-serif text-xl leading-snug">{m.title}</h3>
      {m.description && (
        <p className="line-clamp-2 text-xs text-muted-foreground">{m.description}</p>
      )}

      {m.tasksTotal > 0 && (
        <div className="mt-auto flex items-center gap-3 pt-2">
          <Progress value={m.progress * 100} className="flex-1" />
          <span className="text-xs tabular-nums text-muted-foreground">
            {m.tasksCompleted}/{m.tasksTotal}
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-muted-foreground">
          {m.targetDate ? `target ${m.targetDate}` : ""}
        </span>
        {m.status === "Active" && onComplete && (
          <Button size="sm" disabled={completing} onClick={() => onComplete(m)}>
            Mark achieved
          </Button>
        )}
      </div>
    </article>
  );
}

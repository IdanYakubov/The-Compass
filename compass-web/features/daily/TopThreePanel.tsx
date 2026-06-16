"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FocusTask, ImpactLevel } from "@/lib/types";

const IMPACT_STYLE: Record<ImpactLevel, string> = {
  High: "bg-primary/15 text-primary border-primary/30",
  Medium: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  Low: "bg-muted text-muted-foreground border-border",
};

interface Props {
  tasks: FocusTask[];
  onComplete: (taskId: string) => void;
  completing: boolean;
}

/**
 * The anti-overwhelm core of The Compass: exactly three high-impact tasks,
 * as a compact vertical stack that fits the dashboard's side column.
 */
export function TopThreePanel({ tasks, onComplete, completing }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {tasks.length === 0 && (
        <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border px-4 text-center text-sm text-muted-foreground">
          Nothing in the queue — add micro-tasks to your active milestone on The Horizon.
        </div>
      )}
      {tasks.map((task, i) => (
        <article
          key={task.id}
          className="relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
        >
          {/* oversized ghost number, poster-style */}
          <span className="pointer-events-none absolute -right-1 -top-5 font-serif text-[4.5rem] leading-none text-foreground/5">
            {i + 1}
          </span>
          <div className="relative flex flex-col gap-2">
            <Badge variant="outline" className={`w-fit ${IMPACT_STYLE[task.impact]}`}>
              {task.impact} impact
            </Badge>
            <h3 className="font-serif leading-snug">{task.title}</h3>
            <p className="text-xs text-muted-foreground">
              {task.milestoneTitle}
              {task.estimateMinutes ? ` · ~${task.estimateMinutes} min` : ""}
            </p>
            <Button
              size="sm"
              variant="secondary"
              className="w-fit"
              disabled={completing}
              onClick={() => onComplete(task.id)}
            >
              Mark done
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}

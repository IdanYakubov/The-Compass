"use client";

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdvisorPanel } from "@/features/advisory/AdvisorPanel";
import { useAuth } from "@/features/auth/AuthContext";
import { personalizedFocus } from "@/features/auth/onboarding";
import Link from "next/link";
import { FocusTimer } from "./FocusTimer";
import { TopThreePanel } from "./TopThreePanel";
import { useCompleteTask, useToday, useUnlocks, useVenture } from "./hooks";

/** Future modules surfaced as gated "coming attractions" — stage-gates made visible. */
const GATED_MODULES = [
  { name: "Executive Vault", blurb: "Value proposition, personas, competitors, metrics.", gate: "mvp_shipped", gateLabel: "Ship the MVP" },
] as const;

/**
 * The Daily Alignment view, chat-first: The Advisory Matrix is the main
 * stage, with execution (Top 3, focus timer, unlocks) in a tabbed side rail
 * so the founder can glance at tasks while consulting the advisor.
 */
export function DailyDashboard() {
  const venture = useVenture();
  const today = useToday(venture.data?.id);
  const unlocks = useUnlocks(venture.data?.id);
  const completeTask = useCompleteTask(venture.data?.id);
  // Onboarding answers drive personalization + the founder's starting unlocks.
  const { onboarding, unlockedGateKeys: onboardingGates } = useAuth();

  if (venture.isLoading || today.isLoading) {
    return <p className="text-sm text-muted-foreground">Aligning your day…</p>;
  }

  if (venture.isError || today.isError) {
    return (
      <div className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
        Could not reach the Compass API. Is the backend running on{" "}
        <code className="text-foreground">http://localhost:5080</code>?
      </div>
    );
  }

  if (!today.data) return null;
  const t = today.data;
  // Gates opened by real milestone progress (backend) ∪ those granted at onboarding.
  const openGates = [...(unlocks.data?.unlockedGateKeys ?? []), ...onboardingGates];

  return (
    <div className="flex h-full flex-col gap-5">
      {/* ---- Slim header strip: date, milestone bearing, stage ---- */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {" · "}{t.ventureName}
          </p>
          <h1 className="font-serif text-2xl tracking-tight">
            {t.activeMilestoneTitle ?? "No active milestone"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={t.activeMilestoneProgress * 100} className="w-36" />
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.round(t.activeMilestoneProgress * 100)}%
          </span>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {t.stage}
          </Badge>
          <Link href="/horizon" className="text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
            The Horizon →
          </Link>
        </div>
      </header>

      {/* ---- Personalized focus, derived from the onboarding answers ---- */}
      {onboarding && (
        <p className="-mt-2 text-sm text-muted-foreground">
          {personalizedFocus(onboarding)}
        </p>
      )}

      {/* ---- Main stage: chat fills the screen, side rail holds the rest ---- */}
      <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <AdvisorPanel today={t} />

        <Tabs defaultValue="today" className="flex min-h-0 flex-col">
          <TabsList className="w-full">
            <TabsTrigger value="today" className="flex-1">Top 3</TabsTrigger>
            <TabsTrigger value="focus" className="flex-1">Focus</TabsTrigger>
            <TabsTrigger value="unlocks" className="flex-1">Unlocks</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="min-h-0 flex-1 overflow-y-auto pt-3">
            <TopThreePanel
              tasks={t.topTasks}
              completing={completeTask.isPending}
              onComplete={(taskId) => completeTask.mutate(taskId)}
            />
          </TabsContent>

          <TabsContent value="focus" className="pt-3">
            <FocusTimer />
          </TabsContent>

          <TabsContent value="unlocks" className="min-h-0 flex-1 overflow-y-auto pt-3">
            <div className="flex flex-col gap-3">
              {GATED_MODULES.map((mod) => {
                const open = openGates.includes(mod.gate);
                return (
                  <article
                    key={mod.gate}
                    className={`flex flex-col gap-2 rounded-xl border p-4 ${
                      open ? "border-primary/40 bg-card" : "border-border bg-card/50 opacity-70"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {open ? "Unlocked" : "🔒 Locked"}
                    </p>
                    <h3 className="font-serif">{mod.name}</h3>
                    <p className="text-xs text-muted-foreground">{mod.blurb}</p>
                    {!open && (
                      <p className="pt-1 text-xs text-primary/80">
                        Unlocks when you achieve “{mod.gateLabel}”
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

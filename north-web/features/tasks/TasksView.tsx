"use client";

import { useAuth } from "@/features/auth/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";

interface Task {
  id: string;
  title: string;
  done: boolean;
  createdAt: string;
}

/**
 * Personal task management — a simple, universal to-do list stored locally per
 * user. Unlike the roadmap's milestone tasks (which come from the backend and
 * only exist for ventures), this works for everyone: a place to capture and
 * close out whatever you're focusing on.
 */
export function TasksView() {
  const { user } = useAuth();
  const storageKey = `north.tasks.${user?.email ?? "anon"}`;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only localStorage hydration; reading during render would break SSR
      if (raw) setTasks(JSON.parse(raw));
    } catch {
      // ignore
    }
    setReady(true);
  }, [storageKey]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(tasks));
    } catch {
      // ignore
    }
  }, [tasks, ready, storageKey]);

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const t = title.trim();
    if (!t) return;
    setTasks((cur) => [
      { id: crypto.randomUUID(), title: t, done: false, createdAt: new Date().toISOString() },
      ...cur,
    ]);
    setTitle("");
  };

  const toggle = (id: string) =>
    setTasks((cur) => cur.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  const remove = (id: string) => setTasks((cur) => cur.filter((task) => task.id !== id));

  const { open, done } = useMemo(
    () => ({ open: tasks.filter((t) => !t.done), done: tasks.filter((t) => t.done) }),
    [tasks],
  );

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-serif text-3xl tracking-tight">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Capture what matters, close it out. {open.length} open · {done.length} done.
        </p>
      </header>

      <form
        onSubmit={add}
        className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 transition-colors focus-within:border-primary/60"
      >
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task…"
          className="flex-1 bg-transparent py-1.5 text-sm outline-none placeholder:text-muted-foreground"
        />
        <Button type="submit" size="sm" disabled={!title.trim()} className="rounded-full">
          Add
        </Button>
      </form>

      <div className="flex flex-col gap-2">
        {tasks.length === 0 && (
          <p className="rounded-xl border border-border bg-card/50 py-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Add your first task above.
          </p>
        )}
        {[...open, ...done].map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <button
              onClick={() => toggle(task.id)}
              aria-label={task.done ? "Mark not done" : "Mark done"}
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs transition-colors ${
                task.done
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border hover:border-primary/60"
              }`}
            >
              {task.done ? "✓" : ""}
            </button>
            <span className={`flex-1 text-sm ${task.done ? "text-muted-foreground line-through" : ""}`}>
              {task.title}
            </span>
            <button
              onClick={() => remove(task.id)}
              className="text-xs text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

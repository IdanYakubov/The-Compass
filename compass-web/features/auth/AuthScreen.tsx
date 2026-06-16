"use client";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "./AuthContext";

/**
 * Login / signup gate. Placeholder auth — any email + password is accepted and
 * the founder is handed straight to onboarding. Pure UI shell over useAuth().
 */
export function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!clean) return;
    if (mode === "signup") signup(clean);
    else login(clean);
  };

  return (
    <div className="flex w-full items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Logo className="h-12 w-12" />
          <h1 className="font-serif text-3xl tracking-tight">The Compass</h1>
          <p className="text-sm text-muted-foreground">
            Your north star for focus. {mode === "signup" ? "Create your account" : "Welcome back"}.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6"
        >
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-primary/60"
            />
          </label>

          <Button type="submit" size="lg" className="mt-2" disabled={!email.trim()}>
            {mode === "signup" ? "Create account & start" : "Sign in"}
          </Button>

          <p className="pt-1 text-center text-xs text-muted-foreground">
            {mode === "signup" ? "Already have an account?" : "New here?"}{" "}
            <button
              type="button"
              onClick={() => setMode((m) => (m === "signup" ? "login" : "signup"))}
              className="text-primary underline-offset-4 hover:underline"
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>

        <p className="mt-4 text-center text-[11px] text-muted-foreground/70">
          Free or paid — everyone starts with a 4-question intro chat.
        </p>
      </div>
    </div>
  );
}

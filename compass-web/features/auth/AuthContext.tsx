"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type OnboardingAnswers } from "./onboarding";

/**
 * Client-side auth placeholder. No backend user model exists yet, so the
 * session (account + onboarding answers) lives in localStorage. The surface
 * (login / signup / completeOnboarding / logout) is intentionally shaped so a
 * real auth provider can drop in later without touching consumers.
 *
 * SECURITY: feature-gate access is NOT decided here. Gated modules open only
 * when the backend reports the milestone achieved (GET /ventures/{id}/unlocks),
 * so editing localStorage cannot unlock anything. The onboarding answers we do
 * persist only drive personalization and the displayed stage label — tampering
 * with them changes cosmetics, never access. (Issue #5: the previous design
 * trusted a stored `unlockedGateKeys` list, which was trivially bypassable.)
 */

interface AuthUser {
  email: string;
}

interface PersistedState {
  user: AuthUser | null;
  onboardingCompleted: boolean;
  onboarding: OnboardingAnswers | null;
}

interface AuthContextValue extends PersistedState {
  /** False until localStorage has been read — gate UI should wait on this. */
  ready: boolean;
  login: (email: string) => void;
  signup: (email: string) => void;
  completeOnboarding: (answers: OnboardingAnswers) => void;
  logout: () => void;
}

const STORAGE_KEY = "compass.auth.v1";

const EMPTY: PersistedState = {
  user: null,
  onboardingCompleted: false,
  onboarding: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(EMPTY);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage once, on the client only — keeps SSR markup stable.
  // The setState here is intentional and must run in an effect (not a lazy
  // useState initializer): reading localStorage during render would diverge from
  // the server-rendered EMPTY state and cause a hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only hydration, see above
      if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      // corrupt/blocked storage — start fresh
    }
    setReady(true);
  }, []);

  // Persist every change after hydration.
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage unavailable — session stays in-memory for this tab
    }
  }, [state, ready]);

  const value: AuthContextValue = {
    ...state,
    ready,
    // Both login and signup are placeholders: any email is accepted. A returning
    // user keeps whatever onboarding state was persisted; a brand-new one starts
    // at the onboarding gate (onboardingCompleted stays false).
    login: (email) => setState((s) => ({ ...s, user: { email } })),
    signup: (email) => setState({ ...EMPTY, user: { email } }),
    completeOnboarding: (answers) => {
      setState((s) => ({
        ...s,
        onboardingCompleted: true,
        onboarding: answers,
      }));
    },
    logout: () => setState(EMPTY),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

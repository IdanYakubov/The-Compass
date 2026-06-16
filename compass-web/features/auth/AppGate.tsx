"use client";

import { SideNav } from "@/components/SideNav";
import { useAuth } from "./AuthContext";
import { AuthScreen } from "./AuthScreen";
import { OnboardingChat } from "./OnboardingChat";

/**
 * The access gate that wraps the whole app. Three states, in order:
 *   1. not signed in        → AuthScreen
 *   2. signed in, no intro   → OnboardingChat (dashboard + Horizon stay locked)
 *   3. onboarded             → the normal cockpit shell (SideNav + page content)
 */
export function AppGate({ children }: { children: React.ReactNode }) {
  const { ready, user, onboardingCompleted } = useAuth();

  if (!ready) {
    return (
      <div className="flex w-full items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) return <AuthScreen />;
  if (!onboardingCompleted) return <OnboardingChat />;

  return (
    <>
      <SideNav />
      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </>
  );
}

"use client";

import { Logo } from "@/components/Logo";
import { useAuth } from "@/features/auth/AuthContext";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Daily Alignment", icon: "◎" },
  { href: "/horizon", label: "The Horizon", icon: "◬" },
  { href: "/tasks", label: "Tasks", icon: "✓" },
  { href: "/journal", label: "Journal", icon: "✎" },
] as const;

/** Fixed left rail: brand on top, vertical navigation below. */
export function SideNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card/40">
      {/* brand — top left */}
      <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
        <Logo className="h-6 w-6" />
        <span className="font-serif text-lg tracking-tight text-foreground">The Compass</span>
      </Link>

      <nav className="flex flex-col gap-1 px-3 pt-2">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 px-5 pb-5">
        {user && (
          <button
            onClick={logout}
            className="self-start text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign out · {user.email}
          </button>
        )}
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
          Your focus cockpit · v0.1
        </p>
      </div>
    </aside>
  );
}

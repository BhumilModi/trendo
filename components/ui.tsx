import Link from "next/link";
import type { ReactNode } from "react";

// Drawn marks, one 2px stroke family. State is a mark, not a colour.
export function Tick({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3.5 10.5l4 4L16.5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
    </svg>
  );
}

export function Flag({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" aria-hidden>
      <path d="M5 2h11l-3.5 4.5L16 11H5z" fill="var(--red)" />
      <path d="M5 2v16" stroke="var(--ink)" strokeWidth="2" />
    </svg>
  );
}

export function Cross({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
    </svg>
  );
}

export function Arrow({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M6 14L14 6M7 5.5h7.5V13" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
    </svg>
  );
}

export function Next({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 10h13M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" />
    </svg>
  );
}

export function Alert({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 2.5L18 17H2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 8v4M10 14v1.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

const DATE_FMT = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-10-15" -> "Thu 15 Oct", for use inside sentences. */
export function proseDate(day: string) {
  return DATE_FMT.format(new Date(`${day}T00:00:00Z`)).replace(",", "");
}

/** "2026-10-15" -> "THU 15 OCT", for slug lines. */
export function wireDate(day: string) {
  return proseDate(day).toUpperCase();
}

export function Mast({ right }: { right?: ReactNode }) {
  return (
    <header className="mast">
      <Link href="/" className="brand" aria-label="Trendo, today">
        TRENDO
        <span className="brand-caret" />
      </Link>
      {right}
    </header>
  );
}

const TABS = [
  { href: "/", label: "Wire" },
  { href: "/archive", label: "Back issues" },
  { href: "/leaderboard", label: "Board" },
  { href: "/me", label: "Me" },
] as const;

export function Nav({ active }: { active: (typeof TABS)[number]["href"] }) {
  return (
    <nav className="nav" aria-label="Main">
      <div className="nav-inner">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} aria-current={t.href === active ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export type LeafDay = { day: string; kind: string | null };

export function Leaves({ days, today, fresh }: { days: LeafDay[]; today: string; fresh?: boolean }) {
  return (
    <>
      <div className="leaves" role="img" aria-label="Your last 14 days">
        {days.map((d) => (
          <span
            key={d.day}
            className="leaf"
            data-kind={d.kind ?? undefined}
            data-today={d.day === today || undefined}
            data-fresh={(fresh && d.day === today) || undefined}
            title={d.day}
          />
        ))}
      </div>
      <div className="legend slug">
        <span>
          <i data-kind="on_time" />
          On time
        </span>
        <span>
          <i data-kind="repaired" />
          Patched
        </span>
        <span>
          <i data-kind="late" />
          Read late
        </span>
        <span>
          <i />
          Missed
        </span>
      </div>
    </>
  );
}

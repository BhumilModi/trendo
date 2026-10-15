// Drawn illustrations in the wire style: 2px ink line, paper fills, one red accent.
// Colors come from CSS variables, so every drawing follows light and dark mode.
import type { ReactNode } from "react";

const ink = "var(--ink)";
const paper = "var(--paper)";
const paper2 = "var(--paper-2)";
const red = "var(--red)";
const line = { stroke: ink, strokeWidth: 2, fill: "none", strokeLinecap: "square" as const, strokeLinejoin: "round" as const };

/** Topic glyphs, drawn on a 24px grid with one stroke weight. */
const TOPIC_PATHS: Record<string, ReactNode> = {
  AI: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1" {...line} />
      <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" {...line} />
      <path d="M12 8.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" fill={red} />
    </>
  ),
  Devices: (
    <>
      <rect x="7" y="2.5" width="10" height="19" rx="1.5" {...line} />
      <path d="M10.5 18.5h3" {...line} />
      <rect x="9" y="5.5" width="6" height="9" fill={red} opacity="0.85" />
    </>
  ),
  "Dev & Open Source": (
    <>
      <path d="M8 7l-5 5 5 5M16 7l5 5-5 5" {...line} />
      <path d="M13.5 4.5l-3 15" stroke={red} strokeWidth="2" strokeLinecap="square" />
    </>
  ),
  Security: (
    <>
      <path d="M12 2.5l7.5 3v6c0 4.6-3.2 8.3-7.5 10-4.3-1.7-7.5-5.4-7.5-10v-6z" {...line} />
      <rect x="9" y="11" width="6" height="5" fill={red} />
      <path d="M10 11V9.5a2 2 0 0 1 4 0V11" {...line} />
    </>
  ),
  "Business & Startups": (
    <>
      <path d="M3 21h18M6 21v-6M10.5 21v-9M15 21v-4M19.5 21V8" {...line} />
      <path d="M4 12l5-5 4 3 7-7" stroke={red} strokeWidth="2" fill="none" strokeLinecap="square" />
      <path d="M16 3h4v4" stroke={red} strokeWidth="2" fill="none" strokeLinecap="square" />
    </>
  ),
};

export function TopicIcon({ category, size = 16 }: { category: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden style={{ flex: "none" }}>
      {TOPIC_PATHS[category] ?? TOPIC_PATHS.AI}
    </svg>
  );
}

/** Stands in for a story photo: the topic glyph on a halftone plate. */
export function TopicArt({ category, small }: { category: string; small?: boolean }) {
  const id = `ht-${small ? "s" : "l"}`;
  return (
    <svg viewBox="0 0 160 90" preserveAspectRatio="xMidYMid slice" width="100%" height="100%" aria-hidden>
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse">
          <circle cx="3" cy="3" r="1.1" fill={ink} opacity="0.22" />
        </pattern>
      </defs>
      <rect width="160" height="90" fill={paper2} />
      <rect width="160" height="90" fill={`url(#${id})`} />
      <circle cx="80" cy="45" r="27" fill={paper} stroke={ink} strokeWidth="1.5" />
      <g transform="translate(62 27) scale(1.5)">{TOPIC_PATHS[category] ?? TOPIC_PATHS.AI}</g>
    </svg>
  );
}

/** Login hero: a teleprinter typing today's wire onto tractor-feed paper. */
export function Teleprinter() {
  return (
    <svg viewBox="0 0 320 178" width="100%" style={{ maxWidth: 360, display: "block" }} role="img" aria-label="A teleprinter printing tech news">
      {/* paper */}
      <path d="M92 8h136v86H92z" fill={paper} stroke={ink} strokeWidth="2" />
      <path d="M100 8v86M220 8v86" stroke={ink} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />
      {[16, 30, 44, 58, 72, 86].map((y) => (
        <g key={y} fill={ink} opacity="0.25">
          <circle cx="96" cy={y} r="2" />
          <circle cx="224" cy={y} r="2" />
        </g>
      ))}
      <text x="108" y="25" fontFamily="var(--mono)" fontSize="9" fontWeight="700" fill={ink} letterSpacing="1">
        TRENDO WIRE
      </text>
      <path d="M108 37h96M108 47h84M108 57h100M108 67h60" stroke={ink} strokeWidth="3" opacity="0.75" />
      <rect x="171" y="62" width="5" height="9" fill={red} />
      {/* platen roller */}
      <rect x="70" y="92" width="180" height="14" rx="7" fill={paper2} stroke={ink} strokeWidth="2" />
      <circle cx="62" cy="99" r="6" fill={paper} stroke={ink} strokeWidth="2" />
      <circle cx="258" cy="99" r="6" fill={paper} stroke={ink} strokeWidth="2" />
      {/* body */}
      <path d="M58 106h204l22 52H36z" fill={paper2} stroke={ink} strokeWidth="2" strokeLinejoin="round" />
      {/* keys */}
      {[0, 1, 2].map((row) =>
        Array.from({ length: 10 - row }, (_, i) => (
          <rect
            key={`${row}-${i}`}
            x={74 + row * 8 + i * 18}
            y={116 + row * 12}
            width="12"
            height="8"
            rx="1.5"
            fill={row === 0 && i === 3 ? red : paper}
            stroke={ink}
            strokeWidth="1.5"
          />
        )),
      )}
      <rect x="112" y="150" width="96" height="4" rx="2" fill={ink} opacity="0.8" />
      <path d="M28 158h264" stroke={ink} strokeWidth="2" />
    </svg>
  );
}

/** The editor's spike: one leaf for each day kept, newest on top. */
export function Spike({ count }: { count: number }) {
  const leaves = Math.max(1, Math.min(count, 7));
  return (
    <svg viewBox="0 0 120 120" width="112" height="112" role="img" aria-label={`${count} days kept on the spike`} style={{ flex: "none" }}>
      <ellipse cx="60" cy="108" rx="30" ry="7" fill={paper2} stroke={ink} strokeWidth="2" />
      <path d="M60 104V14" stroke={ink} strokeWidth="2.5" />
      <path d="M57 16l3-9 3 9z" fill={ink} />
      {Array.from({ length: leaves }, (_, i) => {
        const y = 96 - i * 9;
        const tilt = (i % 2 ? 1 : -1) * (4 + (i % 3) * 3);
        const top = i === leaves - 1;
        return (
          <g key={i} transform={`rotate(${tilt} 60 ${y})`}>
            <rect x="28" y={y - 5} width="64" height="10" fill={top ? paper : paper2} stroke={ink} strokeWidth="1.5" />
            {top && <path d={`M36 ${y}h20`} stroke={ink} strokeWidth="2" />}
            {top && <path d={`M72 ${y}l3 3 6-7`} stroke={red} strokeWidth="2" fill="none" />}
          </g>
        );
      })}
    </svg>
  );
}

/** Puzzle intro: story slips wired to company tags, one red match drawn in. */
export function MatchArt() {
  const left = [18, 46, 74];
  const right = [26, 54, 82];
  return (
    <svg viewBox="0 0 300 104" width="100%" style={{ maxWidth: 340, display: "block" }} role="img" aria-label="Stories matched to companies">
      {left.map((y) => (
        <g key={y}>
          <rect x="8" y={y - 10} width="112" height="20" fill={paper} stroke={ink} strokeWidth="1.5" />
          <path d={`M16 ${y}h${y === 46 ? 52 : 72}`} stroke={ink} strokeWidth="3" opacity="0.7" />
        </g>
      ))}
      {right.map((y, i) => (
        <rect key={y} x="196" y={y - 10} width="96" height="20" rx="2" fill={i === 0 ? paper2 : paper} stroke={ink} strokeWidth="1.5" />
      ))}
      <path d="M120 18C160 18 156 54 196 54" stroke={ink} strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
      <path d="M120 74C160 74 156 82 196 82" stroke={ink} strokeWidth="1.5" strokeDasharray="3 4" fill="none" />
      <path d="M120 46C160 46 156 26 196 26" stroke={red} strokeWidth="2.5" fill="none" />
      <circle cx="120" cy="46" r="3.5" fill={red} />
      <circle cx="196" cy="26" r="3.5" fill={red} />
    </svg>
  );
}

/** Empty leaderboard: a podium waiting for its first reader. */
export function Podium() {
  return (
    <svg viewBox="0 0 220 120" width="100%" style={{ maxWidth: 260, display: "block" }} role="img" aria-label="An empty podium">
      <path d="M20 112h180" stroke={ink} strokeWidth="2" />
      <rect x="32" y="70" width="52" height="42" fill={paper2} stroke={ink} strokeWidth="2" />
      <rect x="84" y="46" width="52" height="66" fill={paper} stroke={ink} strokeWidth="2" />
      <rect x="136" y="82" width="52" height="30" fill={paper2} stroke={ink} strokeWidth="2" />
      <text x="110" y="86" textAnchor="middle" fontFamily="var(--mono)" fontSize="16" fontWeight="800" fill={ink}>
        01
      </text>
      <text x="58" y="98" textAnchor="middle" fontFamily="var(--mono)" fontSize="12" fontWeight="700" fill={ink} opacity="0.6">
        02
      </text>
      <text x="162" y="103" textAnchor="middle" fontFamily="var(--mono)" fontSize="12" fontWeight="700" fill={ink} opacity="0.6">
        03
      </text>
      <path d="M104 40V12l18 7-18 7" stroke={ink} strokeWidth="2" fill="none" />
      <path d="M104 12l18 7-18 7z" fill={red} />
    </svg>
  );
}

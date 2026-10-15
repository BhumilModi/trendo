import type { Achievements } from "@/lib/game";
import { BADGES, TITLES, type BadgeId } from "@/lib/rules";
import { CATEGORIES } from "@/lib/types";
import { Leaves, proseDate } from "./ui";

/** A reader's achievements. `self` also shows locked badges as goals. */
export default function Showcase({ a, self }: { a: Achievements; self: boolean }) {
  const lvl = a.level;
  const earned = new Set(a.badges);
  const badgeIds = self ? (Object.keys(BADGES) as BadgeId[]) : a.badges;
  const max = Math.max(1, ...Object.values(a.categoryReads));

  return (
    <>
      <section className="block">
        <h1 className="h1">{a.username}</h1>
        {a.title && <span className="title-tag title-tag-lg">{TITLES[a.title].name}</span>}
        {self && (
          <a href="#title" className="slug" style={{ display: "inline-block", marginLeft: a.title ? 10 : 0, marginTop: 8, padding: "6px 0" }}>
            {a.title ? "Change title" : `Wear a title (${a.titles.length} unlocked)`}
          </a>
        )}
        <div className="dateline slug">
          <span>
            Level <b>{lvl.name}</b>
          </span>
          <span>
            Joined <b>{proseDate(a.joined).toUpperCase()}</b>
          </span>
        </div>
        <div className="bar" style={{ marginTop: 14 }} role="img" aria-label={`Level progress ${Math.round(lvl.progress * 100)}%`}>
          <span style={{ transform: `scaleX(${lvl.progress})` }} />
        </div>
        <p className="slug" style={{ marginTop: 6 }}>
          {lvl.next ? `${a.earned} of ${lvl.next.min} pts to ${lvl.next.name}` : `${a.earned} pts · top level`}
        </p>
      </section>

      <section className="block">
        <div className="block-head">
          <span className="slug slug-ink">Record</span>
        </div>
        {[
          ["Active streak", `${a.streak} ${a.streak === 1 ? "day" : "days"}`],
          ["Best streak", `${a.bestStreak} ${a.bestStreak === 1 ? "day" : "days"}`],
          ["Points earned", `${a.earned}`],
          ["Days caught up", `${a.daysCounted}`],
        ].map(([label, value]) => (
          <div key={label} className="row">
            <span style={{ fontWeight: 600 }}>{label}</span>
            <span className="num">{value}</span>
          </div>
        ))}
        <p className="slug" style={{ marginTop: 14 }}>
          Last 14 days
        </p>
        <Leaves days={a.leaves} today={a.leaves.at(-1)!.day} />
      </section>

      <section className="block">
        <div className="block-head">
          <span className="slug slug-ink">Badges</span>
          <span className="slug">
            {earned.size} of {Object.keys(BADGES).length}
          </span>
        </div>
        {badgeIds.length === 0 ? (
          <p className="lede">No badges yet.</p>
        ) : (
          <div className="stamps">
            {badgeIds.map((id) => (
              <div key={id} className="stamp" data-earned={earned.has(id) || undefined}>
                <b>{BADGES[id].name}</b>
                <small>{BADGES[id].hint}</small>
              </div>
            ))}
          </div>
        )}
      </section>

      {!self && (
        <section className="block">
          <div className="block-head">
            <span className="slug slug-ink">Titles unlocked</span>
            <span className="slug">
              {a.titles.length} of {Object.keys(TITLES).length}
            </span>
          </div>
          {a.titles.length === 0 ? (
            <p className="lede">No titles yet.</p>
          ) : (
            <div className="chips">
              {a.titles.map((t) => (
                <span key={t} className="title-tag" title={TITLES[t].hint}>
                  {TITLES[t].name}
                </span>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="block">
        <div className="block-head">
          <span className="slug slug-ink">What {self ? "you" : "they"} read</span>
          <span className="slug">Stories</span>
        </div>
        {CATEGORIES.map((c) => {
          const n = a.categoryReads[c] ?? 0;
          return (
            <div key={c} className="row" style={{ display: "grid", gridTemplateColumns: "1fr 2fr 28px", gap: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{c}</span>
              <div className="bar" aria-hidden>
                <span style={{ transform: `scaleX(${n / max})` }} />
              </div>
              <span className="num" style={{ textAlign: "right" }}>
                {n}
              </span>
            </div>
          );
        })}
      </section>
    </>
  );
}

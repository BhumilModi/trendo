import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { leaderboard } from "@/lib/game";
import { TITLES, isTitleId, istDay, weekStart } from "@/lib/rules";
import { Mast, Nav, proseDate } from "@/components/ui";
import { Podium } from "@/components/art";

export default async function Board({ searchParams }: PageProps<"/leaderboard">) {
  const user = await requireUser();
  const scope = (await searchParams).scope === "all" ? "all" : "week";
  const rows = await leaderboard(scope);
  const myRank = rows.findIndex((r) => Number(r.id) === user.id);

  return (
    <>
      <main className="sheet">
        <Mast right={<span className="slug slug-ink">Board</span>} />
        <section className="block">
          <h1 className="h1">{scope === "week" ? "This week's readers." : "All-time readers."}</h1>
          <p className="lede">
            {scope === "week"
              ? `Points earned since ${proseDate(weekStart(istDay()))}. Resets every Monday, so anyone can win a week.`
              : "Every point earned since the start. Spending points does not lower your place."}{" "}
            Tap a name to see their profile.
          </p>
        </section>
        <nav className="tabs" aria-label="Board range">
          <Link href="/leaderboard" aria-current={scope === "week" ? "page" : undefined}>
            This week
          </Link>
          <Link href="/leaderboard?scope=all" aria-current={scope === "all" ? "page" : undefined}>
            All time
          </Link>
        </nav>

        <section className="block">
          <div className="block-head">
            <span className="slug slug-ink">Rank · reader</span>
            <span className="slug slug-ink">Points</span>
          </div>
          {rows.length === 0 && (
            <div style={{ paddingTop: 18 }}>
              <Podium />
            </div>
          )}
          {rows.length === 0 && (
            <p className="lede" style={{ paddingTop: 12 }}>
              No points yet {scope === "week" ? "this week" : ""}. Read today&apos;s stories to be first on the board.
            </p>
          )}
          {rows.map((r, i) => (
            <Link
              key={r.id}
              href={`/u/${encodeURIComponent(r.username)}`}
              className={`row row-link ${Number(r.id) === user.id ? "rank-me" : ""}`}
            >
              <span style={{ display: "flex", gap: 14, alignItems: "baseline", minWidth: 0 }}>
                <span className="num" style={{ minWidth: 26 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span style={{ minWidth: 0 }}>
                  <span style={{ fontWeight: 700, marginRight: 8, overflowWrap: "anywhere" }}>{r.username}</span>
                  {isTitleId(r.title) && <span className="title-tag">{TITLES[r.title].name}</span>}
                </span>
              </span>
              <span className="num">{Number(r.points)}</span>
            </Link>
          ))}
          {myRank === -1 && rows.length > 0 && (
            <p className="slug" style={{ paddingTop: 12 }}>
              You are not on this board yet.
            </p>
          )}
        </section>
      </main>
      <Nav active="/leaderboard" />
    </>
  );
}

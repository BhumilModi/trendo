import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { dayState, puzzleState, recentDays, stats } from "@/lib/game";
import { istDay, multiplier } from "@/lib/rules";
import { Flag, Leaves, Mast, Nav, Next, Tick, wireDate } from "@/components/ui";
import { Spike, TopicIcon } from "@/components/art";
import { StoryThumb } from "@/components/StoryPhoto";

export default async function Today() {
  const user = await requireUser();
  const today = istDay();
  const [s, day, leaves, puzzle] = await Promise.all([stats(user.id), dayState(user.id, today), recentDays(user.id), puzzleState(user.id)]);
  const readCount = day.done.size;
  const total = day.stories.length;

  return (
    <>
      <main className="sheet">
        <Mast right={<span className="slug slug-ink">{wireDate(today)}</span>} />
        <div className="dateline slug">
          <span>
            Streak{" "}
            <b>
              {s.streak} {s.streak === 1 ? "day" : "days"}
            </b>
          </span>
          <span>
            Bonus <b>×{multiplier(s.streak).toFixed(1)}</b>
          </span>
          <span>
            <b>{s.balance}</b> pts
          </span>
          <span>
            <b>{s.level.name}</b>
          </span>
        </div>
        <Leaves days={leaves} today={today} />

        <div className="dock">
          <div className="dock-inner">
            {!s.todayDone ? (
              <Link href={`/read/${today}`} className="btn">
                <span>{readCount ? `Continue reading` : "Start reading"}</span>
                <span className="meta">
                  {readCount}/{total}
                </span>
              </Link>
            ) : !puzzle.attempt?.submitted_at ? (
              <Link href="/puzzle" className="btn">
                <span>Bonus puzzle</span>
                <span className="meta">Up to 50 pts</span>
              </Link>
            ) : (
              <Link href="/archive" className="btn btn-quiet">
                <span>Missed a day? Back issues</span>
                <Next />
              </Link>
            )}
          </div>
        </div>

        <section className="block">
          <div className={s.todayDone ? "caught" : undefined}>
            <div>
              <h1 className="h1">
                {s.todayDone
                  ? "You're caught up for today."
                  : readCount
                    ? `${total - readCount} stories left today.`
                    : `Today's ${total} stories.`}
              </h1>
              <p className="lede">
                {s.todayDone
                  ? "New stories arrive at midnight (India time). Come back tomorrow to keep your streak."
                  : "Read each one for 15 seconds. Finish all of them to keep your streak."}
              </p>
            </div>
            {s.todayDone && <Spike count={s.streak} />}
          </div>
        </section>

        <ol className="items">
          {day.stories.map((story) => {
            const state = day.done.has(story.id) ? "read" : story.id === day.next?.id ? "current" : "next";
            return (
              <li key={story.id} className="item" data-state={state}>
                <span style={{ display: "grid", gap: 6, justifyItems: "start" }}>
                  <span className="item-no">{String(story.position).padStart(2, "0")}</span>
                  {state === "read" ? (
                    <span aria-label="Read">
                      <Tick />
                    </span>
                  ) : state === "current" ? (
                    <span aria-label="Up next">
                      <Flag />
                    </span>
                  ) : null}
                </span>
                <div>
                  <p className="item-head">{story.headline}</p>
                  <p className="slug topic" style={{ marginTop: 6 }}>
                    <TopicIcon category={story.category} size={14} />
                    {story.category}
                  </p>
                </div>
                <StoryThumb src={story.image_url} category={story.category} />
              </li>
            );
          })}
        </ol>
      </main>
      <Nav active="/" />
    </>
  );
}

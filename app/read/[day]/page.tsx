import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { dayState, readableDay, recentDays, stats } from "@/lib/game";
import { istDay } from "@/lib/rules";
import { Arrow, Leaves, Mast, Next, Tick, wireDate } from "@/components/ui";
import CardReader from "@/components/CardReader";
import { StoryPhoto } from "@/components/StoryPhoto";
import { TopicIcon } from "@/components/art";

export default async function ReadPage({ params }: PageProps<"/read/[day]">) {
  const { day } = await params;
  if (!readableDay(day)) notFound();
  const user = await requireUser();
  const [state, s] = await Promise.all([dayState(user.id, day), stats(user.id)]);
  const onTime = day === istDay();
  const total = state.stories.length;

  if (!state.next) {
    const leaves = onTime ? await recentDays(user.id) : null;
    return (
      <main className="sheet no-nav">
        <Mast right={<span className="slug slug-ink">{wireDate(day)}</span>} />
        <section className="end">
          <div className="torn" aria-hidden>
            <span className="slug slug-ink">{wireDate(day)}</span>
            <span className="slug">
              {total}/{total}
            </span>
          </div>
          <h1 className="h1">{onTime ? "End of wire. You're caught up." : "End of wire. Day read."}</h1>
          <p className="lede">
            {onTime
              ? `Your streak is ${s.streak} ${s.streak === 1 ? "day" : "days"}. You have ${s.balance} points.`
              : "Late reads earn half points. To count this day for your streak, patch it in Back issues."}
          </p>
          {leaves && <Leaves days={leaves} today={day} fresh />}
          <ul className="items" style={{ marginTop: 20 }}>
            {state.stories.map((st) => (
              <li key={st.id} className="item" data-state="read">
                <span className="item-no">{String(st.position).padStart(2, "0")}</span>
                <p className="item-head">{st.headline}</p>
                <Tick />
              </li>
            ))}
          </ul>
        </section>
        <div className="dock no-nav">
          <div className="dock-inner" style={{ display: "grid", gap: 8 }}>
            {onTime ? (
              <Link href="/puzzle" className="btn">
                <span>Play the bonus puzzle</span>
                <span className="meta">60 sec</span>
              </Link>
            ) : (
              <Link href="/archive" className="btn">
                <span>Back issues</span>
                <Next />
              </Link>
            )}
            <Link href="/" className="btn btn-quiet btn-small" style={{ width: "100%" }}>
              <span>Back to today</span>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const story = state.next;
  return (
    <main className="sheet no-nav">
      <Mast
        right={
          <Link href="/" className="slug slug-ink" style={{ textDecoration: "none", padding: "8px 0" }}>
            Close
          </Link>
        }
      />
      <div className="dateline slug">
        <span>
          Item <b>{String(story.position).padStart(2, "0")}</b> of {String(total).padStart(2, "0")}
        </span>
        <span className="topic">
          <TopicIcon category={story.category} size={14} />
          {story.category}
        </span>
        <span>{wireDate(day)}</span>
        {!onTime && <b>Late · half points</b>}
      </div>
      <div className="ticks" aria-hidden>
        {state.stories.map((st) => (
          <span key={st.id} data-on={state.done.has(st.id) || undefined} data-current={st.id === story.id || undefined} />
        ))}
      </div>

      <article className="story print" key={story.id}>
        <StoryPhoto src={story.image_url} category={story.category} alt="" priority />
        <h1 className="h1">{story.headline}</h1>
        <p>{story.what}</p>
        <p className="why">
          <b>Why it matters:</b> {story.why}
        </p>
        <a className="source" href={story.source_url} target="_blank" rel="noopener noreferrer">
          Full story · {story.source_name}
          <Arrow />
        </a>
      </article>

      <CardReader storyId={story.id} last={story.position === total} />
    </main>
  );
}

import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getStories, puzzleState, stats } from "@/lib/game";
import { puzzlePoints } from "@/lib/rules";
import { Mast, Next, wireDate } from "@/components/ui";
import Puzzle from "@/components/Puzzle";

export default async function PuzzlePage() {
  const user = await requireUser();
  const [{ day, attempt }, s] = await Promise.all([puzzleState(user.id), stats(user.id)]);

  if (!s.todayDone) {
    return (
      <main className="sheet no-nav">
        <Mast right={<span className="slug slug-ink">Bonus</span>} />
        <section className="block">
          <h1 className="h1">Read today&apos;s stories first.</h1>
          <p className="lede">The puzzle uses today&apos;s five stories. It opens when you finish them.</p>
        </section>
        <div className="dock no-nav">
          <div className="dock-inner">
            <Link href="/" className="btn">
              <span>Go to today</span>
              <Next />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (attempt?.submitted_at) {
    const stories = await getStories(day);
    const correct = Number(attempt.correct);
    const points = puzzlePoints(correct, Number(attempt.submitted_at) - Number(attempt.started_at));
    return (
      <main className="sheet no-nav">
        <Mast right={<span className="slug slug-ink">{wireDate(day)}</span>} />
        <section className="end">
          <h1 className="h1">
            Puzzle done: {correct} of 5 matched, +{points} pts
          </h1>
          <p className="lede">One puzzle a day. A new one opens with tomorrow&apos;s stories.</p>
          <ul className="items" style={{ marginTop: 20 }}>
            {stories.map((st) => (
              <li key={st.id} className="item" style={{ gridTemplateColumns: "1fr" }}>
                <div>
                  <p className="item-head">{st.headline}</p>
                  <span className="tag">{st.company}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
        <div className="dock no-nav">
          <div className="dock-inner">
            <Link href="/" className="btn">
              <span>Back to today</span>
              <Next />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="sheet no-nav">
      <Mast right={<span className="slug slug-ink">Bonus</span>} />
      <Puzzle resume={Boolean(attempt)} />
    </main>
  );
}

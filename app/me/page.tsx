import Link from "next/link";
import { logOutAction } from "@/app/actions";
import { requireUser } from "@/lib/auth";
import { achievements } from "@/lib/game";
import { CARD_POINTS, LATE_CARD_POINTS, REPAIR_COST, multiplier } from "@/lib/rules";
import { Mast, Nav, Next } from "@/components/ui";
import Showcase from "@/components/Showcase";
import TitlePicker from "@/components/TitlePicker";

export default async function Me() {
  const user = await requireUser();
  const a = await achievements(user.id);

  return (
    <>
      <main className="sheet">
        <Mast right={<span className="slug slug-ink">Me</span>} />
        <Showcase a={a} self />
        <TitlePicker unlocked={a.titles} current={a.title} />

        <div className="block">
          <Link href={`/u/${encodeURIComponent(user.username)}`} className="btn btn-quiet">
            <span>See your profile as others see it</span>
            <Next />
          </Link>
        </div>

        <section className="block">
          <div className="block-head">
            <span className="slug slug-ink">How points work</span>
          </div>
          <ul className="lede" style={{ paddingLeft: 18, listStyle: "disc", display: "grid", gap: 6 }}>
            <li>
              {CARD_POINTS} points for each story you read on the day, times your streak bonus (now ×{multiplier(a.streak).toFixed(1)}, up to ×2).
            </li>
            <li>{LATE_CARD_POINTS} points for each story you read late, from Back issues.</li>
            <li>Bonus puzzle: 6 points per right match, plus up to 20 for speed.</li>
            <li>Missed a day? Pass a 2-question quiz or spend {REPAIR_COST} points to keep your streak.</li>
            <li>A story counts after 15 seconds of reading. The server keeps the time, so the rules are the same for everyone.</li>
          </ul>
        </section>

        <form action={logOutAction} className="block">
          <button className="btn btn-quiet">
            <span>Log out</span>
          </button>
        </form>
      </main>
      <Nav active="/me" />
    </>
  );
}

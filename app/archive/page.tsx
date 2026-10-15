import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { archive, stats } from "@/lib/game";
import { REPAIR_COST } from "@/lib/rules";
import { Mast, Nav, Tick, wireDate } from "@/components/ui";
import BuyRepair from "@/components/BuyRepair";

const STATUS: Record<string, string> = {
  on_time: "Read on time",
  late: "Read late",
  repaired_quiz: "Patched by quiz",
  repaired_points: "Patched with points",
};

export default async function ArchivePage() {
  const user = await requireUser();
  const [days, s] = await Promise.all([archive(user.id), stats(user.id)]);
  const [today, ...past] = days;

  return (
    <>
      <main className="sheet">
        <Mast right={<span className="slug slug-ink">Back issues</span>} />
        <section className="block">
          <h1 className="h1">The last 7 days.</h1>
          <p className="lede">
            Missed a day? Read it here for half points. To make it count for your streak, pass a 2‑question quiz on it, or spend {REPAIR_COST}{" "}
            points.
          </p>
          <p className="slug" style={{ marginTop: 10 }}>
            You have <b className="slug-ink">{s.balance} pts</b>
          </p>
        </section>

        <section className="block">
          <div className="block-head">
            <span className="slug slug-ink">Today · {wireDate(today.day)}</span>
            <span className="slug">{today.kind ? STATUS[today.kind] : `${today.read} of 5 read`}</span>
          </div>
          {[...past].map((d) => {
            const counted = d.kind && d.kind !== "late";
            return (
              <div key={d.day} className="row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: 10 }}>
                  <span className="num">{wireDate(d.day)}</span>
                  <span className="slug" style={{ display: "inline-flex", gap: 6, alignItems: "center", color: counted ? "var(--ink)" : undefined }}>
                    {counted && <Tick size={14} />}
                    {d.kind ? STATUS[d.kind] : d.beforeJoin ? "Before you joined" : d.read ? `Missed · ${d.read} of 5 read` : "Missed"}
                  </span>
                </div>
                {!counted && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {d.kind !== "late" && (
                      <Link href={`/read/${d.day}`} className="btn btn-quiet btn-small">
                        {d.read ? "Continue · half points" : "Read · half points"}
                      </Link>
                    )}
                    {d.quizAvailable && (
                      <Link href={`/repair/${d.day}`} className="btn btn-small">
                        Patch with quiz
                      </Link>
                    )}
                    {d.quizFailed && <span className="slug" style={{ alignSelf: "center" }}>Quiz used</span>}
                    {d.canBuy && <BuyRepair day={d.day} cost={REPAIR_COST} disabled={s.balance < REPAIR_COST} />}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>
      <Nav active="/archive" />
    </>
  );
}

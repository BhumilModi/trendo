import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { achievements, userIdByName } from "@/lib/game";
import { Mast, Nav, Next } from "@/components/ui";
import Showcase from "@/components/Showcase";

export default async function ProfilePage({ params }: PageProps<"/u/[username]">) {
  const { username } = await params;
  const me = await requireUser();
  const id = await userIdByName(decodeURIComponent(username));
  if (!id) notFound();
  const a = await achievements(id);
  const self = id === me.id;

  return (
    <>
      <main className="sheet">
        <Mast right={<span className="slug slug-ink">Reader</span>} />
        <Showcase a={a} self={false} />
        {self && (
          <div className="block">
            <Link href="/me" className="btn btn-quiet">
              <span>This is you. Change your title</span>
              <Next />
            </Link>
          </div>
        )}
      </main>
      <Nav active={self ? "/me" : "/leaderboard"} />
    </>
  );
}

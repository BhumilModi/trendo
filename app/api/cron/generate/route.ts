import { one } from "@/lib/db";
import { saveDay } from "@/lib/game";
import { generateStories } from "@/lib/generate";
import { addDays, istDay } from "@/lib/rules";

export const maxDuration = 300;

// Vercel Cron calls this at 23:00 IST with `Authorization: Bearer $CRON_SECRET`,
// so tomorrow's stories exist before midnight. `?day=YYYY-MM-DD` regenerates a specific day.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const day = new URL(req.url).searchParams.get("day") ?? addDays(istDay(), 1);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return new Response("Bad day", { status: 400 });
  if (await one("SELECT 1 FROM days WHERE day = ?", [day])) return Response.json({ day, status: "exists" });

  const stories = await generateStories();
  await saveDay(day, stories, "gemini");
  return Response.json({ day, status: "generated", headlines: stories.map((s) => s.headline) });
}

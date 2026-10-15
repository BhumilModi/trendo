import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { canRepair, istDay } from "@/lib/rules";
import { Mast, wireDate } from "@/components/ui";
import RepairQuiz from "@/components/RepairQuiz";

export default async function RepairPage({ params }: PageProps<"/repair/[day]">) {
  const { day } = await params;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !canRepair(day, istDay())) notFound();
  await requireUser();
  return (
    <main className="sheet no-nav">
      <Mast right={<span className="slug slug-ink">Patch {wireDate(day)}</span>} />
      <RepairQuiz day={day} />
    </main>
  );
}

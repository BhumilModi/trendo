import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { Mast } from "@/components/ui";
import LoginForm from "@/components/LoginForm";
import { Teleprinter } from "@/components/art";

export default async function LoginPage() {
  if (await getUser()) redirect("/");
  return (
    <main className="sheet no-nav no-dock">
      <Mast right={<span className="slug">Tech news wire</span>} />
      <div className="hero-art print">
        <Teleprinter />
      </div>
      <section className="block print" style={{ marginTop: 12 }}>
        <h1 className="h1">Five tech stories a day. In plain English.</h1>
        <p className="lede">
          Read each story for 15 seconds. Keep your streak, earn points, and climb the weekly board. About two minutes a day.
        </p>
      </section>
      <LoginForm />
    </main>
  );
}

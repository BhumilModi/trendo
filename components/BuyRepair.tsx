"use client";

import { useState, useTransition } from "react";
import { buyRepairAction } from "@/app/actions";

/** Two taps instead of a confirm dialog: the first arms, the second spends. */
export default function BuyRepair({ day, cost, disabled }: { day: string; cost: number; disabled: boolean }) {
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function tap() {
    if (!armed) return setArmed(true);
    startTransition(async () => {
      const r = await buyRepairAction(day);
      if ("error" in r && r.error) setError(r.error);
      setArmed(false);
    });
  }

  return (
    <>
      <button className={`btn btn-small ${armed ? "" : "btn-quiet"}`} onClick={tap} disabled={disabled || pending} onBlur={() => setArmed(false)}>
        {pending ? "Patching…" : armed ? `Tap again to spend ${cost}` : disabled ? `Need ${cost} pts` : `Patch for ${cost} pts`}
      </button>
      {error && (
        <span className="error" role="alert" style={{ margin: 0 }}>
          {error}
        </span>
      )}
    </>
  );
}

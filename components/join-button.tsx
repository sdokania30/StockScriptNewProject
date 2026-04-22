"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function JoinButton({
  competitionId,
  joined,
}: {
  competitionId: string;
  joined: boolean;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (joined) {
    return (
      <span className="inline-flex items-center rounded-full border border-profit/25 bg-profit/10 px-3 py-1 text-sm font-medium text-profit">
        Joined
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isSubmitting}
        onClick={async () => {
          setIsSubmitting(true);
          setError("");

          const response = await fetch(`/api/competitions/${competitionId}/participants`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: "" }),
          });
          const result = await response.json();

          if (!response.ok) {
            setError(result.error || "Unable to request join.");
            setIsSubmitting(false);
            return;
          }

          router.refresh();
        }}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Requesting..." : "Request to join"}
      </button>

      {error ? <p className="text-sm text-loss">{error}</p> : null}
    </div>
  );
}

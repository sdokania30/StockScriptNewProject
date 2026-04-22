"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";

type RequestItem = {
  id: string;
  userId: string;
  competitionId: string;
  status: string;
  createdAt: Date;
  user: { id: string; name: string; email: string };
  competition: { id: string; name: string };
};

export function CompetitionRequestList({ requests }: { requests: RequestItem[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);

  async function handleApprove(requestId: string, competitionId: string) {
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(requestId: string, competitionId: string) {
    setProcessing(requestId);
    try {
      const res = await fetch(`/api/competitions/${competitionId}/requests/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setProcessing(null);
    }
  }

  return (
    <section className="rounded-[32px] border border-amber-200 bg-amber-50 p-6 shadow-soft">
      <h2 className="font-display text-2xl font-semibold text-ink mb-4">Pending Requests</h2>
      <div className="space-y-3">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between rounded-[24px] border border-amber-100 bg-white px-4 py-3"
          >
            <div className="flex-1">
              <p className="font-medium text-ink">{request.user.name}</p>
              <p className="text-sm text-slate-500">{request.user.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Requesting: {request.competition.name}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleApprove(request.id, request.competitionId)}
                disabled={processing === request.id}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => handleReject(request.id, request.competitionId)}
                disabled={processing === request.id}
                className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

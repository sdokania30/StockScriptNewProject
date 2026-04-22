import Link from "next/link";
import { CompetitionForm } from "@/components/competition-form";
import { JoinButton } from "@/components/join-button";
import { AddParticipantForm } from "@/components/add-participant-form";
import { CompetitionRequestList } from "@/components/competition-request-list";
import { requireActiveUser } from "@/lib/auth";
import { formatDateValue } from "@/lib/format";
import { getCompetitions } from "@/lib/queries";
import { prisma } from "@/lib/prisma";


export default async function CompetitionsPage() {
  const user = await requireActiveUser();
  const competitions = await getCompetitions();
  const isAdmin = user.role === "ADMIN";

  const pendingRequests = isAdmin
    ? await prisma.competitionRequest.findMany({
        where: { status: "PENDING" },
        include: { competition: true, user: true },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const userRequests = !isAdmin
    ? await prisma.competitionRequest.findMany({
        where: { userId: user.id },
        include: { competition: true },
        orderBy: { createdAt: "desc" },
      })
    : [];

  if (isAdmin) {
    return (
      <div className="space-y-8">
        <section className="flex flex-col gap-5 rounded-[36px] border border-white/70 bg-white/80 p-7 shadow-soft backdrop-blur lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Competition Hub</p>
            <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
              Run percentage-based trading competitions
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
              Competitions only score closed trades inside the selected date window, enforce a
              minimum trade count, ignore tiny trades, and rank users by portfolio return percentage.
            </p>
          </div>
        </section>

        {pendingRequests.length > 0 && (
          <CompetitionRequestList requests={pendingRequests} />
        )}

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div>
            <CompetitionForm />
          </div>

          <div className="space-y-5">
            {competitions.map((competition) => {
              return (
                <article
                  key={competition.id}
                  className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="font-display text-2xl font-semibold text-ink">
                          {competition.name}
                        </h2>
                        <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                          {competition.visibility}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        {formatDateValue(competition.startDate)} to {formatDateValue(competition.endDate)}
                      </p>
                      <p className="mt-2 text-sm text-slate-500">
                        Created by {competition.creator.name} • {competition.participants.length} participants
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/leaderboard?competitionId=${competition.id}`}
                        className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accentDeep"
                      >
                        View leaderboard
                      </Link>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {competition.participants.map((participant) => (
                      <span
                        key={participant.id}
                        className="rounded-full border border-slate-200 bg-canvas px-3 py-1 text-sm text-slate-600"
                      >
                        {participant.user.name}
                      </span>
                    ))}
                  </div>

                  {/* Admin: add participant by email */}
                  <div className="mt-1 border-t border-slate-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Register Trader
                    </p>
                    <AddParticipantForm competitionId={competition.id} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-5 rounded-[36px] border border-white/70 bg-white/80 p-7 shadow-soft backdrop-blur">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Available Competitions</p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
            Browse competitions
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            Find and join trading competitions. Request approval from competition admins to participate.
          </p>
        </div>
      </section>

      {userRequests.length > 0 && (
        <section className="rounded-[32px] border border-blue-200 bg-blue-50 p-6 shadow-soft">
          <h2 className="font-display text-2xl font-semibold text-ink mb-4">Your Requests</h2>
          <div className="space-y-3">
            {userRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-[24px] border border-blue-100 bg-white px-4 py-3"
              >
                <div className="flex-1">
                  <p className="font-medium text-ink">{request.competition.name}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Status: <span className="font-medium capitalize">{request.status.toLowerCase()}</span>
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] ${
                  request.status === "APPROVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : request.status === "PENDING"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-red-100 text-red-700"
                }`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-5">
        {competitions.map((competition) => {
          const userRequest = userRequests.find((r) => r.competitionId === competition.id);
          const isParticipant = competition.participants.some((p) => p.userId === user.id);

          return (
            <article
              key={competition.id}
              className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-display text-2xl font-semibold text-ink">
                      {competition.name}
                    </h2>
                    <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      {competition.visibility}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">
                    {formatDateValue(competition.startDate)} to {formatDateValue(competition.endDate)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Created by {competition.creator.name} • {competition.participants.length} participants
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  {isParticipant && (
                    <Link
                      href={`/leaderboard?competitionId=${competition.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accentDeep"
                    >
                      View leaderboard
                    </Link>
                  )}
                  {!isParticipant && !userRequest && (
                    <JoinButton competitionId={competition.id} joined={false} />
                  )}
                  {userRequest && userRequest.status === "PENDING" && (
                    <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
                      Request Pending
                    </span>
                  )}
                  {userRequest && userRequest.status === "REJECTED" && (
                    <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700">
                      Request Rejected
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {competition.participants.map((participant) => (
                  <span
                    key={participant.id}
                    className="rounded-full border border-slate-200 bg-canvas px-3 py-1 text-sm text-slate-600"
                  >
                    {participant.user.name}
                  </span>
                ))}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

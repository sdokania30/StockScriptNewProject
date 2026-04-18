import Link from "next/link";
import { CompetitionForm } from "@/components/competition-form";
import { JoinButton } from "@/components/join-button";
import { requireActiveUser } from "@/lib/auth";
import { formatDateValue } from "@/lib/format";
import { getCompetitions } from "@/lib/queries";

export default async function CompetitionsPage() {
  const user = await requireActiveUser();
  const competitions = await getCompetitions();

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

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div>
          <CompetitionForm />
        </div>

        <div className="space-y-5">
          {competitions.map((competition) => {
            const joined = competition.participants.some(
              (participant) => participant.userId === user.id,
            );

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
                    <JoinButton
                      competitionId={competition.id}
                      joined={joined}
                    />
                    <Link
                      href={`/leaderboard?competitionId=${competition.id}`}
                      className="inline-flex items-center justify-center rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-accentDeep"
                    >
                      View leaderboard
                    </Link>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
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
        </div>
      </section>
    </div>
  );
}

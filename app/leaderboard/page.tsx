import Link from "next/link";
import { Medal, Shield, TrendingUp } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { formatDateValue, formatPercent } from "@/lib/format";
import { getCompetitions, getLeaderboard } from "@/lib/queries";

type LeaderboardPageProps = {
  searchParams: {
    competitionId?: string;
  };
};

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  await requireActiveUser();
  const competitions = await getCompetitions();
  const selectedCompetitionId = searchParams.competitionId ?? competitions[0]?.id;
  const leaderboard = selectedCompetitionId
    ? await getLeaderboard(selectedCompetitionId)
    : null;

  return (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,32,0.96),rgba(49,91,74,0.88))] p-7 text-white shadow-soft">
        <p className="text-sm uppercase tracking-[0.24em] text-white/65">Leaderboard</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Fair ranking by return percentage</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-white/75">
          Rankings are normalized using realized return percentage versus maximum capital deployed.
          Absolute currency values stay out of the leaderboard so traders with different account sizes
          can compete on equal footing.
        </p>
      </section>

      <section className="rounded-[32px] border border-white/70 bg-white/80 p-6 shadow-soft backdrop-blur">
        <form className="grid gap-4 md:grid-cols-[1fr_auto]">
          <label className="form-field">
            Competition
            <select
              name="competitionId"
              defaultValue={selectedCompetitionId}
              className="form-input"
            >
              {competitions.map((competition) => (
                <option key={competition.id} value={competition.id}>
                  {competition.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-white transition hover:bg-accentDeep md:self-end"
          >
            Load leaderboard
          </button>
        </form>
      </section>

      {leaderboard ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Window</p>
              <p className="mt-3 font-display text-2xl font-semibold text-ink">
                {formatDateValue(leaderboard.competition.startDate)} to{" "}
                {formatDateValue(leaderboard.competition.endDate)}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Qualified Traders</p>
              <p className="mt-3 font-display text-2xl font-semibold text-ink">
                {leaderboard.entries.length}
              </p>
            </div>
            <div className="rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-soft">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Rules</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Minimum 5 trades, tiny trades ignored, sorted by return %, drawdown, then win rate.
              </p>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {leaderboard.entries.slice(0, 3).map((entry, index) => {
              const icon = index === 0 ? Medal : index === 1 ? TrendingUp : Shield;
              const Icon = icon;

              return (
                <article
                  key={entry.userId}
                  className="rounded-[30px] border border-white/70 bg-white/80 p-5 shadow-soft"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-canvas px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Rank {entry.rank}
                    </span>
                    <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white">
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-5 font-display text-2xl font-semibold text-ink">
                    {entry.userName}
                  </p>
                  <p className="mt-3 text-4xl font-semibold text-profit">
                    {formatPercent(entry.returnPercentage)}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="rounded-2xl bg-canvas px-3 py-3">
                      Win rate
                      <p className="mt-2 text-lg font-semibold text-ink">
                        {formatPercent(entry.winRate)}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-canvas px-3 py-3">
                      Max DD
                      <p className="mt-2 text-lg font-semibold text-ink">
                        {formatPercent(entry.maxDrawdown)}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="overflow-hidden rounded-[32px] border border-white/70 bg-white/80 shadow-soft backdrop-blur">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-canvas text-sm uppercase tracking-[0.18em] text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Rank</th>
                    <th className="px-5 py-4">Trader</th>
                    <th className="px-5 py-4">Portfolio Return %</th>
                    <th className="px-5 py-4">Win Rate</th>
                    <th className="px-5 py-4">Total Trades</th>
                    <th className="px-5 py-4">Max Drawdown %</th>
                    <th className="px-5 py-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.entries.map((entry) => (
                    <tr key={entry.userId} className="border-b border-slate-100 last:border-transparent hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-5 font-semibold text-ink">{entry.rank}</td>
                      <td className="px-5 py-5 font-display text-lg font-semibold text-ink">
                        <Link
                          href={`/leaderboard/${selectedCompetitionId}/${entry.userId}`}
                          className="hover:text-accent transition-colors hover:underline"
                        >
                          {entry.userName}
                        </Link>
                      </td>
                      <td className="px-5 py-5 font-semibold text-profit">
                        {formatPercent(entry.returnPercentage)}
                      </td>
                      <td className="px-5 py-5 text-slate-600">{formatPercent(entry.winRate)}</td>
                      <td className="px-5 py-5 text-slate-600">{entry.totalTrades}</td>
                      <td className="px-5 py-5 text-slate-600">
                        {formatPercent(entry.maxDrawdown)}
                      </td>
                      <td className="px-5 py-5">
                        <Link
                          href={`/leaderboard/${selectedCompetitionId}/${entry.userId}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-[#c59e32] hover:text-[#8d6500]"
                        >
                          View trades →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="empty-panel">
          No competition selected yet. Create one from the{" "}
          <Link href="/competitions" className="font-semibold text-accent hover:text-accentDeep">
            competitions page
          </Link>
          .
        </section>
      )}
    </div>
  );
}

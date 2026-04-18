import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { getTraderCompetitionTrades } from "@/lib/queries";
import {
  getWeightedEntryPrice,
  getWeightedExitPrice,
  getTotalEntryQty,
  getFirstEntryTime,
  getLastExitTime,
  buildDashboardMetrics,
} from "@/lib/trade-utils";
import { MetricCard } from "@/components/metric-card";

type TraderDrillDownProps = {
  params: {
    competitionId: string;
    userId: string;
  };
};

export default async function TraderDrillDownPage({ params }: TraderDrillDownProps) {
  await requireActiveUser();
  const data = await getTraderCompetitionTrades(params.competitionId, params.userId);

  if (!data) {
    notFound();
  }

  const { competition, user: trader, trades } = data;
  const metrics = buildDashboardMetrics(trades);

  return (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-white/70 bg-[linear-gradient(135deg,rgba(15,23,32,0.96),rgba(49,91,74,0.88))] p-7 text-white shadow-soft">
        <Link
          href={`/leaderboard?competitionId=${competition.id}`}
          className="inline-flex items-center gap-2 text-sm text-white/65 hover:text-white/90 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to leaderboard
        </Link>
        <h1 className="mt-4 font-display text-4xl font-semibold">{trader.name}</h1>
        <p className="mt-2 text-base text-white/70">
          Competition: <span className="font-medium text-white/90">{competition.name}</span>
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Closed Trades" value={String(metrics.totalTrades)} />
        <MetricCard
          label="Win Rate"
          value={formatPercent(metrics.winRate)}
          tone="profit"
        />
        <MetricCard
          label="Net P&L"
          value={formatCurrency(metrics.totalNetPnl)}
          tone={metrics.totalNetPnl >= 0 ? "profit" : "loss"}
        />
        <MetricCard
          label="ROI %"
          value={formatPercent(metrics.returnOnCapital)}
          tone={metrics.returnOnCapital >= 0 ? "profit" : "loss"}
        />
      </section>

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap text-center text-[13px] font-medium text-slate-700">
            <thead>
              <tr className="bg-gradient-to-r from-[#d4a849] via-[#c99a38] to-[#b18123] text-white">
                <th className="px-4 py-3 font-semibold text-left">Ticker</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Segment</th>
                <th className="px-4 py-3 font-semibold">Entry Price</th>
                <th className="px-4 py-3 font-semibold">Exit Price</th>
                <th className="px-4 py-3 font-semibold">Qty</th>
                <th className="px-4 py-3 font-semibold">Entry Date</th>
                <th className="px-4 py-3 font-semibold">Exit Date</th>
                <th className="px-4 py-3 font-semibold">P&L %</th>
                <th className="px-4 py-3 font-semibold">Net P&L</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trades.map((trade) => {
                const entryP = getWeightedEntryPrice(trade);
                const exitP = getWeightedExitPrice(trade);
                const qty = getTotalEntryQty(trade);
                const capital = trade.capitalUsed || entryP * qty;
                const pnlPct = capital > 0 ? (trade.netPnl / capital) * 100 : 0;

                return (
                  <tr key={trade.id} className="hover:bg-[#faf7f0] transition-colors">
                    <td className="px-4 py-3 text-left font-semibold text-slate-800 uppercase">
                      {trade.symbol}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          trade.tradeType === "LONG"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-500"
                        }`}
                      >
                        {trade.tradeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 uppercase text-[11px] tracking-wider">
                      {trade.segment}
                    </td>
                    <td className="px-4 py-3">₹{formatNumber(entryP)}</td>
                    <td className="px-4 py-3">
                      {exitP > 0 ? `₹${formatNumber(exitP)}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatNumber(qty)}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {formatDateTime(getFirstEntryTime(trade))}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {getLastExitTime(trade)
                        ? formatDateTime(getLastExitTime(trade)!)
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        pnlPct > 0
                          ? "text-emerald-600"
                          : pnlPct < 0
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    >
                      {formatPercent(pnlPct)}
                    </td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        trade.netPnl > 0
                          ? "text-emerald-600"
                          : trade.netPnl < 0
                          ? "text-red-500"
                          : "text-slate-400"
                      }`}
                    >
                      {formatCurrency(trade.netPnl)}
                    </td>
                  </tr>
                );
              })}
              {trades.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    No qualifying trades found for this trader in this competition.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

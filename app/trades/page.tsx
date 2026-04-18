import { RefreshCcw } from "lucide-react";
import { requireActiveUser } from "@/lib/auth";
import { formatDateValue, formatNumber, formatPercent } from "@/lib/format";
import { getJournalData } from "@/lib/queries";
import { JournalTable } from "@/components/journal-table";
import Link from "next/link";

type TradesPageProps = {
  searchParams: {
    from?: string;
    to?: string;
    symbol?: string;
    tag?: string;
    status?: string;
    minQty?: string;
    sort?: string;
    showPnl?: string;
  };
};

export default async function TradesPage({ searchParams }: TradesPageProps) {
  const user = await requireActiveUser();
  const journal = await getJournalData(user.id, searchParams);
  const showPnl = searchParams.showPnl !== "0";

  return (
    <div className="space-y-6">
      <section className="rounded-[20px] border border-[#eadfbe] bg-white/95 px-6 py-4 shadow-soft">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">

          <form className="journal-toolbar">
            <input
              name="symbol"
              defaultValue={searchParams.symbol}
              placeholder="Search Stock"
              className="journal-input min-w-[150px]"
            />
            <span className="text-sm font-medium text-[#4e4b43]">Date :</span>
            <input name="from" type="date" defaultValue={searchParams.from} className="journal-input" />
            <input name="to" type="date" defaultValue={searchParams.to} className="journal-input" />
            <input
              name="minQty"
              defaultValue={searchParams.minQty}
              placeholder="Qty"
              className="journal-input w-[84px]"
            />
            <select name="status" defaultValue={searchParams.status ?? "ALL"} className="journal-input">
              <option value="ALL">All</option>
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed</option>
            </select>
            <select name="sort" defaultValue={searchParams.sort ?? "DESC"} className="journal-input">
              <option value="DESC">Sort Descending</option>
              <option value="ASC">Sort Ascending</option>
            </select>
            <label className="inline-flex items-center gap-2 text-sm font-medium text-[#24325b]">
              <input type="checkbox" name="showPnl" value="1" defaultChecked={showPnl} />
              Show PnL
            </label>
            <button type="submit" className="journal-round-btn">
              <RefreshCcw className="h-4 w-4" />
            </button>
          </form>
        </div>
      </section>

      <section className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
        <JournalTable rows={journal.groupedRows} showPnl={showPnl} />
      </section>

      <section className="flex flex-wrap gap-3">
        <Link href="/trades/new" className="journal-action-btn">
          Enter Trade
        </Link>
        <Link href="/dashboard" className="journal-action-btn">
          Dashboard
        </Link>
        <Link href="/leaderboard" className="journal-action-btn">
          Leaderboard
        </Link>
      </section>
    </div>
  );
}

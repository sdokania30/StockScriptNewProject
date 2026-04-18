"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckSquare, Edit2, PlaySquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export function JournalTable({ rows = [], showPnl = true }: { rows: any[]; showPnl?: boolean }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const rd = (dateString?: string | null | Date) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "dd MMM yyyy");
  };

  const fN = (num: number, hide = false) => {
    if (hide) return "***";
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num);
  };
  
  const fPct = (num: number, hide = false) => {
    if (hide) return "***";
    return new Intl.NumberFormat("en-IN", {
      style: "percent",
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(num / 100);
  };

  async function handleDelete(tradeId: string) {
    if (!confirm("Are you sure you want to delete this trade? This cannot be undone.")) {
      return;
    }
    setDeletingId(tradeId);
    try {
      const response = await fetch(`/api/trades/${tradeId}`, { method: "DELETE" });
      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to delete trade.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="w-full overflow-x-auto rounded-[16px] border border-slate-200 bg-white shadow-soft scrollbar-hide">
      <table className="w-full whitespace-nowrap text-center text-[12px] font-medium text-slate-700">
        <thead>
          <tr className="bg-gradient-to-r from-[#d4a849] via-[#c99a38] to-[#b18123] text-white">
            <th className="px-3 py-3 font-semibold">ACTIONS</th>
            <th className="px-3 py-3 font-semibold text-left">SYMBOL</th>
            <th className="px-3 py-3 font-semibold border-b border-white/20 text-center" colSpan={3}>ENTRY</th>
            <th className="px-3 py-3 font-semibold border-b border-white/20 text-center" colSpan={3}>EXIT</th>
            <th className="px-3 py-3 font-semibold">OPEN QTY</th>
            <th className="px-3 py-3 font-semibold">OPEN CAP (₹)</th>
            <th className="px-3 py-3 font-semibold">SL %</th>
            <th className="px-3 py-3 font-semibold">ALLOCATION %</th>
            <th className="px-3 py-3 font-semibold">AGE (DAYS)</th>
            <th className="px-3 py-3 font-semibold">P/L %(₹)</th>
            <th className="px-3 py-3 font-semibold">IMPACT %</th>
          </tr>
          <tr className="bg-[#b18123] text-white/90 text-[11px]">
            <th className="px-3 py-1 font-medium"></th>
            <th className="px-3 py-1 font-medium text-left"></th>
            <th className="px-3 py-2 font-medium">QTY</th>
            <th className="px-3 py-2 font-medium">PRICE</th>
            <th className="px-3 py-2 font-medium">DATE/TIME</th>
            <th className="px-3 py-2 font-medium">QTY</th>
            <th className="px-3 py-2 font-medium">PRICE</th>
            <th className="px-3 py-2 font-medium">DATE/TIME</th>
            <th className="px-3 py-1 font-medium"></th>
            <th className="px-3 py-1 font-medium"></th>
            <th className="px-3 py-1 font-medium"></th>
            <th className="px-3 py-1 font-medium"></th>
            <th className="px-3 py-1 font-medium"></th>
            <th className="px-3 py-1 font-medium"></th>
            <th className="px-3 py-1 font-medium"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((t) => {
            const isClosed = t.status === "CLOSED";
            const isDeleting = deletingId === t.id;
            const maxLegs = Math.max(1, t.entryLegs.length, t.exitLegs?.length || 0);
            const rowSpan = maxLegs;
            
            // Professional subtle highlighting based on status
            const baseBg = isClosed ? "bg-[#f8fcf9]" : "bg-[#fdfbfa]";
            const hoverBg = isClosed ? "hover:bg-[#f0f9f3]" : "hover:bg-[#fcf5eb]";
            
            return (
              <React.Fragment key={t.id}>
                {Array.from({ length: maxLegs }).map((_, idx: number) => {
                  const entryLeg = t.entryLegs[idx];
                  const exitLeg = t.exitLegs ? t.exitLegs[idx] : undefined;
                  
                  return (
                  <tr key={`${t.id}-leg-${idx}`} className={`${baseBg} ${hoverBg} transition-colors ${isDeleting ? "opacity-50" : ""}`}>
                    {idx === 0 && (
                      <>
                        <td className="px-3 py-3 align-middle" rowSpan={rowSpan}>
                          <div className="flex items-center justify-center gap-1.5 flex-col">
                            <div className="flex items-center gap-1.5">
                              <Link href={`/trades/${t.symbol}/edit/${t.id}`} className="text-[#b18123] hover:text-[#886219]" title="Edit trade">
                                <Edit2 size={13} />
                              </Link>
                              <button
                                onClick={() => handleDelete(t.id)}
                                disabled={isDeleting}
                                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                                title="Delete trade"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-left font-semibold text-slate-800 align-middle" rowSpan={rowSpan}>
                          <Link href={`/trades/${t.symbol}`} className="hover:text-[#b18123] hover:underline uppercase text-[#6366f1]">
                            {t.symbol}
                          </Link>
                        </td>
                      </>
                    )}
                    
                    <td className="px-3 py-3 text-slate-600">{entryLeg?.qty ? fN(entryLeg.qty) : "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{entryLeg?.price ? fN(entryLeg.price) : "-"}</td>
                    <td className="px-3 py-3 text-slate-500">{entryLeg?.dateTime ? rd(entryLeg.dateTime) : "-"}</td>

                    <td className="px-3 py-3 text-slate-600">{exitLeg?.qty > 0 ? fN(exitLeg.qty) : "-"}</td>
                    <td className="px-3 py-3 text-slate-600">{exitLeg?.price > 0 ? fN(exitLeg.price) : "-"}</td>
                    <td className="px-3 py-3 text-slate-500">{exitLeg?.dateTime ? rd(exitLeg.dateTime) : "-"}</td>

                    {idx === 0 && (
                      <>
                        <td className="px-3 py-3 text-slate-600 align-middle font-medium" rowSpan={rowSpan}>
                          {t.openQty > 0 ? fN(t.openQty) : "-"}
                        </td>

                        <td className="px-3 py-3 text-slate-600 align-middle font-medium" rowSpan={rowSpan}>
                          {t.openCapital > 0 ? fN(t.openCapital) : "-"}
                        </td>

                        <td className="px-3 py-3 text-slate-500 align-middle font-medium" rowSpan={rowSpan}>
                          {t.stopLossPct !== null ? fPct(t.stopLossPct) : "-"}
                        </td>

                        <td className="px-3 py-3 text-slate-500 align-middle font-medium" rowSpan={rowSpan}>
                          {!showPnl ? "***" : fPct(t.allocationPct)}
                        </td>

                        <td className="px-3 py-3 text-slate-500 align-middle font-medium" rowSpan={rowSpan}>
                          {t.ageDays}
                        </td>

                        <td className={`px-3 py-3 font-semibold align-middle ${t.pnlAmount > 0 ? "text-emerald-500" : t.pnlAmount < 0 ? "text-red-500" : "text-slate-400"}`} rowSpan={rowSpan}>
                          {!showPnl ? "***" : t.pnlAmount !== 0 ? `${fPct(t.pnlPct)} (${fN(t.pnlAmount)})` : "-"}
                        </td>

                        <td className={`px-3 py-3 font-semibold align-middle ${t.impactPct > 0 ? "text-emerald-500" : t.impactPct < 0 ? "text-red-500" : "text-slate-400"}`} rowSpan={rowSpan}>
                          {!showPnl ? "***" : t.impactPct !== 0 ? fPct(t.impactPct) : "-"}
                        </td>
                      </>
                    )}
                  </tr>
                  );
                })}
                {/* Fallback if no entry legs somehow */}
                {t.entryLegs.length === 0 && (
                  <tr className={`${baseBg} ${hoverBg} transition-colors ${isDeleting ? "opacity-50" : ""}`}>
                     <td className="px-3 py-3 align-middle">
                        <div className="flex items-center justify-center gap-1.5 flex-col">
                          <div className="flex items-center gap-1.5">
                            <Link href={`/trades/${t.symbol}/edit/${t.id}`} className="text-[#b18123] hover:text-[#886219]" title="Edit trade">
                              <Edit2 size={13} />
                            </Link>
                            <button
                              onClick={() => handleDelete(t.id)}
                              disabled={isDeleting}
                              className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-40"
                              title="Delete trade"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-left font-semibold text-slate-800 align-middle">
                        <Link href={`/trades/${t.symbol}`} className="hover:text-[#b18123] hover:underline uppercase text-[#6366f1]">
                          {t.symbol}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-slate-600">-</td>
                      <td className="px-3 py-3 text-slate-600">-</td>
                      <td className="px-3 py-3 text-slate-500">-</td>
                      <td className="px-3 py-3 text-slate-600 align-middle">{t.exitQty > 0 ? fN(t.exitQty) : "-"}</td>
                      <td className="px-3 py-3 text-slate-600 align-middle">{t.exitPrice > 0 ? fN(t.exitPrice) : "-"}</td>
                      <td className="px-3 py-3 text-slate-500 align-middle">{t.exitDateTime ? rd(t.exitDateTime) : "-"}</td>

                      <td className="px-3 py-3 text-slate-600 align-middle font-medium">
                        {t.openQty > 0 ? fN(t.openQty) : "-"}
                      </td>

                      <td className="px-3 py-3 text-slate-600 align-middle font-medium">
                        {t.openCapital > 0 ? fN(t.openCapital) : "-"}
                      </td>

                      <td className="px-3 py-3 text-slate-500 align-middle font-medium">
                        {t.stopLossPct !== null ? fPct(t.stopLossPct) : "-"}
                      </td>

                      <td className="px-3 py-3 text-slate-500 align-middle font-medium">
                        {!showPnl ? "***" : fPct(t.allocationPct)}
                      </td>

                      <td className="px-3 py-3 text-slate-500 align-middle font-medium">
                        {t.ageDays}
                      </td>

                      <td className={`px-3 py-3 font-semibold align-middle ${t.pnlAmount > 0 ? "text-emerald-500" : t.pnlAmount < 0 ? "text-red-500" : "text-slate-400"}`}>
                        {!showPnl ? "***" : t.pnlAmount !== 0 ? `${fPct(t.pnlPct)} (${fN(t.pnlAmount)})` : "-"}
                      </td>

                      <td className={`px-3 py-3 font-semibold align-middle ${t.impactPct > 0 ? "text-emerald-500" : t.impactPct < 0 ? "text-red-500" : "text-slate-400"}`}>
                        {!showPnl ? "***" : t.impactPct !== 0 ? fPct(t.impactPct) : "-"}
                      </td>
                  </tr>
                )}
                <tr className="h-2 bg-slate-50/50"><td colSpan={15}></td></tr>
              </React.Fragment>
            );
          })}
          {rows.length === 0 && (
             <tr><td colSpan={15} className="py-8 text-center text-slate-500">No trades yet. Add one above!</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

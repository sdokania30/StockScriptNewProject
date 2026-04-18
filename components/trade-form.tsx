"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { segmentOptions, tradeTypeOptions } from "@/lib/constants";
import { Plus, Minus } from "lucide-react";

type TradeFormProps = {
  competitions: { id: string; name: string }[];
  initialData?: any;
};

function getDefaultDate(offsetMinutes = 0) {
  const date = new Date(Date.now() + offsetMinutes * 60 * 1000);
  const timezoneOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - timezoneOffset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

function countInitialLegs(data: any, prefix: "entry" | "exit") {
  if (!data) return 1;
  let count = 1;
  if (data[`${prefix}Price2`] || data[`${prefix}Qty2`]) count = 2;
  if (data[`${prefix}Price3`] || data[`${prefix}Qty3`]) count = 3;
  return count;
}

export function TradeForm({ competitions, initialData }: TradeFormProps) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"OPEN" | "CLOSED">(
    initialData?.status || "OPEN"
  );
  const [entryCount, setEntryCount] = useState(countInitialLegs(initialData, "entry"));
  const [exitCount, setExitCount] = useState(countInitialLegs(initialData, "exit"));

  async function handleSubmit(formData: FormData) {
    setError("");
    setIsSubmitting(true);

    const payload = {
      competitionId: String(formData.get("competitionId") || "") || null,
      symbol: String(formData.get("symbol") || ""),
      segment: String(formData.get("segment") || "EQUITY"),
      tradeType: String(formData.get("tradeType") || "LONG"),
      status: String(formData.get("status") || "OPEN"),
      tags: String(formData.get("tags") || ""),
      notes: String(formData.get("notes") || ""),

      entryTime1: String(formData.get("entryTime1") || ""),
      entryPrice1: Number(formData.get("entryPrice1") || 0),
      entryQty1: Number(formData.get("entryQty1") || 0),

      entryTime2: formData.get("entryTime2") ? String(formData.get("entryTime2")) : null,
      entryPrice2: formData.get("entryPrice2") ? Number(formData.get("entryPrice2")) : null,
      entryQty2: formData.get("entryQty2") ? Number(formData.get("entryQty2")) : null,

      entryTime3: formData.get("entryTime3") ? String(formData.get("entryTime3")) : null,
      entryPrice3: formData.get("entryPrice3") ? Number(formData.get("entryPrice3")) : null,
      entryQty3: formData.get("entryQty3") ? Number(formData.get("entryQty3")) : null,

      exitTime1: formData.get("exitTime1") ? String(formData.get("exitTime1")) : null,
      exitPrice1: formData.get("exitPrice1") ? Number(formData.get("exitPrice1")) : null,
      exitQty1: formData.get("exitQty1") ? Number(formData.get("exitQty1")) : null,

      exitTime2: formData.get("exitTime2") ? String(formData.get("exitTime2")) : null,
      exitPrice2: formData.get("exitPrice2") ? Number(formData.get("exitPrice2")) : null,
      exitQty2: formData.get("exitQty2") ? Number(formData.get("exitQty2")) : null,

      exitTime3: formData.get("exitTime3") ? String(formData.get("exitTime3")) : null,
      exitPrice3: formData.get("exitPrice3") ? Number(formData.get("exitPrice3")) : null,
      exitQty3: formData.get("exitQty3") ? Number(formData.get("exitQty3")) : null,

      closingPrice: formData.get("closingPrice") ? Number(formData.get("closingPrice")) : null,
      stopLoss: formData.get("stopLoss") ? Number(formData.get("stopLoss")) : null,
      capitalUsed: formData.get("capitalUsed") ? Number(formData.get("capitalUsed")) : null,
      charges: Number(formData.get("charges") || 0),
    };

    const url = initialData?.id ? `/api/trades/${initialData.id}` : "/api/trades";
    const method = initialData?.id ? "PUT" : "POST";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || "Unable to save trade.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/trades/${encodeURIComponent(result.trade.symbol)}`);
    router.refresh();
  }

  const dtVal = (val: string | null | undefined, def?: string) => {
    if (val) return new Date(val).toISOString().slice(0, 16);
    return def || "";
  };

  return (
    <form action={handleSubmit} className="flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
        <input name="symbol" placeholder="SYMBOL" required defaultValue={initialData?.symbol || ""} className="form-input uppercase w-[140px] font-bold text-lg" />
        
        <select name="status" value={status} onChange={(e) => setStatus(e.target.value as "OPEN" | "CLOSED")} className="form-input w-[110px] bg-slate-50">
          <option value="OPEN">🟢 OPEN</option>
          <option value="CLOSED">🔴 CLOSED</option>
        </select>

        <select name="tradeType" defaultValue={initialData?.tradeType || "LONG"} className="form-input w-[100px] bg-slate-50">
          {tradeTypeOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>

        <select name="segment" defaultValue={initialData?.segment || "EQUITY"} className="form-input w-[110px] bg-slate-50">
          {segmentOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>

        {competitions.length > 0 && (
          <select name="competitionId" defaultValue={initialData?.competitionId || ""} className="form-input w-[160px] bg-slate-50">
            <option value="">No Competition</option>
            {competitions.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        )}

        <input name="tags" placeholder="Tags (e.g. breakout)" defaultValue={initialData?.tags || ""} className="form-input flex-1 min-w-[120px]" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
        {/* ENTRIES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-emerald-600 tracking-wider">ENTRIES</div>
            <div className="flex items-center gap-1">
              {entryCount < 3 && (
                <button
                  type="button"
                  onClick={() => setEntryCount((c) => Math.min(c + 1, 3))}
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              )}
              {entryCount > 1 && (
                <button
                  type="button"
                  onClick={() => setEntryCount((c) => Math.max(c - 1, 1))}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-slate-400 hover:text-red-500 transition"
                >
                  <Minus className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-[3fr_2fr_2fr] gap-2 items-center text-xs text-slate-400 mb-1">
            <span>Date & Time</span><span>Price</span><span>Qty</span>
          </div>
          {Array.from({ length: entryCount }, (_, idx) => idx + 1).map(i => (
            <div key={`entry-${i}`} className="grid grid-cols-[3fr_2fr_2fr] gap-2 items-center">
              <input name={`entryTime${i}`} type="datetime-local" defaultValue={dtVal(initialData?.[`entryTime${i}`], i===1 ? getDefaultDate(-45) : "")} required={i===1} className="form-input text-xs h-9" />
              <input name={`entryPrice${i}`} type="number" step="0.01" min="0" placeholder={`Price ${i}`} defaultValue={initialData?.[`entryPrice${i}`] || ""} required={i===1} className="form-input text-sm h-9" />
              <input name={`entryQty${i}`} type="number" step="0.01" min="0" placeholder={`Qty ${i}`} defaultValue={initialData?.[`entryQty${i}`] || ""} required={i===1} className="form-input text-sm h-9" />
            </div>
          ))}
        </div>

        {/* EXITS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-amber-600 tracking-wider">EXITS</div>
            <div className="flex items-center gap-1">
              {exitCount < 3 && (
                <button
                  type="button"
                  onClick={() => setExitCount((c) => Math.min(c + 1, 3))}
                  className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100 transition"
                >
                  <Plus className="h-3 w-3" /> Add
                </button>
              )}
              {exitCount > 1 && (
                <button
                  type="button"
                  onClick={() => setExitCount((c) => Math.max(c - 1, 1))}
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-1.5 py-0.5 text-slate-400 hover:text-red-500 transition"
                >
                  <Minus className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-[3fr_2fr_2fr] gap-2 items-center text-xs text-slate-400 mb-1">
            <span>Date & Time</span><span>Price</span><span>Qty</span>
          </div>
          {Array.from({ length: exitCount }, (_, idx) => idx + 1).map(i => (
            <div key={`exit-${i}`} className="grid grid-cols-[3fr_2fr_2fr] gap-2 items-center">
              <input name={`exitTime${i}`} type="datetime-local" defaultValue={dtVal(initialData?.[`exitTime${i}`], "")} required={status==="CLOSED" && i===1} className="form-input text-xs h-9" />
              <input name={`exitPrice${i}`} type="number" step="0.01" min="0" placeholder={`Price ${i}`} defaultValue={initialData?.[`exitPrice${i}`] || ""} required={status==="CLOSED" && i===1} className="form-input text-sm h-9" />
              <input name={`exitQty${i}`} type="number" step="0.01" min="0" placeholder={`Qty ${i}`} defaultValue={initialData?.[`exitQty${i}`] || ""} required={status==="CLOSED" && i===1} className="form-input text-sm h-9" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center">
        <label className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
          <span>Stop Loss</span>
          <input name="stopLoss" type="number" step="0.01" min="0" defaultValue={initialData?.stopLoss ?? ""} className="form-input w-[100px] h-9" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
          <span>Charges</span>
          <input name="charges" type="number" step="0.01" min="0" defaultValue={initialData?.charges ?? "0"} className="form-input w-[100px] h-9" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
          <span title="End of day Mark to Market">EOD Closing Price</span>
          <input name="closingPrice" type="number" step="0.01" min="0" defaultValue={initialData?.closingPrice ?? ""} className="form-input w-[100px] h-9" />
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-500 whitespace-nowrap">
          <span>Capital Override</span>
          <input name="capitalUsed" type="number" step="0.01" min="0" placeholder="(optional)" defaultValue={initialData?.capitalUsed ?? ""} className="form-input w-[100px] h-9" />
        </label>
      </div>

      <textarea name="notes" rows={2} placeholder="Setup rationale, reflection notes..." defaultValue={initialData?.notes || ""} className="form-input resize-y text-sm" />

      <div className="flex items-center justify-between mt-2 pt-4 border-t border-slate-100">
        {error ? <p className="text-sm text-red-500 font-medium">{error}</p> : <div/>}
        <button type="submit" disabled={isSubmitting} className="rounded-xl bg-slate-900 px-8 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60">
          {isSubmitting ? "Saving..." : initialData ? "Save changes" : "Log Trade"}
        </button>
      </div>
    </form>
  );
}

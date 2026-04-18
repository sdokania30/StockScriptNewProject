import { Competition, Trade, User } from "@prisma/client";
import { differenceInDays } from "date-fns";
import { z } from "zod";
import {
  MIN_COMPETITION_CAPITAL_PER_TRADE,
  MIN_COMPETITION_TRADES,
} from "./constants";

export const segmentSchema = z.enum(["EQUITY", "INTRADAY", "OPTIONS", "FUTURES"]);
export const tradeTypeSchema = z.enum(["LONG", "SHORT"]);
export const tradeStatusSchema = z.enum(["OPEN", "CLOSED"]);
export const competitionVisibilitySchema = z.enum(["PUBLIC", "PRIVATE"]);
export const userRoleSchema = z.enum(["ADMIN", "TRADER"]);
export const approvalStatusSchema = z.enum(["PENDING", "APPROVED"]);

export type SegmentValue = z.infer<typeof segmentSchema>;
export type TradeTypeValue = z.infer<typeof tradeTypeSchema>;
export type TradeStatusValue = z.infer<typeof tradeStatusSchema>;

const isoDateString = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(new Date(value).getTime()), {
    message: "Expected a valid date-time string.",
  });

const optionalDateString = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, isoDateString.optional());

const optionalNumber = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  return value;
}, z.coerce.number().positive().optional());

export const tradePayloadSchema = z
  .object({
    competitionId: z.string().optional().nullable(),
    symbol: z.string().trim().min(1).max(40),
    segment: segmentSchema,
    tradeType: tradeTypeSchema,

    entryPrice1: z.coerce.number().positive(),
    entryQty1: z.coerce.number().positive(),
    entryTime1: isoDateString,

    entryPrice2: optionalNumber,
    entryQty2: optionalNumber,
    entryTime2: optionalDateString,

    entryPrice3: optionalNumber,
    entryQty3: optionalNumber,
    entryTime3: optionalDateString,

    exitPrice1: optionalNumber,
    exitQty1: optionalNumber,
    exitTime1: optionalDateString,

    exitPrice2: optionalNumber,
    exitQty2: optionalNumber,
    exitTime2: optionalDateString,

    exitPrice3: optionalNumber,
    exitQty3: optionalNumber,
    exitTime3: optionalDateString,

    closingPrice: optionalNumber,
    stopLoss: optionalNumber,
    capitalUsed: optionalNumber,
    charges: z.coerce.number().min(0).default(0),
    tags: z.union([z.array(z.string()), z.string()]).optional(),
    notes: z.string().max(2000).optional(),
    status: tradeStatusSchema.default("OPEN"),
  })
  .superRefine((data, ctx) => {
    if (data.status === "CLOSED") {
      if (!data.exitPrice1 && !data.exitPrice2 && !data.exitPrice3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one Exit price is required for closed trades.",
          path: ["exitPrice1"],
        });
      }
      if (!data.exitTime1 && !data.exitTime2 && !data.exitTime3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "At least one Exit time is required for closed trades.",
          path: ["exitTime1"],
        });
      }
    }
  });

export const competitionPayloadSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    startDate: isoDateString,
    endDate: isoDateString,
    visibility: competitionVisibilitySchema,
  })
  .superRefine((data, ctx) => {
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Competition end date must be later than start date.",
        path: ["endDate"],
      });
    }
  });

export const joinCompetitionSchema = z.object({ competitionId: z.string().min(1) });

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

// MATH HELPERS
export function getTotalEntryQty(trade: Partial<Trade>) {
  return (trade.entryQty1 || 0) + (trade.entryQty2 || 0) + (trade.entryQty3 || 0);
}

export function getTotalExitQty(trade: Partial<Trade>) {
  return (trade.exitQty1 || 0) + (trade.exitQty2 || 0) + (trade.exitQty3 || 0);
}

export function getWeightedEntryPrice(trade: Partial<Trade>) {
  const q1 = trade.entryQty1 || 0;
  const q2 = trade.entryQty2 || 0;
  const q3 = trade.entryQty3 || 0;
  const totalQ = q1 + q2 + q3;
  if (totalQ === 0) return 0;
  const w1 = (trade.entryPrice1 || 0) * q1;
  const w2 = (trade.entryPrice2 || 0) * q2;
  const w3 = (trade.entryPrice3 || 0) * q3;
  return (w1 + w2 + w3) / totalQ;
}

export function getWeightedExitPrice(trade: Partial<Trade>) {
  const q1 = trade.exitQty1 || 0;
  const q2 = trade.exitQty2 || 0;
  const q3 = trade.exitQty3 || 0;
  const totalQ = q1 + q2 + q3;
  if (totalQ === 0) return 0;
  const w1 = (trade.exitPrice1 || 0) * q1;
  const w2 = (trade.exitPrice2 || 0) * q2;
  const w3 = (trade.exitPrice3 || 0) * q3;
  return (w1 + w2 + w3) / totalQ;
}

export function getFirstEntryTime(trade: Partial<Trade>): Date {
  return (trade.entryTime1 as Date) ?? new Date();
}

export function getLastExitTime(trade: Partial<Trade>): Date | null {
  const times = [trade.exitTime3, trade.exitTime2, trade.exitTime1].filter(Boolean);
  return times.length > 0 ? (times[0] as Date) : null;
}

export type TradeWithRelations = Trade & {
  user: User;
  images: { id: string; imageUrl: string; uploadedAt: Date }[];
  competition: Competition | null;
};

export function sanitizeTags(tags?: string[] | string) {
  if (!tags) return "";
  const list = Array.isArray(tags) ? tags : tags.split(",");
  return Array.from(new Set(list.map((tag) => tag.trim().toLowerCase()).filter(Boolean))).join(",");
}

export function parseTags(tags: string) {
  return tags.split(",").map((tag) => tag.trim()).filter(Boolean);
}

export function getRealizedExitPrice(trade: Partial<Trade>) {
  const avg = getWeightedExitPrice(trade);
  return avg > 0 ? avg : 0;
}

export function getMarkedPrice(trade: Partial<Trade>) {
  if (trade.closingPrice && trade.closingPrice > 0) return trade.closingPrice;
  return getRealizedExitPrice(trade);
}

export function calculateOpenPnl(input: {
  trade: Partial<Trade>;
  isClosed: boolean;
}) {
  const entryP = getWeightedEntryPrice(input.trade);
  const entryQ = getTotalEntryQty(input.trade);
  
  const exitP = getWeightedExitPrice(input.trade);
  const exitQ = getTotalExitQty(input.trade);
  
  const markedP = input.isClosed ? getRealizedExitPrice(input.trade) : getMarkedPrice(input.trade);
  const charges = input.trade.charges || 0;

  const remainingQ = Math.max(0, entryQ - exitQ);

  let realizedPnl = 0;
  let unrealizedPnl = 0;

  if (input.trade.tradeType === "LONG") {
    if (exitQ > 0) realizedPnl = (exitP - entryP) * exitQ;
    if (remainingQ > 0 && markedP > 0) unrealizedPnl = (markedP - entryP) * remainingQ;
  } else {
    if (exitQ > 0) realizedPnl = (entryP - exitP) * exitQ;
    if (remainingQ > 0 && markedP > 0) unrealizedPnl = (entryP - markedP) * remainingQ;
  }

  // If closed, the entire position should be exited, so unrealized is 0 (or markedP is the exitP)
  // For open trades, it's the sum of what was realized so far + the current marked value of the remainder.
  const grossPnl = input.isClosed ? realizedPnl : (realizedPnl + unrealizedPnl);

  return grossPnl - charges;
}

export function calculateTradeMetrics(input: Partial<Trade>) {
  const entryP = getWeightedEntryPrice(input);
  const entryQ = getTotalEntryQty(input);
  const nominalCapital = Math.abs(entryP * entryQ);
  const capitalUsed = input.capitalUsed || nominalCapital;

  if (input.status !== "CLOSED") {
    return {
      realizedPnl: 0,
      capitalUsed,
      markedPnl: calculateOpenPnl({ trade: input, isClosed: false }),
    };
  }

  const exitP = getWeightedExitPrice(input);
  const exitQ = getTotalExitQty(input);
  // Assume exitQ is close enough to entryQ for realized PNL mapping, or fall back to entryQ
  const pnlQty = exitQ > 0 ? exitQ : entryQ; 
  const charges = input.charges || 0;

  const grossPnl =
    input.tradeType === "LONG"
      ? (exitP - entryP) * pnlQty
      : (entryP - exitP) * pnlQty;

  return {
    realizedPnl: grossPnl - charges,
    capitalUsed,
    markedPnl: calculateOpenPnl({ trade: input, isClosed: true }),
  };
}

export function calculateWinRate(trades: Pick<Trade, "netPnl">[]) {
  if (!trades.length) return 0;
  const winners = trades.filter((trade) => trade.netPnl > 0).length;
  return (winners / trades.length) * 100;
}

export function calculateProfitFactor(trades: Pick<Trade, "netPnl">[]) {
  const grossProfit = trades.filter((trade) => trade.netPnl > 0).reduce((sum, trade) => sum + trade.netPnl, 0);
  const grossLoss = Math.abs(trades.filter((trade) => trade.netPnl < 0).reduce((sum, trade) => sum + trade.netPnl, 0));
  if (grossLoss === 0) return grossProfit > 0 ? grossProfit : 0;
  return grossProfit / grossLoss;
}

export function calculateAverageWinLoss(trades: Pick<Trade, "netPnl">[]) {
  const wins = trades.filter((trade) => trade.netPnl > 0);
  const losses = trades.filter((trade) => trade.netPnl < 0);

  const averageWin = wins.reduce((sum, trade) => sum + trade.netPnl, 0) / (wins.length || 1);
  const averageLoss = Math.abs(losses.reduce((sum, trade) => sum + trade.netPnl, 0)) / (losses.length || 1);

  return {
    averageWin,
    averageLoss,
    riskRewardRatio: averageLoss === 0 ? averageWin : averageWin / averageLoss,
  };
}

export function calculateMaxCapitalDeployed(trades: Trade[]) {
  const events = trades.flatMap((trade) => [
    { at: getFirstEntryTime(trade).getTime(), delta: trade.capitalUsed, order: 1 },
    { at: (getLastExitTime(trade) ?? new Date()).getTime(), delta: -trade.capitalUsed, order: 0 },
  ]);

  events.sort((a, b) => a.at === b.at ? a.order - b.order : a.at - b.at);

  let running = 0;
  let peak = 0;

  for (const event of events) {
    running += event.delta;
    peak = Math.max(peak, running);
  }
  return peak;
}

export function calculateMaxDrawdown(trades: Trade[], maxCapitalDeployed: number) {
  if (!trades.length || maxCapitalDeployed <= 0) return 0;

  const sortedTrades = [...trades].sort((a, b) => {
    const left = getLastExitTime(a)?.getTime() ?? 0;
    const right = getLastExitTime(b)?.getTime() ?? 0;
    return left - right;
  });

  let cumulativePnl = 0;
  let peakReturn = 0;
  let maxDrawdown = 0;

  for (const trade of sortedTrades) {
    cumulativePnl += trade.netPnl;
    const currentReturn = (cumulativePnl / maxCapitalDeployed) * 100;
    peakReturn = Math.max(peakReturn, currentReturn);
    maxDrawdown = Math.max(maxDrawdown, peakReturn - currentReturn);
  }
  return maxDrawdown;
}

export function buildDashboardMetrics(trades: Trade[]) {
  const closedTrades = trades.filter((trade) => trade.status === "CLOSED");
  const maxCapitalDeployed = calculateMaxCapitalDeployed(closedTrades);
  const totalNetPnl = closedTrades.reduce((sum, trade) => sum + trade.netPnl, 0);

  return {
    totalTrades: closedTrades.length,
    openTrades: trades.filter((trade) => trade.status === "OPEN").length,
    winRate: calculateWinRate(closedTrades),
    ...calculateAverageWinLoss(closedTrades),
    profitFactor: calculateProfitFactor(closedTrades),
    maxDrawdown: calculateMaxDrawdown(closedTrades, maxCapitalDeployed),
    maxCapitalDeployed,
    totalNetPnl,
    returnOnCapital: maxCapitalDeployed > 0 ? (totalNetPnl / maxCapitalDeployed) * 100 : 0,
  };
}

export function groupTradesBySymbol(trades: Trade[]) {
  const closedTrades = trades.filter((trade) => trade.status === "CLOSED");
  const grouped = new Map<string, any>();

  for (const trade of closedTrades) {
    const entryQ = getTotalEntryQty(trade);
    const entryP = getWeightedEntryPrice(trade);
    const exitP = getWeightedExitPrice(trade);

    const current = grouped.get(trade.symbol) ?? {
      symbol: trade.symbol,
      totalTrades: 0,
      totalQuantity: 0,
      totalNetPnl: 0,
      profitableTrades: 0,
      weightedEntry: 0,
      weightedExit: 0,
    };

    current.totalTrades += 1;
    current.totalQuantity += entryQ;
    current.totalNetPnl += trade.netPnl;
    current.profitableTrades += trade.netPnl > 0 ? 1 : 0;
    current.weightedEntry += entryP * entryQ;
    current.weightedExit += exitP * entryQ; // Approximating exit weight by qty

    grouped.set(trade.symbol, current);
  }

  return [...grouped.values()]
    .map((item) => ({
      ...item,
      winRate: item.totalTrades ? (item.profitableTrades / item.totalTrades) * 100 : 0,
      weightedAvgEntry: item.totalQuantity ? item.weightedEntry / item.totalQuantity : 0,
      weightedAvgExit: item.totalQuantity ? item.weightedExit / item.totalQuantity : 0,
    }))
    .sort((a, b) => b.totalNetPnl - a.totalNetPnl);
}

export function normalizeTradePayload(payload: z.infer<typeof tradePayloadSchema>) {
  return {
    ...payload,
    competitionId: payload.competitionId || null,
    symbol: payload.symbol.trim().toUpperCase(),
    tags: sanitizeTags(payload.tags),
    notes: payload.notes?.trim() ?? "",
    entryPrice2: payload.entryPrice2 ?? null,
    entryQty2: payload.entryQty2 ?? null,
    entryTime2: payload.entryTime2 ?? null,
    entryPrice3: payload.entryPrice3 ?? null,
    entryQty3: payload.entryQty3 ?? null,
    entryTime3: payload.entryTime3 ?? null,
    exitPrice1: payload.exitPrice1 ?? null,
    exitQty1: payload.exitQty1 ?? null,
    exitTime1: payload.exitTime1 ?? null,
    exitPrice2: payload.exitPrice2 ?? null,
    exitQty2: payload.exitQty2 ?? null,
    exitTime2: payload.exitTime2 ?? null,
    exitPrice3: payload.exitPrice3 ?? null,
    exitQty3: payload.exitQty3 ?? null,
    exitTime3: payload.exitTime3 ?? null,
    closingPrice: payload.closingPrice ?? null,
    capitalUsed: payload.capitalUsed ?? null,
    stopLoss: payload.stopLoss ?? null,
  };
}

export function buildJournalRows(trades: Trade[], portfolioCapital: number) {
  return trades.map((trade, index) => {
    const entryP = getWeightedEntryPrice(trade);
    const entryQ = getTotalEntryQty(trade);
    
    const markedPnl = calculateOpenPnl({ trade, isClosed: trade.status === "CLOSED" });
    const capital = trade.capitalUsed || (entryP * entryQ);
    const displayPnl = trade.status === "CLOSED" ? trade.netPnl : markedPnl;
    
    let slPct = 0;
    if (trade.stopLoss && entryP > 0) {
      slPct = Math.abs((trade.stopLoss - entryP) / entryP) * 100;
    }

    return {
      id: trade.id,
      rowNumber: trade.rowIndex || index + 1,
      entryExit: trade.status === "CLOSED" ? "Exit" : "Entry",
      type: trade.tradeType,
      ticker: trade.symbol,
      entryDate: getFirstEntryTime(trade),

      // Derived flat metrics for easy UI rendering if needed
      price: entryP,
      qty: entryQ,
      
      stopLoss: trade.stopLoss,
      slPct: slPct,
      setup: parseTags(trade.tags).join(", ") || "Manual",
      capital,
      allocationPct: portfolioCapital > 0 ? (capital / portfolioCapital) * 100 : 0,
      pnlOpen: trade.status === "OPEN" ? markedPnl : 0,
      pnlCombined: displayPnl,
      pnlPct: capital > 0 ? (displayPnl / capital) * 100 : 0,
      ageDays: Math.max(differenceInDays(new Date(), getFirstEntryTime(trade)), 0),
      impactPct: portfolioCapital > 0 ? (displayPnl / portfolioCapital) * 100 : 0,
      closingPrice: trade.closingPrice,
      status: trade.status,
      originalTrade: trade,
    };
  });
}

export type EntryLeg = {
  qty: number;
  price: number;
  dateTime: Date;
};

export type GroupedTradeRow = {
  id: string;
  symbol: string;
  status: "OPEN" | "CLOSED";
  tradeType: string;
  entryLegs: EntryLeg[];
  exitLegs: EntryLeg[];
  totalEntryQty: number;
  weightedEntryPrice: number;
  exitQty: number;
  exitPrice: number;
  exitDateTime: Date | null;
  pnlPct: number;
  pnlAmount: number;
  allocationPct: number;
  ageDays: number;
  impactPct: number;
  openQty: number;
  openCapital: number;
  stopLossPct: number | null;
};

/**
 * Build grouped journal rows matching the screenshot layout.
 * Each trade record becomes a group showing:
 *   - Individual entry legs as sub-rows
 *   - Consolidated exit (weighted avg price, total qty, last exit time)
 *   - P/L % with absolute P/L and Potential P/L
 */
export function buildGroupedJournalRows(trades: Trade[], portfolioCapital: number = 100000): GroupedTradeRow[] {
  return trades.map((trade) => {
    // Collect entry legs that have data
    const entryLegs: EntryLeg[] = [];
    if (trade.entryQty1 && trade.entryPrice1) {
      entryLegs.push({
        qty: trade.entryQty1,
        price: trade.entryPrice1,
        dateTime: trade.entryTime1,
      });
    }
    if (trade.entryQty2 && trade.entryPrice2 && trade.entryTime2) {
      entryLegs.push({
        qty: trade.entryQty2,
        price: trade.entryPrice2,
        dateTime: trade.entryTime2,
      });
    }
    if (trade.entryQty3 && trade.entryPrice3 && trade.entryTime3) {
      entryLegs.push({
        qty: trade.entryQty3,
        price: trade.entryPrice3,
        dateTime: trade.entryTime3,
      });
    }

    const exitLegs: EntryLeg[] = [];
    if (trade.exitQty1 && trade.exitPrice1 && trade.exitTime1) {
      exitLegs.push({
        qty: trade.exitQty1,
        price: trade.exitPrice1,
        dateTime: trade.exitTime1,
      });
    }
    if (trade.exitQty2 && trade.exitPrice2 && trade.exitTime2) {
      exitLegs.push({
        qty: trade.exitQty2,
        price: trade.exitPrice2,
        dateTime: trade.exitTime2,
      });
    }
    if (trade.exitQty3 && trade.exitPrice3 && trade.exitTime3) {
      exitLegs.push({
        qty: trade.exitQty3,
        price: trade.exitPrice3,
        dateTime: trade.exitTime3,
      });
    }

    const totalEntryQty = getTotalEntryQty(trade);
    const weightedEntry = getWeightedEntryPrice(trade);
    const exitQ = getTotalExitQty(trade);
    const exitP = getWeightedExitPrice(trade);
    const lastExit = getLastExitTime(trade);

    const isClosed = trade.status === "CLOSED";
    const markedPnl = calculateOpenPnl({ trade, isClosed });
    const displayPnl = isClosed ? trade.netPnl : markedPnl;
    const capital = trade.capitalUsed || (weightedEntry * totalEntryQty);
    const pnlPct = capital > 0 ? (displayPnl / capital) * 100 : 0;
    
    // Allocation %: Open Capital / Portfolio Capital
    const openQty = Math.max(0, totalEntryQty - exitQ);
    const openCapital = openQty > 0 ? weightedEntry * openQty : 0;
    const allocationPct = portfolioCapital > 0 ? (openCapital / portfolioCapital) * 100 : 0;
    
    // Portfolio Impact %
    const impactPct = portfolioCapital > 0 ? (displayPnl / portfolioCapital) * 100 : 0;

    // Age in Days
    let ageDays = 0;
    const firstEntry = getFirstEntryTime(trade);
    if (firstEntry) {
      const endDate = isClosed && lastExit ? lastExit : new Date();
      ageDays = Math.max(0, differenceInDays(endDate, firstEntry));
    }

    let stopLossPct: number | null = null;
    if (trade.stopLoss && trade.stopLoss > 0 && weightedEntry > 0) {
      stopLossPct = ((trade.stopLoss - weightedEntry) / weightedEntry) * 100;
    }

    return {
      id: trade.id,
      symbol: trade.symbol,
      status: trade.status as "OPEN" | "CLOSED",
      tradeType: trade.tradeType,
      entryLegs,
      exitLegs,
      totalEntryQty,
      weightedEntryPrice: weightedEntry,
      exitQty: exitQ,
      exitPrice: exitP,
      exitDateTime: lastExit,
      pnlPct,
      pnlAmount: displayPnl,
      allocationPct,
      ageDays,
      impactPct,
      openQty,
      openCapital,
      stopLossPct,
    };
  });
}

export type LeaderboardInput = {
  trades: Trade[];
  user: User;
};

export type LeaderboardEntry = {
  userId: string;
  userName: string;
  returnPercentage: number;
  maxDrawdown: number;
  winRate: number;
  totalTrades: number;
  profitFactor: number;
  totalNetPnl: number;
  maxCapitalDeployed: number;
  rank?: number;
};

export function buildLeaderboardEntries(entries: LeaderboardInput[]) {
  return entries
    .map(({ trades, user }) => {
      const eligibleTrades = trades.filter(
        (trade) =>
          trade.status === "CLOSED" &&
          trade.capitalUsed >= MIN_COMPETITION_CAPITAL_PER_TRADE,
      );

      if (
        eligibleTrades.length < MIN_COMPETITION_TRADES ||
        !user.emailVerifiedAt ||
        user.approvalStatus !== "APPROVED"
      ) {
        return null;
      }

      const totalNetPnl = eligibleTrades.reduce((sum, trade) => sum + trade.netPnl, 0);
      const maxCapitalDeployed = calculateMaxCapitalDeployed(eligibleTrades);
      const returnPercentage = maxCapitalDeployed > 0 ? (totalNetPnl / maxCapitalDeployed) * 100 : 0;

      return {
        userId: user.id,
        userName: user.name,
        returnPercentage,
        maxDrawdown: calculateMaxDrawdown(eligibleTrades, maxCapitalDeployed),
        winRate: calculateWinRate(eligibleTrades),
        totalTrades: eligibleTrades.length,
        profitFactor: calculateProfitFactor(eligibleTrades),
        totalNetPnl,
        maxCapitalDeployed,
      } as LeaderboardEntry;
    })
    .filter((entry): entry is LeaderboardEntry => entry !== null)
    .sort((left, right) => {
      if (right.returnPercentage !== left.returnPercentage) {
        return right.returnPercentage - left.returnPercentage;
      }
      if (left.maxDrawdown !== right.maxDrawdown) {
        return left.maxDrawdown - right.maxDrawdown;
      }
      return right.winRate - left.winRate;
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function filterTradesByTag<T extends { tags: string }>(trades: T[], tag?: string) {
  if (!tag) return trades;
  const normalizedTag = tag.toLowerCase();
  return trades.filter((trade) => parseTags(trade.tags).some((tradeTag) => tradeTag === normalizedTag));
}

export function getCompetitionWindowTrades(
  trades: Trade[],
  competition: Pick<Competition, "startDate" | "endDate">,
) {
  return trades.filter((trade) => {
    if (trade.status !== "CLOSED") return false;
    const lExit = getLastExitTime(trade);
    if (!lExit) return false;
    return lExit >= competition.startDate && lExit <= competition.endDate;
  });
}

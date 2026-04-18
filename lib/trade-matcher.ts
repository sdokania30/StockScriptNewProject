import { TradeStatusValue } from "./trade-utils";

export type RawTransaction = {
  ticker: string;
  date: Date;
  type: "BUY" | "SELL";
  price: number;
  quantity: number;
};

export type MatchedTrade = {
  ticker: string;
  uniqueKey: number;

  entryDate1: Date;
  entryPrice1: number;
  entryQty1: number;
  entryDate2?: Date | null;
  entryPrice2?: number | null;
  entryQty2?: number | null;
  entryDate3?: Date | null;
  entryPrice3?: number | null;
  entryQty3?: number | null;

  exitDate1?: Date | null;
  exitPrice1?: number | null;
  exitQty1?: number | null;
  exitDate2?: Date | null;
  exitPrice2?: number | null;
  exitQty2?: number | null;
  exitDate3?: Date | null;
  exitPrice3?: number | null;
  exitQty3?: number | null;

  status: TradeStatusValue;
  tradeType: "LONG" | "SHORT";
};

/**
 * Ported from the legacy Python preprocessing script.
 * Groups unlimited linear broker executions into a condensed 3-column architecture.
 * The first two executions remain intact. The 3rd execution (and beyond) are aggregated
 * into a single weighted-average block.
 */
export function aggregateLegs(
  transactions: RawTransaction[],
  prefix: "entry" | "exit"
) {
  const result: Record<string, any> = {};

  if (transactions.length <= 2) {
    transactions.forEach((txn, i) => {
      result[`${prefix}Date${i + 1}`] = txn.date;
      result[`${prefix}Price${i + 1}`] = txn.price;
      result[`${prefix}Qty${i + 1}`] = txn.quantity;
    });
  } else {
    // Populate the first 2 normally
    for (let i = 0; i < 2; i++) {
      result[`${prefix}Date${i + 1}`] = transactions[i].date;
      result[`${prefix}Price${i + 1}`] = transactions[i].price;
      result[`${prefix}Qty${i + 1}`] = transactions[i].quantity;
    }

    // Aggregate remaining (Index 2 and beyond)
    const remaining = transactions.slice(2);
    
    // Find absolute latest date in the remaining block
    const maxDate = remaining.reduce((latest, current) => {
      return current.date > latest ? current.date : latest;
    }, remaining[0].date);

    const totalQty = remaining.reduce((sum, t) => sum + t.quantity, 0);
    
    const weightedSum = remaining.reduce(
      (sum, t) => sum + t.price * t.quantity,
      0
    );
    const weightedAvgPrice = totalQty > 0 ? weightedSum / totalQty : 0;

    result[`${prefix}Date3`] = maxDate;
    result[`${prefix}Price3`] = weightedAvgPrice;
    result[`${prefix}Qty3`] = totalQty;
  }

  return result;
}

/**
 * Parses raw linear broker executions (buys/sells) and groups them temporally into
 * matched Trade rows using FIFO tracking, exactly matching the Python prototype.
 */
export function buildTradesFromTransactions(
  transactions: RawTransaction[]
): MatchedTrade[] {
  // Sort strictly by chronology
  const chronological = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Group by Ticker
  const grouped = chronological.reduce((acc, txn) => {
    if (!acc[txn.ticker]) acc[txn.ticker] = [];
    acc[txn.ticker].push(txn);
    return acc;
  }, {} as Record<string, RawTransaction[]>);

  const matchedTrades: MatchedTrade[] = [];
  let uniqueKey = 1;

  for (const [ticker, group] of Object.entries(grouped)) {
    let currentPositionQty = 0;
    let buyList: RawTransaction[] = [];
    let sellList: RawTransaction[] = [];

    for (const txn of group) {
      if (txn.type === "BUY") {
        buyList.push(txn);
        currentPositionQty += txn.quantity;
      } else if (txn.type === "SELL") {
        sellList.push(txn);
        currentPositionQty -= txn.quantity;

        // If the position is flattened entirely, close the trade loop
        if (Math.abs(currentPositionQty) < 0.0001) {
          const isShort = sellList.length > 0 && (buyList.length === 0 || sellList[0].date < buyList[0].date);
          const entryList = isShort ? sellList : buyList;
          const exitList = isShort ? buyList : sellList;

          const entryDetails = aggregateLegs(entryList, "entry");
          const exitDetails = aggregateLegs(exitList, "exit");

          matchedTrades.push({
            ticker,
            uniqueKey: uniqueKey++,
            status: "CLOSED",
            tradeType: isShort ? "SHORT" : "LONG",
            
            entryDate1: entryDetails.entryDate1,
            entryPrice1: entryDetails.entryPrice1,
            entryQty1: entryDetails.entryQty1,
            entryDate2: entryDetails.entryDate2,
            entryPrice2: entryDetails.entryPrice2,
            entryQty2: entryDetails.entryQty2,
            entryDate3: entryDetails.entryDate3,
            entryPrice3: entryDetails.entryPrice3,
            entryQty3: entryDetails.entryQty3,

            exitDate1: exitDetails.exitDate1,
            exitPrice1: exitDetails.exitPrice1,
            exitQty1: exitDetails.exitQty1,
            exitDate2: exitDetails.exitDate2,
            exitPrice2: exitDetails.exitPrice2,
            exitQty2: exitDetails.exitQty2,
            exitDate3: exitDetails.exitDate3,
            exitPrice3: exitDetails.exitPrice3,
            exitQty3: exitDetails.exitQty3,
          });

          // Reset queues for next execution cycle on the same ticker
          buyList = [];
          sellList = [];
          currentPositionQty = 0;
        }
      }
    }

    // After parsing the group, if there are still active legs, 
    // export them as an OPEN trade.
    if (buyList.length > 0 || sellList.length > 0) {
      const isShort = sellList.length > 0 && (buyList.length === 0 || sellList[0].date < buyList[0].date);
      const entryList = isShort ? sellList : buyList;
      const exitList = isShort ? buyList : sellList;

      const entryDetails = aggregateLegs(entryList, "entry");
      const exitDetails = aggregateLegs(exitList, "exit"); 

      matchedTrades.push({
        ticker,
        uniqueKey: uniqueKey++,
        status: "OPEN",
        tradeType: isShort ? "SHORT" : "LONG",
        
        entryDate1: entryDetails.entryDate1,
        entryPrice1: entryDetails.entryPrice1,
        entryQty1: entryDetails.entryQty1,
        entryDate2: entryDetails.entryDate2,
        entryPrice2: entryDetails.entryPrice2,
        entryQty2: entryDetails.entryQty2,
        entryDate3: entryDetails.entryDate3,
        entryPrice3: entryDetails.entryPrice3,
        entryQty3: entryDetails.entryQty3,

        exitDate1: exitDetails.exitDate1,
        exitPrice1: exitDetails.exitPrice1,
        exitQty1: exitDetails.exitQty1,
        exitDate2: exitDetails.exitDate2,
        exitPrice2: exitDetails.exitPrice2,
        exitQty2: exitDetails.exitQty2,
        exitDate3: exitDetails.exitDate3,
        exitPrice3: exitDetails.exitPrice3,
        exitQty3: exitDetails.exitQty3,
      });
    }
  }

  return matchedTrades;
}

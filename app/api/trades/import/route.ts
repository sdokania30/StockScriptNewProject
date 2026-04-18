import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { csvToTransactions, parseCSVText, detectBrokerProfile, BROKER_PROFILES } from "@/lib/csv-parser";
import { buildTradesFromTransactions } from "@/lib/trade-matcher";
import { calculateTradeMetrics, getWeightedEntryPrice, getTotalEntryQty } from "@/lib/trade-utils";

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const json = await request.json();
    const { csvText, brokerKey, competitionId, segment } = json as {
      csvText: string;
      brokerKey?: string;
      competitionId?: string;
      segment?: string;
    };

    if (!csvText || csvText.trim().length === 0) {
      return NextResponse.json({ error: "CSV text is empty." }, { status: 400 });
    }

    // Parse CSV
    const rows = parseCSVText(csvText);
    if (rows.length < 2) {
      return NextResponse.json(
        { error: "CSV must contain a header row and at least one data row." },
        { status: 400 }
      );
    }

    // Detect or use specified broker profile
    const detectedKey = brokerKey || detectBrokerProfile(rows[0]);
    const profile = BROKER_PROFILES[detectedKey] || BROKER_PROFILES.generic;

    // Convert CSV to transactions
    const { transactions, errors: parseErrors } = csvToTransactions(rows, profile);

    if (transactions.length === 0) {
      return NextResponse.json(
        {
          error: "No valid transactions found in CSV.",
          parseErrors,
        },
        { status: 400 }
      );
    }

    // Match transactions into trades using FIFO engine
    const matchedTrades = buildTradesFromTransactions(transactions);

    if (matchedTrades.length === 0) {
      return NextResponse.json(
        { error: "No trades could be matched from the transactions." },
        { status: 400 }
      );
    }

    // Validate competition membership if specified
    if (competitionId) {
      const participant = await prisma.competitionParticipant.findUnique({
        where: {
          competitionId_userId: {
            competitionId,
            userId: user.id,
          },
        },
      });
      if (!participant) {
        return NextResponse.json(
          { error: "Join the competition before importing competition trades." },
          { status: 400 }
        );
      }
    }

    // Get current row count for sequential indexing
    const currentCount = await prisma.trade.count({
      where: { userId: user.id },
    });

    // Bulk create all matched trades
    const createdTrades = [];
    let rowIndex = currentCount;

    for (const matched of matchedTrades) {
      rowIndex++;

      const tradeData: any = {
        userId: user.id,
        competitionId: competitionId || null,
        symbol: matched.ticker,
        segment: segment || "EQUITY",
        tradeType: matched.tradeType || "LONG",
        status: matched.status,
        rowIndex,
        tags: "",
        notes: "",
        charges: 0,

        entryPrice1: matched.entryPrice1,
        entryQty1: matched.entryQty1,
        entryTime1: matched.entryDate1,
        entryPrice2: matched.entryPrice2 ?? null,
        entryQty2: matched.entryQty2 ?? null,
        entryTime2: matched.entryDate2 ?? null,
        entryPrice3: matched.entryPrice3 ?? null,
        entryQty3: matched.entryQty3 ?? null,
        entryTime3: matched.entryDate3 ?? null,

        exitPrice1: matched.exitPrice1 ?? null,
        exitQty1: matched.exitQty1 ?? null,
        exitTime1: matched.exitDate1 ?? null,
        exitPrice2: matched.exitPrice2 ?? null,
        exitQty2: matched.exitQty2 ?? null,
        exitTime2: matched.exitDate2 ?? null,
        exitPrice3: matched.exitPrice3 ?? null,
        exitQty3: matched.exitQty3 ?? null,
        exitTime3: matched.exitDate3 ?? null,

        closingPrice: null,
        stopLoss: null,
      };

      // Calculate derived metrics
      const metrics = calculateTradeMetrics(tradeData);
      tradeData.capitalUsed = metrics.capitalUsed;
      tradeData.netPnl = metrics.realizedPnl;
      tradeData.lockedAt = matched.status === "CLOSED" ? new Date() : null;

      const trade = await prisma.trade.create({ data: tradeData });
      createdTrades.push(trade);
    }

    return NextResponse.json(
      {
        imported: createdTrades.length,
        open: createdTrades.filter((t) => t.status === "OPEN").length,
        closed: createdTrades.filter((t) => t.status === "CLOSED").length,
        brokerDetected: profile.name,
        parseErrors: parseErrors.length > 0 ? parseErrors : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to import trades.",
      },
      { status: 400 }
    );
  }
}

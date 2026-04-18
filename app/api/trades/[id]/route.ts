import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateTradeMetrics,
  normalizeTradePayload,
  tradePayloadSchema,
} from "@/lib/trade-utils";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireActiveUser();
    const json = await request.json();
    const parsed = tradePayloadSchema.parse(json);
    const payload = normalizeTradePayload(parsed);
    const metrics = calculateTradeMetrics(payload as any);

    const existingTrade = await prisma.trade.findUnique({
      where: { id: params.id, userId: user.id },
    });

    if (!existingTrade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    if (payload.competitionId) {
      const participant = await prisma.competitionParticipant.findUnique({
        where: {
          competitionId_userId: {
            competitionId: payload.competitionId,
            userId: user.id,
          },
        },
      });

      if (!participant) {
        return NextResponse.json(
          { error: "Join the competition before posting a competition trade." },
          { status: 400 },
        );
      }
    }

    // Update the trade, allowing the user to change *any* value
    const trade = await prisma.trade.update({
      where: { id: existingTrade.id },
      data: {
        ...payload,
        entryTime1: new Date(payload.entryTime1),
        entryTime2: payload.entryTime2 ? new Date(payload.entryTime2) : null,
        entryTime3: payload.entryTime3 ? new Date(payload.entryTime3) : null,
        exitTime1: payload.exitTime1 ? new Date(payload.exitTime1) : null,
        exitTime2: payload.exitTime2 ? new Date(payload.exitTime2) : null,
        exitTime3: payload.exitTime3 ? new Date(payload.exitTime3) : null,
        capitalUsed: metrics.capitalUsed,
        netPnl: metrics.realizedPnl,
        lockedAt: payload.status === "CLOSED" ? new Date() : null, // Assuming editing is always allowed now
      },
    });

    return NextResponse.json({ trade });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update trade.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await requireActiveUser();

    const existingTrade = await prisma.trade.findUnique({
      where: { id: params.id, userId: user.id },
    });

    if (!existingTrade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 });
    }

    await prisma.trade.delete({
      where: { id: existingTrade.id },
    });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to delete trade.",
      },
      { status: 400 },
    );
  }
}

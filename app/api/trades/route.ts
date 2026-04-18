import { NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateTradeMetrics,
  normalizeTradePayload,
  tradePayloadSchema,
} from "@/lib/trade-utils";

export async function GET() {
  const user = await requireActiveUser();

  const trades = await prisma.trade.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      entryTime1: "desc",
    },
    include: {
      images: true,
      competition: true,
      user: true,
    },
  });

  return NextResponse.json({ trades });
}

export async function POST(request: Request) {
  try {
    const user = await requireActiveUser();
    const json = await request.json();
    const parsed = tradePayloadSchema.parse(json);
    const payload = normalizeTradePayload(parsed);
    const metrics = calculateTradeMetrics(payload as any);

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

    const previousCount = await prisma.trade.count({
      where: { userId: user.id },
    });

    const trade = await prisma.trade.create({
      data: {
        ...payload,
        userId: user.id,
        rowIndex: previousCount + 1,
        entryTime1: new Date(payload.entryTime1),
        entryTime2: payload.entryTime2 ? new Date(payload.entryTime2) : null,
        entryTime3: payload.entryTime3 ? new Date(payload.entryTime3) : null,
        exitTime1: payload.exitTime1 ? new Date(payload.exitTime1) : null,
        exitTime2: payload.exitTime2 ? new Date(payload.exitTime2) : null,
        exitTime3: payload.exitTime3 ? new Date(payload.exitTime3) : null,
        capitalUsed: metrics.capitalUsed,
        netPnl: metrics.realizedPnl,
        lockedAt: payload.status === "CLOSED" ? new Date() : null,
      },
    });

    return NextResponse.json({ trade }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create trade.",
      },
      { status: 400 },
    );
  }
}

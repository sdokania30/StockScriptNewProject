import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/password";
import {
  SegmentValue,
  TradeStatusValue,
  TradeTypeValue,
  calculateTradeMetrics,
} from "../lib/trade-utils";

const prisma = new PrismaClient();

type TradeSeed = {
  userId: string;
  competitionId: string;
  rowIndex: number;
  symbol: string;
  segment: SegmentValue;
  tradeType: TradeTypeValue;
  entryPrice1: number;
  exitPrice1: number | null;
  closingPrice: number | null;
  entryQty1: number;
  charges: number;
  entryTime1: Date;
  exitTime1: Date | null;
  status: TradeStatusValue;
  tags: string;
  notes: string;
};

async function main() {
  await prisma.tradeImage.deleteMany();
  await prisma.userCompetitionStat.deleteMany();
  await prisma.competitionParticipant.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.emailVerificationToken.deleteMany();
  await prisma.session.deleteMany();
  await prisma.competition.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin Desk",
      email: "admin@stockscript.dev",
      passwordHash: hashPassword("Admin@12345"),
      role: "ADMIN",
      emailVerifiedAt: new Date("2026-04-01T09:00:00.000Z"),
      approvalStatus: "APPROVED",
      approvedAt: new Date("2026-04-01T09:00:00.000Z"),
      isActive: true,
    },
  });

  const traders = await prisma.$transaction([
    prisma.user.create({
      data: {
        name: "Aarav Mehta",
        email: "aarav@stockscript.dev",
        passwordHash: hashPassword("Trader@123"),
        role: "TRADER",
        emailVerifiedAt: new Date("2026-04-02T08:00:00.000Z"),
        approvalStatus: "APPROVED",
        approvedAt: new Date("2026-04-02T10:00:00.000Z"),
        approvedBy: admin.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Mira Shah",
        email: "mira@stockscript.dev",
        passwordHash: hashPassword("Trader@123"),
        role: "TRADER",
        emailVerifiedAt: new Date("2026-04-02T08:20:00.000Z"),
        approvalStatus: "APPROVED",
        approvedAt: new Date("2026-04-02T10:05:00.000Z"),
        approvedBy: admin.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Kabir Nair",
        email: "kabir@stockscript.dev",
        passwordHash: hashPassword("Trader@123"),
        role: "TRADER",
        emailVerifiedAt: new Date("2026-04-02T08:40:00.000Z"),
        approvalStatus: "APPROVED",
        approvedAt: new Date("2026-04-02T10:15:00.000Z"),
        approvedBy: admin.id,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Riya Jain",
        email: "riya@stockscript.dev",
        passwordHash: hashPassword("Trader@123"),
        role: "TRADER",
        emailVerifiedAt: new Date("2026-04-15T09:00:00.000Z"),
        approvalStatus: "PENDING",
        isActive: false,
      },
    }),
  ]);

  const springSprint = await prisma.competition.create({
    data: {
      name: "April Momentum Sprint",
      startDate: new Date("2026-04-01T00:00:00.000Z"),
      endDate: new Date("2026-04-30T23:59:59.999Z"),
      visibility: "PUBLIC",
      createdBy: traders[0].id,
      participants: {
        create: traders.slice(0, 3).map((user) => ({
          userId: user.id,
        })),
      },
    },
  });

  const tradeBlueprints: TradeSeed[] = [
    {
      userId: traders[0].id,
      competitionId: springSprint.id,
      rowIndex: 1,
      symbol: "RELIANCE",
      segment: "EQUITY",
      tradeType: "LONG",
      entryPrice1: 2420,
      exitPrice1: 2488,
      closingPrice: 2488,
      entryQty1: 20,
      charges: 54,
      entryTime1: new Date("2026-04-03T03:55:00.000Z"),
      exitTime1: new Date("2026-04-03T06:10:00.000Z"),
      status: "CLOSED",
      tags: "breakout,swing",
      notes: "Clean daily breakout with retest entry.",
    },
    {
      userId: traders[0].id,
      competitionId: springSprint.id,
      rowIndex: 2,
      symbol: "INFY",
      segment: "INTRADAY",
      tradeType: "SHORT",
      entryPrice1: 1510,
      exitPrice1: 1484,
      closingPrice: 1481,
      entryQty1: 40,
      charges: 66,
      entryTime1: new Date("2026-04-05T04:05:00.000Z"),
      exitTime1: new Date("2026-04-05T07:15:00.000Z"),
      status: "CLOSED",
      tags: "opening-drive,mean-reversion",
      notes: "Strong downside drive from first hour structure.",
    },
    {
      userId: traders[0].id,
      competitionId: springSprint.id,
      rowIndex: 3,
      symbol: "NIFTY26APR24000CE",
      segment: "OPTIONS",
      tradeType: "LONG",
      entryPrice1: 122,
      exitPrice1: 146,
      closingPrice: 144,
      entryQty1: 150,
      charges: 88,
      entryTime1: new Date("2026-04-08T05:10:00.000Z"),
      exitTime1: new Date("2026-04-08T07:25:00.000Z"),
      status: "CLOSED",
      tags: "event-day,options-scalp",
      notes: "Momentum continuation after range expansion.",
    },
    {
      userId: traders[0].id,
      competitionId: springSprint.id,
      rowIndex: 4,
      symbol: "HDFCBANK",
      segment: "FUTURES",
      tradeType: "SHORT",
      entryPrice1: 1678,
      exitPrice1: 1644,
      closingPrice: 1641,
      entryQty1: 45,
      charges: 92,
      entryTime1: new Date("2026-04-12T03:45:00.000Z"),
      exitTime1: new Date("2026-04-12T06:40:00.000Z"),
      status: "CLOSED",
      tags: "trend-day",
      notes: "Lower high rejection on hourly structure.",
    },
    {
      userId: traders[0].id,
      competitionId: springSprint.id,
      rowIndex: 5,
      symbol: "SBIN",
      segment: "EQUITY",
      tradeType: "LONG",
      entryPrice1: 824,
      exitPrice1: null,
      closingPrice: 836,
      entryQty1: 90,
      charges: 52,
      entryTime1: new Date("2026-04-16T04:20:00.000Z"),
      exitTime1: null,
      status: "OPEN",
      tags: "swing,open-position",
      notes: "Holding overnight with manual closing price entered for mark-to-market.",
    },
    {
      userId: traders[1].id,
      competitionId: springSprint.id,
      rowIndex: 1,
      symbol: "SBIN",
      segment: "EQUITY",
      tradeType: "LONG",
      entryPrice1: 812,
      exitPrice1: 836,
      closingPrice: 836,
      entryQty1: 100,
      charges: 54,
      entryTime1: new Date("2026-04-02T04:00:00.000Z"),
      exitTime1: new Date("2026-04-02T06:05:00.000Z"),
      status: "CLOSED",
      tags: "range-break",
      notes: "Textbook range break from base.",
    },
    {
      userId: traders[1].id,
      competitionId: springSprint.id,
      rowIndex: 2,
      symbol: "ICICIBANK",
      segment: "INTRADAY",
      tradeType: "SHORT",
      entryPrice1: 1096,
      exitPrice1: 1110,
      closingPrice: 1112,
      entryQty1: 70,
      charges: 72,
      entryTime1: new Date("2026-04-07T04:20:00.000Z"),
      exitTime1: new Date("2026-04-07T07:05:00.000Z"),
      status: "CLOSED",
      tags: "counter-trend",
      notes: "Fade idea failed after sector strength.",
    },
    {
      userId: traders[1].id,
      competitionId: springSprint.id,
      rowIndex: 3,
      symbol: "NIFTY26APR24100PE",
      segment: "OPTIONS",
      tradeType: "LONG",
      entryPrice1: 98,
      exitPrice1: 132,
      closingPrice: 130,
      entryQty1: 150,
      charges: 84,
      entryTime1: new Date("2026-04-09T05:00:00.000Z"),
      exitTime1: new Date("2026-04-09T06:55:00.000Z"),
      status: "CLOSED",
      tags: "gap-fill,options-scalp",
      notes: "Momentum expanded faster than expected.",
    },
    {
      userId: traders[1].id,
      competitionId: springSprint.id,
      rowIndex: 4,
      symbol: "LT",
      segment: "EQUITY",
      tradeType: "LONG",
      entryPrice1: 3570,
      exitPrice1: 3624,
      closingPrice: 3618,
      entryQty1: 12,
      charges: 44,
      entryTime1: new Date("2026-04-13T03:50:00.000Z"),
      exitTime1: new Date("2026-04-13T08:10:00.000Z"),
      status: "CLOSED",
      tags: "pullback",
      notes: "Pullback into prior breakout level.",
    },
    {
      userId: traders[1].id,
      competitionId: springSprint.id,
      rowIndex: 5,
      symbol: "BAJFINANCE",
      segment: "FUTURES",
      tradeType: "SHORT",
      entryPrice1: 7210,
      exitPrice1: 7166,
      closingPrice: 7160,
      entryQty1: 8,
      charges: 79,
      entryTime1: new Date("2026-04-15T04:05:00.000Z"),
      exitTime1: new Date("2026-04-15T06:30:00.000Z"),
      status: "CLOSED",
      tags: "trend-day,futures",
      notes: "Held until the final impulse break.",
    },
    {
      userId: traders[2].id,
      competitionId: springSprint.id,
      rowIndex: 1,
      symbol: "TATAMOTORS",
      segment: "INTRADAY",
      tradeType: "SHORT",
      entryPrice1: 968,
      exitPrice1: 943,
      closingPrice: 945,
      entryQty1: 90,
      charges: 63,
      entryTime1: new Date("2026-04-06T04:12:00.000Z"),
      exitTime1: new Date("2026-04-06T06:42:00.000Z"),
      status: "CLOSED",
      tags: "opening-drive",
      notes: "Best trade of the day after weak open reclaim failed.",
    },
    {
      userId: traders[2].id,
      competitionId: springSprint.id,
      rowIndex: 2,
      symbol: "NIFTY26APR23950CE",
      segment: "OPTIONS",
      tradeType: "LONG",
      entryPrice1: 88,
      exitPrice1: 81,
      closingPrice: 79,
      entryQty1: 150,
      charges: 77,
      entryTime1: new Date("2026-04-11T05:25:00.000Z"),
      exitTime1: new Date("2026-04-11T06:48:00.000Z"),
      status: "CLOSED",
      tags: "event-day",
      notes: "Stopped after IV crush and failed breakout.",
    },
    {
      userId: traders[2].id,
      competitionId: springSprint.id,
      rowIndex: 3,
      symbol: "SUNPHARMA",
      segment: "EQUITY",
      tradeType: "LONG",
      entryPrice1: 1655,
      exitPrice1: 1714,
      closingPrice: 1708,
      entryQty1: 32,
      charges: 58,
      entryTime1: new Date("2026-04-14T03:42:00.000Z"),
      exitTime1: new Date("2026-04-14T08:16:00.000Z"),
      status: "CLOSED",
      tags: "swing,breakout",
      notes: "Continuation after multi-day base.",
    },
    {
      userId: traders[2].id,
      competitionId: springSprint.id,
      rowIndex: 4,
      symbol: "MARUTI",
      segment: "FUTURES",
      tradeType: "SHORT",
      entryPrice1: 11840,
      exitPrice1: 11765,
      closingPrice: 11770,
      entryQty1: 6,
      charges: 74,
      entryTime1: new Date("2026-04-16T03:35:00.000Z"),
      exitTime1: new Date("2026-04-16T06:15:00.000Z"),
      status: "CLOSED",
      tags: "mean-reversion,futures",
      notes: "Captured reversion from stretched opening move.",
    },
    {
      userId: traders[2].id,
      competitionId: springSprint.id,
      rowIndex: 5,
      symbol: "AXISBANK",
      segment: "EQUITY",
      tradeType: "LONG",
      entryPrice1: 1142,
      exitPrice1: null,
      closingPrice: 1138,
      entryQty1: 60,
      charges: 41,
      entryTime1: new Date("2026-04-16T05:00:00.000Z"),
      exitTime1: null,
      status: "OPEN",
      tags: "breakout,overnight",
      notes: "Still open into close; closing price used for journal MTM.",
    },
  ];

  for (const blueprint of tradeBlueprints) {
    const metrics = calculateTradeMetrics({
      entryPrice1: blueprint.entryPrice1,
      exitPrice1: blueprint.exitPrice1,
      closingPrice: blueprint.closingPrice,
      entryQty1: blueprint.entryQty1,
      charges: blueprint.charges,
      tradeType: blueprint.tradeType,
      status: blueprint.status,
    });

    await prisma.trade.create({
      data: {
        ...blueprint,
        capitalUsed: metrics.capitalUsed,
        netPnl: metrics.realizedPnl,
        lockedAt: blueprint.status === "CLOSED" ? new Date() : null,
      },
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

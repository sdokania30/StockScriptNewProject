import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import {
  buildDashboardMetrics,
  buildJournalRows,
  buildGroupedJournalRows,
  buildLeaderboardEntries,
  filterTradesByTag,
  getCompetitionWindowTrades,
  groupTradesBySymbol,
} from "./trade-utils";

type TradeFilters = {
  from?: string;
  to?: string;
  symbol?: string;
  tag?: string;
  status?: string;
  minQty?: string;
  sort?: string;
};

function buildTradeWhere(userId: string, filters: TradeFilters): Prisma.TradeWhereInput {
  const where: Prisma.TradeWhereInput = { userId };

  if (filters.status && filters.status !== "ALL") {
    where.status = filters.status;
  }

  if (filters.symbol) {
    where.symbol = {
      contains: filters.symbol.trim().toUpperCase(),
    };
  }

  if (filters.minQty) {
    where.entryQty1 = {
      gte: Number(filters.minQty),
    };
  }

  if (filters.from || filters.to) {
    where.entryTime1 = {};

    if (filters.from) {
      where.entryTime1.gte = new Date(filters.from);
    }

    if (filters.to) {
      where.entryTime1.lte = new Date(filters.to);
    }
  }

  return where;
}

export async function getCompetitions() {
  return prisma.competition.findMany({
    include: {
      creator: true,
      participants: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      startDate: "desc",
    },
  });
}

export async function getDashboardData(userId: string) {
  const trades = await prisma.trade.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      images: true,
      competition: true,
    },
  });

  const closedTrades = trades.filter((trade) => trade.status === "CLOSED");
  const openTrades = trades.filter((trade) => trade.status === "OPEN");

  return {
    trades,
    openTrades,
    closedTrades,
    groupedTrades: groupTradesBySymbol(closedTrades),
    metrics: buildDashboardMetrics(trades),
  };
}

export async function getJournalData(userId: string, filters: TradeFilters) {
  const trades = filterTradesByTag(
    await prisma.trade.findMany({
      where: buildTradeWhere(userId, filters),
      orderBy: [
        {
          entryTime1: filters.sort === "ASC" ? "asc" : "desc",
        },
      ],
      include: {
        competition: true,
        images: true,
        user: true,
      },
    }),
    filters.tag,
  );

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { portfolioCapital: true }
  });

  return {
    trades,
    rows: buildJournalRows(trades, user?.portfolioCapital ?? 100000),
    groupedRows: buildGroupedJournalRows(trades, user?.portfolioCapital ?? 100000),
  };
}

export async function getTradesBySymbol(
  userId: string,
  symbol: string,
  filters: Pick<TradeFilters, "from" | "to" | "tag">,
) {
  const trades = filterTradesByTag(
    await prisma.trade.findMany({
      where: {
        ...buildTradeWhere(userId, filters),
        symbol: symbol.toUpperCase(),
      },
      orderBy: {
        entryTime1: "desc",
      },
      include: {
        user: true,
        images: true,
        competition: true,
      },
    }),
    filters.tag,
  );

  return {
    symbol: symbol.toUpperCase(),
    trades,
    metrics: buildDashboardMetrics(trades),
  };
}

export async function getLeaderboard(competitionId: string) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      participants: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!competition) {
    return null;
  }

  const trades = await prisma.trade.findMany({
    where: {
      competitionId,
      status: "CLOSED",
      exitTime1: {
        gte: competition.startDate,
        lte: competition.endDate,
      },
    },
    orderBy: {
      exitTime1: "asc",
    },
  });

  const entries = buildLeaderboardEntries(
    competition.participants.map((participant) => ({
      user: participant.user,
      trades: getCompetitionWindowTrades(
        trades.filter((trade) => trade.userId === participant.userId),
        competition,
      ),
    })),
  );

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.userCompetitionStat.upsert({
        where: {
          userId_competitionId: {
            userId: entry.userId,
            competitionId,
          },
        },
        create: {
          userId: entry.userId,
          competitionId,
          totalNetPnl: entry.totalNetPnl,
          maxCapitalDeployed: entry.maxCapitalDeployed,
          returnPercentage: entry.returnPercentage,
          maxDrawdown: entry.maxDrawdown,
          winRate: entry.winRate,
          totalTrades: entry.totalTrades,
          profitFactor: entry.profitFactor,
        },
        update: {
          totalNetPnl: entry.totalNetPnl,
          maxCapitalDeployed: entry.maxCapitalDeployed,
          returnPercentage: entry.returnPercentage,
          maxDrawdown: entry.maxDrawdown,
          winRate: entry.winRate,
          totalTrades: entry.totalTrades,
          profitFactor: entry.profitFactor,
        },
      }),
    ),
  );

  return {
    competition,
    entries,
  };
}

export async function getPendingUsers() {
  return prisma.user.findMany({
    where: {
      role: "TRADER",
      approvalStatus: "PENDING",
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

export async function getTraderCompetitionTrades(competitionId: string, userId: string) {
  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
  });

  if (!competition) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true },
  });

  if (!user) return null;

  const trades = await prisma.trade.findMany({
    where: {
      competitionId,
      userId,
      status: "CLOSED",
    },
    orderBy: {
      exitTime1: "desc",
    },
    include: {
      user: true,
      images: true,
      competition: true,
    },
  });

  return {
    competition,
    user,
    trades,
  };
}

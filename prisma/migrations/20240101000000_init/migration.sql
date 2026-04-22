-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TRADER',
    "emailVerifiedAt" TIMESTAMP(3),
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "portfolioCapital" DOUBLE PRECISION NOT NULL DEFAULT 100000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trade" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competitionId" TEXT,
    "symbol" TEXT NOT NULL,
    "segment" TEXT NOT NULL,
    "tradeType" TEXT NOT NULL,
    "closingPrice" DOUBLE PRECISION,
    "stopLoss" DOUBLE PRECISION,
    "charges" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capitalUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rowIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "tags" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "firstEntryAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TradeImage" (
    "id" TEXT NOT NULL,
    "tradeId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TradeImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "visibility" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionParticipant" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionRequest" (
    "id" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "CompetitionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompetitionStat" (
    "userId" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "totalNetPnl" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxCapitalDeployed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "returnPercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "maxDrawdown" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalTrades" INTEGER NOT NULL DEFAULT 0,
    "profitFactor" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompetitionStat_pkey" PRIMARY KEY ("userId","competitionId")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_role_approvalStatus_isActive_idx" ON "User"("role", "approvalStatus", "isActive");

-- CreateIndex
CREATE INDEX "Trade_userId_status_firstEntryAt_idx" ON "Trade"("userId", "status", "firstEntryAt");
CREATE INDEX "Trade_competitionId_status_firstEntryAt_idx" ON "Trade"("competitionId", "status", "firstEntryAt");
CREATE INDEX "Trade_symbol_userId_idx" ON "Trade"("symbol", "userId");

-- CreateIndex
CREATE INDEX "Transaction_tradeId_type_dateTime_idx" ON "Transaction"("tradeId", "type", "dateTime");

-- CreateIndex
CREATE INDEX "TradeImage_tradeId_idx" ON "TradeImage"("tradeId");

-- CreateIndex
CREATE INDEX "Competition_startDate_endDate_idx" ON "Competition"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionParticipant_competitionId_userId_key" ON "CompetitionParticipant"("competitionId", "userId");
CREATE INDEX "CompetitionParticipant_competitionId_idx" ON "CompetitionParticipant"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetitionRequest_competitionId_userId_key" ON "CompetitionRequest"("competitionId", "userId");
CREATE INDEX "CompetitionRequest_competitionId_status_idx" ON "CompetitionRequest"("competitionId", "status");

-- CreateIndex
CREATE INDEX "UserCompetitionStat_competitionId_returnPercentage_maxDrawdown_winRate_idx" ON "UserCompetitionStat"("competitionId", "returnPercentage", "maxDrawdown", "winRate");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");
CREATE INDEX "Session_userId_expiresAt_idx" ON "Session"("userId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_token_key" ON "EmailVerificationToken"("token");
CREATE INDEX "EmailVerificationToken_userId_email_expiresAt_idx" ON "EmailVerificationToken"("userId", "email", "expiresAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_approvedBy_fkey" FOREIGN KEY ("approvedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trade" ADD CONSTRAINT "Trade_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradeImage" ADD CONSTRAINT "TradeImage_tradeId_fkey" FOREIGN KEY ("tradeId") REFERENCES "Trade"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competition" ADD CONSTRAINT "Competition_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionParticipant" ADD CONSTRAINT "CompetitionParticipant_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionParticipant" ADD CONSTRAINT "CompetitionParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRequest" ADD CONSTRAINT "CompetitionRequest_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionRequest" ADD CONSTRAINT "CompetitionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompetitionStat" ADD CONSTRAINT "UserCompetitionStat_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompetitionStat" ADD CONSTRAINT "UserCompetitionStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

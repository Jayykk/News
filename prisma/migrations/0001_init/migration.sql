-- Enable uuid generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE "RawNews" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "source" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT,
    "content" TEXT NOT NULL,
    "publishedAt" TIMESTAMPTZ,
    "receivedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "NewsAnalysis" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "rawNewsId" UUID NOT NULL UNIQUE,
    "summary" TEXT,
    "sentiment" TEXT,
    "sentimentScore" DOUBLE PRECISION,
    "tags" TEXT[] NOT NULL DEFAULT '{}',
    "insights" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "NewsAnalysis_rawNewsId_fkey" FOREIGN KEY ("rawNewsId") REFERENCES "RawNews"("id") ON DELETE CASCADE
);

CREATE TABLE "Signal" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "newsAnalysisId" UUID NOT NULL,
    "signalType" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Signal_newsAnalysisId_fkey" FOREIGN KEY ("newsAnalysisId") REFERENCES "NewsAnalysis"("id") ON DELETE CASCADE
);

CREATE TABLE "Alert" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "signalId" UUID NOT NULL,
    "channel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "triggeredAt" TIMESTAMPTZ,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "Alert_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE CASCADE
);

CREATE TABLE "SignalConfig" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL UNIQUE,
    "description" TEXT,
    "parameters" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE "MarketSnapshot" (
    "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "symbol" TEXT NOT NULL,
    "price" DECIMAL(18,6) NOT NULL,
    "changePct" DECIMAL(10,4),
    "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "metadata" JSONB
);

CREATE INDEX "Signal_newsAnalysisId_idx" ON "Signal" ("newsAnalysisId");
CREATE INDEX "Alert_signalId_idx" ON "Alert" ("signalId");
CREATE INDEX "MarketSnapshot_symbol_capturedAt_idx" ON "MarketSnapshot" ("symbol", "capturedAt");

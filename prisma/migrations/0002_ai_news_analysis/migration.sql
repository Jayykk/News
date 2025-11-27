-- Add AI-driven analysis fields to NewsAnalysis
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "veracityLevel" TEXT;
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "veracityConfidence" DOUBLE PRECISION;
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "impactPolarity" TEXT;
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "impactMagnitude" TEXT;
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "predictedDirection" TEXT;
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "predictedHorizon" TEXT;
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "predictedAbsMove1h" DOUBLE PRECISION;
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "aiModel" TEXT;
ALTER TABLE "NewsAnalysis" ADD COLUMN IF NOT EXISTS "aiRaw" JSONB;

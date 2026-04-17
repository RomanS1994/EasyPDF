ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'pending';

ALTER TABLE "subscriptions"
  ADD COLUMN "pendingPlanId" TEXT,
  ADD COLUMN "pendingRequestedAt" TIMESTAMP(3),
  ADD COLUMN "pendingSource" TEXT;

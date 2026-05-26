ALTER TABLE "orders"
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "createdBySnapshot" JSONB;

ALTER TABLE "archived_orders"
ADD COLUMN "createdByUserId" TEXT,
ADD COLUMN "createdBySnapshot" JSONB;

UPDATE "orders" AS o
SET
  "createdByUserId" = o."userId",
  "createdBySnapshot" = jsonb_build_object(
    'id', u."id",
    'name', u."name",
    'email', u."email"
  )
FROM "users" AS u
WHERE o."userId" = u."id"
  AND o."createdByUserId" IS NULL;

UPDATE "archived_orders" AS o
SET
  "createdByUserId" = o."userId",
  "createdBySnapshot" = jsonb_build_object(
    'id', u."id",
    'name', u."name",
    'email', u."email"
  )
FROM "users" AS u
WHERE o."userId" = u."id"
  AND o."createdByUserId" IS NULL;

CREATE TABLE "order_offers" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "fromUserId" TEXT NOT NULL,
  "createdByUserId" TEXT,
  "targetType" TEXT NOT NULL,
  "targetUserId" TEXT,
  "targetTeamId" TEXT,
  "targetTeamName" TEXT,
  "status" TEXT NOT NULL DEFAULT 'open',
  "expiresAt" TIMESTAMP(3),
  "acceptedByUserId" TEXT,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "order_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_offer_targets" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "respondedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "order_offer_targets_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "orders_createdByUserId_idx" ON "orders"("createdByUserId");
CREATE INDEX "archived_orders_createdByUserId_idx" ON "archived_orders"("createdByUserId");

CREATE INDEX "order_offers_orderId_idx" ON "order_offers"("orderId");
CREATE INDEX "order_offers_orderId_status_idx" ON "order_offers"("orderId", "status");
CREATE INDEX "order_offers_fromUserId_idx" ON "order_offers"("fromUserId");
CREATE INDEX "order_offers_createdByUserId_idx" ON "order_offers"("createdByUserId");
CREATE INDEX "order_offers_targetType_idx" ON "order_offers"("targetType");
CREATE INDEX "order_offers_targetUserId_idx" ON "order_offers"("targetUserId");
CREATE INDEX "order_offers_targetTeamId_idx" ON "order_offers"("targetTeamId");
CREATE INDEX "order_offers_status_idx" ON "order_offers"("status");
CREATE INDEX "order_offers_expiresAt_idx" ON "order_offers"("expiresAt");

CREATE UNIQUE INDEX "order_offer_targets_offerId_userId_key" ON "order_offer_targets"("offerId", "userId");
CREATE INDEX "order_offer_targets_offerId_idx" ON "order_offer_targets"("offerId");
CREATE INDEX "order_offer_targets_offerId_status_idx" ON "order_offer_targets"("offerId", "status");
CREATE INDEX "order_offer_targets_userId_idx" ON "order_offer_targets"("userId");
CREATE INDEX "order_offer_targets_userId_status_idx" ON "order_offer_targets"("userId", "status");

ALTER TABLE "orders"
ADD CONSTRAINT "orders_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "archived_orders"
ADD CONSTRAINT "archived_orders_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_offers"
ADD CONSTRAINT "order_offers_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "orders"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_offers"
ADD CONSTRAINT "order_offers_fromUserId_fkey"
FOREIGN KEY ("fromUserId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_offers"
ADD CONSTRAINT "order_offers_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_offers"
ADD CONSTRAINT "order_offers_acceptedByUserId_fkey"
FOREIGN KEY ("acceptedByUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "order_offer_targets"
ADD CONSTRAINT "order_offer_targets_offerId_fkey"
FOREIGN KEY ("offerId") REFERENCES "order_offers"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "order_offer_targets"
ADD CONSTRAINT "order_offer_targets_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;


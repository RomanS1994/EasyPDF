CREATE TABLE "archived_orders" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "customer" JSONB NOT NULL,
  "trip" JSONB NOT NULL,
  "totalPrice" TEXT NOT NULL,
  "pdf" JSONB NOT NULL,
  "contractData" JSONB NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "archived_orders_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "archived_orders_userId_idx" ON "archived_orders"("userId");
CREATE INDEX "archived_orders_status_idx" ON "archived_orders"("status");
CREATE INDEX "archived_orders_orderNumber_idx" ON "archived_orders"("orderNumber");
CREATE INDEX "archived_orders_deletedAt_idx" ON "archived_orders"("deletedAt");
CREATE INDEX "archived_orders_createdAt_idx" ON "archived_orders"("createdAt");

ALTER TABLE "archived_orders"
ADD CONSTRAINT "archived_orders_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

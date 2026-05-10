-- Add flight number to active orders
ALTER TABLE "orders"
ADD COLUMN IF NOT EXISTS "flightNumber" TEXT NOT NULL DEFAULT '';

-- Add flight number to archived orders
ALTER TABLE "archived_orders"
ADD COLUMN IF NOT EXISTS "flightNumber" TEXT NOT NULL DEFAULT '';

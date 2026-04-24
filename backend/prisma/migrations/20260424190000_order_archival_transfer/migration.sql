-- Add soft-delete support for orders so archived orders can be removed from active views.
ALTER TABLE "orders" ADD COLUMN "archivedAt" TIMESTAMP(3);

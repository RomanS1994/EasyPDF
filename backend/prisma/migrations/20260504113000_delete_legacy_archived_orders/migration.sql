DELETE FROM "orders"
WHERE "id" IN (
  SELECT DISTINCT "entityId"
  FROM "audit_logs"
  WHERE "action" = 'order.archived'
    AND "entityType" = 'order'
    AND "entityId" IS NOT NULL
);

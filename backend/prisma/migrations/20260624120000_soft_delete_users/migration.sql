ALTER TABLE "users" ADD COLUMN "businessIco" TEXT;
ALTER TABLE "users" ADD COLUMN "businessDic" TEXT;
ALTER TABLE "users" ADD COLUMN "deletedAt" TIMESTAMP(3);

UPDATE "users"
SET
  "businessIco" = NULLIF(regexp_replace(upper(COALESCE(profile#>>'{driver,ico}', profile#>>'{provider,ico}', '')), '[^A-Z0-9]', '', 'g'), ''),
  "businessDic" = NULLIF(regexp_replace(upper(COALESCE(profile#>>'{driver,dic}', profile#>>'{driver,dicVat}', profile#>>'{provider,dic}', profile#>>'{provider,dicVat}', '')), '[^A-Z0-9]', '', 'g'), '');

UPDATE "users"
SET "businessIco" = NULL
WHERE "businessIco" IN (
  SELECT "businessIco"
  FROM "users"
  WHERE "businessIco" IS NOT NULL
  GROUP BY "businessIco"
  HAVING COUNT(*) > 1
);

UPDATE "users"
SET "businessDic" = NULL
WHERE "businessDic" IN (
  SELECT "businessDic"
  FROM "users"
  WHERE "businessDic" IS NOT NULL
  GROUP BY "businessDic"
  HAVING COUNT(*) > 1
);

CREATE UNIQUE INDEX "users_businessIco_key" ON "users"("businessIco");
CREATE UNIQUE INDEX "users_businessDic_key" ON "users"("businessDic");
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

CREATE TABLE "flight_status_cache" (
  "flightNumber" TEXT NOT NULL,
  "flightDate" TEXT NOT NULL,
  "payload" JSONB,
  "lastAttemptAt" TIMESTAMP(3),
  "refreshedAt" TIMESTAMP(3),
  "nextRefreshAt" TIMESTAMP(3),
  "lockUntil" TIMESTAMP(3),
  "lastError" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "flight_status_cache_pkey" PRIMARY KEY ("flightNumber", "flightDate")
);

CREATE INDEX "flight_status_cache_nextRefreshAt_idx"
ON "flight_status_cache"("nextRefreshAt");

CREATE INDEX "flight_status_cache_lockUntil_idx"
ON "flight_status_cache"("lockUntil");

ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "activeTeamId" TEXT;

CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "team_members" (
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("teamId", "userId")
);

CREATE INDEX IF NOT EXISTS "teams_ownerUserId_idx" ON "teams"("ownerUserId");
CREATE INDEX IF NOT EXISTS "team_members_userId_idx" ON "team_members"("userId");
CREATE INDEX IF NOT EXISTS "users_activeTeamId_idx" ON "users"("activeTeamId");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'teams_ownerUserId_fkey'
    ) THEN
        ALTER TABLE "teams"
        ADD CONSTRAINT "teams_ownerUserId_fkey"
        FOREIGN KEY ("ownerUserId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_members_teamId_fkey'
    ) THEN
        ALTER TABLE "team_members"
        ADD CONSTRAINT "team_members_teamId_fkey"
        FOREIGN KEY ("teamId") REFERENCES "teams"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'team_members_userId_fkey'
    ) THEN
        ALTER TABLE "team_members"
        ADD CONSTRAINT "team_members_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

WITH profile_teams AS (
    SELECT
        u."id" AS "ownerUserId",
        u."id" || '-' || COALESCE(NULLIF(team.value->>'id', ''), 'team-' || team.ordinality::TEXT) AS "id",
        COALESCE(NULLIF(team.value->>'name', ''), 'Team ' || team.ordinality::TEXT) AS "name",
        team.value->'driverIds' AS "driverIds"
    FROM "users" u
    CROSS JOIN LATERAL jsonb_array_elements(
        CASE
            WHEN jsonb_typeof(u."profile"->'teams') = 'array' THEN u."profile"->'teams'
            ELSE '[]'::jsonb
        END
    ) WITH ORDINALITY AS team(value, ordinality)
)
INSERT INTO "teams" ("id", "ownerUserId", "name", "createdAt", "updatedAt")
SELECT "id", "ownerUserId", "name", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM profile_teams
ON CONFLICT ("id") DO NOTHING;

WITH profile_teams AS (
    SELECT
        u."id" AS "ownerUserId",
        u."id" || '-' || COALESCE(NULLIF(team.value->>'id', ''), 'team-' || team.ordinality::TEXT) AS "id",
        team.value->'driverIds' AS "driverIds"
    FROM "users" u
    CROSS JOIN LATERAL jsonb_array_elements(
        CASE
            WHEN jsonb_typeof(u."profile"->'teams') = 'array' THEN u."profile"->'teams'
            ELSE '[]'::jsonb
        END
    ) WITH ORDINALITY AS team(value, ordinality)
),
profile_team_members AS (
    SELECT
        profile_teams."id" AS "teamId",
        member."value" AS "userId"
    FROM profile_teams
    CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE
            WHEN jsonb_typeof(profile_teams."driverIds") = 'array' THEN profile_teams."driverIds"
            ELSE '[]'::jsonb
        END
    ) AS member("value")
    INNER JOIN "users" driver ON driver."id" = member."value"
)
INSERT INTO "team_members" ("teamId", "userId", "createdAt")
SELECT "teamId", "userId", CURRENT_TIMESTAMP
FROM profile_team_members
ON CONFLICT ("teamId", "userId") DO NOTHING;

WITH legacy_team_users AS (
    SELECT u."id" AS "ownerUserId"
    FROM "users" u
    WHERE jsonb_typeof(u."profile"->'teams') IS DISTINCT FROM 'array'
      AND jsonb_typeof(u."profile"->'teamDriverIds') = 'array'
      AND jsonb_array_length(u."profile"->'teamDriverIds') > 0
)
INSERT INTO "teams" ("id", "ownerUserId", "name", "createdAt", "updatedAt")
SELECT
    legacy_team_users."ownerUserId" || '-default',
    legacy_team_users."ownerUserId",
    'My team',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM legacy_team_users
ON CONFLICT ("id") DO NOTHING;

WITH legacy_team_members AS (
    SELECT
        u."id" || '-default' AS "teamId",
        member."value" AS "userId"
    FROM "users" u
    CROSS JOIN LATERAL jsonb_array_elements_text(
        CASE
            WHEN jsonb_typeof(u."profile"->'teamDriverIds') = 'array' THEN u."profile"->'teamDriverIds'
            ELSE '[]'::jsonb
        END
    ) AS member("value")
    INNER JOIN "users" driver ON driver."id" = member."value"
    WHERE jsonb_typeof(u."profile"->'teams') IS DISTINCT FROM 'array'
)
INSERT INTO "team_members" ("teamId", "userId", "createdAt")
SELECT "teamId", "userId", CURRENT_TIMESTAMP
FROM legacy_team_members
ON CONFLICT ("teamId", "userId") DO NOTHING;

UPDATE "users" u
SET "activeTeamId" =
    u."id" || '-' || COALESCE(NULLIF(u."profile"->>'activeTeamId', ''), NULLIF((u."profile"->'teams'->0)->>'id', ''), 'team-1')
WHERE jsonb_typeof(u."profile"->'teams') = 'array'
  AND jsonb_array_length(u."profile"->'teams') > 0;

UPDATE "users" u
SET "activeTeamId" = u."id" || '-default'
WHERE u."activeTeamId" IS NULL
  AND EXISTS (
      SELECT 1 FROM "teams" t WHERE t."ownerUserId" = u."id"
  );

UPDATE "users" u
SET "activeTeamId" = (
    SELECT t."id"
    FROM "teams" t
    WHERE t."ownerUserId" = u."id"
    ORDER BY t."createdAt" ASC, t."id" ASC
    LIMIT 1
)
WHERE u."activeTeamId" IS NULL
   OR NOT EXISTS (
       SELECT 1
       FROM "teams" t
       WHERE t."id" = u."activeTeamId"
         AND t."ownerUserId" = u."id"
   );

UPDATE "users"
SET "profile" = "profile" - 'activeTeamId' - 'teamDriverIds' - 'teams'
WHERE "profile" ? 'activeTeamId'
   OR "profile" ? 'teamDriverIds'
   OR "profile" ? 'teams';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_activeTeamId_fkey'
    ) THEN
        ALTER TABLE "users"
        ADD CONSTRAINT "users_activeTeamId_fkey"
        FOREIGN KEY ("activeTeamId") REFERENCES "teams"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

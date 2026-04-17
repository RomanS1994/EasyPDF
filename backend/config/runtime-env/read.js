import { DEFAULT_ACCESS_TOKEN_TTL_MINUTES } from './constants.js';
import { isPlaceholderLike, normalizeEnvValue } from './helpers.js';

function isExplicitFileStoreRequested() {
  return (
    process.env.DB_MODE === 'file' ||
    Boolean(normalizeEnvValue(process.env.DATA_FILE)) ||
    Boolean(normalizeEnvValue(process.env.LEGACY_DATA_FILE))
  );
}

export function isProductionEnvironment() {
  return normalizeEnvValue(process.env.NODE_ENV) === 'production';
}

export function isExplicitFileStoreMode() {
  return isExplicitFileStoreRequested();
}

export function isLocalFileStoreMode() {
  return isExplicitFileStoreRequested() && !isProductionEnvironment();
}

export function getAuthTokenSecret() {
  const authTokenSecret = normalizeEnvValue(process.env.AUTH_TOKEN_SECRET);

  if (!authTokenSecret || isPlaceholderLike(authTokenSecret)) {
    throw new Error(
      'AUTH_TOKEN_SECRET is required and must be a real secret value.'
    );
  }

  return authTokenSecret;
}

export function getApiKey() {
  return normalizeEnvValue(process.env.API_KEY);
}

export function getDatabaseUrl() {
  return normalizeEnvValue(process.env.DATABASE_URL);
}

export function getDirectDatabaseUrl() {
  return normalizeEnvValue(process.env.DIRECT_DATABASE_URL);
}

export function getPrismaDatasourceUrl() {
  return getDatabaseUrl() || getDirectDatabaseUrl() || undefined;
}

export function getAccessTokenTtlMinutes() {
  return Number(process.env.ACCESS_TOKEN_TTL_MINUTES || DEFAULT_ACCESS_TOKEN_TTL_MINUTES);
}

export function getRuntimeEnvSnapshot() {
  return {
    authTokenSecret: normalizeEnvValue(process.env.AUTH_TOKEN_SECRET),
    apiKey: getApiKey(),
    databaseUrl: getDatabaseUrl(),
    directDatabaseUrl: getDirectDatabaseUrl(),
    explicitFileStoreMode: isExplicitFileStoreRequested(),
    productionEnvironment: isProductionEnvironment(),
  };
}

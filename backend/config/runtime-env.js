const DEFAULT_ACCESS_TOKEN_TTL_MINUTES = 15;
const exactPlaceholderValues = new Set([
  '',
  'user',
  'username',
  'password',
  'pass',
  'host',
  'hostname',
  'database',
  'db',
]);
const placeholderFragments = [
  'change-me',
  'changeme',
  'example',
  'placeholder',
  'replace-with',
  'your-',
  'your_',
  'dummy',
  'sample',
];

function normalizeEnvValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isPlaceholderLike(value) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return true;
  }

  const lowerValue = normalized.toLowerCase();
  if (exactPlaceholderValues.has(lowerValue)) {
    return true;
  }
  if (/^\$\{[^}]+\}$/.test(normalized) || /^\$\{\{[^}]+\}\}$/.test(normalized)) {
    return true;
  }

  return placeholderFragments.some(fragment => lowerValue.includes(fragment));
}

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

function isPlaceholderDatabaseUrl(value) {
  const normalized = normalizeEnvValue(value);
  if (!normalized) {
    return false;
  }

  try {
    const parsed = new URL(normalized);
    const parts = [
      decodeURIComponent(parsed.username),
      decodeURIComponent(parsed.password),
      parsed.hostname,
      parsed.pathname.replace(/^\//, ''),
    ];

    return parts.some(part => isPlaceholderLike(part));
  } catch {
    return false;
  }
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
  return getDirectDatabaseUrl() || getDatabaseUrl() || undefined;
}

export function getAccessTokenTtlMinutes() {
  return Number(process.env.ACCESS_TOKEN_TTL_MINUTES || DEFAULT_ACCESS_TOKEN_TTL_MINUTES);
}

export function validateRuntimeEnv() {
  const errors = [];
  const authTokenSecret = normalizeEnvValue(process.env.AUTH_TOKEN_SECRET);
  const apiKey = getApiKey();
  const databaseUrl = getDatabaseUrl();
  const directDatabaseUrl = getDirectDatabaseUrl();
  const explicitFileStoreMode = isExplicitFileStoreRequested();
  const productionEnvironment = isProductionEnvironment();

  if (!authTokenSecret) {
    errors.push('AUTH_TOKEN_SECRET is required.');
  } else {
    if (isPlaceholderLike(authTokenSecret)) {
      errors.push('AUTH_TOKEN_SECRET must not use an example or placeholder value.');
    }
    if (authTokenSecret.length < 32) {
      errors.push('AUTH_TOKEN_SECRET must be at least 32 characters long.');
    }
  }

  if (apiKey && isPlaceholderLike(apiKey)) {
    errors.push('API_KEY must be empty or a real value, not a placeholder.');
  }

  if (apiKey && authTokenSecret && apiKey === authTokenSecret) {
    errors.push('API_KEY must not match AUTH_TOKEN_SECRET.');
  }

  if (productionEnvironment && explicitFileStoreMode) {
    errors.push(
      'DB_MODE=file, DATA_FILE, and LEGACY_DATA_FILE are not allowed in production. Production uses Prisma/PostgreSQL only.'
    );
  }

  if (!databaseUrl) {
    if (productionEnvironment) {
      errors.push('DATABASE_URL is required in production.');
    } else if (!explicitFileStoreMode) {
      errors.push(
        'DATABASE_URL is required unless local file mode is enabled with DB_MODE=file or DATA_FILE/LEGACY_DATA_FILE.'
      );
    }
  }

  if (databaseUrl && isPlaceholderDatabaseUrl(databaseUrl)) {
    errors.push('DATABASE_URL must not use example placeholder credentials.');
  }

  if (directDatabaseUrl && isPlaceholderDatabaseUrl(directDatabaseUrl)) {
    errors.push('DIRECT_DATABASE_URL must not use example placeholder credentials.');
  }

  return {
    ok: errors.length === 0,
    errors,
    groups: {
      auth: ['AUTH_TOKEN_SECRET', 'ACCESS_TOKEN_TTL_MINUTES', 'REFRESH_*'],
      api: ['API_KEY'],
      database: [
        'DATABASE_URL',
        'DIRECT_DATABASE_URL',
        'DB_MODE',
        'DATA_FILE',
        'LEGACY_DATA_FILE',
      ],
      frontend: ['VITE_API_BASE_URL', 'VITE_API_KEY'],
    },
  };
}

export function assertRuntimeEnv() {
  const validation = validateRuntimeEnv();
  if (validation.ok) {
    return validation;
  }

  const message = [
    'Invalid backend environment configuration.',
    ...validation.errors.map(error => `- ${error}`),
    '',
    'Environment groups:',
    `- auth: ${validation.groups.auth.join(', ')}`,
    `- api: ${validation.groups.api.join(', ')}`,
    `- database: ${validation.groups.database.join(', ')}`,
    `- frontend: ${validation.groups.frontend.join(', ')} (root .env only, not backend/.env)`,
  ].join('\n');

  throw new Error(message);
}

import {
  createHash,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';

const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_BYTES = 16;
const SESSION_TOKEN_BYTES = 32;

export function hashPassword(password) {
  const salt = randomBytes(PASSWORD_SALT_BYTES).toString('hex');
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString(
    'hex'
  );

  return `${salt}:${derivedKey}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;

  const [salt, hash] = storedHash.split(':');
  const derivedKey = scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString(
    'hex'
  );

  const source = Buffer.from(hash, 'hex');
  const target = Buffer.from(derivedKey, 'hex');

  if (source.length !== target.length) return false;

  return timingSafeEqual(source, target);
}

export function createSessionToken() {
  return randomBytes(SESSION_TOKEN_BYTES).toString('hex');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

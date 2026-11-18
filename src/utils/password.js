import crypto from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(crypto.scrypt);
const KEYLEN = 64;

// Format: scrypt$<salt>$<hash>. Password kabhi plain text mein save nahi hota.
export const hashPassword = async (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, KEYLEN);
  return `scrypt$${salt}$${key.toString('hex')}`;
};

export const verifyPassword = async (password, stored) => {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const key = await scrypt(password, salt, KEYLEN);
  const expected = Buffer.from(hash, 'hex');
  return key.length === expected.length && crypto.timingSafeEqual(key, expected);
};

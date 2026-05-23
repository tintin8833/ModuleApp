/**
 * Auth helpers — password hashing (bcryptjs) + JWT signing/verifying.
 *
 * JWT_SECRET / JWT_EXPIRES come from the environment; a dev fallback
 * keeps local development working out of the box. Set a real
 * JWT_SECRET in server/.env for anything beyond local demos.
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-insecure-secret-change-me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';
const SALT_ROUNDS = 10;

export function hashPassword(plain) {
  return bcrypt.hash(String(plain), SALT_ROUNDS);
}

export function comparePassword(plain, hash) {
  return bcrypt.compare(String(plain), String(hash || ''));
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/** Strip the password hash before sending a user record to the client. */
export function publicUser(user) {
  if (!user) return null;
  const u = user.toJSON ? user.toJSON() : user;
  const { password_hash, ...safe } = u;
  return safe;
}

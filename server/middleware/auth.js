/**
 * Auth middleware.
 *
 *   requireAuth          — rejects requests without a valid Bearer token,
 *                          attaches the decoded payload to req.user.
 *   requireRole(...roles) — rejects authenticated users whose role isn't
 *                          in the allowed list.
 */
import { verifyToken } from '../utils/auth.js';

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return res.status(401).json({ message: 'Authentication required. Please log in.' });
  try {
    req.user = verifyToken(token);
    next();
  } catch (_err) {
    return res.status(401).json({ message: 'Your session has expired or is invalid. Please log in again.' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required. Please log in.' });
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have access to this resource.' });
    }
    next();
  };
}

/**
 * Auth controller — login + current-user lookup.
 */
import { Op } from 'sequelize';
import db from '../models/index.js';
import { comparePassword, signToken, publicUser } from '../utils/auth.js';

const { User } = db;

export async function login(req, res, next) {
  try {
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Case-insensitive email match.
    const user = await User.findOne({
      where: { email: { [Op.like]: email } },
    });
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    if (user.status && user.status !== 'Active') {
      return res.status(403).json({ message: 'This account is inactive. Contact your administrator.' });
    }

    const ok = await comparePassword(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department_id: user.department_id,
    });

    res.json({ token, user: publicUser(user) });
  } catch (err) { next(err); }
}

export async function me(req, res, next) {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Account not found.' });
    res.json({ user: publicUser(user) });
  } catch (err) { next(err); }
}

/**
 * User controller — admin-only account management.
 *
 * Email uniqueness is enforced here (case-insensitive) rather than via
 * a DB unique index, to avoid sync({ alter: true }) accumulating
 * duplicate unique indexes on every boot.
 */
import { Op } from 'sequelize';
import db from '../models/index.js';
import { hashPassword, publicUser } from '../utils/auth.js';

const { User, Department } = db;

const ROLES = [
  'admin', 'ovpaa', 'dean', 'program-head', 'instructor',
  'director-of-libraries', 'industry-consultant', 'hr-staff',
];

async function emailTaken(email, exceptId = null) {
  const where = { email: { [Op.like]: String(email).trim() } };
  if (exceptId) where.id = { [Op.ne]: exceptId };
  const found = await User.findOne({ where, attributes: ['id'] });
  return !!found;
}

export async function listUsers(_req, res, next) {
  try {
    const rows = await User.findAll({
      order: [['name', 'ASC']],
      include: [{ model: Department, as: 'departmentRef', attributes: ['id', 'name', 'code'], required: false }],
    });
    res.json(rows.map(publicUser));
  } catch (err) { next(err); }
}

export async function createUser(req, res, next) {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim();
    const password = String(req.body.password || '');
    const role = String(req.body.role || '').trim();
    const department_id = req.body.department_id ? Number(req.body.department_id) : null;
    const status = String(req.body.status || 'Active').trim();

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required.' });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ message: 'Unknown role: ' + role });
    }
    if (await emailTaken(email)) {
      return res.status(409).json({ message: 'That email is already registered.' });
    }

    const created = await User.create({
      name, email, role, status, department_id,
      password_hash: await hashPassword(password),
    });
    res.status(201).json(publicUser(created));
  } catch (err) { next(err); }
}

export async function updateUser(req, res, next) {
  try {
    const row = await User.findByPk(req.params.id);
    if (!row) return res.status(404).json({ message: 'User not found.' });

    const patch = {};
    if (req.body.name !== undefined) patch.name = String(req.body.name).trim();
    if (req.body.role !== undefined) {
      const role = String(req.body.role).trim();
      if (!ROLES.includes(role)) return res.status(400).json({ message: 'Unknown role: ' + role });
      patch.role = role;
    }
    if (req.body.status !== undefined) patch.status = String(req.body.status).trim();
    if (req.body.department_id !== undefined) {
      patch.department_id = req.body.department_id ? Number(req.body.department_id) : null;
    }
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim();
      if (email && email.toLowerCase() !== String(row.email).toLowerCase() && (await emailTaken(email, row.id))) {
        return res.status(409).json({ message: 'That email is already registered.' });
      }
      patch.email = email;
    }
    if (req.body.password) {
      patch.password_hash = await hashPassword(req.body.password);
    }

    await row.update(patch);
    res.json(publicUser(row));
  } catch (err) { next(err); }
}

export async function deleteUser(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (req.user && Number(req.user.id) === id) {
      return res.status(400).json({ message: 'You cannot delete your own account while logged in.' });
    }
    const row = await User.findByPk(id);
    if (!row) return res.status(404).json({ message: 'User not found.' });

    if (row.role === 'admin') {
      const admins = await User.count({ where: { role: 'admin' } });
      if (admins <= 1) return res.status(400).json({ message: 'Cannot delete the last remaining admin account.' });
    }

    await row.destroy();
    res.status(204).end();
  } catch (err) { next(err); }
}

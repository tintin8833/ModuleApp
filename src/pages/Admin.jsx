/**
 * Admin — system account management.
 *
 * Lists every user and lets an admin create / edit / delete accounts and
 * assign roles + department. Department options come from the currently
 * selected period's department list (assignment is optional).
 */
import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, X } from 'react-feather';
import SkeletonA from '../layouts/SkeletonA.jsx';
import HeaderA from '../components/HeaderA.jsx';
import SideNavigation from '../components/SideNavigation.jsx';
import { UsersAPI, DepartmentsAPI } from '../services/api.js';
import { useAuth } from '../services/auth.jsx';
import { usePeriod } from '../services/period.jsx';
import styles from '../styles/Admin.module.sass';

const ROLES = [
  'admin', 'ovpaa', 'dean', 'program-head', 'instructor',
  'director-of-libraries', 'industry-consultant', 'hr-staff',
];
const STATUSES = ['Active', 'Inactive'];

const blankForm = { id: null, name: '', email: '', password: '', role: 'instructor', department_id: '', status: 'Active' };

const Admin = () => {
  const { user } = useAuth();
  const { currentPeriod } = usePeriod();

  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modal, setModal] = useState({ open: false, mode: 'add' });
  const [form, setForm] = useState(blankForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const loadUsers = () => {
    setLoading(true);
    UsersAPI.list()
      .then((rows) => { setUsers(Array.isArray(rows) ? rows : []); setError(''); })
      .catch((e) => setError(e.message || 'Failed to load users.'))
      .finally(() => setLoading(false));
  };

  useEffect(loadUsers, []);

  useEffect(() => {
    if (!currentPeriod) { setDepartments([]); return; }
    DepartmentsAPI.list(currentPeriod.id)
      .then((rows) => setDepartments(Array.isArray(rows) ? rows : []))
      .catch(() => setDepartments([]));
  }, [currentPeriod]);

  const deptName = (id) => {
    const d = departments.find((x) => Number(x.id) === Number(id));
    return d ? d.name : (id ? '—' : '—');
  };

  const openAdd = () => { setForm(blankForm); setFormError(''); setModal({ open: true, mode: 'add' }); };
  const openEdit = (u) => {
    setForm({ id: u.id, name: u.name, email: u.email, password: '', role: u.role, department_id: u.department_id || '', status: u.status || 'Active' });
    setFormError('');
    setModal({ open: true, mode: 'edit' });
  };
  const closeModal = () => setModal({ open: false, mode: 'add' });

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
        department_id: form.department_id ? Number(form.department_id) : null,
      };
      if (form.password) payload.password = form.password;

      if (modal.mode === 'add') {
        if (!payload.password) throw new Error('Password is required for a new account.');
        await UsersAPI.create(payload);
      } else {
        await UsersAPI.update(form.id, payload);
      }
      closeModal();
      loadUsers();
    } catch (err) {
      setFormError(err.message || 'Could not save the account.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (u) => {
    if (!window.confirm('Delete the account for ' + u.name + ' (' + u.email + ')?')) return;
    try {
      await UsersAPI.remove(u.id);
      loadUsers();
    } catch (err) {
      window.alert(err.message || 'Could not delete the account.');
    }
  };

  const content = (
    <div className={styles.wrap}>
      <div className={styles.head}>
        <div>
          <h1 className={styles.title}>Accounts</h1>
          <p className={styles.sub}>{users.length} account{users.length === 1 ? '' : 's'} · manage logins &amp; roles</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <Plus size={18} /> Add User
        </button>
      </div>

      {error && <div className={styles.banner}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>NAME</th>
              <th>EMAIL</th>
              <th>ROLE</th>
              <th>DEPARTMENT</th>
              <th>STATUS</th>
              <th className={styles.right}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className={styles.empty}>Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className={styles.empty}>No users yet.</td></tr>
            ) : users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={styles.roleTag}>{u.role}</span></td>
                <td>{u.departmentRef ? u.departmentRef.name : deptName(u.department_id)}</td>
                <td>
                  <span className={u.status === 'Active' ? styles.statusActive : styles.statusInactive}>{u.status}</span>
                </td>
                <td className={styles.right}>
                  <button className={styles.iconBtn} title="Edit" onClick={() => openEdit(u)}><Edit2 size={16} /></button>
                  <button className={styles.iconBtnDanger} title="Delete" onClick={() => remove(u)} disabled={u.id === (user && user.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <div className={styles.overlay} onMouseDown={closeModal}>
          <form className={styles.modal} onMouseDown={(e) => e.stopPropagation()} onSubmit={save}>
            <div className={styles.modalHead}>
              <h2>{modal.mode === 'add' ? 'Add User' : 'Edit User'}</h2>
              <button type="button" className={styles.closeBtn} onClick={closeModal}><X size={20} /></button>
            </div>

            {formError && <div className={styles.banner}>{formError}</div>}

            <label className={styles.label}>Full name</label>
            <input className={styles.input} value={form.name} onChange={(e) => setField('name', e.target.value)} required />

            <label className={styles.label}>Email</label>
            <input className={styles.input} type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} required />

            <label className={styles.label}>Password {modal.mode === 'edit' && <span className={styles.hint}>(leave blank to keep current)</span>}</label>
            <input className={styles.input} type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} placeholder={modal.mode === 'edit' ? '••••••••' : ''} {...(modal.mode === 'add' ? { required: true } : {})} />

            <div className={styles.row}>
              <div className={styles.col}>
                <label className={styles.label}>Role</label>
                <select className={styles.input} value={form.role} onChange={(e) => setField('role', e.target.value)}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className={styles.col}>
                <label className={styles.label}>Status</label>
                <select className={styles.input} value={form.status} onChange={(e) => setField('status', e.target.value)}>
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <label className={styles.label}>Department <span className={styles.hint}>(optional)</span></label>
            <select className={styles.input} value={form.department_id} onChange={(e) => setField('department_id', e.target.value)}>
              <option value="">— None —</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  return (
    <SkeletonA
      header={<HeaderA role="Admin" name={(user && user.name) || 'Administrator'} />}
      nav={<SideNavigation mode="admin" />}
      content={content}
    />
  );
};

export default Admin;

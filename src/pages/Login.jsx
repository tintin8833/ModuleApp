import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth, homePathForRole } from '../services/auth.jsx';
import unclogo from '../assets/unclogo.png';
import styles from '../styles/Login.module.sass';

const Login = () => {
  const { login, isAuthed, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Always land on the role's own home. We intentionally do NOT honor a
  // "from" location here: a user who hit another role's URL while logged
  // out must not be sent there after logging in as a different role.
  const destAfterLogin = (role) => homePathForRole(role);

  // Already logged in — bounce to the right home.
  if (!loading && isAuthed && user) {
    return <Navigate to={destAfterLogin(user.role)} replace />;
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const u = await login(email.trim(), password);
      navigate(destAfterLogin(u.role), { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <img src={unclogo} className={styles.logo} alt="University of Nueva Caceres logo" />
        <h1 className={styles.title}>LPMS</h1>
        <p className={styles.subtitle}>Learning Plan Management System</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.label} htmlFor="login-email">Email</label>
        <input
          id="login-email"
          className={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@unc.edu"
          autoComplete="username"
          autoFocus
          required
        />

        <label className={styles.label} htmlFor="login-password">Password</label>
        <input
          id="login-password"
          className={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
        />

        <button className={styles.button} type="submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default Login;

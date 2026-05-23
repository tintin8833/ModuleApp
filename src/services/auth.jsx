/**
 * Auth context.
 *
 * Holds the logged-in user + JWT and exposes login / logout. The token
 * is persisted to localStorage ('auth.token') so api.js can attach it
 * to every request, and so a refresh keeps the session. On boot we
 * re-validate the stored token against /auth/me and drop it if stale.
 */
import React from 'react';
import { AuthAPI } from './api.js';

const TOKEN_KEY = 'auth.token';
const USER_KEY = 'auth.user';

const AuthContext = React.createContext({
  user: null,
  token: null,
  loading: true,
  isAuthed: false,
  login: async () => {},
  logout: () => {},
});

/** Where each role lands after login. */
export function homePathForRole(role) {
  switch (role) {
    case 'admin':                 return '/admin';
    case 'ovpaa':                 return '/role/ovpaa';
    case 'dean':                  return '/role/dean';
    case 'program-head':          return '/role/program-head/industry-consultant';
    case 'director-of-libraries': return '/role/director-of-libraries/approval-course-table';
    case 'industry-consultant':   return '/role/industry-consultant/approval-course-table';
    case 'hr-staff':              return '/role/hr-staff';
    case 'instructor':
    default:                      return '/';
  }
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = React.useState(() => window.localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = React.useState(() => {
    try { return JSON.parse(window.localStorage.getItem(USER_KEY)); } catch (_e) { return null; }
  });
  const [loading, setLoading] = React.useState(!!token);

  // Re-validate a stored token once on boot.
  React.useEffect(() => {
    let active = true;
    if (!token) { setLoading(false); return undefined; }
    AuthAPI.me()
      .then((res) => {
        if (!active) return;
        setUser(res.user);
        window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
      })
      .catch(() => {
        if (!active) return;
        window.localStorage.removeItem(TOKEN_KEY);
        window.localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = React.useCallback(async (email, password) => {
    const res = await AuthAPI.login(email, password);
    window.localStorage.setItem(TOKEN_KEY, res.token);
    window.localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = React.useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = React.useMemo(() => ({
    user,
    token,
    loading,
    isAuthed: !!token && !!user,
    login,
    logout,
  }), [user, token, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => React.useContext(AuthContext);

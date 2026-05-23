/**
 * Route guards.
 *
 *   <RequireAuth/>            — parent route element; renders the nested
 *                              routes (<Outlet/>) only when logged in,
 *                              otherwise redirects to /login.
 *   <RequireRole roles=[...]> — wraps a single element; redirects users
 *                              whose role isn't allowed to their own home.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, homePathForRole } from '../services/auth.jsx';

const Splash = ({ label }) => (
  <div style={{
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'system-ui, sans-serif', color: '#475569',
  }}>
    {label || 'Loading…'}
  </div>
);

export const RequireAuth = () => {
  const { isAuthed, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
};

export const RequireRole = ({ roles, children }) => {
  const { user, isAuthed, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Splash />;
  if (!isAuthed) return <Navigate to="/login" replace state={{ from: location }} />;
  if (roles && roles.length && !roles.includes(user.role)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }
  return children;
};

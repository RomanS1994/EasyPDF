import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { hasAdminAccess, hasManagerAccess } from '../../../features/auth/authAccess.js';
import { selectToken, selectUser } from '../../../features/auth/authSlice.js';
import './ProtectedRoute.css';

export function ProtectedRoute({ children, requireManager = false, requireAdmin = false }) {
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);

  if (!token || !user) {
    return (
      <section className="protectedRoute">
        <p className="protectedRoute-message">Please log in to view this page.</p>
        <Link className="protectedRoute-link" to="/cz/pdf/account">
          Go to account
        </Link>
      </section>
    );
  }

  if (requireManager && !hasManagerAccess(user)) {
    return (
      <section className="protectedRoute">
        <p className="protectedRoute-message">You do not have access to view this page.</p>
        <Link className="protectedRoute-link" to="/cz/pdf">
          Go to home
        </Link>
      </section>
    );
  }

  if (requireAdmin && !hasAdminAccess(user)) {
    return (
      <section className="protectedRoute">
        <p className="protectedRoute-message">You do not have access to view this page.</p>
        <Link className="protectedRoute-link" to="/cz/pdf">
          Go to home
        </Link>
      </section>
    );
  }

  return children;
}

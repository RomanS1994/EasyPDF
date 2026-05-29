import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  hasAdminAccess,
  hasManagerAccess,
  hasPlatinumTeamAccess,
} from '../../../features/auth/authAccess.js';
import {
  selectSessionInitialized,
  selectToken,
  selectUser,
} from '../../../features/auth/authSlice.js';
import './ProtectedRoute.css';

export function ProtectedRoute({
  children,
  requireManager = false,
  requireAdmin = false,
  requirePlatinumTeam = false,
}) {
  const initialized = useSelector(selectSessionInitialized);
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);

  if (!initialized) {
    return null;
  }

  if (!token || !user) {
    return <Navigate to="/sign-in" replace />;
  }

  if (requireManager && !hasManagerAccess(user)) {
    return <Navigate to="/sign-in" replace />;
  }

  if (requireAdmin && !hasAdminAccess(user)) {
    return <Navigate to="/sign-in" replace />;
  }

  if (requirePlatinumTeam && !hasPlatinumTeamAccess(user)) {
    return <Navigate to="/settings/plan-upgrade" replace />;
  }

  return children;
}

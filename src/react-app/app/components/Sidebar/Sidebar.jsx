import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { hasAdminAccess, hasManagerAccess } from '../../../features/auth/authAccess.js';
import { selectUser } from '../../../features/auth/authSlice.js';
import './Sidebar.css';

export function Sidebar() {
  const user = useSelector(selectUser);
  const canManage = hasManagerAccess(user);
  const canAdmin = hasAdminAccess(user);

  return (
    <aside className="appSidebar">
      <nav className="appSidebar-nav" aria-label="Sidebar navigation">
        <Link className="appSidebar-link" to="/cz/pdf">
          Home
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/orders">
          Orders
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/account">
          Account
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/settings">
          Settings
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/stats">
          Stats
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/history">
          History
        </Link>
        {canManage ? (
          <Link className="appSidebar-link" to="/cz/pdf/manager">
            Manager
          </Link>
        ) : null}
        {canAdmin ? (
          <Link className="appSidebar-link" to="/cz/pdf/admin">
            Admin
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}

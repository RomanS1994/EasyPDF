import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { hasAdminAccess, hasManagerAccess } from '../../../features/auth/authAccess.js';
import { selectUser } from '../../../features/auth/authSlice.js';
import './Header.css';

export function Header() {
  const user = useSelector(selectUser);
  const userName = user?.name || user?.email || '';
  const canManage = hasManagerAccess(user);
  const canAdmin = hasAdminAccess(user);

  return (
    <header className="appHeader">
      <div className="appHeader-brand">
        <p className="appHeader-kicker">React test layer</p>
        <h1 className="appHeader-title">Isolated React app</h1>
      </div>

      <div className="appHeader-user">
        {userName ? <span>Signed in as {userName}</span> : <span>Not signed in</span>}
      </div>

      <nav className="appHeader-nav" aria-label="Top navigation">
        <Link className="appHeader-link" to="/cz/pdf">
          Home
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/orders">
          Orders
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/account">
          Account
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/settings">
          Settings
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/stats">
          Stats
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/history">
          History
        </Link>
        {canManage ? (
          <Link className="appHeader-link" to="/cz/pdf/manager">
            Manager
          </Link>
        ) : null}
        {canAdmin ? (
          <Link className="appHeader-link" to="/cz/pdf/admin">
            Admin
          </Link>
        ) : null}
      </nav>
    </header>
  );
}

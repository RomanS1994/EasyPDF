import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useI18n } from '../../i18n/useI18n.js';
import { hasAdminAccess, hasManagerAccess } from '../../../features/auth/authAccess.js';
import { selectUser } from '../../../features/auth/authSlice.js';
import './Sidebar.css';

export function Sidebar() {
  const user = useSelector(selectUser);
  const canManage = hasManagerAccess(user);
  const canAdmin = hasAdminAccess(user);
  const { t } = useI18n();

  return (
    <aside className="appSidebar">
      <nav className="appSidebar-nav" aria-label={t('header.navLabel')}>
        <Link className="appSidebar-link" to="/cz/pdf">
          {t('app.home')}
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/orders">
          {t('app.orders')}
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/account">
          {t('app.account')}
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/settings">
          {t('app.settings')}
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/stats">
          {t('app.stats')}
        </Link>
        <Link className="appSidebar-link" to="/cz/pdf/history">
          {t('app.history')}
        </Link>
        {canManage ? (
          <Link className="appSidebar-link" to="/cz/pdf/manager">
            {t('app.manager')}
          </Link>
        ) : null}
        {canAdmin ? (
          <Link className="appSidebar-link" to="/cz/pdf/admin">
            {t('app.admin')}
          </Link>
        ) : null}
      </nav>
    </aside>
  );
}

import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useI18n } from '../../i18n/useI18n.js';
import { hasAdminAccess, hasManagerAccess } from '../../../features/auth/authAccess.js';
import { selectUser } from '../../../features/auth/authSlice.js';
import './Header.css';

export function Header() {
  const user = useSelector(selectUser);
  const userName = user?.name || user?.email || '';
  const canManage = hasManagerAccess(user);
  const canAdmin = hasAdminAccess(user);
  const { t } = useI18n();

  return (
    <header className="appHeader">
      <div className="appHeader-brand">
        <p className="appHeader-kicker">DocTra</p>
        <h1 className="appHeader-title">{t('header.title')}</h1>
      </div>

      <div className="appHeader-user">
        {userName ? (
          <span>{t('header.signedInAs', { name: userName })}</span>
        ) : (
          <span>{t('header.notSignedIn')}</span>
        )}
      </div>

      <nav className="appHeader-nav" aria-label={t('header.navLabel')}>
        <Link className="appHeader-link" to="/cz/pdf">
          {t('app.home')}
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/orders">
          {t('app.orders')}
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/account">
          {t('app.account')}
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/settings">
          {t('app.settings')}
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/stats">
          {t('app.stats')}
        </Link>
        <Link className="appHeader-link" to="/cz/pdf/history">
          {t('app.history')}
        </Link>
        {canManage ? (
          <Link className="appHeader-link" to="/cz/pdf/manager">
            {t('app.manager')}
          </Link>
        ) : null}
        {canAdmin ? (
          <Link className="appHeader-link" to="/cz/pdf/admin">
            {t('app.admin')}
          </Link>
        ) : null}
      </nav>
    </header>
  );
}

import { NavLink } from 'react-router-dom';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import './AdminBottomTabs.css';

function getTabClassName({ isActive }) {
  return `adminBottomTab${isActive ? ' is-active' : ''}`;
}

export function AdminBottomTabs() {
  const { t } = useI18n();

  return (
    <nav className="adminBottomTabs" aria-label={t('adminNav.navLabel')}>
      <NavLink className={getTabClassName} to="/admin" end>
        <span className="adminBottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 11.5 12 5l8 6.5" />
            <path d="M6 10.5V19h12v-8.5" />
          </svg>
        </span>
        <span className="adminBottomTab-label">{t('adminNav.dashboard')}</span>
      </NavLink>

      <NavLink className={getTabClassName} to="/admin/accounts">
        <span className="adminBottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="9" cy="8.4" r="3" />
            <path d="M4.6 18.5c.8-2.9 2.9-4.7 4.4-4.7s3.6 1.8 4.4 4.7" />
            <circle cx="17.5" cy="9.2" r="2.2" />
            <path d="M14.8 18.2c.4-1.9 1.8-3.2 2.7-3.2 1 0 2.2 1.1 2.7 3.2" />
          </svg>
        </span>
        <span className="adminBottomTab-label">{t('adminDashboard.accounts')}</span>
      </NavLink>

      <NavLink className={getTabClassName} to="/admin/orders">
        <span className="adminBottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M6.5 4.8h6.8L18 9.5V19.2H6.5z" />
            <path d="M13.2 4.8V9.5H18" />
            <path d="M8.3 12.1h5.8" />
            <path d="M8.3 15.1h4" />
          </svg>
        </span>
        <span className="adminBottomTab-label">{t('adminDashboard.orders')}</span>
      </NavLink>

      <NavLink className={getTabClassName} to="/admin/settings">
        <span className="adminBottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="12" r="2.8" />
            <path d="M12 4.8v2" />
            <path d="M12 17.2v2" />
            <path d="M4.8 12h2" />
            <path d="M17.2 12h2" />
            <path d="M7 7l1.4 1.4" />
            <path d="M15.6 15.6 17 17" />
            <path d="M17 7l-1.4 1.4" />
            <path d="M8.4 15.6 7 17" />
          </svg>
        </span>
        <span className="adminBottomTab-label">{t('adminNav.settings')}</span>
      </NavLink>
    </nav>
  );
}

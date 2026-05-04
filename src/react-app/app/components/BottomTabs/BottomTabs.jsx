import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useI18n } from '../../i18n/useI18n.js';
import { selectUser } from '../../../features/auth/authSlice.js';
import { BusinessProfileGuardModal } from '../BusinessProfileGuardModal/BusinessProfileGuardModal.jsx';
import './BottomTabs.css';

function getTabClassName({ isActive }, extraClassName = '') {
  const activeClassName = isActive ? ' is-active' : '';
  return `bottomTab${extraClassName}${activeClassName}`;
}

export function BottomTabs() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const [isGuardOpen, setIsGuardOpen] = useState(false);

  const driver = user?.profile?.driver || user?.driver || {};
  const isDriverProfileComplete = ['name', 'address', 'spz', 'ico'].every(field => {
    const value = driver[field];
    return String(value ?? '').trim().length > 0;
  });

  function handleOrdersClick(event) {
    if (isDriverProfileComplete) {
      return;
    }

    event.preventDefault();
    setIsGuardOpen(true);
  }

  function handleLater() {
    setIsGuardOpen(false);
    navigate('/cz/pdf', { replace: true });
  }

  function handleOpenSettings() {
    setIsGuardOpen(false);
  }

  return (
    <>
      <nav className="bottomTabs" aria-label={t('bottomTabs.navLabel')}>
      <NavLink className={linkProps => getTabClassName(linkProps)} to="/cz/pdf" end>
        <span className="bottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 11.5 12 5l8 6.5" />
            <path d="M6 10.5V19h12v-8.5" />
          </svg>
        </span>
        <span className="bottomTab-label">{t('app.home')}</span>
      </NavLink>

      <NavLink className={linkProps => getTabClassName(linkProps)} to="/cz/pdf/stats">
        <span className="bottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M4 20h16" />
            <path d="M7 20v-6" />
            <path d="M12 20V9" />
            <path d="M17 20v-11" />
          </svg>
        </span>
        <span className="bottomTab-label">{t('app.stats')}</span>
      </NavLink>

      <NavLink
        className={linkProps => getTabClassName(linkProps, ' bottomTab-primary')}
        to="/cz/pdf/orders"
        onClick={handleOrdersClick}
      >
        <span className="bottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M6.5 4.8h6.8L18 9.5V19.2H6.5z" />
            <path d="M13.2 4.8V9.5H18" />
            <path d="M12 10.7v4.6" />
            <path d="M9.7 13h4.6" />
          </svg>
        </span>
        <span className="bottomTab-label">{t('app.orders')}</span>
      </NavLink>

      <NavLink className={linkProps => getTabClassName(linkProps)} to="/cz/pdf/history">
        <span className="bottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="12" r="7" />
            <path d="M12 7.5v5l3 2" />
          </svg>
        </span>
        <span className="bottomTab-label">{t('app.history')}</span>
      </NavLink>

      <NavLink className={linkProps => getTabClassName(linkProps)} to="/cz/pdf/settings">
        <span className="bottomTab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="8.5" r="3.1" />
            <path d="M5.5 19.3c0-3.5 2.9-6.3 6.5-6.3s6.5 2.8 6.5 6.3" />
          </svg>
        </span>
        <span className="bottomTab-label">{t('app.profile')}</span>
      </NavLink>
      </nav>

      <BusinessProfileGuardModal
        isOpen={isGuardOpen}
        onLater={handleLater}
        onOpenSettings={handleOpenSettings}
      />
    </>
  );
}

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { useI18n } from '../../i18n/useI18n.js';
import { SvgIcon } from '../SvgIcon/SvgIcon.jsx';
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
    navigate('/', { replace: true });
  }

  function handleOpenSettings() {
    setIsGuardOpen(false);
  }

  return (
    <>
      <nav className="bottomTabs" aria-label={t('bottomTabs.navLabel')}>
      <NavLink className={linkProps => getTabClassName(linkProps)} to="/" end>
        <span className="bottomTab-icon" aria-hidden="true">
          <SvgIcon name="home" />
        </span>
        <span className="bottomTab-label">{t('app.home')}</span>
      </NavLink>

      <NavLink className={linkProps => getTabClassName(linkProps)} to="/stats">
        <span className="bottomTab-icon" aria-hidden="true">
          <SvgIcon name="stats" />
        </span>
        <span className="bottomTab-label">{t('app.stats')}</span>
      </NavLink>

      <NavLink
        className={linkProps => getTabClassName(linkProps, ' bottomTab-primary')}
        to="/orders"
        onClick={handleOrdersClick}
      >
        <span className="bottomTab-icon" aria-hidden="true">
          <SvgIcon name="orders" />
        </span>
        <span className="bottomTab-label">{t('app.orders')}</span>
      </NavLink>

      <NavLink className={linkProps => getTabClassName(linkProps)} to="/history">
        <span className="bottomTab-icon" aria-hidden="true">
          <SvgIcon name="history" />
        </span>
        <span className="bottomTab-label">{t('app.schedule')}</span>
      </NavLink>

      <NavLink className={linkProps => getTabClassName(linkProps)} to="/settings">
        <span className="bottomTab-icon" aria-hidden="true">
          <SvgIcon name="profile" />
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

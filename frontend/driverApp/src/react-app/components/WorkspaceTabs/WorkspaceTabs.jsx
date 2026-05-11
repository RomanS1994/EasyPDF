import { NavLink } from 'react-router-dom';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { SvgIcon } from '@shared/app/components/SvgIcon/SvgIcon.jsx';
import './WorkspaceTabs.css';

function getTabClassName({ isActive }) {
  return `workspaceTabs-tab${isActive ? ' is-active' : ''}`;
}

function WorkspaceTab({ to, end = false, icon, children }) {
  return (
    <NavLink className={getTabClassName} to={to} end={end}>
      <span className="workspaceTabs-icon" aria-hidden="true">
        <SvgIcon name={icon} />
      </span>
      {children}
    </NavLink>
  );
}

export function WorkspaceTabs() {
  const { t } = useI18n();

  return (
    <nav className="workspaceTabs" aria-label={t('history.workspaceTabs')}>
      <WorkspaceTab to="/history" end icon="file">
        {t('history.myOrders')}
      </WorkspaceTab>
      <WorkspaceTab to="/available-orders" icon="calendar">
        {t('history.available')}
      </WorkspaceTab>
    </nav>
  );
}

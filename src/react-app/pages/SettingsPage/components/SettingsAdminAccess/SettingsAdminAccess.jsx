import { Link } from 'react-router-dom';

import { useI18n } from '../../../../app/i18n/useI18n.js';
import './SettingsAdminAccess.css';

export function SettingsAdminAccess() {
  const { t } = useI18n();

  return (
    <section className="screenCard settingsAdminAccess">
      <div className="compactHeader">
        <h2>{t('settings.adminAccess.title')}</h2>
        <p>{t('settings.adminAccess.copy')}</p>
      </div>

      <Link className="settingsAdminAccess-link" to="/cz/pdf/admin/accounts">
        {t('settings.adminAccess.title')}
      </Link>
    </section>
  );
}

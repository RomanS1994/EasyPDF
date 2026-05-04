import { Link } from 'react-router-dom';

import { useI18n } from '../../app/i18n/useI18n.js';
import './AdminSettingsPage.css';

export function AdminSettingsPage() {
  const { t } = useI18n();

  return (
    <section className="adminSettingsPage">
      <div className="adminSettingsPage-header">
        <h2 className="adminSettingsPage-title">{t('adminSettings.title')}</h2>
        <p className="adminSettingsPage-copy">{t('adminSettings.subtitle')}</p>
      </div>

      <div className="adminSettingsPage-grid">
        <Link className="adminSettingsPage-link" to="/cz/pdf/admin/settings/language">
          {t('adminSettings.language')}
        </Link>
        <Link className="adminSettingsPage-link" to="/cz/pdf/admin/settings/plans">
          {t('adminSettings.plans')}
        </Link>
        <Link className="adminSettingsPage-link" to="/cz/pdf/admin/settings/audit">
          {t('adminSettings.audit')}
        </Link>
      </div>
    </section>
  );
}

import { useI18n } from '../../app/i18n/useI18n.js';
import { Link } from 'react-router-dom';

import './AdminPage.css';

export function AdminPage() {
  const { t } = useI18n();
  return (
    <section className="adminPage">
      <div className="adminPage-header">
        <h2 className="adminPage-title">{t('app.admin')}</h2>
        <p className="adminPage-copy">{t('adminSettings.subtitle')}</p>
      </div>

      <div className="adminPage-grid">
        <Link className="adminPage-link" to="/cz/pdf/admin/accounts">
          {t('account.title')}
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/subscriptions">
          {t('auth.businessProfile')}
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/orders">
          {t('app.orders')}
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/settings">
          {t('app.settings')}
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/settings/plans">
          {t('adminSettings.plans')}
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/settings/audit">
          {t('adminSettings.audit')}
        </Link>
      </div>
    </section>
  );
}

import { useI18n } from '../../app/i18n/useI18n.js';
import { ManagerAuditPanel } from '../../features/manager/components/ManagerAuditPanel/ManagerAuditPanel.jsx';
import './AdminAuditPage.css';

export function AdminAuditPage() {
  const { t } = useI18n();
  return (
    <section className="adminAuditPage">
      <div className="adminAuditPage-header">
        <h2 className="adminAuditPage-title">{t('adminSettings.audit')}</h2>
        <p className="adminAuditPage-copy">{t('manager.subtitle')}</p>
      </div>

      <ManagerAuditPanel />
    </section>
  );
}

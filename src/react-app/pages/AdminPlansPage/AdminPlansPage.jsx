import { useI18n } from '../../app/i18n/useI18n.js';
import { ManagerPlansPanel } from '../../features/manager/components/ManagerPlansPanel/ManagerPlansPanel.jsx';
import './AdminPlansPage.css';

export function AdminPlansPage() {
  const { t } = useI18n();
  return (
    <section className="adminPlansPage">
      <div className="adminPlansPage-header">
        <h2 className="adminPlansPage-title">{t('adminSettings.plans')}</h2>
        <p className="adminPlansPage-copy">{t('manager.subtitle')}</p>
      </div>

      <ManagerPlansPanel />
    </section>
  );
}

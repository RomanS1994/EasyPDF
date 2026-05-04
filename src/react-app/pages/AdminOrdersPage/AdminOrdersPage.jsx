import { useI18n } from '../../app/i18n/useI18n.js';
import { ManagerOrdersPanel } from '../../features/manager/components/ManagerOrdersPanel/ManagerOrdersPanel.jsx';
import './AdminOrdersPage.css';

export function AdminOrdersPage() {
  const { t } = useI18n();
  return (
    <section className="adminOrdersPage">
      <div className="adminOrdersPage-header">
        <h2 className="adminOrdersPage-title">{t('manager.orders')}</h2>
        <p className="adminOrdersPage-copy">{t('manager.subtitle')}</p>
      </div>

      <ManagerOrdersPanel />
    </section>
  );
}

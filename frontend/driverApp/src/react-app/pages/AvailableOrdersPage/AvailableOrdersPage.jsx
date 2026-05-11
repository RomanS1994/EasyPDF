import { useI18n } from '@shared/app/i18n/useI18n.js';
import { WorkspaceTabs } from '../../components/WorkspaceTabs/WorkspaceTabs.jsx';
import './AvailableOrdersPage.css';

export function AvailableOrdersPage() {
  const { t } = useI18n();

  return (
    <section className="availableOrdersPage pageStack">
      <WorkspaceTabs />

      <div className="screenCard">
        <div className="availableOrdersPage-empty">
          <p>{t('availableOrders.empty')}</p>
        </div>
      </div>
    </section>
  );
}

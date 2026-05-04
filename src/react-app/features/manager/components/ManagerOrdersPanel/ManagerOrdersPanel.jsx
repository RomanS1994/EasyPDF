import { useI18n } from '../../../../app/i18n/useI18n.js';
import { useGetManagerOrdersQuery } from '../../managerApi.js';
import './ManagerOrdersPanel.css';

export function ManagerOrdersPanel() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useGetManagerOrdersQuery();
  const orders = data?.orders || [];

  if (isLoading) {
    return (
      <section className="managerOrdersPanel">
        <p className="managerOrdersPanel-state">{t('common.loadingOrders')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="managerOrdersPanel">
        <p className="managerOrdersPanel-state">{t('manager.failedOrders')}</p>
      </section>
    );
  }

  if (!orders.length) {
    return (
      <section className="managerOrdersPanel">
        <p className="managerOrdersPanel-state">{t('manager.noOrders')}</p>
      </section>
    );
  }

  return (
    <section className="managerOrdersPanel">
      <ul className="managerOrdersPanel-list">
        {orders.map(order => (
          <li className="managerOrdersPanel-item" key={order.id}>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">{t('manager.orders')}</span>
              <span className="managerOrdersPanel-value">{order.orderNumber || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">{t('common.status')}</span>
              <span className="managerOrdersPanel-value">{order.status || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">{t('contract.priceLabel')}</span>
              <span className="managerOrdersPanel-value">{order.totalPrice || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">{t('common.name')}</span>
              <span className="managerOrdersPanel-value">{order.user?.name || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">{t('contract.customer')}</span>
              <span className="managerOrdersPanel-value">{order.customer?.name || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">{t('common.created')}</span>
              <span className="managerOrdersPanel-value">{order.createdAt || '-'}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

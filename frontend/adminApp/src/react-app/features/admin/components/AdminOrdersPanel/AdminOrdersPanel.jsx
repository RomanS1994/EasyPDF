import { useI18n } from '@shared/app/i18n/useI18n.js';
import { useGetAdminOrdersQuery } from '@shared/features/admin/adminApi.js';
import './AdminOrdersPanel.css';

export function AdminOrdersPanel({ userId = '', onOpenOrder }) {
  const { t } = useI18n();
  const { data, isLoading, isError } = useGetAdminOrdersQuery(
    userId ? { userId } : undefined,
  );
  const orders = data?.orders || [];

  if (isLoading) {
    return (
      <section className="adminOrdersPanel">
        <p className="adminOrdersPanel-state">{t('common.loadingOrders')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="adminOrdersPanel">
        <p className="adminOrdersPanel-state">{t('admin.failedOrders')}</p>
      </section>
    );
  }

  if (!orders.length) {
    return (
      <section className="adminOrdersPanel">
        <p className="adminOrdersPanel-state">{t('admin.noOrders')}</p>
      </section>
    );
  }

  return (
    <section className="adminOrdersPanel">
      <div className="adminOrdersPanel-header">
        <h3 className="adminOrdersPanel-title">{t('admin.orders')}</h3>
        {userId ? <span className="adminOrdersPanel-pill">{t('common.filtered')}</span> : null}
      </div>
      <ul className="adminOrdersPanel-list">
        {orders.map(order => (
          <li className="adminOrdersPanel-item" key={order.id}>
            <button
              className="adminOrdersPanel-button"
              type="button"
              onClick={() => onOpenOrder?.(order.id)}
            >
              <div className="adminOrdersPanel-row">
                <span className="adminOrdersPanel-label">{t('admin.orders')}</span>
                <span className="adminOrdersPanel-value">{order.orderNumber || '-'}</span>
              </div>
              <div className="adminOrdersPanel-row">
                <span className="adminOrdersPanel-label">{t('common.status')}</span>
                <span className="adminOrdersPanel-value">{order.status || '-'}</span>
              </div>
              <div className="adminOrdersPanel-row">
                <span className="adminOrdersPanel-label">{t('contract.priceLabel')}</span>
                <span className="adminOrdersPanel-value">{order.totalPrice || '-'}</span>
              </div>
              <div className="adminOrdersPanel-row">
                <span className="adminOrdersPanel-label">{t('common.name')}</span>
                <span className="adminOrdersPanel-value">{order.user?.name || '-'}</span>
              </div>
              <div className="adminOrdersPanel-row">
                <span className="adminOrdersPanel-label">{t('contract.customer')}</span>
                <span className="adminOrdersPanel-value">{order.customer?.name || '-'}</span>
              </div>
              <div className="adminOrdersPanel-row">
                <span className="adminOrdersPanel-label">{t('common.created')}</span>
                <span className="adminOrdersPanel-value">{order.createdAt || '-'}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

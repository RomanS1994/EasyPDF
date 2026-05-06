import { Link, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '@shared/app/api/getApiErrorMessage.js';
import { formatDateTime } from '@shared/app/utils/dateFormat.js';
import { useI18n } from '@shared/app/i18n/useI18n.js';
import { useGetAdminOrderQuery } from '@shared/features/admin/adminApi.js';
import './AdminOrderDetailsPage.css';

function getFieldValue(value) {
  if (!value) {
    return '-';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'object') {
    return value.address || value.name || value.label || '-';
  }

  return String(value);
}

export function AdminOrderDetailsPage() {
  const { t } = useI18n();
  const { orderId } = useParams();
  const { data, isLoading, isError, error } = useGetAdminOrderQuery(orderId, {
    skip: !orderId,
  });
  const order = data?.order || data || {};
  const createdAt = formatDateTime(order.createdAt, 'uk');
  const updatedAt = formatDateTime(order.updatedAt, 'uk');
  const backToUserOrders = order.user?.id ? `/admin/orders/users/${order.user.id}` : '/admin/orders';

  if (isLoading) {
    return (
      <section className="adminOrderDetailsPage">
        <p className="adminOrderDetailsPage-state">{t('common.loadingOrders')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="adminOrderDetailsPage">
        <p className="adminOrderDetailsPage-state">{getApiErrorMessage(error, t('admin.failedOrder'))}</p>
      </section>
    );
  }

  return (
    <section className="adminOrderDetailsPage">
      <div className="adminOrderDetailsPage-header">
        <Link className="adminOrderDetailsPage-back" to={backToUserOrders}>
          <span className="adminOrderDetailsPage-backIcon" aria-hidden="true" />
          {t('common.back')}
        </Link>

        <div className="adminOrderDetailsPage-summary">
          <div className="adminOrderDetailsPage-summaryItem">
            <span className="adminOrderDetailsPage-label">{t('admin.orders')}</span>
            <strong className="adminOrderDetailsPage-value">{order.orderNumber || '-'}</strong>
          </div>
          <div className="adminOrderDetailsPage-summaryItem">
            <span className="adminOrderDetailsPage-label">{t('contract.priceLabel')}</span>
            <strong className="adminOrderDetailsPage-value">{order.totalPrice || '-'}</strong>
          </div>
        </div>
      </div>

      <div className="adminOrderDetailsPage-grid">
        <section className="adminOrderDetailsPage-card">
          <h3 className="adminOrderDetailsPage-cardTitle">{t('contract.customer')}</h3>
          <p className="adminOrderDetailsPage-cardValue">{getFieldValue(order.customer?.name)}</p>
          <p className="adminOrderDetailsPage-cardMeta">{getFieldValue(order.customer?.email)}</p>
        </section>

        <section className="adminOrderDetailsPage-card">
          <h3 className="adminOrderDetailsPage-cardTitle">{t('contract.tripInfo')}</h3>
          <p className="adminOrderDetailsPage-cardValue">
            {getFieldValue(order.trip?.from)} → {getFieldValue(order.trip?.to)}
          </p>
          <p className="adminOrderDetailsPage-cardMeta">
            {getFieldValue(order.trip?.time)}
          </p>
        </section>

        <section className="adminOrderDetailsPage-card">
          <h3 className="adminOrderDetailsPage-cardTitle">{t('common.created')}</h3>
          <p className="adminOrderDetailsPage-cardValue">{createdAt}</p>
          <p className="adminOrderDetailsPage-cardMeta">{updatedAt}</p>
        </section>
      </div>

      <section className="adminOrderDetailsPage-panel">
        <h3 className="adminOrderDetailsPage-panelTitle">{t('admin.orderDetails')}</h3>
        <pre className="adminOrderDetailsPage-json">{JSON.stringify(order.metadata || {}, null, 2)}</pre>
      </section>
    </section>
  );
}

import { Link, useNavigate, useParams } from 'react-router-dom';

import { getApiErrorMessage } from '@shared/app/api/getApiErrorMessage.js';
import { useI18n } from '@shared/app/i18n/useI18n.js';
import { useGetAdminUserQuery } from '@shared/features/admin/adminApi.js';
import { AdminOrdersPanel } from '../../features/admin/components/AdminOrdersPanel/AdminOrdersPanel.jsx';
import './AdminUserOrdersPage.css';

export function AdminUserOrdersPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { userId } = useParams();
  const { data, isLoading, isError, error } = useGetAdminUserQuery(userId, {
    skip: !userId,
  });
  const user = data?.user || data || {};

  if (isLoading) {
    return (
      <section className="adminUserOrdersPage">
        <p className="adminUserOrdersPage-state">{t('common.loadingUsers')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="adminUserOrdersPage">
        <p className="adminUserOrdersPage-state">{getApiErrorMessage(error, t('admin.failedUser'))}</p>
      </section>
    );
  }

  return (
    <section className="adminUserOrdersPage">
      <div className="adminUserOrdersPage-header">
        <Link className="adminUserOrdersPage-back" to="/admin/orders">
          <span className="adminUserOrdersPage-backIcon" aria-hidden="true" />
          {t('common.back')}
        </Link>

        <div className="adminUserOrdersPage-copyBlock">
          <h2 className="adminUserOrdersPage-title">{t('adminOrders.userOrders')}</h2>
          <p className="adminUserOrdersPage-copy">{t('adminOrders.userOrdersCopy')}</p>
        </div>
      </div>

      <section className="adminUserOrdersPage-user">
        <div className="adminUserOrdersPage-userMain">
          <strong className="adminUserOrdersPage-userName">{user.name || t('common.noName')}</strong>
          <span className="adminUserOrdersPage-userEmail">{user.email || '-'}</span>
        </div>
        <div className="adminUserOrdersPage-userMeta">
          <span className="adminUserOrdersPage-userMetaItem">{user.role || '-'}</span>
          <span className="adminUserOrdersPage-userMetaItem">{user.subscription?.status || '-'}</span>
        </div>
      </section>

      <AdminOrdersPanel
        userId={userId}
        onOpenOrder={orderId => navigate(`/admin/orders/view/${orderId}`)}
      />
    </section>
  );
}

import { useState } from 'react';

import { useI18n } from '../../app/i18n/useI18n.js';
import { ManagerUserDetails } from '../../features/manager/components/ManagerUserDetails/ManagerUserDetails.jsx';
import { ManagerUsersList } from '../../features/manager/components/ManagerUsersList/ManagerUsersList.jsx';
import { useGetManagerUsersQuery } from '../../features/manager/managerApi.js';
import './AdminSubscriptionsPage.css';

export function AdminSubscriptionsPage() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useGetManagerUsersQuery();
  const users = data?.users || [];
  const [selectedUserId, setSelectedUserId] = useState('');

  if (isLoading) {
    return (
      <section className="adminSubscriptionsPage">
        <p className="adminSubscriptionsPage-state">{t('common.loadingSubscriptions')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="adminSubscriptionsPage">
        <p className="adminSubscriptionsPage-state">{t('common.failedToLoad')}</p>
      </section>
    );
  }

  if (!users.length) {
    return (
      <section className="adminSubscriptionsPage">
        <p className="adminSubscriptionsPage-state">{t('common.noUsers')}</p>
      </section>
    );
  }

  return (
    <section className="adminSubscriptionsPage">
      <div className="adminSubscriptionsPage-header">
        <h2 className="adminSubscriptionsPage-title">{t('manager.subscription')}</h2>
        <p className="adminSubscriptionsPage-copy">{t('manager.subtitle')}</p>
      </div>

      <div className="adminSubscriptionsPage-layout">
        <ManagerUsersList
          users={users}
          selectedUserId={selectedUserId}
          onSelect={setSelectedUserId}
        />
        <ManagerUserDetails userId={selectedUserId} />
      </div>
    </section>
  );
}

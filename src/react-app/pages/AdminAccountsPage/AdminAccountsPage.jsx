import { useState } from 'react';

import { useI18n } from '../../app/i18n/useI18n.js';
import { ManagerUserDetails } from '../../features/manager/components/ManagerUserDetails/ManagerUserDetails.jsx';
import { ManagerUsersList } from '../../features/manager/components/ManagerUsersList/ManagerUsersList.jsx';
import { useGetManagerUsersQuery } from '../../features/manager/managerApi.js';
import './AdminAccountsPage.css';

export function AdminAccountsPage() {
  const { data, isLoading, isError } = useGetManagerUsersQuery();
  const { t } = useI18n();
  const users = data?.users || [];
  const [selectedUserId, setSelectedUserId] = useState('');

  if (isLoading) {
    return (
      <section className="adminAccountsPage">
        <p className="adminAccountsPage-state">{t('common.loadingUsers')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="adminAccountsPage">
        <p className="adminAccountsPage-state">{t('common.failedToLoad')}</p>
      </section>
    );
  }

  if (!users.length) {
    return (
      <section className="adminAccountsPage">
        <p className="adminAccountsPage-state">{t('common.noUsers')}</p>
      </section>
    );
  }

  return (
    <section className="adminAccountsPage">
      <div className="adminAccountsPage-header">
        <h2 className="adminAccountsPage-title">{t('account.title')}</h2>
        <p className="adminAccountsPage-copy">{t('manager.subtitle')}</p>
      </div>

      <div className="adminAccountsPage-layout">
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

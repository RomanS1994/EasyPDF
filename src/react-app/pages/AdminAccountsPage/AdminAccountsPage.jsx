import { useState } from 'react';

import { ManagerUserDetails } from '../../features/manager/components/ManagerUserDetails/ManagerUserDetails.jsx';
import { ManagerUsersList } from '../../features/manager/components/ManagerUsersList/ManagerUsersList.jsx';
import { useGetManagerUsersQuery } from '../../features/manager/managerApi.js';
import './AdminAccountsPage.css';

export function AdminAccountsPage() {
  const { data, isLoading, isError } = useGetManagerUsersQuery();
  const users = data?.users || [];
  const [selectedUserId, setSelectedUserId] = useState('');

  if (isLoading) {
    return (
      <section className="adminAccountsPage">
        <p className="adminAccountsPage-state">Loading accounts...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="adminAccountsPage">
        <p className="adminAccountsPage-state">Failed to load accounts.</p>
      </section>
    );
  }

  if (!users.length) {
    return (
      <section className="adminAccountsPage">
        <p className="adminAccountsPage-state">No users found.</p>
      </section>
    );
  }

  return (
    <section className="adminAccountsPage">
      <div className="adminAccountsPage-header">
        <h2 className="adminAccountsPage-title">Accounts</h2>
        <p className="adminAccountsPage-copy">Manage user profiles and roles.</p>
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

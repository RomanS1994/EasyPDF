import { useState } from 'react';

import { ManagerUserDetails } from '../../features/manager/components/ManagerUserDetails/ManagerUserDetails.jsx';
import { ManagerUsersList } from '../../features/manager/components/ManagerUsersList/ManagerUsersList.jsx';
import { useGetManagerUsersQuery } from '../../features/manager/managerApi.js';
import './AdminSubscriptionsPage.css';

export function AdminSubscriptionsPage() {
  const { data, isLoading, isError } = useGetManagerUsersQuery();
  const users = data?.users || [];
  const [selectedUserId, setSelectedUserId] = useState('');

  if (isLoading) {
    return (
      <section className="adminSubscriptionsPage">
        <p className="adminSubscriptionsPage-state">Loading subscriptions...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="adminSubscriptionsPage">
        <p className="adminSubscriptionsPage-state">Failed to load subscriptions.</p>
      </section>
    );
  }

  if (!users.length) {
    return (
      <section className="adminSubscriptionsPage">
        <p className="adminSubscriptionsPage-state">No users found.</p>
      </section>
    );
  }

  return (
    <section className="adminSubscriptionsPage">
      <div className="adminSubscriptionsPage-header">
        <h2 className="adminSubscriptionsPage-title">Subscriptions</h2>
        <p className="adminSubscriptionsPage-copy">Manage user subscriptions.</p>
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

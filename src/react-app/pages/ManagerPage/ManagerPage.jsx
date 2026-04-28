import { useState } from 'react';

import { ManagerAuditPanel } from '../../features/manager/components/ManagerAuditPanel/ManagerAuditPanel.jsx';
import { useGetManagerUsersQuery } from '../../features/manager/managerApi.js';
import { ManagerOrdersPanel } from '../../features/manager/components/ManagerOrdersPanel/ManagerOrdersPanel.jsx';
import { ManagerPlansPanel } from '../../features/manager/components/ManagerPlansPanel/ManagerPlansPanel.jsx';
import { ManagerUserDetails } from '../../features/manager/components/ManagerUserDetails/ManagerUserDetails.jsx';
import { ManagerUsersList } from '../../features/manager/components/ManagerUsersList/ManagerUsersList.jsx';
import './ManagerPage.css';

export function ManagerPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [selectedUserId, setSelectedUserId] = useState('');
  const { data, isLoading, isError } = useGetManagerUsersQuery();
  const users = data?.users || [];

  function handleSelect(userId) {
    setSelectedUserId(userId);
  }

  return (
    <section className="managerPage">
      <div className="managerPage-header">
        <h2 className="managerPage-title">Manager</h2>
        <p className="managerPage-copy">Simple manager shell backed by RTK Query.</p>
      </div>

      <div className="managerPage-tabs">
        <button
          className={`managerPage-tab ${activeTab === 'users' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`managerPage-tab ${activeTab === 'orders' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('orders')}
        >
          Orders
        </button>
        <button
          className={`managerPage-tab ${activeTab === 'plans' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('plans')}
        >
          Plans
        </button>
        <button
          className={`managerPage-tab ${activeTab === 'audit' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('audit')}
        >
          Audit
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {isLoading ? <p className="managerPage-state">Loading users...</p> : null}
          {isError ? <p className="managerPage-state">Failed to load users.</p> : null}
          {!isLoading && !isError && !users.length ? (
            <p className="managerPage-state">No users found.</p>
          ) : null}

          {!isLoading && !isError && users.length ? (
            <div className="managerPage-grid">
              <section className="managerPage-panel">
                <h3 className="managerPage-panelTitle">Users</h3>
                <ManagerUsersList
                  users={users}
                  selectedUserId={selectedUserId}
                  onSelect={handleSelect}
                />
              </section>

              <ManagerUserDetails userId={selectedUserId} />
            </div>
          ) : null}
        </>
      ) : null}

      {activeTab === 'orders' ? (
        <div className="managerPage-orders">
          <ManagerOrdersPanel />
        </div>
      ) : null}

      {activeTab === 'plans' ? (
        <div className="managerPage-orders">
          <ManagerPlansPanel />
        </div>
      ) : null}

      {activeTab === 'audit' ? (
        <div className="managerPage-orders">
          <ManagerAuditPanel />
        </div>
      ) : null}
    </section>
  );
}

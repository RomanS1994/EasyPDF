import { useState } from 'react';

import { useI18n } from '../../app/i18n/useI18n.js';
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
  const { t } = useI18n();
  const users = data?.users || [];

  function handleSelect(userId) {
    setSelectedUserId(userId);
  }

  return (
    <section className="managerPage">
      <div className="managerPage-header">
        <h2 className="managerPage-title">{t('manager.title')}</h2>
        <p className="managerPage-copy">{t('manager.subtitle')}</p>
      </div>

      <div className="managerPage-tabs">
        <button
          className={`managerPage-tab ${activeTab === 'users' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('users')}
        >
          {t('manager.users')}
        </button>
        <button
          className={`managerPage-tab ${activeTab === 'orders' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('orders')}
        >
          {t('manager.orders')}
        </button>
        <button
          className={`managerPage-tab ${activeTab === 'plans' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('plans')}
        >
          {t('manager.plans')}
        </button>
        <button
          className={`managerPage-tab ${activeTab === 'audit' ? 'is-active' : ''}`}
          type="button"
          onClick={() => setActiveTab('audit')}
        >
          {t('manager.audit')}
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {isLoading ? <p className="managerPage-state">{t('manager.loadingUsers')}</p> : null}
          {isError ? <p className="managerPage-state">{t('manager.failedUsers')}</p> : null}
          {!isLoading && !isError && !users.length ? (
            <p className="managerPage-state">{t('manager.noUsers')}</p>
          ) : null}

          {!isLoading && !isError && users.length ? (
            <div className="managerPage-grid">
              <section className="managerPage-panel">
                <h3 className="managerPage-panelTitle">{t('manager.users')}</h3>
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

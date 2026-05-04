import { useState } from 'react';

import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import { useGetUsageQuery } from '../../features/auth/authApi.js';
import { StatsActivityPanel } from './components/StatsActivityPanel/StatsActivityPanel.jsx';
import { StatsTabs } from './components/StatsTabs/StatsTabs.jsx';
import { StatsSalaryPanel } from './components/StatsSalaryPanel/StatsSalaryPanel.jsx';
import { StatsUsagePanel } from './components/StatsUsagePanel/StatsUsagePanel.jsx';
import './StatsPage.css';

function getSafeUsage(usage) {
  // Захищаємо екран від неповної відповіді API.
  return {
    month: usage?.month || '',
    periodStart: usage?.periodStart || '',
    periodEnd: usage?.periodEnd || '',
    cycleLabel: usage?.cycleLabel || 'Current cycle',
    status: usage?.status || 'active',
    used: usage?.used || 0,
    limit: usage?.limit || 0,
    remaining: usage?.remaining || 0,
    percent: usage?.percent || 0,
    deletedMessages: usage?.deletedMessages || 0,
  };
}

export function StatsPage() {
  const [activeTab, setActiveTab] = useState('usage');
  const { data: usageData, isLoading: isUsageLoading, isError: isUsageError } = useGetUsageQuery(
    undefined,
    {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    },
  );
  const { data: ordersData, isLoading: isOrdersLoading, isError: isOrdersError } =
    useGetOrdersQuery(undefined, {
      refetchOnFocus: true,
      refetchOnReconnect: true,
      refetchOnMountOrArgChange: true,
    });

  const usage = getSafeUsage(usageData?.usage);
  const orders = ordersData?.orders || [];
  const isLoading = isUsageLoading || isOrdersLoading;
  const isError = isUsageError || isOrdersError;

  return (
    <section className="statsPage pageStack">
      <div className="screenCard screenCard-stats">
        <div className="compactHeader">
          <h2>Statistics</h2>
          <p>Current cycle and generated PDF output.</p>
        </div>

        <StatsTabs value={activeTab} onChange={setActiveTab} />

        {isLoading ? <p className="statusNote">Loading stats...</p> : null}
        {isError ? <p className="statusNote is-error">Failed to load stats.</p> : null}

        {!isLoading && !isError && activeTab === 'usage' ? (
          <StatsUsagePanel usage={usage} orders={orders} />
        ) : null}

        {!isLoading && !isError && activeTab === 'salary' ? (
          <StatsSalaryPanel usage={usage} orders={orders} />
        ) : null}

        {!isLoading && !isError && activeTab === 'activity' ? (
          <StatsActivityPanel usage={usage} orders={orders} />
        ) : null}
      </div>
    </section>
  );
}

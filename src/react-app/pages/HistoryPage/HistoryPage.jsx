import { useMemo, useState } from 'react';

import { useI18n } from '../../app/i18n/useI18n.js';
import { OrderDetails } from '../../features/orders/components/OrderDetails/OrderDetails.jsx';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import { HistoryOrdersList } from './components/HistoryOrdersList/HistoryOrdersList.jsx';
import { HistoryTabs } from './components/HistoryTabs/HistoryTabs.jsx';
import { HistoryToolbar } from './components/HistoryToolbar/HistoryToolbar.jsx';
import { buildTabCounts, compareOrders, getHistoryBucket, getHistoryDateKey } from './historyUtils.js';
import './HistoryPage.css';

export function HistoryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [sortKey, setSortKey] = useState('newest');
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const { data, isLoading, isError } = useGetOrdersQuery();
  const { t } = useI18n();
  const orders = data?.orders || [];

  const filteredByDate = useMemo(() => {
    if (!dateFilter) {
      return orders;
    }

    const filteredOrders = [];

    for (const order of orders) {
      if (getHistoryDateKey(order) === dateFilter) {
        filteredOrders.push(order);
      }
    }

    return filteredOrders;
  }, [dateFilter, orders]);

  const tabCounts = useMemo(() => buildTabCounts(filteredByDate), [filteredByDate]);

  const visibleOrders = useMemo(() => {
    const list = [];

    for (const order of filteredByDate) {
      if (activeTab !== 'all') {
        const bucket = getHistoryBucket(order).bucket;
        if (bucket !== activeTab) {
          continue;
        }
      }

      list.push(order);
    }

    return [...list].sort((left, right) => compareOrders(left, right, sortKey));
  }, [activeTab, filteredByDate, sortKey]);

  function handleResetDate() {
    setDateFilter('');
  }

  function handleCloseDetails() {
    setSelectedOrderId('');
  }

  function handleOpenDetails(orderId) {
    setSelectedOrderId(orderId);
  }

  return (
    <section className="historyPage pageStack">
      <div className="screenCard screenCard-stats orderHistoryScreen">
        <div className="compactHeader">
          <h2>{t('history.savedPdfs')}</h2>
          <p>{t('history.subtitle')}</p>
        </div>

        <HistoryTabs activeTab={activeTab} counts={tabCounts} onChange={setActiveTab} />

        <HistoryToolbar
          dateFilter={dateFilter}
          onDateChange={setDateFilter}
          onResetDate={handleResetDate}
          sortKey={sortKey}
          onSortChange={setSortKey}
        />

        {isLoading ? <p className="orderHistoryEmpty">{t('history.loading')}</p> : null}
        {isError ? <p className="orderHistoryEmpty">{t('history.failed')}</p> : null}

        {!isLoading && !isError && !visibleOrders.length ? (
          <p className="orderHistoryEmpty">
            {orders.length ? t('history.noMatch') : t('history.empty')}
          </p>
        ) : null}

        {!isLoading && !isError && visibleOrders.length ? (
          <HistoryOrdersList orders={visibleOrders} onOpen={handleOpenDetails} />
        ) : null}
      </div>

      {selectedOrderId ? <OrderDetails orderId={selectedOrderId} onClose={handleCloseDetails} /> : null}
    </section>
  );
}

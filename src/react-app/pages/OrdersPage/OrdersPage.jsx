import { useState } from 'react';

import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import { OrderDetails } from '../../features/orders/components/OrderDetails/OrderDetails.jsx';
import { OrderFilters } from '../../features/orders/components/OrderFilters/OrderFilters.jsx';
import { OrdersList } from '../../features/orders/components/OrdersList/OrdersList.jsx';
import './OrdersPage.css';

export function OrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { data, isLoading, isError } = useGetOrdersQuery();
  const orders = data?.orders || [];
  const filteredOrders = [];

  for (const order of orders) {
    const orderNumber = String(order?.orderNumber || '').toLowerCase();
    const customerName = String(
      order?.contractData?.customer?.name || order?.customer?.name || ''
    ).toLowerCase();
    const search = String(searchText || '').toLowerCase().trim();

    if (search) {
      if (!orderNumber.includes(search) && !customerName.includes(search)) {
        continue;
      }
    }

    if (statusFilter !== 'all') {
      if (String(order?.status || '') !== statusFilter) {
        continue;
      }
    }

    filteredOrders.push(order);
  }

  function handleView(orderId) {
    setSelectedOrderId(orderId);
  }

  function handleClose() {
    setSelectedOrderId('');
  }

  return (
    <section className="ordersPage">
      <div className="ordersPage-header">
        <h2 className="ordersPage-title">Orders</h2>
        <p className="ordersPage-copy">Simple React list backed by RTK Query.</p>
      </div>

      <OrderFilters
        searchText={searchText}
        statusFilter={statusFilter}
        onSearchChange={setSearchText}
        onStatusChange={setStatusFilter}
      />

      <p className="ordersPage-count">Showing {filteredOrders.length} orders</p>

      {isLoading ? <p className="ordersPage-state">Loading orders...</p> : null}
      {isError ? <p className="ordersPage-state">Failed to load orders.</p> : null}
      {!isLoading && !isError ? (
        <OrdersList orders={filteredOrders} onView={handleView} />
      ) : null}
      {selectedOrderId ? (
        <OrderDetails orderId={selectedOrderId} onClose={handleClose} />
      ) : null}
    </section>
  );
}

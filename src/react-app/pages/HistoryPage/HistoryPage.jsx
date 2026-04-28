import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import './HistoryPage.css';

export function HistoryPage() {
  const { data, isLoading, isError } = useGetOrdersQuery();
  const orders = data?.orders || [];
  const archivedOrders = [];

  for (const order of orders) {
    if (order.archivedAt || order.status === 'archived') {
      archivedOrders.push(order);
    }
  }

  return (
    <section className="historyPage">
      <div className="historyPage-header">
        <h2 className="historyPage-title">History</h2>
        <p className="historyPage-copy">Simple React history page.</p>
      </div>

      {isLoading ? <p className="historyPage-state">Loading history...</p> : null}
      {isError ? <p className="historyPage-state">Failed to load history.</p> : null}

      {!isLoading && !isError && !archivedOrders.length ? (
        <p className="historyPage-state">
          History will be available after archived orders are exposed to React.
        </p>
      ) : null}

      {!isLoading && !isError && archivedOrders.length ? (
        <ul className="historyPage-list">
          {archivedOrders.map(order => (
            <li className="historyPage-item" key={order.id}>
              <div className="historyPage-row">
                <span className="historyPage-label">Order</span>
                <span className="historyPage-value">{order.orderNumber || '-'}</span>
              </div>
              <div className="historyPage-row">
                <span className="historyPage-label">Status</span>
                <span className="historyPage-value">{order.status || '-'}</span>
              </div>
              <div className="historyPage-row">
                <span className="historyPage-label">Customer</span>
                <span className="historyPage-value">{order.customer?.name || '-'}</span>
              </div>
              <div className="historyPage-row">
                <span className="historyPage-label">Created</span>
                <span className="historyPage-value">{order.createdAt || '-'}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

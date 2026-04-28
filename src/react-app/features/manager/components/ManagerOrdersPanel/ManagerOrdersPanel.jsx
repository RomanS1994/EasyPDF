import { useGetManagerOrdersQuery } from '../../managerApi.js';
import './ManagerOrdersPanel.css';

export function ManagerOrdersPanel() {
  const { data, isLoading, isError } = useGetManagerOrdersQuery();
  const orders = data?.orders || [];

  if (isLoading) {
    return (
      <section className="managerOrdersPanel">
        <p className="managerOrdersPanel-state">Loading orders...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="managerOrdersPanel">
        <p className="managerOrdersPanel-state">Failed to load orders.</p>
      </section>
    );
  }

  if (!orders.length) {
    return (
      <section className="managerOrdersPanel">
        <p className="managerOrdersPanel-state">No orders found.</p>
      </section>
    );
  }

  return (
    <section className="managerOrdersPanel">
      <ul className="managerOrdersPanel-list">
        {orders.map(order => (
          <li className="managerOrdersPanel-item" key={order.id}>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">Order</span>
              <span className="managerOrdersPanel-value">{order.orderNumber || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">Status</span>
              <span className="managerOrdersPanel-value">{order.status || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">Total price</span>
              <span className="managerOrdersPanel-value">{order.totalPrice || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">Owner</span>
              <span className="managerOrdersPanel-value">{order.user?.name || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">Customer</span>
              <span className="managerOrdersPanel-value">{order.customer?.name || '-'}</span>
            </div>
            <div className="managerOrdersPanel-row">
              <span className="managerOrdersPanel-label">Created</span>
              <span className="managerOrdersPanel-value">{order.createdAt || '-'}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

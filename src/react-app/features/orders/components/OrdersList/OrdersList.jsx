import './OrdersList.css';

export function OrdersList({ orders, onView }) {
  if (!orders.length) {
    return <p className="ordersList-empty">No orders found.</p>;
  }

  return (
    <ul className="ordersList">
      {orders.map(order => {
        const customerName = order?.contractData?.customer?.name || order?.customer?.name || '';

        return (
          <li className="ordersList-item" key={order.id || order.orderNumber}>
            <button
              className="ordersList-view"
              type="button"
              onClick={() => onView(order.id)}
            >
              View
            </button>
            <div className="ordersList-row">
              <span className="ordersList-label">Order</span>
              <span className="ordersList-value">{order.orderNumber || '-'}</span>
            </div>
            <div className="ordersList-row">
              <span className="ordersList-label">Status</span>
              <span className="ordersList-value">{order.status || '-'}</span>
            </div>
            <div className="ordersList-row">
              <span className="ordersList-label">Total price</span>
              <span className="ordersList-value">{order.totalPrice || '-'}</span>
            </div>
            <div className="ordersList-row">
              <span className="ordersList-label">Created</span>
              <span className="ordersList-value">{order.createdAt || '-'}</span>
            </div>
            <div className="ordersList-row">
              <span className="ordersList-label">Customer</span>
              <span className="ordersList-value">{customerName || '-'}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

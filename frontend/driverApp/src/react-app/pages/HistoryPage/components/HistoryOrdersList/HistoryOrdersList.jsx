import { HistoryOrderCard } from '../HistoryOrderCard/HistoryOrderCard.jsx';
import './HistoryOrdersList.css';

function HistoryOrdersList({ orders, onOpen }) {
  return (
    <ul className="ordersList orderHistoryList">
      {orders.map(order => (
        <HistoryOrderCard key={order.id} order={order} onOpen={onOpen} />
      ))}
    </ul>
  );
}

export { HistoryOrdersList };

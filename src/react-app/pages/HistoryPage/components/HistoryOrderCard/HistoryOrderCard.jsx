import { useNavigate } from 'react-router-dom';

import {
  formatDateTime,
  getCustomerName,
  getHistoryBucket,
  getOrderTripTime,
  getRouteLabel,
  getTotalPrice,
} from '../../historyUtils.js';
import './HistoryOrderCard.css';

function HistoryOrderCard({ order, onOpen }) {
  const navigate = useNavigate();
  const status = getHistoryBucket(order);
  const customerName = getCustomerName(order);
  const route = getRouteLabel(order);
  const totalPrice = getTotalPrice(order);
  const dateTime = formatDateTime(getOrderTripTime(order) || order?.createdAt);

  function handleOpenDisplay(event) {
    event.stopPropagation();
    navigate(`/cz/pdf/history/display/${order.id}`);
  }

  function handleOpenDetails() {
    onOpen(order.id);
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpenDetails();
    }
  }

  return (
    <li className={`orderItem orderItem--history orderItem--${status.bucket}`}>
      <article
        className="orderItemCard orderItemCard-history"
        role="button"
        tabIndex={0}
        onClick={handleOpenDetails}
        onKeyDown={handleKeyDown}
      >
        <div className="orderItemHeader">
          <div className="orderItemIdentity">
            <div className="orderItemIdentityRow">
              <strong
                className={`orderItemCustomer ${customerName === 'Client not specified' ? 'is-placeholder' : ''}`}
              >
                {customerName}
              </strong>
              <button
                className="orderItemMeetButton"
                type="button"
                onClick={handleOpenDisplay}
                aria-label={`Open display screen for ${customerName}`}
                title="Open display screen"
              >
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <rect x="3.5" y="5" width="17" height="12.5" rx="2.5" />
                  <path d="M8 20h8M12 17.5v2.5" />
                </svg>
              </button>
            </div>
            <p className={`orderItemRoute ${route === 'Route not added' ? 'is-placeholder' : ''}`}>
              {route}
            </p>
          </div>
          <span className="orderStatusBadge">{status.label}</span>
        </div>
        <div className="orderItemMetaRow">
          <strong className={`orderItemPrice ${totalPrice === 'No price' ? 'is-placeholder' : ''}`}>
            {totalPrice}
          </strong>
          <span className="orderItemDate">{dateTime}</span>
          <span className="orderItemArrow" aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false">
              <path d="M7.5 4.5 13 10l-5.5 5.5" />
            </svg>
          </span>
        </div>
      </article>
    </li>
  );
}

export { HistoryOrderCard };

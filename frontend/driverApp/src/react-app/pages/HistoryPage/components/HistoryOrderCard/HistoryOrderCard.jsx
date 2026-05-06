import { useNavigate } from 'react-router-dom';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import {
  formatDateTime,
  getCustomerName,
  getHistoryBucket,
  getOrderTripTime,
  getTotalPrice,
} from '../../historyUtils.js';
import './HistoryOrderCard.css';

function HistoryOrderCard({ order, onOpen }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const status = getHistoryBucket(order);
  const customerName = getCustomerName(order);
  const totalPrice = getTotalPrice(order);
  const dateTime = formatDateTime(getOrderTripTime(order) || order?.createdAt);
  const routeFrom =
    order?.contractData?.trip?.from?.address ||
    order?.trip?.from?.address ||
    order?.trip?.from ||
    '';
  const routeTo =
    order?.contractData?.trip?.to?.address ||
    order?.trip?.to?.address ||
    order?.trip?.to ||
    '';
  const hasRoute = Boolean(routeFrom && routeTo);

  function handleOpenDisplay(event) {
    event.stopPropagation();
    navigate(`/history/display/${order.id}`);
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
                className={`orderItemCustomer ${customerName === t('history.customerNotSpecified') ? 'is-placeholder' : ''}`}
              >
                {customerName}
              </strong>
              <button
                className="orderItemMeetButton"
                type="button"
                onClick={handleOpenDisplay}
                aria-label={`${t('history.openDisplay')} ${customerName}`}
                title={t('history.openDisplay')}
              >
                <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                  <rect x="3.5" y="5" width="17" height="12.5" rx="2.5" />
                  <path d="M8 20h8M12 17.5v2.5" />
                </svg>
              </button>
            </div>
            <p className={`orderItemRoute ${hasRoute ? '' : 'is-placeholder'}`}>
              {hasRoute ? (
                <>
                  <span className="orderItemRouteLine">{routeFrom}</span>
                  <span className="orderItemRouteLine">{routeTo}</span>
                </>
              ) : (
                t('history.routeNotAdded')
              )}
            </p>
          </div>
          <span className="orderStatusBadge">{status.label}</span>
        </div>
        <div className="orderItemMetaRow">
          <strong className={`orderItemPrice ${totalPrice === t('history.noPrice') ? 'is-placeholder' : ''}`}>
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

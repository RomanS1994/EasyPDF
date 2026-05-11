import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import {
  formatDateTime,
  getCustomerName,
  getHistoryBucket,
  getOrderTripTime,
  getTotalPrice,
} from '../../historyUtils.js';
import { HistoryRouteModal } from '../HistoryRouteModal/HistoryRouteModal.jsx';
import './HistoryOrderCard.css';

function RouteOpenIcon() {
  return (
    <svg viewBox="0 0 20 20" focusable="false" aria-hidden="true">
      <path
        d="M7 4.5 12.5 10 7 15.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path d="M5.5 7.5a2 2 0 0 1 2-2h8.4a2 2 0 0 1 2 2v1.1h-8.1a2.8 2.8 0 0 0 0 5.6h8.1v1.8a2 2 0 0 1-2 2h-8.4a2 2 0 0 1-2-2Z" />
      <path d="M17.9 8.4h1a1.7 1.7 0 0 1 1.7 1.7v2a1.7 1.7 0 0 1-1.7 1.7h-8.6a2.7 2.7 0 0 1 0-5.4Z" />
      <circle cx="17.1" cy="11" r="0.8" fill="currentColor" />
    </svg>
  );
}

function RouteStartIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" strokeWidth="3.2" />
      <circle cx="12" cy="12" r="2.4" fill="#ffffff" />
    </svg>
  );
}

function RouteEndIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        d="M12 20.2c-2.9-3.4-5.2-6.1-5.2-9.2a5.2 5.2 0 1 1 10.4 0c0 3.1-2.3 5.8-5.2 9.2Z"
        fill="currentColor"
      />
      <circle cx="12" cy="10.2" r="1.9" fill="#ffffff" />
    </svg>
  );
}

function HistoryOrderCard({ order, onOpen }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [routeModal, setRouteModal] = useState({
    address: '',
    label: '',
  });
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

  function handleOpenRouteModal(event, address, label) {
    event.stopPropagation();

    if (!address) {
      return;
    }

    setRouteModal({
      address,
      label,
    });
  }

  function handleCloseRouteModal() {
    setRouteModal({
      address: '',
      label: '',
    });
  }

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
          <strong
            className={`orderItemCustomer ${customerName === t('history.customerNotSpecified') ? 'is-placeholder' : ''}`}
          >
            {customerName}
          </strong>
          <div className="orderItemHeaderActions">
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
            <span className="orderStatusBadge">
              {status.bucket === 'today' ? <span className="orderStatusBadgeDot" aria-hidden="true" /> : null}
              {status.label}
            </span>
          </div>
        </div>
        <div className="orderItemRouteCard">
          <div className="orderItemRouteTrack" aria-hidden="true">
            <span className="orderItemRouteTrackStart">
              <RouteStartIcon />
            </span>
            <span className="orderItemRouteTrackLine" />
            <span className="orderItemRouteTrackEnd">
              <RouteEndIcon />
            </span>
          </div>

          <div className={`orderItemRoute ${hasRoute ? '' : 'is-placeholder'}`}>
            {hasRoute ? (
              <>
                <button
                  className="orderItemRouteLineButton"
                  type="button"
                  onClick={(event) => handleOpenRouteModal(event, routeFrom, t('history.routeFrom'))}
                >
                  <span className="orderItemRouteLineText">
                    <span className="orderItemRouteLineLabel">{t('history.routeFrom')}</span>
                    <span className="orderItemRouteLineValue">{routeFrom}</span>
                  </span>
                  <span className="orderItemRouteLineArrow" aria-hidden="true">
                    <RouteOpenIcon />
                  </span>
                </button>
                <button
                  className="orderItemRouteLineButton"
                  type="button"
                  onClick={(event) => handleOpenRouteModal(event, routeTo, t('history.routeTo'))}
                >
                  <span className="orderItemRouteLineText">
                    <span className="orderItemRouteLineLabel">{t('history.routeTo')}</span>
                    <span className="orderItemRouteLineValue">{routeTo}</span>
                  </span>
                  <span className="orderItemRouteLineArrow" aria-hidden="true">
                    <RouteOpenIcon />
                  </span>
                </button>
              </>
            ) : (
              t('history.routeNotAdded')
            )}
          </div>
        </div>
        <div className="orderItemMetaRow">
          <span className="orderItemMetaIcon" aria-hidden="true">
            <WalletIcon />
          </span>
          <strong className={`orderItemPrice ${totalPrice === t('history.noPrice') ? 'is-placeholder' : ''}`}>
            {totalPrice}
          </strong>
          <span className="orderItemMetaDivider" aria-hidden="true" />
          <div className="orderItemDateWrap">
            <span className="orderItemDateIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <rect x="4.5" y="5.5" width="15" height="14" rx="2.4" />
                <path d="M8 3.8v3.1M16 3.8v3.1M4.8 9.5h14.4" />
              </svg>
            </span>
            <span className="orderItemDate">{dateTime}</span>
          </div>
          <button className="orderItemArrow" type="button" onClick={handleOpenDetails} aria-label={t('history.openDetails')}>
            <svg viewBox="0 0 20 20" focusable="false">
              <path d="M7.5 4.5 13 10l-5.5 5.5" />
            </svg>
          </button>
        </div>
      </article>

      {routeModal.address ? (
        <HistoryRouteModal
          address={routeModal.address}
          label={routeModal.label}
          onClose={handleCloseRouteModal}
          t={t}
        />
      ) : null}
    </li>
  );
}

export { HistoryOrderCard };

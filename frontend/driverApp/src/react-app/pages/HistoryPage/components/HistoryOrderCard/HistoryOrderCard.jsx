import { useState } from 'react';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { SvgIcon } from '@shared/app/components/SvgIcon/SvgIcon.jsx';
import {
  getCustomerName,
  getHistoryBucket,
  getOrderTripTime,
  getTotalPrice,
} from '../../historyUtils.js';
import { parseDateValue } from '../../../shared/dateUtils.js';
import { HistoryRouteModal } from '../HistoryRouteModal/HistoryRouteModal.jsx';
import './HistoryOrderCard.css';

function RouteOpenIcon() {
  return <SvgIcon name="route-open" />;
}

function WalletIcon() {
  return <SvgIcon name="wallet" />;
}

function RouteStartIcon() {
  return <SvgIcon name="today" />;
}

function RouteEndIcon() {
  return <SvgIcon name="completed" />;
}

function formatDate(value) {
  const date = parseDateValue(value);

  if (!date) {
    return '-';
  }

  return date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function HistoryOrderCard({ order, onOpen }) {
  const { t } = useI18n();
  const [routeModal, setRouteModal] = useState({
    address: '',
    label: '',
  });
  const status = getHistoryBucket(order);
  const customerName = getCustomerName(order);
  const totalPrice = getTotalPrice(order);
  const dateValue = formatDate(getOrderTripTime(order) || order?.createdAt);
  const timeValue = (() => {
    const date = parseDateValue(getOrderTripTime(order) || order?.createdAt);

    if (!date) {
      return '-';
    }

    return date.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  })();
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
              <SvgIcon name="calendar" />
            </span>
            <span className="orderItemDate">
              <span className="orderItemDateValue">{dateValue}</span>
              <span className="orderItemDateTime">{timeValue}</span>
            </span>
          </div>
          <button className="orderItemArrow" type="button" onClick={handleOpenDetails} aria-label={t('history.openDetails')}>
            <SvgIcon name="chevron-right" />
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

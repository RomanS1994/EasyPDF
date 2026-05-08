import { useEffect } from 'react';

import './HistoryRouteModal.css';

const WAZE_ICON_URL = '/icons/waze.svg';
const GOOGLE_MAPS_ICON_URL = 'https://upload.wikimedia.org/wikipedia/commons/a/aa/Google_Maps_icon_%282020%29.svg';

function buildWazeUrl(address) {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}

function buildGoogleMapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
      <path
        d="M5 19.5h5.2c1.2 0 2.3-.5 3.1-1.4l5.1-5.7c1.1-1.2 1-3-.2-4.1-1.1-1-2.8-1-3.9.1l-2.5 2.5c-.7.7-1.7 1.1-2.7 1.1H5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M15.5 5.5c.7 0 1.3.6 1.3 1.3s-.6 1.3-1.3 1.3-1.3-.6-1.3-1.3.6-1.3 1.3-1.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M8.2 16.5 5 19.5M11 13.4l-2.2 2.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Показує адресу та відкриває маршрути в навігаторах.
export function HistoryRouteModal({ address, label, onClose, t }) {
  useEffect(() => {
    if (!address) {
      return undefined;
    }

    const body = document.body;
    body.classList.add('no-scroll');

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      body.classList.remove('no-scroll');
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [address, onClose]);

  if (!address) {
    return null;
  }

  return (
    <div className="historyRouteModal" role="presentation" onClick={onClose}>
      <div
        className="historyRouteModal-backdrop"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        className="historyRouteModal-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={t('history.routeModalTitle')}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="historyRouteModal-icon" aria-hidden="true">
          <RouteIcon />
        </div>

        <div className="historyRouteModal-copy">
          <p className="historyRouteModal-eyebrow">{label || t('history.routeAddress')}</p>
          <h3>{t('history.routeModalTitle')}</h3>
          <p>{t('history.routeModalCopy')}</p>
          <p>{address}</p>
        </div>

        <div className="historyRouteModal-actions">
          <a
            className="historyRouteModal-button historyRouteModal-button--waze"
            href={buildWazeUrl(address)}
            target="_blank"
            rel="noreferrer"
          >
            <span className="historyRouteModal-buttonIcon historyRouteModal-buttonIcon--waze" aria-hidden="true">
              <img src={WAZE_ICON_URL} alt="" loading="eager" decoding="async" />
            </span>
            <span>{t('history.routeModalWaze')}</span>
          </a>
          <a
            className="historyRouteModal-button historyRouteModal-button--google"
            href={buildGoogleMapsUrl(address)}
            target="_blank"
            rel="noreferrer"
          >
            <span className="historyRouteModal-buttonIcon historyRouteModal-buttonIcon--google" aria-hidden="true">
              <img src={GOOGLE_MAPS_ICON_URL} alt="" loading="eager" decoding="async" />
            </span>
            <span>{t('history.routeModalGoogleMaps')}</span>
          </a>
        </div>

        <button className="historyRouteModal-close" type="button" onClick={onClose}>
          {t('common.close')}
        </button>
      </div>
    </div>
  );
}

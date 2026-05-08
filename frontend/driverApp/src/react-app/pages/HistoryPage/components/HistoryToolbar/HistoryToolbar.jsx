import { useRef } from 'react';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import './HistoryToolbar.css';

function NewestIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 4v11" />
      <path d="m5.5 8.5 4.5-4.5 4.5 4.5" />
    </svg>
  );
}

function OldestIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 5v11" />
      <path d="m5.5 11.5 4.5 4.5 4.5-4.5" />
    </svg>
  );
}

function TripDateIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <rect x="3" y="4.5" width="14" height="12" rx="2.5" />
      <path d="M3 8h14" />
      <path d="M6.5 3v3" />
      <path d="M13.5 3v3" />
    </svg>
  );
}

function formatSelectedDate(value) {
  if (!value) {
    return '';
  }

  const [year, month, day] = String(value).split('-');
  if (!year || !month || !day) {
    return value;
  }

  return `${day}.${month}.${year}`;
}

function HistoryToolbar({ dateFilter, onDateChange, onResetDate, sortKey, onSortChange }) {
  const { t } = useI18n();
  const dateInputRef = useRef(null);
  const sortOptions = [
    { key: 'oldest', label: t('history.oldest'), icon: <OldestIcon /> },
    { key: 'newest', label: t('history.newest'), icon: <NewestIcon /> },
  ];

  function handleOpenDatePicker() {
    const input = dateInputRef.current;
    if (!input) {
      return;
    }

    if (typeof input.showPicker === 'function') {
      input.showPicker();
      return;
    }

    input.click();
  }

  const selectedDateLabel = formatSelectedDate(dateFilter);

  return (
    <div className="orderHistoryToolbar">
      <div className="orderHistorySortField" role="group" aria-label={t('history.sort')}>
        <span className="visuallyHidden">{t('history.sort')}</span>
        {sortOptions.map(option => (
          <button
            key={option.key}
            className={`orderHistorySortButton orderHistorySortButton--sort ${sortKey === option.key ? 'is-active' : ''}`}
            type="button"
            aria-pressed={sortKey === option.key}
            aria-label={option.label}
            title={option.label}
            onClick={() => onSortChange(option.key)}
          >
            {option.icon}
          </button>
        ))}
      </div>

      <div className="orderHistoryDateField" role="group" aria-label={t('history.tripDate')}>
        <button
          className={`orderHistorySortButton orderHistorySortButton--date ${dateFilter ? 'is-active' : ''}`}
          type="button"
          aria-label={t('history.tripDate')}
          title={dateFilter ? `${t('history.tripDate')}: ${dateFilter}` : t('history.tripDate')}
          onClick={handleOpenDatePicker}
        >
          <TripDateIcon />
          <input
            ref={dateInputRef}
            className="orderHistoryDateInput"
            type="date"
            value={dateFilter}
            onChange={event => onDateChange(event.target.value)}
            aria-label={t('history.tripDate')}
            tabIndex={-1}
          />
        </button>

        <span className={`orderHistoryDateLabel ${dateFilter ? 'is-active' : ''}`}>
          {selectedDateLabel || t('history.date')}
        </span>

        <button
          className="orderHistorySortButton orderHistorySortButton--clear"
          type="button"
          aria-label={t('common.clear')}
          title={t('common.clear')}
          onClick={onResetDate}
          disabled={!dateFilter}
        >
          <svg viewBox="0 0 20 20" aria-hidden="true">
            <path d="M5.5 5.5 14.5 14.5" />
            <path d="M14.5 5.5 5.5 14.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export { HistoryToolbar };

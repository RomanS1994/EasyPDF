import { useI18n } from '@shared/app/i18n/useI18n.js';
import './HistoryToolbar.css';

function HistoryToolbar({ dateFilter, onDateChange, onResetDate, sortKey, onSortChange }) {
  const { t } = useI18n();
  return (
    <div className="orderHistoryToolbar">
      <div className="orderHistoryToolbarLeft">
        <label className="orderHistoryDateField">
          <span className="orderHistoryLabel">
            <span className="orderHistoryLabelContent">
              <svg className="orderHistoryLabelIcon" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="2.5" y="4" width="15" height="13" rx="2.5" />
                <path d="M2.5 7.5h15" />
                <path d="M6 2.75v3" />
                <path d="M14 2.75v3" />
              </svg>
              <span className="orderHistoryLabelText">{t('history.date')}</span>
            </span>
          </span>
          <input type="date" value={dateFilter} onChange={event => onDateChange(event.target.value)} />
        </label>

        <button className="orderHistoryResetBtn" type="button" onClick={onResetDate}>
          <span className="orderHistoryResetIcon" aria-hidden="true">
            <svg viewBox="0 0 20 20" focusable="false">
              <path d="M16.5 6.5v4.2h-4.2" />
              <path d="M16.2 10.7A6 6 0 1 1 15 7.5" />
            </svg>
          </span>
        </button>
      </div>

      <div className="orderHistoryToolbarRight">
        <label className="orderHistorySortField">
          <span className="visuallyHidden">{t('history.sort')}</span>
          <select
            className="orderHistorySortSelect"
            value={sortKey}
            onChange={event => onSortChange(event.target.value)}
          >
            <option value="newest">{t('history.newest')}</option>
            <option value="oldest">{t('history.oldest')}</option>
            <option value="trip-date">{t('history.tripDate')}</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export { HistoryToolbar };

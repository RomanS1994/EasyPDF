import './HistoryToolbar.css';

function HistoryToolbar({ dateFilter, onDateChange, onResetDate, sortKey, onSortChange }) {
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
              <span className="orderHistoryLabelText">Date</span>
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
          <span className="visuallyHidden">Sort</span>
          <select
            className="orderHistorySortSelect"
            value={sortKey}
            onChange={event => onSortChange(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="trip-date">Trip date</option>
          </select>
        </label>
      </div>
    </div>
  );
}

export { HistoryToolbar };

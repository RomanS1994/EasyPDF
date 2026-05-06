import { useI18n } from '@shared/app/i18n/useI18n.js';
import './HistoryTabs.css';

function HistoryTabs({ activeTab, counts, onChange }) {
  const { t } = useI18n();
  function isActive(tab) {
    return activeTab === tab;
  }

  return (
    <div className="orderHistoryTabs" role="tablist" aria-label={t('history.orderStatusTabs')}>
      <button
        className={`orderHistoryTab ${isActive('today') ? 'is-active' : ''}`}
        type="button"
        role="tab"
        aria-selected={isActive('today')}
        onClick={() => onChange('today')}
      >
        <span className="orderHistoryTabIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <path d="M3.5 8.5h17" />
            <path d="M8 3.2v3.3" />
            <path d="M16 3.2v3.3" />
            <circle cx="12" cy="13.4" r="1.4" />
          </svg>
        </span>
        <span className="orderHistoryTabLabel">{t('history.today')}</span>
        <span className="orderHistoryTabCount" aria-hidden="true">{counts.today}</span>
      </button>

      <button
        className={`orderHistoryTab ${isActive('planned') ? 'is-active' : ''}`}
        type="button"
        role="tab"
        aria-selected={isActive('planned')}
        onClick={() => onChange('planned')}
      >
        <span className="orderHistoryTabIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <path d="M3.5 8.5h17" />
            <path d="M8 3.2v3.3" />
            <path d="M16 3.2v3.3" />
            <circle cx="16.5" cy="15.2" r="2.8" />
            <path d="M16.5 13.9v1.6" />
            <path d="M16.5 15.2l1.1.9" />
          </svg>
        </span>
        <span className="orderHistoryTabLabel">{t('history.planned')}</span>
        <span className="orderHistoryTabCount" aria-hidden="true">{counts.planned}</span>
      </button>

      <button
        className={`orderHistoryTab ${isActive('completed') ? 'is-active' : ''}`}
        type="button"
        role="tab"
        aria-selected={isActive('completed')}
        onClick={() => onChange('completed')}
      >
        <span className="orderHistoryTabIcon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="12" r="7" />
            <path d="M9.2 12.2 11 14l3.9-4" />
          </svg>
        </span>
        <span className="orderHistoryTabLabel">{t('history.completed')}</span>
        <span className="orderHistoryTabCount" aria-hidden="true">{counts.completed}</span>
      </button>
    </div>
  );
}

export { HistoryTabs };

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { getDateKey, getOrderDate, parseDateValue } from '../../../shared/dateUtils.js';
import './StatsActivityPanel.css';

function getDayLabel(date) {
  // Показуємо коротку назву дня.
  return date.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2);
}

function buildActivitySeries(orders, usage) {
  // Рахуємо активність за останні 7 днів.
  const endDate = usage?.periodEnd ? parseDateValue(usage.periodEnd) : new Date();
  const now = new Date();
  const anchor = endDate && endDate.getTime() > now.getTime() ? now : endDate || now;

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(anchor);
    date.setDate(anchor.getDate() - (6 - index));
    const key = getDateKey(date);
    let count = 0;

    for (const order of orders) {
      if (getDateKey(getOrderDate(order)) === key) {
        count += 1;
      }
    }

    return {
      key,
      count,
      label: getDayLabel(date),
    };
  });
}

function getStatusBucket(status) {
  // Групуємо статус у просту трійку для діаграми.
  const value = String(status || '').toLowerCase();

  if (value === 'pdf_failed' || value === 'failed') {
    return 'failed';
  }

  if (value === 'pdf_generated' || value === 'completed') {
    return 'generated';
  }

  return 'pending';
}

function buildStatusBreakdown(orders) {
  // Рахуємо мікс статусів без складних структур.
  const counts = {
    generated: 0,
    pending: 0,
  };

  for (const order of orders) {
    const bucket = getStatusBucket(order.status);
    counts[bucket] += 1;
  }

  return counts;
}

function getSummaryLabel(series, t) {
  // Складаємо короткий підсумок за тиждень.
  let total = 0;

  for (const item of series) {
    total += item.count;
  }

  return `${total} ${t('stats.ordersIn7Days')}`;
}

export function StatsActivityPanel({ usage, orders }) {
  const { t } = useI18n();
  const series = buildActivitySeries(orders, usage);
  const maxCount = Math.max(1, ...series.map(item => item.count));
  const statusCounts = buildStatusBreakdown(orders);
  const deletedMessagesCount = Number(usage?.deletedMessages || 0);
  const statusTotal = Math.max(1, statusCounts.generated + statusCounts.pending + deletedMessagesCount);
  const summaryLabel = getSummaryLabel(series, t);
  const deletedMessagesLabel = String(deletedMessagesCount);
  return (
    <section className="statsPanel is-active statsActivityPanel">
      <div className="statsVizCard">
        <div className="usageCard-head">
          <h3>{t('stats.last7Days')}</h3>
          <span>{summaryLabel}</span>
        </div>
        <div className="activityBars">
          {series.map(item => {
            const height = Math.max(12, Math.round((item.count / maxCount) * 100));

            return (
              <div key={item.key} className="activityBarItem">
                <span className="activityBarValue">{item.count}</span>
                <div className="activityBarTrack">
                  <span className="activityBarFill" style={{ height: `${height}%` }} />
                </div>
                <span className="activityBarLabel">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="statsVizCard">
        <div className="usageCard-head">
          <h3>{t('stats.statusMix')}</h3>
          <span>
            {orders.length} total · {deletedMessagesLabel} deleted
          </span>
        </div>
        <div className="statusStack">
          {orders.length ? (
            <>
              <span
                className="statusSegment statusSegment-generated"
                style={{ width: `${(statusCounts.generated / statusTotal) * 100}%` }}
              />
              <span
                className="statusSegment statusSegment-pending"
                style={{ width: `${(statusCounts.pending / statusTotal) * 100}%` }}
              />
              <span
                className="statusSegment statusSegment-deleted"
                style={{ width: `${(deletedMessagesCount / statusTotal) * 100}%` }}
              />
            </>
          ) : (
            <span className="statusSegment statusSegment-deleted" style={{ width: '100%' }} />
          )}
        </div>
        <div className="statusLegend">
          <div className="statusLegendItem">
            <span className="statusLegendDot statusLegendDot-generated" />
            <span>{t('stats.generated')}</span>
            <strong>{statusCounts.generated}</strong>
          </div>
          <div className="statusLegendItem">
            <span className="statusLegendDot statusLegendDot-pending" />
            <span>{t('stats.pending')}</span>
            <strong>{statusCounts.pending}</strong>
          </div>
          <div className="statusLegendItem">
            <span className="statusLegendDot statusLegendDot-deleted" />
            <span>{t('stats.deleted')}</span>
            <strong>{deletedMessagesCount}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

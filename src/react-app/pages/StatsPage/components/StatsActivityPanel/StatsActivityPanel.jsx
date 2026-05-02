import './StatsActivityPanel.css';

function parseDateValue(value) {
  // Перетворюємо значення дати у зручний формат.
  if (!value) return null;

  const text = String(value).trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T00:00:00`
    : /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(text)
      ? text.replace(' ', 'T')
      : text;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getDayKey(value) {
  // Будуємо стабільний ключ для порівняння дат.
  const date = parseDateValue(value);

  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getOrderDate(order) {
  // Беремо робочу дату замовлення без зайвих перевірок.
  return order?.createdAt || order?.contractData?.today || order?.trip?.time || '';
}

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
    const key = getDayKey(date);
    let count = 0;

    for (const order of orders) {
      if (getDayKey(getOrderDate(order)) === key) {
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

  if (value === 'pdf_generated' || value === 'completed' || value === 'archived') {
    return 'generated';
  }

  return 'pending';
}

function buildStatusBreakdown(orders) {
  // Рахуємо мікс статусів без складних структур.
  const counts = {
    generated: 0,
    pending: 0,
    failed: 0,
  };

  for (const order of orders) {
    const bucket = getStatusBucket(order.status);
    counts[bucket] += 1;
  }

  return counts;
}

function getSummaryLabel(series) {
  // Складаємо короткий підсумок за тиждень.
  let total = 0;

  for (const item of series) {
    total += item.count;
  }

  return `${total} orders in 7 days`;
}

export function StatsActivityPanel({ usage, orders }) {
  const series = buildActivitySeries(orders, usage);
  const maxCount = Math.max(1, ...series.map(item => item.count));
  const statusCounts = buildStatusBreakdown(orders);
  const statusTotal = Math.max(1, statusCounts.generated + statusCounts.pending + statusCounts.failed);
  const summaryLabel = getSummaryLabel(series);

  return (
    <section className="statsPanel is-active statsActivityPanel">
      <div className="statsVizCard">
        <div className="usageCard-head">
          <h3>Last 7 days</h3>
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
          <h3>Status mix</h3>
          <span>{orders.length} total</span>
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
                className="statusSegment statusSegment-failed"
                style={{ width: `${(statusCounts.failed / statusTotal) * 100}%` }}
              />
            </>
          ) : (
            <span className="statusSegment statusSegment-pending" style={{ width: '100%' }} />
          )}
        </div>
        <div className="statusLegend">
          <div className="statusLegendItem">
            <span className="statusLegendDot statusLegendDot-generated" />
            <span>Generated</span>
            <strong>{statusCounts.generated}</strong>
          </div>
          <div className="statusLegendItem">
            <span className="statusLegendDot statusLegendDot-pending" />
            <span>Pending</span>
            <strong>{statusCounts.pending}</strong>
          </div>
          <div className="statusLegendItem">
            <span className="statusLegendDot statusLegendDot-failed" />
            <span>Failed</span>
            <strong>{statusCounts.failed}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

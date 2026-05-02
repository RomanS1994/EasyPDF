import './StatsUsagePanel.css';

function parseDateValue(value) {
  // Перетворюємо рядок дати у Date.
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

function formatShortDate(value) {
  // Форматуємо дату компактно для картки циклу.
  const date = parseDateValue(value);

  if (!date) {
    return '-';
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getCycleLabel(usage) {
  // Повертаємо короткий напис для поточного циклу.
  if (usage?.month) {
    const monthText = String(usage.month);

    if (/^\d{4}-\d{2}$/.test(monthText)) {
      const [year, month] = monthText.split('-');
      const date = new Date(Number(year), Number(month) - 1, 1);

      if (!Number.isNaN(date.getTime())) {
        return new Intl.DateTimeFormat('en-GB', {
          month: 'short',
          year: 'numeric',
        }).format(date);
      }
    }

    return monthText;
  }

  if (usage?.cycleLabel) {
    const text = String(usage.cycleLabel);

    if (text.includes(' - ')) {
      return text.split(' - ')[0];
    }

    return text;
  }

  const start = formatShortDate(usage?.periodStart);

  if (start === '-') {
    return 'Current cycle';
  }

  return start;
}

function getPlanForecast(usage) {
  // Оцінюємо простий прогноз на кінець циклу.
  const start = parseDateValue(usage?.periodStart);
  const end = parseDateValue(usage?.periodEnd);

  if (!start || !end) {
    return {
      projectedVolume: 0,
      projectedPercent: 0,
      label: 'No forecast yet',
    };
  }

  const now = new Date();
  const anchor = now.getTime() > end.getTime() ? end : now;
  const elapsedDays = Math.max(
    1,
    Math.ceil((anchor.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const totalDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const perDay = usage.used / elapsedDays;
  const projectedVolume = Math.round(perDay * totalDays);
  const projectedPercent = usage.limit ? Math.min(100, Math.round((projectedVolume / usage.limit) * 100)) : 0;
  let label = 'On track';

  if (perDay <= 0) {
    label = 'No activity yet';
  }

  if (usage.limit > 0 && projectedVolume > usage.limit) {
    const remaining = Math.max(usage.limit - usage.used, 0);
    const daysToLimit = remaining > 0 ? Math.ceil(remaining / Math.max(perDay, 0.01)) : 0;
    const forecastDate = new Date(anchor);
    forecastDate.setDate(forecastDate.getDate() + daysToLimit);
    label = new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
    }).format(forecastDate);
  }

  return {
    projectedVolume,
    projectedPercent,
    label,
  };
}

export function StatsUsagePanel({ usage, orders, generatedCount }) {
  const percent = usage.percent || 0;
  const forecast = getPlanForecast(usage);
  const cycleLabel = getCycleLabel(usage);
  const planLimitLabel = usage.limit ? `${usage.used} / ${usage.limit} docs` : 'No active limit';
  const remainingLabel = String(usage.remaining || 0);
  const totalOrders = String(orders.length || 0);

  return (
    <section className="statsPanel is-active">
      <div className="statsHero">
        <div className="statsRing" style={{ '--progress': `${percent}%` }}>
          <div className="statsRing-inner">
            <strong>{percent}%</strong>
            <span>{percent}% used</span>
          </div>
        </div>

        <div className="statsMiniGrid">
          <article className="statsMiniCard">
            <span>Cycle</span>
            <strong>{cycleLabel}</strong>
          </article>
          <article className="statsMiniCard">
            <span>Used</span>
            <strong>{usage.used}</strong>
          </article>
          <article className="statsMiniCard">
            <span>Remaining</span>
            <strong>{remainingLabel}</strong>
          </article>
          <article className="statsMiniCard">
            <span>PDF</span>
            <strong>{generatedCount}</strong>
          </article>
        </div>
      </div>

      <div className="usageCard usageCard-stats">
        <div className="usageCard-head">
          <h3>Cycle limit</h3>
          <span>{planLimitLabel}</span>
        </div>
        <div className="usageBar">
          <div className="usageBar-fill" style={{ width: `${percent}%` }} />
        </div>
        <div className="usageForecast">
          <article className="usageForecast-card">
            <span>Forecast</span>
            <strong>{forecast.projectedVolume}</strong>
            <p>Projected count for this cycle.</p>
          </article>
          <article className="usageForecast-card">
            <span>Limit date</span>
            <strong>{forecast.label}</strong>
            <p>Limit date or activity status.</p>
          </article>
          <article className="usageForecast-card">
            <span>Total</span>
            <strong>{totalOrders}</strong>
            <p>Stored orders in this workspace.</p>
          </article>
        </div>
      </div>
    </section>
  );
}

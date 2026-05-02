import './StatsSalaryPanel.css';

function parseDateValue(value) {
  // Перетворюємо рядок дати у Date для простого аналізу.
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

function getOrderDate(order) {
  // Беремо дату замовлення з найстабільнішого поля.
  return order?.createdAt || order?.contractData?.today || order?.trip?.time || '';
}

function getCycleOrders(orders, usage) {
  // Відібраємо тільки замовлення поточного циклу.
  const start = parseDateValue(usage?.periodStart);
  const end = parseDateValue(usage?.periodEnd);

  if (!start || !end) {
    return orders;
  }

  return orders.filter(order => {
    const date = parseDateValue(getOrderDate(order));

    if (!date) {
      return false;
    }

    return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
  });
}

function parsePriceValue(value) {
  // Дістаємо число із price-рядка без складних форматів.
  if (value === null || value === undefined) {
    return 0;
  }

  const text = String(value).replace(',', '.');
  const match = text.match(/-?\d+(?:\.\d+)?/);
  const number = match ? Number(match[0]) : 0;

  if (!Number.isFinite(number)) {
    return 0;
  }

  return number;
}

function formatMoney(value) {
  // Форматуємо суму для красивого великого числа.
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
}

function getDayKey(date) {
  // Будуємо короткий ключ дня для групування.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDayLabel(date) {
  // Показуємо коротку назву дня у зрозумілому форматі.
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
  }).format(date);
}

function getTopDays(orders) {
  // Рахуємо найсильніші дні по сумі замовлень.
  const totals = new Map();

  for (const order of orders) {
    const date = parseDateValue(getOrderDate(order));

    if (!date) {
      continue;
    }

    const key = getDayKey(date);
    const amount = parsePriceValue(order?.totalPrice || order?.contractData?.totalPrice);

    if (!totals.has(key)) {
      totals.set(key, {
        key,
        label: getDayLabel(date),
        amount: 0,
      });
    }

    const item = totals.get(key);
    item.amount += amount;
  }

  return Array.from(totals.values())
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);
}

export function StatsSalaryPanel({ orders, usage }) {
  const cycleOrders = getCycleOrders(orders, usage);
  const grossTotal = cycleOrders.reduce(
    (sum, order) => sum + parsePriceValue(order?.totalPrice || order?.contractData?.totalPrice),
    0,
  );
  const estimatedSalary = grossTotal * 0.72;
  const bonus = grossTotal * 0.08;
  const takeHomeShare = grossTotal ? Math.min(100, Math.round((estimatedSalary / grossTotal) * 100)) : 0;
  const bestDays = getTopDays(cycleOrders);
  const topDay = bestDays[0];
  const cycleCount = cycleOrders.length;
  const avgRide = cycleCount ? estimatedSalary / cycleCount : 0;

  return (
    <section className="statsPanel is-active statsSalaryPanel">
      <div className="salaryHeroCard">
        <div className="salaryHeroMain">
          <p className="sectionEyebrow">Salary</p>
          <h3>Estimated payout</h3>
          <strong>{formatMoney(estimatedSalary)} CZK</strong>
          <p>Approximate driver salary for the active cycle.</p>
        </div>

        <div className="salaryHeroAside">
          <div className="salaryHeroStat">
            <span>Gross</span>
            <strong>{formatMoney(grossTotal)}</strong>
          </div>
          <div className="salaryHeroStat">
            <span>Share</span>
            <strong>{takeHomeShare}%</strong>
          </div>
          <div className="salaryHeroStat">
            <span>Orders</span>
            <strong>{cycleCount}</strong>
          </div>
        </div>
      </div>

      <div className="salaryLedgerCard">
        <div className="usageCard-head">
          <h3>Payout breakdown</h3>
          <span>{usage?.cycleLabel || 'Current cycle'}</span>
        </div>

        <div className="salaryLedger">
          <article className="salaryLedgerRow">
            <div className="salaryLedgerRow-copy">
              <span>Driver payout</span>
              <p>Main salary estimate from all completed rides.</p>
            </div>
            <strong>{formatMoney(estimatedSalary)} CZK</strong>
          </article>
          <article className="salaryLedgerRow">
            <div className="salaryLedgerRow-copy">
              <span>Cycle bonus</span>
              <p>Soft bonus estimate from strong activity.</p>
            </div>
            <strong>{formatMoney(bonus)} CZK</strong>
          </article>
          <article className="salaryLedgerRow">
            <div className="salaryLedgerRow-copy">
              <span>Average ride</span>
              <p>Estimated payout per order in this cycle.</p>
            </div>
            <strong>{formatMoney(avgRide)} CZK</strong>
          </article>
        </div>
      </div>

      <div className="salaryTrendCard">
        <div className="usageCard-head">
          <h3>Top earning days</h3>
          <span>{topDay ? topDay.label : 'No data'}</span>
        </div>

        <div className="salaryTrendList">
          {bestDays.length ? (
            bestDays.map((day, index) => {
              const highest = bestDays[0]?.amount || 1;
              const width = Math.max(16, Math.round((day.amount / highest) * 100));

              return (
                <article key={day.key} className="salaryTrendRow">
                  <div className="salaryTrendRow-head">
                    <span>{day.label}</span>
                    <strong>{formatMoney(day.amount)} CZK</strong>
                  </div>
                  <div className="salaryTrendTrack">
                    <div
                      className={`salaryTrendFill salaryTrendFill-${index + 1}`}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </article>
              );
            })
          ) : (
            <p className="salaryTrendEmpty">No salary data yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

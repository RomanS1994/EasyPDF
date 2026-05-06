import { useI18n } from '@shared/app/i18n/useI18n.js';
import { getDateKey, getOrderDate, parseDateValue } from '../../../shared/dateUtils.js';
import './StatsSalaryPanel.css';

const EUR_RATE = 25;

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

function parseMoneyValue(value) {
  // Дістаємо число і валюту з текстового поля суми.
  if (value === null || value === undefined) {
    return {
      amount: 0,
      currency: 'EUR',
    };
  }

  const text = String(value).trim();
  const currencyMatch = text.match(/\b(EUR|CZK)\b/i);
  const amountMatch = text.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  const amount = amountMatch ? Number(amountMatch[0]) : 0;
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : 'EUR';

  if (!Number.isFinite(amount)) {
    return {
      amount: 0,
      currency,
    };
  }

  return {
    amount,
    currency,
  };
}

function getOrderCommission(order) {
  return parseMoneyValue(order?.metadata?.commission || order?.contractData?.commission);
}

function getOrderNetAmount(order) {
  return parseMoneyValue(order?.totalPrice || order?.contractData?.totalPrice);
}

function convertAmount(amount, fromCurrency, toCurrency) {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  if (fromCurrency === 'EUR' && toCurrency === 'CZK') {
    return amount * EUR_RATE;
  }

  if (fromCurrency === 'CZK' && toCurrency === 'EUR') {
    return amount / EUR_RATE;
  }

  return amount;
}

function toCzkAmount(value, currency) {
  return convertAmount(value, currency, 'CZK');
}

function formatMoney(value) {
  // Форматуємо суму для красивого великого числа.
  return new Intl.NumberFormat('en-GB', {
    maximumFractionDigits: 0,
  }).format(Math.round(Number(value) || 0));
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

    const key = getDateKey(date);
    const gross = getOrderNetAmount(order);
    const commission = getOrderCommission(order);
    const amount = toCzkAmount(gross.amount, gross.currency) - toCzkAmount(commission.amount, commission.currency);

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
  const { t } = useI18n();
  const cycleOrders = getCycleOrders(orders, usage);
  const grossTotal = cycleOrders.reduce((sum, order) => {
    const gross = getOrderNetAmount(order);
    return sum + toCzkAmount(gross.amount, gross.currency);
  }, 0);
  const commissionTotal = cycleOrders.reduce((sum, order) => {
    const commission = getOrderCommission(order);
    return sum + toCzkAmount(commission.amount, commission.currency);
  }, 0);
  const netSalary = grossTotal - commissionTotal;
  const takeHomeShare = grossTotal
    ? Math.min(100, Math.round((netSalary / grossTotal) * 100))
    : 0;
  const bestDays = getTopDays(cycleOrders);
  const topDay = bestDays[0];
  const cycleCount = cycleOrders.length;
  const avgRide = cycleCount ? netSalary / cycleCount : 0;

  return (
    <section className="statsPanel is-active statsSalaryPanel">
      <div className="salaryHeroCard">
        <div className="salaryHeroMain">
          <p className="sectionEyebrow">{t('stats.salary')}</p>
          <h3>{t('stats.salaryTitle')}</h3>
          <strong>{formatMoney(netSalary)} CZK</strong>
          <p>
            {t('stats.mainPayout')} {cycleCount} orders.
          </p>
        </div>

        <div className="salaryHeroAside">
          <div className="salaryHeroStat">
            <span>{t('stats.gross')}</span>
            <strong>
              {formatMoney(grossTotal)} CZK
            </strong>
          </div>
          <div className="salaryHeroStat">
            <span>{t('stats.commission')}</span>
            <strong>
              {formatMoney(commissionTotal)} CZK
            </strong>
          </div>
          <div className="salaryHeroStat">
            <span>{t('stats.netShare')}</span>
            <strong>{takeHomeShare}%</strong>
          </div>
        </div>
      </div>

      <div className="salaryLedgerCard">
        <div className="usageCard-head">
          <h3>{t('stats.payoutBreakdown')}</h3>
          <span>{usage?.cycleLabel || t('stats.currentCycle')}</span>
        </div>

        <div className="salaryLedger">
          <article className="salaryLedgerRow">
            <div className="salaryLedgerRow-copy">
              <span>{t('stats.netSalary')}</span>
              <p>{t('stats.mainPayout')}</p>
            </div>
            <strong>{formatMoney(netSalary)} CZK</strong>
          </article>
          <article className="salaryLedgerRow">
            <div className="salaryLedgerRow-copy">
              <span>{t('stats.totalCommission')}</span>
              <p>{t('stats.commissionValues')}</p>
            </div>
            <strong>{formatMoney(commissionTotal)} CZK</strong>
          </article>
          <article className="salaryLedgerRow">
            <div className="salaryLedgerRow-copy">
              <span>{t('stats.averageRide')}</span>
              <p>{t('stats.averageNet')}</p>
            </div>
            <strong>{formatMoney(avgRide)} CZK</strong>
          </article>
        </div>
      </div>

      <div className="salaryTrendCard">
        <div className="usageCard-head">
          <h3>{t('stats.topEarningDays')}</h3>
          <span>{topDay ? topDay.label : t('stats.noData')}</span>
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

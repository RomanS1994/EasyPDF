import { getCurrentLocale, t } from '../../../shared/i18n/app.js';
import { refs, state } from './context.js';
import { categorizeOrderStatus, escapeHtml } from './formatters.js';

export function getMetrics() {
  const usage = state.user?.usage || {
    periodStart: '',
    periodEnd: '',
    cycleLabel: '-',
    used: 0,
    limit: 0,
    remaining: 0,
    status: 'inactive',
  };
  const generatedOrders = state.orders.filter(order => order.status === 'pdf_generated').length;

  return {
    usage,
    totalOrders: state.orders.length,
    generatedOrders,
    usagePercent: usage.limit ? Math.min(100, Math.round((usage.used / usage.limit) * 100)) : 0,
  };
}

function buildActivitySeries(usage) {
  const endDate = usage?.periodEnd ? new Date(usage.periodEnd) : new Date();
  const now = new Date();
  const rangeEnd = endDate.getTime() > now.getTime() ? now : endDate;

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(rangeEnd);
    date.setDate(rangeEnd.getDate() - (6 - index));

    const key = date.toISOString().slice(0, 10);
    const count = state.orders.filter(order => String(order.createdAt || '').slice(0, 10) === key).length;

    return {
      key,
      count,
      label: date.toLocaleDateString(getCurrentLocale(), { weekday: 'short' }).slice(0, 2),
    };
  });
}

function buildStatusBreakdown() {
  const counts = {
    generated: 0,
    pending: 0,
    failed: 0,
  };

  state.orders.forEach(order => {
    counts[categorizeOrderStatus(order.status)] += 1;
  });

  return counts;
}

function buildPlanForecast(usage) {
  const start = usage?.periodStart ? new Date(usage.periodStart) : null;
  const end = usage?.periodEnd ? new Date(usage.periodEnd) : null;

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return {
      projectedVolume: 0,
      forecastLabel: t('no_data'),
      projectedPercent: 0,
    };
  }

  const now = new Date();
  const effectiveNow = now.getTime() > end.getTime() ? end : now;
  const elapsedDays = Math.max(
    1,
    Math.ceil((effectiveNow.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const totalDays = Math.max(
    1,
    Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
  );
  const perDay = usage.used / elapsedDays;
  const projectedVolume = Math.round(perDay * totalDays);
  const projectedPercent = usage.limit ? Math.min(100, Math.round((projectedVolume / usage.limit) * 100)) : 0;

  let forecastLabel = t('on_track');
  if (perDay <= 0) {
    forecastLabel = t('no_activity_yet');
  } else if (projectedVolume > usage.limit && usage.limit > 0) {
    const remaining = Math.max(usage.limit - usage.used, 0);
    const daysToLimit = remaining > 0 ? Math.ceil(remaining / perDay) : 0;
    const forecastDate = new Date(effectiveNow);
    forecastDate.setDate(forecastDate.getDate() + daysToLimit);
    forecastLabel = t('limit_around', {
      date: forecastDate.toLocaleDateString(getCurrentLocale(), {
        day: 'numeric',
        month: 'short',
      }),
    });
  }

  return {
    projectedVolume,
    forecastLabel,
    projectedPercent,
  };
}

export function renderStatsCharts(metrics) {
  if (refs.statsRing) {
    refs.statsRing.style.setProperty('--progress', `${metrics.usagePercent}%`);
  }
  if (refs.statsRingValue) {
    refs.statsRingValue.textContent = `${metrics.usagePercent}%`;
  }
  if (refs.statsQuotaLabel) {
    refs.statsQuotaLabel.textContent = t('quota_label', {
      used: metrics.usage.used,
      limit: metrics.usage.limit,
    });
  }

  const activitySeries = buildActivitySeries(metrics.usage);
  const maxActivity = Math.max(1, ...activitySeries.map(item => item.count));

  if (refs.statsActivityBars) {
    refs.statsActivityBars.innerHTML = activitySeries
      .map(item => {
        const height = Math.max(12, Math.round((item.count / maxActivity) * 100));

        return `
          <div class="activityBarItem">
            <span class="activityBarValue">${item.count}</span>
            <div class="activityBarTrack">
              <span class="activityBarFill" style="height:${height}%"></span>
            </div>
            <span class="activityBarLabel">${escapeHtml(item.label)}</span>
          </div>
        `;
      })
      .join('');
  }

  if (refs.statsActivitySummary) {
    const totalWeekOrders = activitySeries.reduce((sum, item) => sum + item.count, 0);
    refs.statsActivitySummary.textContent = t('orders_count', { count: totalWeekOrders });
  }

  const statusCounts = buildStatusBreakdown();
  const statusTotal = Math.max(1, statusCounts.generated + statusCounts.pending + statusCounts.failed);

  if (refs.statsStatusStack) {
    if (metrics.totalOrders === 0) {
      refs.statsStatusStack.innerHTML =
        '<div class="statusSegment" style="width:100%; background:#e5e5ea"></div>';
    } else {
      refs.statsStatusStack.innerHTML = `
        <div class="statusSegment statusSegment-generated" style="width:${(statusCounts.generated / statusTotal) * 100}%"></div>
        <div class="statusSegment statusSegment-pending" style="width:${(statusCounts.pending / statusTotal) * 100}%"></div>
        <div class="statusSegment statusSegment-failed" style="width:${(statusCounts.failed / statusTotal) * 100}%"></div>
      `;
    }
  }

  if (refs.statsStatusLegend) {
    refs.statsStatusLegend.innerHTML = `
      <div class="statusLegendItem">
        <span class="statusLegendDot statusLegendDot-generated"></span>
        <span>${escapeHtml(t('generated'))}</span>
        <strong>${statusCounts.generated}</strong>
      </div>
      <div class="statusLegendItem">
        <span class="statusLegendDot statusLegendDot-pending"></span>
        <span>${escapeHtml(t('pending'))}</span>
        <strong>${statusCounts.pending}</strong>
      </div>
      <div class="statusLegendItem">
        <span class="statusLegendDot statusLegendDot-failed"></span>
        <span>${escapeHtml(t('failed'))}</span>
        <strong>${statusCounts.failed}</strong>
      </div>
    `;
  }

  if (refs.statsStatusSummary) {
    refs.statsStatusSummary.textContent = t('total_count', { count: metrics.totalOrders });
  }

  const forecast = buildPlanForecast(metrics.usage);

  if (refs.statsPlanLimit) {
    refs.statsPlanLimit.textContent = t('docs_per_cycle', { count: metrics.usage.limit });
  }
  if (refs.statsForecastVolume) {
    refs.statsForecastVolume.textContent = t('projected_volume', { count: forecast.projectedVolume });
  }
  if (refs.statsForecastDate) {
    refs.statsForecastDate.textContent = forecast.forecastLabel;
  }
  if (refs.statsPlanBar) {
    refs.statsPlanBar.style.width = `${forecast.projectedPercent}%`;
  }
}

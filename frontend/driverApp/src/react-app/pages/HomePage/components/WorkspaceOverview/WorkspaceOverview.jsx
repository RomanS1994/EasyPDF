import { Link } from 'react-router-dom';
import { useI18n } from '@shared/app/i18n/useI18n.js';
import {
  getPlanTypeLabel,
  getPlanVariant,
  getSubscriptionEndDate,
  getWeeklySalaryTotal,
} from '../../../shared/subscriptionUtils.js';

import heroRobotImage from '../../../../assets/main_robot.png';
import './WorkspaceOverview.css';

function getUserName(user) {
  // Беремо коротке ім'я для верхнього привітання.
  return user?.name || user?.email || '-';
}

function OverviewCardIcon({ kind }) {
  switch (kind) {
    case 'cycle':
      return (
        <span className="homeOverviewCard-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="4.5" y="5" width="15" height="14.5" rx="2.3" />
            <path d="M8 3.8v2.4" />
            <path d="M16 3.8v2.4" />
            <path d="M4.5 9h15" />
            <path d="M8.3 13.2h3.4" />
          </svg>
        </span>
      );
    case 'salary':
      return (
        <span className="homeOverviewCard-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="4.5" y="7" width="15" height="10" rx="2.2" />
            <circle cx="12" cy="12" r="2.3" />
            <path d="M7 9.8v0.1" />
            <path d="M17 9.8v0.1" />
            <path d="M7 14.2v0.1" />
            <path d="M17 14.2v0.1" />
          </svg>
        </span>
      );
    case 'orders':
      return (
        <span className="homeOverviewCard-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <rect x="5" y="4.5" width="14" height="15" rx="2.2" />
            <path d="M8 8.5h8" />
            <path d="M8 12h8" />
            <path d="M8 15.5h5.5" />
          </svg>
        </span>
      );
    case 'account':
    default:
      return (
        <span className="homeOverviewCard-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <circle cx="12" cy="8.8" r="3" />
            <path d="M5.5 18.2c0-3.5 2.9-6.2 6.5-6.2s6.5 2.7 6.5 6.2" />
          </svg>
        </span>
      );
  }
}

export function WorkspaceOverview({ user, orders }) {
  const { language, t } = useI18n();
  const userName = getUserName(user);
  const planType = getPlanTypeLabel(user);
  const planVariant = getPlanVariant(user);
  const planWindowEnd = getSubscriptionEndDate(user?.subscription, language);
  const weeklySalaryTotal = getWeeklySalaryTotal(orders);
  const orderCount = String(orders.length || 0);

  return (
    <div className={`workspaceOverview workspaceOverview--${planVariant} pageStack`}>
      <header className="appTop">
        <div className="appTitleBlock">
          <p className="sectionEyebrow">DocTra</p>
          <h1>{t('home.title')}</h1>
          <p>{t('home.welcome', { name: userName })}</p>
        </div>

        <div className="workspaceOverview-mark" aria-hidden="true">
          <div className="workspaceOverview-markSurface" />
          <div className="workspaceOverview-markFrame">
            <img className="workspaceOverview-markImage" src={heroRobotImage} alt="" />
          </div>
        </div>

        <div className="topMetrics">
          <article className="topMetric">
            <span>{t('home.plan')}</span>
            <strong>{planType}</strong>
          </article>
        </div>
      </header>

      <div className="screenCard screenCard-home">
        <div className="homeOverviewGrid">
          <article className="homeOverviewCard homeOverviewCard--cycle">
            <OverviewCardIcon kind="cycle" />
            <span>{t('home.cycle')}</span>
            <strong>{planWindowEnd}</strong>
            <p>{t('home.planValidityEnd')}</p>
          </article>

          <article className="homeOverviewCard homeOverviewCard--salary">
            <OverviewCardIcon kind="salary" />
            <span>{t('home.weeklyIncome')}</span>
            <strong>{weeklySalaryTotal}</strong>
            <p>{t('home.weeklyIncomeInfo')}</p>
          </article>

          <Link className="homeOverviewCard homeOverviewCard-link homeOverviewCard--orders" to="/orders">
            <OverviewCardIcon kind="orders" />
            <span>{t('home.orders')}</span>
            <strong>{orderCount}</strong>
            <p>{t('home.savedOrders')}</p>
          </Link>

          <Link className="homeOverviewCard homeOverviewCard-link homeOverviewCard--account" to="/account">
            <OverviewCardIcon kind="account" />
            <span>{t('home.account')}</span>
            <strong>{userName}</strong>
            <p>{t('home.profileData')}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

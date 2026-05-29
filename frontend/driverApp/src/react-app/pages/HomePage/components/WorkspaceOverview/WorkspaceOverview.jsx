import { Link } from 'react-router-dom';
import { RequestLoader } from '@shared/app/components/RequestLoader/RequestLoader.jsx';
import { useI18n } from '@shared/app/i18n/useI18n.js';
import { SvgIcon } from '@shared/app/components/SvgIcon/SvgIcon.jsx';
import {
  getPlanTypeLabel,
  getPlanVariant,
  getSubscriptionEndDate,
  getWeeklySalaryTotal,
} from '../../../shared/subscriptionUtils.js';
import { FlightTrackingNotice } from '../FlightTrackingNotice/FlightTrackingNotice.jsx';

import heroRobotImage from '../../../../assets/main_robot.png';
import './WorkspaceOverview.css';

function getUserName(user) {
  // Беремо коротке ім'я для верхнього привітання.
  return user?.name || user?.email || '-';
}

function OverviewCardIcon({ kind }) {
  switch (kind) {
    case 'cycle':
      return <span className="homeOverviewCard-icon" aria-hidden="true"><SvgIcon name="calendar" /></span>;
    case 'salary':
      return <span className="homeOverviewCard-icon" aria-hidden="true"><SvgIcon name="wallet" /></span>;
    case 'orders':
      return <span className="homeOverviewCard-icon" aria-hidden="true"><SvgIcon name="orders" /></span>;
    case 'account':
    default:
      return <span className="homeOverviewCard-icon" aria-hidden="true"><SvgIcon name="profile" /></span>;
  }
}

export function WorkspaceOverview({ user, orders, isOrdersLoading = false }) {
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
            <strong>
              {isOrdersLoading ? <RequestLoader inline size="sm" label={t('common.loading')} /> : weeklySalaryTotal}
            </strong>
            <p>{t('home.weeklyIncomeInfo')}</p>
          </article>

          <Link className="homeOverviewCard homeOverviewCard-link homeOverviewCard--orders" to="/orders">
            <OverviewCardIcon kind="orders" />
            <span>{t('home.orders')}</span>
            <strong>
              {isOrdersLoading ? <RequestLoader inline size="sm" label={t('common.loading')} /> : orderCount}
            </strong>
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

      <FlightTrackingNotice />
    </div>
  );
}

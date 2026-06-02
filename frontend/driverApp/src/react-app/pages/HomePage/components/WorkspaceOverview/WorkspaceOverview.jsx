import { useEffect, useState } from 'react';
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

const DESKTOP_ROBOT_MAX_TRAVEL = 10;
const MOBILE_ROBOT_MAX_TRAVEL = 8;

function getRobotMaxTravel() {
  if (typeof window !== 'undefined' && window.matchMedia('(max-width: 480px)').matches) {
    return MOBILE_ROBOT_MAX_TRAVEL;
  }

  return DESKTOP_ROBOT_MAX_TRAVEL;
}

function createRobotPose() {
  const angle = Math.random() * Math.PI * 2;
  const maxTravel = getRobotMaxTravel();
  const radius = (0.45 + Math.random() * 0.55) * maxTravel;

  return {
    '--robot-x': `${(Math.cos(angle) * radius).toFixed(1)}px`,
    '--robot-y': `${(Math.sin(angle) * radius).toFixed(1)}px`,
    '--robot-depth': `${(20 + Math.random() * 3).toFixed(1)}px`,
    '--robot-spin': `${(-3 + Math.random() * 6).toFixed(1)}deg`,
    '--robot-yaw': `${(-16 + Math.random() * 32).toFixed(1)}deg`,
    '--robot-pitch': `${(-3 + Math.random() * 6).toFixed(1)}deg`,
    '--robot-scale': (1 + Math.random() * 0.018).toFixed(3),
    '--robot-transition': `${Math.round(2600 + Math.random() * 1100)}ms`,
  };
}

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
  const [robotPose, setRobotPose] = useState(() => createRobotPose());
  const [arePromoBannersVisible, setArePromoBannersVisible] = useState(true);
  const promoBannersId = 'workspace-overview-promo-banners';

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }

    let timeoutId;

    const moveRobot = () => {
      setRobotPose(createRobotPose());
      timeoutId = window.setTimeout(moveRobot, 2400 + Math.random() * 1300);
    };

    timeoutId = window.setTimeout(moveRobot, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

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
            <div className="workspaceOverview-robotOrbit" style={robotPose}>
              <div className="workspaceOverview-robotPulse">
                <img className="workspaceOverview-markImage" src={heroRobotImage} alt="" />
              </div>
            </div>
          </div>
        </div>

        <div className="topMetrics">
          <article className="topMetric">
            <span>{t('home.plan')}</span>
            <strong>{planType}</strong>
          </article>
        </div>
      </header>

      <div className="workspaceOverview-summaryStack">
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

        <button
          className="workspaceOverview-promoToggle"
          type="button"
          aria-controls={promoBannersId}
          aria-expanded={arePromoBannersVisible}
          aria-label={arePromoBannersVisible ? t('home.promoBannersCollapse') : t('home.promoBannersExpand')}
          onClick={() => setArePromoBannersVisible(current => !current)}
        >
          <span className="workspaceOverview-promoToggleBar" aria-hidden="true" />
        </button>
      </div>

      <div id={promoBannersId} className="workspaceOverview-promoBanners" hidden={!arePromoBannersVisible}>
        <FlightTrackingNotice />
      </div>
    </div>
  );
}

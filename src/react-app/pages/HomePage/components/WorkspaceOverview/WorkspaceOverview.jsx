import { Link } from 'react-router-dom';
import { useI18n } from '../../../../app/i18n/useI18n.js';

import heroRobotImage from '../../../../assets/main_robot.png';
import './WorkspaceOverview.css';

function getUserName(user) {
  // Беремо коротке ім'я для верхнього привітання.
  return user?.name || user?.email || '-';
}

function getPlanName(user) {
  // Беремо назву активного плану для першого екрану.
  return (
    user?.subscription?.plan?.name ||
    user?.subscription?.planName ||
    user?.subscription?.status ||
    'Profile'
  );
}

function getUsageText(orders) {
  // Рахуємо коротку статистику згенерованих PDF.
  let generatedCount = 0;

  for (const order of orders) {
    if (order.status === 'pdf_generated') {
      generatedCount += 1;
    }
  }

  return `${generatedCount} generated`;
}

export function WorkspaceOverview({ user, orders }) {
  const { t } = useI18n();
  const userName = getUserName(user);
  const planName = getPlanName(user);
  const usageText = getUsageText(orders);
  const orderCount = String(orders.length || 0);

  return (
    <div className="workspaceOverview pageStack">
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
            <strong>{planName}</strong>
          </article>
          <article className="topMetric">
            <span>{t('home.usage')}</span>
            <strong>{usageText}</strong>
          </article>
        </div>
      </header>

      <div className="screenCard screenCard-home">
        <div className="homeOverviewGrid">
          <article className="homeOverviewCard">
            <span>{t('home.cycle')}</span>
            <strong>{t('home.current')}</strong>
            <p>{t('home.trackCycle')}</p>
          </article>

          <article className="homeOverviewCard">
            <span>{t('home.usage')}</span>
            <strong>{usageText}</strong>
            <p>{t('home.pdfOutput')}</p>
          </article>

          <Link className="homeOverviewCard homeOverviewCard-link" to="/cz/pdf/orders">
            <span>{t('home.orders')}</span>
            <strong>{orderCount}</strong>
            <p>{t('home.createOrder')}</p>
          </Link>

          <Link className="homeOverviewCard homeOverviewCard-link" to="/cz/pdf/account">
            <span>{t('home.account')}</span>
            <strong>{userName}</strong>
            <p>{t('home.profileData')}</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

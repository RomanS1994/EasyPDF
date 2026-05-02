import { Link } from 'react-router-dom';

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
  const userName = getUserName(user);
  const planName = getPlanName(user);
  const usageText = getUsageText(orders);
  const orderCount = String(orders.length || 0);

  return (
    <div className="workspaceOverview pageStack">
      <header className="appTop">
        <div className="appTitleBlock">
          <p className="sectionEyebrow">DocTra</p>
          <h1>Workspace</h1>
          <p>
            Welcome back, {userName}. Keep contracts, orders and PDF output in one place.
          </p>
        </div>

        <div className="workspaceOverview-mark" aria-hidden="true">
          <div className="workspaceOverview-markSurface" />
          <div className="workspaceOverview-markFrame">
            <img className="workspaceOverview-markImage" src={heroRobotImage} alt="" />
          </div>
        </div>

        <div className="topMetrics">
          <article className="topMetric">
            <span>Plan</span>
            <strong>{planName}</strong>
          </article>
          <article className="topMetric">
            <span>Usage</span>
            <strong>{usageText}</strong>
          </article>
        </div>
      </header>

      <div className="screenCard screenCard-home">
        <div className="homeOverviewGrid">
          <article className="homeOverviewCard">
            <span>Cycle</span>
            <strong>Current</strong>
            <p>Track your current working cycle.</p>
          </article>

          <article className="homeOverviewCard">
            <span>Usage</span>
            <strong>{usageText}</strong>
            <p>Generated PDF output for the active account.</p>
          </article>

          <Link className="homeOverviewCard homeOverviewCard-link" to="/cz/pdf/orders">
            <span>Orders</span>
            <strong>{orderCount}</strong>
            <p>Create a new order and review saved records.</p>
          </Link>

          <Link className="homeOverviewCard homeOverviewCard-link" to="/cz/pdf/account">
            <span>Account</span>
            <strong>{userName}</strong>
            <p>Profile, business details and access settings.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

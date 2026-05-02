import './ProfileWorkspace.css';

function getPlanName(user) {
  // Беремо назву плану з доступних полів.
  return (
    user?.subscription?.plan?.name ||
    user?.subscription?.planName ||
    user?.plan?.name ||
    user?.planName ||
    user?.subscription?.status ||
    'Profile'
  );
}

function getStatusName(user) {
  // Показуємо короткий статус підписки.
  return user?.subscription?.status || 'active';
}

function getUsageText(orders) {
  // Рахуємо вже згенеровані PDF.
  let generatedCount = 0;

  for (const order of orders) {
    if (order.status === 'pdf_generated') {
      generatedCount += 1;
    }
  }

  return `${generatedCount} generated`;
}

function getCycleText(user) {
  // Показуємо простий поточний цикл.
  const value = user?.subscription?.currentPeriodEnd || user?.subscription?.currentPeriodStart;

  if (!value) {
    return 'Current cycle';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('uk-UA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function getOrderCount(orders) {
  // Рахуємо збережені записи без складних форматів.
  return String(orders.length || 0);
}

export function ProfileWorkspace({ user, orders }) {
  const planName = getPlanName(user);
  const statusName = getStatusName(user);
  const usageText = getUsageText(orders);
  const cycleText = getCycleText(user);
  const orderCount = getOrderCount(orders);
  const roleName = user?.role || '-';

  return (
    <section className="screenCard profileWorkspace">
      <div className="compactHeader">
        <h2>Workspace</h2>
        <p>Keep your profile, subscription and order activity in one compact place.</p>
      </div>

      <div className="profileWorkspace-grid">
        <article className="profileWorkspace-card">
          <span>Role</span>
          <strong>{roleName}</strong>
          <p>Current access level.</p>
        </article>

        <article className="profileWorkspace-card">
          <span>Plan</span>
          <strong>{planName}</strong>
          <p>Selected workspace plan.</p>
        </article>

        <article className="profileWorkspace-card">
          <span>Status</span>
          <strong>{statusName}</strong>
          <p>Subscription state.</p>
        </article>

        <article className="profileWorkspace-card">
          <span>Cycle</span>
          <strong>{cycleText}</strong>
          <p>Current billing cycle.</p>
        </article>

        <article className="profileWorkspace-card">
          <span>Usage</span>
          <strong>{usageText}</strong>
          <p>Generated PDF output.</p>
        </article>

        <article className="profileWorkspace-card">
          <span>Orders</span>
          <strong>{orderCount}</strong>
          <p>Saved records in the workspace.</p>
        </article>
      </div>
    </section>
  );
}

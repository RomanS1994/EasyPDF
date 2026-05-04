import { useI18n } from '../../../../app/i18n/useI18n.js';
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
  const { t } = useI18n();
  const planName = getPlanName(user);
  const statusName = getStatusName(user);
  const usageText = getUsageText(orders);
  const cycleText = getCycleText(user);
  const orderCount = getOrderCount(orders);
  const roleName = user?.role || '-';

  return (
    <section className="screenCard profileWorkspace">
      <div className="compactHeader">
        <h2>{t('account.workspace')}</h2>
        <p>{t('home.profileData')}</p>
      </div>

      <div className="profileWorkspace-grid">
        <article className="profileWorkspace-card">
          <span>{t('account.role')}</span>
          <strong>{roleName}</strong>
          <p>{t('account.accessLevel')}</p>
        </article>

        <article className="profileWorkspace-card">
          <span>{t('account.selectedPlan')}</span>
          <strong>{planName}</strong>
          <p>{t('account.selectedPlan')}</p>
        </article>

        <article className="profileWorkspace-card">
          <span>{t('account.status')}</span>
          <strong>{statusName}</strong>
          <p>{t('account.subscriptionState')}</p>
        </article>

        <article className="profileWorkspace-card">
          <span>{t('account.cycle')}</span>
          <strong>{cycleText}</strong>
          <p>{t('account.billingCycle')}</p>
        </article>

        <article className="profileWorkspace-card">
          <span>{t('account.usage')}</span>
          <strong>{usageText}</strong>
          <p>{t('account.generatedOutput')}</p>
        </article>

        <article className="profileWorkspace-card">
          <span>{t('account.orders')}</span>
          <strong>{orderCount}</strong>
          <p>{t('account.savedRecords')}</p>
        </article>
      </div>
    </section>
  );
}

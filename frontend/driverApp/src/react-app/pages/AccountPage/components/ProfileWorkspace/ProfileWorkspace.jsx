import { useI18n } from '@shared/app/i18n/useI18n.js';
import {
  getPlanTypeLabel,
  getSubscriptionWindow,
} from '../../../shared/subscriptionUtils.js';
import './ProfileWorkspace.css';

function getOrderCount(orders) {
  // Рахуємо збережені записи без складних форматів.
  return String(orders.length || 0);
}

export function ProfileWorkspace({ user, orders }) {
  const { language, t } = useI18n();
  const planType = getPlanTypeLabel(user);
  const cycleText = getSubscriptionWindow(user?.subscription, language);
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
          <span>{t('account.planType')}</span>
          <strong>{planType}</strong>
          <p>{t('account.planType')}</p>
        </article>

        <article className="profileWorkspace-card">
          <span>{t('account.cycle')}</span>
          <strong>{cycleText}</strong>
          <p>{t('account.planValidity')}</p>
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

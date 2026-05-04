import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useI18n } from '../../../../app/i18n/useI18n.js';
import { useRequestSubscriptionUpgradeMutation } from '../../../../features/auth/authApi.js';
import { selectToken, setSession } from '../../../../features/auth/authSlice.js';
import { saveSession } from '../../../../features/auth/authStorage.js';
import { useGetPlansQuery } from '../../../../features/plans/plansApi.js';
import './ProfileUpgrade.css';

function getPaidPlans(plans) {
  // Вибираємо тільки платні плани для апгрейду.
  return plans.filter(plan => Number(plan.priceCzk || 0) > 0);
}

export function ProfileUpgrade({ user }) {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const { t } = useI18n();
  const { data, isLoading: isPlansLoading } = useGetPlansQuery();
  const [requestUpgrade, { isLoading }] = useRequestSubscriptionUpgradeMutation();
  const [planId, setPlanId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const plans = data?.plans || [];
  const paidPlans = useMemo(() => getPaidPlans(plans), [plans]);
  const currentPlanId = user?.subscription?.plan?.id || user?.plan?.id || '';
  const upgradePlans = paidPlans.filter(plan => plan.id !== currentPlanId);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    const nextPlanId = planId || upgradePlans[0]?.id || '';
    if (!nextPlanId) {
      setError(t('auth.choosePaidPlan'));
      return;
    }

    try {
      // Передаємо вибраний платний план на ручне підтвердження.
      const updatedUser = await requestUpgrade({ planId: nextPlanId }).unwrap();
      saveSession(token, updatedUser);
      dispatch(setSession({ token, user: updatedUser }));
      setMessage(t('auth.upgradeSent'));
    } catch {
      setError(t('auth.failedToRequestUpgrade'));
    }
  }

  if (!upgradePlans.length) {
    return null;
  }

  return (
    <form className="screenCard profileUpgrade" onSubmit={handleSubmit}>
      <div className="compactHeader">
        <h2>{t('account.upgrade')}</h2>
        <p>{t('account.upgradeCopy')}</p>
      </div>

      <label className="profileUpgrade-field">
        <span>{t('auth.plan')}</span>
        <select
          value={planId}
          onChange={event => setPlanId(event.target.value)}
          disabled={isPlansLoading || !upgradePlans.length}
        >
          {upgradePlans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.name || plan.id}
            </option>
          ))}
        </select>
      </label>

      {message ? <p className="profileUpgrade-message">{message}</p> : null}
      {error ? <p className="profileUpgrade-error">{error}</p> : null}

      <button className="profileUpgrade-button" type="submit" disabled={isLoading}>
        {isLoading ? t('auth.sendingUpgrade') : t('auth.requestUpgrade')}
      </button>
    </form>
  );
}

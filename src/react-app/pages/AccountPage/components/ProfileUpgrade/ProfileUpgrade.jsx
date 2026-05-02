import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

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
      setError('Choose a paid plan.');
      return;
    }

    try {
      // Передаємо вибраний платний план на ручне підтвердження.
      const updatedUser = await requestUpgrade({ planId: nextPlanId }).unwrap();
      saveSession(token, updatedUser);
      dispatch(setSession({ token, user: updatedUser }));
      setMessage('Upgrade request sent.');
    } catch {
      setError('Failed to request upgrade.');
    }
  }

  if (!upgradePlans.length) {
    return null;
  }

  return (
    <form className="screenCard profileUpgrade" onSubmit={handleSubmit}>
      <div className="compactHeader">
        <h2>Upgrade</h2>
        <p>Pick a paid plan and send a manual upgrade request.</p>
      </div>

      <label className="profileUpgrade-field">
        <span>Plan</span>
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
        {isLoading ? 'Sending...' : 'Request upgrade'}
      </button>
    </form>
  );
}

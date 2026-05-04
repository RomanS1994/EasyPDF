import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useI18n } from '../../../../app/i18n/useI18n.js';
import { selectToken, selectUser, setSession } from '../../../auth/authSlice.js';
import { saveSession } from '../../../auth/authStorage.js';
import {
  useGetManagerPlansQuery,
  useGetManagerUserQuery,
  useUpdateUserRoleMutation,
  useUpdateUserSubscriptionMutation,
} from '../../managerApi.js';
import './ManagerUserDetails.css';

export function ManagerUserDetails({ userId }) {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const token = useSelector(selectToken);
  const { data, isLoading, isError } = useGetManagerUserQuery(userId, {
    skip: !userId,
  });
  const {
    data: plansData,
    isLoading: isPlansLoading,
    isError: isPlansError,
  } = useGetManagerPlansQuery(undefined, {
    skip: !userId,
  });
  const [updateUserRole, { isLoading: isSavingRole }] = useUpdateUserRoleMutation();
  const [updateUserSubscription, { isLoading: isSavingSubscription }] =
    useUpdateUserSubscriptionMutation();
  const [roleValue, setRoleValue] = useState('user');
  const [statusValue, setStatusValue] = useState('active');
  const [planId, setPlanId] = useState('');
  const [roleMessage, setRoleMessage] = useState('');
  const [roleError, setRoleError] = useState('');
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [subscriptionError, setSubscriptionError] = useState('');
  const user = data?.user || data || {};
  const plans = plansData?.plans || [];
  const firstPlanId = plans[0]?.id || '';
  const canSaveRole = currentUser?.role === 'admin';

  function syncCurrentSession(nextUser) {
    if (!nextUser) {
      return;
    }

    if (!currentUser?.id) {
      return;
    }

    if (nextUser.id !== currentUser.id) {
      return;
    }

    saveSession(token, nextUser);
    dispatch(
      setSession({
        token,
        user: nextUser,
      }),
    );
  }

  useEffect(() => {
    setRoleValue(user.role || 'user');
    setStatusValue(user.subscription?.status || 'active');

    if (user.planId) {
      setPlanId(user.planId);
      return;
    }

    if (firstPlanId) {
      setPlanId(firstPlanId);
      return;
    }

    setPlanId('');
  }, [user.id, user.role, user.planId, user.subscription?.status, firstPlanId]);

  useEffect(() => {
    setRoleMessage('');
    setRoleError('');
    setSubscriptionMessage('');
    setSubscriptionError('');
  }, [userId]);

  if (!userId) {
    return (
      <section className="managerUserDetails">
        <p className="managerUserDetails-state">{t('manager.selectUser')}</p>
      </section>
    );
  }

  if (isLoading) {
    return (
      <section className="managerUserDetails">
        <p className="managerUserDetails-state">{t('manager.loadingUser')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="managerUserDetails">
        <p className="managerUserDetails-state">{t('manager.failedUser')}</p>
      </section>
    );
  }

  async function handleSaveRole() {
    setRoleMessage('');
    setRoleError('');

    try {
      const response = await updateUserRole({
        userId,
        role: roleValue,
      }).unwrap();
      syncCurrentSession(response?.user || response);
      setRoleMessage(t('manager.roleSaved'));
    } catch {
      setRoleError(t('manager.failedToSaveRole'));
    }
  }

  async function handleSaveSubscription() {
    setSubscriptionMessage('');
    setSubscriptionError('');

    try {
      const response = await updateUserSubscription({
        userId,
        payload: {
          planId,
          status: statusValue,
        },
      }).unwrap();
      syncCurrentSession(response?.user || response);
      setSubscriptionMessage(t('manager.subscriptionSaved'));
    } catch {
      setSubscriptionError(t('manager.failedToSaveSubscription'));
    }
  }

  return (
    <section className="managerUserDetails">
      <h3 className="managerUserDetails-title">{t('manager.userDetails')}</h3>

      <div className="managerUserDetails-grid">
        <div className="managerUserDetails-row">
          <span className="managerUserDetails-label">{t('common.name')}</span>
          <span className="managerUserDetails-value">{user.name || '-'}</span>
        </div>
        <div className="managerUserDetails-row">
          <span className="managerUserDetails-label">{t('common.email')}</span>
          <span className="managerUserDetails-value">{user.email || '-'}</span>
        </div>
        <div className="managerUserDetails-row">
          <span className="managerUserDetails-label">{t('common.role')}</span>
          <span className="managerUserDetails-value">{user.role || '-'}</span>
        </div>
        <div className="managerUserDetails-row">
          <span className="managerUserDetails-label">{t('manager.subscription')}</span>
          <span className="managerUserDetails-value">{user.subscription?.status || '-'}</span>
        </div>
        <div className="managerUserDetails-row">
          <span className="managerUserDetails-label">{t('common.plan')}</span>
          <span className="managerUserDetails-value">{user.plan?.name || '-'}</span>
        </div>
        <div className="managerUserDetails-row">
          <span className="managerUserDetails-label">{t('common.created')}</span>
          <span className="managerUserDetails-value">{user.createdAt || '-'}</span>
        </div>
      </div>

      <section className="managerUserDetails-section">
        <h4 className="managerUserDetails-sectionTitle">{t('common.role')}</h4>

        <label className="managerUserDetails-field">
          <span className="managerUserDetails-label">{t('common.role')}</span>
          <select
            className="managerUserDetails-select"
            value={roleValue}
            onChange={event => setRoleValue(event.target.value)}
          >
            <option value="user">user</option>
            <option value="manager">manager</option>
            <option value="admin">admin</option>
          </select>
        </label>

        {!canSaveRole ? (
          <p className="managerUserDetails-note">{t('manager.onlyAdmins')}</p>
        ) : null}
        {roleMessage ? <p className="managerUserDetails-message">{roleMessage}</p> : null}
        {roleError ? <p className="managerUserDetails-error">{roleError}</p> : null}

        <button
          className="managerUserDetails-button"
          type="button"
          onClick={handleSaveRole}
          disabled={isSavingRole || !canSaveRole}
        >
          {isSavingRole ? t('manager.savingRole') : t('manager.saveRole')}
        </button>
      </section>

      <section className="managerUserDetails-section">
        <h4 className="managerUserDetails-sectionTitle">{t('manager.subscription')}</h4>

        <label className="managerUserDetails-field">
          <span className="managerUserDetails-label">{t('common.status')}</span>
          <select
            className="managerUserDetails-select"
            value={statusValue}
            onChange={event => setStatusValue(event.target.value)}
          >
            <option value="active">active</option>
            <option value="pending">pending</option>
            <option value="trial">trial</option>
            <option value="paused">paused</option>
            <option value="canceled">canceled</option>
            <option value="expired">expired</option>
          </select>
        </label>

        <label className="managerUserDetails-field">
          <span className="managerUserDetails-label">{t('common.plan')}</span>
          <select
            className="managerUserDetails-select"
            value={planId}
            onChange={event => setPlanId(event.target.value)}
            disabled={isPlansLoading || !plans.length}
          >
            {!plans.length ? <option value="">{t('common.noPlans')}</option> : null}
            {plans.map(plan => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>

        {isPlansLoading ? <p className="managerUserDetails-note">{t('common.loadingPlans')}</p> : null}
        {isPlansError ? <p className="managerUserDetails-error">{t('manager.failedPlans')}</p> : null}
        {subscriptionMessage ? (
          <p className="managerUserDetails-message">{subscriptionMessage}</p>
        ) : null}
        {subscriptionError ? (
          <p className="managerUserDetails-error">{subscriptionError}</p>
        ) : null}

        <button
          className="managerUserDetails-button"
          type="button"
          onClick={handleSaveSubscription}
          disabled={isSavingSubscription || isPlansLoading || !planId}
        >
          {isSavingSubscription ? t('manager.savingSubscription') : t('manager.saveSubscription')}
        </button>
      </section>
    </section>
  );
}

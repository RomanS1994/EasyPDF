import { SvgIcon } from '@shared/app/components/SvgIcon/SvgIcon.jsx';

import { usePlanUpgradeForm } from './usePlanUpgradeForm.js';
import './PlanUpgradeForm.css';

export function PlanUpgradeForm() {
  const {
    availablePlans,
    error,
    hasSelectablePlans,
    handleSubmit,
    isLoading,
    isPlansError,
    isPlansLoading,
    loadingLabel,
    message,
    pendingPlanId,
    selectPlan,
    selectedPlanId,
    submitLabel,
    getPlanMeta,
    t,
    title,
  } = usePlanUpgradeForm();

  if (pendingPlanId) {
    return (
      <section className="planUpgradeForm planUpgradeForm-state">
        <div className="compactHeader">
          <h2>{t('account.planUpgradePendingTitle')}</h2>
          <p>{t('account.planUpgradePendingCopy')}</p>
        </div>
      </section>
    );
  }

  if (isPlansLoading && !availablePlans.length) {
    return (
      <section className="planUpgradeForm planUpgradeForm-state">
        <div className="compactHeader">
          <h2>{title}</h2>
          <p>{t('home.loadingPlans')}</p>
        </div>
      </section>
    );
  }

  if (isPlansError) {
    return (
      <section className="planUpgradeForm planUpgradeForm-state">
        <div className="compactHeader">
          <h2>{title}</h2>
          <p>{t('home.failedToLoadPlans')}</p>
        </div>
      </section>
    );
  }

  if (!availablePlans.length) {
    return (
      <section className="planUpgradeForm planUpgradeForm-state">
        <div className="compactHeader">
          <h2>{t('account.planUpgradeUnavailableTitle')}</h2>
          <p>{t('account.planUpgradeUnavailableCopy')}</p>
        </div>
      </section>
    );
  }

  return (
    <form className="planUpgradeForm" onSubmit={handleSubmit}>
      <div className="planUpgradeForm-plans" aria-label={t('auth.plan')}>
        {availablePlans.map(plan => {
          const meta = getPlanMeta(plan);
          const selected = plan.id === selectedPlanId;

          return (
            <button
              key={plan.id}
              type="button"
              className={`planUpgradeForm-plan planUpgradeForm-plan--${meta.variant} ${
                selected ? 'is-selected' : ''
              }`}
              aria-pressed={selected}
              disabled={isPlansLoading}
              onClick={() => selectPlan(plan.id)}
            >
              <span className="planUpgradeForm-planTop">
                <span className="planUpgradeForm-planTitle">
                  <span className="planUpgradeForm-planIcon" aria-hidden="true">
                    <SvgIcon name={meta.icon} />
                  </span>
                  <span className="planUpgradeForm-planName">{plan.name || plan.id}</span>
                </span>
                <span className="planUpgradeForm-planPrice">{meta.priceLabel}</span>
              </span>
              <span className="planUpgradeForm-planMeta">
                <span>{meta.limitLabel}</span>
                <span>{meta.modeLabel}</span>
              </span>
              {meta.isCurrent ? (
                <span className="planUpgradeForm-current">{t('home.current')}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {message ? <p className="planUpgradeForm-message">{message}</p> : null}
      {error ? <p className="planUpgradeForm-error">{error}</p> : null}

      <button
        className="planUpgradeForm-button"
        type="submit"
        disabled={isLoading || !hasSelectablePlans}
      >
        {isLoading ? loadingLabel : submitLabel}
      </button>
    </form>
  );
}

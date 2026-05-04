import { useGetPlansQuery } from '../../../../features/plans/plansApi.js';
import { useI18n } from '../../../../app/i18n/useI18n.js';
import { PlanCard } from '../PlanCard/PlanCard.jsx';
import './PlanCards.css';

export function PlanCards({ selectedPlanId, onPlanSelect }) {
  const { data, isLoading, isError } = useGetPlansQuery();
  const { t } = useI18n();
  const plans = data?.plans || [];

  return (
    <section className="planCardsSection" aria-label={t('app.settings')}>
      {isLoading ? <p className="statusNote">{t('home.loadingPlans')}</p> : null}
      {isError ? <p className="statusNote is-error">{t('home.failedToLoadPlans')}</p> : null}

      {!isLoading && !isError && plans.length ? (
        <div className="planCardsGrid">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              selected={plan.id === selectedPlanId}
              onClick={() => onPlanSelect?.(plan.id)}
            />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && !plans.length ? (
        <p className="statusNote">{t('home.noPlans')}</p>
      ) : null}
    </section>
  );
}

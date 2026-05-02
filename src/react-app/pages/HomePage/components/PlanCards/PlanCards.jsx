import { useGetPlansQuery } from '../../../../features/plans/plansApi.js';
import { PlanCard } from '../PlanCard/PlanCard.jsx';
import './PlanCards.css';

export function PlanCards() {
  const { data, isLoading, isError } = useGetPlansQuery();
  const plans = data?.plans || [];

  return (
    <section className="planCardsSection" aria-label="Plans">
      {isLoading ? <p className="statusNote">Loading plans...</p> : null}
      {isError ? <p className="statusNote is-error">Failed to load plans.</p> : null}

      {!isLoading && !isError && plans.length ? (
        <div className="planCardsGrid">
          {plans.map(plan => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      ) : null}

      {!isLoading && !isError && !plans.length ? (
        <p className="statusNote">No plans available.</p>
      ) : null}
    </section>
  );
}

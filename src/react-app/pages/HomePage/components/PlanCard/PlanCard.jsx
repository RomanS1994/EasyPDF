import './PlanCard.css';

function getPriceLabel(plan) {
  // Формуємо коротку ціну для стартової картки.
  return Number(plan.priceCzk || 0) > 0 ? `${plan.priceCzk} Kc` : 'Free';
}

function getPlanClassName(plan) {
  // Підбираємо простий колір за назвою плану.
  const planName = String(plan.slug || plan.name || '').toLowerCase();

  if (planName.includes('trial')) {
    return 'planCard--trial';
  }

  if (planName.includes('bronze')) {
    return 'planCard--bronze';
  }

  if (planName.includes('silver')) {
    return 'planCard--silver';
  }

  if (planName.includes('gold')) {
    return 'planCard--gold';
  }

  return 'planCard--free';
}

export function PlanCard({ plan }) {
  return (
    <article className={`planCard ${getPlanClassName(plan)}`}>
      <div className="planCard-tierRow">
        <span className="planCard-tier">{plan.name || '-'}</span>
        <span className="planCard-limit">{getPriceLabel(plan)}</span>
      </div>
      <div className="planCard-head">
        <p>Monthly limit</p>
        <strong>{plan.monthlyGenerationLimit || '-'}</strong>
      </div>
      <span className="planCard-price">{plan.monthlyGenerationLimit || '-'} / month</span>
      <p className="planCard-copy">{plan.description || '-'}</p>
      <div className="planCard-footer">
        <span className="planCard-action">Choose plan</span>
      </div>
    </article>
  );
}

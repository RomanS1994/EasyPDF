import './PlanCard.css';

function getPriceLabel(plan) {
  const price = Number(plan.priceCzk || 0);

  return price > 0 ? `${price} CZK` : 'Free';
}

function getPlanVariant(plan) {
  const planName = String(plan.id || plan.slug || plan.name || '').toLowerCase();
  const limit = Number(plan.monthlyGenerationLimit || 0);

  if (planName.includes('free') || planName.includes('trial')) {
    return 'planCard--free';
  }

  if (
    planName.includes('silver') ||
    planName.includes('starter')
  ) {
    return 'planCard--silver';
  }

  if (
    planName.includes('gold') ||
    planName.includes('growth')
  ) {
    return 'planCard--gold';
  }

  if (
    planName.includes('platinum') ||
    planName.includes('scale')
  ) {
    return 'planCard--platinum';
  }

  if (limit <= 100) {
    return 'planCard--free';
  }

  if (limit <= 300) {
    return 'planCard--silver';
  }

  if (limit <= 500) {
    return 'planCard--gold';
  }

  if (limit > 500) {
    return 'planCard--platinum';
  }

  return 'planCard--silver';
}

function getPlanTokens(plan) {
  const limit = Number(plan.monthlyGenerationLimit || 0);
  const pdfCount = Array.isArray(plan.pdfDocuments) ? plan.pdfDocuments.length : 0;
  const variant = getPlanVariant(plan);

  const tokens = [`${limit} tokens`, `${pdfCount} PDF types`];

  if (variant === 'planCard--free') {
    tokens.push('Manual upgrade');
  } else if (variant === 'planCard--silver') {
    tokens.push('Sharp entry');
  } else if (variant === 'planCard--gold') {
    tokens.push('Best value');
  } else if (variant === 'planCard--platinum') {
    tokens.push('Priority access');
  }

  return tokens;
}

export function PlanCard({ plan, selected = false, onClick }) {
  const tokens = getPlanTokens(plan);

  return (
    <button
      type="button"
      className={`planCard ${getPlanVariant(plan)} ${selected ? 'is-selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      {selected ? <span className="planCard-selectedBadge">Selected</span> : null}
      <div className="planCard-topRow">
        <span className="planCard-tier">{plan.name || '-'}</span>
        <span className="planCard-price">{getPriceLabel(plan)}</span>
      </div>
      <div className="planCard-hero">
        <span className="planCard-heroLabel">Monthly tokens</span>
        <strong className="planCard-heroValue">{plan.monthlyGenerationLimit || '-'}</strong>
      </div>
      <div className="planCard-tokens" aria-label="Plan tokens">
        {tokens.map(token => (
          <span className="planCard-token" key={token}>
            {token}
          </span>
        ))}
      </div>
      <div className="planCard-footer">
        <span className="planCard-action">{selected ? 'Selected plan' : 'Choose plan'}</span>
      </div>
    </button>
  );
}

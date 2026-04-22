import { getCurrentLanguage, getCurrentLocale, applyLanguage, t } from '../../../shared/i18n/app.js';
import { escapeHtml } from './formatters.js';
import { AUTH_MODES, refs } from './refs.js';
import { getDefaultAuthMode } from './shell.js';
import { state } from './state.js';

export function syncLanguageSelects() {
  const language = getCurrentLanguage();

  if (refs.accountLanguageSelect) {
    refs.accountLanguageSelect.value = language;
  }

  if (refs.settingsLanguageSelect) {
    refs.settingsLanguageSelect.value = language;
  }

  if (refs.adminLanguageSelect) {
    refs.adminLanguageSelect.value = language;
  }

  refs.guestLanguageButtons.forEach(button => {
    const isActive = button.dataset.languageOption === language;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });
}

export function handleLanguageSelectChange(event) {
  applyLanguage(event.target.value);
}

export function handleGuestLanguageClick(event) {
  const button = event.target.closest('[data-language-option]');
  if (!button) return;

  applyLanguage(button.dataset.languageOption || 'uk');
}

export function getGuestRouteLabel() {
  if (state.activeTab === 'home') {
    return t('guest_start_screen');
  }

  return t('guest_continue_to');
}

export function renderGuestContext() {
  const routeLabel = getGuestRouteLabel();
  const authMode = AUTH_MODES.includes(state.authMode) ? state.authMode : getDefaultAuthMode();

  if (refs.guestRouteBadge) {
    refs.guestRouteBadge.textContent = routeLabel;
  }

  if (refs.authSubline) {
    refs.authSubline.textContent =
      state.activeTab === 'home'
        ? t('guest_subline')
        : t('guest_redirect_note');
  }

  if (refs.authHeadline) {
    refs.authHeadline.textContent =
      authMode === 'login' ? t('guest_login_headline') : t('guest_headline');
  }

  if (refs.guestAuthNote) {
    refs.guestAuthNote.textContent =
      authMode === 'login' ? t('guest_login_note') : t('guest_note');
  }
}

export function setAuthMode(mode = getDefaultAuthMode()) {
  const nextMode = AUTH_MODES.includes(mode) ? mode : getDefaultAuthMode();
  const showPlans = nextMode === 'register';

  state.authMode = nextMode;
  refs.guestPanel?.setAttribute('data-auth-mode', nextMode);
  if (refs.planCards) {
    refs.planCards.hidden = !showPlans;
    refs.planCards.setAttribute('aria-hidden', showPlans ? 'false' : 'true');
  }

  refs.authModeButtons.forEach(button => {
    const isActive = button.dataset.authMode === nextMode;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-selected', isActive ? 'true' : 'false');
    button.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  refs.authModePanels.forEach(panel => {
    const isActive = panel.dataset.authModePanel === nextMode;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
    panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
  });

  renderGuestContext();
}

export function focusAuthMode(mode) {
  const button = Array.from(refs.authModeButtons).find(item => item.dataset.authMode === mode);
  button?.focus();
}

export function syncSelectedPlan(planId, { scrollToForm = false } = {}) {
  if (!planId) return;

  state.selectedPlanId = planId;

  if (refs.planSelect) {
    refs.planSelect.value = planId;
  }

  refs.planCards?.querySelectorAll('.planCard').forEach(card => {
    const isActive = card.dataset.planSelect === planId;
    card.classList.toggle('is-active', isActive);
    card.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  refs.planCards?.querySelectorAll('.planCard-action').forEach(action => {
    const isActive = action.closest('.planCard')?.dataset.planSelect === planId;
    action.classList.toggle('is-active', isActive);
  });

  if (scrollToForm) {
    refs.registerForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function formatPlanPrice(priceCzk) {
  const value = Number(priceCzk);
  if (!Number.isFinite(value)) return '';
  if (value <= 0) return t('free_price_label');

  return `${new Intl.NumberFormat(getCurrentLocale(), {
    maximumFractionDigits: 0,
  }).format(value)} Kc`;
}

export function getPlanVisual(plan) {
  const haystack = `${plan?.id || ''} ${plan?.name || ''}`.toLowerCase();
  const limit = Number(plan?.monthlyGenerationLimit) || 0;

  if (haystack.includes('free') || limit <= 10) {
    return {
      tone: 'free',
      tierLabel: t('plan_tier_free'),
      note: t('plan_note_free'),
    };
  }

  if (haystack.includes('scale') || haystack.includes('gold') || limit >= 100) {
    return {
      tone: 'gold',
      tierLabel: t('plan_tier_gold'),
      note: t('plan_note_gold'),
    };
  }

  if (haystack.includes('growth') || haystack.includes('silver') || limit >= 50) {
    return {
      tone: 'silver',
      tierLabel: t('plan_tier_silver'),
      note: t('plan_note_silver'),
    };
  }

  return {
    tone: 'bronze',
    tierLabel: t('plan_tier_bronze'),
    note: t('plan_note_bronze'),
  };
}

export function renderPlans() {
  if (!state.plans.length) return;

  if (refs.planSelect) {
    refs.planSelect.innerHTML = state.plans
      .map(plan => {
        const priceLabel = formatPlanPrice(plan.priceCzk);
        const suffix = t('plan_option_suffix', { limit: plan.monthlyGenerationLimit });
        const optionLabel = Number(plan.priceCzk) > 0
          ? `${plan.name} - ${suffix} - ${t('plan_price_month', { price: priceLabel })}`
          : `${plan.name} - ${suffix} - ${t('free_price_label')}`;

        return `<option value="${plan.id}">${escapeHtml(optionLabel)}</option>`;
      })
      .join('');
  }

  if (refs.planCards) {
    refs.planCards.innerHTML = state.plans
      .map(plan => {
        const visual = getPlanVisual(plan);
        const priceLabel = formatPlanPrice(plan.priceCzk);
        const quotaLabel = `${plan.monthlyGenerationLimit} ${t('plan_card_caption')}`;
        const valueLabel = priceLabel || String(plan.monthlyGenerationLimit);
        const isSelected = plan.id === state.selectedPlanId;
        const actionLabel = Number(plan.priceCzk) > 0 ? t('request_manual_upgrade') : t('start_free');

        return `
          <article
            class="planCard planCard--${visual.tone} ${isSelected ? 'is-active' : ''}"
            data-plan-select="${plan.id}"
            role="button"
            tabindex="0"
            aria-pressed="${isSelected ? 'true' : 'false'}"
          >
            <div class="planCard-tierRow">
              <span class="planCard-tier">${escapeHtml(visual.tierLabel)}</span>
              <span class="planCard-limit">${escapeHtml(
                t('plan_option_suffix', { limit: plan.monthlyGenerationLimit })
              )}</span>
            </div>
            <div class="planCard-head">
              <p>${escapeHtml(plan.name)}</p>
              <strong>${escapeHtml(valueLabel)}</strong>
              <span class="planCard-price">${escapeHtml(quotaLabel)}</span>
            </div>
            <p class="planCard-copy">${escapeHtml(visual.note)}</p>
            <div class="planCard-footer">
              <span class="planCard-action" aria-hidden="true">
                ${escapeHtml(actionLabel)}
              </span>
            </div>
          </article>
        `;
      })
      .join('');
  }

  if (!state.selectedPlanId) {
    syncSelectedPlan(state.plans[0]?.id || '');
  } else {
    syncSelectedPlan(state.selectedPlanId);
  }
}

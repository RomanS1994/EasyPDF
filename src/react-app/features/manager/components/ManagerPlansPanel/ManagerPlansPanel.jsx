import { useState } from 'react';

import { useI18n } from '../../../../app/i18n/useI18n.js';
import {
  useCreatePlanMutation,
  useGetManagerPlansQuery,
} from '../../managerApi.js';
import './ManagerPlansPanel.css';

export function ManagerPlansPanel() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useGetManagerPlansQuery();
  const [createPlan, { isLoading: isSaving }] = useCreatePlanMutation();
  const [name, setName] = useState('');
  const [monthlyGenerationLimit, setMonthlyGenerationLimit] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const plans = data?.plans || [];

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      await createPlan({
        name,
        monthlyGenerationLimit,
        description,
        isActive,
      }).unwrap();

      setName('');
      setMonthlyGenerationLimit('');
      setDescription('');
      setIsActive(true);
      setMessage(t('manager.planSaved'));
    } catch {
      setError(t('manager.failedToSavePlan'));
    }
  }

  return (
    <section className="managerPlansPanel">
      <div className="managerPlansPanel-section">
        <h3 className="managerPlansPanel-title">{t('manager.plans')}</h3>

        {isLoading ? <p className="managerPlansPanel-state">{t('common.loadingPlans')}</p> : null}
        {isError ? <p className="managerPlansPanel-state">{t('manager.failedPlans')}</p> : null}
        {!isLoading && !isError && !plans.length ? (
          <p className="managerPlansPanel-state">{t('manager.noPlans')}</p>
        ) : null}

        {!isLoading && !isError && plans.length ? (
          <ul className="managerPlansPanel-list">
            {plans.map(plan => (
              <li className="managerPlansPanel-item" key={plan.id}>
                <div className="managerPlansPanel-row">
                  <span className="managerPlansPanel-label">{t('common.name')}</span>
                  <span className="managerPlansPanel-value">{plan.name || '-'}</span>
                </div>
                <div className="managerPlansPanel-row">
                  <span className="managerPlansPanel-label">{t('manager.monthlyLimit')}</span>
                  <span className="managerPlansPanel-value">
                    {plan.monthlyGenerationLimit || '-'}
                  </span>
                </div>
                <div className="managerPlansPanel-row">
                  <span className="managerPlansPanel-label">{t('manager.description')}</span>
                  <span className="managerPlansPanel-value">{plan.description || '-'}</span>
                </div>
                <div className="managerPlansPanel-row">
                  <span className="managerPlansPanel-label">{t('manager.active')}</span>
                  <span className="managerPlansPanel-value">
                    {plan.isActive ? t('common.yes') : t('common.no')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <form className="managerPlansPanel-form" onSubmit={handleSubmit}>
        <h3 className="managerPlansPanel-title">{t('manager.createPlan')}</h3>

        <label className="managerPlansPanel-field">
          <span className="managerPlansPanel-label">{t('common.name')}</span>
          <input
            className="managerPlansPanel-input"
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </label>

        <label className="managerPlansPanel-field">
          <span className="managerPlansPanel-label">{t('manager.monthlyLimit')}</span>
          <input
            className="managerPlansPanel-input"
            type="number"
            value={monthlyGenerationLimit}
            onChange={event => setMonthlyGenerationLimit(event.target.value)}
          />
        </label>

        <label className="managerPlansPanel-field">
          <span className="managerPlansPanel-label">{t('manager.description')}</span>
          <textarea
            className="managerPlansPanel-textarea"
            value={description}
            onChange={event => setDescription(event.target.value)}
          />
        </label>

        <label className="managerPlansPanel-checkboxRow">
          <input
            type="checkbox"
            checked={isActive}
            onChange={event => setIsActive(event.target.checked)}
          />
          <span className="managerPlansPanel-label">{t('manager.active')}</span>
        </label>

        {message ? <p className="managerPlansPanel-message">{message}</p> : null}
        {error ? <p className="managerPlansPanel-error">{error}</p> : null}

        <button
          className="managerPlansPanel-button"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? t('manager.savingPlan') : t('manager.savePlan')}
        </button>
      </form>
    </section>
  );
}

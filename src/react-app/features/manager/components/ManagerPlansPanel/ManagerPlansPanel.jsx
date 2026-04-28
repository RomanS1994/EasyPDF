import { useState } from 'react';

import {
  useCreatePlanMutation,
  useGetManagerPlansQuery,
} from '../../managerApi.js';
import './ManagerPlansPanel.css';

export function ManagerPlansPanel() {
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
      setMessage('Plan saved.');
    } catch {
      setError('Failed to save plan.');
    }
  }

  return (
    <section className="managerPlansPanel">
      <div className="managerPlansPanel-section">
        <h3 className="managerPlansPanel-title">Plans</h3>

        {isLoading ? <p className="managerPlansPanel-state">Loading plans...</p> : null}
        {isError ? <p className="managerPlansPanel-state">Failed to load plans.</p> : null}
        {!isLoading && !isError && !plans.length ? (
          <p className="managerPlansPanel-state">No plans found.</p>
        ) : null}

        {!isLoading && !isError && plans.length ? (
          <ul className="managerPlansPanel-list">
            {plans.map(plan => (
              <li className="managerPlansPanel-item" key={plan.id}>
                <div className="managerPlansPanel-row">
                  <span className="managerPlansPanel-label">Name</span>
                  <span className="managerPlansPanel-value">{plan.name || '-'}</span>
                </div>
                <div className="managerPlansPanel-row">
                  <span className="managerPlansPanel-label">Monthly limit</span>
                  <span className="managerPlansPanel-value">
                    {plan.monthlyGenerationLimit || '-'}
                  </span>
                </div>
                <div className="managerPlansPanel-row">
                  <span className="managerPlansPanel-label">Description</span>
                  <span className="managerPlansPanel-value">{plan.description || '-'}</span>
                </div>
                <div className="managerPlansPanel-row">
                  <span className="managerPlansPanel-label">Active</span>
                  <span className="managerPlansPanel-value">
                    {plan.isActive ? 'Yes' : 'No'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <form className="managerPlansPanel-form" onSubmit={handleSubmit}>
        <h3 className="managerPlansPanel-title">Create plan</h3>

        <label className="managerPlansPanel-field">
          <span className="managerPlansPanel-label">Name</span>
          <input
            className="managerPlansPanel-input"
            type="text"
            value={name}
            onChange={event => setName(event.target.value)}
          />
        </label>

        <label className="managerPlansPanel-field">
          <span className="managerPlansPanel-label">Monthly limit</span>
          <input
            className="managerPlansPanel-input"
            type="number"
            value={monthlyGenerationLimit}
            onChange={event => setMonthlyGenerationLimit(event.target.value)}
          />
        </label>

        <label className="managerPlansPanel-field">
          <span className="managerPlansPanel-label">Description</span>
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
          <span className="managerPlansPanel-label">Active</span>
        </label>

        {message ? <p className="managerPlansPanel-message">{message}</p> : null}
        {error ? <p className="managerPlansPanel-error">{error}</p> : null}

        <button
          className="managerPlansPanel-button"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save plan'}
        </button>
      </form>
    </section>
  );
}

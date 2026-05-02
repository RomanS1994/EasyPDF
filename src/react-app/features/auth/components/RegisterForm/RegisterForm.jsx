import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';

import { useRegisterMutation } from '../../authApi.js';
import { setSession } from '../../authSlice.js';
import { saveSession } from '../../authStorage.js';
import { useGetPlansQuery } from '../../../plans/plansApi.js';
import './RegisterForm.css';

export function RegisterForm() {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { data, isLoading: isPlansLoading } = useGetPlansQuery();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [planId, setPlanId] = useState('');
  const [error, setError] = useState('');
  const plans = data?.plans || [];

  useEffect(() => {
    // Ставимо перший доступний план за замовчуванням.
    if (!planId && plans.length) {
      setPlanId(plans[0].id || '');
    }
  }, [planId, plans]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      // Передаємо вибраний план у запит реєстрації.
      const activePlanId = planId || plans[0]?.id || 'plan-free';
      const data = await register({
        name,
        email,
        password,
        planId: activePlanId,
      }).unwrap();
      saveSession(data.token, data.user);
      dispatch(setSession({ token: data.token, user: data.user }));
    } catch {
      setError('Register failed.');
    }
  }

  return (
    <form className="registerForm" onSubmit={handleSubmit}>
      <h3 className="registerForm-title">Register</h3>

      <label className="registerForm-field">
        <span>Name</span>
        <input type="text" value={name} onChange={event => setName(event.target.value)} />
      </label>

      <label className="registerForm-field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
        />
      </label>

      <label className="registerForm-field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </label>

      <label className="registerForm-field">
        <span>Plan</span>
        <select
          value={planId}
          onChange={event => setPlanId(event.target.value)}
          disabled={isPlansLoading || !plans.length}
        >
          {plans.map(plan => (
            <option key={plan.id} value={plan.id}>
              {plan.name || plan.id}
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="registerForm-error">{error}</p> : null}

      <button className="registerForm-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

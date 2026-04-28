import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { useRegisterMutation } from '../../authApi.js';
import { setSession } from '../../authSlice.js';
import { saveSession } from '../../authStorage.js';
import './RegisterForm.css';

export function RegisterForm() {
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const data = await register({ name, email, password }).unwrap();
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

      {error ? <p className="registerForm-error">{error}</p> : null}

      <button className="registerForm-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Registering...' : 'Register'}
      </button>
    </form>
  );
}

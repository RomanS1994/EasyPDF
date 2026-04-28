import { useState } from 'react';
import { useDispatch } from 'react-redux';

import { useLoginMutation } from '../../authApi.js';
import { setSession } from '../../authSlice.js';
import { saveSession } from '../../authStorage.js';
import './LoginForm.css';

export function LoginForm() {
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    try {
      const data = await login({ email, password }).unwrap();
      saveSession(data.token, data.user);
      dispatch(setSession({ token: data.token, user: data.user }));
    } catch {
      setError('Login failed.');
    }
  }

  return (
    <form className="loginForm" onSubmit={handleSubmit}>
      <h3 className="loginForm-title">Login</h3>

      <label className="loginForm-field">
        <span>Email</span>
        <input
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
        />
      </label>

      <label className="loginForm-field">
        <span>Password</span>
        <input
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
        />
      </label>

      {error ? <p className="loginForm-error">{error}</p> : null}

      <button className="loginForm-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

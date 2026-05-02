import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useLoginMutation } from '../../authApi.js';
import { setSession } from '../../authSlice.js';
import { saveSession } from '../../authStorage.js';
import './LoginForm.css';

export function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
      navigate('/cz/pdf', { replace: true });
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
          name="username"
          autoComplete="username"
          spellCheck={false}
          autoCapitalize="none"
          type="email"
          value={email}
          onChange={event => setEmail(event.target.value)}
          onInput={event => setEmail(event.currentTarget.value)}
        />
      </label>

      <label className="loginForm-field">
        <span>Password</span>
        <input
          name="current-password"
          autoComplete="current-password"
          spellCheck={false}
          type="password"
          value={password}
          onChange={event => setPassword(event.target.value)}
          onInput={event => setPassword(event.currentTarget.value)}
        />
      </label>

      {error ? <p className="loginForm-error">{error}</p> : null}

      <button className="loginForm-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '../../../../app/i18n/useI18n.js';
import { useLoginMutation } from '../../authApi.js';
import { setSession } from '../../authSlice.js';
import { saveSession } from '../../authStorage.js';
import './LoginForm.css';

export function LoginForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
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
      setError(t('auth.loginFailed'));
    }
  }

  return (
    <form className="loginForm" onSubmit={handleSubmit}>
      <h3 className="loginForm-title">{t('auth.loginTitle')}</h3>

      <label className="loginForm-field">
        <span>{t('auth.email')}</span>
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
        <span>{t('auth.password')}</span>
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
        {isLoading ? t('auth.loggingIn') : t('auth.login')}
      </button>
    </form>
  );
}

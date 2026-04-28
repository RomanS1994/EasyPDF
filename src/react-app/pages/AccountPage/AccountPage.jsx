import { useDispatch, useSelector } from 'react-redux';

import { useLogoutMutation, useLazyGetMeQuery } from '../../features/auth/authApi.js';
import { clearSession, selectToken, selectUser, setSession } from '../../features/auth/authSlice.js';
import {
  clearSession as clearStoredSession,
  saveSession,
} from '../../features/auth/authStorage.js';
import { AccountProfileForm } from '../../features/auth/components/AccountProfileForm/AccountProfileForm.jsx';
import { BusinessProfileForm } from '../../features/auth/components/BusinessProfileForm/BusinessProfileForm.jsx';
import { LoginForm } from '../../features/auth/components/LoginForm/LoginForm.jsx';
import { RegisterForm } from '../../features/auth/components/RegisterForm/RegisterForm.jsx';
import './AccountPage.css';

export function AccountPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const [loadMe, { isFetching }] = useLazyGetMeQuery();
  const [logout] = useLogoutMutation();

  async function handleLoadMe() {
    try {
      const me = await loadMe().unwrap();
      const nextUser = me?.user || me;
      if (nextUser) {
        if (token) {
          saveSession(token, nextUser);
        }

        dispatch(
          setSession({
            user: nextUser,
            token,
          }),
        );
      }
    } catch {
      // Ignore load errors for now.
    }
  }

  async function handleLogout() {
    try {
      await logout().unwrap();
    } catch {
      // Ignore logout errors for now.
    }

    clearStoredSession();
    dispatch(clearSession());
  }

  return (
    <section className="accountPage">
      <div className="accountPage-header">
        <h2 className="accountPage-title">Account</h2>
        <p className="accountPage-copy">Simple auth/session base for the React app.</p>
      </div>

      <div className="accountPage-card">
        {user ? (
          <>
            <div className="accountPage-user">
              <p className="accountPage-line">
                <strong>Name:</strong> {user.name || 'Unknown'}
              </p>
              <p className="accountPage-line">
                <strong>Email:</strong> {user.email || '-'}
              </p>
              {user.role ? (
                <p className="accountPage-line">
                  <strong>Role:</strong> {user.role}
                </p>
              ) : null}
            </div>

            <AccountProfileForm />
            <BusinessProfileForm />
          </>
        ) : (
          <div className="accountPage-authForms">
            <LoginForm />
            <RegisterForm />
          </div>
        )}

        {user ? (
          <div className="accountPage-actions">
            <button
              className="accountPage-button"
              type="button"
              onClick={handleLoadMe}
              disabled={isFetching}
            >
              {isFetching ? 'Loading...' : 'Load me'}
            </button>

            <button className="accountPage-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <p className="accountPage-line">Not logged in.</p>
        )}
      </div>
    </section>
  );
}

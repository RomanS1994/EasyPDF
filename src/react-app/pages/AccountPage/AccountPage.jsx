import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { useLazyGetMeQuery } from '../../features/auth/authApi.js';
import { clearSession as clearAuthSession, selectToken, selectUser, setSession, setSessionError } from '../../features/auth/authSlice.js';
import { clearSession as clearStoredSession, saveSession } from '../../features/auth/authStorage.js';
import { AccountProfileForm } from '../../features/auth/components/AccountProfileForm/AccountProfileForm.jsx';
import { BusinessProfileForm } from '../../features/auth/components/BusinessProfileForm/BusinessProfileForm.jsx';
import { LoginForm } from '../../features/auth/components/LoginForm/LoginForm.jsx';
import { RegisterForm } from '../../features/auth/components/RegisterForm/RegisterForm.jsx';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import { ProfileAuth } from './components/ProfileAuth/ProfileAuth.jsx';
import { ProfileDanger } from './components/ProfileDanger/ProfileDanger.jsx';
import { ProfileHero } from './components/ProfileHero/ProfileHero.jsx';
import { ProfileUpgrade } from './components/ProfileUpgrade/ProfileUpgrade.jsx';
import { ProfileWorkspace } from './components/ProfileWorkspace/ProfileWorkspace.jsx';
import './AccountPage.css';

export function AccountPage() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const [loadMe, { isFetching }] = useLazyGetMeQuery();
  const { data } = useGetOrdersQuery(undefined, { skip: !user });
  const orders = data?.orders || [];

  function isConnectionError(error) {
    return (
      error?.status === 'FETCH_ERROR' ||
      error?.status === 'TIMEOUT_ERROR' ||
      error?.status === 'PARSING_ERROR' ||
      !error?.status
    );
  }

  async function handleLoadMe() {
    // Підтягуємо свіжі дані сесії без зайвих кроків.
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
    } catch (error) {
      if (isConnectionError(error)) {
        clearStoredSession();
        dispatch(clearAuthSession());
        dispatch(
          setSessionError({
            type: 'offline',
            message: 'Connection lost. Please sign in again when the network is back.',
          }),
        );
        return;
      }

      dispatch(
        setSessionError({
          type: 'server',
          message:
            error?.status === 401
              ? 'Server rejected the session refresh. Please sign in again.'
              : 'Failed to refresh account data from the server.',
        }),
      );
    }
  }

  return (
    <section className="accountPage pageStack">
      <header className="appTop accountPage-top">
        <Link className="accountPage-backLink" to="/cz/pdf/settings">
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </Link>
        <div className="appTitleBlock">
          <p className="sectionEyebrow">Profile</p>
          <h1>Account</h1>
          <p>Manage your profile, business details and the workspace data used in contracts.</p>
        </div>
      </header>

      {user ? (
        <>
          <ProfileHero user={user} />

          <div className="screenCard accountPage-card">
            <AccountProfileForm />
            <BusinessProfileForm />
          </div>

          <ProfileWorkspace user={user} orders={orders} />

          <ProfileUpgrade user={user} />

          <div className="screenCard accountPage-actionsCard">
            <div className="compactHeader">
              <h2>Session</h2>
              <p>Refresh the profile or keep the account signed in from this screen.</p>
            </div>

            <div className="accountPage-actions">
              <button
                className="accountPage-button"
                type="button"
                onClick={handleLoadMe}
                disabled={isFetching}
              >
                {isFetching ? 'Loading...' : 'Load me'}
              </button>
            </div>
          </div>

          <ProfileDanger />
        </>
      ) : (
        <ProfileAuth>
          <LoginForm />
          <RegisterForm />
        </ProfileAuth>
      )}
    </section>
  );
}

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useRefreshSessionMutation } from './authApi.js';
import { saveSession } from './authStorage.js';
import { setSession, setSessionError, setSessionInitialized } from './authSlice.js';
import { getStoredUser, getToken } from './authStorage.js';

let sessionBootstrapPromise = null;

// Відновлює сесію з локального сховища без запиту до бекенда.
function restoreStoredSession(dispatch) {
  const token = getToken();
  const user = getStoredUser();

  if (!token || !user) {
    return false;
  }

  dispatch(setSession({ token, user }));
  return true;
}

// Застосовує оновлену сесію після успішного refresh-запиту.
function applyRefreshedSession(dispatch, response) {
  const nextToken = response?.token || '';
  const nextUser = response?.user || null;

  if (!nextToken || !nextUser) {
    return false;
  }

  saveSession(nextToken, nextUser);
  dispatch(setSession({ token: nextToken, user: nextUser }));
  dispatch(setSessionError({ type: '', message: '' }));
  return true;
}

// Завершує bootstrap сесії з м’якою server-помилкою без примусового logout.
function handleSessionBootstrapFailure(dispatch) {
  dispatch(
    setSessionError({
      type: 'server',
      message: 'Server session check failed. Your session is kept, so you can try again later.',
    }),
  );
  dispatch(setSessionInitialized());
}

export function useAuthSession() {
  const dispatch = useDispatch();
  const [refreshSession] = useRefreshSessionMutation();

  useEffect(() => {
    let isActive = true;

    // Якщо локальна сесія вже є, не робимо зайвий refresh при старті застосунку.
    if (restoreStoredSession(dispatch)) {
      return () => {
        isActive = false;
      };
    }

    if (!sessionBootstrapPromise) {
      sessionBootstrapPromise = refreshSession()
        .unwrap()
        .finally(() => {
          sessionBootstrapPromise = null;
        });
    }

    sessionBootstrapPromise
      .then(response => {
        if (!isActive) {
          return;
        }

        applyRefreshedSession(dispatch, response);
        dispatch(setSessionInitialized());
      })
      .catch(error => {
        if (!isActive) {
          return;
        }

        if (error?.status === 401) {
          dispatch(setSessionInitialized());
          return;
        }

        handleSessionBootstrapFailure(dispatch);
      });

    return () => {
      isActive = false;
    };
  }, [dispatch, refreshSession]);
}

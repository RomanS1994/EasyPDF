import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useRefreshSessionMutation } from './authApi.js';
import { setSession, setSessionError, setSessionInitialized } from './authSlice.js';
import { getStoredUser, getToken } from './authStorage.js';

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
    // Якщо локальна сесія вже є, не робимо зайвий refresh при старті застосунку.
    if (restoreStoredSession(dispatch)) {
      return;
    }

    refreshSession()
      .unwrap()
      .then(response => {
        applyRefreshedSession(dispatch, response);
        dispatch(setSessionInitialized());
      })
      .catch(error => {
        if (error?.status === 401) {
          dispatch(setSessionInitialized());
          return;
        }

        handleSessionBootstrapFailure(dispatch);
      });
  }, [dispatch, refreshSession]);
}

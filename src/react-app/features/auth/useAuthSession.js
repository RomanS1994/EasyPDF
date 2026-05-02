import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useLazyGetMeQuery } from './authApi.js';
import { clearSession, setSession, setSessionError } from './authSlice.js';
import { clearSession as clearStoredSession, getStoredUser, getToken } from './authStorage.js';

function isConnectionError(error) {
  return (
    error?.status === 'FETCH_ERROR' ||
    error?.status === 'TIMEOUT_ERROR' ||
    error?.status === 'PARSING_ERROR' ||
    !error?.status
  );
}

export function useAuthSession() {
  const dispatch = useDispatch();
  const [getMe] = useLazyGetMeQuery();

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (token && user) {
      dispatch(setSession({ token, user }));

      // Перевіряємо сесію один раз на старті, а не на кожен 401.
      getMe()
        .unwrap()
        .then(response => {
          const nextUser = response?.user || response;
          if (nextUser) {
            dispatch(setSession({ token, user: nextUser }));
          }
        })
        .catch(error => {
          if (isConnectionError(error)) {
            clearStoredSession();
            dispatch(clearSession());
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
              message: 'Server session check failed. Please sign in again to continue online work.',
            }),
          );
        });
    }
  }, [dispatch, getMe]);
}

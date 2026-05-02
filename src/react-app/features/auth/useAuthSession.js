import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useLazyGetMeQuery } from './authApi.js';
import { setSession, setSessionError } from './authSlice.js';
import { getStoredUser, getToken } from './authStorage.js';

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
            dispatch(setSessionError({ type: '', message: '' }));
          }
        })
        .catch(error => {
          const currentToken = getToken();
          const currentUser = getStoredUser();

          if (error?.status === 401 && (!currentToken || !currentUser)) {
            return;
          }

          if (isConnectionError(error)) {
            dispatch(
              setSessionError({
                type: 'offline',
                message: 'Connection lost. Your session is kept, so you can try again later.',
              }),
            );
            return;
          }

          dispatch(
            setSessionError({
              type: 'server',
              message: 'Server session check failed. Your session is kept, so you can try again later.',
            }),
          );
        });
    }
  }, [dispatch, getMe]);
}

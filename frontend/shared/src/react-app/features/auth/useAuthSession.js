import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { useRefreshSessionMutation } from './authApi.js';
import { setSession, setSessionError, setSessionInitialized } from './authSlice.js';
import { getStoredUser, getToken } from './authStorage.js';

export function useAuthSession() {
  const dispatch = useDispatch();
  const [refreshSession] = useRefreshSessionMutation();

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (token && user) {
      dispatch(setSession({ token, user }));
      return;
    }

    refreshSession()
      .unwrap()
      .then(response => {
        const nextToken = response?.token || '';
        const nextUser = response?.user || null;

        if (nextToken && nextUser) {
          dispatch(setSession({ token: nextToken, user: nextUser }));
          dispatch(setSessionError({ type: '', message: '' }));
        }
        dispatch(setSessionInitialized());
      })
      .catch(error => {
        if (error?.status === 401) {
          dispatch(setSessionInitialized());
          return;
        }

        dispatch(
          setSessionError({
            type: 'server',
            message: 'Server session check failed. Your session is kept, so you can try again later.',
          }),
        );
        dispatch(setSessionInitialized());
      });
  }, [dispatch, refreshSession]);
}

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import { setSession } from './authSlice.js';
import { getStoredUser, getToken } from './authStorage.js';

export function useAuthSession() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = getToken();
    const user = getStoredUser();

    if (token && user) {
      dispatch(setSession({ token, user }));
    }
  }, [dispatch]);
}

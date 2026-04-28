import { createSlice } from '@reduxjs/toolkit';

import { getStoredUser, getToken } from './authStorage.js';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: getStoredUser(),
    token: getToken(),
  },
  reducers: {
    setSession(state, action) {
      state.token = action.payload.token || '';
      state.user = action.payload.user || null;
    },
    clearSession(state) {
      state.token = '';
      state.user = null;
    },
  },
});

export const { setSession, clearSession } = authSlice.actions;

export const selectUser = state => state.auth.user;
export const selectToken = state => state.auth.token;

export default authSlice.reducer;

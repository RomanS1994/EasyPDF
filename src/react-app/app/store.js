import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { baseApi } from './api/baseApi.js';
import i18nReducer from './i18n/i18nSlice.js';
import authReducer from '../features/auth/authSlice.js';
import contractReducer from '../features/contract/contractSlice.js';
import generationSessionReducer from '../features/contract/generationSessionSlice.js';

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  i18n: i18nReducer,
  auth: authReducer,
  contract: contractReducer,
  generationSession: generationSessionReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

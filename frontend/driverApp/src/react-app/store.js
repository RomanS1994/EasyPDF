import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { baseApi } from '@shared/app/api/baseApi.js';
import i18nReducer from '@shared/app/i18n/i18nSlice.js';
import authReducer from '@shared/features/auth/authSlice.js';
import contractReducer from './features/contract/contractSlice.js';
import generationSessionReducer from './features/contract/generationSessionSlice.js';
import homeUiReducer from './features/homeUi/homeUiSlice.js';

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  i18n: i18nReducer,
  auth: authReducer,
  contract: contractReducer,
  generationSession: generationSessionReducer,
  homeUi: homeUiReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

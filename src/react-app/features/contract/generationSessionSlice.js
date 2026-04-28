import { createSlice } from '@reduxjs/toolkit';

export function isSessionExpired(expiresAt) {
  if (!expiresAt) {
    return false;
  }

  const expiresTime = Date.parse(expiresAt);
  if (!Number.isFinite(expiresTime)) {
    return false;
  }

  return expiresTime <= Date.now();
}

const generationSessionSlice = createSlice({
  name: 'generationSession',
  initialState: {
    orderId: '',
    orderNumber: '',
    documentType: '',
    expiresAt: '',
    isGateOpen: false,
  },
  reducers: {
    openGate(state) {
      state.isGateOpen = true;
    },
    closeGate(state) {
      state.isGateOpen = false;
    },
    startSession(state, action) {
      state.orderId = action.payload.orderId || '';
      state.orderNumber = action.payload.orderNumber || '';
      state.documentType = action.payload.documentType || '';
      state.expiresAt = action.payload.expiresAt || '';
      state.isGateOpen = false;
    },
    clearSession(state) {
      state.orderId = '';
      state.orderNumber = '';
      state.documentType = '';
      state.expiresAt = '';
      state.isGateOpen = false;
    },
  },
});

export const {
  openGate,
  closeGate,
  startSession,
  clearSession,
} = generationSessionSlice.actions;

export const selectGenerationSession = state => state.generationSession;

export default generationSessionSlice.reducer;

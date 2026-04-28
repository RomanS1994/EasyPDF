import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  selectGenerationSession,
  startSession,
} from './generationSessionSlice.js';
import {
  clearGenerationSession,
  loadGenerationSession,
  saveGenerationSession,
} from './generationSessionStorage.js';

export function useGenerationSessionPersistence() {
  const dispatch = useDispatch();
  const generationSession = useSelector(selectGenerationSession);
  const isReady = useRef(false);

  useEffect(() => {
    const savedSession = loadGenerationSession();

    if (savedSession?.orderId) {
      dispatch(startSession(savedSession));
    }

    isReady.current = true;
  }, [dispatch]);

  useEffect(() => {
    if (!isReady.current) return;

    if (!generationSession.orderId) {
      clearGenerationSession();
      return;
    }

    saveGenerationSession(generationSession);
  }, [generationSession]);
}

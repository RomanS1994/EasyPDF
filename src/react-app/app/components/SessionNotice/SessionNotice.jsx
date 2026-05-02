import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  clearSessionError,
  selectSessionError,
  selectSessionErrorType,
} from '../../../features/auth/authSlice.js';
import './SessionNotice.css';

export function SessionNotice() {
  const dispatch = useDispatch();
  const sessionError = useSelector(selectSessionError);
  const sessionErrorType = useSelector(selectSessionErrorType);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionErrorType !== 'offline' || !sessionError) {
      setVisible(false);
      return undefined;
    }

    setVisible(true);

    const timer = window.setTimeout(() => {
      setVisible(false);
      dispatch(clearSessionError());
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [dispatch, sessionError, sessionErrorType]);

  if (!visible) {
    return null;
  }

  return (
    <div className="sessionNotice" role="status" aria-live="polite">
      <strong className="sessionNotice-title">Offline</strong>
      <p className="sessionNotice-text">{sessionError}</p>
    </div>
  );
}

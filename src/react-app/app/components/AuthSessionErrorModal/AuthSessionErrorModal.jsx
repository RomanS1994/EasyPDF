import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
  clearSessionError,
  selectSessionError,
  selectSessionErrorType,
} from '../../../features/auth/authSlice.js';
import './AuthSessionErrorModal.css';

export function AuthSessionErrorModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const sessionError = useSelector(selectSessionError);
  const sessionErrorType = useSelector(selectSessionErrorType);

  if (!sessionError || sessionErrorType === 'offline') {
    return null;
  }

  function handleClose() {
    dispatch(clearSessionError());
    navigate('/cz/pdf/sign-in', { replace: true });
  }

  return (
    <div className="authSessionErrorModal" role="presentation">
      <div className="authSessionErrorModal-backdrop" />
      <div
        className="authSessionErrorModal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="authSessionErrorTitle"
      >
        <div className="authSessionErrorModal-copy">
          <p className="authSessionErrorModal-eyebrow">Online state</p>
          <h2 id="authSessionErrorTitle">Connection error</h2>
          <p>{sessionError}</p>
        </div>

        <button
          className="authSessionErrorModal-button"
          type="button"
          onClick={handleClose}
        >
          Go to sign in
        </button>
      </div>
    </div>
  );
}

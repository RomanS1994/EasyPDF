import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
  clearSessionError,
  selectSessionError,
  selectSessionErrorType,
} from '../../../features/auth/authSlice.js';
import { useI18n } from '../../i18n/useI18n.js';
import './AuthSessionErrorModal.css';

export function AuthSessionErrorModal() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const sessionError = useSelector(selectSessionError);
  const sessionErrorType = useSelector(selectSessionErrorType);

  if (!sessionError || sessionErrorType === 'offline') {
    return null;
  }

  function handleClose() {
    dispatch(clearSessionError());
    if (sessionErrorType === 'expired') {
      navigate('/cz/pdf/sign-in', { replace: true });
    }
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
          <p className="authSessionErrorModal-eyebrow">
            {sessionErrorType === 'expired' || sessionErrorType === 'server'
              ? t('auth.sessionState')
              : t('auth.onlineState')}
          </p>
          <h2 id="authSessionErrorTitle">
            {sessionErrorType === 'expired'
              ? t('auth.sessionExpired')
              : sessionErrorType === 'server'
                ? t('auth.sessionCheckFailed')
                : t('auth.connectionError')}
          </h2>
          <p>{sessionError}</p>
        </div>

        <button
          className="authSessionErrorModal-button"
          type="button"
          onClick={handleClose}
        >
          {sessionErrorType === 'expired' ? t('auth.goToSignIn') : t('auth.tryAgainLater')}
        </button>
      </div>
    </div>
  );
}

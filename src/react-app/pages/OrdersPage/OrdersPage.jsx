import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '../../app/i18n/useI18n.js';
import { ContractForm } from '../../features/contract/components/ContractForm/ContractForm.jsx';
import { selectContract } from '../../features/contract/contractSlice.js';
import {
  clearSession,
  hasGenerationSession,
  selectGenerationSession,
  startSession,
} from '../../features/contract/generationSessionSlice.js';
import { useGenerationSessionPersistence } from '../../features/contract/useGenerationSessionPersistence.js';
import { GenerationGateModal } from '../../features/contract/components/GenerationGateModal/GenerationGateModal.jsx';
import { GenerationSessionBanner } from '../../features/contract/components/GenerationSessionBanner/GenerationSessionBanner.jsx';
import sessionRobot from '../../assets/main_robot.png';
import './OrdersPage.css';

function buildGenerationSessionPayload(contract) {
  return {
    accessGranted: true,
    orderId: '',
    orderNumber: '',
    documentType: String(contract?.documentType || 'confirmation'),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  };
}

export function OrdersPage() {
  const { t } = useI18n();
  const isGenerationReady = useGenerationSessionPersistence();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const contract = useSelector(selectContract);
  const generationSession = useSelector(selectGenerationSession);
  const [isGateOpen, setIsGateOpen] = useState(false);
  const [isReserving, setIsReserving] = useState(false);
  const [sessionError, setSessionError] = useState({
    type: '',
    message: '',
  });
  const hasActiveSession = hasGenerationSession(generationSession);

  useEffect(() => {
    if (!isGenerationReady) {
      return;
    }

    if (!hasActiveSession && !sessionError.message) {
      setIsGateOpen(true);
      return;
    }

    if (hasActiveSession) {
      setIsGateOpen(false);
    }
  }, [hasActiveSession, isGenerationReady, sessionError.message]);

  async function handleConfirmGate() {
    setIsReserving(true);
    dispatch(startSession(buildGenerationSessionPayload(contract)));
    setSessionError({ type: '', message: '' });
    setIsGateOpen(false);
    setIsReserving(false);
  }

  function handleCloseGate() {
    navigate('/cz/pdf', { replace: true });
  }

  function handleExpiredSession() {
    dispatch(clearSession());
    setSessionError({
      type: 'expired',
      message: t('contract.sessionExpired'),
    });
    setIsGateOpen(false);
  }

  function closeErrorModal() {
    setSessionError({ type: '', message: '' });
    navigate('/cz/pdf', { replace: true });
  }

  return (
    <section className="ordersPage pageStack">
      {hasActiveSession ? (
        <>
          <GenerationSessionBanner
            session={generationSession}
            onExpired={handleExpiredSession}
          />
          <ContractForm />
        </>
      ) : null}

      <GenerationGateModal
        isOpen={isGateOpen && !hasActiveSession}
        isBusy={isReserving}
        onClose={handleCloseGate}
        onConfirm={handleConfirmGate}
      />

      {sessionError.message ? (
        <div
          className={`ordersPage-errorModal ${sessionError.type === 'expired' ? 'ordersPage-errorModal--expired' : ''}`}
          role="presentation"
        >
          <div className="ordersPage-errorBackdrop" />
          <div
            className="ordersPage-errorSheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ordersErrorTitle"
          >
            {sessionError.type === 'expired' ? (
              <>
                <div className="ordersPage-errorArt" aria-hidden="true">
                  <img src={sessionRobot} alt="" />
                </div>

                <div className="ordersPage-errorCopy">
                  <p className="ordersPage-errorEyebrow">{t('contract.orderWindow')}</p>
                  <h2 id="ordersErrorTitle">{t('contract.sessionExpired')}</h2>
                  <p>{sessionError.message}</p>
                </div>

                <button
                  className="ordersPage-errorButton"
                  type="button"
                  onClick={closeErrorModal}
                >
                  {t('app.home')}
                </button>
              </>
            ) : (
              <>
                <div className="ordersPage-errorCopy">
                  <p className="ordersPage-errorEyebrow">{t('contract.orderWindow')}</p>
                  <h2 id="ordersErrorTitle">{t('common.failed')}</h2>
                  <p>{sessionError.message}</p>
                </div>

                <button
                  className="ordersPage-errorButton"
                  type="button"
                  onClick={closeErrorModal}
                >
                  {t('common.backToHome')}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

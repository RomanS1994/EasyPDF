import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { useGenerateContractPdfMutation } from '../../contractApi.js';
import { selectContract } from '../../contractSlice.js';
import {
  clearSession,
  getGenerationWindowMs,
  isSessionExpired,
  selectGenerationSession,
  startSession,
} from '../../generationSessionSlice.js';
import { validateContract } from '../../utils/contractValidation.js';
import { downloadFile } from '../../utils/downloadFile.js';
import {
  useCreateOrderMutation,
  useUpdateOrderMutation,
} from '../../../orders/ordersApi.js';
import { resolveErrorMessage } from '../../../../app/utils/errorMessages.js';
import './ContractActions.css';

function getSourcePage() {
  return '/cz/pdf';
}

function buildValidationState() {
  return {
    customerName: '',
    customerContact: '',
    passengers: '',
    fromAddress: '',
    toAddress: '',
    tripDate: '',
    paymentMethod: '',
    totalPrice: '',
  };
}

function buildContractPayload(contract) {
  const passengersValue = String(contract?.passengers || '').trim();
  const passengersCount = Number.parseInt(passengersValue, 10);
  const safePassengers = Number.isFinite(passengersCount) && passengersCount > 0 ? passengersCount : 1;
  const totalPrice = String(contract?.totalPrice || '').trim() || String(safePassengers * 100);

  return {
    ...contract,
    totalPrice,
  };
}

function getActiveSession(session) {
  if (!session || isSessionExpired(session.expiresAt)) {
    return null;
  }

  if (!session.accessGranted) {
    return null;
  }

  return session;
}

function buildGenerationSessionPayload(session, order, contractData, documentType) {
  return {
    accessGranted: true,
    orderId: String(order?.id || session?.orderId || ''),
    orderNumber: String(order?.orderNumber || session?.orderNumber || ''),
    documentType: String(documentType || session?.documentType || ''),
    contractData,
    createdAt: String(session?.createdAt || order?.createdAt || new Date().toISOString()),
    expiresAt:
      String(session?.expiresAt || new Date(Date.now() + getGenerationWindowMs()).toISOString()),
  };
}

function OrderCreatedModal({ orderNumber, onClose }) {
  if (!orderNumber) {
    return null;
  }

  return (
    <div className="contractActionsModal" role="presentation">
      <div className="contractActionsModal-backdrop" onClick={onClose} />

      <div
        className="contractActionsModal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="orderCreatedTitle"
      >
        <button
          className="contractActionsModal-close"
          type="button"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>

        <div className="contractActionsModal-badge" aria-hidden="true">
          <span className="contractActionsModal-badgeIcon">✓</span>
          <span>Success</span>
        </div>

        <div className="contractActionsModal-copy">
          <h2 id="orderCreatedTitle">Order created</h2>
          <p>Your order has been saved successfully.</p>
        </div>

        <div className="contractActionsModal-card">
          <span>Order number</span>
          <strong>{orderNumber}</strong>
        </div>

        <button className="contractActionsModal-confirm" type="button" onClick={onClose}>
          Back to home
        </button>
      </div>
    </div>
  );
}

export function ContractActions() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const contract = useSelector(selectContract);
  const generationSession = useSelector(selectGenerationSession);
  const [createOrder, { isLoading: isCreatingNew }] = useCreateOrderMutation();
  const [updateOrder, { isLoading: isCreating }] = useUpdateOrderMutation();
  const [generateContractPdf, { isLoading: isGenerating }] =
    useGenerateContractPdfMutation();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [validationErrors, setValidationErrors] = useState(buildValidationState());

  function clearValidation() {
    setValidationErrors(buildValidationState());
  }

  function showValidation(result) {
    setValidationErrors({
      ...buildValidationState(),
      ...result.errors,
    });
  }

  function closeCreatedModal() {
    setCreatedOrderNumber('');
    dispatch(clearSession());
    navigate('/cz/pdf', { replace: true });
  }

  async function handleCreate() {
    setMessage('');
    setError('');
    setCreatedOrderNumber('');
    clearValidation();

    const payloadContract = buildContractPayload(contract);
    const result = validateContract(payloadContract);
    if (!result.isValid) {
      showValidation(result);
      return;
    }

    try {
      const activeSession = getActiveSession(generationSession);
      if (!activeSession) {
        setError('Open Orders again to start a token session.');
        return;
      }

      const documentType = activeSession.documentType || payloadContract.documentType;
      const payload = {
        contractData: payloadContract,
        status: 'created',
        metadata: {
          sourcePage: getSourcePage(),
          documentType,
          generationMode: 'token',
          tokenCost: 1,
        },
      };

      const response = activeSession.orderId
        ? await updateOrder({
            orderId: activeSession.orderId,
            payload,
          }).unwrap()
        : await createOrder(payload).unwrap();

      const order = response?.order || response;
      setCreatedOrderNumber(String(order?.orderNumber || 'Order saved'));
    } catch (error) {
      setError(resolveErrorMessage(error, 'Failed to create order.'));
    }
  }

  async function handleDownload() {
    setMessage('');
    setError('');
    clearValidation();

    const activeSession = getActiveSession(generationSession);
    const payloadContract = buildContractPayload(contract);
    const result = validateContract(payloadContract);
    if (!result.isValid) {
      showValidation(result);
      return;
    }

    let orderId = String(activeSession?.orderId || '');
    let orderNumber = String(activeSession?.orderNumber || 'contract');
    const documentType = activeSession?.documentType || payloadContract.documentType;

    if (!orderId) {
      try {
        const response = await createOrder({
          contractData: payloadContract,
          status: 'pending_pdf',
          metadata: {
            sourcePage: getSourcePage(),
            documentType,
            generationMode: 'token',
            tokenCost: 1,
            generationWindowMs: getGenerationWindowMs(),
          },
        }).unwrap();

        const order = response?.order || response;
        orderId = String(order?.id || '');
        orderNumber = String(order?.orderNumber || 'contract');
        const nextSession = buildGenerationSessionPayload(
          activeSession,
          order,
          payloadContract,
          documentType,
        );
        dispatch(startSession(nextSession));
      } catch (error) {
        setError(resolveErrorMessage(error, 'Failed to create order.'));
        return;
      }
    }

    try {
      const blob = await generateContractPdf({
        orderId,
        documentType,
        contractData: payloadContract,
      }).unwrap();

      const fileName = `${orderNumber}.pdf`;
      downloadFile(blob, fileName);
      setMessage('PDF downloaded.');

      try {
        await updateOrder({
          orderId,
          skipInvalidation: true,
          payload: {
            status: 'pdf_generated',
            metadata: {
              sourcePage: getSourcePage(),
              documentType,
              generationMode: 'token',
              tokenCost: 1,
            },
            pdf: {
              documentType,
            },
          },
        }).unwrap();
      } catch (updateError) {
        console.error(
          'Failed to update order status after PDF download:',
          updateError,
        );
      }

      dispatch(clearSession());
      navigate('/cz/pdf', { replace: true });
    } catch (error) {
      if (orderId) {
        try {
          await updateOrder({
            orderId,
            skipInvalidation: true,
            payload: {
              status: 'pdf_failed',
              metadata: {
                sourcePage: getSourcePage(),
                documentType,
                generationMode: 'token',
                tokenCost: 1,
              },
            },
          }).unwrap();
        } catch (updateError) {
          console.error(
            'Failed to mark PDF generation as failed:',
            updateError,
          );
        }
      }

      setError(resolveErrorMessage(error, 'Failed to generate PDF.'));
    }
  }

  return (
    <>
      <section className="contractActions">
        {validationErrors.customerName ? (
          <p className="contractActions-error contractActions-fullWidth">
            {validationErrors.customerName}
          </p>
        ) : null}
        {validationErrors.customerContact ? (
          <p className="contractActions-error contractActions-fullWidth">
            {validationErrors.customerContact}
          </p>
        ) : null}
        {validationErrors.passengers ? (
          <p className="contractActions-error contractActions-fullWidth">
            {validationErrors.passengers}
          </p>
        ) : null}
        {validationErrors.fromAddress ? (
          <p className="contractActions-error contractActions-fullWidth">
            {validationErrors.fromAddress}
          </p>
        ) : null}
        {validationErrors.toAddress ? (
          <p className="contractActions-error contractActions-fullWidth">
            {validationErrors.toAddress}
          </p>
        ) : null}
        {validationErrors.tripDate ? (
          <p className="contractActions-error contractActions-fullWidth">
            {validationErrors.tripDate}
          </p>
        ) : null}
        {validationErrors.paymentMethod ? (
          <p className="contractActions-error contractActions-fullWidth">
            {validationErrors.paymentMethod}
          </p>
        ) : null}
        {validationErrors.totalPrice ? (
          <p className="contractActions-error contractActions-fullWidth">
            {validationErrors.totalPrice}
          </p>
        ) : null}

        <button
          className="contractActions-save"
          type="button"
          onClick={handleCreate}
          disabled={isCreating || isCreatingNew}
        >
          {isCreating || isCreatingNew ? 'Creating...' : 'Save order'}
        </button>

        <button
          className="contractActions-generate"
          type="button"
          onClick={handleDownload}
          disabled={isGenerating || isCreating || isCreatingNew}
        >
          {isGenerating ? 'Downloading...' : 'Download PDF'}
        </button>

        {generationSession.accessGranted ? (
          <p className="contractActions-sessionLine">
            {generationSession.orderNumber
              ? `Reserved order: ${generationSession.orderNumber}`
              : 'Token session active'}
          </p>
        ) : null}

        {message ? <p className="contractActions-message">{message}</p> : null}
        {error ? <p className="contractActions-error">{error}</p> : null}
      </section>

      <OrderCreatedModal orderNumber={createdOrderNumber} onClose={closeCreatedModal} />
    </>
  );
}

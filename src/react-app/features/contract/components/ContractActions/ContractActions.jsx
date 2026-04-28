import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useGenerateContractPdfMutation } from '../../contractApi.js';
import { selectContract } from '../../contractSlice.js';
import {
  clearSession,
  closeGate,
  openGate,
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
import './ContractActions.css';

const emptyValidationErrors = {
  customerName: '',
  fromAddress: '',
  toAddress: '',
  tripTime: '',
  totalPrice: '',
};

function getSourcePage() {
  return '/cz/pdf';
}

export function ContractActions() {
  const dispatch = useDispatch();
  const contract = useSelector(selectContract);
  const generationSession = useSelector(selectGenerationSession);
  const [createOrder, { isLoading: isSaving }] = useCreateOrderMutation();
  const [updateOrder] = useUpdateOrderMutation();
  const [generateContractPdf, { isLoading: isGenerating }] =
    useGenerateContractPdfMutation();
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState(emptyValidationErrors);

  function clearValidation() {
    setValidationErrors(emptyValidationErrors);
  }

  async function handleSave() {
    setMessage('');
    setError('');
    clearValidation();

    const result = validateContract(contract);
    if (!result.isValid) {
      setValidationErrors(result.errors);
      return;
    }

    const payload = {
      contractData: contract,
      status: 'created',
      metadata: {
        sourcePage: getSourcePage(),
        documentType: contract.documentType,
        generationMode: 'manual',
      },
    };

    try {
      await createOrder(payload).unwrap();
      setMessage('Order saved.');
    } catch {
      setError('Failed to save order.');
    }
  }

  async function handleReserve() {
    setMessage('');
    setError('');
    clearValidation();

    const result = validateContract(contract);
    if (!result.isValid) {
      setValidationErrors(result.errors);
      return;
    }

    try {
      const response = await createOrder({
        contractData: contract,
        status: 'pending_pdf',
        metadata: {
          sourcePage: getSourcePage(),
          documentType: contract.documentType,
          generationMode: 'token',
          tokenCost: 1,
        },
      }).unwrap();

      const order = response?.order || response;
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

      dispatch(
        startSession({
          orderId: order?.id || '',
          orderNumber: order?.orderNumber || '',
          documentType: contract.documentType,
          expiresAt,
        }),
      );
      dispatch(closeGate());
      setMessage('Generation token reserved.');
    } catch {
      setError('Failed to reserve generation token.');
    }
  }

  async function handleGeneratePdf() {
    setMessage('');
    setError('');
    clearValidation();

    if (!generationSession.orderId) {
      dispatch(openGate());
      return;
    }

    if (isSessionExpired(generationSession.expiresAt)) {
      dispatch(clearSession());
      setMessage('Generation session expired. Please reserve again.');
      return;
    }

    const result = validateContract(contract);
    if (!result.isValid) {
      setValidationErrors(result.errors);
      return;
    }

    try {
      const blob = await generateContractPdf({
        orderId: generationSession.orderId,
        documentType: generationSession.documentType || contract.documentType,
        contractData: contract,
      }).unwrap();

      downloadFile(blob, 'contract.pdf');

      await updateOrder({
        orderId: generationSession.orderId,
        payload: {
          status: 'pdf_generated',
        },
      }).unwrap();

      dispatch(clearSession());
      setMessage('PDF downloaded.');
    } catch {
      if (generationSession.orderId) {
        try {
          await updateOrder({
            orderId: generationSession.orderId,
            payload: {
              status: 'pdf_failed',
            },
          }).unwrap();
        } catch {
          // Ignore status update failures.
        }
      }

      setError('Failed to generate PDF.');
    }
  }

  return (
    <section className="contractActions">
      {validationErrors.customerName ? (
        <p className="contractActions-error">{validationErrors.customerName}</p>
      ) : null}
      {validationErrors.fromAddress ? (
        <p className="contractActions-error">{validationErrors.fromAddress}</p>
      ) : null}
      {validationErrors.toAddress ? (
        <p className="contractActions-error">{validationErrors.toAddress}</p>
      ) : null}
      {validationErrors.tripTime ? (
        <p className="contractActions-error">{validationErrors.tripTime}</p>
      ) : null}
      {validationErrors.totalPrice ? (
        <p className="contractActions-error">{validationErrors.totalPrice}</p>
      ) : null}

      {generationSession.isGateOpen ? (
        <section className="contractActions-gate">
          <p className="contractActions-gateText">Reserve one generation token?</p>
          <div className="contractActions-gateButtons">
            <button
              className="contractActions-gateButton"
              type="button"
              onClick={() => dispatch(closeGate())}
            >
              Cancel
            </button>
            <button
              className="contractActions-gateButton"
              type="button"
              onClick={handleReserve}
              disabled={isSaving}
            >
              {isSaving ? 'Reserving...' : 'Reserve'}
            </button>
          </div>
        </section>
      ) : null}

      {generationSession.orderId ? (
        <section className="contractActions-session">
          <p className="contractActions-sessionLine">
            Reserved order: {generationSession.orderNumber || '-'}
          </p>
          <p className="contractActions-sessionLine">
            Expires at: {generationSession.expiresAt || '-'}
          </p>
        </section>
      ) : null}

      <div className="contractActions-buttons">
        <button
          className="contractActions-save"
          type="button"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save order'}
        </button>

        <button
          className="contractActions-generate"
          type="button"
          onClick={handleGeneratePdf}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate PDF'}
        </button>
      </div>

      {message ? <p className="contractActions-message">{message}</p> : null}
      {error ? <p className="contractActions-error">{error}</p> : null}
    </section>
  );
}

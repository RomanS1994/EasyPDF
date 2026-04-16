import {
  DEFAULT_DOCUMENT_TYPE,
  SUPPORTED_DOCUMENT_TYPES,
  getContractData,
  mergeContractData,
} from './state.js';

export function normalizeDocumentType(value) {
  return SUPPORTED_DOCUMENT_TYPES.has(value) ? value : DEFAULT_DOCUMENT_TYPE;
}

export function setDocumentType(value) {
  return mergeContractData({ documentType: normalizeDocumentType(value) });
}

export function syncDocumentTypeButtons(buttons) {
  const { documentType } = getContractData();

  buttons.forEach(button => {
    const isActive = button.dataset.pdfDocument === documentType;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });
}

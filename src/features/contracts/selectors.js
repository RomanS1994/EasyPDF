const root = document.querySelector('.dataContract-container');

export const contractRefs = {
  section: document.querySelector('.dataContract'),
  root,
  allInputs: document.querySelectorAll('.dataContract-container input'),
  dateInputs: document.querySelectorAll('.dataContract-container .today'),
  orderNumberInput: document.querySelector('.dataContract-container .orderNumber'),
  pages: document.querySelectorAll('.dataContract-container .dataContract-page'),
  stepTabs: document.querySelectorAll('[data-step-tab]'),
  nextButtons: document.querySelectorAll('.dataContract-container .wizard-next'),
  backButtons: document.querySelectorAll('.dataContract-container .wizard-back'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn'),
  saveOrderBtn: document.getElementById('saveOrderBtn'),
  clearButtons: document.querySelectorAll('.dataContract-container .clear-btn'),
  quickPickButtons: document.querySelectorAll('.dataContract-container .quick-pick-btn'),
  priceConverted: document.getElementById('priceConverted'),
  currencyButtons: document.querySelectorAll('.dataContract-container .currency-btn'),
  documentTypeButtons: document.querySelectorAll('[data-pdf-document]'),
  generationGateModal: document.getElementById('generationGateModal'),
  generationGateBackdrop: document.getElementById('generationGateBackdrop'),
  generationGateCloseBtn: document.getElementById('generationGateCloseBtn'),
  generationGateLaterBtn: document.getElementById('generationGateLaterBtn'),
  generationGateSwipe: document.getElementById('generationGateSwipe'),
  generationGateSwipeFill: document.getElementById('generationGateSwipeFill'),
  generationGateSwipeHandle: document.getElementById('generationGateSwipeHandle'),
  generationSessionModal: document.getElementById('generationSessionModal'),
  generationSessionCountdownRing: document.getElementById('generationSessionCountdownRing'),
  generationSessionCountdownValue: document.getElementById('generationSessionCountdownValue'),
};

export function hasContractRoot() {
  return Boolean(contractRefs.root && contractRefs.section);
}

export function findContractInput(name) {
  if (!contractRefs.root) return null;
  return contractRefs.root.querySelector(`input[name="${name}"]`);
}

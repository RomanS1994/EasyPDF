export const PDF_DOCUMENT_TYPES = [
  {
    id: 'offer',
    labelKey: 'pdf_document_offer',
    fileNamePart: 'offer',
  },
  {
    id: 'confirmation',
    labelKey: 'pdf_document_confirmation',
    fileNamePart: 'confirmation',
  },
];

const PDF_DOCUMENT_IDS = PDF_DOCUMENT_TYPES.map(documentType => documentType.id);

export const PLANS = [
  {
    id: 'plan-25',
    name: 'Starter 25',
    monthlyGenerationLimit: 25,
    priceCzk: 299,
    description: '25 PDF/order generations per month',
    pdfProfile: 'starter',
    pdfQuality: 'essential',
    pdfDocuments: PDF_DOCUMENT_IDS,
  },
  {
    id: 'plan-50',
    name: 'Growth 50',
    monthlyGenerationLimit: 50,
    priceCzk: 499,
    description: '50 PDF/order generations per month',
    pdfProfile: 'growth',
    pdfQuality: 'branded',
    pdfDocuments: PDF_DOCUMENT_IDS,
  },
  {
    id: 'plan-100',
    name: 'Scale 100',
    monthlyGenerationLimit: 100,
    priceCzk: 899,
    description: '100 PDF/order generations per month',
    pdfProfile: 'scale',
    pdfQuality: 'premium',
    pdfDocuments: PDF_DOCUMENT_IDS,
  },
];

export const DEFAULT_PLAN_ID = PLANS[0].id;

export function getPlanById(planId) {
  return PLANS.find(plan => plan.id === planId) || null;
}

export function isSupportedPdfDocumentType(documentType) {
  return PDF_DOCUMENT_TYPES.some(item => item.id === documentType);
}

export function getPdfDocumentType(documentType = 'confirmation') {
  return (
    PDF_DOCUMENT_TYPES.find(item => item.id === documentType) ||
    PDF_DOCUMENT_TYPES.find(item => item.id === 'confirmation') ||
    null
  );
}

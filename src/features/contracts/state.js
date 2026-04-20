export const CONTRACT_STORAGE_KEY = 'contract-data';
export const DEFAULT_DOCUMENT_TYPE = 'confirmation';
export const SUPPORTED_DOCUMENT_TYPES = new Set(['offer', 'confirmation']);

const DEFAULT_CONTRACT_DATA = {
  orderNumber: 'ORD-0013291093548-7FLQ',
  today: '2025-10-14',
  documentType: DEFAULT_DOCUMENT_TYPE,
  driver: {
    name: 'Roman Stryzhka',
    address: 'Nam. na Balabence 1437/3, 190 00 Praha 9',
    spz: '1AF V087',
    ico: '22319352',
  },
  provider: {
    name: 'Roman Stryzhka',
    address: 'Nam. na Balabence 1437/3, 190 00 Praha 9',
    ico: '22319352',
  },
  customer: {
    name: '',
    email: '',
  },
  passengers: '',
  trip: {
    from: { address: '' },
    to: { address: '' },
    time: '',
    paymentMethod: '',
  },
  totalPrice: '',
};

let contractData = structuredClone(DEFAULT_CONTRACT_DATA);

export function createDefaultContractData() {
  return structuredClone(DEFAULT_CONTRACT_DATA);
}

export function getContractData() {
  return contractData;
}

export function replaceContractData(nextData) {
  contractData = nextData;
  return contractData;
}

export function mergeContractData(partial) {
  contractData = {
    ...contractData,
    ...partial,
  };

  return contractData;
}

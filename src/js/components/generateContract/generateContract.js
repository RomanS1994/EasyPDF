import {
  clearContractData as resetContractData,
  getCurrentContractData,
  initContractFeature,
} from '../../../features/contracts/index.js';

initContractFeature();

export const contractData = getCurrentContractData();
export const clearContractData = resetContractData;

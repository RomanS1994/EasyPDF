import { isEmpty } from './contractValidation.js';

export function validateStep(step, contract) {
  const errors = {
    orderNumber: '',
    today: '',
    documentType: '',
    driverName: '',
    providerName: '',
    customerName: '',
    fromAddress: '',
    toAddress: '',
    tripTime: '',
    totalPrice: '',
  };

  if (step === 1) {
    if (isEmpty(contract?.orderNumber)) {
      errors.orderNumber = 'Order number is required.';
    }
    if (isEmpty(contract?.today)) {
      errors.today = 'Today is required.';
    }
    if (isEmpty(contract?.documentType)) {
      errors.documentType = 'Document type is required.';
    }
  }

  if (step === 2) {
    if (isEmpty(contract?.driver?.name)) {
      errors.driverName = 'Driver name is required.';
    }
    if (isEmpty(contract?.provider?.name)) {
      errors.providerName = 'Provider name is required.';
    }
  }

  if (step === 3) {
    if (isEmpty(contract?.customer?.name)) {
      errors.customerName = 'Customer name is required.';
    }
  }

  if (step === 4) {
    if (isEmpty(contract?.trip?.from?.address)) {
      errors.fromAddress = 'Trip from address is required.';
    }
    if (isEmpty(contract?.trip?.to?.address)) {
      errors.toAddress = 'Trip to address is required.';
    }
    if (isEmpty(contract?.trip?.time)) {
      errors.tripTime = 'Trip time is required.';
    }
    if (isEmpty(contract?.totalPrice)) {
      errors.totalPrice = 'Total price is required.';
    }
  }

  let isValid = true;

  if (step === 1) {
    if (errors.orderNumber || errors.today || errors.documentType) {
      isValid = false;
    }
  }

  if (step === 2) {
    if (errors.driverName || errors.providerName) {
      isValid = false;
    }
  }

  if (step === 3) {
    if (errors.customerName) {
      isValid = false;
    }
  }

  if (step === 4) {
    if (errors.fromAddress || errors.toAddress || errors.tripTime || errors.totalPrice) {
      isValid = false;
    }
  }

  return {
    isValid,
    errors,
  };
}

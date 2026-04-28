export function isEmpty(value) {
  return String(value || '').trim() === '';
}

export function validateContract(contract) {
  const errors = {
    customerName: '',
    fromAddress: '',
    toAddress: '',
    tripTime: '',
    totalPrice: '',
  };

  if (isEmpty(contract?.customer?.name)) {
    errors.customerName = 'Customer name is required.';
  }

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

  const isValid =
    errors.customerName === '' &&
    errors.fromAddress === '' &&
    errors.toAddress === '' &&
    errors.tripTime === '' &&
    errors.totalPrice === '';

  return {
    isValid,
    errors,
  };
}

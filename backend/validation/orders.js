import { normalizeText } from './common.js';

function hasPositivePrice(value) {
  const match = String(value || '').match(/-?\d+/);
  if (!match) return false;

  return Number.parseInt(match[0], 10) > 0;
}

function resolveAddress(value) {
  if (value && typeof value === 'object') {
    return value.address || '';
  }

  return value;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeText(value));
}

export function validateOrderCreateInput(body = {}) {
  const contractData =
    body.contractData && typeof body.contractData === 'object'
      ? body.contractData
      : body.order && typeof body.order === 'object'
        ? body.order
        : {};

  const customer = contractData.customer && typeof contractData.customer === 'object'
    ? contractData.customer
    : body.customer && typeof body.customer === 'object'
      ? body.customer
      : {};

  const trip = contractData.trip && typeof contractData.trip === 'object'
    ? contractData.trip
    : body.trip && typeof body.trip === 'object'
      ? body.trip
      : {};

  const requiredFields = [
    customer.name,
    customer.email,
    resolveAddress(trip.from) || resolveAddress(body.trip?.from),
    resolveAddress(trip.to) || resolveAddress(body.trip?.to),
    trip.time,
    trip.paymentMethod,
    contractData.totalPrice || body.totalPrice,
  ];

  const hasAllRequiredFields = requiredFields.every(value => Boolean(normalizeText(value)));
  const passengersValue = normalizeText(contractData.passengers ?? body.passengers);
  const passengers = /^[1-9]\d*$/.test(passengersValue) ? Number(passengersValue) : 0;

  if (
    !hasAllRequiredFields ||
    !isValidEmail(customer.email) ||
    passengers < 1 ||
    !hasPositivePrice(contractData.totalPrice || body.totalPrice)
  ) {
    throw new Error('Order contract data is incomplete');
  }
}

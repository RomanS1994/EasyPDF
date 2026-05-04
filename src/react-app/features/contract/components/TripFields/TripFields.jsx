import { useDispatch, useSelector } from 'react-redux';

import { useI18n } from '../../../../app/i18n/useI18n.js';
import { AddressAutocompleteField } from '../../../addressAutocomplete/index.js';
import { selectTrip, updateTripField } from '../../contractSlice.js';
import './TripFields.css';

function getPaymentIcon(key) {
  if (key === 'card') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.5" y="6.5" width="17" height="11" rx="2" />
        <path d="M3.5 10.5h17" />
        <path d="M7 14h4" />
      </svg>
    );
  }

  if (key === 'cash') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.5" y="7.5" width="17" height="9" rx="2" />
        <circle cx="12" cy="12" r="2.2" />
        <path d="M6.5 10.5h0.01" />
        <path d="M17.5 13.5h0.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 5.5h8l2.5 2.5V18.5H7z" />
      <path d="M12.5 5.5V8h2.5" />
      <path d="M9.5 12h5" />
      <path d="M12 9.5v5" />
    </svg>
  );
}

export function TripFields() {
  const { t } = useI18n();
  const dispatch = useDispatch();
  const trip = useSelector(selectTrip);
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const paymentMethods = [
    { key: 'card', label: t('contract.card') },
    { key: 'cash', label: t('contract.cash') },
    { key: 'invoice', label: t('contract.invoice') },
  ];

  return (
    <div className="contractFieldsBlock">
      <label className="contractField">
        <AddressAutocompleteField
          apiKey={mapsApiKey}
          ariaLabel={t('contract.pickupAddress')}
          clearLabel={t('contract.clearPickupAddress')}
          placeholder={`${t('contract.pickupAddress')} *`}
          value={trip.from?.address || ''}
          onChange={value => dispatch(updateTripField({ key: 'from', value }))}
          onClear={() => dispatch(updateTripField({ key: 'from', value: '' }))}
        />
      </label>

      <label className="contractField">
        <AddressAutocompleteField
          apiKey={mapsApiKey}
          ariaLabel={t('contract.dropoffAddress')}
          clearLabel={t('contract.clearDropoffAddress')}
          placeholder={`${t('contract.dropoffAddress')} *`}
          value={trip.to?.address || ''}
          onChange={value => dispatch(updateTripField({ key: 'to', value }))}
          onClear={() => dispatch(updateTripField({ key: 'to', value: '' }))}
        />
      </label>

      <label className="contractField">
        <div className="contractFieldControl">
          <input
            className="contractField-input contractField-input-date"
            type="datetime-local"
            aria-label={t('contract.pickupDateTime')}
            step="60"
            required
            value={toDateTimeLocalValue(trip.time)}
            onChange={event =>
              dispatch(updateTripField({ key: 'time', value: event.target.value }))
            }
          />
          {trip.time ? (
            <button
              className="contractField-clear"
              type="button"
              aria-label={t('contract.clearPickupDateTime')}
              onClick={() => dispatch(updateTripField({ key: 'time', value: '' }))}
            >
              ×
            </button>
          ) : null}
        </div>
      </label>

      <div className="paymentMethodBlock">
        <div className="paymentMethodLabel">
          <span>{t('contract.paymentMethod')}</span>
          <span aria-hidden="true" className="paymentMethodRequired">
            *
          </span>
        </div>
        <div className="paymentMethodButtons">
          {paymentMethods.map(method => (
            <button
              key={method.key}
              className={`paymentMethodButton ${trip.paymentMethod === method.key ? 'is-active' : ''}`}
              type="button"
              onClick={() => dispatch(updateTripField({ key: 'paymentMethod', value: method.key }))}
            >
              <span className="paymentMethodButton-icon" aria-hidden="true">
                {getPaymentIcon(method.key)}
              </span>
              {method.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function toDateTimeLocalValue(value) {
  const text = String(value ?? '').trim();

  if (!text) {
    return '';
  }

  const match = text.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}:\d{2})(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?$/,
  );

  if (match) {
    return `${match[1]}T${match[2] || '00:00'}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return text;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

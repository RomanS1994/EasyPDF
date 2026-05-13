import { useDispatch, useSelector } from 'react-redux';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { SvgIcon } from '@shared/app/components/SvgIcon/SvgIcon.jsx';
import { formatDateTime } from '@shared/app/utils/dateFormat.js';
import { AddressAutocompleteField } from '../../../addressAutocomplete/AddressAutocompleteField.jsx';
import { selectTrip, updateTripField } from '../../contractSlice.js';
import './TripFields.css';

function getPaymentIcon(key) {
  if (key === 'card') {
    return <SvgIcon name="card" />;
  }

  if (key === 'cash') {
    return <SvgIcon name="cash" />;
  }

  return <SvgIcon name="invoice" />;
}

export function TripFields() {
  const { language, t } = useI18n();
  const dispatch = useDispatch();
  const trip = useSelector(selectTrip);
  const mapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const dateValue = toDateTimeLocalValue(trip.time);
  const formattedTripTime = dateValue ? formatDateTime(dateValue, language) : '';
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
        <div className={`contractDateField ${trip.time ? 'is-selected' : ''}`}>
          <input
            className="contractDateField-nativeInput"
            type="datetime-local"
            aria-label={t('contract.pickupDateTime')}
            step="300"
            value={dateValue}
            onChange={event =>
              dispatch(updateTripField({ key: 'time', value: event.target.value }))
            }
          />
          <div className="contractDateField-trigger" aria-hidden="true">
            <span className="contractDateField-icon" aria-hidden="true">
              <SvgIcon name="calendar" />
            </span>
            <span className={`contractDateField-value ${trip.time ? '' : 'is-placeholder'}`}>
              {formattedTripTime || `${t('contract.pickupDateTime')} *`}
            </span>
          </div>
          {trip.time ? (
            <button
              className="contractField-clear contractDateField-clear"
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

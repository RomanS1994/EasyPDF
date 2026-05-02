import { useDispatch, useSelector } from 'react-redux';

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
  const dispatch = useDispatch();
  const trip = useSelector(selectTrip);
  const paymentMethods = [
    { key: 'card', label: 'Card' },
    { key: 'cash', label: 'Cash' },
    { key: 'invoice', label: 'Invoice' },
  ];

  return (
    <div className="contractFieldsBlock">
      <label className="contractField">
        <div className="contractFieldControl">
          <input
            className="contractField-input"
            type="text"
            placeholder="Pickup address *"
            required
            value={trip.from?.address || ''}
            onChange={event =>
              dispatch(updateTripField({ key: 'from', value: event.target.value }))
            }
          />
          {trip.from?.address ? (
            <button
              className="contractField-clear"
              type="button"
              aria-label="Clear pickup address"
              onClick={() => dispatch(updateTripField({ key: 'from', value: '' }))}
            >
              ×
            </button>
          ) : null}
        </div>
      </label>

      <label className="contractField">
        <div className="contractFieldControl">
          <input
            className="contractField-input"
            type="text"
            placeholder="Dropoff address *"
            required
            value={trip.to?.address || ''}
            onChange={event =>
              dispatch(updateTripField({ key: 'to', value: event.target.value }))
            }
          />
          {trip.to?.address ? (
            <button
              className="contractField-clear"
              type="button"
              aria-label="Clear dropoff address"
              onClick={() => dispatch(updateTripField({ key: 'to', value: '' }))}
            >
              ×
            </button>
          ) : null}
        </div>
      </label>

      <label className="contractField">
        <div className="contractFieldControl">
          <input
            className="contractField-input contractField-input-date"
            type="date"
            aria-label="Pickup date"
            required
            value={trip.time}
            onChange={event =>
              dispatch(updateTripField({ key: 'time', value: event.target.value }))
            }
          />
          {trip.time ? (
            <button
              className="contractField-clear"
              type="button"
              aria-label="Clear pickup date"
              onClick={() => dispatch(updateTripField({ key: 'time', value: '' }))}
            >
              ×
            </button>
          ) : null}
        </div>
      </label>

      <div className="paymentMethodBlock">
        <div className="paymentMethodLabel">
          <span>Payment method</span>
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

import { useDispatch, useSelector } from 'react-redux';

import { selectTrip, updateTripField } from '../../contractSlice.js';
import { normalizeTripTime } from '../../utils/timeUtils.js';
import './TripFields.css';

export function TripFields() {
  const dispatch = useDispatch();
  const trip = useSelector(selectTrip);

  return (
    <section className="contractSection">
      <h3 className="contractSection-title">Trip</h3>

      <label className="contractField">
        <span className="contractField-label">From</span>
        <input
          className="contractField-input"
          type="text"
          value={trip.from?.address || ''}
          onChange={event =>
            dispatch(updateTripField({ key: 'from', value: event.target.value }))
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">To</span>
        <input
          className="contractField-input"
          type="text"
          value={trip.to?.address || ''}
          onChange={event =>
            dispatch(updateTripField({ key: 'to', value: event.target.value }))
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">Time</span>
        <input
          className="contractField-input"
          type="text"
          value={trip.time}
          onChange={event =>
            dispatch(
              updateTripField({
                key: 'time',
                value: normalizeTripTime(event.target.value),
              }),
            )
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">Payment method</span>
        <input
          className="contractField-input"
          type="text"
          value={trip.paymentMethod}
          onChange={event =>
            dispatch(updateTripField({ key: 'paymentMethod', value: event.target.value }))
          }
        />
      </label>
    </section>
  );
}

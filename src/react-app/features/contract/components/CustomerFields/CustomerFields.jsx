import { useDispatch, useSelector } from 'react-redux';

import { selectContract, selectCustomer, setPassengers, updateCustomerField } from '../../contractSlice.js';
import './CustomerFields.css';

export function CustomerFields() {
  const dispatch = useDispatch();
  const customer = useSelector(selectCustomer);
  const passengers = useSelector(selectContract).passengers;

  function handlePassengersChange(event) {
    const nextValue = event.target.value.replace(/[^\d]/g, '');
    dispatch(setPassengers(nextValue));
  }

  return (
    <div className="contractFieldsBlock">
      <label className="contractField">
        <div className="contractFieldControl">
          <input
            className="contractField-input"
            type="text"
            placeholder="Full name *"
            required
            value={customer.name}
            onChange={event =>
              dispatch(updateCustomerField({ key: 'name', value: event.target.value }))
            }
          />
          {customer.name ? (
            <button
              className="contractField-clear"
              type="button"
              aria-label="Clear full name"
              onClick={() => dispatch(updateCustomerField({ key: 'name', value: '' }))}
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
            placeholder="Email or phone *"
            required
            value={customer.email}
            onChange={event =>
              dispatch(updateCustomerField({ key: 'email', value: event.target.value }))
            }
          />
          {customer.email ? (
            <button
              className="contractField-clear"
              type="button"
              aria-label="Clear email or phone"
              onClick={() => dispatch(updateCustomerField({ key: 'email', value: '' }))}
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
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="Passengers *"
            required
            value={passengers}
            onChange={handlePassengersChange}
          />
          {passengers ? (
            <button
              className="contractField-clear"
              type="button"
              aria-label="Clear passengers"
              onClick={() => dispatch(setPassengers(''))}
            >
              ×
            </button>
          ) : null}
        </div>
      </label>
    </div>
  );
}

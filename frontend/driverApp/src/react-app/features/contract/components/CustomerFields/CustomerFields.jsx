import { useDispatch, useSelector } from 'react-redux';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { selectContract, selectCustomer, setPassengers, updateCustomerField } from '../../contractSlice.js';
import './CustomerFields.css';

export function CustomerFields() {
  const { t } = useI18n();
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
            placeholder={`${t('contract.fullName')} *`}
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
              aria-label={t('common.clear')}
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
            placeholder={`${t('contract.contact')} *`}
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
              aria-label={t('common.clear')}
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
            placeholder={`${t('contract.passengers')} *`}
            required
            value={passengers}
            onChange={handlePassengersChange}
          />
          {passengers ? (
            <button
              className="contractField-clear"
              type="button"
              aria-label={t('common.clear')}
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

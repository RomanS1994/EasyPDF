import { useDispatch, useSelector } from 'react-redux';

import { selectCustomer, updateCustomerField } from '../../contractSlice.js';
import './CustomerFields.css';

export function CustomerFields() {
  const dispatch = useDispatch();
  const customer = useSelector(selectCustomer);

  return (
    <section className="contractSection">
      <h3 className="contractSection-title">Customer</h3>

      <label className="contractField">
        <span className="contractField-label">Name</span>
        <input
          className="contractField-input"
          type="text"
          value={customer.name}
          onChange={event =>
            dispatch(updateCustomerField({ key: 'name', value: event.target.value }))
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">Email</span>
        <input
          className="contractField-input"
          type="email"
          value={customer.email}
          onChange={event =>
            dispatch(updateCustomerField({ key: 'email', value: event.target.value }))
          }
        />
      </label>
    </section>
  );
}

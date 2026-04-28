import { useDispatch, useSelector } from 'react-redux';

import { selectProvider, updateProviderField } from '../../contractSlice.js';
import './ProviderFields.css';

export function ProviderFields() {
  const dispatch = useDispatch();
  const provider = useSelector(selectProvider);

  return (
    <section className="contractSection">
      <h3 className="contractSection-title">Provider</h3>

      <label className="contractField">
        <span className="contractField-label">Name</span>
        <input
          className="contractField-input"
          type="text"
          value={provider.name}
          onChange={event =>
            dispatch(updateProviderField({ key: 'name', value: event.target.value }))
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">Address</span>
        <input
          className="contractField-input"
          type="text"
          value={provider.address}
          onChange={event =>
            dispatch(updateProviderField({ key: 'address', value: event.target.value }))
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">ICO</span>
        <input
          className="contractField-input"
          type="text"
          value={provider.ico}
          onChange={event =>
            dispatch(updateProviderField({ key: 'ico', value: event.target.value }))
          }
        />
      </label>
    </section>
  );
}

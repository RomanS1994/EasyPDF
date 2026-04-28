import { useDispatch, useSelector } from 'react-redux';

import { selectDriver, updateDriverField } from '../../contractSlice.js';
import './DriverFields.css';

export function DriverFields() {
  const dispatch = useDispatch();
  const driver = useSelector(selectDriver);

  return (
    <section className="contractSection">
      <h3 className="contractSection-title">Driver</h3>

      <label className="contractField">
        <span className="contractField-label">Name</span>
        <input
          className="contractField-input"
          type="text"
          value={driver.name}
          onChange={event =>
            dispatch(updateDriverField({ key: 'name', value: event.target.value }))
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">Address</span>
        <input
          className="contractField-input"
          type="text"
          value={driver.address}
          onChange={event =>
            dispatch(updateDriverField({ key: 'address', value: event.target.value }))
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">SPZ</span>
        <input
          className="contractField-input"
          type="text"
          value={driver.spz}
          onChange={event =>
            dispatch(updateDriverField({ key: 'spz', value: event.target.value }))
          }
        />
      </label>

      <label className="contractField">
        <span className="contractField-label">ICO</span>
        <input
          className="contractField-input"
          type="text"
          value={driver.ico}
          onChange={event =>
            dispatch(updateDriverField({ key: 'ico', value: event.target.value }))
          }
        />
      </label>
    </section>
  );
}

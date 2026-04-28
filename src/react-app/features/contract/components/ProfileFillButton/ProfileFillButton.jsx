import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '../../../auth/authSlice.js';
import { updateDriverField, updateProviderField } from '../../contractSlice.js';
import './ProfileFillButton.css';

export function ProfileFillButton() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const [message, setMessage] = useState('');

  if (!user) {
    return null;
  }

  function handleClick() {
    const driver = user.profile?.driver || {};
    const provider = user.profile?.provider || {};

    if (driver.name !== undefined) {
      dispatch(updateDriverField({ key: 'name', value: driver.name || '' }));
    }
    if (driver.address !== undefined) {
      dispatch(updateDriverField({ key: 'address', value: driver.address || '' }));
    }
    if (driver.spz !== undefined) {
      dispatch(updateDriverField({ key: 'spz', value: driver.spz || '' }));
    }
    if (driver.ico !== undefined) {
      dispatch(updateDriverField({ key: 'ico', value: driver.ico || '' }));
    }

    if (provider.name !== undefined) {
      dispatch(updateProviderField({ key: 'name', value: provider.name || '' }));
    }
    if (provider.address !== undefined) {
      dispatch(updateProviderField({ key: 'address', value: provider.address || '' }));
    }
    if (provider.ico !== undefined) {
      dispatch(updateProviderField({ key: 'ico', value: provider.ico || '' }));
    }

    setMessage('Profile copied to contract.');
  }

  return (
    <section className="profileFillButton">
      <button className="profileFillButton-button" type="button" onClick={handleClick}>
        Use my profile
      </button>

      {message ? <p className="profileFillButton-message">{message}</p> : null}
    </section>
  );
}

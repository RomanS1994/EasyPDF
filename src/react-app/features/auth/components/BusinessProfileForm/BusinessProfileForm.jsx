import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useUpdateProfileMutation } from '../../authApi.js';
import { selectToken, selectUser, setSession } from '../../authSlice.js';
import { saveSession } from '../../authStorage.js';
import './BusinessProfileForm.css';

export function BusinessProfileForm() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [driverName, setDriverName] = useState('');
  const [driverAddress, setDriverAddress] = useState('');
  const [driverSpz, setDriverSpz] = useState('');
  const [driverIco, setDriverIco] = useState('');
  const [providerName, setProviderName] = useState('');
  const [providerAddress, setProviderAddress] = useState('');
  const [providerIco, setProviderIco] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const profile = user?.profile || {};
    const driver = profile.driver || user?.driver || {};
    const provider = profile.provider || user?.provider || {};

    setDriverName(driver.name || '');
    setDriverAddress(driver.address || '');
    setDriverSpz(driver.spz || '');
    setDriverIco(driver.ico || '');
    setProviderName(provider.name || '');
    setProviderAddress(provider.address || '');
    setProviderIco(provider.ico || '');
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const updatedUser = await updateProfile({
        driver: {
          name: driverName,
          address: driverAddress,
          spz: driverSpz,
          ico: driverIco,
        },
        provider: {
          name: providerName,
          address: providerAddress,
          ico: providerIco,
        },
      }).unwrap();

      saveSession(token, updatedUser);
      dispatch(setSession({ token, user: updatedUser }));
      setMessage('Business profile saved.');
    } catch {
      setError('Failed to save business profile.');
    }
  }

  return (
    <form className="businessProfileForm" onSubmit={handleSubmit}>
      <h3 className="businessProfileForm-title">Business profile</h3>

      <div className="businessProfileForm-columns">
        <div className="businessProfileForm-group">
          <h4 className="businessProfileForm-subtitle">Driver</h4>

          <label className="businessProfileForm-field">
            <span>Name</span>
            <input
              type="text"
              value={driverName}
              onChange={event => setDriverName(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>Address</span>
            <input
              type="text"
              value={driverAddress}
              onChange={event => setDriverAddress(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>SPZ</span>
            <input
              type="text"
              value={driverSpz}
              onChange={event => setDriverSpz(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>ICO</span>
            <input
              type="text"
              value={driverIco}
              onChange={event => setDriverIco(event.target.value)}
            />
          </label>
        </div>

        <div className="businessProfileForm-group">
          <h4 className="businessProfileForm-subtitle">Provider</h4>

          <label className="businessProfileForm-field">
            <span>Name</span>
            <input
              type="text"
              value={providerName}
              onChange={event => setProviderName(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>Address</span>
            <input
              type="text"
              value={providerAddress}
              onChange={event => setProviderAddress(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>ICO</span>
            <input
              type="text"
              value={providerIco}
              onChange={event => setProviderIco(event.target.value)}
            />
          </label>
        </div>
      </div>

      {message ? <p className="businessProfileForm-message">{message}</p> : null}
      {error ? <p className="businessProfileForm-error">{error}</p> : null}

      <button className="businessProfileForm-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save business profile'}
      </button>
    </form>
  );
}

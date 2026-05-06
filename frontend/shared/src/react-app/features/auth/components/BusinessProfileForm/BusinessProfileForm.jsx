import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useI18n } from '../../../../app/i18n/useI18n.js';
import { useUpdateProfileMutation } from '../../authApi.js';
import { selectToken, selectUser, setSession } from '../../authSlice.js';
import { saveSession } from '../../authStorage.js';
import './BusinessProfileForm.css';

export function BusinessProfileForm() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const { t } = useI18n();
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
      setMessage(t('auth.profileSaved'));
    } catch {
      setError(t('auth.failedToSaveProfile'));
    }
  }

  return (
    <form className="businessProfileForm" onSubmit={handleSubmit}>
      <div className="businessProfileForm-sections">
        <section className="businessProfileForm-card">
          <h4 className="businessProfileForm-subtitle">{t('auth.driverLabel')}</h4>

          <label className="businessProfileForm-field">
            <span>{t('auth.name')}</span>
            <input
              type="text"
              placeholder={`Введіть ${t('auth.name').toLowerCase()} *`}
              value={driverName}
              onChange={event => setDriverName(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.address')}</span>
            <input
              type="text"
              placeholder={`Введіть ${t('auth.address').toLowerCase()} *`}
              value={driverAddress}
              onChange={event => setDriverAddress(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.spz')}</span>
            <input
              type="text"
              placeholder={`Введіть ${t('auth.spz').toLowerCase()} *`}
              value={driverSpz}
              onChange={event => setDriverSpz(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.ico')}</span>
            <input
              type="text"
              placeholder={`Введіть ${t('auth.ico').toLowerCase()} *`}
              value={driverIco}
              onChange={event => setDriverIco(event.target.value)}
            />
          </label>
        </section>

        <section className="businessProfileForm-card">
          <h4 className="businessProfileForm-subtitle">{t('auth.providerLabel')}</h4>

          <label className="businessProfileForm-field">
            <span>{t('auth.name')}</span>
            <input
              type="text"
              value={providerName}
              onChange={event => setProviderName(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.address')}</span>
            <input
              type="text"
              value={providerAddress}
              onChange={event => setProviderAddress(event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.ico')}</span>
            <input
              type="text"
              value={providerIco}
              onChange={event => setProviderIco(event.target.value)}
            />
          </label>
        </section>
      </div>

      {message ? <p className="businessProfileForm-message">{message}</p> : null}
      {error ? <p className="businessProfileForm-error">{error}</p> : null}

      <button className="businessProfileForm-button" type="submit" disabled={isLoading}>
        {isLoading ? t('auth.savingProfile') : t('auth.saveBusinessProfile')}
      </button>
    </form>
  );
}

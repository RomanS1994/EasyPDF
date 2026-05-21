import { useBusinessProfileForm } from './useBusinessProfileForm.js';
import './BusinessProfileForm.css';

export function BusinessProfileForm() {
  const {
    error,
    form,
    handleSubmit,
    isLoading,
    message,
    t,
    updateField,
  } = useBusinessProfileForm();

  return (
    <form className="businessProfileForm" onSubmit={handleSubmit}>
      <div className="businessProfileForm-sections">
        <section className="businessProfileForm-card">
          <h3 className="businessProfileForm-subtitle">{t('auth.driverLabel')}</h3>

          <label className="businessProfileForm-field">
            <span>{t('auth.name')}</span>
            <input
              type="text"
              placeholder={`Введіть ${t('auth.name').toLowerCase()} *`}
              value={form.driverName}
              onChange={event => updateField('driverName', event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.address')}</span>
            <input
              type="text"
              placeholder={`Введіть ${t('auth.address').toLowerCase()} *`}
              value={form.driverAddress}
              onChange={event => updateField('driverAddress', event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.spz')}</span>
            <input
              type="text"
              placeholder={`Введіть ${t('auth.spz').toLowerCase()} *`}
              value={form.driverSpz}
              onChange={event => updateField('driverSpz', event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.ico')}</span>
            <input
              type="text"
              placeholder={`Введіть ${t('auth.ico').toLowerCase()} *`}
              value={form.driverIco}
              onChange={event => updateField('driverIco', event.target.value)}
            />
          </label>
        </section>

        <section className="businessProfileForm-card">
          <h3 className="businessProfileForm-subtitle">{t('auth.providerLabel')}</h3>

          <label className="businessProfileForm-field">
            <span>{t('auth.name')}</span>
            <input
              type="text"
              value={form.providerName}
              onChange={event => updateField('providerName', event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.address')}</span>
            <input
              type="text"
              value={form.providerAddress}
              onChange={event => updateField('providerAddress', event.target.value)}
            />
          </label>

          <label className="businessProfileForm-field">
            <span>{t('auth.ico')}</span>
            <input
              type="text"
              value={form.providerIco}
              onChange={event => updateField('providerIco', event.target.value)}
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

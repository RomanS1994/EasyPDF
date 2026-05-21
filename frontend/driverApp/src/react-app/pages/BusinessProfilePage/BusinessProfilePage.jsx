import { Link } from 'react-router-dom';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { BusinessProfileForm } from '@shared/features/auth/components/BusinessProfileForm/BusinessProfileForm.jsx';
import './BusinessProfilePage.css';

export function BusinessProfilePage() {
  const { t } = useI18n();

  return (
    <section className="businessProfilePage pageStack">
      <header className="businessProfilePage-header">
        <Link className="businessProfilePage-back" to="/settings">
          <span aria-hidden="true">←</span>
          <span>{t('common.back')}</span>
        </Link>

        <div className="appTitleBlock">
          <p className="sectionEyebrow">{t('settings.eyebrow')}</p>
          <h1>{t('settings.businessProfile.title')}</h1>
          <p>{t('settings.businessProfile.subtitle')}</p>
        </div>
      </header>

      <section className="screenCard businessProfilePage-card">
        <BusinessProfileForm />
      </section>
    </section>
  );
}

import { SvgIcon } from '@shared/app/components/SvgIcon/SvgIcon.jsx';
import { useI18n } from '@shared/app/i18n/useI18n.js';
import './FlightTrackingNotice.css';

const featureKeys = [
  'flightTrackingFeatureStatus',
  'flightTrackingFeaturePickup',
  'flightTrackingFeatureOrder',
];

export function FlightTrackingNotice() {
  const { t } = useI18n();

  return (
    <section className="flightTrackingNotice" aria-labelledby="flight-tracking-notice-title">
      <div className="flightTrackingNotice-main">
        <span className="flightTrackingNotice-icon" aria-hidden="true">
          <SvgIcon name="takeoff" />
        </span>

        <div className="flightTrackingNotice-copy">
          <span className="flightTrackingNotice-status">{t('home.flightTrackingStatus')}</span>
          <h2 id="flight-tracking-notice-title">{t('home.flightTrackingTitle')}</h2>
          <p>{t('home.flightTrackingCopy')}</p>
        </div>
      </div>

      <ul className="flightTrackingNotice-features" aria-label={t('home.flightTrackingFeaturesLabel')}>
        {featureKeys.map(key => (
          <li key={key}>
            <span aria-hidden="true" />
            {t(`home.${key}`)}
          </li>
        ))}
      </ul>

      <p className="flightTrackingNotice-benefit">{t('home.flightTrackingBenefit')}</p>
    </section>
  );
}

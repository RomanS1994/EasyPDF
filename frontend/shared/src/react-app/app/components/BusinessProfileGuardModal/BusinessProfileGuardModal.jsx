import { Link } from 'react-router-dom';

import { useI18n } from '../../i18n/useI18n.js';
import './BusinessProfileGuardModal.css';

export function BusinessProfileGuardModal({ isOpen, onLater, onOpenSettings }) {
  const { t } = useI18n();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="businessProfileGuardModal" role="presentation">
      <div className="businessProfileGuardModal-backdrop" />

      <div
        className="businessProfileGuardModal-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="businessProfileGuardTitle"
      >
        <div className="businessProfileGuardModal-copy">
          <p className="businessProfileGuardModal-eyebrow">{t('contract.guardEyebrow')}</p>
          <h2 id="businessProfileGuardTitle">{t('contract.guardTitle')}</h2>
          <p>{t('contract.guardCopy')}</p>
        </div>

        <div className="businessProfileGuardModal-actions">
          <Link
            className="businessProfileGuardModal-link"
            to="/settings"
            onClick={onOpenSettings}
          >
            <span className="businessProfileGuardModal-linkIcon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z" />
                <path d="M19.2 12a7.4 7.4 0 0 0-.1-1l1.5-1.2-1.4-2.4-1.8.5a7.6 7.6 0 0 0-1.7-1l-.3-1.9H11l-.3 1.9a7.6 7.6 0 0 0-1.7 1L7.2 7.4 5.8 9.8 7.3 11a7.4 7.4 0 0 0 0 2l-1.5 1.2 1.4 2.4 1.8-.5a7.6 7.6 0 0 0 1.7 1l.3 1.9h4.8l.3-1.9a7.6 7.6 0 0 0 1.7-1l1.8.5 1.4-2.4-1.5-1.2c.1-.3.1-.7.1-1Z" />
              </svg>
            </span>
            {t('contract.guardSettings')}
          </Link>

          <button className="businessProfileGuardModal-button" type="button" onClick={onLater}>
            {t('contract.guardLater')}
          </button>
        </div>
      </div>
    </div>
  );
}

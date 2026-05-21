import { Link } from 'react-router-dom';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { PlanUpgradeForm } from './components/PlanUpgradeForm/PlanUpgradeForm.jsx';
import './PlanUpgradePage.css';

export function PlanUpgradePage() {
  const { t } = useI18n();

  return (
    <section className="planUpgradePage pageStack">
      <header className="planUpgradePage-header">
        <Link className="planUpgradePage-back" to="/settings">
          <span aria-hidden="true">←</span>
          <span>{t('common.back')}</span>
        </Link>

        <div className="appTitleBlock">
          <h1>{t('settings.planUpgrade.title')}</h1>
          <p>{t('settings.planUpgrade.subtitle')}</p>
        </div>
      </header>

      <section className="screenCard planUpgradePage-card">
        <PlanUpgradeForm />
      </section>
    </section>
  );
}

import { useI18n } from '../../../../app/i18n/useI18n.js';
import './ProfileAuth.css';

export function ProfileAuth({ children }) {
  const { t } = useI18n();

  return (
    <section className="screenCard profileAuth">
      <div className="compactHeader">
        <h2>{t('account.signIn')}</h2>
        <p>{t('account.signInCopy')}</p>
      </div>

      <div className="profileAuthForms">{children}</div>
    </section>
  );
}

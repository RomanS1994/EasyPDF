import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import { selectUser } from '@shared/features/auth/authSlice.js';
import { AccountProfileForm } from '@shared/features/auth/components/AccountProfileForm/AccountProfileForm.jsx';
import { LoginForm } from '@shared/features/auth/components/LoginForm/LoginForm.jsx';
import { RegisterForm } from '@shared/features/auth/components/RegisterForm/RegisterForm.jsx';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import { ProfileDanger } from './components/ProfileDanger/ProfileDanger.jsx';
import { ProfileHero } from './components/ProfileHero/ProfileHero.jsx';
import { ProfileWorkspace } from './components/ProfileWorkspace/ProfileWorkspace.jsx';
import './AccountPage.css';

export function AccountPage() {
  const user = useSelector(selectUser);
  const { data } = useGetOrdersQuery(undefined, { skip: !user });
  const { t } = useI18n();
  const orders = data?.orders || [];

  return (
    <section className="accountPage pageStack">
      <header className="appTop accountPage-top">
        <Link className="accountPage-backLink" to="/settings">
          <span aria-hidden="true">←</span>
          <span>{t('account.back')}</span>
        </Link>
        <div className="appTitleBlock">
          <p className="sectionEyebrow">{t('account.eyebrow')}</p>
          <h1>{t('account.title')}</h1>
          <p>{t('account.intro')}</p>
        </div>
      </header>

      {user ? (
        <>
          <ProfileHero user={user} />

          <div className="screenCard accountPage-card">
            <AccountProfileForm />
          </div>

          <ProfileWorkspace user={user} orders={orders} />

          <ProfileDanger />
        </>
      ) : (
        <section className="screenCard profileAuth">
          <div className="compactHeader">
            <h2>{t('account.signIn')}</h2>
            <p>{t('account.signInCopy')}</p>
          </div>

          <div className="profileAuthForms">
            <LoginForm />
            <RegisterForm />
          </div>
        </section>
      )}
    </section>
  );
}

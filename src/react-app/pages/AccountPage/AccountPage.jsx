import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { useI18n } from '../../app/i18n/useI18n.js';
import { selectUser } from '../../features/auth/authSlice.js';
import { AccountProfileForm } from '../../features/auth/components/AccountProfileForm/AccountProfileForm.jsx';
import { BusinessProfileForm } from '../../features/auth/components/BusinessProfileForm/BusinessProfileForm.jsx';
import { LoginForm } from '../../features/auth/components/LoginForm/LoginForm.jsx';
import { RegisterForm } from '../../features/auth/components/RegisterForm/RegisterForm.jsx';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import { ProfileAuth } from './components/ProfileAuth/ProfileAuth.jsx';
import { ProfileDanger } from './components/ProfileDanger/ProfileDanger.jsx';
import { ProfileHero } from './components/ProfileHero/ProfileHero.jsx';
import { ProfileUpgrade } from './components/ProfileUpgrade/ProfileUpgrade.jsx';
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
        <Link className="accountPage-backLink" to="/cz/pdf/settings">
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
            <BusinessProfileForm />
          </div>

          <ProfileWorkspace user={user} orders={orders} />

          <ProfileUpgrade user={user} />

          <ProfileDanger />
        </>
      ) : (
        <ProfileAuth>
          <LoginForm />
          <RegisterForm />
        </ProfileAuth>
      )}
    </section>
  );
}

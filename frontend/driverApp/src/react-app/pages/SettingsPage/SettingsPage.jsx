import { useSelector } from "react-redux";

import { hasAdminAccess } from "@shared/features/auth/authAccess.js";
import { selectUser } from "@shared/features/auth/authSlice.js";
import { BusinessProfileForm } from "@shared/features/auth/components/BusinessProfileForm/BusinessProfileForm.jsx";
import { ProfileDanger } from "../AccountPage/components/ProfileDanger/ProfileDanger.jsx";
import { ProfileUpgrade } from "../AccountPage/components/ProfileUpgrade/ProfileUpgrade.jsx";
import { SettingsAccountSummary } from "./components/SettingsAccountSummary/SettingsAccountSummary.jsx";
import { SettingsAdminAccess } from "./components/SettingsAdminAccess/SettingsAdminAccess.jsx";
import { SettingsLanguageCard } from "./components/SettingsLanguageCard/SettingsLanguageCard.jsx";
import { useI18n } from "@shared/app/i18n/useI18n.js";
import "./SettingsPage.css";

export function SettingsPage() {
  const user = useSelector(selectUser);
  const canAdmin = hasAdminAccess(user);
  const { t } = useI18n();

  return (
    <section className="settingsPage pageStack">
      <header className="appTop">
        <div className="appTitleBlock">
          <p className="sectionEyebrow">{t('settings.eyebrow')}</p>
          <h1>{t('settings.title')}</h1>
          <p>{t('settings.subtitle')}</p>
        </div>
      </header>

      <SettingsLanguageCard />
      <SettingsAccountSummary user={user} />

      {canAdmin ? <SettingsAdminAccess /> : null}

      <section className="screenCard settingsPage-card">
        <div className="compactHeader">
          <h2>{t('settings.businessProfile.title')}</h2>
          <p>{t('settings.businessProfile.subtitle')}</p>
        </div>

        <BusinessProfileForm />
      </section>

      <ProfileUpgrade user={user} />

      <section className="screenCard settingsPage-card">
        <div className="compactHeader">
          <h2>{t('settings.session.title')}</h2>
          <p>{t('settings.session.subtitle')}</p>
        </div>

        <ProfileDanger showHeader={false} bare />
      </section>
    </section>
  );
}

import { useSelector } from "react-redux";

import { hasAdminAccess } from "../../features/auth/authAccess.js";
import { selectUser } from "../../features/auth/authSlice.js";
import { BusinessProfileForm } from "../../features/auth/components/BusinessProfileForm/BusinessProfileForm.jsx";
import { ProfileDanger } from "../AccountPage/components/ProfileDanger/ProfileDanger.jsx";
import { ProfileUpgrade } from "../AccountPage/components/ProfileUpgrade/ProfileUpgrade.jsx";
import { SettingsAccountSummary } from "./components/SettingsAccountSummary/SettingsAccountSummary.jsx";
import { SettingsAdminAccess } from "./components/SettingsAdminAccess/SettingsAdminAccess.jsx";
import { SettingsLanguageCard } from "./components/SettingsLanguageCard/SettingsLanguageCard.jsx";
import "./SettingsPage.css";

export function SettingsPage() {
  const user = useSelector(selectUser);
  const canAdmin = hasAdminAccess(user);

  return (
    <section className="settingsPage pageStack">
      <header className="appTop">
        <div className="appTitleBlock">
          <p className="sectionEyebrow">Settings</p>
          <h1>Driver portal</h1>
          <p>
            Language, business profile, subscription and session are kept on one
            screen.
          </p>
        </div>
      </header>

      <SettingsLanguageCard />
      <SettingsAccountSummary user={user} />

      {canAdmin ? <SettingsAdminAccess /> : null}

      <section className="screenCard settingsPage-card">
        <div className="compactHeader">
          <h2>Business profile</h2>
          <p>
            Fill the company data that is reused in new contracts and orders.
          </p>
        </div>

        <BusinessProfileForm />
      </section>

      <ProfileUpgrade user={user} />

      <section className="screenCard settingsPage-card">
        <div className="compactHeader">
          <h2>Session</h2>
          <p>
            Logout signs you out, delete removes the account and local draft
            data.
          </p>
        </div>

        <ProfileDanger showHeader={false} bare />
      </section>
    </section>
  );
}

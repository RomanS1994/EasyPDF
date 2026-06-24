import { useEffect, useState } from "react";

import { useI18n } from "@shared/app/i18n/useI18n.js";
import { LoginForm } from "@shared/features/auth/components/LoginForm/LoginForm.jsx";
import { RegisterForm } from "@shared/features/auth/components/RegisterForm/RegisterForm.jsx";
import { PlanCards } from "../PlanCards/PlanCards.jsx";
import { AuthModeSwitch } from "../AuthModeSwitch/AuthModeSwitch.jsx";
import mainRobotIcon from "../../../../assets/main_robot.png";
import "./GuestStage.css";

const LANGUAGE_OPTIONS = [
  { id: "uk", label: "UA", titleKey: "settings.languageCard.uk" },
  { id: "en", label: "EN", titleKey: "settings.languageCard.en" },
  { id: "cs", label: "CS", titleKey: "settings.languageCard.cs" },
];

export function GuestStage({ defaultMode = "login" }) {
  const [mode, setMode] = useState(() => defaultMode);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const { language, setLanguage, t } = useI18n();

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  return (
    <section className="guestStage pageStack" data-auth-mode={mode}>
      <div className="guestIntro">
        <div className="guestIntroTopbar">
          <p className="sectionEyebrow">{t('guest.docTra')}</p>
          <div className="guestLanguageSwitch" role="group" aria-label={t('settings.languageCard.label')}>
            {LANGUAGE_OPTIONS.map(option => {
              const isActive = language === option.id;

              return (
                <button
                  key={option.id}
                  className={`guestLanguageButton ${isActive ? 'is-active' : ''}`}
                  type="button"
                  title={t(option.titleKey)}
                  aria-pressed={isActive}
                  onClick={() => setLanguage(option.id)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
        <h1>{mode === "register" ? t('guest.titleRegister') : t('guest.titleLogin')}</h1>
        <p>{mode === "register" ? t('guest.textRegister') : t('guest.textLogin')}</p>
        <div className="guestIntroMark" aria-hidden="true">
          <div className="guestIntroMark-surface" />
          <img className="guestIntroMark-icon" src={mainRobotIcon} alt="" />
        </div>
      </div>

      {mode === "register" ? (
        <PlanCards selectedPlanId={selectedPlanId} onPlanSelect={setSelectedPlanId} />
      ) : null}

      <section className="guestAuth screenCard">
        <div className="compactHeader">
          <h2>{mode === "login" ? t('guest.signInHeading') : t('guest.createHeading')}</h2>
          <p>{mode === "login" ? t('guest.signInCopy') : t('guest.createCopy')}</p>
        </div>

        <AuthModeSwitch value={mode} onChange={setMode} />

        <div className="guestAuthForms">
          {mode === "login" ? <LoginForm /> : (
            <RegisterForm
              selectedPlanId={selectedPlanId}
              onPlanSelect={setSelectedPlanId}
            />
          )}
        </div>
      </section>
    </section>
  );
}

import { useEffect, useState } from "react";

import { useI18n } from "../../../../app/i18n/useI18n.js";
import { LoginForm } from "../../../../features/auth/components/LoginForm/LoginForm.jsx";
import { RegisterForm } from "../../../../features/auth/components/RegisterForm/RegisterForm.jsx";
import { PlanCards } from "../PlanCards/PlanCards.jsx";
import { AuthModeSwitch } from "../AuthModeSwitch/AuthModeSwitch.jsx";
import mainRobotIcon from "../../../../assets/main_robot.png";
import "./GuestStage.css";

export function GuestStage({ defaultMode = "login" }) {
  const [mode, setMode] = useState(() => defaultMode);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const { t } = useI18n();

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  return (
    <section className="guestStage pageStack" data-auth-mode={mode}>
      <div className="guestIntro">
        <p className="sectionEyebrow">{t('guest.docTra')}</p>
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

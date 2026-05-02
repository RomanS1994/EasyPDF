import { useEffect, useState } from "react";

import { LoginForm } from "../../../../features/auth/components/LoginForm/LoginForm.jsx";
import { RegisterForm } from "../../../../features/auth/components/RegisterForm/RegisterForm.jsx";
import { PlanCards } from "../PlanCards/PlanCards.jsx";
import { AuthModeSwitch } from "../AuthModeSwitch/AuthModeSwitch.jsx";
import mainRobotIcon from "../../../../assets/main_robot.png";
import "./GuestStage.css";

function getGuestTitle(mode) {
  // Підбираємо короткий заголовок під поточний режим.
  return mode === "register" ? "Your personal assistant" : "Welcome back";
}

function getGuestText(mode) {
  // Тримаємо короткий опис без зайвого шуму.
  return mode === "register"
    ? "Orders, documents and daily actions are collected in one mobile workspace."
    : "Return to your orders, statistics and documents without extra steps.";
}

export function GuestStage({ defaultMode = "login" }) {
  const [mode, setMode] = useState(() => defaultMode);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  useEffect(() => {
    setMode(defaultMode);
  }, [defaultMode]);

  return (
    <section className="guestStage pageStack" data-auth-mode={mode}>
      <div className="guestIntro">
        <p className="sectionEyebrow">DocTra</p>
        <h1>{getGuestTitle(mode)}</h1>
        <p>{getGuestText(mode)}</p>
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
          <h2>{mode === "login" ? "Sign in to continue" : "Create your workspace"}</h2>
          <p>
            {mode === "login"
              ? "Use your email and password to get back into your workspace."
              : "Start with a free account and switch to a paid plan later if needed."}
          </p>
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

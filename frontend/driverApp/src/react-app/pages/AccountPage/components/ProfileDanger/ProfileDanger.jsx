import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { useI18n } from "@shared/app/i18n/useI18n.js";
import {
  useDeleteMeMutation,
  useLogoutMutation,
} from "@shared/features/auth/authApi.js";
import { clearSession } from "@shared/features/auth/authSlice.js";
import { clearSession as clearStoredSession } from "@shared/features/auth/authStorage.js";
import { clearContractDraft } from "../../../../features/contract/contractStorage.js";
import { clearGenerationSession } from "../../../../features/contract/generationSessionStorage.js";
import "./ProfileDanger.css";

export function ProfileDanger({ showHeader = true, bare = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [logout] = useLogoutMutation();
  const [deleteMe, { isLoading: isDeleting }] = useDeleteMeMutation();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleLogout() {
    // Спочатку намагаємося вийти, а потім чистимо локальну сесію.
    try {
      await logout().unwrap();
    } catch {
      // Помилку виходу не показуємо.
    }

    clearStoredSession();
    clearContractDraft();
    clearGenerationSession();
    dispatch(clearSession());
    navigate('/', { replace: true });
    setMessage(t('common.backToHome'));
  }

  async function handleDelete() {
    // Видаляємо акаунт і одразу скидаємо локальний стан.
    if (!window.confirm(t('account.sessionCopy'))) return;

    setMessage("");
    setError("");

    try {
      await deleteMe().unwrap();
      clearStoredSession();
      clearContractDraft();
      clearGenerationSession();
      dispatch(clearSession());
      navigate('/', { replace: true });
      setMessage(t('account.notLoggedIn'));
    } catch {
      setError(t('common.failed'));
    }
  }

  return (
    <section className={` profileDanger${bare ? " profileDanger--bare" : ""}`}>
      {showHeader ? (
        <div className="compactHeader">
          <h2>{t('account.session')}</h2>
          <p>{t('account.sessionCopy')}</p>
        </div>
      ) : null}

      <div className="profileDanger-actions">
        <button
          className="profileDanger-button"
          type="button"
          onClick={handleLogout}
        >
          {t('account.logout')}
        </button>

        <button
          className="profileDanger-button profileDanger-button--danger"
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? t('common.deleting') : t('account.deleteAccount')}
        </button>
      </div>

      {message ? <p className="profileDanger-message">{message}</p> : null}
      {error ? <p className="profileDanger-error">{error}</p> : null}
    </section>
  );
}

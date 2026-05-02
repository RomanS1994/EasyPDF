import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  useDeleteMeMutation,
  useLogoutMutation,
} from "../../../../features/auth/authApi.js";
import { clearSession } from "../../../../features/auth/authSlice.js";
import { clearSession as clearStoredSession } from "../../../../features/auth/authStorage.js";
import { clearContractDraft } from "../../../../features/contract/contractStorage.js";
import { clearGenerationSession } from "../../../../features/contract/generationSessionStorage.js";
import "./ProfileDanger.css";

export function ProfileDanger({ showHeader = true, bare = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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
    navigate('/cz/pdf', { replace: true });
    setMessage("Signed out.");
  }

  async function handleDelete() {
    // Видаляємо акаунт і одразу скидаємо локальний стан.
    if (!window.confirm("Видалити акаунт?")) return;

    setMessage("");
    setError("");

    try {
      await deleteMe().unwrap();
      clearStoredSession();
      clearContractDraft();
      clearGenerationSession();
      dispatch(clearSession());
      navigate('/cz/pdf', { replace: true });
      setMessage("Account deleted.");
    } catch {
      setError("Failed to delete account.");
    }
  }

  return (
    <section className={` profileDanger${bare ? " profileDanger--bare" : ""}`}>
      {showHeader ? (
        <div className="compactHeader">
          <h2>Session</h2>
          <p>Use logout or delete if you need to reset the current account.</p>
        </div>
      ) : null}

      <div className="profileDanger-actions">
        <button
          className="profileDanger-button"
          type="button"
          onClick={handleLogout}
        >
          Logout
        </button>

        <button
          className="profileDanger-button profileDanger-button--danger"
          type="button"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete account"}
        </button>
      </div>

      {message ? <p className="profileDanger-message">{message}</p> : null}
      {error ? <p className="profileDanger-error">{error}</p> : null}
    </section>
  );
}

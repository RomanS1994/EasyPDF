import { useState } from 'react';
import { Link } from 'react-router-dom';

import './SettingsAccountSummary.css';

function getInitial(user) {
  // Показуємо першу букву для компактної аватарки.
  const value = user?.name || user?.email || 'D';
  return String(value).trim().charAt(0).toUpperCase() || 'D';
}

export function SettingsAccountSummary({ user }) {
  const [imageFailed, setImageFailed] = useState(false);
  const avatarUrl = user?.profile?.avatarUrl || user?.profile?.avatar || user?.avatarUrl || '';
  const hasAvatar = Boolean(avatarUrl);

  if (!user) {
    return (
      <section className="screenCard settingsAccountSummary">
        <div className="compactHeader">
          <h2>Current user</h2>
          <p>Not logged in.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="screenCard settingsAccountSummary">
      <div className="compactHeader">
        <h2>Current user</h2>
        <p>Open the account screen for the full profile editor.</p>
      </div>

      <Link className="settingsAccountSummary-link" to="/cz/pdf/account">
        <span className="settingsAccountSummary-avatar" aria-hidden="true">
          {hasAvatar && !imageFailed ? (
            <img
              className="settingsAccountSummary-image"
              src={avatarUrl}
              alt=""
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span className="settingsAccountSummary-fallback">{getInitial(user)}</span>
          )}
        </span>

        <span className="settingsAccountSummary-copy">
          <strong>{user.name || 'Unknown'}</strong>
          <span>{user.email || '-'}</span>
          <span>Role: {user.role || '-'}</span>
        </span>

        <span className="settingsAccountSummary-chevron" aria-hidden="true">
          →
        </span>
      </Link>
    </section>
  );
}

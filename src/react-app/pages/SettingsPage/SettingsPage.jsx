import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/authSlice.js';
import './SettingsPage.css';

export function SettingsPage() {
  const user = useSelector(selectUser);

  return (
    <section className="settingsPage">
      <div className="settingsPage-header">
        <h2 className="settingsPage-title">Settings</h2>
        <p className="settingsPage-copy">Simple React settings page.</p>
      </div>

      <div className="settingsPage-card">
        <h3 className="settingsPage-cardTitle">Current user</h3>
        {user ? (
          <>
            <p className="settingsPage-line">
              <strong>Name:</strong> {user.name || 'Unknown'}
            </p>
            <p className="settingsPage-line">
              <strong>Email:</strong> {user.email || '-'}
            </p>
            <p className="settingsPage-line">
              <strong>Role:</strong> {user.role || '-'}
            </p>
          </>
        ) : (
          <p className="settingsPage-line">Not logged in.</p>
        )}
      </div>

      <div className="settingsPage-card">
        <h3 className="settingsPage-cardTitle">App settings</h3>
        <p className="settingsPage-line">Settings migration will be added later.</p>
      </div>
    </section>
  );
}

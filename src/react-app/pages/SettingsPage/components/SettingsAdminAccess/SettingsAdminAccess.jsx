import { Link } from 'react-router-dom';

import './SettingsAdminAccess.css';

export function SettingsAdminAccess() {
  return (
    <section className="screenCard settingsAdminAccess">
      <div className="compactHeader">
        <h2>Admin workspace</h2>
        <p>Manage accounts, subscriptions, plans and audit logs.</p>
      </div>

      <Link className="settingsAdminAccess-link" to="/cz/pdf/admin/accounts">
        Open admin workspace
      </Link>
    </section>
  );
}

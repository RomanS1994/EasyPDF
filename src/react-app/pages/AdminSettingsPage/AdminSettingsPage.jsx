import { Link } from 'react-router-dom';

import './AdminSettingsPage.css';

export function AdminSettingsPage() {
  return (
    <section className="adminSettingsPage">
      <div className="adminSettingsPage-header">
        <h2 className="adminSettingsPage-title">Admin settings</h2>
        <p className="adminSettingsPage-copy">Simple admin settings area.</p>
      </div>

      <div className="adminSettingsPage-grid">
        <Link className="adminSettingsPage-link" to="/cz/pdf/admin/settings/language">
          Language
        </Link>
        <Link className="adminSettingsPage-link" to="/cz/pdf/admin/settings/plans">
          Plans
        </Link>
        <Link className="adminSettingsPage-link" to="/cz/pdf/admin/settings/audit">
          Audit
        </Link>
      </div>
    </section>
  );
}

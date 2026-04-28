import { Link } from 'react-router-dom';

import './AdminPage.css';

export function AdminPage() {
  return (
    <section className="adminPage">
      <div className="adminPage-header">
        <h2 className="adminPage-title">Admin</h2>
        <p className="adminPage-copy">Simple React admin area.</p>
      </div>

      <div className="adminPage-grid">
        <Link className="adminPage-link" to="/cz/pdf/admin/accounts">
          Accounts
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/subscriptions">
          Subscriptions
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/orders">
          Orders
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/settings">
          Settings
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/settings/plans">
          Plans
        </Link>
        <Link className="adminPage-link" to="/cz/pdf/admin/settings/audit">
          Audit
        </Link>
      </div>
    </section>
  );
}

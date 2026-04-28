import { ManagerPlansPanel } from '../../features/manager/components/ManagerPlansPanel/ManagerPlansPanel.jsx';
import './AdminPlansPage.css';

export function AdminPlansPage() {
  return (
    <section className="adminPlansPage">
      <div className="adminPlansPage-header">
        <h2 className="adminPlansPage-title">Plans</h2>
        <p className="adminPlansPage-copy">Manage subscription plans.</p>
      </div>

      <ManagerPlansPanel />
    </section>
  );
}

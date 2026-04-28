import { ManagerAuditPanel } from '../../features/manager/components/ManagerAuditPanel/ManagerAuditPanel.jsx';
import './AdminAuditPage.css';

export function AdminAuditPage() {
  return (
    <section className="adminAuditPage">
      <div className="adminAuditPage-header">
        <h2 className="adminAuditPage-title">Audit</h2>
        <p className="adminAuditPage-copy">Review admin audit logs.</p>
      </div>

      <ManagerAuditPanel />
    </section>
  );
}

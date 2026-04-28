import { useGetAuditLogsQuery } from '../../managerApi.js';
import './ManagerAuditPanel.css';

export function ManagerAuditPanel() {
  const { data, isLoading, isError } = useGetAuditLogsQuery();
  const auditLogs = data?.audit || [];

  if (isLoading) {
    return (
      <section className="managerAuditPanel">
        <p className="managerAuditPanel-state">Loading audit logs...</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="managerAuditPanel">
        <p className="managerAuditPanel-state">Failed to load audit logs.</p>
      </section>
    );
  }

  if (!auditLogs.length) {
    return (
      <section className="managerAuditPanel">
        <p className="managerAuditPanel-state">No audit logs found.</p>
      </section>
    );
  }

  return (
    <section className="managerAuditPanel">
      <ul className="managerAuditPanel-list">
        {auditLogs.map(log => (
          <li className="managerAuditPanel-item" key={log.id}>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">Action</span>
              <span className="managerAuditPanel-value">{log.action || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">Actor user ID</span>
              <span className="managerAuditPanel-value">{log.actorUserId || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">Target user ID</span>
              <span className="managerAuditPanel-value">{log.targetUserId || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">Entity type</span>
              <span className="managerAuditPanel-value">{log.entityType || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">Entity ID</span>
              <span className="managerAuditPanel-value">{log.entityId || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">Created</span>
              <span className="managerAuditPanel-value">{log.createdAt || '-'}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

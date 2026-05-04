import { useI18n } from '../../../../app/i18n/useI18n.js';
import { useGetAuditLogsQuery } from '../../managerApi.js';
import './ManagerAuditPanel.css';

export function ManagerAuditPanel() {
  const { t } = useI18n();
  const { data, isLoading, isError } = useGetAuditLogsQuery();
  const auditLogs = data?.audit || [];

  if (isLoading) {
    return (
      <section className="managerAuditPanel">
        <p className="managerAuditPanel-state">{t('manager.loadingAudit')}</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className="managerAuditPanel">
        <p className="managerAuditPanel-state">{t('manager.failedAudit')}</p>
      </section>
    );
  }

  if (!auditLogs.length) {
    return (
      <section className="managerAuditPanel">
        <p className="managerAuditPanel-state">{t('manager.noAudit')}</p>
      </section>
    );
  }

  return (
    <section className="managerAuditPanel">
      <ul className="managerAuditPanel-list">
        {auditLogs.map(log => (
          <li className="managerAuditPanel-item" key={log.id}>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">{t('manager.action')}</span>
              <span className="managerAuditPanel-value">{log.action || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">{t('manager.actorUserId')}</span>
              <span className="managerAuditPanel-value">{log.actorUserId || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">{t('manager.targetUserId')}</span>
              <span className="managerAuditPanel-value">{log.targetUserId || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">{t('manager.entityType')}</span>
              <span className="managerAuditPanel-value">{log.entityType || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">{t('manager.entityId')}</span>
              <span className="managerAuditPanel-value">{log.entityId || '-'}</span>
            </div>
            <div className="managerAuditPanel-row">
              <span className="managerAuditPanel-label">{t('common.created')}</span>
              <span className="managerAuditPanel-value">{log.createdAt || '-'}</span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

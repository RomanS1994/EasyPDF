import { useI18n } from '../../../../app/i18n/useI18n.js';
import './ManagerUsersList.css';

export function ManagerUsersList({ users, selectedUserId, onSelect }) {
  const { t } = useI18n();
  return (
    <ul className="managerUsersList">
      {users.map(user => (
        <li className="managerUsersList-item" key={user.id}>
          <button
          className={`managerUsersList-button ${selectedUserId === user.id ? 'is-active' : ''}`}
          type="button"
          onClick={() => onSelect(user.id)}
        >
            <span className="managerUsersList-name">{user.name || t('common.unknownUser')}</span>
            <span className="managerUsersList-email">{user.email || '-'}</span>
            <span className="managerUsersList-role">{user.role || '-'}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

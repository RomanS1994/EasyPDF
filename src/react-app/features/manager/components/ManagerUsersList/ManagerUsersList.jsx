import './ManagerUsersList.css';

export function ManagerUsersList({ users, selectedUserId, onSelect }) {
  return (
    <ul className="managerUsersList">
      {users.map(user => (
        <li className="managerUsersList-item" key={user.id}>
          <button
            className={`managerUsersList-button ${selectedUserId === user.id ? 'is-active' : ''}`}
            type="button"
            onClick={() => onSelect(user.id)}
          >
            <span className="managerUsersList-name">{user.name || 'Unknown user'}</span>
            <span className="managerUsersList-email">{user.email || '-'}</span>
            <span className="managerUsersList-role">{user.role || '-'}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

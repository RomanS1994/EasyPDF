import { useState } from 'react';

import { useI18n } from '@shared/app/i18n/useI18n.js';
import './AdminUsersList.css';

function getAvatarUrl(user) {
  return user?.profile?.avatarUrl || user?.profile?.avatar || user?.avatarUrl || '';
}

function getInitials(user) {
  const source = user?.name || user?.email || '';
  const parts = source.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return '?';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 1).toUpperCase();
  }

  return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}

function hashString(value) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }

  return Math.abs(hash);
}

function getAvatarImage(user) {
  const avatarUrl = getAvatarUrl(user);
  if (avatarUrl) {
    return avatarUrl;
  }

  const initials = getInitials(user);
  const seed = user?.name || user?.email || 'user';
  const background = '#dcfce7';
  const foreground = '#047857';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${seed}">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="#f0fdf4" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="12" fill="url(#bg)" />
      <circle cx="32" cy="32" r="31" fill="rgba(255,255,255,0.18)" />
      <text
        x="32"
        y="38"
        text-anchor="middle"
        font-family="Inter, Arial, sans-serif"
        font-size="22"
        font-weight="800"
        fill="${foreground}"
      >${initials}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function AdminUserAvatar({ user }) {
  const [hasError, setHasError] = useState(false);
  const initials = getInitials(user);
  const avatarUrl = getAvatarUrl(user);

  if (hasError) {
    return <span className="adminUsersList-avatarFallback">{initials}</span>;
  }

  return (
    <img
      className="adminUsersList-avatarImage"
      src={avatarUrl || getAvatarImage(user)}
      alt=""
      onError={() => setHasError(true)}
    />
  );
}

export function AdminUsersList({ users, activeUserId = '', onOpenUser }) {
  const { t } = useI18n();
  return (
    <ul className="adminUsersList">
      {users.map(user => (
        <li className="adminUsersList-item" key={user.id}>
          <button
            className={`adminUsersList-button ${activeUserId === user.id ? 'is-active' : ''}`}
            type="button"
            onClick={() => onOpenUser(user.id)}
          >
            <div className="adminUsersList-topRow">
              <span className="adminUsersList-nameWrap">
                <span className="adminUsersList-avatar" aria-hidden="true">
                  <AdminUserAvatar user={user} />
                </span>
                <span className="adminUsersList-name">{user.name || t('common.unknownUser')}</span>
              </span>
              <span className={`adminUsersList-role adminUsersList-role--${user.role || 'unknown'}`}>
                {user.role || '-'}
              </span>
            </div>
            <span className="adminUsersList-email">{user.email || '-'}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

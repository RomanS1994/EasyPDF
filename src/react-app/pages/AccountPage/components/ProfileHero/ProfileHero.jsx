import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useI18n } from '../../../../app/i18n/useI18n.js';
import { useUpdateProfileMutation } from '../../../../features/auth/authApi.js';
import { selectToken, setSession } from '../../../../features/auth/authSlice.js';
import { saveSession } from '../../../../features/auth/authStorage.js';
import './ProfileHero.css';

function getInitial(user) {
  // Беремо першу букву для простої аватарки.
  const value = user?.name || user?.email || 'D';
  return String(value).trim().charAt(0).toUpperCase() || 'D';
}

function getDisplayName(user, t) {
  // Показуємо коротке ім'я для профілю.
  return user?.name || t('common.unknownUser');
}

function getDisplayEmail(user) {
  // Підставляємо email, якщо ім'я ще не заповнене.
  return user?.email || '-';
}

function readFileAsDataUrl(file) {
  // Читаємо файл як data URL без зайвих перетворень.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

export function ProfileHero({ user }) {
  const dispatch = useDispatch();
  const token = useSelector(selectToken);
  const { t } = useI18n();
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const avatarUrl = user?.profile?.avatarUrl || '';
  const hasAvatar = Boolean(avatarUrl);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    // Скидаємо помилку картинки після зміни аватара.
    setImageFailed(false);
  }, [avatarUrl]);

  function handlePickPhoto() {
    // Відкриваємо вибір файлу одним натисканням.
    fileInputRef.current?.click();
  }

  function handleImageError() {
    // Якщо картинка не завантажилась, показуємо ініціал.
    setImageFailed(true);
  }

  async function handleAvatarChange(event) {
    // Завантажуємо нове фото профілю.
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!file) return;

    setMessage('');
    setError('');

    if (!file.type.startsWith('image/')) {
      setError(t('account.chooseImage'));
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const updatedUser = await updateProfile({ avatarUrl: dataUrl }).unwrap();
      saveSession(token, updatedUser);
      dispatch(setSession({ token, user: updatedUser }));
      setImageFailed(false);
      setMessage(t('account.photoSaved'));
    } catch {
      setError(t('account.photoRemoved'));
    }
  }

  async function handleRemovePhoto() {
    // Видаляємо фото й повертаємо просту аватарку.
    setMessage('');
    setError('');

    try {
      const updatedUser = await updateProfile({ avatarUrl: '' }).unwrap();
      saveSession(token, updatedUser);
      dispatch(setSession({ token, user: updatedUser }));
      setImageFailed(false);
      setMessage(t('account.photoRemoved'));
    } catch {
      setError(t('account.photoRemoved'));
    }
  }

  return (
    <section className="screenCard profileHero">
      <div className="profileHero-main">
        <button
          className="profileHero-avatarButton"
          type="button"
          onClick={handlePickPhoto}
          aria-label={t('account.changePhoto')}
        >
          <span className="profileHero-avatarFrame" aria-hidden="true">
            {hasAvatar && !imageFailed ? (
              <img
                className="profileHero-avatarImage"
                src={avatarUrl}
                alt=""
                onError={handleImageError}
              />
            ) : (
              <span className="profileHero-avatarFallback">{getInitial(user)}</span>
            )}
          </span>
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={handleAvatarChange}
        />

        <div className="profileHero-copy">
          <strong>{getDisplayName(user, t)}</strong>
          <p>{getDisplayEmail(user)}</p>
          <p className="statusNote">
            {t('account.photoHint')}
          </p>

          <div className="profileHero-actions">
            <button
              className="profileHero-action"
              type="button"
              onClick={handlePickPhoto}
              disabled={isLoading}
            >
              {t('account.changePhoto')}
            </button>

            {hasAvatar ? (
              <button
                className="profileHero-action"
                type="button"
                onClick={handleRemovePhoto}
                disabled={isLoading}
              >
                {t('account.removePhoto')}
              </button>
            ) : null}
          </div>

          {message ? <p className="profileHero-message">{message}</p> : null}
          {error ? <p className="profileHero-error">{error}</p> : null}
        </div>
      </div>
    </section>
  );
}

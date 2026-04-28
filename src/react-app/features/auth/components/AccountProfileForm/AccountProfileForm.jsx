import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useUpdateProfileMutation } from '../../authApi.js';
import { selectToken, selectUser, setSession } from '../../authSlice.js';
import { saveSession } from '../../authStorage.js';
import './AccountProfileForm.css';

export function AccountProfileForm() {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const token = useSelector(selectToken);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setName(user?.name || '');
  }, [user]);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const updatedUser = await updateProfile({ name }).unwrap();
      saveSession(token, updatedUser);
      dispatch(setSession({ token, user: updatedUser }));
      setMessage('Profile saved.');
    } catch {
      setError('Failed to save profile.');
    }
  }

  return (
    <form className="accountProfileForm" onSubmit={handleSubmit}>
      <h3 className="accountProfileForm-title">Account profile</h3>

      <label className="accountProfileForm-field">
        <span>Name</span>
        <input
          type="text"
          value={name}
          onChange={event => setName(event.target.value)}
        />
      </label>

      {message ? <p className="accountProfileForm-message">{message}</p> : null}
      {error ? <p className="accountProfileForm-error">{error}</p> : null}

      <button className="accountProfileForm-button" type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save profile'}
      </button>
    </form>
  );
}

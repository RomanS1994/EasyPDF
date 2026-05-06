import { useEffect, useState } from 'react';

import './PasswordField.css';

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M4 4l16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M3.5 12s3.6-6 8.5-6c1.6 0 3 .4 4.2 1.1M20.5 12s-3.6 6-8.5 6c-1.6 0-3-.4-4.2-1.1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9.5A3 3 0 0 1 14.5 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PasswordField({
  label,
  value,
  onChange,
  onInput,
  autoComplete = 'current-password',
  name = 'password',
  showPasswordLabel = 'Show password',
  hidePasswordLabel = 'Hide password',
}) {
  const [isVisible, setIsVisible] = useState(false);
  const hasValue = String(value || '').trim().length > 0;

  useEffect(() => {
    if (!hasValue && isVisible) {
      setIsVisible(false);
    }
  }, [hasValue, isVisible]);

  return (
    <div className="passwordField">
      <span className="passwordField-label">{label}</span>
      <div className="passwordField-control">
        <input
          name={name}
          autoComplete={autoComplete}
          spellCheck={false}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onInput={onInput}
        />
        {hasValue ? (
          <button
            className="passwordField-toggle"
            type="button"
            aria-label={isVisible ? hidePasswordLabel : showPasswordLabel}
            aria-pressed={isVisible}
            onClick={() => setIsVisible(next => !next)}
          >
            {isVisible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        ) : null}
      </div>
    </div>
  );
}

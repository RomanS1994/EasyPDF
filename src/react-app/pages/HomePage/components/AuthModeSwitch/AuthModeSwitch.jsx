import './AuthModeSwitch.css';

export function AuthModeSwitch({ value, onChange }) {
  return (
    <div className="authModeSwitch" role="tablist" aria-label="Auth mode">
      <button
        className={`authModeSwitch-btn ${value === 'login' ? 'is-active' : ''}`}
        type="button"
        role="tab"
        aria-selected={value === 'login'}
        onClick={() => onChange('login')}
      >
        Login
      </button>
      <button
        className={`authModeSwitch-btn ${value === 'register' ? 'is-active' : ''}`}
        type="button"
        role="tab"
        aria-selected={value === 'register'}
        onClick={() => onChange('register')}
      >
        Register
      </button>
    </div>
  );
}

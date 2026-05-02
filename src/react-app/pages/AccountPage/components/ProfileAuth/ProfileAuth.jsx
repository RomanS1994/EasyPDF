import './ProfileAuth.css';

export function ProfileAuth({ children }) {
  return (
    <section className="screenCard profileAuth">
      <div className="compactHeader">
        <h2>Sign in</h2>
        <p>Log in or create an account to unlock the workspace and profile tools.</p>
      </div>

      <div className="profileAuthForms">{children}</div>
    </section>
  );
}

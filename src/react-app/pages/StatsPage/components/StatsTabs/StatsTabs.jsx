import './StatsTabs.css';

export function StatsTabs({ value, onChange }) {
  return (
    <div className="statsTabs" role="tablist" aria-label="Statistics views">
      <button
        className={`statsTab ${value === 'usage' ? 'is-active' : ''}`}
        type="button"
        onClick={() => onChange('usage')}
      >
        Usage
      </button>
      <button
        className={`statsTab ${value === 'salary' ? 'is-active' : ''}`}
        type="button"
        onClick={() => onChange('salary')}
      >
        Salary
      </button>
      <button
        className={`statsTab ${value === 'activity' ? 'is-active' : ''}`}
        type="button"
        onClick={() => onChange('activity')}
      >
        Activity
      </button>
    </div>
  );
}

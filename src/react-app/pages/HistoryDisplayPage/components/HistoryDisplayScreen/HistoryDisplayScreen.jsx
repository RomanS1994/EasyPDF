import './HistoryDisplayScreen.css';

const TEXT_SIZES = {
  compact: 'historyDisplayScreen-name--compact',
  small: 'historyDisplayScreen-name--small',
  medium: 'historyDisplayScreen-name--medium',
  large: 'historyDisplayScreen-name--large',
  huge: 'historyDisplayScreen-name--huge',
};

function HistoryDisplayScreen({
  customerName,
  isLoading,
  isError,
  themeId,
  themeOptions,
  textSize,
  textSizeOptions,
  onThemeChange,
  onTextSizeChange,
  onBack,
}) {
  return (
    <div className="historyDisplayScreen">
      <header className="historyDisplayScreen-top">
        <button className="historyDisplayScreen-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          <span>Back</span>
        </button>

        <div className="historyDisplayScreen-controls">
          <div className="historyDisplayScreen-control">
            <span className="historyDisplayScreen-controlLabel">Text</span>
            <label className="historyDisplayScreen-selectShell">
              <span className="historyDisplayScreen-selectIcon" aria-hidden="true">
                Aa
              </span>
              <select
                className="historyDisplayScreen-select"
                aria-label="Text size"
                value={textSize}
                onChange={event => onTextSizeChange(event.target.value)}
              >
                {textSizeOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="historyDisplayScreen-control">
            <span className="historyDisplayScreen-controlLabel">Bg</span>
            <label className="historyDisplayScreen-selectShell">
              <span className="historyDisplayScreen-selectSwatch" style={{ '--swatch-color': themeOptions.find(option => option.id === themeId)?.swatch || '#eef3ff' }} aria-hidden="true" />
              <select
                className="historyDisplayScreen-select"
                aria-label="Background preset"
                value={themeId}
                onChange={event => onThemeChange(event.target.value)}
              >
                {themeOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="historyDisplayScreen-body">
        {isLoading ? <p className="historyDisplayScreen-state">Loading order...</p> : null}
        {isError ? <p className="historyDisplayScreen-state">Failed to load order.</p> : null}

        {!isLoading && !isError ? (
          <div className="historyDisplayScreen-copy">
            <h1 className={`historyDisplayScreen-name ${TEXT_SIZES[textSize]}`}>{customerName}</h1>
          </div>
        ) : null}
      </main>
    </div>
  );
}

export { HistoryDisplayScreen };

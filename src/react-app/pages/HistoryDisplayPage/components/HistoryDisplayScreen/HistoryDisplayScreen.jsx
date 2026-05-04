import { useI18n } from '../../../../app/i18n/useI18n.js';
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
  const { t } = useI18n();
  return (
    <div className="historyDisplayScreen">
      <header className="historyDisplayScreen-top">
        <button className="historyDisplayScreen-back" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span>
          <span>{t('history.back')}</span>
        </button>

        <div className="historyDisplayScreen-controls">
          <div className="historyDisplayScreen-control">
            <span className="historyDisplayScreen-controlLabel">{t('history.text')}</span>
            <label className="historyDisplayScreen-selectShell">
              <span className="historyDisplayScreen-selectIcon" aria-hidden="true">
                Aa
              </span>
              <select
                className="historyDisplayScreen-select"
                aria-label={t('history.text')}
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
            <span className="historyDisplayScreen-controlLabel">{t('history.background')}</span>
            <label className="historyDisplayScreen-selectShell">
              <span className="historyDisplayScreen-selectSwatch" style={{ '--swatch-color': themeOptions.find(option => option.id === themeId)?.swatch || '#eef3ff' }} aria-hidden="true" />
              <select
                className="historyDisplayScreen-select"
                aria-label={t('history.background')}
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
        {isLoading ? <p className="historyDisplayScreen-state">{t('history.loadingOrder')}</p> : null}
        {isError ? <p className="historyDisplayScreen-state">{t('history.failedToLoadOrder')}</p> : null}

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

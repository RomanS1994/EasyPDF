import './GenerationGateModal.css';

export function GenerationGateModal({
  isOpen,
  isBusy = false,
  onClose,
  onConfirm,
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="generationGateModal" role="presentation">
      <div className="generationGateBackdrop" onClick={onClose} />

      <div
        className="generationGateSheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="generationGateTitle"
      >
        <div className="generationGateHeader">
          <div className="generationGateHeading">
            <span className="generationTokenBadge">
              <span className="generationTokenBadgeIcon" aria-hidden="true" />
              <span>Tokens</span>
            </span>
            <h2 id="generationGateTitle">10 minutes to finish the order</h2>
            <p>1 token will be used. After confirmation the order form opens.</p>
          </div>

          <button
            className="generationGateCloseBtn"
            type="button"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="generationGateStats">
          <article className="generationGateStat">
            <span>Token cost</span>
            <strong className="generationGateTokenValue">
              <span className="generationGateTokenValueIcon" aria-hidden="true" />
              <span>1T</span>
            </strong>
          </article>

          <article className="generationGateStat">
            <span>Window</span>
            <strong>10 minutes</strong>
          </article>
        </div>

        <p className="generationGateHint">
          Confirm once to start the token session and open the form.
        </p>

        <div className="generationGateActions">
          <button
            className="generationGateConfirmBtn"
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
          >
            {isBusy ? 'Starting...' : 'Start order'}
          </button>

          <button
            className="generationGateLaterBtn"
            type="button"
            onClick={onClose}
            disabled={isBusy}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}

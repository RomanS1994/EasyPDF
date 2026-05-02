import { useEffect, useMemo, useState } from 'react';

import { getGenerationWindowMs } from '../../generationSessionSlice.js';
import './GenerationSessionBanner.css';

function formatCountdown(remainingMs) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getRemainingMs(expiresAt) {
  const expiresTime = Date.parse(expiresAt || '');
  if (!Number.isFinite(expiresTime)) {
    return 0;
  }

  return Math.max(0, expiresTime - Date.now());
}

export function GenerationSessionBanner({ session, onExpired }) {
  const [remainingMs, setRemainingMs] = useState(() => getRemainingMs(session?.expiresAt));

  useEffect(() => {
    setRemainingMs(getRemainingMs(session?.expiresAt));
  }, [session?.expiresAt]);

  useEffect(() => {
    if (!session?.expiresAt) {
      return undefined;
    }

    const timerId = window.setInterval(() => {
      const nextRemaining = getRemainingMs(session.expiresAt);
      setRemainingMs(nextRemaining);

      if (nextRemaining <= 0) {
        window.clearInterval(timerId);
        onExpired();
      }
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [onExpired, session?.expiresAt]);

  const progress = useMemo(() => {
    const windowMs = getGenerationWindowMs();
    if (!windowMs) {
      return 0;
    }

    return Math.max(0, Math.min(1, remainingMs / windowMs));
  }, [remainingMs]);

  return (
    <section className="generationSessionBanner">
      <div className="generationSessionBannerCopy">
        <p className="sectionEyebrow">Order</p>
        <h2>{session?.orderId ? 'Order reserved' : 'Token session active'}</h2>
        <p>
          {session?.orderId
            ? 'You have 10 minutes to finish this order.'
            : 'You have 10 minutes to fill in the order details.'}
        </p>
      </div>

      <div
        className="generationSessionTimer"
        aria-hidden="true"
        style={{ '--countdown-progress': `${progress * 100}%` }}
      >
        <div className="generationSessionCountdownValue">
          {formatCountdown(remainingMs)}
        </div>
      </div>
    </section>
  );
}

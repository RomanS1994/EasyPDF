const DEFAULT_REVOKE_DELAY_MS = 30000;

function isMobileWebKit() {
  if (typeof navigator === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const touchPoints = navigator.maxTouchPoints || 0;
  const isAppleMobileDevice = /iPad|iPhone|iPod/.test(platform) || (/Macintosh/.test(ua) && touchPoints > 1);
  const isWebKit = /AppleWebKit/.test(ua) && !/(CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium)/.test(ua);

  return isAppleMobileDevice && isWebKit;
}

export function prepareDownloadTarget() {
  if (!isMobileWebKit() || typeof window === 'undefined') {
    return null;
  }

  const targetWindow = window.open('', '_blank');

  if (targetWindow?.document) {
    targetWindow.document.write('<title>Preparing PDF</title><p>Preparing PDF...</p>');
    targetWindow.document.close();
  }

  return targetWindow || null;
}

export function downloadBlobFile(
  blob,
  fileName,
  { revokeDelayMs = DEFAULT_REVOKE_DELAY_MS, targetWindow = null } = {}
) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('File downloads are not available in this environment');
  }

  const blobUrl = URL.createObjectURL(blob);
  const safeFileName = fileName || 'download.pdf';

  try {
    if (targetWindow && !targetWindow.closed) {
      try {
        targetWindow.location.replace(blobUrl);
        targetWindow.focus?.();
        return;
      } catch {
        try {
          targetWindow.close();
        } catch {
          // Ignore window cleanup failures.
        }
      }
    }

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFileName;
    link.rel = 'noopener';
    link.style.display = 'none';

    document.body.appendChild(link);

    try {
      link.click();
    } finally {
      link.remove();
    }
  } finally {
    // Keep the blob alive long enough for mobile WebKit to finish handing it off.
    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, revokeDelayMs);
  }
}

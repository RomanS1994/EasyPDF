const DEFAULT_REVOKE_DELAY_MS = 30000;

export function downloadBlobFile(blob, fileName, { revokeDelayMs = DEFAULT_REVOKE_DELAY_MS } = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('File downloads are not available in this environment');
  }

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeFileName = fileName || 'download.pdf';

  link.href = blobUrl;
  link.download = safeFileName;
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();

    // Keep the blob alive long enough for mobile WebKit to finish handing it off.
    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, revokeDelayMs);
  }
}

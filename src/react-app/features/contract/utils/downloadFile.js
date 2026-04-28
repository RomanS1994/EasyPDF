export function downloadFile(blob, fileName = 'contract.pdf') {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    throw new Error('Downloads are not available in this environment');
  }

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = blobUrl;
  link.download = fileName;
  link.rel = 'noopener';
  link.style.display = 'none';

  document.body.appendChild(link);

  try {
    link.click();
  } finally {
    link.remove();
    window.setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 30000);
  }
}

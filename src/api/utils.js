export async function readJsonResponse(response, fallbackMessage) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.error || fallbackMessage);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

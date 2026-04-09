import { fetchApi } from '../settings.js';
import { readJsonResponse } from '../utils.js';

export async function API_getPlans() {
  const response = await fetchApi('/plans', {
    method: 'GET',
  });

  return readJsonResponse(response, 'Не вдалося завантажити плани');
}

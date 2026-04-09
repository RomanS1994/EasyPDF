import { fetchApi } from '../settings.js';
import { readJsonResponse } from '../utils.js';
import { t } from '../../js/i18n/app.js';

export async function API_getPlans() {
  const response = await fetchApi('/plans', {
    method: 'GET',
  });

  return readJsonResponse(response, t('api_plans_failed'));
}

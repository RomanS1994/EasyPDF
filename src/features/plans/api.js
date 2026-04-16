import { fetchApi } from '../../shared/api/client.js';
import { readJsonResponse } from '../../shared/api/response.js';
import { t } from '../../shared/i18n/app.js';

export async function getPlans() {
  const response = await fetchApi('/plans', {
    skipAuthRefresh: true,
    showLoader: false,
  });

  return readJsonResponse(response, t('load_plans_failed'));
}

import { normalizeText } from '../validation/common.js';

export function buildDefaultProfile(name = '') {
  const safeName = normalizeText(name);

  return {
    avatarUrl: '',
    driver: {
      name: safeName,
      address: '',
      spz: '',
      ico: '',
    },
    provider: {
      name: safeName,
      address: '',
      ico: '',
    },
  };
}

export function normalizeUserProfile(profile, name = '') {
  const source = profile && typeof profile === 'object' ? profile : {};
  const defaults = buildDefaultProfile(name);
  const driverSource =
    source.driver && typeof source.driver === 'object' ? source.driver : {};
  const providerSource =
    source.provider && typeof source.provider === 'object' ? source.provider : {};

  return {
    avatarUrl: normalizeText(source.avatarUrl || source.avatar || defaults.avatarUrl),
    driver: {
      ...defaults.driver,
      name: normalizeText(driverSource.name || defaults.driver.name),
      address: normalizeText(driverSource.address),
      spz: normalizeText(driverSource.spz),
      ico: normalizeText(driverSource.ico),
    },
    provider: {
      ...defaults.provider,
      name: normalizeText(providerSource.name || defaults.provider.name),
      address: normalizeText(providerSource.address),
      ico: normalizeText(providerSource.ico),
    },
  };
}

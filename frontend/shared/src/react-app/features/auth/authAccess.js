export function hasManagerAccess(user) {
  return user?.role === 'manager' || user?.role === 'admin';
}

export function hasAdminAccess(user) {
  return user?.role === 'admin';
}

export function hasPlatinumTeamAccess(user) {
  const planId = user?.subscription?.planId || user?.planId || user?.subscription?.plan?.id || '';
  const status = user?.subscription?.status || user?.usage?.status || '';

  return planId === 'plan-100' && (!status || status === 'active' || status === 'trial');
}

export function hasManagerAccess(user) {
  return user?.role === 'manager' || user?.role === 'admin';
}

export function hasAdminAccess(user) {
  return user?.role === 'admin';
}

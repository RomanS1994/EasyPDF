import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/authSlice.js';
import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import { GuestStage } from './components/GuestStage/GuestStage.jsx';
import { WorkspaceOverview } from './components/WorkspaceOverview/WorkspaceOverview.jsx';

export function HomePage() {
  const user = useSelector(selectUser);
  const { data } = useGetOrdersQuery(undefined, { skip: !user });
  const orders = data?.orders || [];

  if (!user) {
    return <GuestStage defaultMode="login" />;
  }

  return <WorkspaceOverview user={user} orders={orders} />;
}

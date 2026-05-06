import { useSelector } from 'react-redux';

import { AuthSessionErrorModal } from '../../components/AuthSessionErrorModal/AuthSessionErrorModal.jsx';
import { SubscriptionExpiredNotice } from '../../components/SubscriptionExpiredNotice/SubscriptionExpiredNotice.jsx';
import { BottomTabs } from '../../components/BottomTabs/BottomTabs.jsx';
import { SessionNotice } from '../../components/SessionNotice/SessionNotice.jsx';
import { selectToken, selectUser } from '../../../features/auth/authSlice.js';
import './AppLayout.css';

export function AppLayout({ children }) {
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);
  const showBottomTabs = Boolean(token && user);

  return (
    <div className="appLayout appLayout--workspace">
      <AuthSessionErrorModal />
      <SubscriptionExpiredNotice />
      <SessionNotice />
      <div className="appLayout-workspaceBody">
        <div className="pageContainer">
          <main className="appLayout-main">{children}</main>
        </div>
      </div>

      {showBottomTabs ? <BottomTabs /> : null}
    </div>
  );
}

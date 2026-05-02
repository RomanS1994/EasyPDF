import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import { AuthSessionErrorModal } from '../../components/AuthSessionErrorModal/AuthSessionErrorModal.jsx';
import { BottomTabs } from '../../components/BottomTabs/BottomTabs.jsx';
import { Header } from '../../components/Header/Header.jsx';
import { PageContainer } from '../../components/PageContainer/PageContainer.jsx';
import { SessionNotice } from '../../components/SessionNotice/SessionNotice.jsx';
import { Sidebar } from '../../components/Sidebar/Sidebar.jsx';
import {
  selectSessionErrorType,
  selectToken,
  selectUser,
} from '../../../features/auth/authSlice.js';
import './AppLayout.css';

function isAdminOrManagerRoute(pathname) {
  return pathname.startsWith('/cz/pdf/admin') || pathname.startsWith('/cz/pdf/manager');
}

export function AppLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const token = useSelector(selectToken);
  const user = useSelector(selectUser);
  const sessionErrorType = useSelector(selectSessionErrorType);
  const useDashboardLayout = isAdminOrManagerRoute(location.pathname);
  const showBottomTabs = Boolean(token && user);

  useEffect(() => {
    if (sessionErrorType !== 'offline' || location.pathname === '/cz/pdf/sign-in') {
      return;
    }

    navigate('/cz/pdf/sign-in', { replace: true });
  }, [location.pathname, navigate, sessionErrorType]);

  if (useDashboardLayout) {
    return (
      <div className="appLayout appLayout--dashboard">
        <Header />
        <AuthSessionErrorModal />
        <SessionNotice />

        <div className="appLayout-body">
          <Sidebar />

          <PageContainer>
            <main className="appLayout-main">{children}</main>
          </PageContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="appLayout appLayout--workspace">
      <AuthSessionErrorModal />
      <SessionNotice />
      <div className="appLayout-workspaceBody">
        <PageContainer>
          <main className="appLayout-main">{children}</main>
        </PageContainer>
      </div>

      {showBottomTabs ? <BottomTabs /> : null}
    </div>
  );
}

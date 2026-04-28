import { Header } from '../../components/Header/Header.jsx';
import { PageContainer } from '../../components/PageContainer/PageContainer.jsx';
import { Sidebar } from '../../components/Sidebar/Sidebar.jsx';
import './AppLayout.css';

export function AppLayout({ children }) {
  return (
    <div className="appLayout">
      <Header />

      <div className="appLayout-body">
        <Sidebar />

        <PageContainer>
          <main className="appLayout-main">{children}</main>
        </PageContainer>
      </div>
    </div>
  );
}

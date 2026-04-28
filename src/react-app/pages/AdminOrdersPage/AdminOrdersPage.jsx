import { ManagerOrdersPanel } from '../../features/manager/components/ManagerOrdersPanel/ManagerOrdersPanel.jsx';
import './AdminOrdersPage.css';

export function AdminOrdersPage() {
  return (
    <section className="adminOrdersPage">
      <div className="adminOrdersPage-header">
        <h2 className="adminOrdersPage-title">Orders</h2>
        <p className="adminOrdersPage-copy">Review admin orders.</p>
      </div>

      <ManagerOrdersPanel />
    </section>
  );
}

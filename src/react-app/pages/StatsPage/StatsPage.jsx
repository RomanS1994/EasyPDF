import { useGetOrdersQuery } from '../../features/orders/ordersApi.js';
import './StatsPage.css';

export function StatsPage() {
  const { data, isLoading, isError } = useGetOrdersQuery();
  const orders = data?.orders || [];
  let totalOrders = 0;
  let createdOrders = 0;
  let pendingPdfOrders = 0;
  let pdfGeneratedOrders = 0;
  let pdfFailedOrders = 0;

  for (const order of orders) {
    totalOrders += 1;

    if (order.status === 'created') {
      createdOrders += 1;
    }

    if (order.status === 'pending_pdf') {
      pendingPdfOrders += 1;
    }

    if (order.status === 'pdf_generated') {
      pdfGeneratedOrders += 1;
    }

    if (order.status === 'pdf_failed') {
      pdfFailedOrders += 1;
    }
  }

  return (
    <section className="statsPage">
      <div className="statsPage-header">
        <h2 className="statsPage-title">Stats</h2>
        <p className="statsPage-copy">Simple React stats page.</p>
      </div>

      {isLoading ? <p className="statsPage-state">Loading stats...</p> : null}
      {isError ? <p className="statsPage-state">Failed to load stats.</p> : null}

      {!isLoading && !isError ? (
        <div className="statsPage-grid">
          <article className="statsPage-card">
            <span className="statsPage-label">Total orders</span>
            <strong className="statsPage-value">{totalOrders}</strong>
          </article>
          <article className="statsPage-card">
            <span className="statsPage-label">Created</span>
            <strong className="statsPage-value">{createdOrders}</strong>
          </article>
          <article className="statsPage-card">
            <span className="statsPage-label">Pending PDF</span>
            <strong className="statsPage-value">{pendingPdfOrders}</strong>
          </article>
          <article className="statsPage-card">
            <span className="statsPage-label">PDF generated</span>
            <strong className="statsPage-value">{pdfGeneratedOrders}</strong>
          </article>
          <article className="statsPage-card">
            <span className="statsPage-label">PDF failed</span>
            <strong className="statsPage-value">{pdfFailedOrders}</strong>
          </article>
        </div>
      ) : null}
    </section>
  );
}

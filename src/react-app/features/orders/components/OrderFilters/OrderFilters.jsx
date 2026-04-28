import './OrderFilters.css';

export function OrderFilters({
  searchText,
  statusFilter,
  onSearchChange,
  onStatusChange,
}) {
  return (
    <section className="orderFilters">
      <label className="orderFilters-field">
        <span className="orderFilters-label">Search</span>
        <input
          className="orderFilters-input"
          type="search"
          value={searchText}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Order number or customer name"
        />
      </label>

      <label className="orderFilters-field">
        <span className="orderFilters-label">Status</span>
        <select
          className="orderFilters-select"
          value={statusFilter}
          onChange={event => onStatusChange(event.target.value)}
        >
          <option value="all">All</option>
          <option value="created">Created</option>
          <option value="pending_pdf">Pending PDF</option>
          <option value="pdf_generated">PDF generated</option>
          <option value="pdf_failed">PDF failed</option>
        </select>
      </label>
    </section>
  );
}

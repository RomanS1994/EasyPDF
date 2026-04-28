import { useState } from 'react';

import { useArchiveOrderMutation, useGetOrderQuery } from '../../ordersApi.js';
import './OrderDetails.css';

export function OrderDetails({ orderId, onClose }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [archiveOrder, { isLoading: isArchiving }] = useArchiveOrderMutation();
  const { data, isLoading, isError } = useGetOrderQuery(orderId, {
    skip: !orderId,
  });

  const order = data?.order || data || {};
  const customer = order?.contractData?.customer || order?.customer || {};
  const trip = order?.contractData?.trip || order?.trip || {};
  const fromAddress = trip?.from?.address || '';
  const toAddress = trip?.to?.address || '';

  async function handleArchive() {
    setMessage('');
    setError('');

    if (!window.confirm('Archive this order?')) {
      return;
    }

    try {
      await archiveOrder(orderId).unwrap();
      setMessage('Order archived.');
      window.setTimeout(() => {
        onClose();
      }, 400);
    } catch {
      setError('Failed to archive order.');
    }
  }

  if (!orderId) {
    return null;
  }

  return (
    <section className="orderDetails">
      <div className="orderDetails-header">
        <h3 className="orderDetails-title">Order details</h3>
        <div className="orderDetails-actions">
          <button
            className="orderDetails-archive"
            type="button"
            onClick={handleArchive}
            disabled={isArchiving}
          >
            {isArchiving ? 'Archiving...' : 'Archive order'}
          </button>
          <button className="orderDetails-close" type="button" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {isLoading ? <p className="orderDetails-state">Loading order...</p> : null}
      {isError ? <p className="orderDetails-state">Failed to load order.</p> : null}
      {message ? <p className="orderDetails-message">{message}</p> : null}
      {error ? <p className="orderDetails-error">{error}</p> : null}

      {!isLoading && !isError ? (
        <div className="orderDetails-grid">
          <div className="orderDetails-row">
            <span className="orderDetails-label">Order</span>
            <span className="orderDetails-value">{order.orderNumber || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">Status</span>
            <span className="orderDetails-value">{order.status || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">Total price</span>
            <span className="orderDetails-value">{order.totalPrice || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">Customer name</span>
            <span className="orderDetails-value">{customer.name || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">Customer email</span>
            <span className="orderDetails-value">{customer.email || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">From</span>
            <span className="orderDetails-value">{fromAddress || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">To</span>
            <span className="orderDetails-value">{toAddress || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">Trip time</span>
            <span className="orderDetails-value">{trip.time || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">Payment method</span>
            <span className="orderDetails-value">{trip.paymentMethod || '-'}</span>
          </div>
          <div className="orderDetails-row">
            <span className="orderDetails-label">Created</span>
            <span className="orderDetails-value">{order.createdAt || '-'}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}

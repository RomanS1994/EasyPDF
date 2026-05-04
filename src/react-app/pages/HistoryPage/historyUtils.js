function parseDateValue(value) {
  if (!value) return null;

  const text = String(value).trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(text)
    ? `${text}T00:00:00`
    : /^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(text)
      ? text.replace(' ', 'T')
      : text;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function getDateKey(value) {
  const date = parseDateValue(value);

  if (!date) {
    return '';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
  const date = parseDateValue(value);

  if (!date) {
    return '-';
  }

  const datePart = date.toLocaleDateString('uk-UA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timePart = date.toLocaleTimeString('uk-UA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `${datePart}, ${timePart}`;
}

function getOrderTripTime(order) {
  return order?.contractData?.trip?.time || order?.trip?.time || '';
}

function getCustomerName(order) {
  return (
    order?.contractData?.customer?.name ||
    order?.customer?.name ||
    'Client not specified'
  );
}

function getTotalPrice(order) {
  return order?.contractData?.totalPrice || order?.totalPrice || 'No price';
}

function getRouteLabel(order) {
  const from =
    order?.contractData?.trip?.from?.address ||
    order?.trip?.from?.address ||
    order?.trip?.from ||
    '';
  const to =
    order?.contractData?.trip?.to?.address ||
    order?.trip?.to?.address ||
    order?.trip?.to ||
    '';

  if (!from || !to) {
    return 'Route not added';
  }

  return `${from} -> ${to}`;
}

function getHistoryBucket(order) {
  const todayKey = getDateKey(new Date());
  const tripKey = getDateKey(getOrderTripTime(order));
  const createdKey = getDateKey(order?.createdAt);
  const status = String(order?.status || '').toLowerCase();

  if (status.includes('fail')) {
    return {
      bucket: 'draft',
      label: 'Draft',
    };
  }

  const referenceKey = tripKey || createdKey;

  if (referenceKey) {
    if (referenceKey === todayKey) {
      return {
        bucket: 'today',
        label: 'Today',
      };
    }

    if (referenceKey > todayKey) {
      return {
        bucket: 'planned',
        label: 'Planned',
      };
    }

    return {
      bucket: 'completed',
      label: 'Completed',
    };
  }

  if (status === 'pdf_generated' || status === 'completed') {
    return {
      bucket: 'completed',
      label: 'Completed',
    };
  }

  return {
    bucket: 'draft',
    label: 'Draft',
  };
}

function getSortTimestamp(order, sortKey) {
  const primary = sortKey === 'trip-date' ? getOrderTripTime(order) : order?.createdAt;
  const fallback = sortKey === 'trip-date' ? order?.createdAt : getOrderTripTime(order);
  const primaryTime = parseDateValue(primary)?.getTime() || 0;

  if (primaryTime) {
    return primaryTime;
  }

  return parseDateValue(fallback)?.getTime() || 0;
}

function compareOrders(left, right, sortKey) {
  const leftTime = getSortTimestamp(left, sortKey);
  const rightTime = getSortTimestamp(right, sortKey);

  if (leftTime !== rightTime) {
    if (sortKey === 'newest') {
      return rightTime - leftTime;
    }

    return leftTime - rightTime;
  }

  return String(left?.orderNumber || '').localeCompare(String(right?.orderNumber || ''));
}

function getHistoryDateKey(order) {
  return getDateKey(getOrderTripTime(order) || order?.createdAt);
}

function buildTabCounts(orders) {
  const counts = {
    all: 0,
    today: 0,
    planned: 0,
    completed: 0,
  };

  for (const order of orders) {
    counts.all += 1;

    const bucket = getHistoryBucket(order).bucket;
    if (bucket === 'today') {
      counts.today += 1;
    }
    if (bucket === 'planned') {
      counts.planned += 1;
    }
    if (bucket === 'completed') {
      counts.completed += 1;
    }
  }

  return counts;
}

export {
  buildTabCounts,
  compareOrders,
  formatDateTime,
  getCustomerName,
  getHistoryBucket,
  getHistoryDateKey,
  getOrderTripTime,
  getRouteLabel,
  getTotalPrice,
};

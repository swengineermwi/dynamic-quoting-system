function formatCurrency(value, currency = 'ZMK') {
  const amount = Number(value || 0);

  if (currency === 'ZMK') {
    return `ZMK ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount)}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      currency,
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: 'currency',
    }).format(amount);
  } catch (error) {
    return `${currency} ${new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    }).format(amount)}`;
  }
}

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
  }).format(new Date(value));
}

function formatStatus(value) {
  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  const html = String(value || '');
  const replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return html.replace(/[&<>"']/g, (character) => replacements[character]);
}

function formatMultilineText(value) {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

module.exports = {
  escapeHtml,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatMultilineText,
  formatStatus,
};

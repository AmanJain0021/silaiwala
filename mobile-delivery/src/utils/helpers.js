// Port of shared/utils/helpers.js (converted with scripts/web2rn.js, then reviewed)
/**
 * Shared helper utilities for the delivery module
 */

/**
 * Format a number as Indian Rupee price
 * @param {number} amount
 * @returns {string}
 */
export const formatPrice = amount => {
  if (amount === null || amount === undefined) return '₹0';
  return `₹${Number(amount).toLocaleString('en-IN')}`;
};

/**
 * Format a date string to a readable format
 * @param {string|Date} date
 * @returns {string}
 */
export const formatDate = date => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

/**
 * Format time from date
 * @param {string|Date} date
 * @returns {string}
 */
export const formatTime = date => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Truncate a string
 * @param {string} str
 * @param {number} length
 * @returns {string}
 */
export const truncate = (str, length = 30) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};
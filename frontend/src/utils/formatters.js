/**
 * Utility functions for consistent formatting across the application
 * Addresses issues: #4 (time format), #6 (timestamp inconsistency), #91-93 (typography)
 */

/**
 * Format time duration in seconds to human-readable format
 * Addresses issue #4: Time format inconsistency
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string (e.g., "5 min 30 sec", "2 hr 15 min")
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return '0 sec';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hours > 0) parts.push(`${hours} hr${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) parts.push(`${minutes} min`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} sec`);
  
  return parts.join(' ');
};

/**
 * Format timestamp to relative time (e.g., "2 minutes ago", "1 hour ago")
 * Addresses issue #5: Vague "moments ago" text
 * @param {Date|string|number} timestamp - The timestamp to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return 'Never';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHr / 24);
  
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  if (diffMin === 1) return '1 minute ago';
  if (diffMin < 60) return `${diffMin} minutes ago`;
  if (diffHr === 1) return '1 hour ago';
  if (diffHr < 24) return `${diffHr} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // For older dates, show actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

/**
 * Format timestamp to absolute time with proper 24-hour format
 * Addresses issue #38: Time format inconsistency
 * @param {Date|string|number} timestamp - The timestamp to format
 * @param {boolean} includeSeconds - Whether to include seconds
 * @returns {string} Formatted time string in 24-hour format
 */
export const formatTime24 = (timestamp, includeSeconds = false) => {
  if (!timestamp) return '—';
  
  const date = new Date(timestamp);
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
    hour12: false
  };
  
  return date.toLocaleTimeString('en-GB', options);
};

/**
 * Format date and time together
 * @param {Date|string|number} timestamp - The timestamp to format
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (timestamp) => {
  if (!timestamp) return '—';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Truncate text with ellipsis
 * Addresses issue #1: Text truncation issues
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '…';
};

/**
 * Format email addresses (prevent truncation)
 * Addresses issue #21, #66: Email truncation
 * @param {string} email - Email address
 * @returns {string} Properly formatted email
 */
export const formatEmail = (email) => {
  if (!email) return '—';
  return email.toLowerCase().trim();
};

export const middleTruncate = (text, { lead = 5, tail = 5 } = {}) => {
  if (!text) return '';
  if (text.length <= lead + tail + 1) return text;
  return `${text.slice(0, lead)}…${text.slice(text.length - tail)}`;
};

export const formatEmailPreview = (email, maxLength = 28) => {
  const normalized = formatEmail(email);
  if (normalized === '—') return normalized;
  if (normalized.length <= maxLength) return normalized;

  const [local, domain] = normalized.split('@');
  if (!domain) {
    return middleTruncate(normalized, { lead: 6, tail: 6 });
  }

  const availableForLocal = Math.max(3, maxLength - domain.length - 2);
  return `${local.slice(0, availableForLocal)}…@${domain}`;
};

export const isValidSectionIdentifier = (value) => {
  if (value === null || value === undefined) return false;
  const trimmed = String(value).trim();
  if (!trimmed) return false;
  if (/^\d{4}$/.test(trimmed)) return false;
  return /^[A-Za-z0-9-_.]{1,12}$/.test(trimmed);
};

/**
 * Title case formatter
 * @param {string} text - Text to convert to title case
 * @returns {string} Title-cased text
 */
export const toTitleCase = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Format room numbers consistently
 * Addresses issue #78: Room numbering logic unclear
 * @param {string} roomNumber - Room number
 * @returns {object} Formatted room info with floor
 */
export const formatRoomNumber = (roomNumber) => {
  if (!roomNumber) return { display: '—', floor: null, type: null };
  
  const str = String(roomNumber);
  let floor = null;
  let type = 'Regular';
  
  // Check for special prefixes
  if (str.startsWith('L')) {
    type = 'Lab';
    const num = str.substring(1);
    floor = num ? Math.floor(parseInt(num) / 100) : null;
  } else if (str.startsWith('H')) {
    type = 'Hall';
    const num = str.substring(1);
    floor = num ? Math.floor(parseInt(num) / 100) : null;
  } else if (!isNaN(roomNumber)) {
    floor = Math.floor(parseInt(roomNumber) / 100);
  }
  
  return {
    display: str,
    floor: floor !== null ? `Floor ${floor}` : null,
    type
  };
};

/**
 * Validate and format capacity display
 * Addresses issue #77: Room capacity display
 * @param {number} capacity - Room capacity
 * @returns {string} Formatted capacity string
 */
export const formatCapacity = (capacity) => {
  if (!capacity || capacity <= 0) return 'No capacity info';
  return `${capacity} seats`;
};

/**
 * Format count with proper pluralization
 * @param {number} count - The count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form (optional, defaults to singular + 's')
 * @returns {string} Formatted count string
 */
export const formatCount = (count, singular, plural = null) => {
  const pluralForm = plural || `${singular}s`;
  return `${count} ${count === 1 ? singular : pluralForm}`;
};

/**
 * Remove emoji from text (for accessibility)
 * Addresses issue #104: Emoji accessibility
 * @param {string} text - Text with potential emojis
 * @returns {string} Text without emojis
 */
export const removeEmoji = (text) => {
  if (!text) return '';
  return text.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
};

const formatters = {
  formatDuration,
  formatRelativeTime,
  formatTime24,
  formatDateTime,
  truncateText,
  formatEmail,
  toTitleCase,
  formatRoomNumber,
  formatCapacity,
  formatCount,
  removeEmoji
};

export default formatters;

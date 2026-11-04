/**
 * Time and date formatting utilities for chat messages and conversation feeds.
 */

/**
 * Formats a timestamp into a friendly, localized 12-hour time for chat message bubbles.
 * Examples:
 *   - Today: "4:15 PM"
 *   - Yesterday: "Yesterday, 4:15 PM"
 *   - This year: "Nov 3, 4:15 PM"
 *   - Previous year: "11/04/25, 4:15 PM"
 */
export function formatMessageTime(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) {
    const now = new Date();
    return formatTimeOnly(now);
  }

  // If already formatted like "4:15 PM" or "10:30 AM", preserve it
  if (typeof dateOrIso === 'string' && /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i.test(dateOrIso.trim())) {
    return dateOrIso.trim();
  }

  const d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);

  if (isNaN(d.getTime())) {
    return formatTimeOnly(new Date());
  }

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  const timeString = formatTimeOnly(d);

  if (isToday) {
    return timeString;
  }

  if (isYesterday) {
    return `Yesterday, ${timeString}`;
  }

  const isSameYear = d.getFullYear() === now.getFullYear();
  if (isSameYear) {
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    return `${month} ${day}, ${timeString}`;
  }

  return `${d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}, ${timeString}`;
}

/**
 * Formats a conversation updated timestamp for inbox conversation cards.
 * Examples:
 *   - < 1 min: "Just now"
 *   - < 60 min: "12m ago"
 *   - Today: "4:15 PM"
 *   - Yesterday: "Yesterday"
 *   - Older: "Oct 28"
 */
export function formatConversationTime(dateOrIso?: string | Date | null): string {
  if (!dateOrIso) return 'Just now';

  // If already in short time format, return it
  if (typeof dateOrIso === 'string' && /^(0?[1-9]|1[0-2]):[0-5][0-9]\s*(AM|PM)$/i.test(dateOrIso.trim())) {
    return dateOrIso.trim();
  }

  const d = dateOrIso instanceof Date ? dateOrIso : new Date(dateOrIso);
  if (isNaN(d.getTime())) {
    return typeof dateOrIso === 'string' && dateOrIso !== 'Just now' ? dateOrIso : 'Just now';
  }

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);

  if (diffSec < 60) {
    return 'Just now';
  }

  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) {
    return formatTimeOnly(d);
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  const isSameYear = d.getFullYear() === now.getFullYear();
  if (isSameYear) {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
}

function formatTimeOnly(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}


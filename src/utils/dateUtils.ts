/**
 * Comprehensive Date & Time formatting utility for RSS & Atom Feeds
 */

export interface ArticleDateInfo {
  relative: string;
  formattedDate: string;
  formattedDateTime: string;
  iso: string;
  raw: string;
  timestamp: number;
}

/**
 * Safely parse any date string or timestamp from RSS / Atom feeds into a valid Date object.
 */
export function parseArticleDate(dateInput: string | number | undefined | null): Date {
  if (!dateInput) return new Date();

  if (typeof dateInput === 'number') {
    // If it looks like a unix timestamp in seconds, convert to ms
    if (dateInput < 10000000000) {
      return new Date(dateInput * 1000);
    }
    return new Date(dateInput);
  }

  const trimmed = dateInput.trim();

  // Try direct Date parsing first (handles ISO 8601 and standard RFC 822/2822)
  const directDate = new Date(trimmed);
  if (!isNaN(directDate.getTime())) {
    return directDate;
  }

  // Handle common edge cases in RSS feeds:
  // e.g., "2026-09-24 14:30:00", "24/09/2026", "24 Sep 2026 12:00:00"
  try {
    // Replace spaces between date and time with 'T' for ISO compliance
    const isoCandidate = trimmed.replace(' ', 'T');
    const isoDate = new Date(isoCandidate);
    if (!isNaN(isoDate.getTime())) return isoDate;

    // Handle DD/MM/YYYY or MM/DD/YYYY
    const slashParts = trimmed.split(/[/.-]/);
    if (slashParts.length === 3) {
      const year = slashParts[0].length === 4 ? slashParts[0] : slashParts[2];
      const month = slashParts[0].length === 4 ? slashParts[1] : slashParts[0];
      const day = slashParts[0].length === 4 ? slashParts[2] : slashParts[1];
      const d = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(d.getTime())) return d;
    }
  } catch (e) {
    // Fallback to now
  }

  return new Date();
}

/**
 * Compute human-friendly relative time (e.g. "Just now", "5m ago", "2h ago", "Yesterday", "3d ago", "Sep 24")
 */
export function getRelativeTime(date: Date): string {
  const now = Date.now();
  const time = date.getTime();
  const diffMs = now - time;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSec < 45) {
    return 'Just now';
  }
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks}w ago`;
  }

  // Format as short month + day, e.g. "Sep 24" (or include year if not current year)
  const isThisYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: isThisYear ? undefined : 'numeric',
  });
}

/**
 * Extracts complete formatted date and time information from an article's pubDate / timestamp.
 */
export function getArticleDateInfo(pubDate: string | undefined, timestamp?: number): ArticleDateInfo {
  const parsedDate = timestamp ? new Date(timestamp) : parseArticleDate(pubDate);

  const relative = getRelativeTime(parsedDate);

  const formattedDate = parsedDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedDateTime = parsedDate.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return {
    relative,
    formattedDate,
    formattedDateTime,
    iso: parsedDate.toISOString(),
    raw: pubDate || parsedDate.toISOString(),
    timestamp: parsedDate.getTime(),
  };
}

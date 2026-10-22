import { MatchItem } from '../types/sports';

/**
 * Filter and Phone Time Utility for SportPredict Pro
 * 
 * Rules requested by user:
 * 1. Exclude Sub-19, Sub-20, Sub-23, youth, juniors, primavera.
 * 2. Exclude all Women's matches (femenino, ladies, W, etc.).
 * 3. Exclude minor leagues (reservas, filiales, divisiones regionales, 3ª/4ª/5ª división).
 * 4. Sort all matches chronologically according to the user's mobile phone date & time.
 */

// Regex patterns for youth categories (Sub 19, Sub 20, Sub 23, etc.)
const YOUTH_PATTERNS = [
  /\b(?:sub[- ]?19|u[- ]?19|under[- ]?19)\b/i,
  /\b(?:sub[- ]?20|u[- ]?20|under[- ]?20)\b/i,
  /\b(?:sub[- ]?21|u[- ]?21|under[- ]?21)\b/i,
  /\b(?:sub[- ]?23|u[- ]?23|under[- ]?23)\b/i,
  /\b(?:sub[- ]?17|u[- ]?17|under[- ]?17)\b/i,
  /\b(?:sub[- ]?18|u[- ]?18|under[- ]?18)\b/i,
  /\b(?:juvenil(?:es)?|youth(?: league)?|juniors?|primavera)\b/i,
  /\btorneo sub[- ]?\d+\b/i,
  /\bpremier league 2\b/i, // Premier League 2 is the U21 reserve league
];

// Regex patterns for women's football / sports
const WOMEN_PATTERNS = [
  /\bwomen(?:'s)?\b/i,
  /\bwoman\b/i,
  /\bfemenin[oa]s?\b/i,
  /\bfemenil\b/i,
  /\bf[eé]minin\b/i,
  /\bladies\b/i,
  /\b\(w\)\b/i,
  /\b\(fem\)\b/i,
  /\bwfc\b/i,
  /\bw[- ]?league\b/i,
  /\bwsl\b/i,
  /\bliga f\b/i,
  /\bnwsl\b/i,
  /\buwcl\b/i,
  /\bchampions league women\b/i,
];

// Regex patterns for minor / reserve / amateur leagues
const MINOR_LEAGUE_PATTERNS = [
  /\breserv(?:as?|es?)\b/i,
  /\bfilial(?:es)?\b/i,
  /\b(?:3[ªa]|tercera)\s+(?:divisi[oó]n|rfef)\b/i,
  /\b(?:4[ªa]|cuarta)\s+(?:divisi[oó]n|rfef)\b/i,
  /\b(?:5[ªa]|quinta)\s+(?:divisi[oó]n|rfef)\b/i,
  /\b(?:liga )?regional(?:iga)?\b/i,
  /\boberliga\b/i,
  /\bnational league (?:north|south)\b/i,
  /\bliga amateur\b/i,
  /\bliga de desarrollo\b/i,
  /\bpromocional amateur\b/i,
  /\bstate league\b/i,
];

/**
 * Checks if a match belongs to youth, women or minor leagues
 */
export function isExcludedMatch(
  homeTeam: string = '',
  awayTeam: string = '',
  league: string = ''
): { excluded: boolean; reason?: 'youth' | 'women' | 'minor_league'; matchedTerm?: string } {
  const combinedText = `${homeTeam} ${awayTeam} ${league}`.toLowerCase();

  // 1. Youth check (Sub-19, Sub-20, Sub-23, etc.)
  for (const regex of YOUTH_PATTERNS) {
    const match = combinedText.match(regex);
    if (match) {
      return { excluded: true, reason: 'youth', matchedTerm: match[0] };
    }
  }

  // 2. Women's check
  for (const regex of WOMEN_PATTERNS) {
    const match = combinedText.match(regex);
    if (match) {
      return { excluded: true, reason: 'women', matchedTerm: match[0] };
    }
  }

  // 3. Minor leagues check
  for (const regex of MINOR_LEAGUE_PATTERNS) {
    const match = combinedText.match(regex);
    if (match) {
      return { excluded: true, reason: 'minor_league', matchedTerm: match[0] };
    }
  }

  return { excluded: false };
}

/**
 * Filters a list of matches, removing youth, women, and minor league fixtures.
 */
export function filterProfessionalMatches<T extends { homeTeam: string; awayTeam: string; league?: string }>(
  items: T[]
): { allowed: T[]; excludedCount: number; reasons: { youth: number; women: number; minor: number } } {
  const reasons = { youth: 0, women: 0, minor: 0 };
  const allowed: T[] = [];

  for (const item of items) {
    const check = isExcludedMatch(item.homeTeam, item.awayTeam, item.league || '');
    if (check.excluded) {
      if (check.reason === 'youth') reasons.youth++;
      else if (check.reason === 'women') reasons.women++;
      else if (check.reason === 'minor_league') reasons.minor++;
    } else {
      allowed.push(item);
    }
  }

  return {
    allowed,
    excludedCount: items.length - allowed.length,
    reasons,
  };
}

/**
 * Detects the user's mobile/browser timezone and locale
 */
export function getUserDeviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Hora Local';
  } catch {
    return 'Hora Local';
  }
}

/**
 * Parses any match time string or isoDate into an accurate numeric timestamp.
 * Respects today, tomorrow, or ISO format.
 */
export function getMatchTimestamp(match: { startTime?: string; isoDate?: string; time?: string }): number {
  if (match.isoDate) {
    const t = new Date(match.isoDate).getTime();
    if (!isNaN(t)) return t;
  }

  const rawTimeStr = (match.startTime || match.time || '').trim();

  // Try standard Date parse
  const directDate = new Date(rawTimeStr).getTime();
  if (!isNaN(directDate) && directDate > 1000000000) {
    return directDate;
  }

  // Parse strings like "Hoy · 21:00 CET", "18:30", "Mañana · 03:00 CET"
  const now = new Date();
  const lower = rawTimeStr.toLowerCase();

  let targetDayOffset = 0;
  if (lower.includes('mañana') || lower.includes('tomorrow')) {
    targetDayOffset = 1;
  } else if (lower.includes('ayer') || lower.includes('yesterday')) {
    targetDayOffset = -1;
  }

  // Extract HH:MM
  const timeMatch = rawTimeStr.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + targetDayOffset, hours, minutes, 0);
    return d.getTime();
  }

  // Fallback to now + random stable offset based on id if available
  return now.getTime();
}

/**
 * Formats a match date & time in the user's mobile device local timezone
 */
export function formatMatchPhoneTime(match: { startTime?: string; isoDate?: string; time?: string }): {
  timeStr: string;
  dateStr: string;
  badgeLabel: string;
  userTimeZone: string;
} {
  const ts = getMatchTimestamp(match);
  const matchDate = new Date(ts);
  const now = new Date();

  const userTimeZone = getUserDeviceTimezone();

  // Format hour:minute in user's mobile format
  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const timeStr = timeFormatter.format(matchDate);

  // Check if today or tomorrow
  const isSameDay =
    matchDate.getDate() === now.getDate() &&
    matchDate.getMonth() === now.getMonth() &&
    matchDate.getFullYear() === now.getFullYear();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    matchDate.getDate() === tomorrow.getDate() &&
    matchDate.getMonth() === tomorrow.getMonth() &&
    matchDate.getFullYear() === tomorrow.getFullYear();

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
  });
  const dateStr = dateFormatter.format(matchDate);

  let badgeLabel = `${dateStr} · ${timeStr}`;
  if (isSameDay) {
    badgeLabel = `Hoy · ${timeStr}`;
  } else if (isTomorrow) {
    badgeLabel = `Mañana · ${timeStr}`;
  }

  return {
    timeStr,
    dateStr,
    badgeLabel,
    userTimeZone,
  };
}

/**
 * Sorts matches chronologically by the user's mobile phone date & time.
 * Live matches always stay first, then upcoming by start time (earliest to latest).
 */
export function sortMatchesByPhoneDateTime<T extends { startTime?: string; isoDate?: string; status?: string; time?: string }>(
  matches: T[]
): T[] {
  return [...matches].sort((a, b) => {
    // 1. Live matches first
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;

    // 2. Chronological start time (earliest to latest)
    const timeA = getMatchTimestamp(a);
    const timeB = getMatchTimestamp(b);
    return timeA - timeB;
  });
}

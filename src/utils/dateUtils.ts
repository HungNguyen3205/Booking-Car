/**
 * Date and time utilities configured for Vietnam Standard Time (Asia/Ho_Chi_Minh - UTC+7)
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Returns today's date formatted as YYYY-MM-DD in Asia/Ho_Chi_Minh timezone
 */
export const getVietnamTodayDateStr = (): string => {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: VIETNAM_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Outputs YYYY-MM-DD
  } catch {
    // Robust fallback if Intl timezone is unsupported
    const now = new Date();
    // UTC + 7 hours
    const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().split('T')[0];
  }
};

/**
 * Validates whether a date string is in YYYY-MM-DD format and is not in the past (Vietnam time)
 */
export const isCalendarDate = (value?: string | null): value is string => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const isValidBookingDate = (dateStr?: string | null): boolean => {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!isCalendarDate(dateStr)) return false;

  const todayStr = getVietnamTodayDateStr();
  return dateStr >= todayStr;
};

/**
 * Formats YYYY-MM-DD to DD/MM/YYYY for user-friendly display in Vietnam
 */
export const formatVietnamDate = (isoStr?: string | null): string => {
  if (!isCalendarDate(isoStr)) return '';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
};

/**
 * Parses duration string (e.g., '2h30m', '45m', '6h') into total number of minutes
 */
export const parseDurationMinutes = (durationStr?: string | null): number => {
  if (!durationStr || typeof durationStr !== 'string') return 0;
  let total = 0;
  const hMatch = durationStr.match(/(\d+)\s*h/i);
  const mMatch = durationStr.match(/(\d+)\s*m/i);
  if (hMatch) total += parseInt(hMatch[1], 10) * 60;
  if (mMatch) total += parseInt(mMatch[1], 10);
  return total;
};

/**
 * Adds or subtracts days from a YYYY-MM-DD date string
 */
export const addDaysToDateStr = (dateStr: string, days: number): string => {
  try {
    if (!isCalendarDate(dateStr) || !Number.isInteger(days)) return dateStr;
    const date = new Date(`${dateStr}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + days);
    const ny = date.getUTCFullYear();
    const nm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const nd = String(date.getUTCDate()).padStart(2, '0');
    return `${ny}-${nm}-${nd}`;
  } catch {
    return dateStr;
  }
};


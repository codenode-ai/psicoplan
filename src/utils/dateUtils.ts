
import { format, startOfDay, endOfDay } from 'date-fns';

/**
 * Converts a datetime-local input value to UTC ISO string for database storage
 * This ensures the user's local time is correctly stored as UTC
 */
export function localDateTimeToUTC(localDateTimeString: string): string {
  const localDate = new Date(localDateTimeString);
  return localDate.toISOString();
}

/**
 * Converts a UTC date string from database to datetime-local format for form inputs
 * This ensures the UTC time is displayed as the correct local time in forms
 */
export function utcToLocalDateTime(utcDateString: string): string {
  const utcDate = new Date(utcDateString);
  // Get local time and format for datetime-local input
  const localTime = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 16);
}

/**
 * Creates start and end of day in local timezone, then converts to UTC
 * This ensures date range queries work correctly regardless of timezone
 */
export function getLocalDayRange(date: Date): { start: string; end: string } {
  const localStartOfDay = startOfDay(date);
  const localEndOfDay = endOfDay(date);
  
  return {
    start: localStartOfDay.toISOString(),
    end: localEndOfDay.toISOString()
  };
}

/**
 * Formats a date for display in Brazilian format
 */
export function formatDateBR(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy');
}

/**
 * Formats a datetime for display in Brazilian format
 */
export function formatDateTimeBR(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd/MM/yyyy HH:mm');
}

/**
 * Formats time for display in Brazilian format
 */
export function formatTimeBR(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'HH:mm');
}

/**
 * Date and time helper utilities for the application.
 */

/**
 * Formats a Date object or ISO date string into YYYY-MM-DDTHH:mm format
 * compatible with HTML `<input type="datetime-local" />`, using the client's local timezone.
 */
export function formatToDateTimeLocal(dateInput?: Date | string | null): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";

  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Returns the start of the week for a given date.
 * Default starts on Monday (1).
 */
export function startOfWeek(date: Date, weekStartsOn: 0 | 1 = 1): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Adds or subtracts days from a Date object.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Checks if two dates refer to the same calendar day.
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Checks if two dates fall into the same month and year.
 */
export function isSameMonth(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
}

/**
 * Generates the full 7-column grid of days for a given month,
 * including leading days from the previous month and trailing days from the next month.
 */
export function getMonthGrid(year: number, month: number, weekStartsOn: 0 | 1 = 1): Date[] {
  const firstDayOfMonth = new Date(year, month, 1);
  const startDate = startOfWeek(firstDayOfMonth, weekStartsOn);
  const days: Date[] = [];
  let current = new Date(startDate);

  // Generate 35 or 42 days to ensure complete calendar rows
  while (days.length < 35 || current.getMonth() === month || days.length % 7 !== 0) {
    days.push(new Date(current));
    current = addDays(current, 1);
    if (days.length >= 42) break;
  }

  return days;
}


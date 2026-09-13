/**
 * Timezone utility module for Cleaning Management.
 * Handles Australian timezones, date boundaries, and formatting.
 */

export const DEFAULT_TIMEZONE = "Australia/Perth";

export const AUSTRALIAN_TIMEZONES = [
  { value: "Australia/Perth", label: "Perth (AWST, UTC+8)" },
  { value: "Australia/Adelaide", label: "Adelaide (ACST/ACDT, UTC+9:30/+10:30)" },
  { value: "Australia/Darwin", label: "Darwin (ACST, UTC+9:30)" },
  { value: "Australia/Brisbane", label: "Brisbane (AEST, UTC+10)" },
  { value: "Australia/Sydney", label: "Sydney / Canberra (AEST/AEDT, UTC+10/+11)" },
  { value: "Australia/Melbourne", label: "Melbourne (AEST/AEDT, UTC+10/+11)" },
  { value: "Australia/Hobart", label: "Hobart (AEST/AEDT, UTC+10/+11)" },
] as const;

/**
 * Validates whether an IANA timezone identifier is supported by the runtime.
 */
export function isValidTimezone(tz?: string | null): boolean {
  if (!tz || typeof tz !== "string") return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves the effective timezone, falling back to Australia/Perth if invalid or missing.
 */
export function resolveTimezone(tz?: string | null): string {
  if (tz && isValidTimezone(tz)) {
    return tz;
  }
  return DEFAULT_TIMEZONE;
}

/**
 * Calculates the millisecond offset between the target timezone and UTC for a given date.
 * Positive offset means ahead of UTC (e.g. Perth +8 hours -> +28800000 ms).
 */
export function getTimezoneOffsetMs(date: Date, timeZone: string): number {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
  return tzDate.getTime() - utcDate.getTime();
}

/**
 * Returns the exact UTC Date objects corresponding to the start (00:00:00.000)
 * and end (23:59:59.999) of the calendar day in the given timezone.
 */
export function getZonedDayBounds(
  date: Date,
  timeZoneInput?: string | null,
): { startOfDay: Date; endOfDay: Date; dateStr: string } {
  const timeZone = resolveTimezone(timeZoneInput);

  // Extract YYYY-MM-DD in the target timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const dateStr = formatter.format(date); // e.g. "2026-09-12"
  const [year, month, day] = dateStr.split("-").map(Number);

  // UTC midnight for that calendar date
  const utcMidnight = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

  // Determine the timezone offset and refine
  const offset = getTimezoneOffsetMs(utcMidnight, timeZone);
  const startOfDay = new Date(utcMidnight.getTime() - offset);
  const refinedOffset = getTimezoneOffsetMs(startOfDay, timeZone);
  const startOfDayRefined = new Date(utcMidnight.getTime() - refinedOffset);

  // End of day is 23:59:59.999 in that timezone
  const endOfDay = new Date(startOfDayRefined.getTime() + 24 * 60 * 60 * 1000 - 1);

  return {
    dateStr,
    startOfDay: startOfDayRefined,
    endOfDay,
  };
}

/**
 * Returns the start (Monday 00:00:00.000) and end (Sunday 23:59:59.999) of the week
 * in the given timezone (ISO/Australian standard: Monday start).
 */
export function getZonedWeekBounds(
  date: Date,
  timeZoneInput?: string | null,
  weekStartsOn: 0 | 1 = 1,
): { startOfWeek: Date; endOfWeek: Date } {
  const timeZone = resolveTimezone(timeZoneInput);
  const { startOfDay } = getZonedDayBounds(date, timeZone);

  // Day of week in the target timezone (0 = Sunday, 1 = Monday, ...)
  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" });
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const weekdayShort = dayFormatter.format(startOfDay);
  const dayOfWeek = weekdayMap[weekdayShort] ?? 0;

  const diffToStart = (dayOfWeek - weekStartsOn + 7) % 7;
  const startOfWeek = new Date(startOfDay.getTime() - diffToStart * 24 * 60 * 60 * 1000);
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  return { startOfWeek, endOfWeek };
}

/**
 * Returns the start (1st of month 00:00:00.000) and end (last day 23:59:59.999) of the month
 * in the given timezone.
 */
export function getZonedMonthBounds(
  date: Date,
  timeZoneInput?: string | null,
): { startOfMonth: Date; endOfMonth: Date } {
  const timeZone = resolveTimezone(timeZoneInput);

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  });
  const monthStr = formatter.format(date); // e.g. "2026-09"
  const [year, month] = monthStr.split("-").map(Number);

  const firstDayDate = new Date(Date.UTC(year, month - 1, 1, 12, 0, 0));
  const { startOfDay: startOfMonth } = getZonedDayBounds(firstDayDate, timeZone);

  // Day 0 of month + 1 gives the last day of target month
  const daysInMonth = new Date(year, month, 0).getDate();
  const lastDayDate = new Date(Date.UTC(year, month - 1, daysInMonth, 12, 0, 0));
  const { endOfDay: endOfMonth } = getZonedDayBounds(lastDayDate, timeZone);

  return { startOfMonth, endOfMonth };
}

/**
 * Determines whether dateB is exactly the calendar day after dateA in the given timezone.
 */
export function isTomorrowInTimezone(
  dateA: Date,
  dateB: Date,
  timeZoneInput?: string | null,
): boolean {
  const timeZone = resolveTimezone(timeZoneInput);
  const boundsA = getZonedDayBounds(dateA, timeZone);
  const nextDay = new Date(boundsA.startOfDay.getTime() + 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000);
  const boundsNext = getZonedDayBounds(nextDay, timeZone);
  const boundsB = getZonedDayBounds(dateB, timeZone);

  return boundsNext.dateStr === boundsB.dateStr;
}

/**
 * Formats a date using Australian English conventions in the specified timezone.
 */
export function formatInTimezone(
  dateInput: Date | string | null | undefined,
  timeZoneInput?: string | null,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!dateInput) return "";
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "";

  const timeZone = resolveTimezone(timeZoneInput);
  return d.toLocaleString("en-AU", {
    timeZone,
    ...options,
  });
}

/**
 * Formats time (e.g. "08:00" or "08:30") in the specified timezone.
 */
export function formatTimeInTimezone(
  dateInput: Date | string | null | undefined,
  timeZoneInput?: string | null,
  options: Intl.DateTimeFormatOptions = { hour: "2-digit", minute: "2-digit" },
): string {
  return formatInTimezone(dateInput, timeZoneInput, options);
}

/**
 * Returns greeting ("Good morning", "Good afternoon", "Good evening") based on current hour in the timezone.
 */
export function getGreetingInTimezone(
  date: Date = new Date(),
  timeZoneInput?: string | null,
): "Good morning" | "Good afternoon" | "Good evening" {
  const timeZone = resolveTimezone(timeZoneInput);
  const hourFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  });
  const hour = parseInt(hourFormatter.format(date), 10);

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
